# Codebase Summary

**Last Updated**: 2025-12-11
**Version**: 0.4.0
**Project**: MyProtocolStack
**Phase Status**: Phase 3 Monetization Complete, Phase 4 Social Sharing Complete, Phase 5 Growth Complete, Phase 6 Search & Filtering Complete

## Overview

MyProtocolStack is a micro-SaaS for building and tracking personalized health protocols. MVP with core features implemented: protocol library, stack builder, daily tracking, and analytics.

## Project Status

**Phase**: Phase 4 Social Sharing (Complete), Phase 5 Growth - SEO & Blog (Complete), Phase 6 Advanced Search & Filtering (Complete)
**Codebase**: Production-ready core features with social sharing, SEO optimization, blog platform, and advanced search

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
│   │   ├── protocols/
│   │   │   ├── page.tsx          # Protocol library
│   │   │   └── [id]/             # Phase 5: Protocol detail
│   │   │       ├── page.tsx      # Protocol detail page + HowTo schema
│   │   │       └── opengraph-image.tsx # Dynamic OG image
│   │   ├── stacks/
│   │   │   ├── page.tsx          # Stack list
│   │   │   ├── new/page.tsx      # Create stack
│   │   │   └── [id]/page.tsx     # Edit stack
│   │   ├── today/page.tsx        # Daily tracking
│   │   ├── analytics/page.tsx    # Analytics dashboard (Phase 4)
│   │   │   └── loading.tsx       # Analytics skeleton loader
│   │   ├── settings/page.tsx     # User settings
│   │   └── layout.tsx            # Dashboard layout w/ nav
│   ├── blog/                     # Phase 5.02: Blog content system
│   │   ├── page.tsx              # Blog list (title, excerpt, category, date, reading time)
│   │   ├── [slug]/
│   │   │   └── page.tsx          # Individual article with structured data (Article schema)
│   │   └── feed.xml/
│   │       └── route.ts          # RSS feed with all articles
│   ├── layout.tsx                # Root layout + metadata, Organization schema
│   ├── sitemap.ts                # Phase 5: Dynamic sitemap generation
│   ├── robots.ts                 # Phase 5: Robots.txt configuration
│   ├── opengraph-image.tsx       # Phase 5: Global OG image fallback
│   ├── twitter-image.tsx         # Phase 5: Global Twitter image fallback
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── ui/                       # shadcn/ui (generated)
│   ├── auth/
│   │   └── sign-out-button.tsx
│   ├── seo/                      # Phase 5: SEO components
│   │   └── structured-data.tsx   # JSON-LD schema markup
│   ├── blog/                     # Phase 5.02: Blog components
│   │   └── related-articles.tsx  # Display related articles section with links
│   ├── sharing/                  # Phase 4: Social sharing components
│   │   ├── share-button.tsx      # Share trigger button with Web Share API
│   │   ├── share-dialog.tsx      # Share dialog with 5 social platforms + copy link
│   │   └── copy-link-button.tsx  # Standalone copy-to-clipboard button
│   ├── protocols/
│   │   ├── protocol-card.tsx     # Protocol modal with share button
│   │   ├── protocol-search.tsx      # Phase 6: Debounced search
│   │   └── protocol-filters.tsx     # Phase 6: Advanced filters + sort
│   ├── stacks/
│   │   ├── stack-builder.tsx     # Create/edit form
│   │   └── delete-stack-button.tsx
│   ├── subscription/             # Phase 3: Monetization UI
│   │   ├── pricing-modal.tsx     # Stripe Checkout trigger ($12/mo, $99/yr)
│   │   └── subscription-card.tsx # Display subscription status & renewal date
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
│   ├── stripe.ts                # Phase 3: Stripe client & price mapping
│   ├── subscription.ts          # Phase 3: Feature gating logic (FREE_LIMITS, PRO_FEATURES)
│   ├── sharing/                  # Phase 4: Social sharing utilities
│   │   ├── utm.ts               # UTM param builder for share tracking
│   │   └── social-links.ts      # Platform-specific share URL generators
│   ├── analytics-queries.ts      # Phase 4: Server analytics functions
│   ├── protocol-filters.ts       # Phase 6: Filter/sort utilities
│   ├── blog/                     # Phase 5.02: Blog system
│   │   ├── articles.ts          # Article fetching with Zod validation
│   │   └── category-colors.ts   # Category color mapping
│   ├── __tests__/
│   │   └── protocol-filters.test.ts  # Phase 6: 34 filter tests
│   ├── types/
│   │   ├── analytics.ts         # Phase 4: Analytics type definitions
│   │   └── database.ts          # Supabase types
│   └── utils.ts                 # Helpers (cn, etc.)
│
├── content/
│   └── blog/                     # Phase 5.02: Blog article MDX files
│       ├── morning-sunlight-science.mdx
│       ├── deep-work-focus-blocks.mdx
│       ├── intermittent-fasting-guide.mdx
│       ├── zone-2-cardio-guide.mdx
│       ├── cold-exposure-benefits.mdx
│       ├── sleep-temperature-optimization.mdx
│       ├── blood-sugar-stable-energy.mdx
│       └── resistance-training-essentials.mdx
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

