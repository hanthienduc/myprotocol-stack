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
| Notifications | Sonner | 2.0.7 |
| Theme | next-themes | 0.4.6 |
| Hosting | Vercel | - |

## Core Features (MVP)

1. **Protocol Library** - 30 curated protocols
2. **Stack Builder** - Combine protocols into routines
3. **Daily Tracking** - Mark protocols complete
4. **Basic Analytics** - Adherence percentages

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
│   │   └── settings/page.tsx     # User settings
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
│   └── tracking/
│       └── today-view.tsx        # Daily check-in UI
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Auth middleware
│   └── utils.ts                 # Helpers (cn, etc.)
│
├── types/                        # TypeScript definitions
│   └── database.ts              # Supabase types
│
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

**Last Review**: 2025-12-05
