# Phase 04: Webhook Handler

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 02 (tables), Phase 03 (stripe client)
- **Docs**: [Stripe Webhooks](https://docs.stripe.com/webhooks), [Signature Verification](https://docs.stripe.com/webhooks/signature)

## Overview
| Field | Value |
|-------|-------|
| Date | 251211 |
| Description | API route handling Stripe webhook events with idempotency |
| Priority | P0 |
| Implementation Status | DONE |
| Review Status | Draft |

## Key Insights
- Must use raw body for signature verification (not parsed JSON)
- Idempotency via webhook_events table prevents double-processing
- Service role client bypasses RLS for database writes
- Handle both checkout completion and subscription lifecycle events

## Requirements
1. API route at `/api/webhooks/stripe`
2. Signature verification using STRIPE_WEBHOOK_SECRET
3. Idempotency check before processing
4. Handle: checkout.session.completed, subscription.updated/deleted, invoice.payment_failed
5. Update subscriptions table and profiles.subscription_tier

## Architecture

### Event Processing Flow
```
POST /api/webhooks/stripe
        |
        v
Verify Stripe signature (raw body + header)
        |
        v (fail = 400)
Check webhook_events for stripe_event_id
        |
        +---> Already processed? Return 200
        |
        v (new event)
Insert webhook_events (status='processing')
        |
        v
Switch on event.type:
├── checkout.session.completed -> handleCheckoutComplete
├── customer.subscription.updated -> handleSubscriptionUpdate
├── customer.subscription.deleted -> handleSubscriptionDeleted
└── invoice.payment_failed -> handlePaymentFailed
        |
        v
Update webhook_events (status='completed' or 'failed')
        |
        v
Return 200
```

### Subscription Status Mapping
```
Stripe Status     -> subscription_tier
-----------------    -----------------
active            -> pro
trialing          -> pro
past_due          -> pro (grace period)
canceled          -> free
unpaid            -> free
incomplete        -> free
```

## Related Code Files
### Create
- `apps/web/app/api/webhooks/stripe/route.ts`

### Modify
- None

## Implementation Steps

### Step 1: Create Webhook Route

Create `apps/web/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@myprotocolstack/database/server';
import type Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  // Get raw body and signature
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Webhook: Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Use service role client (bypasses RLS)
  const supabase = createAdminClient();

  // Idempotency check
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, status')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent) {
    // Already processed or processing
    console.log(`Webhook: Event ${event.id} already processed`);
    return NextResponse.json({ received: true });
  }

  // Insert event as processing
  const { error: insertError } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: 'processing',
      payload: event.data.object as Record<string, unknown>,
    });

  if (insertError) {
    console.error('Failed to insert webhook event:', insertError);
    // May be race condition; proceed anyway
  }

  let processingError: string | null = null;

  try {
    // Handle event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Webhook: Unhandled event type ${event.type}`);
    }
  } catch (error) {
    processingError = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Webhook processing error for ${event.type}:`, error);
  }

  // Update event status
  await supabase
    .from('webhook_events')
    .update({
      status: processingError ? 'failed' : 'completed',
      error_details: processingError,
    })
    .eq('stripe_event_id', event.id);

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}

/**
 * Handle checkout.session.completed
 * - Create/update subscription record
 * - Update user tier to 'pro'
 */
async function handleCheckoutComplete(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  if (session.mode !== 'subscription' || !session.subscription) {
    return; // Not a subscription checkout
  }

  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;

  if (!userId) {
    console.error('Webhook: Missing supabase_user_id in session metadata');
    return;
  }

  // Retrieve full subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Upsert subscription record
  await upsertSubscription(supabase, userId, subscription);

  // Update profile tier
  await supabase
    .from('profiles')
    .update({
      subscription_tier: 'pro',
      stripe_customer_id: customerId,
    })
    .eq('id', userId);

  console.log(`Webhook: User ${userId} upgraded to Pro`);
}

/**
 * Handle customer.subscription.updated
 * - Update subscription record
 * - Update tier based on status
 */
async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error('Webhook: Cannot find user for subscription update');
      return;
    }

    await upsertSubscription(supabase, profile.id, subscription);
    await updateProfileTier(supabase, profile.id, subscription.status);
  } else {
    await upsertSubscription(supabase, userId, subscription);
    await updateProfileTier(supabase, userId, subscription.status);
  }
}

/**
 * Handle customer.subscription.deleted
 * - Update subscription record status
 * - Downgrade user to free
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Webhook: Cannot find user for subscription deletion');
    return;
  }

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Downgrade to free
  await supabase
    .from('profiles')
    .update({ subscription_tier: 'free' })
    .eq('id', profile.id);

  console.log(`Webhook: User ${profile.id} downgraded to Free`);
}

/**
 * Handle invoice.payment_failed
 * - Log for monitoring
 * - Could trigger email notification (future)
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  console.warn(`Webhook: Payment failed for customer ${customerId}, subscription ${subscriptionId}`);

  // Update subscription status if exists
  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscriptionId);
  }

  // Note: Don't immediately revoke access
  // Stripe will retry and eventually mark as unpaid/canceled
}

/**
 * Upsert subscription record from Stripe subscription object
 */
async function upsertSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id;

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      price_id: priceId || '',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    }, {
      onConflict: 'stripe_subscription_id',
    });
}

/**
 * Update profile subscription_tier based on Stripe status
 */
async function updateProfileTier(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  status: Stripe.Subscription.Status
) {
  // Active statuses that grant Pro access
  const activeStatuses: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due'];
  const tier = activeStatuses.includes(status) ? 'pro' : 'free';

  await supabase
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId);
}
```

### Step 2: Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Note the webhook signing secret (whsec_xxx) and add to .env.local
```

### Step 3: Test Events

```bash
# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

## Todo List
- [x] Create app/api/webhooks/stripe/route.ts
- [x] Implement signature verification
- [x] Implement idempotency check
- [x] Handle checkout.session.completed
- [x] Handle customer.subscription.updated
- [x] Handle customer.subscription.deleted
- [x] Handle invoice.payment_failed
- [x] Install Stripe CLI
- [x] Test with stripe listen locally
- [x] Verify database updates

## Success Criteria
- [x] Webhook receives events from Stripe
- [x] Signature verification rejects invalid requests
- [x] Duplicate events are skipped (idempotency)
- [x] checkout.session.completed upgrades user to Pro
- [x] subscription.deleted downgrades user to Free
- [x] webhook_events table records all events
- [x] Service role bypasses RLS successfully

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Signature bypass | Low | Critical | Always verify, log failures |
| Duplicate processing | Medium | High | webhook_events idempotency |
| Missing user mapping | Medium | Medium | Fallback to customer_id lookup |
| Webhook timeout | Low | Medium | Keep processing fast |

## Security Considerations
- Raw body required for signature verification
- Never expose STRIPE_WEBHOOK_SECRET
- Service role key used; keep secure
- Log signature failures for monitoring
- Webhook endpoint public but signature-protected

## Next Steps
- [Phase 05: Feature Gating](./phase-05-feature-gating.md)
