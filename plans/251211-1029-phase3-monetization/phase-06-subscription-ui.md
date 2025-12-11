# Phase 06: Subscription UI

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 03 (checkout actions), Phase 05 (feature gating)
- **Docs**: [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog)

## Overview
| Field | Value |
|-------|-------|
| Date | 251211 |
| Description | Settings page subscription section, pricing modal, upgrade buttons |
| Priority | P1 |
| Implementation Status | Not Started |
| Review Status | Draft |

## Key Insights
- Settings page already has subscription placeholder
- Pricing modal needed for plan selection (monthly/annual)
- Pro users get "Manage Subscription" (portal link)
- Handle checkout success/cancel URL params

## Requirements
1. Replace settings page subscription placeholder
2. Create pricing modal with plan toggle
3. Upgrade button triggers checkout
4. Manage button opens Stripe portal
5. Handle checkout redirect feedback (toast)
6. Show current plan details for Pro users

## Architecture

### UI States
```
Free User:
├── Current Plan: Free (3 stacks, basic tracking)
├── [Upgrade to Pro] button -> Opens pricing modal
└── Pricing Modal:
    ├── Toggle: Monthly ($12/mo) | Annual ($99/yr - Save 17%)
    └── [Subscribe] button -> Redirect to Stripe Checkout

Pro User:
├── Current Plan: Pro (since date)
├── Next billing: date ($amount)
├── [Manage Subscription] button -> Stripe Portal
└── Cancel info: "Cancels at period end" (if applicable)
```

### Component Structure
```
components/subscription/
├── subscription-card.tsx       # Main settings section
├── pricing-modal.tsx           # Plan selection modal
├── plan-toggle.tsx             # Monthly/Annual toggle
└── checkout-feedback.tsx       # Toast for success/cancel
```

## Related Code Files
### Create
- `apps/web/components/subscription/subscription-card.tsx`
- `apps/web/components/subscription/pricing-modal.tsx`
- `apps/web/components/subscription/plan-toggle.tsx`
- `apps/web/components/subscription/checkout-feedback.tsx`

### Modify
- `apps/web/app/(dashboard)/settings/page.tsx`

## Implementation Steps

### Step 1: Create Plan Toggle Component

Create `apps/web/components/subscription/plan-toggle.tsx`:

```typescript
'use client';

import { cn } from '@myprotocolstack/utils';

interface PlanToggleProps {
  interval: 'monthly' | 'annual';
  onIntervalChange: (interval: 'monthly' | 'annual') => void;
}

export function PlanToggle({ interval, onIntervalChange }: PlanToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 p-1 bg-muted rounded-lg">
      <button
        onClick={() => onIntervalChange('monthly')}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          interval === 'monthly'
            ? 'bg-background shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onIntervalChange('annual')}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors relative',
          interval === 'annual'
            ? 'bg-background shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Annual
        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full">
          -17%
        </span>
      </button>
    </div>
  );
}
```

### Step 2: Create Pricing Modal

Create `apps/web/components/subscription/pricing-modal.tsx`:

