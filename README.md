# MyProtocolStack

Build and track personalized health protocols based on science.

## Overview

MyProtocolStack is a micro-SaaS helping users build, combine, and track science-based health protocols. Users browse 30+ curated protocols, create daily "stacks," and track adherence to optimize their health routines.

**Status:** MVP phase - core features implemented, ready for user feedback

## The Problem

- Health advice is scattered across podcasts, YouTube, and articles
- Hard to remember which protocols to follow daily
- No way to track what's actually working
- Generic apps don't allow custom protocol combinations

## The Solution

A personal protocol management system that lets you:

1. **Browse Protocol Library** - Curated, science-backed protocols
2. **Build Your Stack** - Combine protocols into a daily routine
3. **Track Adherence** - Check off completed protocols daily
4. **See Results** - Correlate protocols with outcomes (energy, sleep, mood)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account

### Setup

```bash
pnpm install
cp .env.local.example .env.local
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Features (MVP)

- **Protocol Library** - 30 curated protocols (Sleep, Focus, Energy, Fitness)
- **Stack Builder** - Create custom stacks, add/remove protocols
- **Daily Tracking** - Mark protocols complete with optimistic updates
- **Analytics** - Adherence percentages, streak tracking
- **Authentication** - Google OAuth + Magic Link via Supabase

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.1.4 |
| Runtime | React | 19.0.0 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Components | shadcn/ui | Latest |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase SSR | 0.5.2 |
| Notifications | Sonner | 1.7.1 |
| Theme | next-themes | 0.4.4 |

## App Structure

```text
app/
├── (auth)/login, callback        # Public auth routes
├── (dashboard)/
│   ├── protocols/                # Browse protocols
│   ├── stacks/                   # Create/edit stacks
│   ├── today/                    # Daily tracking view
│   └── settings/                 # User settings
└── page.tsx                      # Landing page

components/
├── ui/                           # shadcn/ui (read-only)
├── auth/, protocols/, stacks/    # Feature components
└── tracking/                     # Daily check-in UI

lib/
├── supabase/client.ts, server.ts # Auth clients
└── utils.ts                      # Helpers

types/                            # TypeScript types
```

## Protocols

30 protocols across 4 categories:

- **Sleep** (8): Morning sunlight, caffeine cutoff, temperature, magnesium, etc.
- **Focus** (7): 90-min blocks, cold exposure, phone-free blocks, etc.
- **Energy** (8): Intermittent fasting, hydration, meal timing, etc.
- **Fitness** (7): Zone 2 cardio, resistance training, mobility, etc.

## Pricing

- **Free**: 3 stacks, basic tracking
- **Pro ($9.99/mo)**: Unlimited stacks, analytics, AI recommendations

## Documentation

- [Project Overview & PDR](./docs/project-overview-pdr.md) - Full requirements
- [System Architecture](./docs/system-architecture.md) - Technical design
- [Code Standards](./docs/code-standards.md) - Conventions & patterns
- [Codebase Summary](./docs/codebase-summary.md) - File overview
- [Project Roadmap](./docs/project-roadmap.md) - Development phases
- [Design Guidelines](./docs/design-guidelines.md) - UI/UX standards
- [Deployment Guide](./docs/deployment-guide.md) - Vercel & Supabase setup

## Development

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm test         # Run Jest tests
pnpm test:e2e     # Run Playwright tests
```

## License

MIT
