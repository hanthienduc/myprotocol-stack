# Codebase Summary

**Last Updated**: 2025-12-09
**Version**: 0.1.0
**Project**: MyProtocolStack

## Overview

MyProtocolStack is a micro-SaaS for building and tracking personalized health protocols. MVP with core features implemented: protocol library, stack builder, daily tracking, and analytics.

## Project Status

**Phase**: MVP Implementation
**Codebase**: Production-ready core features

## Quick Links

| Document | Purpose |
|----------|---------|
| [README](../README.md) | Project overview |
| [PDR](./project-overview-pdr.md) | Full requirements |
| [Roadmap](./project-roadmap.md) | Development phases |
| [Architecture](./system-architecture.md) | Technical design |
| [Code Standards](./code-standards.md) | Coding conventions |

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.0.8 |
| Runtime | React | 19.2.1 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS + shadcn/ui | 4 |
| Database | Supabase PostgreSQL | - |
| Auth | Supabase SSR | 0.8.0 |
| UI Components | shadcn/ui + Radix | - |
| Charting | Recharts | 3.5.1 |
| Notifications | Sonner | 2.0.7 |
| Theme | next-themes | 0.4.6 |
| Hosting | Vercel | - |

## Core Features (MVP)

1. **Protocol Library** - 30 curated protocols
2. **Stack Builder** - Combine protocols into routines
3. **Daily Tracking** - Mark protocols complete
4. **Advanced Analytics Dashboard** - Adherence tracking, protocol completion rates, day-of-week heatmap, category breakdown

## Data Models

```
protocols     → Name, category, steps, difficulty
stacks        → User's protocol collections
stack_protocols → Junction table (stack ↔ protocol)
tracking      → Daily completion records
profiles      → User data + subscription tier
```

## Project Structure

```
myprotocolstack/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes
│   │   ├── login/page.tsx
│   │   └── callback/page.tsx
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── protocols/page.tsx    # Protocol library
│   │   ├── stacks/
│   │   │   ├── page.tsx          # Stack list
│   │   │   ├── new/page.tsx      # Create stack
│   │   │   └── [id]/page.tsx     # Edit stack
│   │   ├── today/page.tsx        # Daily tracking
│   │   ├── analytics/page.tsx    # Analytics dashboard (Phase 4)
│   │   │   └── loading.tsx       # Analytics skeleton loader
│   │   ├── settings/page.tsx     # User settings
│   │   └── layout.tsx            # Dashboard layout w/ nav
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── ui/                       # shadcn/ui (generated)
│   ├── auth/
│   │   └── sign-out-button.tsx
│   ├── protocols/
│   │   ├── protocol-card.tsx
│   │   └── protocol-filters.tsx
│   ├── stacks/
│   │   ├── stack-builder.tsx     # Create/edit form
│   │   └── delete-stack-button.tsx
│   ├── tracking/
│   │   └── today-view.tsx        # Daily check-in UI
│   └── analytics/                # Phase 4: Analytics components
│       ├── analytics-summary-cards.tsx  # 4 stat cards
│       ├── adherence-chart.tsx          # Line chart (7/30/90 days)
│       ├── protocol-completion-chart.tsx # Bar chart top protocols
│       ├── day-heatmap.tsx              # Day-of-week grid
│       ├── category-breakdown.tsx       # Category completion rates
│       └── date-range-selector.tsx      # Date filter (7/30/90)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Auth middleware
│   ├── analytics-queries.ts      # Phase 4: Server analytics functions
│   ├── types/
│   │   ├── analytics.ts         # Phase 4: Analytics type definitions
│   │   └── database.ts          # Supabase types
│   └── utils.ts                 # Helpers (cn, etc.)
│
├── types/                        # TypeScript definitions
├── middleware.ts                 # Next.js middleware
├── CLAUDE.md                     # Claude instructions
├── README.md                     # Project overview
└── docs/                         # Documentation
```

## Business Model

- **Free**: 3 stacks, 15 protocols, 7-day history
- **Pro ($9.99/mo)**: Unlimited, full analytics, AI recommendations

## Target Metrics

| Milestone | Users | MRR |
|-----------|-------|-----|
| Month 6 | 2,000 | $1,000 |
| Month 12 | 10,000 | $5,000 |
| Month 18 | 25,000 | $12,500 |

## Next Steps

1. Register domain (myprotocolstack.com)
2. Initialize Next.js project
3. Set up Supabase
4. Create database schema
5. Build protocol content (30 items)

## Development Workflow

Using ClaudeKit Engineer with:
- `/plan` - Create implementation plans
- `/cook` - Build features
- `/fix` - Debug issues
- `/test` - Run tests

---

## Phase 4: Analytics Dashboard (Dec 2025)

**Status:** Complete

**Components Added:**
- `AnalyticsSummaryCards` - 4-card stat display (Completed, Avg Adherence, Current Streak, Best Streak)
- `AdherenceChart` - Line chart tracking adherence % over time (7/30/90 day ranges)
- `ProtocolCompletionChart` - Bar chart showing top 5 protocol completion rates
- `DayHeatmap` - Grid heatmap of completion % by day-of-week
- `CategoryBreakdown` - Category completion rates (Sleep, Focus, Energy, Fitness)
- `DateRangeSelector` - Filter controls for 7/30/90 day periods

**Server Functions (analytics-queries.ts):**
- `getAdherenceData()` - Weekly adherence points over date range
- `getProtocolRates()` - Per-protocol completion percentages
- `getDayOfWeekRates()` - Day-of-week aggregation for heatmap
- `getCategoryBreakdown()` - Category-level completion stats
- `getAnalyticsSummary()` - Summary cards data (total, streaks)
- `getAnalyticsData()` - Master function bundling all data

**Database Index Added:**
- `idx_tracking_user_date ON tracking(user_id, date DESC)` for query optimization

**UI Updates:**
- Analytics nav link added to dashboard header
- Skeleton component added to packages/ui for loading states
- Responsive grid layout: 2-col mobile → 4-col desktop for summary cards
- Chart components use Recharts with category color scheme

**Last Review**: 2025-12-09