---

## Phase 6: Advanced Search & Filtering (Dec 2025)

**Status:** Complete

**New Components:**
- `ProtocolSearch` - Debounced full-text search (300ms) on name + description, clear button
- `ProtocolFilters` - Advanced filter/sort UI with mobile drawer + desktop inline controls

**New Utility Functions (protocol-filters.ts):**
- `filterProtocols()` - Text search, category multi-select, difficulty, duration range, favorites
- `sortProtocols()` - Sort by name, difficulty (easy→hard), duration (ascending/descending)
- `countActiveFilters()` - Badge count for active filters
- `parseFiltersFromParams()` - URL params → filter object
- `parseSortFromParams()` - URL params → sort object
- `buildParamsFromFilters()` - Filter object → shareable URL params

**Filter Features:**
- Multi-category filter (checkboxes: Sleep/Focus/Energy/Fitness)
- Difficulty filter (Easy/Medium/Hard toggle)
- Duration presets (<15min, 15-30min, 30-60min, 60+min)
- Favorites filter (heart icon, red highlight when active)
- Sort options (name asc/desc, difficulty asc/desc, duration asc/desc)
- URL state persistence (all filters shareable via URL)
- Active filter counter with "Clear all" button
- Result count display (X of Y protocols)

**Page Updates (protocols/page.tsx):**
- Server-side filtering & sorting from URL params
- Fetch user favorites from profiles.favorite_protocol_ids
- Grouped display by category (collapsible per category)
- Single-category view when filtered to one category
- Empty states for no results + favorites view

**Mobile Responsiveness:**
- Inline filters + sort on desktop
- Bottom Sheet drawer for filters on mobile
- Compact filter button with count badge
- All functionality preserved on small screens

**Tests (protocol-filters.test.ts):**
- 34 unit tests covering:
  - Text search (name/description, case-insensitive)
  - Category filtering (single/multi)
  - Difficulty filtering
  - Duration range filtering
  - Favorites filtering
  - Sorting (name, difficulty, duration, both orders)
  - URL param parsing/building
  - Active filter counting
  - Edge cases (empty queries, multiple filters, null durations)

**Last Review**: 2025-12-10

---

## Phase 5: Growth - SEO Foundation (Dec 2025)

**Status:** Complete - Phase 01 SEO Foundation

**New SEO Components:**
- `StructuredData` - Reusable JSON-LD structured data component for schema.org markup

**New Routes/Files:**
- `app/sitemap.ts` - Dynamic sitemap generation with all protocols (changeFrequency: "monthly", priority: 0.8)
- `app/robots.ts` - Robots.txt configuration (allow all except /api, /auth, /today, /settings, /analytics, /onboarding; disallow AI bots)
- `app/layout.tsx` - Enhanced root metadata with Organization schema, OpenGraph, Twitter cards
- `app/opengraph-image.tsx` - Global OG image fallback (1200x630)
- `app/twitter-image.tsx` - Global Twitter card image (1200x630)

**New Protocol Detail Route:**
- `app/(dashboard)/protocols/[id]/page.tsx` - Dynamic protocol detail page with:
  - Dynamic metadata generation (title, description, OpenGraph from protocol data)
  - HowTo structured data schema for each protocol
  - Protocol display with category/difficulty badges, steps, science summary
  - Back navigation link to protocols list

- `app/(dashboard)/protocols/[id]/opengraph-image.tsx` - Dynamic protocol OG image (1200x630) with:
  - Category-specific gradient backgrounds
  - Protocol name, category, difficulty badges
  - Edge runtime for fast image generation

**Metadata & SEO:**
- Root metadata: Title template, description, keywords (health protocols, biohacking, habit tracking, etc)
- OpenGraph tags for social sharing (website type, images, locale)
- Twitter cards (summary_large_image format)
- Robots meta (index: true, follow: true, googleBot enabled)
- Organization JSON-LD schema in root layout
- Protocol HowTo schema generation in detail page

**Sitemap Configuration:**
- Base URL: `/` (priority: 1.0, weekly)
- Protocols list: `/protocols` (priority: 0.9, weekly)
- All protocols: `/protocols/{id}` (priority: 0.8, monthly, from database)
- Dynamic based on protocol creation timestamp

