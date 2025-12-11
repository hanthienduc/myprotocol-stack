# Supabase + Stripe Sync Patterns Research

## 1. Database Schema Design

### Core Tables Structure
```sql
-- Users table (extended with Stripe reference)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table (Stripe as source of truth)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, past_due, canceled, unpaid, incomplete
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook events (idempotency tracking)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  payload JSONB,
  error_details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products/Prices (synced from Stripe)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL,
  interval TEXT, -- month, year
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Key Design Decisions
- Store `stripe_customer_id` and `stripe_subscription_id` as denormalized fields for fast lookups during webhook processing
- Webhook event tracking prevents duplicate processing (idempotency)
- `subscription.status` mirrors Stripe's lifecycle states exactly
- Metadata fields (JSONB) provide flexibility for Stripe data changes

---

## 2. Sync Architecture: Webhook-Driven Pattern

### Event Flow
```
Stripe Event → Webhook Endpoint (Edge Function)
    ↓
Verify Signature (using STRIPE_WEBHOOK_SECRET)
    ↓
Check webhook_events table for idempotency
    ↓
If new event: Insert into webhook_events (status='processing')
    ↓
Update subscriptions/users based on event type
    ↓
Mark webhook_events as 'completed' or 'failed'
```

### Stripe Event Types to Handle
| Event | Action |
|-------|--------|
| `customer.created` | Create user mapping to Stripe customer |
| `customer.subscription.created` | Insert subscription record |
| `customer.subscription.updated` | Update subscription status, period dates |
| `customer.subscription.deleted` | Mark subscription as canceled |
| `invoice.payment_succeeded` | Update subscription status to active |
| `invoice.payment_failed` | Set status to past_due |

### Implementation Pattern (Edge Function)
```typescript
// 1. Verify signature
const event = stripe.webhooks.constructEventAsync(
  rawBody,
  signature,
  STRIPE_WEBHOOK_SECRET
);

// 2. Check idempotency
const existing = await supabase
  .from('webhook_events')
  .select('*')
  .eq('stripe_event_id', event.id)
  .single();

if (existing?.data) {
  return event.status === 'completed' ? 200 : 503; // retry if failed
}

// 3. Insert as processing
await supabase
  .from('webhook_events')
  .insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: 'processing',
    payload: event.data
  });

// 4. Process based on type
switch (event.type) {
  case 'customer.subscription.updated':
    await updateSubscription(event.data.object);
    break;
  // ... other handlers
}

// 5. Mark complete
await supabase
  .from('webhook_events')
  .update({ status: 'completed' })
  .eq('stripe_event_id', event.id);
```

### Avoiding Duplication
- **One stripe_customer_id per user**: Enforce unique constraint
- **Upsert pattern for products**: Use `ON CONFLICT` clauses
- **Event idempotency**: Skip re-processing same stripe_event_id
- **Timestamps**: Track `updated_at` to detect stale updates

---

## 3. Feature Gating Approaches

### Server-Side (Recommended)
```typescript
// Server Component or Server Action
export async function getPremiumData() {
  const user = await getUser(); // via Supabase auth

  // Direct database check (fastest)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!sub) {
    return notFound(); // or redirect to pricing
  }

  return fetchPremiumContent();
}
```

### Middleware-Level Gating
```typescript
// middleware.ts - for route-wide protection
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const user = await getUser();

  // Check subscription in middleware cache/JWT claims
  if (request.nextUrl.pathname.startsWith('/premium')) {
    const sub = await checkSubscription(user.id);
    if (!sub?.active) {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/premium/:path*', '/dashboard/:path*']
};
```

### Component-Level Gating
```typescript
// Use server component wrapper
export async function PremiumContent() {
  const sub = await getActiveSubscription();

  return sub?.status === 'active' ? (
    <YourPremiumFeature />
  ) : (
    <UpgradePrompt />
  );
}
```

### Performance Consideration
- **Best**: Cache subscription status in JWT claims or session (checked in middleware)
- **Good**: Server Component query with Supabase (fast with indexes)
- **Avoid**: Client-side gating only (insecure, requires separate API call)

---

## 4. RLS Policies for Subscriptions

### Enable RLS on Sensitive Tables
```sql
-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Users can't update subscriptions (webhook only)
CREATE POLICY "Subscriptions read-only for users"
  ON subscriptions
  FOR UPDATE, DELETE
  USING (FALSE); -- Stripe webhook uses service role

-- Service role (webhook) can insert/update
CREATE POLICY "Service role manages subscriptions"
  ON subscriptions
  FOR INSERT, UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Webhook events hidden from users
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only service role can access webhook events"
  ON webhook_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Webhook Handler with Service Role
```typescript
// Use service_role client for webhook processing
const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY // Has bypass for RLS
);

// Webhook handler can update subscriptions
await serviceRoleClient
  .from('subscriptions')
  .upsert({
    user_id: userId,
    stripe_subscription_id: subId,
    status: 'active'
  });
```

---

## 5. Common Pitfalls & Solutions

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **Race condition on webhook retry** | Same event processed twice | Track stripe_event_id in webhook_events, check before processing |
| **Webhook timeout** | Long-running operations | Keep Edge Function <1.5s; queue heavy jobs to background worker |
| **Test vs Live mode data mix** | Not filtering by mode | Store `livemode` boolean in webhook_events; process separately |
| **Broken user-subscription mapping** | Deleting customer before user | Use ON DELETE CASCADE; maintain referential integrity |
| **Stale subscription status** | Client caching old status | Revalidate on demand; use server components for auth-sensitive data |
| **Service role key exposed** | Committing to git | Use Supabase Edge Function secrets; never expose in client JS |
| **Webhook signature validation skipped** | "Shortcut" for local testing | Always verify; mock signature in tests, never in production |

---

## Sources

- [Handling Stripe Webhooks - Supabase Docs](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)
- [GitHub - supabase/stripe-sync-engine](https://github.com/supabase/stripe-sync-engine)
- [Stripe Sync Engine as Standalone Library](https://supabase.com/blog/stripe-engine-as-sync-library)
- [Supabase Stripe Integration Guide](https://supabase.com/docs/guides/database/extensions/wrappers/stripe)
- [Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Webhook Idempotency Best Practices](https://dev.to/aniefon_umanah_ac5f21311c/building-reliable-stripe-subscriptions-in-nestjs-webhook-idempotency-and-optimistic-locking-3o91)
- [Next.js Middleware Guide - Contentful](https://www.contentful.com/blog/next-js-middleware/)
- [Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
