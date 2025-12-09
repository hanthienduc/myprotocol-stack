# Code Review: Streak System Implementation (Phase 3)

**Reviewer**: code-review subagent
**Date**: 2025-12-09 17:10 JST
**Scope**: Phase 3 streak system implementation
**Changed Files**: 10 files (migrations, types, actions, components, tests)

---

## Scope

**Files Reviewed**:
- `supabase/migrations/20251209171037_create_streak_tables.sql`
- `packages/database/src/types.ts`
- `apps/web/lib/streak-calculator.ts`
- `apps/web/actions/streaks.ts`
- `apps/web/components/streaks/streak-counter.tsx`
- `apps/web/components/streaks/streak-badge.tsx`
- `apps/web/components/streaks/streak-milestone-modal.tsx`
- `apps/web/components/tracking/today-view.tsx`
- `apps/web/app/(dashboard)/today/page.tsx`
- `apps/web/lib/__tests__/streak-calculator.test.ts`

**Lines Analyzed**: ~1200 LOC
**Review Focus**: Security, performance, architecture, YAGNI/KISS/DRY compliance
**Updated Plans**: None (pending fixes)

---

## Overall Assessment

**Status**: ⚠️ **BLOCKED - Critical timezone bug prevents deployment**

Implementation demonstrates solid separation of concerns with pure calculation functions, proper RLS policies, and good component structure. However, **critical timezone bug** in server action makes streak tracking unreliable for users outside server timezone. Additionally, test suite has syntax error contradicting "25/25 passing" claim.

**Quality Score**: 6/10 (would be 8/10 after timezone fix)

---

## Critical Issues

### 1. ❌ **TIMEZONE BUG - Server reads server timezone, not user timezone**

**Location**: `apps/web/actions/streaks.ts:54`

```typescript
// BUG: This runs on SERVER, returns SERVER timezone (e.g., UTC), not user timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
```

**Impact**:
- User in Tokyo (UTC+9) completes protocols at 23:00 local time
- Server in UTC treats it as yesterday → streak breaks
- All users default to server timezone → breaks core feature

**Root Cause**: Server actions run on server. `Intl.DateTimeFormat()` resolves to Node.js process timezone, not browser timezone.

**Fix Required**:
1. Pass user timezone from client to `updateStreak(stackId, userTimezone)`
2. Get from browser: `Intl.DateTimeFormat().resolvedOptions().timeZone`
3. Validate timezone string server-side
4. Or store in user profile during onboarding

**Why This Matters**: Streak feature is P1 engagement driver. Broken streaks = churn.

---

### 2. ❌ **TEST CLAIM FALSE - Syntax error, not 25/25 passing**

**Location**: `apps/web/lib/__tests__/streak-calculator.test.ts:1`

```
SyntaxError: Unexpected token, expected "from" (1:12)
> 1 | import type { BadgeType } from "@myprotocolstack/database";
```

**Impact**: Tests don't run. "25 tests passing" claim is false.

**Root Cause**: Test file uses `import type` but Jest config missing TypeScript transform or preset.

**Fix Required**:
- Add `jest.config.js` with `preset: 'ts-jest'` or similar
- Or change to `import { type BadgeType }`
- Or inline types in test file

**Verification Failure**: Per verification gates protocol, claiming "tests pass" without evidence is lying. Tests MUST run green before any completion claim.

---

## High Priority Findings

### 3. ⚠️ **FILE SIZE VIOLATION - today-view.tsx at 303 lines**

**Location**: `apps/web/components/tracking/today-view.tsx`

**Standard**: Code standards mandate 200 line limit for optimal context management.

**Current**: 303 lines

**YAGNI Check**: Component handles:
- Local state management (tracking, streaks, modal)
- Streak update logic
- Stack completion detection
- Progress calculation
- Rendering 3+ UI sections

