# Phase 05: Feature Gating

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 02 (subscription_tier), Phase 04 (tier updates)
- **Docs**: [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## Overview
| Field | Value |
|-------|-------|
| Date | 251211 |
| Description | Server-side feature gating utilities and upgrade prompts |
| Priority | P1 |
| Implementation Status | Not Started |
| Review Status | Draft |

## Key Insights
- All gating must be server-side (client-side = insecure)
- Check profiles.subscription_tier; subscriptions table for period info
- Provide clear upgrade paths when limits hit
- Cache-friendly: subscription_tier changes rarely

## Requirements
1. Feature limits utility functions
2. Server component wrappers for Pro features
3. Upgrade prompt component
4. Integrate gating into existing features (stacks, analytics)
5. Middleware option for route-level protection (future)

## Architecture

### Limits Structure
```typescript
// Free tier limits
FREE_LIMITS = {
  maxStacks: 3,
  maxProtocols: 15,      // protocols per stack
  historyDays: 7,
  advancedAnalytics: false,
  aiRecommendations: false,
  wearableSync: false,
};

// Pro tier (unlimited)
PRO_LIMITS = {
  maxStacks: Infinity,
  maxProtocols: Infinity,
  historyDays: Infinity,
  advancedAnalytics: true,
  aiRecommendations: true,
  wearableSync: true,
};
```

### Gating Pattern
```
Server Component/Action
        |
        v
getSubscriptionLimits(userId)
        |
        v
Check limit (e.g., stackCount < maxStacks)
        |
        +---> Within limit -> Allow action
        |
        +---> Over limit -> Return error / Show UpgradePrompt
```

## Related Code Files
### Create
- `apps/web/lib/subscription.ts`
- `apps/web/components/subscription/upgrade-prompt.tsx`
- `apps/web/components/subscription/feature-gate.tsx`

### Modify
- Existing stack creation logic
- Analytics page components

## Implementation Steps

### Step 1: Create Subscription Utilities

Create `apps/web/lib/subscription.ts`:

```typescript
import { createClient } from '@myprotocolstack/database/server';

export const FREE_LIMITS = {
  maxStacks: 3,
  maxProtocols: 15,
  historyDays: 7,
  advancedAnalytics: false,
  aiRecommendations: false,
  wearableSync: false,
} as const;

export const PRO_LIMITS = {
  maxStacks: Infinity,
  maxProtocols: Infinity,
  historyDays: Infinity,
  advancedAnalytics: true,
  aiRecommendations: true,
  wearableSync: true,
} as const;

export type SubscriptionLimits = typeof FREE_LIMITS;

/**
 * Get subscription limits for current user
 */
export async function getSubscriptionLimits(): Promise<SubscriptionLimits> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return FREE_LIMITS;

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  return profile?.subscription_tier === 'pro' ? PRO_LIMITS : FREE_LIMITS;
}

/**
 * Check if user is Pro subscriber
 */
export async function isPro(): Promise<boolean> {
  const limits = await getSubscriptionLimits();
  return limits.maxStacks === Infinity;
}

/**
 * Check if user can create more stacks
 */
export async function canCreateStack(): Promise<{ allowed: boolean; current: number; max: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, current: 0, max: 0 };

  const [limits, { count }] = await Promise.all([
    getSubscriptionLimits(),
    supabase
      .from('stacks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  const current = count || 0;
  return {
    allowed: current < limits.maxStacks,
    current,
    max: limits.maxStacks,
  };
}

/**
 * Check if user can add more protocols to a stack
 */
export async function canAddProtocol(
  currentProtocolCount: number
): Promise<{ allowed: boolean; current: number; max: number }> {
  const limits = await getSubscriptionLimits();

  return {
    allowed: currentProtocolCount < limits.maxProtocols,
    current: currentProtocolCount,
    max: limits.maxProtocols,
  };
}

/**
 * Get history date cutoff based on subscription
 */
export async function getHistoryCutoff(): Promise<Date | null> {
  const limits = await getSubscriptionLimits();

  if (limits.historyDays === Infinity) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - limits.historyDays);
  return cutoff;
}

/**
 * Check if specific feature is available
 */
export async function hasFeature(
  feature: 'advancedAnalytics' | 'aiRecommendations' | 'wearableSync'
): Promise<boolean> {
  const limits = await getSubscriptionLimits();
  return limits[feature];
}
```

### Step 2: Create Upgrade Prompt Component

Create `apps/web/components/subscription/upgrade-prompt.tsx`:

```typescript
'use client';

import { Button } from '@myprotocolstack/ui';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  feature?: string;
  message?: string;
  variant?: 'inline' | 'card' | 'modal';
  showPricing?: boolean;
}

export function UpgradePrompt({
  feature,
  message,
  variant = 'inline',
  showPricing = true,
}: UpgradePromptProps) {
  const router = useRouter();

  const defaultMessage = feature
    ? `Upgrade to Pro to unlock ${feature}`
    : 'Upgrade to Pro for unlimited access';

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
          {message || defaultMessage}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push('/settings?upgrade=true')}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="border rounded-lg p-6 text-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 mb-4">
          <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
        <p className="text-muted-foreground mb-4">
          {message || defaultMessage}
        </p>
        {showPricing && (
          <p className="text-2xl font-bold mb-4">
            $12<span className="text-sm font-normal text-muted-foreground">/month</span>
          </p>
        )}
        <Button onClick={() => router.push('/settings?upgrade=true')}>
          Upgrade Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  // Modal variant would be implemented with Dialog
  return null;
}
```

### Step 3: Create Feature Gate Component

Create `apps/web/components/subscription/feature-gate.tsx`:

```typescript
import { isPro } from '@/lib/subscription';
import { UpgradePrompt } from './upgrade-prompt';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Server Component that gates Pro-only content
 */
export async function FeatureGate({
  feature,
  children,
  fallback,
}: FeatureGateProps) {
  const userIsPro = await isPro();

  if (userIsPro) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback || (
        <UpgradePrompt feature={feature} variant="card" />
      )}
    </>
  );
}
```

### Step 4: Create Stack Limit Check Component

Create `apps/web/components/subscription/stack-limit-banner.tsx`:

```typescript
import { canCreateStack } from '@/lib/subscription';
import { UpgradePrompt } from './upgrade-prompt';

export async function StackLimitBanner() {
  const { allowed, current, max } = await canCreateStack();

  if (allowed || max === Infinity) return null;

  return (
    <UpgradePrompt
      message={`You've reached your stack limit (${current}/${max}). Upgrade to Pro for unlimited stacks.`}
      variant="inline"
    />
  );
}
```

### Step 5: Integrate Into Stack Creation

Modify stack creation action to check limits:

```typescript
// In actions/stacks.ts (or wherever stack creation is)

