# Phase 03: Checkout & Customer Portal

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 01 (Stripe keys), Phase 02 (stripe_customer_id)
- **Docs**: [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions)

## Overview
| Field | Value |
|-------|-------|
| Date | 251211 |
| Description | Server actions for Stripe Checkout and Customer Portal |
| Priority | P0 |
| Implementation Status | Not Started |
| Review Status | Draft |

## Key Insights
- Use Server Actions (not API routes) for checkout initiation
- Never trust client redirects; access granted via webhook only
- Customer Portal for self-service subscription management
- Store stripe_customer_id for returning customers

## Requirements
1. Create Stripe client utility
2. Server action: createCheckoutSession
3. Server action: createPortalSession
4. Handle success/cancel URLs
5. Link existing Stripe customers to profiles

## Architecture

### Checkout Flow
```
User clicks "Upgrade"
        |
        v
Server Action: createCheckoutSession
        |
        v
Return checkout URL -> redirect client
        |
        v
Stripe Checkout (hosted)
        |
        +---> Cancel -> /settings?checkout=cancelled
        |
        +---> Success -> /settings?checkout=success&session_id={id}
                               |
                               v (don't grant access here!)
                         Webhook: checkout.session.completed
                               |
                               v
                         Grant Pro access
```

### Portal Flow
```
User clicks "Manage Subscription"
        |
        v
Server Action: createPortalSession
        |
        v
Return portal URL -> redirect client
        |
        v
Stripe Customer Portal (hosted)
        |
        v
Return to /settings
```

## Related Code Files
### Create
- `apps/web/lib/stripe.ts`
- `apps/web/actions/subscription.ts`

### Modify
- None

## Implementation Steps

### Step 1: Create Stripe Client

Create `apps/web/lib/stripe.ts`:

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia', // Use latest stable
  typescript: true,
});

// Price IDs from environment
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  annual: process.env.STRIPE_PRICE_ANNUAL!,
} as const;

export type PricingInterval = keyof typeof STRIPE_PRICES;
```

### Step 2: Create Subscription Actions

Create `apps/web/actions/subscription.ts`:

```typescript
'use server';

import { createClient, createAdminClient } from '@myprotocolstack/database/server';
import { stripe, STRIPE_PRICES, type PricingInterval } from '@/lib/stripe';
import { redirect } from 'next/navigation';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Get or create Stripe customer for user
 */
async function getOrCreateStripeCustomer(userId: string, email: string) {
  const adminClient = createAdminClient();

  // Check if user already has a Stripe customer ID
  const { data: profile } = await adminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Store customer ID in profile
  await adminClient
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(interval: PricingInterval) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: 'Please log in to upgrade' };
  }

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const priceId = STRIPE_PRICES[interval];

    if (!priceId) {
      return { error: 'Invalid pricing plan' };
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/settings?checkout=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address for tax
      billing_address_collection: 'auto',
    });

    return { url: session.url };
  } catch (error) {
    console.error('Checkout session error:', error);
    return { error: 'Failed to create checkout session' };
  }
}

/**
 * Create Stripe Customer Portal session
 */
export async function createPortalSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Please log in' };
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return { error: 'No active subscription found' };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${APP_URL}/settings`,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Portal session error:', error);
    return { error: 'Failed to open subscription portal' };
  }
}

/**
 * Get current user's subscription status
 */
export async function getSubscriptionStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .single();

  return subscription;
}

/**
 * Check if user has active Pro subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getSubscriptionStatus();
  return subscription !== null;
}
```

### Step 3: Install Stripe Package

```bash
cd apps/web
pnpm add stripe
```

### Step 4: Update .env.local Check

Verify all required env vars in `apps/web/lib/stripe.ts`:

```typescript
// Add validation at module load
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_MONTHLY',
  'STRIPE_PRICE_ANNUAL',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
}
```

## Todo List
- [ ] Install stripe package
- [ ] Create lib/stripe.ts
- [ ] Create actions/subscription.ts
- [ ] Implement createCheckoutSession
- [ ] Implement createPortalSession
- [ ] Implement getSubscriptionStatus
- [ ] Test checkout flow (test mode)
- [ ] Test portal session
- [ ] Verify customer ID stored in profile

## Success Criteria
- [ ] Checkout redirects to Stripe-hosted page
- [ ] Success URL includes session_id param
- [ ] Cancel URL returns to settings
- [ ] Portal opens for subscribed users
- [ ] stripe_customer_id saved to profiles
- [ ] Returning customers reuse existing customer

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Wrong price ID | Medium | High | Validate env vars at load |
| Missing customer | Low | Medium | getOrCreateStripeCustomer |
| Redirect timing | Low | Low | Don't grant access on redirect |

## Security Considerations
- Server-side only; Stripe secret key never exposed
- Admin client for cross-user queries (customer lookup)
- User ID in metadata for webhook correlation
- Never grant Pro access on success redirect

## Next Steps
- [Phase 04: Webhook Handler](./phase-04-webhook-handler.md)