**Fix**: Split into:
- `today-view.tsx` - orchestration only (~100 lines)
- `today-stack-card.tsx` - individual stack rendering (~80 lines)
- `use-streak-updates.ts` - custom hook for streak logic (~50 lines)

**Why**: Improves testability, readability, and follows existing standards.

---

### 4. ⚠️ **DUPLICATE REVALIDATION - router.refresh() + revalidatePath()**

**Location**:
- `apps/web/components/tracking/today-view.tsx:152` - `router.refresh()`
- `apps/web/actions/streaks.ts:122` - `revalidatePath("/today")`

**Impact**: Double re-fetch on every protocol toggle:
1. Client: optimistic update → DB write → `router.refresh()` (full page refetch)
2. Server action: `updateStreak()` → `revalidatePath("/today")` (invalidate cache)

**Performance**: Unnecessary. `revalidatePath()` in server action sufficient.

**Fix**: Remove `router.refresh()` from `toggleProtocol()`. Server action handles revalidation.

---

### 5. ⚠️ **STREAK DEDUP LOGIC FLAWED - useRef persists across navigation**

**Location**: `apps/web/components/tracking/today-view.tsx:63-95`

```typescript
const streakUpdatedRef = useRef<Set<string>>(new Set());
// ...
if (wasFullyCompleted && !alreadyUpdated) {
  streakUpdatedRef.current.add(stackId);
```

**Problem**: `useRef` persists until component unmounts. User navigates away and back → ref still populated → streak won't update even if completing different stack.

**Edge Case**:
1. User completes "Morning Stack" → ref has ["morning-stack-id"]
2. User navigates to /protocols, then back to /today
3. Component didn't unmount (Next.js client-side nav)
4. User completes "Evening Stack" → works
5. User completes "Morning Stack" again same day → won't trigger update (ref still has ID)

**Fix**:
- Reset ref in `useEffect` on date change: `useEffect(() => { streakUpdatedRef.current.clear() }, [date])`
- Or track by `${stackId}-${date}` key instead of just `stackId`

---

## Medium Priority Improvements

### 6. 📊 **GRACE PERIOD LOGIC INCONSISTENT**

**Location**: `apps/web/lib/streak-calculator.ts:91-94` vs `isStreakAtRisk()`

**calculateStreak()**: Grace used when 2 days gap + grace not used yet
**isStreakAtRisk()**: Shows at-risk when 1 day gap + grace already used OR 2 days gap + grace not used

**Confusing UX**:
- User misses 1 day → no warning
- User completes on day 2 (grace used) → now shows "at risk" retroactively
- User doesn't understand they're in danger zone until it's too late

**Better UX**: Show "at risk" indicator BEFORE grace kicks in:
- 1 day gap → "Complete today to maintain streak!"
- 2 days gap + grace not used → "Grace period active"
- 2 days gap + grace used → "Complete today or streak resets"

**YAGNI Check**: At-risk indicator is in MVP requirements. Current logic works but suboptimal messaging.

---

### 7. 🔒 **STACK OWNERSHIP VALIDATED, BUT NO RATE LIMITING**

**Location**: `apps/web/actions/streaks.ts:36-45`

**Good**: Stack ownership verified before streak update.

**Missing**: Rate limiting on `updateStreak()`. Malicious user could spam:
```javascript
for (let i = 0; i < 1000; i++) { await updateStreak(stackId) }
```

**Impact**:
- DB writes spike
- Could manipulate longest_streak via race conditions
- Costs $$$ on serverless platforms

**Fix**: Add rate limit (Upstash Redis or Vercel KV):
- 10 req/min per user per stack
- Return 429 if exceeded

**YAGNI Counter**: Is anyone actually going to exploit this in MVP? Probably not. But Supabase has connection limits and this could DOS your own service.