import { canCreateStack } from '@/lib/subscription';

export async function createStack(data: CreateStackInput) {
  // Check subscription limit
  const { allowed, current, max } = await canCreateStack();

  if (!allowed) {
    return {
      success: false,
      error: `Stack limit reached (${current}/${max}). Upgrade to Pro for unlimited stacks.`,
      limitReached: true,
    };
  }

  // ... rest of creation logic
}
```

### Step 6: Integrate Into Analytics Page

```typescript
// app/(dashboard)/analytics/page.tsx

import { FeatureGate } from '@/components/subscription/feature-gate';
import { AdvancedAnalytics } from '@/components/analytics/advanced-analytics';
import { BasicAnalytics } from '@/components/analytics/basic-analytics';

export default async function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Basic analytics for everyone */}
      <BasicAnalytics />

      {/* Pro-only advanced analytics */}
      <FeatureGate feature="advanced analytics">
        <AdvancedAnalytics />
      </FeatureGate>
    </div>
  );
}
```

## Todo List
- [ ] Create lib/subscription.ts
- [ ] Implement getSubscriptionLimits
- [ ] Implement canCreateStack
- [ ] Implement canAddProtocol
- [ ] Implement hasFeature
- [ ] Create UpgradePrompt component
- [ ] Create FeatureGate component
- [ ] Create StackLimitBanner component
- [ ] Integrate into stack creation
- [ ] Integrate into analytics page
- [ ] Test with Free user
- [ ] Test with Pro user

## Success Criteria
- [ ] Free users see limits (3 stacks, 7 days history)
- [ ] Free users see upgrade prompts at limit
- [ ] Pro users have unlimited access
- [ ] FeatureGate hides Pro content from Free users
- [ ] Stack creation blocked at limit with clear message
- [ ] All checks are server-side

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Client-side bypass | Low | High | All checks server-side |
| Stale tier after upgrade | Medium | Medium | Revalidate on webhook |
| Missing integration points | Medium | Low | Audit all features |

## Security Considerations
- Never check subscription on client only
- Server actions must validate before database write
- Feature gating is defense-in-depth, not sole protection
- RLS can provide additional database-level protection

## Next Steps
- [Phase 06: Subscription UI](./phase-06-subscription-ui.md)
