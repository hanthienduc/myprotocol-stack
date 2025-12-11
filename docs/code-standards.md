# Code Standards & Patterns

**Last Updated**: 2025-12-11
**Version**: 0.2.0
**Project**: MyProtocolStack

## Overview

Coding standards for MyProtocolStack. Production patterns for solo-dev, MVP-first micro-SaaS.

## Principles

### YAGNI (You Aren't Gonna Need It)
- Build only what's needed NOW
- No premature optimization
- No "just in case" features

### KISS (Keep It Simple)
- Prefer simple over clever
- Readable > compact
- Boring technology choices

### Ship Fast
- MVP first, polish later
- Good enough > perfect
- Iterate based on real feedback

## Tech Stack

```
Next.js 16       - App Router, Server Components, React 19
TypeScript 5     - Strict mode
Tailwind CSS 4   - Utility-first, PostCSS plugin
shadcn/ui        - Headless component library (Radix primitives)
Supabase 0.8.0   - PostgreSQL, Auth, SSR
Sonner 2.0       - Toast notifications
next-themes      - Theme switching (dark/light)
clsx + tailmerge - Class name utilities
```

## File Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Public auth pages
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/               # Protected app pages
│   │   ├── dashboard/
│   │   ├── protocols/
│   │   ├── stacks/
│   │   ├── today/
│   │   └── settings/
│   ├── api/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui (don't modify)
│   ├── protocols/
│   │   ├── protocol-card.tsx
│   │   └── protocol-list.tsx
│   ├── stacks/
│   │   ├── stack-card.tsx
│   │   └── stack-builder.tsx
│   ├── tracking/
│   │   ├── today-view.tsx
│   │   └── tracking-item.tsx
│   └── layout/
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── mobile-nav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts    # Auth middleware
│   ├── stripe/
│   │   └── client.ts
│   └── utils.ts             # cn() helper, etc.
├── types/
│   ├── database.ts          # Supabase generated types
│   └── index.ts             # App-specific types
├── hooks/
│   ├── use-user.ts
│   └── use-subscription.ts
└── actions/                 # Server Actions
    ├── stacks.ts
    ├── tracking.ts
    └── subscription.ts
```

## Naming Conventions

### Files
- **kebab-case** for all files: `protocol-card.tsx`
- **Descriptive names**: `stack-builder.tsx` not `builder.tsx`

### Components
- **PascalCase**: `ProtocolCard`
- **Props interface**: `ProtocolCardProps`

### Functions
- **camelCase**: `createStack`, `markComplete`
- **Action prefix** for server actions: `createStack`, `updateStack`

### Types
- **PascalCase**: `Protocol`, `Stack`, `TrackingRecord`
- **Suffix for collections**: `Protocols`, `Stacks`

## Component Patterns

### Server Component (Default)
```tsx
// app/(app)/protocols/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ProtocolList } from '@/components/protocols/protocol-list';

export default async function ProtocolsPage() {
  const supabase = await createClient();
  const { data: protocols } = await supabase
    .from('protocols')
    .select('*')
    .order('sort_order');

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Protocols</h1>
      <ProtocolList protocols={protocols ?? []} />
    </div>
  );
}
```

### Client Component
```tsx
// components/tracking/tracking-item.tsx
'use client';

import { useState } from 'react';
import { markComplete } from '@/actions/tracking';

interface TrackingItemProps {
  protocol: Protocol;
  isCompleted: boolean;
}

export function TrackingItem({ protocol, isCompleted }: TrackingItemProps) {
  const [completed, setCompleted] = useState(isCompleted);

  const handleToggle = async () => {
    setCompleted(!completed); // Optimistic
    await markComplete(protocol.id, new Date().toISOString());
  };

  return (
    <button onClick={handleToggle}>
      {/* ... */}
    </button>
  );
}
```

### Server Action
```tsx
// actions/tracking.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markComplete(protocolId: string, date: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await supabase.from('tracking').upsert({
    user_id: user.id,
    protocol_id: protocolId,
    completed_date: date,
  });

  revalidatePath('/today');
}
```

## Supabase Patterns

### Server Client
```tsx
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

