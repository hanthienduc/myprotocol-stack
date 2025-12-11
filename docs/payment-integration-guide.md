# Payment Integration Guide - Stripe

**Last Updated**: 2025-12-11
**Phase**: Phase 3 Monetization
**Status**: Complete

## Overview

MyProtocolStack uses Stripe for subscription management and payment processing. This guide covers the implementation, configuration, and operation of the payment system.

## Architecture

```
┌─────────────┐
│   Client    │
│ (Next.js)   │
└──────┬──────┘
       │
       ├─ Pricing Modal (pricing-modal.tsx)
       │   └─ Shows $12/mo, $99/yr pricing
       │   └─ Triggers createCheckoutSession()
       │
       └─ Subscription Card (subscription-card.tsx)
           └─ Displays tier + renewal date

            │
            ▼

┌──────────────────────┐
│  Server Layer        │
│  (apps/web/)         │
└──────┬───────────────┘
       │
       ├─ lib/stripe.ts (Stripe client)
       ├─ lib/subscription.ts (Feature gating)
       ├─ actions/subscription.ts (Server actions)
       └─ api/webhooks/stripe/ (Webhook handler)

            │
            ▼

┌──────────────────────┐
│ Stripe Service       │
│ (External)           │
└──────┬───────────────┘
       │
       ├─ Checkout Sessions
       ├─ Subscriptions (monthly/annual)
       ├─ Customers
       └─ Webhooks (signed events)

            │
            ▼

┌──────────────────────┐
│ Database             │
│ (Supabase)           │
└──────────────────────┘
       │
       ├─ profiles.stripe_customer_id
       ├─ subscriptions table
       └─ webhook_events table (idempotency)
```

## Configuration

### Environment Variables

Set these in your `.env.local` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_...          # Live secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Prices (from Stripe Dashboard)
STRIPE_PRICE_MONTHLY=price_1...        # $12/mo price ID
STRIPE_PRICE_ANNUAL=price_2...         # $99/yr price ID

# App URLs
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Stripe Setup

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Go to Products & Pricing section
3. Create two price objects:
   - Monthly: $12/month, recurring monthly
   - Annual: $99/year, recurring yearly
4. Copy price IDs and add to env vars

### Webhook Configuration

1. Go to Developers > Webhooks in Stripe Dashboard
2. Add endpoint: `https://yourapp.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret and add to env

## Implementation

### Core Files

#### lib/stripe.ts
Initializes Stripe client and provides utilities.

```typescript
import Stripe from "stripe";

// Initialize with API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",  // Latest stable version
  typescript: true,
});

// Price mapping
export const STRIPE_PRICES = {
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY!,
  ANNUAL: process.env.STRIPE_PRICE_ANNUAL!,
} as const;

// Utilities
export function getPlanFromPriceId(priceId: string): "pro" | "free" {
  if (priceId === STRIPE_PRICES.MONTHLY || priceId === STRIPE_PRICES.ANNUAL) {
    return "pro";
  }
  return "free";
}

export function isActiveSubscription(status: string): boolean {
  return ["active", "trialing"].includes(status);
}
```

#### lib/subscription.ts
Feature gating logic based on tier.

```typescript
// Free tier limitations
export const FREE_LIMITS = {
  maxStacks: 3,
  maxProtocolsPerStack: 10,
  historyDays: 7,
  advancedAnalytics: false,
  aiRecommendations: false,
  wearableSync: false,
} as const;

// Pro tier features (unlimited)
export const PRO_FEATURES = {
  maxStacks: Infinity,
  maxProtocolsPerStack: Infinity,
  historyDays: Infinity,
  advancedAnalytics: true,
  aiRecommendations: true,
  wearableSync: true,
} as const;

// Check tier
export async function getUserTier(): Promise<SubscriptionTier> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return "free";

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  return (profile?.subscription_tier as SubscriptionTier) || "free";
}

// Feature gate helpers
export async function canCreateStack(): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, current: 0, limit: 0 };

  const tier = await getUserTier();
  const limit = tier === "pro" ? PRO_FEATURES.maxStacks : FREE_LIMITS.maxStacks;

  const { count } = await supabase
    .from("stacks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return { allowed: (count || 0) < limit, current: count || 0, limit };
}
```

#### actions/subscription.ts
Server actions for subscription management.

```typescript
'use server'

import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { createClient } from "@myprotocolstack/database/server";

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Get or create Stripe customer
  let stripeCustomerId = await getStripeCustomerId(user.id);

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;

    // Save to profiles
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", user.id);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return session.url;
}

async function getStripeCustomerId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  return data?.stripe_customer_id || null;
}
```

#### app/api/webhooks/stripe/route.ts
Webhook handler with signature verification and idempotency.

```typescript
import { stripe } from "@/lib/stripe";
import { createClient } from "@myprotocolstack/database/server";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  const supabase = await createClient();

  // Check idempotency
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single();

  if (existing) {
    return new Response("OK", { status: 200 }); // Already processed
  }

  try {
    // Process events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(event.data.object, supabase);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object, supabase);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDelete(event.data.object, supabase);
        break;
    }

    // Mark as completed
    await supabase
      .from("webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        status: "completed",
        payload: event.data,
      });
  } catch (err) {
    // Mark as failed
    await supabase
      .from("webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        status: "failed",
        payload: event.data,
        error_details: String(err),
      });

    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

