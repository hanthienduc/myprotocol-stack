# MyProtocolStack - Project Roadmap

**Last Updated:** 2025-12-05
**Version:** 0.1.0
**Status:** Initial Planning

## Executive Summary

MyProtocolStack is a micro-SaaS for building and tracking personalized health protocols. This roadmap outlines the path from MVP to $10K MRR.

---

## Phase Overview

### Phase 1: MVP Foundation
**Status:** 📋 Planned
**Goal:** Functional app with core features

**Deliverables:**
- User authentication (Google OAuth)
- Protocol library (30 protocols)
- Stack builder (CRUD)
- Daily tracking interface
- Basic analytics (adherence %)
- Mobile-responsive design

**Technical Tasks:**
- [ ] Next.js 14 project setup
- [ ] Supabase database + auth
- [ ] Protocol data model
- [ ] Stack data model
- [ ] Tracking data model
- [ ] Protocol list UI
- [ ] Stack builder UI
- [ ] Daily view UI
- [ ] Basic dashboard

---

### Phase 2: Engagement & Polish
**Status:** 📋 Planned
**Goal:** Improve retention and UX

**Deliverables:**
- Onboarding flow
- Push notifications (web)
- Streak system
- Improved analytics
- Email reminders
- Protocol search/filter

**Technical Tasks:**
- [ ] Onboarding quiz
- [ ] Web push notifications
- [ ] Streak calculation logic
- [ ] Analytics dashboard
- [ ] Email service (Resend)
- [ ] Search functionality

---

### Phase 3: Monetization
**Status:** 📋 Planned
**Goal:** Launch Pro tier, first revenue

**Deliverables:**
- Stripe integration
- Pro tier features
- Paywall implementation
- Subscription management
- Upgrade prompts

**Technical Tasks:**
- [ ] Stripe Checkout integration
- [ ] Webhook handlers
- [ ] Feature gating logic
- [ ] Subscription UI
- [ ] Cancel/upgrade flows

---

### Phase 4: Growth
**Status:** 📋 Planned
**Goal:** Scale to $5K+ MRR

**Deliverables:**
- SEO optimization
- Content/blog
- Referral program
- Product Hunt launch
- Community building

**Technical Tasks:**
- [ ] SEO meta tags
- [ ] Blog/content section
- [ ] Referral tracking
- [ ] Social sharing
- [ ] Public profiles

---

### Phase 5: Advanced Features
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

**Maintained By:** MyProtocolStack
**Last Review:** 2025-12-05
