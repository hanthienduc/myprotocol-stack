# Project Overview & Product Development Requirements (PDR)

**Project Name**: MyProtocolStack
**Version**: 0.1.0
**Last Updated**: 2025-12-05
**Status**: Initial Planning

## Executive Summary

MyProtocolStack is a micro-SaaS application that helps users build, manage, and track personalized health protocols. Users browse a curated library of science-backed protocols, combine them into daily "stacks," and track adherence to optimize their health routines.

## Problem Statement

### The Pain Points
1. **Information Overload** - Health advice scattered across podcasts, YouTube, books
2. **No Personalization** - Generic apps don't allow custom protocol combinations
3. **Poor Tracking** - No way to correlate specific protocols with results
4. **Forgetfulness** - Hard to remember 10+ daily health habits
5. **Analysis Paralysis** - Too many options, unclear what to prioritize

### Who Has This Problem
- Listeners of health podcasts (Huberman Lab, Found My Fitness, etc.)
- Biohackers and self-optimizers
- Busy professionals wanting systematic health routines
- People recovering from health issues seeking protocols

## Solution

A personal protocol management system with three core functions:

### 1. Protocol Library
Curated, science-backed protocols organized by goal:
- Sleep optimization
- Focus & productivity
- Energy & metabolism
- Fitness & recovery
- Longevity & aging
- Stress & mental health

### 2. Stack Builder
Combine multiple protocols into a personalized daily routine:
- Morning routine protocols
- Work/focus protocols
- Evening/wind-down protocols
- Weekly protocols (fasting, exercise)

### 3. Adherence Tracking
Simple daily check-ins:
- Mark protocols complete
- Track streaks
- Log outcomes (energy 1-10, sleep quality, mood)
- See correlations over time

## Target Users

### Primary Persona: The Optimizer (Alex, 32)
- Listens to 5+ health podcasts weekly
- Has tried multiple health apps, none stuck
- Wants to implement advice systematically
- Budget: Will pay for tools that work
- Pain: "I know WHAT to do, I just can't track it all"

### Secondary Persona: The Beginner (Sam, 28)
- Recently started caring about health
- Overwhelmed by conflicting advice
- Wants curated, trustworthy protocols
- Pain: "Where do I even start?"

### Tertiary Persona: The Professional (Jordan, 45)
- High-stress job, limited time
- Wants maximum ROI on health habits
- Values efficiency and systems
- Pain: "I need a system, not more information"

## Key Features

### MVP Features (v1.0)

#### 1. Protocol Library
- 30+ curated protocols at launch
- Categories: Sleep, Focus, Energy, Fitness
- Each protocol includes:
  - Name & description
  - Science summary (1-2 sentences)
  - Implementation steps
  - Difficulty level
  - Time required

#### 2. Stack Builder
- Create custom stacks
- Add/remove protocols
- Set daily/weekly schedule
- Reorder protocols
- Preset stacks for beginners

#### 3. Daily Tracking
- Today's protocols view
- One-tap completion
- Streak tracking
- Simple notes

#### 4. Basic Analytics
- Weekly adherence %
- Streak history
- Protocol completion rates

### Pro Features (v1.1+)

#### 5. Outcome Tracking
- Daily energy/mood/sleep scores
- Correlation analysis
- "What's working" insights

#### 6. AI Recommendations
- Suggest protocols based on goals
- Optimize stack order
- Personalized timing suggestions

#### 7. Wearable Integration
- Oura Ring sync
- Apple Health sync
- Whoop sync
- Auto-track sleep protocols

#### 8. Social Features
- Share stacks publicly
- Follow other users' stacks
- Community protocol ratings

## Technical Requirements

### Functional Requirements

**FR1: User Authentication**
- Google OAuth login
- Apple Sign-In
- Email/password option
- Session persistence

**FR2: Protocol Management**
- CRUD operations for protocols (admin)
- Browse/search protocols (user)
- Filter by category, difficulty, time
- Bookmark favorite protocols

**FR3: Stack Management**
- Create unlimited stacks (Pro) / 3 stacks (Free)
- Add protocols to stack
- Set schedule (daily, weekly, specific days)
- Reorder protocols within stack

**FR4: Tracking System**
- Daily check-in view
- Mark complete/incomplete
- Add optional notes
- View history

**FR5: Analytics**
- Adherence percentage calculations
- Streak tracking
- Basic visualizations

**FR6: Subscription Management**
- Stripe integration
- Free vs Pro tier enforcement
- Upgrade/downgrade flows

### Non-Functional Requirements

**NFR1: Performance**
- Page load < 2 seconds
- API response < 500ms
- Offline-capable (PWA)

**NFR2: Mobile-First**
- Responsive design
- Touch-optimized
- Works on all screen sizes

**NFR3: Security**
- HTTPS everywhere
- Secure authentication
- No sensitive health data stored

