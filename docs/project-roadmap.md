# MyProtocolStack - Project Roadmap

**Last Updated:** 2025-12-10
**Version:** 0.2.2
**Status:** Phase 2 Complete, Phase 5 In Progress (Growth - SEO Foundation & Blog Content Complete)

## Executive Summary

MyProtocolStack is a micro-SaaS for building and tracking personalized health protocols. This roadmap outlines the path from MVP to $10K MRR.

---

## Phase Overview

### Phase 1: MVP Foundation
**Status:** ✅ Complete
**Goal:** Functional app with core features

**Deliverables:**
- User authentication (Google OAuth + Magic Link)
- Protocol library (30 curated protocols)
- Stack builder (Create, edit, delete)
- Daily tracking interface with optimistic updates
- Basic analytics (adherence %, streak tracking)
- Mobile-responsive design
- Dark/light theme support

**Implemented:**
- [x] Next.js 16 (App Router) + TypeScript 5
- [x] Supabase PostgreSQL + Auth (SSR)
- [x] Protocol, Stack, Tracking data models
- [x] Protocol list with filtering & search
- [x] Stack builder with form validation
- [x] Daily view with real-time sync
- [x] Dashboard with header & navigation
- [x] Auth flow (login/callback)

---

### Phase 2: Engagement & Polish
**Status:** ✅ Complete
**Goal:** Improve retention, user feedback integration

**Deliverables:**
- Streak visualization & badges ✅
- Enhanced analytics dashboard ✅
- Basic onboarding experience ✅
- Advanced search & filtering ✅

**Implemented:**
- [x] Streak calculation & display
- [x] Badge system for milestones
- [x] Confetti animations on streak milestones
- [x] Analytics dashboard with multiple chart types
- [x] Date range filtering (7/30/90 days)
- [x] Category-level analytics
- [x] Day-of-week heatmap
- [x] Full-text search across protocol name/description
- [x] Multi-select category filtering
- [x] Difficulty level filtering
- [x] Duration range filtering
- [x] Sort options (name, difficulty, duration, popularity)
- [x] URL state management for shareable filter links
- [x] Mobile-friendly filter drawer
- [x] Filter count badge and clear all functionality

---

### Phase 3: Monetization
**Status:** 📋 Planned
**Goal:** Launch Pro tier, first revenue

**Deliverables:**
- Stripe integration
- Pro tier features (unlimited stacks, advanced analytics)
- Paywall & feature gating
- Subscription management UI
- Upgrade prompts

**Technical Tasks:**
- [ ] Stripe Checkout integration
- [ ] Webhook handlers (checkout.session.completed)
- [ ] Feature gating logic
- [ ] Subscription status UI
- [ ] Upgrade/downgrade flows

---

### Phase 4: Analytics Dashboard (In Progress)
**Status:** 🔄 In Progress
**Goal:** Advanced user insights and data visualization

**Deliverables:**
- Full analytics dashboard with charts ✅
- Adherence tracking over time ✅
- Protocol-level completion analysis ✅
- Day-of-week patterns ✅
- Category breakdowns ✅

**Technical Implementation:**
- [x] Recharts integration for visualizations
- [x] Server-side analytics queries with PostgreSQL aggregations
- [x] Date range selector (7/30/90 days)
- [x] Performance index on tracking table
- [x] Skeleton loading states
- [x] Responsive chart layouts

**Next Phase:** Growth (SEO, content, referral program)

---

### Phase 5: Growth
**Status:** 🔄 In Progress
**Goal:** Scale to $5K+ MRR

**Deliverables:**
- SEO optimization ✅
- Content/blog ✅
- Referral program
- Product Hunt launch
- Community building

**Technical Tasks:**
- [x] SEO meta tags (Phase 01 Complete - 251210)
- [x] Blog/content section (Phase 02 Complete - 251210)
- [ ] Referral tracking
- [x] Social sharing (Phase 04 Complete - 251210)
- [ ] Public profiles

---

### Phase 6: Advanced Features
**Status:** 📋 Future
**Goal:** Differentiation and retention

**Deliverables:**
- AI protocol recommendations
- Wearable integrations
- Outcome correlations
- Social/community features

**Technical Tasks:**
- [ ] OpenAI integration
- [ ] Oura/Apple Health APIs
- [ ] Correlation analytics
- [ ] Follow/share features

