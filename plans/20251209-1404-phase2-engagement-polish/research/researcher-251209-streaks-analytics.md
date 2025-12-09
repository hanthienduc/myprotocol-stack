# Research Report: Streak Systems & Analytics Dashboards
**Date:** 2025-12-09 | **Stack:** Next.js 15.1.4 + React 19 + Supabase + Tailwind CSS 4 + shadcn/ui

---

## 1. STREAK CALCULATION & GAMIFICATION

### Core Algorithm
**Streak Definition:** Consecutive day counter that increments only when user completes action on sequential days.

**Critical Implementation Details:**
- Store: `last_activity_date`, `current_streak`, `longest_streak`, `streak_updated_today` (boolean flag)
- **Timezone handling is THE blocker.** Server time creates unfair advantages; must convert to user's local timezone
- Grace period: Allow N missed days before reset (e.g., 2-day grace = 2 missed days before streak breaks)
- Reset strategies: Total reset to 0 (strong urgency) vs. Freeze at current value (softer penalty)

**Implementation Timeline:**
- Week 1: Basic logic (consecutive-day tracking)
- Week 2: Timezone handling (per-user TZ storage, local-time calculations)
- Week 3: Streak freezes (freeze grants, consumption limits)
- Week 4-5: Edge cases (DST transitions, midnight race conditions, historical calendar queries)

### Database Schema (Supabase PostgreSQL)
```sql
-- Core streak tracking
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  streak_updated_today BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stack_id)
);

-- Freeze mechanic (e.g., "skip 2 days penalty-free")
CREATE TABLE streak_freezes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stack_id UUID REFERENCES stacks(id),
  freeze_count INT DEFAULT 1,
  used_count INT DEFAULT 0,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stack_id, granted_at)
);

-- Badge/achievement tracking
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  badge_type TEXT, -- 'streak_7', 'streak_30', 'streak_100', 'perfect_week'
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Audit log for streak changes
CREATE TABLE streak_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stack_id UUID REFERENCES stacks(id),
  action TEXT, -- 'increment', 'reset', 'freeze_used', 'badge_unlocked'
  old_streak INT,
  new_streak INT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_stack_id ON user_streaks(stack_id);
CREATE INDEX idx_badges_user_id ON user_badges(user_id);
```

### Badge Achievement System
**Psychology:** Loss aversion makes streaks 2.3x more engaging post-7-day mark. Combined streak + milestone mechanics boost DAU 40-60%.

**Badge Tiers:**
- 7-day streak → "Momentum" badge
- 30-day streak → "Consistency" badge
- 100-day streak → "Master" badge
- Perfect week (7/7 completions) → Weekly milestone
- X consecutive perfect weeks → "Habit Master"

### Celebration Mechanics
**Essential for engagement—avoid silent achievements:**
- Confetti animation on milestone unlock
- Toast notification with badge preview
- Streak milestone modal with CTA to share
- Sound effect (optional, dismissible)

**React 19 + Tailwind CSS 4 Implementation:**
```tsx
// Celebrate streak milestone
import confetti from 'canvas-confetti';

export function StreakMilestoneNotification({ streak, badge }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    confetti({ particleCount: 100, spread: 70 });
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="border-2 border-green-500">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600">{badge.name}</h2>
          <p className="text-4xl font-black mt-4">{streak} days 🔥</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 2. ANALYTICS DASHBOARD COMPONENTS

### Chart Library Recommendation Matrix

| Library | Use Case | Pros | Cons |
|---------|----------|------|------|
| **Recharts** | Internal dashboards, MVP | JSX-native, SVG, ~25K GH stars, excellent docs | Limited customization vs. Visx |
| **Visx (Airbnb)** | Complex custom visualizations | Low-level D3 primitives, tree-shakeable, high perf | Steep learning curve, no pre-built charts |
| **Chart.js** (react-chartjs-2) | Simple charts, mobile-first | Easy integration, lightweight | Less React idiomatic |
| **ECharts** (echarts-for-react) | Large datasets (1000s points) | WebGL support, handles volume | Heavier bundle |

**Recommendation for MyProtocolStack:** **Recharts** is ideal because:
- Dashboard complexity is medium (7-10 charts)
- Need: Adherence trends, streak timeline, category breakdowns
- Quick time-to-market (MVP mentality)
- Works seamlessly with React 19 & Tailwind CSS 4

### Analytics SQL Patterns (Supabase)

```sql
-- Adherence rate by protocol over time
SELECT
  DATE_TRUNC('week', c.completed_at)::DATE AS week,
  p.name,
  COUNT(CASE WHEN c.is_completed THEN 1 END)::float / COUNT(*) AS adherence_rate
