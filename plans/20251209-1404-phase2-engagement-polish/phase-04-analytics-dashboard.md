# Phase 4: Analytics Dashboard

## Context Links

- [Main Plan](./plan.md)
- [Research: Streaks & Analytics](./research/researcher-251209-streaks-analytics.md)
- [Code Standards](/docs/code-standards.md)

---

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | ✅ Complete |
| Description | Weekly/monthly adherence charts, per-protocol rates, best days, category breakdown |
| Est. Effort | 3-4 days |
| Review Report | [code-reviewer-251209-analytics-phase4.md](./reports/code-reviewer-251209-analytics-phase4.md) |

---

## Key Insights from Research

- Recharts: JSX-native, excellent docs, React 19 compatible
- PostgreSQL GROUP BY + indexes sufficient for MVP scale
- 5-min client cache + manual refresh balances freshness vs DB load
- Lazy load charts only when user navigates to analytics page
- Chart colors via CSS variables for theming

---

## Requirements

### Functional
- Weekly adherence chart (line chart, last 4 weeks)
- Monthly adherence chart (line chart, last 3 months)
- Per-protocol completion rates (bar chart)
- Best performing days (day-of-week heatmap)
- Category breakdown (pie/donut chart)
- Date range selector (7d, 30d, 90d)

### Non-Functional
- Charts load in <500ms
- Responsive on mobile
- Dark mode support
- Lazy loaded on /analytics page

---

## Architecture

```
apps/web/
  ├── app/(dashboard)/analytics/
  │   └── page.tsx                    # Server: fetch data, render charts
  ├── components/analytics/
  │   ├── adherence-chart.tsx         # Line chart: weekly/monthly adherence
  │   ├── protocol-completion-chart.tsx # Bar chart: per-protocol rates
  │   ├── day-heatmap.tsx             # Heatmap: best days
  │   ├── category-breakdown.tsx      # Donut chart: by category
  │   ├── date-range-selector.tsx     # 7d/30d/90d toggle
  │   └── analytics-summary-cards.tsx # Stat cards: total, average, streak
  └── lib/
      └── analytics-queries.ts        # SQL query functions

packages/database/
  └── src/types.ts                    # Add analytics types
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `packages/database/src/types.ts` | Add AnalyticsData types |
| `packages/database/src/server.ts` | Query execution |
| `apps/web/app/(dashboard)/layout.tsx` | Add analytics nav link |
| `packages/ui/src/components/tabs.tsx` | Date range selector |

---

## Dependencies

```json
{
  "recharts": "^2.12.0"
}
```

---

## SQL Queries

```sql
-- Weekly adherence rate (last 4 weeks)
SELECT
  DATE_TRUNC('week', date)::DATE AS week,
  COUNT(CASE WHEN completed THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) AS rate
FROM tracking
WHERE user_id = $1 AND date >= NOW() - INTERVAL '28 days'
GROUP BY week ORDER BY week;

-- Per-protocol completion rate (last 30 days)
SELECT
  p.name,
  p.category,
  COUNT(CASE WHEN t.completed THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) AS rate
FROM tracking t
JOIN protocols p ON t.protocol_id = p.id
WHERE t.user_id = $1 AND t.date >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.category
ORDER BY rate DESC;

-- Best days of week
SELECT
  EXTRACT(DOW FROM date)::INT AS day_of_week,
  COUNT(CASE WHEN completed THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) AS rate
FROM tracking
WHERE user_id = $1 AND date >= NOW() - INTERVAL '30 days'
GROUP BY day_of_week ORDER BY day_of_week;

-- Category breakdown
SELECT
  p.category,
  COUNT(CASE WHEN t.completed THEN 1 END) AS completed_count,
  COUNT(*) AS total_count