```typescript
'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@myprotocolstack/ui';
import { Button } from '@myprotocolstack/ui';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { PlanToggle } from './plan-toggle';
import { createCheckoutSession } from '@/actions/subscription';
import { toast } from 'sonner';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRICING = {
  monthly: { amount: 12, label: '$12/month' },
  annual: { amount: 99, label: '$99/year', monthly: '$8.25/mo' },
};

const PRO_FEATURES = [
  'Unlimited protocol stacks',
  'Full protocol library access',
  'Unlimited tracking history',
  'Advanced analytics & insights',
  'AI-powered recommendations',
  'Priority support',
];

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('annual');
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = () => {
    startTransition(async () => {
      const result = await createCheckoutSession(interval);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    });
  };

  const pricing = PRICING[interval];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Unlock your full health optimization potential
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Toggle */}
          <PlanToggle interval={interval} onIntervalChange={setInterval} />

          {/* Price Display */}
          <div className="text-center">
            <div className="text-4xl font-bold">
              ${pricing.amount}
              <span className="text-lg font-normal text-muted-foreground">
                /{interval === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            {interval === 'annual' && (
              <p className="text-sm text-muted-foreground mt-1">
                Just {pricing.monthly} billed annually
              </p>
            )}
          </div>

          {/* Features List */}
          <ul className="space-y-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscribe}
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>Subscribe to Pro</>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. 30-day money-back guarantee.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 3: Create Checkout Feedback Component

Create `apps/web/components/subscription/checkout-feedback.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CheckoutFeedback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkout = searchParams.get('checkout');

    if (checkout === 'success') {
      toast.success('Welcome to Pro! Your subscription is now active.');
      // Clean URL
      router.replace('/settings');
    } else if (checkout === 'cancelled') {
      toast.info('Checkout cancelled. No charges were made.');
      router.replace('/settings');
    }
  }, [searchParams, router]);

  return null;
}
```

### Step 4: Create Subscription Card Component

Create `apps/web/components/subscription/subscription-card.tsx`:

```typescript
'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from '@myprotocolstack/ui';
import { CreditCard, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { PricingModal } from './pricing-modal';
import { createPortalSession } from '@/actions/subscription';
import { toast } from 'sonner';

interface SubscriptionCardProps {
  tier: 'free' | 'pro';
  subscription?: {
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
}

export function SubscriptionCard({ tier, subscription }: SubscriptionCardProps) {
  const [showPricing, setShowPricing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleManageSubscription = () => {
    startTransition(async () => {
      const result = await createPortalSession();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    });
  };

  const isPro = tier === 'pro';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            {isPro ? 'Manage your Pro subscription' : 'Your current plan'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Plan Display */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2">
                {isPro ? (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Pro Plan
                  </>
                ) : (
                  'Free Plan'
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPro
                  ? 'Unlimited stacks, full access'
                  : '3 stacks, basic tracking'}
              </p>
            </div>
            <Badge variant={isPro ? 'default' : 'secondary'}>
              {isPro ? 'Pro' : 'Free'}
            </Badge>
          </div>

          {/* Pro User: Subscription Details */}
          {isPro && subscription && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next billing date</span>
                <span>
                  {new Date(subscription.current_period_end).toLocaleDateString(
                    'en-US',
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )}
                </span>
              </div>
              {subscription.cancel_at_period_end && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Your subscription will end on this date.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {isPro ? (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Manage Subscription
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-dashed p-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Upgrade to Pro
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Unlimited stacks, advanced analytics, AI recommendations
                </p>
                <p className="text-lg font-bold mt-2">
                  $12/month{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    or $99/year
                  </span>
                </p>
              </div>
              <Button onClick={() => setShowPricing(true)} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Modal */}
      <PricingModal open={showPricing} onOpenChange={setShowPricing} />
    </>
  );
}
```

### Step 5: Update Settings Page

Update `apps/web/app/(dashboard)/settings/page.tsx`:

```typescript
import { createClient } from '@myprotocolstack/database/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@myprotocolstack/ui';
import type { Profile } from '@myprotocolstack/database';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { RetakeQuizSettings } from '@/components/settings/retake-quiz-settings';
import { PrivacySettings } from '@/components/settings/privacy-settings';
import { SubscriptionCard } from '@/components/subscription/subscription-card';
import { CheckoutFeedback } from '@/components/subscription/checkout-feedback';
import { getNotificationPreferences } from '@/actions/notification-preferences';
import { getProfileForSettings } from '@/actions/profile';
import { getSubscriptionStatus } from '@/actions/subscription';
import { Suspense } from 'react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get profile, notification preferences, privacy settings, and subscription in parallel
  const [profileResult, notificationPreferences, privacyProfile, subscription] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getNotificationPreferences(),
    getProfileForSettings(),
    getSubscriptionStatus(),
  ]);

  const profile = profileResult.data as Profile | null;

  const privacyData = {
    username: privacyProfile?.username || null,
    bio: privacyProfile?.bio || null,
    is_public: privacyProfile?.is_public || false,
    social_links: privacyProfile?.social_links as { twitter?: string; website?: string } | null,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Checkout Feedback Toast */}
      <Suspense fallback={null}>
        <CheckoutFeedback />
      </Suspense>

      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Card - existing */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <p>{user.user_metadata?.name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p>{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Account created
            </label>
            <p>
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Preferences / Retake Quiz */}
      <RetakeQuizSettings />

      {/* Public Profile / Privacy Settings */}
      <PrivacySettings initialData={privacyData} />

      {/* Notifications */}
      <NotificationSettings initialPreferences={notificationPreferences} />

      {/* Subscription - NEW */}
      <SubscriptionCard
        tier={profile?.subscription_tier || 'free'}
        subscription={subscription}
      />

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Export or delete your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Data export and account deletion coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 6: Handle Upgrade URL Parameter

Settings page should auto-open pricing modal if `?upgrade=true`:

Add to `SubscriptionCard`:

```typescript
// In subscription-card.tsx, update to accept initialShowPricing
interface SubscriptionCardProps {
  tier: 'free' | 'pro';
  subscription?: { ... } | null;
  initialShowPricing?: boolean;
}

export function SubscriptionCard({
  tier,
  subscription,
  initialShowPricing = false,
}: SubscriptionCardProps) {
  const [showPricing, setShowPricing] = useState(initialShowPricing);
  // ... rest of component
}
```

In settings page, pass the param:

```typescript
const searchParams = await searchParams; // Next.js 15+ page props
const showUpgrade = searchParams?.upgrade === 'true';

<SubscriptionCard
  tier={profile?.subscription_tier || 'free'}
  subscription={subscription}
  initialShowPricing={showUpgrade && profile?.subscription_tier !== 'pro'}
/>
```

## Todo List
- [ ] Create plan-toggle.tsx
- [ ] Create pricing-modal.tsx
- [ ] Create checkout-feedback.tsx
- [ ] Create subscription-card.tsx
- [ ] Update settings page
- [ ] Wire up checkout flow
- [ ] Wire up portal flow
- [ ] Test Free user -> Upgrade
- [ ] Test Pro user -> Manage
- [ ] Test checkout success toast
- [ ] Test checkout cancel toast

## Success Criteria
- [ ] Free users see current limits and upgrade option
- [ ] Pro users see plan details and manage button
- [ ] Pricing modal shows monthly/annual toggle
- [ ] Annual shows 17% discount badge
- [ ] Subscribe button redirects to Stripe Checkout
- [ ] Manage button opens Stripe Portal
- [ ] Success/cancel toasts appear after redirect
- [ ] Mobile responsive

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Modal not accessible | Low | Medium | Test keyboard/screen reader |
| Price display mismatch | Medium | High | Single source of truth |
| Toast not showing | Low | Low | Suspense boundary |

## Security Considerations
- Checkout session created server-side
- Portal session created server-side
- No sensitive data in client components
- URL params sanitized

## Next Steps
- Test full flow end-to-end
- Add analytics tracking for upgrade funnel
- Consider adding pricing page for marketing