FROM completions c
JOIN protocols p ON c.protocol_id = p.id
WHERE c.user_id = $1
  AND c.completed_at >= NOW() - INTERVAL '90 days'
GROUP BY week, p.name
ORDER BY week DESC;

-- Streak timeline with milestones
SELECT
  DATE(created_at) AS day,
  current_streak,
  CASE
    WHEN current_streak % 7 = 0 THEN 'weekly_milestone'
    WHEN current_streak % 30 = 0 THEN 'monthly_milestone'
    ELSE NULL
  END AS milestone
FROM streak_audit
WHERE user_id = $1 AND action = 'increment'
ORDER BY day DESC;

-- Category performance (which protocol types working best?)
SELECT
  p.category,
  COUNT(CASE WHEN c.is_completed THEN 1 END)::float / COUNT(*) AS category_adherence,
  COUNT(DISTINCT p.id) AS protocol_count
FROM completions c
JOIN protocols p ON c.protocol_id = p.id
WHERE c.user_id = $1
  AND c.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY p.category
ORDER BY category_adherence DESC;

-- Time-of-day completions (when is user most active?)
SELECT
  EXTRACT(HOUR FROM c.completed_at)::INT AS hour,
  COUNT(*) AS completion_count
FROM completions c
WHERE c.user_id = $1
  AND c.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY hour
ORDER BY hour;
```

### Key Dashboard Metrics
1. **Overall Adherence %** - Cards with large numbers
2. **Streak Timeline** - LineChart with milestone markers
3. **Protocol Category Breakdown** - BarChart by category
4. **Weekly Heatmap** - Adherence pattern by day/week
5. **Time-of-Day Distribution** - When user completes tasks
6. **Protocol Performance Ranking** - Table of top/worst protocols
7. **Trend Analysis** - Last 30/90 days improvement ↑↓

### shadcn/ui + Tailwind CSS 4 Integration

**Updated for Tailwind v4 & React 19:**
- Chart colors use `var(--chart-1)` to `var(--chart-5)` directly (no HSL wrapper)
- `@theme` directive in globals.css defines color palette
- All components support dark mode via `dark:` prefix
- ForwardRefs removed; data-slot attributes added for styling

**Chart Configuration Pattern:**
```tsx
// globals.css (Tailwind v4 syntax)
@theme {
  --color-chart-1: #0ea5e9;    // cyan
  --color-chart-2: #06b6d4;    // teal
  --color-chart-3: #f59e0b;    // amber
  --color-chart-4: #ef4444;    // red
  --color-chart-5: #8b5cf6;    // violet
}

