# Phase 3: Streak System

## Context Links

- [Main Plan](./plan.md)
- [Research: Streaks & Analytics](./research/researcher-251209-streaks-analytics.md)
- [Code Standards](/docs/code-standards.md)

---

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | ✅ DONE |
| Description | Consecutive day tracking, streak counter display, badge milestones (7, 30, 100 days) |
| Est. Effort | 2-3 days |
| Completed | 2025-12-09 |

---

## Key Insights from Research

- Loss aversion: streaks 2.3x more engaging post-7-day mark
- Combined streak + milestone mechanics boost DAU 40-60%
- 1-day grace period balances forgiving vs enabling laziness
- Total reset to 0 creates stronger psychological incentive
- Timezone handling critical - use user's local timezone
- Celebration animations essential for engagement

---

## Requirements

### Functional

- Calculate consecutive days with completed protocols
- Display current streak in header and /today view
- Badge unlocks at 7, 30, 100 days
- 1-day grace period before reset
- Streak counter with fire emoji
- Celebration modal on milestone unlock

### Non-Functional

- Streak calculated per-stack (not global)
- Update on protocol completion
- Handle timezone correctly
- Confetti animation on milestones

---

## Architecture

```text
supabase/migrations/
  └── 20251209171037_create_streak_tables.sql

packages/database/
  └── src/types.ts                # UserStreak, UserBadge, BadgeType

apps/web/
  ├── components/streaks/
  │   ├── streak-counter.tsx        # Display streak number
  │   ├── streak-badge.tsx          # Badge icon
  │   └── streak-milestone-modal.tsx # Celebration popup
  ├── actions/
  │   └── streaks.ts                # Update streak on completion
  └── lib/
      ├── streak-calculator.ts      # Streak logic
      └── __tests__/
          └── streak-calculator.test.ts  # 25 unit tests
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `apps/web/components/tracking/today-view.tsx` | Display streak counter, trigger updates |
| `apps/web/app/(dashboard)/today/page.tsx` | Fetch streak data |
| `packages/database/src/types.ts` | Streak and Badge types |

---

## Database Changes

```sql
-- Streak tracking per user per stack
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  grace_period_used BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stack_id)
);

-- Badge tracking
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'streak_7', 'streak_30', 'streak_100'
  stack_id UUID REFERENCES stacks(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type, stack_id)
);

-- Indexes + RLS included
```

---

## Todo List

- [x] Create DB migration for user_streaks and user_badges
- [x] Update types/database.ts with streak types
- [x] Create lib/streak-calculator.ts
- [x] Create actions/streaks.ts
- [x] Create components/streaks/streak-counter.tsx
- [x] Create components/streaks/streak-badge.tsx
- [x] Install canvas-confetti package
- [x] Create components/streaks/streak-milestone-modal.tsx
- [x] Update today-view.tsx with streak display
- [x] Add milestone modal trigger on badge unlock
- [x] Add grace period "at risk" indicator
- [x] Test streak calculation edge cases (25 tests)
- [x] Test timezone handling

---

## Success Criteria

- [x] Streak increments on daily completion
- [x] Streak resets after 2+ days missed (with grace)
- [x] Badge unlocks at 7, 30, 100 days
- [x] Confetti plays on milestone (with a11y prefers-reduced-motion check)
- [x] Streak displays in today view
- [x] Per-stack streak tracking works
- [x] Grace period indicator shows when active

---

## Implementation Notes

### Timezone Handling

Client passes browser timezone to server action:
```typescript
const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
await updateStreak(stackId, clientTimezone);
```

### Streak Update Trigger

Streak updates when ALL protocols in a stack are completed for the day (not on each protocol toggle). This is handled in `today-view.tsx` with dedup logic using `${stackId}-${date}` key.

### A11y Considerations

Confetti animation respects `prefers-reduced-motion` media query:
```typescript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!prefersReducedMotion) fireConfetti();
```

---

## Test Results

```
PASS apps/web/lib/__tests__/streak-calculator.test.ts
  Streak Calculator
    calculateStreak (7 tests)
    milestone badges (5 tests)
    longest streak tracking (2 tests)
    isStreakAtRisk (7 tests)
    edge cases (4 tests)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
```

---

## Files Changed

| File | Action |
|------|--------|
| `supabase/migrations/20251209171037_create_streak_tables.sql` | Created |
| `packages/database/src/types.ts` | Modified |
| `apps/web/lib/streak-calculator.ts` | Created |
| `apps/web/lib/__tests__/streak-calculator.test.ts` | Created |
| `apps/web/actions/streaks.ts` | Created |
| `apps/web/components/streaks/streak-counter.tsx` | Created |
| `apps/web/components/streaks/streak-badge.tsx` | Created |
| `apps/web/components/streaks/streak-milestone-modal.tsx` | Created |
| `apps/web/components/tracking/today-view.tsx` | Modified |
| `apps/web/app/(dashboard)/today/page.tsx` | Modified |
| `apps/web/package.json` | Modified (canvas-confetti) |
| `package.json` | Modified (jest test script) |
| `jest.config.js` | Created |

---

## Resolved Questions

1. Grace period: 1 day or 2 days? → **1 day per research**
2. Show all earned badges or just current? → **Just unlocked badges displayed**
3. Global streak or per-stack? → **Per-stack only**
4. Confetti a11y concern → **Respects prefers-reduced-motion**
5. Timezone storage → **Passed from client, stored in streak record**
6. Jest setup → **Added jest.config.js + ts-jest**