**Robots Configuration:**
- Allow all public routes
- Disallow private/admin routes: /api/, /auth/, /today/, /settings/, /analytics/, /onboarding/
- Block AI training bots: GPTBot, ChatGPT-User
- Sitemap reference included

**Last Review**: 2025-12-10

---

## Phase 5.02: Growth - Blog Content System (Dec 2025)

**Status:** Complete

**New Blog System:**
- `lib/blog/articles.ts` - Article fetching & parsing with Zod validation (articleFrontmatterSchema)
- `lib/blog/category-colors.ts` - Category-to-color mapping (sleep/focus/energy/fitness)
- `content/blog/*.mdx` - 8 foundational blog articles covering all protocol categories
  - Morning sunlight science (Sleep)
  - Deep work focus blocks (Focus)
  - Intermittent fasting guide (Energy)
  - Zone 2 cardio guide (Fitness)
  - Cold exposure benefits (Fitness)
  - Sleep temperature optimization (Sleep)
  - Blood sugar stable energy (Energy)
  - Resistance training essentials (Fitness)

**New Blog Routes:**
- `app/blog/page.tsx` - Blog landing page with article listings (category badges, publish date, reading time)
- `app/blog/[slug]/page.tsx` - Individual article pages with:
  - Dynamic metadata generation (title, description, OpenGraph, Twitter cards)
  - Article schema structured data (schema.org/Article)
  - MDX content rendering with syntax highlighting
  - Related protocols section (links to relevant protocol pages)
  - Category badge and author attribution
- `app/blog/feed.xml/route.ts` - RSS 2.0 feed endpoint with all articles

**Article Frontmatter Schema:**
- title: required string
- description: required string
- date: required YYYY-MM-DD format
- category: sleep/focus/energy/fitness/general
- author: required string
- readingTime: optional (e.g., "5 min read")
- relatedProtocols: optional array of protocol slugs
- image: optional URL for social sharing

**Features:**
- Static blog page generation (revalidate every hour)
- Server-side article parsing with gray-matter
- Zod validation for article metadata
- RSS feed with proper XML formatting (CDATA for special chars)
- Category-based color coding (inherited from design system)
- Related protocols component for internal linking
- OpenGraph & Twitter card support for social sharing
- Article schema JSON-LD for search engines

**SEO & Accessibility:**
- Blog RSS link in blog page header
- Alt text & metadata in RSS feed
- Sitemap integration (blog articles discoverable via /sitemap.ts)
- Cache headers on RSS feed (s-maxage=3600)
- Dynamic static params generation for article routes

**Last Review**: 2025-12-10

---

## Phase 4: Social Sharing (Dec 2025)

**Status:** Complete

**New Sharing System:**
- `lib/sharing/utm.ts` - UTM parameter builder with referral code support
  - `buildShareUrl()` - Construct share URLs with utm_source/medium/campaign/content
  - `getProtocolShareUrl()` - Protocol-specific share URLs
  - `getStackShareUrl()` - Stack-specific share URLs
  - Support for optional referral codes for tracking conversions

- `lib/sharing/social-links.ts` - Platform-specific share URL generators
  - `getTwitterShareUrl()` - Twitter/X intent URL with text + link
  - `getFacebookShareUrl()` - Facebook share dialog with URL
  - `getLinkedInShareUrl()` - LinkedIn share with URL
  - `getWhatsAppShareUrl()` - WhatsApp share with text + link
  - `getEmailShareUrl()` - mailto: with subject & body

**New Share Components:**
- `components/sharing/share-button.tsx`
  - Trigger button with Share2 icon
  - Attempts Web Share API first (mobile/modern browsers)
  - Fallback to ShareDialog on unsupported browsers
  - Props: title, description, url, referralCode, variant, size
  - Toast notifications for success/error

- `components/sharing/share-dialog.tsx`
  - Modal with copy-to-clipboard primary action
  - 5 social platform buttons (Twitter, Facebook, LinkedIn, WhatsApp, Email)
  - Display shareable URL with one-click copy
  - Custom SVG icons for social platforms (no external deps)
  - Referral code badge messaging
  - Dark mode support with hover effects

- `components/sharing/copy-link-button.tsx`
  - Standalone button for copying URL to clipboard
  - Can be used independently or within dialog
  - Checkbox state feedback (Check icon after copy)
  - SSR-safe navigator.clipboard handling
  - Props: url, referralCode, source, variant, size

