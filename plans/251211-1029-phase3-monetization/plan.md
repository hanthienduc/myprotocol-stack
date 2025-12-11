# Phase 3: Stripe Monetization

## Overview

Implement Stripe subscription billing for MyProtocolStack with Free/Pro tiers.

| Field | Value |
|-------|-------|
| Date | 251211 |
| Pricing | $12/mo or $99/yr (17% discount) |
| Architecture | Webhook-driven, Stripe as source of truth |
| Status | DONE |

## Tier Structure

| Feature | Free | Pro |
|---------|------|-----|
| Stacks | 3 | Unlimited |
| Protocol Library | 15 | Full |
| History | 7 days | Unlimited |
| Analytics | Basic | Advanced |
| AI Recommendations | - | Yes |
| Wearable Sync | - | Yes |

## Phase Overview

| Phase | Name | Status | Priority |
|-------|------|--------|----------|
| 01 | [Stripe Setup](./phase-01-stripe-setup.md) | DONE | P0 |
| 02 | [Database Schema](./phase-02-database-schema.md) | DONE | P0 |
| 03 | [Checkout & Portal](./phase-03-checkout-portal.md) | DONE | P0 |
| 04 | [Webhook Handler](./phase-04-webhook-handler.md) | DONE | P0 |
| 05 | [Feature Gating](./phase-05-feature-gating.md) | DONE | P1 |
| 06 | [Subscription UI](./phase-06-subscription-ui.md) | DONE | P1 |
| 07 | [Pricing Page](./phase-07-pricing-page.md) | DONE | P1 |

## Key Decisions

1. **Stripe = Source of Truth**: Webhook updates Supabase, never reverse
2. **Server-side Gating**: All feature checks server-side for security
3. **Service Role for Webhooks**: Bypass RLS using `SUPABASE_SERVICE_ROLE_KEY`
4. **Idempotency**: Track webhook events to prevent duplicate processing

## Dependencies

- Stripe account (Dashboard access)
- Environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Supabase service role key for webhook handler

## Risk Summary

| Risk | Impact | Mitigation |
|------|--------|------------|
| Webhook signature bypass | Critical | Always verify, log failures |
| Race conditions | High | Idempotency via event ID tracking |
| Test/Live mode mixing | High | Separate keys, strict env separation |

## Files Created

```
apps/web/
  actions/subscription.ts         # Server actions
  app/api/webhooks/stripe/route.ts # Webhook endpoint
  lib/stripe.ts                   # Stripe client
  lib/subscription.ts             # Feature gating utils
  components/subscription/        # UI components

supabase/
  migrations/stripe-subscriptions.sql
```
