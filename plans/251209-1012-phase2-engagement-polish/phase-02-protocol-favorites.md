# Phase 2: Protocol Favorites

## Context Links

- [Main Plan](./plan.md)
- [Code Standards](/docs/code-standards.md)

---

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | DONE |
| Description | Heart button on protocol cards, store favorites, filter by favorites in library |
| Est. Effort | 1 day |
| Completed | 2025-12-09 |

---

## Key Insights from Research

- Simple feature, high engagement impact
- Use optimistic updates for instant feedback
- Store as UUID array in profiles table (avoid join table complexity for MVP)
- Heart icon with fill animation on toggle

---

## Requirements

### Functional

- Heart/favorite icon on each protocol card
- Toggle favorite on click (optimistic update)
- Filter protocols by "Favorites" in library
- Show favorite count per protocol (optional, deferred)
- Persist across sessions

### Non-Functional

- Optimistic UI update (<50ms perceived latency)
- Works on protocol cards everywhere (library, stack builder, today view)

---

## Architecture

```text
apps/web/
  ├── components/protocols/
  │   ├── protocol-card.tsx       # Add favorite button
  │   └── favorite-button.tsx     # New: isolated toggle component
  ├── actions/
  │   └── favorites.ts            # Server action: toggle favorite
  └── app/(dashboard)/protocols/
      └── page.tsx                # Add favorites filter option

packages/database/
  └── src/types.ts                # Add favorite_protocol_ids to Profile
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `apps/web/components/protocols/protocol-card.tsx` | Add favorite button |
| `apps/web/components/protocols/protocol-filters.tsx` | Add favorites filter |
| `packages/database/src/types.ts` | Add favorite_protocol_ids to Profile |
| `apps/web/app/(dashboard)/protocols/page.tsx` | Pass favorites data, handle filter |

---

## Database Changes

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN favorite_protocol_ids UUID[] DEFAULT '{}';
-- Security: Protected by existing RLS policy "Users can update own profile"
```

---

## Todo List

- [x] Create DB migration for favorite_protocol_ids
- [x] Update types/database.ts
- [x] Create actions/favorites.ts
- [x] Create components/protocols/favorite-button.tsx
- [x] Update protocol-card.tsx with favorite button
- [x] Update protocols page to fetch favorites
- [x] Add favorites filter to protocol-filters.tsx
- [x] Add heart animation CSS
- [x] Add empty state for no favorites
- [x] Test optimistic updates
- [x] Add RLS policy documentation to migration
- [x] Remove unused GIN index (YAGNI)
- [x] Add favorites to stack builder view
- [x] Add favorites to today view

---

## Success Criteria

- [x] Heart button visible on all protocol cards
- [x] Click toggles favorite state instantly
- [x] Favorites persist after refresh
- [x] "Show Favorites" filter works
- [x] Works in library, stack builder, today view

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition on rapid toggle | Low | Low | Debounce clicks |
| Array size limit | Very Low | Low | Protocols limited to 30 |

---

## Security Considerations

- RLS ensures users only modify own favorites (via existing profile policy)
- Validate protocolId exists before adding
- UUID format validation

---

## Files Changed (Final)

| File | Change |
|------|--------|
| `supabase/migrations/20251209163058_add_favorite_protocol_ids.sql` | NEW |
| `packages/database/src/types.ts` | MODIFIED |
| `apps/web/actions/favorites.ts` | NEW |
| `apps/web/components/protocols/favorite-button.tsx` | NEW |
| `apps/web/components/protocols/protocol-card.tsx` | MODIFIED |
| `apps/web/components/protocols/protocol-filters.tsx` | MODIFIED |
| `apps/web/app/(dashboard)/protocols/page.tsx` | MODIFIED |
| `apps/web/app/(dashboard)/stacks/new/page.tsx` | MODIFIED |
| `apps/web/app/(dashboard)/stacks/[id]/page.tsx` | MODIFIED |
| `apps/web/app/(dashboard)/today/page.tsx` | MODIFIED |
| `apps/web/components/stacks/stack-builder.tsx` | MODIFIED |
| `apps/web/components/tracking/today-view.tsx` | MODIFIED |
| `apps/web/package.json` | MODIFIED (added lucide-react) |

---

## Next Steps

After completion:

1. Add "Favorite protocols" section on dashboard
2. Track favorite analytics for protocol popularity
3. Consider favorites-based recommendations
