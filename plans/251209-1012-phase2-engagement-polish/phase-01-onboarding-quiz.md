# Phase 1: Onboarding Quiz

## Context Links

- [Main Plan](./plan.md)
- [Research: Onboarding & Notifications](./research/researcher-251209-onboarding-notifications.md)
- [Code Standards](/docs/code-standards.md)

---

## Overview

| Field | Value |
|-------|-------|
| Priority | P0 |
| Status | ✅ Complete |
| Description | Multi-step wizard collecting user goals, experience, time; auto-recommends initial stack |
| Est. Effort | 2-3 days |
| Completed | 2025-12-09 |
| Review Report | [Code Review Report](../reports/code-reviewer-251209-phase01-onboarding.md) |

---

## Key Insights from Research

- React Hook Form 73% smaller than Formik, 40% fewer re-renders
- Zod for client+server validation ensures type safety
- Store quiz results in profiles table (avoid user_metadata complexity)
- Progressive disclosure: show next step after validation
- 3-5 questions optimal for completion rate

---

## Requirements

### Functional
- 4-step wizard: Goal > Experience > Time > Preview
- Goal selection: sleep, focus, energy, fitness (allow 1-2 selections)
- Experience: beginner, intermediate, advanced
- Time commitment: 15, 30, 45, 60+ minutes
- Auto-generate recommended stack based on answers
- Skip option available (but discouraged)

### Non-Functional
- Wizard state persists on refresh (localStorage backup)
- Mobile-first design
- Complete in <2 minutes

---

## Architecture

```
apps/web/
  ├── app/(dashboard)/onboarding/
  │   ├── page.tsx                    # Server: check if completed, redirect if yes
  │   └── _components/
  │       ├── onboarding-wizard.tsx   # Client: main wizard container
  │       ├── onboarding-wizard-context.tsx # Wizard state provider
  │       ├── step-goals.tsx          # Step 1: goal selection
  │       ├── step-experience.tsx     # Step 2: experience level
  │       ├── step-time.tsx           # Step 3: time available
  │       └── step-preview.tsx        # Step 4: preview + create stack
  ├── lib/schemas/
  │   └── onboarding.ts               # Zod schemas
  └── actions/
      └── onboarding.ts               # Server action: save profile + create stack

packages/database/
  └── src/types.ts                    # OnboardingProfile type

supabase/migrations/
  └── 20251209153234_add_onboarding_columns.sql
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `packages/database/src/types.ts` | Add OnboardingProfile type |
| `apps/web/app/(dashboard)/layout.tsx` | Add onboarding redirect check |
| `apps/web/components/protocols/protocol-card.tsx` | Reuse for preview |
| `packages/database/src/server.ts` | Auth context |
| `apps/web/actions/stacks.ts` | Extend for auto-stack creation |

---

## Database Changes

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN onboarding_profile JSONB;

-- onboarding_profile structure:
-- {
--   "goals": ["sleep", "energy"],
--   "experience": "beginner",
--   "time_minutes": 30,
--   "completed_at": "2025-12-09T10:00:00Z"
-- }
```

---

## Implementation Steps

### 1. Database Setup
1. Create migration file for profiles table changes
2. Update `/types/database.ts` with OnboardingProfile type
3. Test RLS policies allow profile updates

### 2. Zod Schemas
4. Create `/lib/schemas/onboarding.ts`:
   - `goalsSchema`: array of 1-2 categories
   - `experienceSchema`: enum validation
   - `timeSchema`: number 15-240
   - `fullOnboardingSchema`: combined

### 3. Wizard Components
5. Create `/app/(dashboard)/onboarding/page.tsx`:
   - Server check: if onboarding_completed redirect to /today
   - Render OnboardingWizard
6. Create `onboarding-wizard.tsx`:
   - Context provider for wizard state
   - Step navigation (next/back/skip)
   - Progress indicator (4 dots)
7. Create `step-goals.tsx`:
   - 4 category cards (icon + title + description)
   - Multi-select (1-2 max)
   - React Hook Form field
8. Create `step-experience.tsx`:
   - 3 radio cards (beginner/intermediate/advanced)
   - Description text per level
9. Create `step-time.tsx`:
   - Slider or preset buttons (15, 30, 45, 60+)
   - Show estimated protocols count
10. Create `step-preview.tsx`:
    - Fetch matching protocols based on answers
    - Display top 3-5 as cards
    - "Create My Stack" CTA

### 4. Server Action
11. Create `/actions/onboarding.ts`:
    - `completeOnboarding(data)`:
      - Validate with Zod
      - Update profiles.onboarding_profile
      - Set onboarding_completed = true
      - Auto-create first stack with recommended protocols
      - revalidatePath('/today')

### 5. Redirect Logic
12. Update `/app/(dashboard)/layout.tsx`:
    - Add server-side check for onboarding_completed
    - Redirect new users to /onboarding
13. Update `/app/(auth)/callback/route.ts`:
    - After login, check onboarding status
    - Redirect to /onboarding if incomplete

### 6. Polish
14. Add localStorage persistence for wizard state
15. Add skip confirmation dialog
16. Add loading states during submission
17. Toast on successful completion

---

## Todo List

### Implementation (Completed)
- [x] Update types/database.ts
- [x] Create lib/schemas/onboarding.ts
- [x] Create onboarding page.tsx
- [x] Create onboarding-wizard.tsx with context
- [x] Create step-goals.tsx
- [x] Create step-experience.tsx
- [x] Create step-time.tsx
- [x] Create step-preview.tsx with protocol recommendations
- [x] Create actions/onboarding.ts
- [x] Update auth callback redirect logic
- [x] Update middleware to protect /onboarding route
- [x] Add localStorage state persistence
- [x] Code review completed

### Pre-Deployment (Completed)
- [x] **[CRITICAL]** Create DB migration for profiles changes (`supabase/migrations/20251209153234_add_onboarding_columns.sql`)
- [x] **[HIGH]** Add idempotency check to completeOnboarding()
- [x] Test full flow end-to-end with manual QA

### Future Enhancements (Deferred)
- [ ] Add skip confirmation dialog
- [ ] Add keyboard navigation for accessibility
- [ ] Track step progression analytics

---

## Success Criteria

- [x] New users see onboarding wizard on first login
- [x] All 4 steps validate correctly
- [x] Stack auto-created matches selected criteria
- [x] Redirect to /today after completion
- [x] Returning users bypass onboarding
- [x] Mobile responsive

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Wizard abandonment | Medium | High | Add progress bar, allow skip |
| Protocol matching fails | Low | Medium | Fallback to top-rated protocols |
| State lost on refresh | Low | Medium | localStorage backup |

---

## Security Considerations

- Validate all inputs server-side with Zod
- RLS ensures users only update own profile
- No PII stored in onboarding_profile
- Rate limit onboarding endpoint (1/min)

---

## Next Steps

After completion:
1. Track onboarding completion rate in analytics
2. A/B test question order
3. Add "retake quiz" in settings

---

## Unresolved Questions

1. Should goals allow 1 or 1-2 selections?
2. Protocol matching algorithm - weighted by goal or simple filter?
3. Skip rate tracking - worth implementing analytics?
