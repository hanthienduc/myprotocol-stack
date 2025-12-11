# Phase 02: Database Schema

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 01 (Stripe IDs needed)
- **Docs**: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Overview
| Field | Value |
|-------|-------|
| Date | 251211 |
| Description | Create subscriptions and webhook_events tables, extend profiles |
| Priority | P0 |
| Implementation Status | DONE |
| Review Status | Draft |

## Key Insights
- Stripe is source of truth; DB mirrors Stripe state
- `webhook_events` table enables idempotent processing
- `subscriptions` table stores active subscription details
- profiles.subscription_tier already exists; add stripe_customer_id

## Requirements
1. Add `stripe_customer_id` to profiles table
2. Create `subscriptions` table mirroring Stripe state
3. Create `webhook_events` table for idempotency
4. Configure RLS: users read-only, service role write
5. Create service-role function for webhook updates

## Architecture

### ERD
```
profiles                    subscriptions              webhook_events
--------                    -------------              --------------
id (PK)                     id (PK)                    id (PK)
email                       user_id (FK->profiles)     stripe_event_id (UNIQUE)
stripe_customer_id (NEW)    stripe_subscription_id     event_type
subscription_tier           stripe_customer_id         status
...                         status                     payload (JSONB)
                            price_id                   error_details
                            current_period_start       created_at
                            current_period_end
                            cancel_at_period_end
                            canceled_at
                            created_at
                            updated_at
```

### Data Flow
```
Stripe Event -> Webhook Handler -> Check webhook_events
                                    |
                                    v (if new)
                              Insert webhook_events (processing)
                                    |
                                    v
                              Upsert subscriptions
                                    |
                                    v
                              Update profiles.subscription_tier
                                    |
                                    v
                              Mark webhook_events (completed)
```

## Related Code Files
### Create
- `supabase/migrations/YYYYMMDD_stripe_subscriptions.sql`

### Modify
- `packages/database/src/types.ts` (add new types)

## Implementation Steps

### Step 1: Create Migration File

Create `supabase/migrations/20251211_stripe_subscriptions.sql`:

```sql
-- Add stripe_customer_id to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create index for customer lookup
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON profiles(stripe_customer_id);

-- Subscriptions table (mirrors Stripe subscription state)
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Webhook events table (idempotency tracking)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  payload JSONB,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for event lookup
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);

-- Trigger for subscriptions.updated_at
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
```

### Step 2: RLS Policies

```sql
-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can read their own (no write - webhook only)
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Webhook events: No user access (service role only)
-- No policy = deny by default, service role bypasses RLS

-- Service role has full access via SUPABASE_SERVICE_ROLE_KEY
-- (bypasses RLS automatically)
```

### Step 3: Update Types

Add to `packages/database/src/types.ts`:

```typescript
// Add to profiles Row/Insert/Update
stripe_customer_id: string | null;

// New subscription type
export type Subscription = {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'trialing';
  price_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

// Webhook event type
export type WebhookEvent = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: 'processing' | 'completed' | 'failed';
  payload: Record<string, unknown> | null;
  error_details: string | null;
  created_at: string;
};
```

### Step 4: Apply Migration

```bash
# Via Supabase CLI
supabase db push

# Or via SQL Editor in Dashboard
# Copy migration SQL and execute
```

## Todo List
- [x] Create migration file
- [x] Add stripe_customer_id to profiles
- [x] Create subscriptions table
- [x] Create webhook_events table
- [x] Add RLS policies
- [x] Update TypeScript types
- [x] Apply migration to database
- [x] Test: verify tables created
- [x] Test: verify RLS blocks user writes

## Success Criteria
- [x] `profiles.stripe_customer_id` column exists
- [x] `subscriptions` table with proper indexes
- [x] `webhook_events` table for idempotency
- [x] RLS: users can read subscriptions, cannot write
- [x] RLS: webhook_events hidden from users
- [x] Types exported from @myprotocolstack/database

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration fails | Low | High | Test in dev first |
| RLS too restrictive | Medium | Medium | Test service role access |
| Missing index | Low | Medium | Monitor query performance |

## Security Considerations
- Users cannot modify subscription data directly
- Service role key required for webhook handler
- webhook_events stores sensitive Stripe payloads; hidden from users
- stripe_customer_id is PII; standard protection via RLS

## Next Steps
- [Phase 03: Checkout & Portal](./phase-03-checkout-portal.md)