---

## MVP Feature Breakdown

### Core Features (Must Have)

| Feature | Priority | Complexity | Status |
|---------|----------|------------|--------|
| Google Auth | P0 | Low | 📋 |
| Protocol List | P0 | Low | 📋 |
| Protocol Detail | P0 | Low | 📋 |
| Create Stack | P0 | Medium | 📋 |
| Edit Stack | P0 | Medium | 📋 |
| Daily View | P0 | Medium | 📋 |
| Mark Complete | P0 | Low | 📋 |
| Basic Stats | P0 | Low | 📋 |

### Nice to Have (MVP+)

| Feature | Priority | Complexity | Status |
|---------|----------|------------|--------|
| Search Protocols | P1 | Low | 📋 |
| Filter by Category | P1 | Low | 📋 |
| Streak Display | P1 | Low | 📋 |
| Notes on Tracking | P1 | Low | 📋 |
| Dark Mode | P2 | Low | 📋 |

---

## Data Model Overview

### Protocols
```
- id
- name
- description
- category (sleep, focus, energy, fitness)
- difficulty (easy, medium, hard)
- duration_minutes
- frequency (daily, weekly)
- science_summary
- steps[]
- created_at
```

### Stacks
```
- id
- user_id
- name
- description
- protocols[] (ordered)
- schedule (daily, specific_days)
- is_active
- created_at
```

### Tracking
```
- id
- user_id
- stack_id
- protocol_id
- completed_at
- notes (optional)
- date
```

### Users
```
- id
- email
- name
- avatar_url
- subscription_tier (free, pro)
- created_at
```

---

## Content Plan (30 MVP Protocols)

### Sleep (8 protocols)
1. Morning sunlight exposure
2. Caffeine cutoff timing
3. Blue light blocking
4. Temperature optimization
5. Consistent sleep/wake time
6. Magnesium supplementation
7. No screens 1hr before bed
8. Evening walk

### Focus (7 protocols)
1. 90-minute deep work blocks
2. Strategic caffeine timing
3. Cold exposure for alertness
4. Movement breaks
5. Ultradian rhythm work
6. Environment optimization
7. Phone-free focus blocks

### Energy (8 protocols)
1. 16:8 intermittent fasting
2. Protein-first breakfast
3. Blood sugar stability
4. Hydration protocol
5. No seed oils
6. Afternoon sunlight
7. Power nap protocol
8. Evening meal timing

### Fitness (7 protocols)
1. Zone 2 cardio weekly
2. Resistance training
3. Daily walking (10K steps)
4. Cold/heat exposure
5. Mobility routine
6. Recovery protocol
7. Progressive overload tracking

---

## Success Milestones

| Milestone | Target | Metric |
|-----------|--------|--------|
| MVP Launch | +2 months | App live |
| 100 Users | +3 months | Signups |
| $500 MRR | +4 months | Revenue |
| 1,000 Users | +6 months | Signups |
| $2,500 MRR | +8 months | Revenue |
| 5,000 Users | +12 months | Signups |
| $10,000 MRR | +18 months | Revenue |

---

## Marketing Channels

### Phase 1: Organic/Free
- Reddit (r/Biohackers, r/productivity, r/sleep)
- Twitter/X build in public
- Indie Hackers community
- Product Hunt launch

### Phase 2: Content
- SEO blog posts
- Protocol breakdown videos
- Newsletter

### Phase 3: Paid
- Podcast sponsorships
- Twitter/X ads
- Influencer partnerships

---

## Tech Stack Decisions

| Component | Choice | Reason |
|-----------|--------|--------|
| Framework | Next.js 14 | App Router, RSC, fast |
| Database | Supabase | Free tier, real-time, auth |
| Auth | Supabase Auth | Built-in, Google OAuth |
| Styling | Tailwind CSS | Rapid development |
| UI Components | shadcn/ui | Beautiful, customizable |
| Hosting | Vercel | Free tier, fast deploys |
| Payments | Stripe | Industry standard |
| Email | Resend | Developer-friendly |
| Analytics | PostHog | Free tier, powerful |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low engagement | High | Medium | Notifications, streaks |
| No conversions | High | Medium | A/B test pricing, value |
| Competition | Medium | Low | Niche focus, speed |
| Technical debt | Medium | Medium | Code standards, reviews |

