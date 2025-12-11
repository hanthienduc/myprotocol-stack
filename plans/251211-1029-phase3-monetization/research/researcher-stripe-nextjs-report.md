# Stripe + Next.js 15 Integration Research

## 1. Package Strategy

### Recommended Packages
- **`stripe`** (v16+): Server-side SDK for creating Checkout Sessions, managing customers, handling webhooks
- **`@stripe/stripe-js`**: Client-side library for Stripe.js (PCI compliance, loaded from Stripe CDN)
- **`react-stripe-js`**: Optional React wrapper (if using Stripe Elements/Payment Element)

**Install:** `npm install stripe @stripe/stripe-js`

### App Router Best Practices
- Use **Server Actions** (`"use server"`) instead of API routes for checkout flows—more secure, simpler code
- Load Stripe.js lazily (first render of checkout page) using singleton pattern to optimize performance
- Environment setup: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Only prefix `NEXT_PUBLIC_` for client-side variables; keep secrets server-side

**Key:** Never trust the client to redirect after payment—always use Stripe's redirect from Checkout Session or webhooks.

---

## 2. Checkout Flow

### Subscription Mode Implementation
```
1. Server Action: Create Checkout Session with mode="subscription"
2. Pass Price ID(s) for recurring items (max 20 line items)
3. Set success_url + cancel_url (include {CHECKOUT_SESSION_ID} param for verification)
4. Redirect client to stripe.redirectToCheckout(sessionId)
5. Listen to checkout.session.completed webhook → grant access
```

### Creating Session (Server Action)
- Required: `line_items` array with Price IDs
- For subscriptions: Set `mode: "subscription"`
- Optional: Add one-time items (initial invoice only)
- Auto-create Customer if not provided
- **Saves payment method by default** for subscriptions

### Success/Cancel Handling
- Success page verifies `CHECKOUT_SESSION_ID` param via `stripe.checkout.sessions.retrieve()`
- Cancel URL returns user without penalty
- **Never grant access on client-side redirect**—only on webhook confirmation

### Mixed Carts
Support both recurring + one-time items in single checkout:
```
mode: "subscription"
line_items: [
  { price: "price_recurring_...", quantity: 1 },
  { price: "price_onetime_...", quantity: 1 }
]
```
One-time charges appear on initial invoice only.

---

## 3. Customer Portal

### Self-Service Features
- Customer updates payment method
- Subscription management (pause, resume, cancel)
- Invoice history access
- Recurring billing preferences

### Setup Requirements
1. Configure portal in Stripe Dashboard (minimal: enable payment method updates)
2. Create portal session via Server Action: `stripe.billingPortal.sessions.create({ customer, return_url })`
3. Redirect to `session.url`
4. **No webhook required** for portal actions—real-time Stripe state

### Best Practice
Link portal from user dashboard after successful subscription. Reduces support burden.

---

## 4. Webhook Handling

### Essential Events
| Event | Trigger | Action |
|-------|---------|--------|
| `checkout.session.completed` | Payment processed, subscription started | Grant access, update user tier |
| `customer.subscription.updated` | Price change, billing date change | Log change, notify user |
| `customer.subscription.deleted` | Cancellation via portal or API | Revoke access |
| `invoice.payment_succeeded` | Recurring payment collected | Log transaction (optional) |
| `invoice.payment_failed` | Payment declined | Alert customer, pause service |

### Signature Verification (CRITICAL)
```javascript
const event = stripe.webhooks.constructEvent(
  rawBody,  // Raw request body (not parsed JSON!)
  signature, // Stripe-Signature header
  endpointSecret // STRIPE_WEBHOOK_SECRET
);
```

**Common pitfall:** Using `express.json()` parses body and breaks verification. Use `express.raw({ type: "application/json" })` instead.

### Idempotency Handling
- Stripe sends webhook with `id` field
- Store processed event IDs in database
- Skip if ID already processed (duplicate delivery edge case)
- **Prevents double-crediting, double-billing**

### Security Notes
- Signature includes timestamp; prevents replay attacks
- Test/Live events signed with different secrets—mismatch = failure
- Endpoint secret is unique per endpoint URL
- Verify in production: Log signature verification failures for debugging

---

## 5. Pricing Recommendations (Health/Wellness SaaS)

### Tier Structure (2025 Benchmarks)
**Free Tier**
- Browse protocols, build 1 stack, manual tracking
- Unlimited access to public stacks
- *Goal: Conversion funnel*

**Pro ($12/mo or $99/yr = 20% discount)**
- Unlimited stacks, auto-sync tracking, advanced analytics
- Export reports, AI insights (if planned)
- Heart of monetization for health micro-SaaS

**Team/Coach ($29/mo or $279/yr = 20% discount)**
- Manage client stacks, progress dashboards
- White-label reports
- *Upsell for coaches, health practitioners*

### Pricing Strategy Rationale
- **$12/mo sweet spot**: Health app segment (Fitbit, MyFitnessPal premium ~$10-15/mo)
- **Annual discount 20% off**: Reduces monthly to $9.90/mo equivalent; proven conversion driver
- **Tiered structure**: Free → Pro captures 5-10% conversion; Pro → Coach captures enterprises
- **2025 trend**: Monthly billing at standard price; annual forced commitment (avoid per-user complexity)

### Payment Flow Optimization
1. Free trial (14 days) → Checkout for Pro
2. Pro annual first (better LTV); offer monthly as fallback
3. Upsell Team tier in-app after 2 weeks retention

---

## Sources

- [Stripe Checkout and Webhook in Next.js 15 (2025)](https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e)
- [Easily Integrate Stripe in Next.js 15 App Router](https://danielhashmi.medium.com/easily-integrate-stripe-in-next-js-15-app-router-9fa16230c80b)
- [Stripe + Next.js 15: The Complete 2025 Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/)
- [Stripe Subscriptions in Next.js](https://www.pedroalonso.net/blog/stripe-subscriptions-nextjs/)
- [Stripe Checkout Sessions API Reference](https://docs.stripe.com/api/checkout/sessions)
- [Build a Subscriptions Integration](https://docs.stripe.com/billing/subscriptions/build-subscriptions)
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)
- [Webhook Signature Verification](https://docs.stripe.com/webhooks/signature)
- [The State of SaaS Pricing Strategy 2025](https://www.invespcro.com/blog/saas-pricing/)
- [The Complete SaaS Pricing Guide 2025](https://www.cloudzero.com/blog/saas-pricing/)
- [SaaS Pricing Models 2025](https://www.marketermilk.com/blog/saas-pricing-models)

---

**Report Generated:** 2025-12-11
**Scope:** Stripe integration for health protocol tracking micro-SaaS (MyProtocolStack)
**Status:** Ready for implementation planning