**Integration Points:**
- Protocol detail page (`[id]/page.tsx`) - Share button in header next to back button
- Protocol card modal - Share button alongside "Add to Stack" action
- URL-based share tracking - utm_source parameter tracks platform (twitter, facebook, etc.)
- Referral tracking - ref= parameter included when referralCode provided

**Features:**
- Web Share API integration for native mobile share sheets
- Fallback dialog for desktop/unsupported browsers
- UTM parameter tracking for analytics (source, medium, campaign, content)
- Referral code support for conversion tracking
- Copy-to-clipboard with visual feedback
- Dark mode support
- Accessible labels & ARIA attributes
- Toast notifications via Sonner

**Last Review**: 2025-12-10

---

## Phase 3: Monetization (Dec 2025)

**Status:** Complete

**New Monetization System:**
- `lib/stripe.ts` - Stripe client initialization and utilities
  - `stripe` - Stripe instance (API v2025-11-17.clover)
  - `STRIPE_PRICES` - Price ID mapping (monthly/annual)
  - `getPlanFromPriceId()` - Convert price ID to tier ('pro' or 'free')
  - `isActiveSubscription()` - Check if subscription status is active/trialing

- `lib/subscription.ts` - Feature gating logic
  - `FREE_LIMITS` constant (maxStacks: 3, historyDays: 7, etc)
  - `PRO_FEATURES` constant (unlimited, advanced features enabled)
  - `getUserTier()` - Fetch current tier from profiles table
  - `canCreateStack()` - Check if user can create another stack
  - `hasAdvancedAnalytics()` - Pro-tier feature gate
  - `getHistoryDaysLimit()` - Get history window based on tier
  - `isPro()` / `getFeatureLimits()` - Helper functions
  - `requirePro()` - Throw error if not pro (for server actions)

- `actions/subscription.ts` - Server actions for subscription management
  - `createCheckoutSession()` - Generate Stripe Checkout URL
  - `updateSubscription()` - Sync subscription from webhook
  - `cancelSubscription()` - Handle subscription cancellation

- `app/api/webhooks/stripe/route.ts` - Webhook handler
  - Verify webhook signature (STRIPE_WEBHOOK_SECRET)
  - Idempotency check via webhook_events table
  - Process events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
  - Update subscriptions + profiles.subscription_tier

**Database Schema (Phase 3):**
- `profiles.stripe_customer_id` (TEXT, unique) - Reference to Stripe customer
- `subscriptions` table:
  - id, user_id, stripe_subscription_id (unique), stripe_customer_id
  - status (active, past_due, canceled, unpaid, incomplete, trialing)
  - price_id (monthly or annual price)
  - current_period_start/end, cancel_at_period_end, canceled_at
  - created_at, updated_at
  - Indexes: user_id, stripe_customer_id, status
  - RLS: Users can read own subscriptions only
  - Trigger: Auto-update updated_at on changes

- `webhook_events` table (idempotency):
  - id, stripe_event_id (unique), event_type, status
  - payload (JSONB), error_details, created_at
  - Index: stripe_event_id
  - RLS: Service role only (no user access)

**UI Components:**
- `components/subscription/pricing-modal.tsx`
  - Displays pricing options ($12/mo, $99/yr)
  - Calls createCheckoutSession() on button click
  - Stripe Checkout redirect
  - Responsive modal layout

- `components/subscription/subscription-card.tsx`
  - Shows current tier, renewal date, status
  - Upgrade/downgrade/cancel buttons
  - Pro badge display

**Feature Gating Pattern:**
```typescript
// Free tier limits
const tier = await getUserTier();
const canCreate = tier === 'pro' || stackCount < FREE_LIMITS.maxStacks;

// Pro features
if (user.subscription_tier === 'pro') {
  // Enable advanced analytics, AI recommendations, etc
}
```

**Pricing:**
- Free: $0 (3 stacks, 7-day history)
- Pro Monthly: $12/mo (unlimited)
- Pro Annual: $99/yr (unlimited)

**Stripe Integration Flow:**
1. User clicks "Upgrade to Pro"
2. Call createCheckoutSession() server action
3. Stripe API creates checkout session
4. Redirect to Stripe Checkout URL
5. User completes payment
6. Stripe sends webhook events
7. Webhook handler updates subscriptions + profiles
8. profiles.subscription_tier updated to 'pro'
9. Feature gates check tier and grant access

**Security:**
- Webhook signature verification (STRIPE_WEBHOOK_SECRET)
- Idempotency via webhook_events table (prevents duplicate processing)
- RLS ensures users only access own subscription data
- No card data on our servers (Stripe handles all PCI compliance)
- Stripe as source of truth - webhook-driven sync

**Last Review**: 2025-12-11
