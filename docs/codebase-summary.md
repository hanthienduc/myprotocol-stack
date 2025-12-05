# Codebase Summary

**Last Updated**: 2025-12-05
**Version**: 0.1.0
**Project**: MyProtocolStack

## Overview

MyProtocolStack is a micro-SaaS for building and tracking personalized health protocols. Users browse science-backed protocols, combine them into "stacks," and track daily adherence.

## Project Status

**Phase**: Initial Planning
**Codebase**: Template initialized

## Quick Links

| Document | Purpose |
|----------|---------|
| [README](../README.md) | Project overview |
| [PDR](./project-overview-pdr.md) | Full requirements |
| [Roadmap](./project-roadmap.md) | Development phases |
| [Architecture](./system-architecture.md) | Technical design |
| [Code Standards](./code-standards.md) | Coding conventions |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Hosting | Vercel |

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
├── .claude/          # ClaudeKit configuration
├── docs/             # Documentation
├── plans/            # Implementation plans
├── src/              # Source code (to be created)
├── CLAUDE.md         # Claude instructions
└── README.md         # Project overview
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