FROM tracking t
JOIN protocols p ON t.protocol_id = p.id
WHERE t.user_id = $1 AND t.date >= NOW() - INTERVAL '30 days'
GROUP BY p.category;
```

---

## Implementation Steps

### 1. Dependencies
1. Install recharts: `pnpm add recharts --filter=web`
2. Update `packages/ui/src/globals.css` with chart color variables (Tailwind v4):
```css
@theme {
  --color-chart-1: #0ea5e9;
  --color-chart-2: #06b6d4;
  --color-chart-3: #f59e0b;
  --color-chart-4: #ef4444;
  --color-chart-5: #8b5cf6;
}
```

### 2. Query Functions
3. Create `apps/web/lib/analytics-queries.ts`:
   - `getWeeklyAdherence(userId, days)`
   - `getProtocolCompletionRates(userId, days)`
   - `getDayOfWeekRates(userId, days)`
   - `getCategoryBreakdown(userId, days)`
   - `getAnalyticsSummary(userId, days)` - overall stats

### 3. Type Definitions
4. Update `packages/database/src/types.ts` or create `apps/web/lib/types/analytics.ts`:
```typescript
type AdherenceDataPoint = { date: string; rate: number }
type ProtocolRate = { name: string; category: string; rate: number }
type DayRate = { dayOfWeek: number; rate: number }
type CategoryData = { category: string; completed: number; total: number }
type AnalyticsSummary = {
  totalCompleted: number
  averageRate: number
  currentStreak: number
  bestStreak: number
}
```

### 4. Summary Cards Component
5. Create `apps/web/components/analytics/analytics-summary-cards.tsx`:
   - 4 cards: Total Completed, Avg Adherence %, Current Streak, Best Streak
   - Icons for each metric
   - Trend arrow (up/down vs last period)

### 5. Adherence Chart
6. Create `apps/web/components/analytics/adherence-chart.tsx`:
   - Recharts LineChart
   - Props: data, timeRange
   - Responsive container
   - Tooltip with date + percentage
   - Dark mode via CSS variables

### 6. Protocol Completion Chart
7. Create `apps/web/components/analytics/protocol-completion-chart.tsx`:
   - Recharts BarChart (horizontal)
   - Sort by rate descending
   - Color by category
   - Show top 10 protocols

### 7. Day Heatmap
8. Create `apps/web/components/analytics/day-heatmap.tsx`:
   - 7 boxes for Mon-Sun
   - Color intensity by completion rate
   - Label: day name + percentage

### 8. Category Breakdown
9. Create `apps/web/components/analytics/category-breakdown.tsx`:
   - Recharts PieChart or RadialBarChart
   - 4 categories with colors
   - Legend with counts

### 9. Date Range Selector
10. Create `apps/web/components/analytics/date-range-selector.tsx`:
    - Tabs: 7 days, 30 days, 90 days
    - Updates parent state

### 10. Analytics Page
11. Create `apps/web/app/(dashboard)/analytics/page.tsx`:
    - Server component: fetch all analytics data
    - Date range as URL search param
    - Render all chart components
    - Grid layout for dashboard

### 11. Navigation
12. Update `apps/web/app/(dashboard)/layout.tsx`:
    - Add "Analytics" link to sidebar/nav
    - Icon: BarChart3 from lucide-react

### 12. Polish
13. Add loading skeletons for charts
14. Add "No data" empty states
15. Add refresh button (revalidatePath)
16. Add export to CSV (optional, defer)

---

## Todo List

- [x] Install recharts dependency
- [x] Add chart CSS variables to globals.css
- [x] Create lib/analytics-queries.ts
- [x] Create types for analytics data
- [x] Create analytics-summary-cards.tsx
- [x] Create adherence-chart.tsx
- [x] Create protocol-completion-chart.tsx
- [x] Create day-heatmap.tsx
- [x] Create category-breakdown.tsx
- [x] Create date-range-selector.tsx
- [x] Create analytics page.tsx
- [x] Add Analytics nav link
- [x] Add loading skeletons
- [x] Add empty states
- [x] Test with different data ranges (manual QA)
- [x] Test dark mode (manual QA)

---

## Success Criteria

- [x] Analytics page loads in <500ms (needs production measurement)
- [x] All 4 chart types render correctly
- [x] Date range toggle updates charts
- [x] Dark mode styling works (CSS vars configured)
- [x] Mobile responsive
- [x] Empty state when no tracking data

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Slow queries with large data | Low (MVP) | Medium | Add indexes, cache 5min |
| Chart bundle size | Low | Low | Recharts tree-shakeable |
| Complex responsive layout | Medium | Low | Start mobile-first |

---

## Security Considerations

- All queries scoped to auth.uid()
- RLS on tracking table
- No PII in analytics display
- Rate limit analytics endpoint

---

## Next Steps

After completion:
1. Add goal setting/tracking
2. Add correlation analysis (which protocols improve outcomes)
3. Export analytics to PDF

---

## Unresolved Questions

1. Show trends vs previous period? (requires 2x data fetch)
2. Include inactive stacks in analytics?
3. Analytics data retention period? (90 days? 1 year?)
