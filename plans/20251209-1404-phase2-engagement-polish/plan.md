# Phase 2: Engagement & Polish - Implementation Plan

**Created**: 2025-12-09
**Status**: Planning Complete
**Priority**: P0-P3 across 6 features
**Estimated Duration**: 4-5 weeks

---

## Overview

Phase 2 builds engagement features on MVP foundation: onboarding, favorites, streaks, analytics, notifications, search. Focus on user retention and polish.

## Research Context

- [Onboarding & Notifications Research](./research/researcher-251209-onboarding-notifications.md)
- [Streaks & Analytics Research](./research/researcher-251209-streaks-analytics.md)

---

## Phases Summary

| # | Phase | Priority | Status | Progress | Link |
|---|-------|----------|--------|----------|------|
| 1 | Onboarding Quiz | P0 | ✅ Complete | 100% | [phase-01](./phase-01-onboarding-quiz.md) |
| 2 | Protocol Favorites | P1 | Pending | 0% | [phase-02](./phase-02-protocol-favorites.md) |
| 3 | Streak System | P1 | ✅ Complete | 100% | [phase-03](./phase-03-streak-system.md) |
| 4 | Analytics Dashboard | P2 | ✅ Complete | 100% | [phase-04](./phase-04-analytics-dashboard.md) |
| 5 | Notification System | P2 | Pending | 0% | [phase-05](./phase-05-notification-system.md) |
| 6 | Advanced Search | P3 | Pending | 0% | [phase-06](./phase-06-advanced-search.md) |

---

## Implementation Order

**Week 1-2**: P0 + P1 features
1. Onboarding Quiz (P0) - New user conversion
2. Protocol Favorites (P1) - Quick engagement win
3. Streak System (P1) - Retention hook

**Week 3-4**: P2 features
4. Analytics Dashboard (P2) - Engagement visibility
5. Notification System (P2) - Reminder infra

**Week 5**: P3 feature
6. Advanced Search (P3) - Discovery polish

---

## Key Technical Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Form library | React Hook Form + Zod | 73% smaller, active maintenance |
| Chart library | Recharts | MVP-friendly, React 19 compatible |
| Email | Resend | Dashboard monitoring, retry logic |
| Push | Web Push API | No vendor lock-in, free |
| Scheduling | Supabase pg_cron | Native, no external deps |
| State (quiz) | Context or Zustand | Cross-step state for wizard |

---

## New Database Tables Required

```sql
-- Phase 1: Add to profiles
favorite_protocol_ids UUID[]
onboarding_completed BOOLEAN
onboarding_profile JSONB

-- Phase 3: Streak tables
user_streaks (user_id, current_streak, longest_streak, last_activity_date)
user_badges (user_id, badge_type, unlocked_at)

-- Phase 5: Notifications
push_subscriptions (user_id, endpoint, keys, created_at)
notification_preferences (user_id, email_enabled, push_enabled, reminder_time)
```

---

## Success Metrics

- Onboarding completion rate > 80%
- 7-day streak activation > 40% of active users
- Daily active users +25%
- Email open rate > 30%

---

## Unresolved Questions

1. ~~Grace period: 1 or 2 days before streak reset?~~ → **Resolved: 1 day per research**
2. Notification frequency limits per user?
3. ~~Badge display: all earned or just current milestone?~~ → **Resolved: Just unlocked badges displayed**
4. iOS push limitations - email-only fallback?
