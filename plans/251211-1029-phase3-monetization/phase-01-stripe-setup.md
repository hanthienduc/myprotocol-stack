# Phase 01: Stripe Dashboard Setup

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: None (first phase)
- **Docs**: [Stripe Dashboard](https://dashboard.stripe.com)

## Overview
| Field | Value |
|-------|-------|
| Date | 251211 |
| Description | Configure Stripe products, prices, and customer portal |
| Priority | P0 |
| Implementation Status | DONE |
| Review Status | Draft |

## Key Insights
- Use single product with multiple prices (monthly/annual)
- Customer portal reduces support burden for subscription management
- Test mode first, then configure production identically

## Requirements
1. Create Stripe account and verify business
2. Create "Pro" product with monthly and annual prices
3. Configure Customer Portal settings
4. Generate API keys and webhook secret
5. Document Price IDs for implementation

## Architecture

### Stripe Product Structure
```
Product: MyProtocolStack Pro
├── Price: pro_monthly  ($12/month)
│   └── ID: price_xxx_monthly
└── Price: pro_annual   ($99/year, ~$8.25/mo)
    └── ID: price_xxx_annual
```

## Related Code Files
### Create
- `apps/web/.env.local` (add Stripe vars)
- `apps/web/.env.example` (document vars)

### Modify
- None (configuration only)

## Implementation Steps

### Step 1: Create Stripe Account
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Complete business verification
3. Enable test mode (toggle top-right)

### Step 2: Create Product
1. Products > Add Product
2. Name: `MyProtocolStack Pro`
3. Description: `Unlimited stacks, advanced analytics, AI recommendations`
4. Pricing model: Standard pricing

### Step 3: Create Prices
Add two prices to the product:

**Monthly Price:**
```
Name: Pro Monthly
Amount: $12.00 USD
Billing period: Monthly
Price ID: Save this as STRIPE_PRICE_MONTHLY
```

**Annual Price:**
```
Name: Pro Annual
Amount: $99.00 USD
Billing period: Yearly
Price ID: Save this as STRIPE_PRICE_ANNUAL
```

### Step 4: Configure Customer Portal
Settings > Billing > Customer portal

Enable:
- [x] Update payment methods
- [x] Cancel subscriptions
- [x] View invoices
- [x] Update billing address

Disable for MVP:
- [ ] Pause subscriptions
- [ ] Switch plans (handle via cancel + new checkout)

Set return URL: `https://protocolstack.app/settings`

### Step 5: Configure Webhook Endpoint
Developers > Webhooks > Add endpoint

```
Endpoint URL: https://protocolstack.app/api/webhooks/stripe
Events to listen:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed
```

Save webhook signing secret as `STRIPE_WEBHOOK_SECRET`

### Step 6: Get API Keys
Developers > API keys

```
Publishable key: pk_test_xxx (for test mode)
Secret key: sk_test_xxx (for test mode)
```

### Step 7: Environment Variables

```env
# apps/web/.env.local

# Stripe Keys (TEST MODE)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs (TEST MODE)
STRIPE_PRICE_MONTHLY=price_xxx_monthly
STRIPE_PRICE_ANNUAL=price_xxx_annual
```

### Step 8: Update .env.example

```env
# Stripe
STRIPE_SECRET_KEY=sk_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_ANNUAL=price_xxx
```

## Todo List
- [x] Create Stripe account
- [x] Create Pro product
- [x] Add monthly price ($12)
- [x] Add annual price ($99)
- [x] Configure customer portal
- [x] Add webhook endpoint
- [x] Copy API keys
- [x] Copy Price IDs
- [x] Update .env.local
- [x] Update .env.example

## Success Criteria
- [x] Product visible in Stripe Dashboard
- [x] Both prices active
- [x] Webhook endpoint configured
- [x] All env vars documented

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Test/Live key confusion | Medium | High | Prefix all test vars clearly |
| Missing webhook events | Low | High | Double-check event list |

## Security Considerations
- Never commit actual keys to git
- Use different keys for test/production
- Webhook secret unique per endpoint URL

## Next Steps
- [Phase 02: Database Schema](./phase-02-database-schema.md)
