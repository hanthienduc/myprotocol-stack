# Phase 07: Public Pricing Page & Landing Updates

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 06 (Subscription UI with PricingModal)
- **Docs**: [Next.js App Router](https://nextjs.org/docs/app/building-your-application/routing)

## Overview
| Field | Value |
|-------|-------|
| Date | 251211 |
| Description | Public pricing page for marketing + landing page pricing section |
| Priority | P1 |
| Implementation Status | DONE |
| Review Status | Code Review Complete - Minor Recommendations |

## Key Insights
- Pricing page must be public (no auth) for SEO/marketing
- Reuse existing `PricingModal` logic for feature list & checkout
- Landing page needs inline pricing section, not just modal
- Nav should link to /pricing from both marketing & dashboard

## Requirements

1. **Public Pricing Page** (`/pricing`)
   - Side-by-side Free vs Pro comparison table
   - Feature checkmarks/X marks
   - Monthly/Annual toggle (reuse from PricingModal)
   - CTA buttons → Stripe Checkout (if logged in) or /login (if not)
   - FAQ section (billing, cancellation, refunds)
   - SEO metadata

2. **Landing Page Updates**
   - Add pricing section between Categories and Featured Profiles
   - Same comparison table as /pricing page
   - Smooth scroll anchor from nav (#pricing)

3. **Navigation Updates**
   - Add "Pricing" link to landing header nav
   - Link goes to `/pricing` page

## Architecture

### Component Structure
```
components/pricing/
├── pricing-comparison.tsx    # Shared comparison table (Free vs Pro)
├── pricing-faq.tsx           # FAQ accordion
└── pricing-cta.tsx           # CTA button (handles auth state)

app/pricing/
└── page.tsx                  # Public pricing page
```

### Feature Comparison Data
```typescript
const FEATURES = [
  { name: "Stacks", free: "3", pro: "Unlimited" },
  { name: "Protocol Library", free: "30+ protocols", pro: "30+ protocols" },
  { name: "Tracking History", free: "7 days", pro: "Unlimited" },
  { name: "Basic Analytics", free: true, pro: true },
  { name: "Day-of-Week Insights", free: false, pro: true },
  { name: "Category Breakdowns", free: false, pro: true },
  { name: "Priority Support", free: false, pro: true },
];
```

## Related Code Files

### Create
- `apps/web/components/pricing/pricing-comparison.tsx`
- `apps/web/components/pricing/pricing-faq.tsx`
- `apps/web/components/pricing/pricing-cta.tsx`
- `apps/web/components/pricing/index.ts`
- `apps/web/app/pricing/page.tsx`

### Modify
- `apps/web/app/page.tsx` - Add pricing section, update nav
- `apps/web/components/subscription/pricing-modal.tsx` - Extract shared feature list

## Implementation Steps

### Step 1: Create Pricing Comparison Component

Create `apps/web/components/pricing/pricing-comparison.tsx`:

```typescript
"use client";

import { Check, X } from "lucide-react";
import { Badge, Button } from "@myprotocolstack/ui";
import { useState } from "react";

interface PricingComparisonProps {
  onSelectPlan?: (plan: "monthly" | "annual") => void;
  showCTA?: boolean;
}

const FEATURES = [
  { name: "Stacks", free: "3", pro: "Unlimited", category: "core" },
  { name: "Protocol Library", free: "30+", pro: "30+", category: "core" },
  { name: "Tracking History", free: "7 days", pro: "Unlimited", category: "core" },
  { name: "Basic Analytics", free: true, pro: true, category: "analytics" },
  { name: "Day-of-Week Insights", free: false, pro: true, category: "analytics" },
  { name: "Category Breakdowns", free: false, pro: true, category: "analytics" },
  { name: "Priority Support", free: false, pro: true, category: "support" },
];

export function PricingComparison({ onSelectPlan, showCTA = true }: PricingComparisonProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  // Render feature value (boolean → icon, string → text)
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-muted-foreground" />;
    }
    return <span>{value}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex gap-2 p-1 bg-muted rounded-lg">
          <button onClick={() => setBillingCycle("monthly")} className={...}>Monthly</button>
          <button onClick={() => setBillingCycle("annual")} className={...}>
            Annual <Badge>Save 17%</Badge>
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-bold">Free</h3>
          <p className="text-3xl font-bold mt-2">$0</p>
          <p className="text-muted-foreground">Forever free</p>
          {/* Feature list */}
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-primary rounded-lg p-6 relative">
          <Badge className="absolute -top-3 left-4">Most Popular</Badge>
          <h3 className="text-xl font-bold">Pro</h3>
          <p className="text-3xl font-bold mt-2">
            {billingCycle === "monthly" ? "$12" : "$99"}
          </p>
          <p className="text-muted-foreground">
            {billingCycle === "monthly" ? "/month" : "/year ($8.25/mo)"}
          </p>
          {showCTA && (
            <Button onClick={() => onSelectPlan?.(billingCycle)}>
              Get Started
            </Button>
          )}
          {/* Feature list */}
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Create Pricing FAQ Component

Create `apps/web/components/pricing/pricing-faq.tsx`:

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@myprotocolstack/ui";

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, you can cancel your subscription at any time. You'll retain Pro access until the end of your billing period."
  },
  {
    q: "Is there a free trial?",
    a: "We offer a generous Free tier with 3 stacks and 7 days of history. Try it out before upgrading!"
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards through our secure payment provider, Stripe."
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Yes, you can switch billing cycles anytime from your account settings."
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 14-day money-back guarantee. Contact support if you're not satisfied."
  },
];

export function PricingFAQ() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((faq, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger>{faq.q}</AccordionTrigger>
          <AccordionContent>{faq.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

### Step 3: Create Pricing CTA Component

Create `apps/web/components/pricing/pricing-cta.tsx`:

```typescript
"use client";

import { Button } from "@myprotocolstack/ui";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/actions/subscription";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PricingCTAProps {
  plan: "monthly" | "annual";
  isLoggedIn: boolean;
}

export function PricingCTA({ plan, isLoggedIn }: PricingCTAProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setLoading(true);
    const { url, error } = await createCheckoutSession(plan);

    if (error || !url) {
      toast.error(error || "Failed to start checkout");
      setLoading(false);
      return;
    }

    window.location.href = url;
  };

  return (
    <Button onClick={handleClick} disabled={loading} className="w-full">
      {loading ? <Loader2 className="animate-spin" /> : `Get Pro ${plan === "annual" ? "Annual" : "Monthly"}`}
    </Button>
  );
}
```

### Step 4: Create Pricing Page

Create `apps/web/app/pricing/page.tsx`:

```typescript
import { Metadata } from "next";
import { createClient } from "@myprotocolstack/database/server";
import { PricingComparison } from "@/components/pricing/pricing-comparison";
import { PricingFAQ } from "@/components/pricing/pricing-faq";
import Link from "next/link";
import { Button } from "@myprotocolstack/ui";

