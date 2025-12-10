# System Architecture

**Last Updated**: 2025-12-10
**Version**: 0.1.0
**Project**: MyProtocolStack

## Overview

MyProtocolStack is a serverless full-stack web app for personalized health protocols. Built on Next.js 16 (RSC), Supabase PostgreSQL, optimized for MVP launch and scalability.

## Architecture Pattern

**Pattern**: Serverless Full-Stack
**Philosophy**: Simple, cheap, fast to build

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Next.js Application                 │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │    │
│  │  │  Pages  │  │   API   │  │  Server Actions │ │    │
│  │  │  (RSC)  │  │ Routes  │  │                 │ │    │
│  │  └─────────┘  └─────────┘  └─────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │     │
│  │   Database  │  │   (OAuth)   │  │  (optional) │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Cost |
|-------|------------|------|
| Frontend | Next.js 16, React 19, TypeScript 5 | Free |
| Styling | Tailwind CSS 4 + shadcn/ui | Free |
| Components | Radix UI (headless) | Free |
| Database | Supabase PostgreSQL | Free tier |
| Auth | Supabase Auth (SSR) | Free tier |
| Hosting | Vercel | Free tier |
| Notifications | Sonner | Free |
| Theme | next-themes | Free |

**Monthly Cost (MVP)**: $0 until scale (~5K MAU)

## Database Schema

### Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free' | 'pro'
  subscription_id TEXT, -- Stripe subscription ID
  favorite_protocol_ids UUID[] DEFAULT '{}', -- Phase 6: Favorites list
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protocols (admin-managed)
CREATE TABLE public.protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'sleep' | 'focus' | 'energy' | 'fitness'
  difficulty TEXT DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
  duration_minutes INTEGER,
  frequency TEXT DEFAULT 'daily', -- 'daily' | 'weekly'
  science_summary TEXT,
  steps JSONB DEFAULT '[]',
  is_premium BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stacks (user-created protocol collections)
CREATE TABLE public.stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stack Protocols (junction table)
CREATE TABLE public.stack_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id UUID REFERENCES public.stacks ON DELETE CASCADE,
  protocol_id UUID REFERENCES public.protocols,
  sort_order INTEGER DEFAULT 0,
  schedule_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Mon, 7=Sun
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stack_id, protocol_id)
);

-- Tracking (daily protocol completions)
CREATE TABLE public.tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles NOT NULL,
  protocol_id UUID REFERENCES public.protocols NOT NULL,
  stack_id UUID REFERENCES public.stacks,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, protocol_id, completed_date)
);

-- Indexes
CREATE INDEX idx_tracking_user_date ON public.tracking(user_id, completed_date);
CREATE INDEX idx_stacks_user ON public.stacks(user_id);
CREATE INDEX idx_protocols_category ON public.protocols(category);
```

### Row Level Security (RLS)

```sql
-- Profiles: Users can only read/update their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Stacks: Users can only access their own
ALTER TABLE public.stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own stacks"
  ON public.stacks FOR ALL
  USING (auth.uid() = user_id);

-- Tracking: Users can only access their own
ALTER TABLE public.tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tracking"
  ON public.tracking FOR ALL
  USING (auth.uid() = user_id);

-- Protocols: Anyone can read
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read protocols"
  ON public.protocols FOR SELECT
  TO authenticated
  USING (true);
```

## Application Structure

```
myprotocolstack/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── (app)/             # Main app (authenticated)
│   │   │   ├── dashboard/     # Home dashboard
│   │   │   ├── protocols/     # Protocol library
│   │   │   ├── stacks/        # Stack management
│   │   │   ├── today/         # Daily tracking view
│   │   │   └── settings/      # User settings
│   │   ├── api/               # API routes
│   │   │   ├── webhooks/      # Stripe webhooks
│   │   │   └── ...
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── protocols/         # Protocol-related components
│   │   ├── stacks/            # Stack-related components
│   │   ├── tracking/          # Tracking components
│   │   └── layout/            # Layout components
│   ├── lib/
│   │   ├── supabase/          # Supabase client
│   │   ├── stripe/            # Stripe utilities
│   │   └── utils/             # Helper functions
│   ├── types/                 # TypeScript types
│   └── hooks/                 # Custom React hooks
├── public/
├── supabase/
│   └── migrations/            # Database migrations
└── ...config files
```

## Key Flows

### Authentication Flow

```
User clicks "Sign in with Google"
    │
    ▼