---

## Current Focus

### Immediate Next Steps
1. Register domain (myprotocolstack.com)
2. Set up Next.js project
3. Configure Supabase
4. Design database schema
5. Create protocol content (30 items)

---

## References

- [Project Overview PDR](./project-overview-pdr.md)
- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)

---

---

## Phase 5.04: Growth - Social Sharing (Complete - 2025-12-10)

**Status:** ✅ Complete

**Deliverables Completed:**
- Web Share API component with native share sheet support
- Fallback share dialog with Twitter, Facebook, LinkedIn, WhatsApp, Email buttons
- UTM parameter generation for tracking share attribution
- Copy-to-clipboard functionality with feedback
- Integration with referral codes for share links
- Social link URL generators for all platforms
- Code review completed with all critical fixes applied

**Technical Implementation:**
- `lib/sharing/utm.ts` - UTM parameter builder functions
- `lib/sharing/social-links.ts` - Platform-specific intent URL generators
- `components/sharing/share-button.tsx` - Main share component with Web Share API
- `components/sharing/share-dialog.tsx` - Fallback dialog for desktop browsers
- `components/sharing/copy-link-button.tsx` - Standalone copy-to-clipboard button

**Features:**
- Native share sheet on mobile/modern browsers
- Fallback dialog for unsupported browsers
- UTM tracking for analytics attribution
- Referral code inclusion in share links
- Toast notifications for feedback
- Social platform color-coded buttons

---

## Phase 5.01: Growth - SEO Foundation (Complete - 2025-12-10)

**Deliverables Completed:**
- Dynamic sitemap generation with protocol changeFrequency and priority
- Robots.txt configuration (allow public, disallow private routes, block AI bots)
- Root metadata with Organization schema
- Dynamic OpenGraph/Twitter card images
- Protocol detail pages with HowTo schema
- SEO meta tags and structured data

---

## Phase 5.02: Growth - Blog Content System (Complete - 2025-12-10)

**Status:** ✅ Complete

**Deliverables:**
- Blog landing page (`/blog`) with article listings, category badges, publication dates
- Individual article pages (`/blog/[slug]`) with full MDX rendering
- RSS 2.0 feed (`/blog/feed.xml`) for subscription
- 8 foundational blog articles covering all protocol categories

**Technical Implementation:**
- `lib/blog/articles.ts` - Article parser with Zod validation
  - articleFrontmatterSchema validation
  - getAllArticles() - Parse & sort all articles by date
  - getArticleBySlug() - Individual article fetching
  - getArticlesByCategory() - Filter by sleep/focus/energy/fitness

- `content/blog/` - 8 MDX articles (YAML frontmatter)
  1. morning-sunlight-science.mdx (Sleep)
  2. deep-work-focus-blocks.mdx (Focus)
  3. intermittent-fasting-guide.mdx (Energy)
  4. zone-2-cardio-guide.mdx (Fitness)
  5. cold-exposure-benefits.mdx (Fitness)
  6. sleep-temperature-optimization.mdx (Sleep)
  7. blood-sugar-stable-energy.mdx (Energy)
  8. resistance-training-essentials.mdx (Fitness)

- Routes & Pages:
  - `app/blog/page.tsx` - Blog listing with filtering by category
  - `app/blog/[slug]/page.tsx` - Article detail with Article schema JSON-LD
  - `app/blog/feed.xml/route.ts` - RSS feed generation

**Article Metadata:**
- title, description (required)
- date (YYYY-MM-DD format)
- category (sleep/focus/energy/fitness/general)
- author, readingTime, relatedProtocols[], image (optional)

**SEO Features:**
- Dynamic metadata generation (title, description, OpenGraph)
- Article schema (schema.org/Article) for rich snippets
- RSS feed with CDATA encoding for special characters
- Related protocols internal linking
- Blog RSS link in page header
- Article URL caching (s-maxage=3600)

**Blog System Benefits:**
- Content marketing for SEO keyword targeting
- Internal linking to protocol pages (engagement boost)
- Subscriber acquisition via RSS feed
- Category-based content organization
- Foundation for future content features (search, filtering, comments)

---

**Maintained By:** MyProtocolStack
**Last Review:** 2025-12-10