export const metadata: Metadata = {
  title: "Pricing - MyProtocolStack",
  description: "Choose the plan that fits your health optimization goals. Free forever or unlock Pro features for advanced analytics.",
  openGraph: {
    title: "Pricing - MyProtocolStack",
    description: "Free & Pro plans for health protocol tracking",
  },
};

export default async function PricingPage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen">
      {/* Header (reuse landing header style) */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">MyProtocolStack</Link>
          <nav className="flex items-center gap-4">
            <Link href="/blog"><Button variant="ghost">Blog</Button></Link>
            <Link href="/pricing"><Button variant="ghost">Pricing</Button></Link>
            {isLoggedIn ? (
              <Link href="/today"><Button>Dashboard</Button></Link>
            ) : (
              <>
                <Link href="/login"><Button variant="ghost">Log in</Button></Link>
                <Link href="/login"><Button>Get Started</Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Start free and upgrade when you need more. No hidden fees.
          </p>
        </div>

        {/* Pricing Comparison */}
        <PricingComparison isLoggedIn={isLoggedIn} />

        {/* FAQ */}
        <section className="mt-24 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <PricingFAQ />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">...</footer>
    </div>
  );
}
```

### Step 5: Update Landing Page

Update `apps/web/app/page.tsx`:

1. Add "Pricing" link to header nav (after Blog)
2. Add pricing section between Categories and Featured Profiles
3. Add anchor id="pricing" for smooth scroll

```typescript
// In header nav
<Link href="/pricing">
  <Button variant="ghost">Pricing</Button>
</Link>

// New pricing section
<section id="pricing" className="py-24">
  <div className="container mx-auto px-4">
    <h2 className="text-center text-3xl font-bold">Simple Pricing</h2>
    <p className="text-center text-muted-foreground mt-4">
      Start free. Upgrade when you need more.
    </p>
    <div className="mt-12 max-w-4xl mx-auto">
      <PricingComparison showCTA={true} />
    </div>
  </div>
</section>
```

### Step 6: Update Plan.md

Add Phase 07 to the phase overview table in `plan.md`.

## Todo List
- [ ] Create components/pricing/pricing-comparison.tsx
- [ ] Create components/pricing/pricing-faq.tsx
- [ ] Create components/pricing/pricing-cta.tsx
- [ ] Create components/pricing/index.ts (barrel export)
- [ ] Create app/pricing/page.tsx
- [ ] Update app/page.tsx with pricing section
- [ ] Update app/page.tsx nav with Pricing link
- [ ] Add SEO metadata to pricing page
- [ ] Test pricing page (logged in/out states)
- [ ] Test checkout flow from pricing page
- [ ] Test landing page pricing section
- [ ] Update plan.md with Phase 07

## Success Criteria
- [ ] /pricing page loads without auth
- [ ] Pricing comparison shows Free vs Pro features
- [ ] Monthly/Annual toggle works
- [ ] CTA redirects to login if not authenticated
- [ ] CTA starts Stripe Checkout if authenticated
- [ ] FAQ accordion expands/collapses
- [ ] Landing page has pricing section
- [ ] Nav links to /pricing from both pages
- [ ] Dark mode support
- [ ] Mobile responsive

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Duplicate code with PricingModal | Medium | Low | Extract shared FEATURES constant |
| SEO issues | Low | Medium | Add proper metadata, OG tags |
| Auth state confusion | Low | Medium | Clear CTA behavior based on login |

## Security Considerations
- Pricing page is public (no auth required)
- Checkout session creation still requires auth (server action)
- No sensitive data exposed on pricing page

## Next Steps
- Add testimonials section (future)
- Add comparison with competitors (future)
- A/B test pricing page layouts (future)