async function handleCheckoutComplete(session: any, supabase: any) {
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription
  );

  // Get user from customer metadata
  const customer = await stripe.customers.retrieve(session.customer);
  const userId = customer.metadata?.userId;

  if (!userId) throw new Error("No userId in customer metadata");

  // Create subscription record
  await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: session.customer,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    });

  // Update profile tier
  await supabase
    .from("profiles")
    .update({ subscription_tier: "pro" })
    .eq("id", userId);
}

async function handleSubscriptionUpdate(subscription: any, supabase: any) {
  const userId = subscription.metadata?.userId;

  // Update subscription record
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);

  // Update profile tier if canceled
  if (subscription.status === "canceled") {
    await supabase
      .from("profiles")
      .update({ subscription_tier: "free" })
      .eq("id", userId);
  }
}

async function handleSubscriptionDelete(subscription: any, supabase: any) {
  const userId = subscription.metadata?.userId;

  // Delete subscription record
  await supabase
    .from("subscriptions")
    .delete()
    .eq("stripe_subscription_id", subscription.id);

  // Downgrade to free
  await supabase
    .from("profiles")
    .update({ subscription_tier: "free" })
    .eq("id", userId);
}
```

### UI Components

#### components/subscription/pricing-modal.tsx
Shows pricing and triggers checkout.

```typescript
import { createCheckoutSession } from "@/actions/subscription";

export function PricingModal() {
  const handleUpgrade = async (priceId: string) => {
    const checkoutUrl = await createCheckoutSession(priceId);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 border rounded">
        <h3>Pro Monthly</h3>
        <p className="text-2xl font-bold">$12<span className="text-sm">/mo</span></p>
        <button
          onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!)}
          className="w-full mt-4 btn btn-primary"
        >
          Subscribe
        </button>
      </div>

      <div className="p-4 border rounded">
        <h3>Pro Annual</h3>
        <p className="text-2xl font-bold">$99<span className="text-sm">/yr</span></p>
        <button
          onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!)}
          className="w-full mt-4 btn btn-primary"
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}
```

#### components/subscription/subscription-card.tsx
Displays current subscription status.

```typescript
import { getUserTier } from "@/lib/subscription";

export async function SubscriptionCard() {
  const tier = await getUserTier();

  if (tier === "pro") {
    return (
      <div className="p-4 border rounded bg-blue-50">
        <h3>Pro Subscriber</h3>
        <p>Your Pro subscription is active</p>
        <button className="mt-4">Manage Subscription</button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h3>Upgrade to Pro</h3>
      <p>Get unlimited stacks and advanced features</p>
      <button className="mt-4 btn btn-primary">Upgrade Now</button>
    </div>
  );
}
```

## Database Schema

### profiles table
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
```

### subscriptions table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, past_due, canceled, unpaid, incomplete, trialing
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### webhook_events table (idempotency)
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  payload JSONB,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- No policy = service role only
```

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 stacks, 7-day history, basic tracking |
| Pro Monthly | $12/mo | Unlimited stacks, full analytics, AI recommendations |
| Pro Annual | $99/yr | Same as monthly (20% discount) |

## Feature Gating

Use `lib/subscription.ts` helpers in server actions:

```typescript
// Check if user can create stack
const { allowed, current, limit } = await canCreateStack();
if (!allowed) {
  return { error: `Stack limit reached (${current}/${limit})` };
}

// Require Pro tier
try {
  await requirePro();
} catch (err) {
  return { error: "This feature requires a Pro subscription" };
}

// Access advanced features
const hasAdvanced = await hasAdvancedAnalytics();
if (hasAdvanced) {
  // Show advanced analytics
}
```

## Webhook Events

Stripe sends these events to `/api/webhooks/stripe`:

| Event | Trigger | Action |
|-------|---------|--------|
| `checkout.session.completed` | User completes payment | Create subscription, upgrade to Pro |
| `customer.subscription.updated` | Renewal, status change | Update subscription record |
| `customer.subscription.deleted` | Cancellation | Delete subscription, downgrade to Free |

## Testing

### Local Development

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Authenticate: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Use test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### Test Subscriptions

```bash
# Create test customer
stripe customers create --email test@example.com

# Create subscription
stripe subscriptions create \
  --customer cus_xxxxx \
  --items price_xxxxx

# Simulate webhook
stripe trigger customer.subscription.updated
```

## Troubleshooting

### Webhook Not Firing
- Check webhook URL in Stripe Dashboard
- Verify webhook secret in env vars
- Check Stripe logs in Dashboard
- Ensure webhook_events table exists

### Subscription Not Updating
- Check profiles.stripe_customer_id is set
- Verify subscriptions table exists
- Check RLS policies allow updates
- Review webhook_events table for errors

### Users Not Getting Pro Access
- Verify profiles.subscription_tier is set to 'pro'
- Check subscription.status is 'active'
- Ensure getUserTier() is being called
- Test with `isPro()` helper

## Security Considerations

1. **Webhook Verification**: Always verify webhook signature
2. **Idempotency**: Use webhook_events table to prevent duplicate processing
3. **PCI Compliance**: Never store card data (Stripe handles this)
4. **API Keys**: Never commit secret keys to version control
5. **RLS**: Restrict subscription table access via Row Level Security

## References

- [Stripe Billing Docs](https://stripe.com/docs/billing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
- [Stripe Test Data](https://stripe.com/docs/testing)

---

**Maintained By**: MyProtocolStack Team
**Last Review**: 2025-12-11