**Decision**: Add basic idempotency check (don't update if `last_activity_date === today`), defer rate limiting to post-MVP.

---

### 8. 📝 **CONSOLE.ERROR LOGS LACK CONTEXT**

**Location**: Multiple files (7 instances)

```typescript
console.error("Error updating streak:", streakError);
```

**Problem**: In production, these logs don't include:
- User ID
- Stack ID
- Timestamp
- Request ID

**Impact**: Debugging production issues = nightmare. "Error updating streak" x1000 logs with no way to trace specific user.

**Fix**: Structured logging:
```typescript
console.error("[STREAK_UPDATE_FAILED]", {
  userId: user.id,
  stackId,
  error: streakError.message,
  timestamp: new Date().toISOString()
});
```

**Or**: Use proper logger (Pino, Winston) with trace IDs.

**YAGNI**: For MVP, add userId + stackId to error logs minimum.

---

### 9. 🎨 **CONFETTI ANIMATION ACCESSIBILITY**

**Location**: `apps/web/components/streaks/streak-milestone-modal.tsx:47-82`

**Issue**: Confetti fires automatically without respecting `prefers-reduced-motion`.

**Impact**: Users with vestibular disorders experience discomfort/nausea.

**Fix**:
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  fireConfetti();
}
```

**Code Standards Check**: Standards don't explicitly require a11y, but "production-ready" implies basic accessibility.

**YAGNI**: Add check. Takes 2 lines, prevents user harm.

---

## Low Priority Suggestions

### 10. 💡 **BADGE MILESTONE DETECTION INEFFICIENT**

**Location**: `apps/web/lib/streak-calculator.ts:104-110`

```typescript
for (const milestone of MILESTONES) {
  if (newStreak >= milestone.days && !existingBadges.includes(milestone.badge)) {
    badgeToUnlock = milestone.badge;
    break;
  }
}
```

**Issue**: Returns first matched milestone even if user jumps multiple milestones (e.g., 6→31 days due to old data migration).

**Expected**: User with 31 streak should unlock both `streak_7` and `streak_30`.

**Current**: Only unlocks `streak_7`.

**YAGNI**: Edge case unlikely in normal usage. User builds streak gradually. Mark as low priority.

**Fix** (if needed): Return `badgesToUnlock[]` and insert multiple badges.

---

### 11. 🔧 **HARDCODED "en-CA" LOCALE**

**Location**: `apps/web/lib/streak-calculator.ts:22`

```typescript
const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, ... });
```

**Why "en-CA"?**: Only locale guaranteed to output YYYY-MM-DD format.

**Issue**: Hardcoded assumption. If Intl spec changes or different runtime, breaks.

**Better**:
```typescript
const date = new Date();
const year = date.toLocaleString('en', { timeZone: timezone, year: 'numeric' });
const month = date.toLocaleString('en', { timeZone: timezone, month: '2-digit' });
const day = date.toLocaleString('en', { timeZone: timezone, day: '2-digit' });
return `${year}-${month}-${day}`;
```

**Or**: Use date library (date-fns-tz).

**YAGNI Counter**: Works fine. Low priority.

---

## Positive Observations

✅ **Pure functions** - `streak-calculator.ts` is 100% pure, testable, no side effects
✅ **RLS comprehensive** - All CRUD operations on streak tables properly secured
✅ **Separation of concerns** - Business logic in lib/, actions handle I/O, components render
✅ **Optimistic UI** - Local state updates before DB writes, smooth UX
✅ **Grace period** - 1-day grace implemented correctly per research
✅ **Type safety** - Strong typing throughout, proper TypeScript usage
✅ **Component sizing** - Most files under 200 lines (except today-view.tsx)
✅ **No premature optimization** - Simple, direct code, no over-engineering

---

## Architecture Review

### Separation of Concerns: ✅ Good

```
lib/streak-calculator.ts     → Pure business logic
actions/streaks.ts           → Server-side I/O + validation
components/streaks/*.tsx     → Presentation
components/tracking/*.tsx    → Orchestration + state
```

**DRY Compliance**: ✅ Good. No obvious duplication. Calculation logic centralized.

**KISS Compliance**: ✅ Good. Straightforward implementation. No clever tricks.

**YAGNI Compliance**: ⚠️ Mostly good, minor violations:
- `timezone` field in DB but not fully utilized (bug)
- `updated_at` timestamp not queried anywhere (unused)
- Badge icon mapping duplicated in badge component and modal (minor)

---

## Performance Analysis

### Query Efficiency: ✅ Good

**Today page** loads:
1. Stacks (1 query, filtered by user_id)
2. Tracking (1 query, filtered by user_id + date)
3. Protocols (1 query with IN clause, batched)
4. Profile (1 query for favorites)
5. Streaks (1 query with IN clause, batched)

**Total**: 5 queries, all indexed, no N+1 issues.

**Optimistic UI** prevents perceived slowness on interactions.

### Potential Issue: Router.refresh() double-fetch (covered in #4)

---

## Security Review

### RLS Policies: ✅ Comprehensive

```sql
-- All policies check auth.uid() = user_id
CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
-- ... (8 total policies, all correct)
```

### Auth Checks: ✅ Present

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { success: false, ... };
```

### Input Validation: ⚠️ Partial

**Good**:
- UUID format validated: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- Stack ownership verified

**Missing**:
- Timezone string not validated (SQL injection unlikely but sanitize anyway)
- No rate limiting (covered in #7)

### Data Exposure: ✅ Safe

- No sensitive data in logs
- Error messages generic ("Failed to update streak")
- User IDs in URLs acceptable (auth-gated)

---

## Recommended Actions

### MUST FIX (Block Deployment)

1. **Fix timezone bug** - Pass user timezone from client to server action
2. **Fix test suite** - Add Jest config or fix import syntax, verify 25 tests actually pass

### SHOULD FIX (Before Production)

3. **Split today-view.tsx** - Reduce to <200 lines per standards
4. **Fix streak dedup logic** - Reset ref on date change
5. **Remove duplicate revalidation** - Delete router.refresh() call
6. **Add reduced-motion check** - Respect accessibility preferences

### NICE TO HAVE (Post-MVP)

7. **Improve grace period UX** - Better at-risk messaging
8. **Structured logging** - Add context to error logs
9. **Rate limiting** - Protect updateStreak endpoint
10. **Multi-badge unlock** - Handle milestone jumps

---

## Verification Checklist

Per verification gates protocol, following evidence required before completion claim:

- [ ] ❌ Tests pass (syntax error prevents execution)
- [ ] ✅ Type checking passes (`pnpm run check-types` succeeded)
- [ ] ⚠️ Build succeeds (not verified, assume passes since types pass)
- [ ] ❌ Timezone bug fixed (critical bug prevents deployment)
- [ ] ❌ File size compliance (today-view.tsx at 303 lines)

**Completion Status**: ❌ **NOT COMPLETE** - Critical issues block deployment

---

## Unresolved Questions

1. **Timezone storage**: Store in user profile or pass from client each request?
2. **Grace period messaging**: Current logic confuses users. Redesign warning states?
3. **Multi-badge unlock**: Should 6→31 day jump unlock both streak_7 and streak_30?
4. **Rate limiting**: MVP necessity or post-launch addition?
5. **Test suite**: Why Jest config missing? Separate test PR incoming?
6. **Updated_at field**: Used for future features or can remove (YAGNI)?

---

## Summary

Implementation shows solid architecture and security fundamentals. **Critical timezone bug prevents deployment** - users outside server timezone will experience broken streaks. Test suite syntax error contradicts "25/25 passing" claim, violating verification gates protocol. Fix timezone bug, verify tests actually run, split oversized component, then ready for merge.

**Recommendation**: ⛔ **DO NOT MERGE** until timezone + test issues resolved.

**Estimated Fix Time**: 2-3 hours (timezone fix + test config + component split)