Supabase Auth redirects to Google
    │
    ▼
User authenticates with Google
    │
    ▼
Callback to /auth/callback
    │
    ▼
Supabase creates/updates auth.users
    │
    ▼
Trigger creates public.profiles row
    │
    ▼
Redirect to /dashboard
```

### Daily Tracking Flow

```
User opens /today
    │
    ▼
Fetch active stacks + today's protocols
    │
    ▼
Check existing completions for today
    │
    ▼
Display protocol list with status
    │
    ▼
User taps protocol to mark complete
    │
    ▼
Insert/update tracking record
    │
    ▼
Update UI (optimistic)
```

### Subscription Flow

```
User clicks "Upgrade to Pro"
    │
    ▼
Create Stripe Checkout session
    │
    ▼
Redirect to Stripe Checkout
    │
    ▼
User completes payment
    │
    ▼
Stripe webhook: checkout.session.completed
    │
    ▼
Update profiles.subscription_tier = 'pro'
    │
    ▼
Redirect to /dashboard with success
```

## API Endpoints

### Server Actions (Preferred)

```typescript
// src/app/actions/stacks.ts
'use server'

export async function createStack(data: CreateStackInput) { }
export async function updateStack(id: string, data: UpdateStackInput) { }
export async function deleteStack(id: string) { }
export async function addProtocolToStack(stackId: string, protocolId: string) { }

// src/app/actions/tracking.ts
'use server'

export async function markComplete(protocolId: string, date: string) { }
export async function markIncomplete(protocolId: string, date: string) { }
```

### API Routes (For Webhooks)

```
POST /api/webhooks/stripe     # Stripe webhook handler
```

## Feature Gating

```typescript
// lib/subscription.ts
const FREE_LIMITS = {
  maxStacks: 3,
  maxProtocols: 15, // Access to non-premium protocols
  historyDays: 7,
};

const PRO_FEATURES = {
  maxStacks: Infinity,
  maxProtocols: Infinity,
  historyDays: Infinity,
  aiRecommendations: true,
  wearableSync: true,
  advancedAnalytics: true,
};

export function canCreateStack(user: User, currentCount: number): boolean {
  if (user.subscription_tier === 'pro') return true;
  return currentCount < FREE_LIMITS.maxStacks;
}

export function canAccessProtocol(user: User, protocol: Protocol): boolean {
  if (user.subscription_tier === 'pro') return true;
  return !protocol.is_premium;
}
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=https://myprotocolstack.com

# Email (Resend)
RESEND_API_KEY=

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Performance Considerations

### Caching Strategy

```typescript
// Protocols rarely change - cache aggressively
export const revalidate = 3600; // 1 hour

// User data - revalidate on mutation
import { revalidatePath } from 'next/cache';
revalidatePath('/today');
```

### Database Optimization

- Index on frequently queried columns
- Use Supabase's built-in connection pooling
- Leverage RLS for security without app-level checks

## Security

### Authentication
- Supabase Auth handles all auth flows
- JWT tokens for API authentication
- PKCE flow for OAuth

### Data Protection
- RLS enforces data isolation
- No sensitive health data stored (just protocol names/completions)
- HTTPS everywhere

### Payments
- Stripe handles all payment data
- Webhook signature verification
- No card data touches our servers

## Monitoring

### Error Tracking
- Vercel built-in error logging
- Sentry (optional, for detailed errors)

### Analytics
- PostHog for product analytics
- Vercel Analytics for performance

### Uptime
- Vercel status page
- Supabase status page

## Scaling Considerations

### Current Architecture Limits
- Vercel free tier: 100GB bandwidth
- Supabase free tier: 500MB database
- Good for ~10,000 MAU

### When to Scale
- > 5,000 MAU: Consider Supabase Pro ($25/mo)
- > 10,000 MAU: Consider Vercel Pro ($20/mo)
- > 50,000 MAU: Consider dedicated infrastructure

## Future Architecture (Post-MVP)

### AI Recommendations
```
User Profile + History
    │
    ▼
OpenAI API (GPT-4)
    │
    ▼
Recommended Protocols
```

### Wearable Integration
```
Oura/Apple Health
    │
    ▼
OAuth + API fetch
    │
    ▼
Auto-track sleep/activity protocols
```

## References

- [Project Overview PDR](./project-overview-pdr.md)
- [Project Roadmap](./project-roadmap.md)
- [Code Standards](./code-standards.md)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