### Browser Client
```tsx
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## TypeScript

### Types from Database
```tsx
// types/database.ts (generated by Supabase CLI)
export type Database = {
  public: {
    Tables: {
      protocols: {
        Row: { /* ... */ };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      // ...
    };
  };
};

// Convenience types
export type Protocol = Database['public']['Tables']['protocols']['Row'];
export type Stack = Database['public']['Tables']['stacks']['Row'];
```

### Props Types
```tsx
interface ProtocolCardProps {
  protocol: Protocol;
  onSelect?: (id: string) => void;
}
```

## Styling

### Tailwind Only
```tsx
// Good
<div className="flex items-center gap-4 p-4 rounded-lg border">

// Bad - no CSS modules or styled-components
```

### shadcn/ui Components
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

<Button variant="outline" size="sm">
  Add to Stack
</Button>
```

### cn() Helper
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-primary text-white',
  className
)}>
```

## Error Handling

### Server Actions
```tsx
export async function createStack(data: CreateStackInput) {
  try {
    const supabase = await createClient();
    const { data: stack, error } = await supabase
      .from('stacks')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/stacks');
    return { success: true, data: stack };
  } catch (error) {
    console.error('Failed to create stack:', error);
    return { success: false, error: 'Failed to create stack' };
  }
}
```

### Client-Side
```tsx
const handleSubmit = async () => {
  setLoading(true);
  const result = await createStack(formData);

  if (result.success) {
    toast.success('Stack created!');
    router.push('/stacks');
  } else {
    toast.error(result.error);
  }
  setLoading(false);
};
```

## Git Standards

### Commit Messages
```
feat: add protocol tracking
fix: streak calculation bug
docs: update readme
refactor: simplify stack builder
```

### Branch Names
```
feature/protocol-tracking
fix/streak-bug
```

## What NOT to Do

### Don't Over-Engineer
```tsx
// Bad - unnecessary abstraction
const useProtocolRepository = () => {
  const adapter = useAdapter();
  return new ProtocolRepository(adapter);
};

// Good - direct and simple
const { data: protocols } = await supabase.from('protocols').select('*');
```

### Don't Premature Optimize
```tsx
// Bad - caching before you need it
const protocols = await redis.get('protocols') ?? await fetchAndCache();

// Good for MVP - just fetch
const protocols = await supabase.from('protocols').select('*');
```

### Don't Add Unused Features
```tsx
// Bad - features no one asked for
export function ProtocolCard({
  protocol,
  onShare,      // Not in MVP
  onExport,     // Not in MVP
  analytics,    // Not in MVP
}) { }

// Good - only what's needed
export function ProtocolCard({ protocol, onSelect }) { }
```

## Checklist Before Commit

- [ ] No TypeScript errors
- [ ] No console.logs (use proper logging if needed)
- [ ] No hardcoded secrets
- [ ] Component has proper types
- [ ] Server actions handle errors

## Stripe Payment Integration (Phase 3)

### Stripe Client Pattern

**File**: `lib/stripe.ts`

Always initialize Stripe with proper version specification:

```typescript
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover", // Pin specific API version
  typescript: true,
});

// Price ID mapping
export const STRIPE_PRICES = {
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY!,
  ANNUAL: process.env.STRIPE_PRICE_ANNUAL!,
} as const;

// Utility functions
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

**Key Principles:**
- Pin Stripe API version (avoid breaking changes)
- Use const assertions for price IDs
- Export utility functions for type safety
- Fail fast if env vars missing

### Feature Gating Pattern

**File**: `lib/subscription.ts`

Define tier limits as constants, use helper functions:

```typescript
// Define limits once, use everywhere
export const FREE_LIMITS = {
  maxStacks: 3,
  maxProtocolsPerStack: 10,
  historyDays: 7,
  advancedAnalytics: false,
  aiRecommendations: false,
  wearableSync: false,
} as const;

export const PRO_FEATURES = {
  maxStacks: Infinity,
  maxProtocolsPerStack: Infinity,
  historyDays: Infinity,
  advancedAnalytics: true,
  aiRecommendations: true,
  wearableSync: true,
} as const;

// Fetch tier from database
export async function getUserTier(): Promise<SubscriptionTier> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return "free"; // Default to free if not logged in

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  return (profile?.subscription_tier as SubscriptionTier) || "free";
}

// Specific feature gates
export async function canCreateStack(): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const tier = await getUserTier();
  const limit = tier === "pro" ? PRO_FEATURES.maxStacks : FREE_LIMITS.maxStacks;

  // Count existing stacks
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, current: 0, limit: 0 };

  const { count } = await supabase
    .from("stacks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const current = count || 0;
  return { allowed: current < limit, current, limit };
}

// Require Pro - throw if not Pro
export async function requirePro(): Promise<void> {
  const tier = await getUserTier();
  if (tier !== "pro") {
    throw new Error("This feature requires a Pro subscription");
  }
}
```

**Key Principles:**
- Define limits as constants (single source of truth)
- Always fetch tier from database (real-time, Stripe as source)
- Return clear objects with current/limit info
- Use `requirePro()` to throw early in server actions

### Webhook Handler Pattern

**File**: `app/api/webhooks/stripe/route.ts`

Always verify signature and check idempotency:

```typescript
import { stripe } from "@/lib/stripe";
import { createClient } from "@myprotocolstack/database/server";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    // 1. Always verify signature first
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  const supabase = await createClient();

  // 2. Check idempotency - prevent duplicate processing
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single();

  if (existing) {
    console.log("Webhook already processed:", event.id);
    return new Response("OK", { status: 200 });
  }

  try {
    // 3. Process event
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

      default:
        console.log("Unhandled event type:", event.type);
    }

    // 4. Mark as completed
    await supabase
      .from("webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        status: "completed",
        payload: event.data,
      });

    return new Response("OK", { status: 200 });
  } catch (err) {
    // 5. Log failure but don't crash
    console.error("Webhook processing error:", err);

    await supabase
      .from("webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        status: "failed",
        payload: event.data,
        error_details: String(err),
      });

    // Return 500 to signal Stripe to retry
    return new Response("Processing failed", { status: 500 });
  }
}

async function handleCheckoutComplete(session: any, supabase: any) {
  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(session.customer);
  const userId = customer.metadata?.userId;

  if (!userId) throw new Error("No userId in customer metadata");

  // Save subscription to database
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
```

**Key Principles:**
- **Verify signature first** - never process unsigned events
- **Check idempotency** - prevent duplicate database updates
- **Try/catch with logging** - record all errors to webhook_events
- **Return 500 on failure** - Stripe will retry
- **Use upsert** - handle subscription updates idempotently
- **Update profiles.subscription_tier** - source of truth for tier

### Server Action Pattern

**File**: `actions/subscription.ts`

Use 'use server' and handle errors clearly:

```typescript
'use server'

import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { createClient } from "@myprotocolstack/database/server";

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Get or create Stripe customer
    let stripeCustomerId = await getOrCreateStripeCustomer(user.id, user.email!);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: { userId: user.id },
    });

    if (!session.url) {
      throw new Error("No checkout URL returned");
    }

    return { url: session.url };
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    throw new Error("Failed to create checkout session");
  }
}

async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const supabase = await createClient();

  // Check if customer already exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  // Save to database
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}
```

**Key Principles:**
- **Use 'use server'** - mark all server actions
- **Check auth first** - throw early if unauthorized
- **Use try/catch** - return user-friendly error messages
- **Store stripe_customer_id** - avoid creating duplicates
- **Return clear response** - { url, error, etc }

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Payment Integration Guide](./payment-integration-guide.md)