// Component.tsx
export function ProtocolChart() {
  const chartConfig = {
    adherence: {
      label: "Adherence",
      color: "var(--chart-1)"
    },
    // Simplified Tailwind v4 approach—no hsl() wrapper
  };

  return <LineChart data={data} config={chartConfig} />;
}
```

### Performance Optimization
- **Aggregate queries:** Use PostgreSQL GROUP BY + indexes on `(user_id, created_at)` columns
- **Materialized views** for complex dashboards (pre-aggregate 30/90-day stats)
- **Real-time subscriptions:** Supabase `.on('*')` only for critical metrics (current streak, today's adherence)
- **Client caching:** React Query or SWR to cache analytics for 5-10 min (user-initiated refresh)
- **Lazy loading:** Only load detailed charts when user navigates to analytics page

**Alternative for Heavy Analytics:** Supabase alone is fine for MVP. For scaling >100K users, consider Tinybird for specialized time-series analytics (keeps transactional DB lean).

---

## 3. IMPLEMENTATION TRADE-OFFS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Streak reset strategy | Total reset to 0 | Stronger psychological incentive to not break |
| Grace period days | 1-2 days | Balance forgiving without enabling laziness |
| Chart library | Recharts | Fast MVP delivery, sufficient for current scope |
| Analytics aggregation | PostgreSQL GROUP BY + indexes | Supabase native, no external tool needed for MVP |
| Badge unlocking | Automatic via trigger | Avoid race conditions in application code |
| Freeze mechanic | Premium feature (Pro tier) | Drives monetization, worth complexity trade-off |
| Analytics refresh cadence | 5-min client cache + manual refresh | Balance freshness vs. database load |

---

## 4. UNRESOLVED QUESTIONS

1. **Grace period UX:** How many days should user be allowed to miss before streak reset? Should user be notified they're in grace period?
2. **Celebration animations:** Full-screen confetti or subtle toast? Consider accessibility (motion sickness).
3. **Historical badges:** If user unlocked 7-day badge but now at 20 days, show all earned badges or just current milestone?
4. **TimescaleDB decision:** Is continuous aggregates worth the PostgreSQL extension? (Deprecated in PG 17; Supabase only offers Apache 2 edition)
5. **Freeze mechanic scope:** Is this "skip N days penalty-free" or "pause streaks indefinitely"? How many freezes per month (Pro tier)?
6. **Analytics retention:** How long to keep completion audit logs? (90/180/365 days? Cost implications)
7. **Timezone edge case:** When user crosses timezones (travel), should streaks reset? Require manual intervention?

---

## SOURCES

### Streak Systems & Gamification
- [How Streaks Leverages Gamification to Boost Retention (2025) - Trophy](https://trophy.so/blog/streaks-gamification-case-study)
- [Streaks and Milestones for Gamification in Mobile Apps](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
- [How to Build a Streaks Feature - Trophy](https://trophy.so/blog/how-to-build-a-streaks-feature)
- [Add Daily Streak Feature & Boost Retention [Simple Steps]](https://www.enacton.com/blog/daily-streak-feature/)
- [Streak System API - Daily Habits & Consecutive Activity Tracking](https://docs.lynesapp.de/streaks)
- [How to design an effective streak](https://www.makeit.tools/blogs/how-to-design-an-effective-streak-2)
- [Designing streaks for long-term user growth](https://www.mindtheproduct.com/designing-streaks-for-long-term-user-growth/)
- [10 Apps That Use The Streaks Feature (2025) - Trophy](https://trophy.so/blog/streaks-feature-gamification-examples)

### Analytics Charting Libraries
- [8 Best React Chart Libraries for Visualizing Data in 2025](https://embeddable.com/blog/react-chart-libraries)
- [Best React Chart Libraries to Use in 2025 | Top 7 Picks](https://www.creolestudios.com/top-react-chart-libraries/)
- [Best React chart libraries (2025 update): Features, performance & use cases - LogRocket Blog](https://blog.logrocket.com/best-react-chart-libraries-2025/)
- [Top 10 React Chart Libraries for Data Visualization in 2025](https://blog.openreplay.com/react-chart-libraries-2025/)
- [Choosing the Right Charting Library for Your React Dashboard - DEV Community](https://dev.to/sajjadali/choosing-the-right-charting-library-for-your-react-dashboard-2h2o)

### Supabase Time-Series & Analytics
- [timescaledb: Time-Series data | Supabase Docs](https://supabase.com/docs/guides/database/extensions/timescaledb)
- [Can I use Supabase for analytics?](https://www.tinybird.co/blog/can-i-use-supabase-for-user-facing-analytics)
- [PostgREST Aggregate Functions](https://supabase.com/blog/postgrest-aggregate-functions)
- [How to Use Supabase Group By Query for Data Analysis](https://medium.com/towards-agi/how-to-use-supabase-group-by-query-for-data-analysis-c557a97648c6)

### shadcn/ui & Tailwind CSS 4 Integration
- [Tailwind v4 - shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4)
- [Next.js 15: Starter with Tailwind 4.0 & Shadcn](https://medium.com/@rikunaru/nextjs-starter-with-tailwind-shadcn-6e0eda2dd520)
- [Using Shadcn in Next.js 15: A Step-by-Step Guide](https://medium.com/@hiteshchauhan2023/using-shadcn-in-next-js-15-a-step-by-step-guide-a057fb8888ab)

### Gamification Frameworks & Badges
- [GitHub - rwth-acis/Gamification-Framework](https://github.com/rwth-acis/Gamification-Framework)
- [Exploring Different Types of Gamification: Points, Badges, and Beyond](https://mycred.me/blog/types-of-gamification/)
- [10 Examples of Badges Used in Gamification - Trophy](https://trophy.so/blog/badges-feature-gamification-examples)
- [The 8 Core Drives of Gamification #2: Development and Accomplishment](https://yukaichou.com/gamification-study/8-core-drives-gamification-2-development-accomplishment/)
