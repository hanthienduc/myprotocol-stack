# Phase 6: Advanced Search & Filtering

## Context Links

- [Main Plan](./plan.md)
- [Code Standards](/docs/code-standards.md)

---

## Overview

| Field | Value |
|-------|-------|
| Priority | P3 |
| Status | Pending |
| Description | Full-text search, multi-filter (category, difficulty, duration), sort options |
| Est. Effort | 1-2 days |

---

## Key Insights from Research

- PostgreSQL full-text search sufficient for 30 protocols
- Client-side filtering faster for small datasets
- Debounce search input (300ms)
- URL state for shareable filter links

---

## Requirements

### Functional
- Text search across protocol name + description
- Filter by category (multi-select)
- Filter by difficulty (single select)
- Filter by duration range
- Sort by: name, difficulty, duration, popularity
- Clear all filters button
- Filter count indicator

### Non-Functional
- Search results <100ms
- Filters update URL (shareable)
- Mobile-friendly filter drawer
- Accessible keyboard navigation

---

## Architecture

```
apps/web/
  ├── components/protocols/
  │   ├── protocol-filters.tsx    # Enhanced filter panel
  │   ├── protocol-search.tsx     # Search input with debounce
  │   └── protocol-list.tsx       # Update to accept filters
  ├── app/(dashboard)/protocols/
  │   └── page.tsx                # URL param handling
  └── lib/
      └── protocol-filters.ts     # Filter logic utilities
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `apps/web/components/protocols/protocol-filters.tsx` | Enhance existing filters |
| `apps/web/app/(dashboard)/protocols/page.tsx` | URL state management |
| `packages/database/src/types.ts` | Protocol types (already exists) |

---

## Implementation Steps

### 1. Search Input Component
1. Create `apps/web/components/protocols/protocol-search.tsx`:
   - Controlled input with debounce (300ms)
   - Search icon
   - Clear button when has value
   - Updates URL searchParams

### 2. Enhanced Filters Component
2. Update `apps/web/components/protocols/protocol-filters.tsx`:
   - Category checkboxes (multi-select, all 4 categories)
   - Difficulty radio buttons (easy/medium/hard or all)
   - Duration range (preset buttons: <15min, 15-30, 30-60, 60+)
   - Mobile: Sheet drawer with filter button
   - Desktop: Collapsible sidebar or inline
3. Add filter count badge
4. Add "Clear All" button

### 3. Sort Options
5. Add sort dropdown to protocol list header:
   - Name (A-Z, Z-A)
   - Difficulty (Easy first, Hard first)
   - Duration (Shortest, Longest)
   - Favorites (if logged in)

### 4. URL State Management
6. Update `apps/web/app/(dashboard)/protocols/page.tsx`:
   - Read searchParams for query, category, difficulty, duration, sort
   - Pass to filter/list components
   - Server-side filtering or pass to client
7. Create `apps/web/lib/protocol-filters.ts`:
```typescript
export function filterProtocols(
  protocols: Protocol[],
  filters: {
    query?: string
    categories?: string[]
    difficulty?: string
    minDuration?: number
    maxDuration?: number
  }
): Protocol[]

export function sortProtocols(
  protocols: Protocol[],
  sortBy: 'name' | 'difficulty' | 'duration',
  order: 'asc' | 'desc'
): Protocol[]
```

### 5. Client-Side Filtering
8. Update `apps/web/components/protocols/protocol-list.tsx`:
   - Accept filtered protocols
   - Show result count ("12 of 30 protocols")
   - Empty state when no results

### 6. URL Updates
9. Create filter change handlers:
   - Update URL without full page reload
   - Use `useRouter` + `useSearchParams`
   - Preserve other params when updating one

### 7. Mobile Drawer
10. Use shadcn Sheet for mobile filters:
    - Filter button in header
    - Full filter panel in drawer
    - "Apply Filters" button
    - Show active filter count on button

### 8. Accessibility
11. Add keyboard navigation:
    - Focus management
    - ARIA labels for filters
    - Screen reader announcements for results

### 9. Polish
12. Add filter animation (expand/collapse)
13. Add search result highlighting (optional)
14. Add recent searches (optional, defer)

---

## Filter Logic

```typescript
// Client-side filtering (fast for 30 protocols)
function filterProtocols(protocols: Protocol[], filters: Filters): Protocol[] {
  return protocols.filter(p => {
    // Text search (name + description)
    if (filters.query) {
      const query = filters.query.toLowerCase()
      if (!p.name.toLowerCase().includes(query) &&
          !p.description.toLowerCase().includes(query)) {
        return false
      }
    }

    // Category filter (multi-select)
    if (filters.categories?.length > 0) {
      if (!filters.categories.includes(p.category)) return false
    }

    // Difficulty filter
    if (filters.difficulty && p.difficulty !== filters.difficulty) {
      return false
    }

    // Duration filter
    if (filters.minDuration && p.duration_minutes < filters.minDuration) {
      return false
    }
    if (filters.maxDuration && p.duration_minutes > filters.maxDuration) {
      return false
    }

    return true
  })
}
```

---

## Todo List

- [ ] Create components/protocols/protocol-search.tsx
- [ ] Update protocol-filters.tsx with multi-filter support
- [ ] Add sort dropdown
- [ ] Create lib/protocol-filters.ts
- [ ] Update protocols page.tsx with URL state
- [ ] Update protocol-list.tsx with result count
- [ ] Add mobile filter drawer (Sheet)
- [ ] Add filter count badge
- [ ] Add clear all filters button
- [ ] Add keyboard navigation
- [ ] Test filter combinations
- [ ] Test mobile responsiveness

---

## Success Criteria

- [ ] Search filters protocols by name/description
- [ ] Multi-category filter works
- [ ] Difficulty filter works
- [ ] Duration filter works
- [ ] Sort options work
- [ ] URL updates with filters (shareable)
- [ ] Mobile drawer works
- [ ] Clear all resets filters

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance with filters | Very Low | Low | Only 30 protocols |
| Complex URL state | Low | Low | Use nuqs library if needed |
| Mobile UX confusion | Low | Medium | Test with real users |

---

## Security Considerations

- Sanitize search input (XSS prevention)
- Validate filter values server-side if using server filtering
- No sensitive data exposed in URL

---

## Next Steps

After completion:
1. Add protocol tags for more granular filtering
2. Add "similar protocols" suggestions
3. Add saved filter presets

---

## Unresolved Questions

1. Server-side vs client-side filtering? (Client fine for 30 protocols)
2. Add "Recently Viewed" section?
3. Full-text search (pg_trgm) for future scalability?