**NFR4: Reliability**
- 99.9% uptime
- Daily backups
- Error tracking

## Business Model

### Pricing Strategy

**Free Tier**
- 3 active stacks
- 15 protocols access
- Basic tracking
- 7-day history

**Pro Tier - $9.99/month or $79/year**
- Unlimited stacks
- Full protocol library
- Advanced analytics
- Outcome correlations
- AI recommendations
- Wearable sync
- Priority support

### Revenue Projections

| Milestone | Free Users | Pro (5% conv) | MRR |
|-----------|------------|---------------|-----|
| Month 3 | 500 | 25 | $250 |
| Month 6 | 2,000 | 100 | $1,000 |
| Month 12 | 10,000 | 500 | $5,000 |
| Month 18 | 25,000 | 1,250 | $12,500 |

### Customer Acquisition

**Phase 1: Organic**
- SEO: "morning routine protocol", "huberman sleep protocol"
- Reddit: r/Biohackers, r/productivity, r/sleep
- Twitter/X: Build in public
- Product Hunt launch

**Phase 2: Content**
- Blog: Protocol breakdowns
- YouTube: Protocol explanations
- Newsletter: Weekly protocol tips

**Phase 3: Partnerships**
- Podcast sponsorships
- Health influencer collaborations
- Affiliate program for coaches

## Success Metrics

### Product Metrics
- Daily Active Users (DAU)
- Protocol completion rate (target: 60%+)
- Stack creation rate
- Session duration
- Feature adoption rates

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Free-to-Pro conversion rate (target: 5%)
- Churn rate (target: < 5%/month)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)

### Health Metrics (User Outcomes)
- Self-reported energy improvements
- Sleep quality trends
- Habit adherence over time

## Competitive Analysis

### Direct Competitors

| Competitor | Strength | Weakness | Our Advantage |
|------------|----------|----------|---------------|
| Habitify | Beautiful UI | No protocol focus | Protocol-specific |
| Streaks | Simple | Too basic | More depth |
| Way of Life | Flexible | No guidance | Curated protocols |
| Fabulous | Guided routines | Expensive, rigid | Customizable |

### Indirect Competitors
- Notion templates
- Apple Health
- Oura app
- Generic habit trackers

### Differentiation
1. **Protocol-first** - Not generic habits, specific health protocols
2. **Stack concept** - Combine protocols intelligently
3. **Science-backed** - Every protocol has citations
4. **Outcome correlation** - See what's actually working

## Risks & Mitigation

### Risk 1: Low Engagement
**Impact**: High | **Likelihood**: Medium
**Mitigation**: Notifications, streaks, gamification, email reminders

### Risk 2: Protocol Quality
**Impact**: High | **Likelihood**: Low
**Mitigation**: Cite sources, expert review, user ratings

### Risk 3: Competition from Big Players
**Impact**: Medium | **Likelihood**: Low
**Mitigation**: Niche focus, community, rapid iteration

### Risk 4: Subscription Fatigue
**Impact**: Medium | **Likelihood**: Medium
**Mitigation**: High value Pro tier, annual discount, lifetime option

## Initial Scope (MVP)

### In Scope
- User authentication (Google)
- Protocol library (30 protocols)
- Stack builder (create, edit, delete)
- Daily tracking (complete/incomplete)
- Basic analytics (adherence %)
- Free tier functionality
- Mobile-responsive web app

### Out of Scope (v1)
- Pro subscription/payments
- AI recommendations
- Wearable integrations
- Social features
- Native mobile apps
- Outcome correlations

## Development Phases

### Phase 1: Foundation (MVP)
- Auth, database, basic UI
- Protocol library
- Stack CRUD
- Daily tracking

### Phase 2: Engagement
- Notifications
- Streaks
- Better analytics
- Onboarding flow

### Phase 3: Monetization
- Stripe integration
- Pro tier features
- Paywall implementation

### Phase 4: Growth
- SEO optimization
- Content marketing
- Referral program

## Dependencies

### External Services
- Supabase (database, auth)
- Vercel (hosting)
- Stripe (payments)
- OpenAI (AI features, future)
- Resend (email)

### Data Requirements
- Protocol content (30+ protocols)
- Category taxonomy
- Difficulty ratings
- Time estimates

## Related Documentation

- [System Architecture](./system-architecture.md)
- [Project Roadmap](./project-roadmap.md)
- [Code Standards](./code-standards.md)
- [Codebase Summary](./codebase-summary.md)

## Unresolved Questions

1. **Protocol Sources**: Create original content or curate/summarize existing?
2. **Legal**: Any liability concerns with health protocol recommendations?
3. **Wearables**: Which integration to prioritize first (Oura vs Apple Health)?
4. **Pricing**: $9.99 vs $7.99 vs $12.99 for Pro tier?
5. **Onboarding**: Quiz-based stack recommendation vs manual selection?
