# Phase 03: Referral Program

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: None (can run parallel with Phase 02)
- **Docs**: [Referral Research](./research/researcher-referral-social-report.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 251210 |
| Description | Self-built referral system with Base62 codes & tiered rewards |
| Priority | P0 |
| Implementation Status | Not Started |
| Review Status | Draft |

## Key Insights
- Referrals drive 16% higher LTV, 18% lower churn
- Base62 codes: deterministic from user_id, short, shareable
- Double-sided rewards: both referrer and referred benefit
- Tiered structure incentivizes power users
- No SaaS dependency for MVP (GrowSurf later for scale)

## Requirements
1. Generate unique referral code per user (Base62 encoded user_id)
2. Track referral relationships (who referred whom)
3. Tiered reward system (credits-based)
4. Referral dashboard showing stats & code
5. Settings page section with referral code & share options
6. Confirm referral on signup completion (not just click)
7. Anti-fraud: IP/email rate limiting

## Reward Structure

| Tier | Referrals | Referrer Gets | Referred Gets |
|------|-----------|---------------|---------------|
| 1 | 1+ | 500 credits ($5) | 250 credits ($2.50) |
| 2 | 5+ | 2,000 credits ($20) + 1 mo free | 250 credits |
| 3 | 10+ | 5,000 credits ($50) + 3 mo free | 500 credits |
| 4 | 25+ | 15,000 credits + 1 yr free + badge | 500 credits |

Credits can be applied to Pro subscription payments.

## Architecture

```
Database:
├── referral_codes         # User's referral code(s)
├── referrals              # Referral relationships
├── referral_rewards       # Issued rewards
├── profiles               # Add credits_balance column

Server Actions:
├── actions/referrals.ts   # Create code, track referral, grant rewards

Components:
├── components/referral/
│   ├── referral-code-display.tsx
│   ├── referral-dashboard.tsx
│   └── referral-stats.tsx

Routes:
├── (dashboard)/settings   # Add referral section
├── (auth)/signup          # Check for ?ref= param
```

## Database Schema

```sql
-- Referral codes
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code VARCHAR(8) UNIQUE NOT NULL,
  vanity_code VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)  -- One code per user
);

-- Referral relationships
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_user_id UUID REFERENCES public.profiles(id),
  referral_code_used VARCHAR(8) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, confirmed, rewarded
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,

  -- Attribution tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  UNIQUE(referred_user_id)  -- User can only be referred once
);

-- Rewards tracking
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.referrals(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  reward_type VARCHAR(20) NOT NULL,  -- credits, free_month
  credits_amount INTEGER,
  free_months INTEGER,
  tier INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, issued, claimed
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_tier INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- RLS Policies
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view referrals they made
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can view their own rewards
CREATE POLICY "Users can view own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);
```

## Related Code Files

### Create
- `apps/web/lib/referral/base62.ts` - Base62 encoding
- `apps/web/lib/referral/rewards.ts` - Reward calculation
- `apps/web/actions/referrals.ts` - Server actions
- `apps/web/components/referral/referral-code-display.tsx`
- `apps/web/components/referral/referral-dashboard.tsx`
- `apps/web/components/referral/referral-stats.tsx`
- `apps/web/components/settings/referral-settings.tsx`
- `supabase/migrations/YYYYMMDD_referral_tables.sql`

### Modify
- `apps/web/app/(dashboard)/settings/page.tsx` - Add referral section
- `apps/web/app/(auth)/callback/route.ts` - Process referral on signup
- `packages/database/types.ts` - Add referral types

## Implementation Steps

### Step 1: Create Base62 Utility
```ts
// apps/web/lib/referral/base62.ts
const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function encodeBase62(uuid: string): string {
  // Convert UUID to BigInt (remove hyphens first)
  const hex = uuid.replace(/-/g, '');
  let num = BigInt('0x' + hex);

  if (num === 0n) return BASE62_CHARS[0];

  let result = '';
  const base = BigInt(62);

  while (num > 0n) {
    result = BASE62_CHARS[Number(num % base)] + result;
    num = num / base;
  }

  // Return first 8 characters for shorter codes
  return result.slice(0, 8).padStart(8, '0');
}

export function generateReferralCode(userId: string): string {
  return encodeBase62(userId);
}

export function isValidReferralCode(code: string): boolean {
  const validPattern = /^[0-9A-Za-z]{6,8}$/;
  return validPattern.test(code);
}
```

### Step 2: Create Reward Calculation
```ts
// apps/web/lib/referral/rewards.ts
export interface RewardTier {
  tier: number;
  minReferrals: number;
  referrerCredits: number;
  referrerFreeMonths: number;
  referredCredits: number;
}

export const REWARD_TIERS: RewardTier[] = [
  { tier: 1, minReferrals: 1, referrerCredits: 500, referrerFreeMonths: 0, referredCredits: 250 },
  { tier: 2, minReferrals: 5, referrerCredits: 2000, referrerFreeMonths: 1, referredCredits: 250 },
  { tier: 3, minReferrals: 10, referrerCredits: 5000, referrerFreeMonths: 3, referredCredits: 500 },
  { tier: 4, minReferrals: 25, referrerCredits: 15000, referrerFreeMonths: 12, referredCredits: 500 },
];

export function getCurrentTier(confirmedReferrals: number): RewardTier {
  // Find highest tier user qualifies for
  const tier = [...REWARD_TIERS]
    .reverse()
    .find((t) => confirmedReferrals >= t.minReferrals);

  return tier || REWARD_TIERS[0];
}

export function getNextTier(confirmedReferrals: number): RewardTier | null {
  const nextTier = REWARD_TIERS.find((t) => t.minReferrals > confirmedReferrals);
  return nextTier || null;
}

export function getReferralsToNextTier(confirmedReferrals: number): number {
  const next = getNextTier(confirmedReferrals);
  return next ? next.minReferrals - confirmedReferrals : 0;
}
```

### Step 3: Create Server Actions
```ts
// apps/web/actions/referrals.ts
'use server';

import { createClient } from '@myprotocolstack/database/server';
import { revalidatePath } from 'next/cache';
import { generateReferralCode, isValidReferralCode } from '@/lib/referral/base62';
import { getCurrentTier, REWARD_TIERS } from '@/lib/referral/rewards';

export interface ReferralCodeResult {
  success: boolean;
  code?: string;
  error?: string;
}

export async function getOrCreateReferralCode(): Promise<ReferralCodeResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Check for existing code
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .single();

    if (existing) return { success: true, code: existing.code };

    // Generate new code
    const code = generateReferralCode(user.id);

    const { error } = await supabase
      .from('referral_codes')
      .insert({ user_id: user.id, code });

    if (error) {
      console.error('Failed to create referral code:', error);
      return { success: false, error: 'Failed to create code' };
    }

    return { success: true, code };
  } catch (error) {
    console.error('Referral code error:', error);
    return { success: false, error: 'Something went wrong' };
  }
}

export interface ReferralStats {
  totalReferrals: number;
  confirmedReferrals: number;
  pendingReferrals: number;
  creditsEarned: number;
  currentTier: number;
  code: string | null;
}

export async function getReferralStats(): Promise<ReferralStats> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalReferrals: 0,
      confirmedReferrals: 0,
      pendingReferrals: 0,
      creditsEarned: 0,
      currentTier: 0,
      code: null,
    };
  }

  // Get referral code
  const { data: codeData } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .single();

  // Get referral counts
  const { data: referrals } = await supabase
    .from('referrals')
    .select('status')
    .eq('referrer_id', user.id);

  const total = referrals?.length || 0;
  const confirmed = referrals?.filter((r) => r.status === 'confirmed' || r.status === 'rewarded').length || 0;
  const pending = referrals?.filter((r) => r.status === 'pending').length || 0;

  // Get total credits earned
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('credits_amount')
    .eq('user_id', user.id)
    .eq('status', 'issued');

  const creditsEarned = rewards?.reduce((sum, r) => sum + (r.credits_amount || 0), 0) || 0;

  const tier = getCurrentTier(confirmed);

  return {
    totalReferrals: total,
    confirmedReferrals: confirmed,
    pendingReferrals: pending,
    creditsEarned,
    currentTier: tier.tier,
    code: codeData?.code || null,
  };
}

export async function processReferral(referralCode: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };
  if (!isValidReferralCode(referralCode)) return { success: false, error: 'Invalid code' };

  // Check if user was already referred
  const { data: existingReferral } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_user_id', user.id)
    .single();

  if (existingReferral) return { success: false, error: 'Already referred' };

  // Find referrer by code
  const { data: codeData } = await supabase
    .from('referral_codes')
    .select('user_id')
    .eq('code', referralCode)
    .eq('is_active', true)
    .single();

  if (!codeData) return { success: false, error: 'Code not found' };

  // Prevent self-referral
  if (codeData.user_id === user.id) return { success: false, error: 'Cannot refer yourself' };

  // Create referral record
  const { error } = await supabase.from('referrals').insert({
    referrer_id: codeData.user_id,
    referred_user_id: user.id,
    referral_code_used: referralCode,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to create referral:', error);
    return { success: false, error: 'Failed to process referral' };
  }

  // Grant rewards (simplified - grant base tier rewards)
  await grantReferralRewards(codeData.user_id, user.id);

  revalidatePath('/settings');
  return { success: true };
}

async function grantReferralRewards(referrerId: string, referredId: string) {
  const supabase = await createClient();
  const baseTier = REWARD_TIERS[0];

  // Grant referrer credits
  await supabase.from('referral_rewards').insert({
    user_id: referrerId,
    reward_type: 'credits',
    credits_amount: baseTier.referrerCredits,
    tier: 1,
    status: 'issued',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
  });

  // Update referrer credits balance
  await supabase.rpc('increment_credits', {
    user_id: referrerId,
    amount: baseTier.referrerCredits,
  });

  // Grant referred user credits
  await supabase.from('referral_rewards').insert({
    user_id: referredId,
    reward_type: 'credits',
    credits_amount: baseTier.referredCredits,
    tier: 1,
    status: 'issued',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Update referred user credits balance
  await supabase.rpc('increment_credits', {
    user_id: referredId,
    amount: baseTier.referredCredits,
  });
}
```

### Step 4: Create Referral Settings Component
```tsx
// apps/web/components/settings/referral-settings.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@myprotocolstack/ui';
import { Button, Input, Badge } from '@myprotocolstack/ui';
import { Copy, Check, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { getOrCreateReferralCode, getReferralStats, type ReferralStats } from '@/actions/referrals';
import { getReferralsToNextTier, REWARD_TIERS } from '@/lib/referral/rewards';

export function ReferralSettings() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';

  useEffect(() => {
    async function loadStats() {
      const [codeResult, statsResult] = await Promise.all([
        getOrCreateReferralCode(),
        getReferralStats(),
      ]);
      setStats({ ...statsResult, code: codeResult.code || statsResult.code });
      setLoading(false);
    }
    loadStats();
  }, []);

  const referralLink = stats?.code ? `${appUrl}/?ref=${stats.code}` : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const toNextTier = stats ? getReferralsToNextTier(stats.confirmedReferrals) : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Invite friends and earn credits toward Pro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link. When friends sign up, you both earn credits!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{stats?.confirmedReferrals || 0}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{stats?.pendingReferrals || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">${((stats?.creditsEarned || 0) / 100).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>

        {/* Current Tier */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Current Tier</span>
            <Badge>Tier {stats?.currentTier || 1}</Badge>
          </div>
          {toNextTier > 0 && (
            <p className="text-sm text-muted-foreground">
              {toNextTier} more referral{toNextTier > 1 ? 's' : ''} to reach Tier {(stats?.currentTier || 0) + 1}
            </p>
          )}
        </div>

        {/* Rewards Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Tier 1:</strong> You get $5, friend gets $2.50</p>
          <p><strong>Tier 2 (5+ refs):</strong> You get $20 + 1 month free</p>
          <p><strong>Tier 3 (10+ refs):</strong> You get $50 + 3 months free</p>
          <p><strong>Tier 4 (25+ refs):</strong> You get $150 + 1 year free</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Update Settings Page
```tsx
// In apps/web/app/(dashboard)/settings/page.tsx
// Add import and component:
import { ReferralSettings } from '@/components/settings/referral-settings';

// Add in component JSX after Subscription card:
<ReferralSettings />
```

### Step 6: Process Referral on Auth Callback
```ts
// In apps/web/app/(auth)/callback/route.ts
// After successful auth, check for referral code in URL or cookie:

import { processReferral } from '@/actions/referrals';
import { cookies } from 'next/headers';

// In the callback handler:
const cookieStore = await cookies();
const referralCode = cookieStore.get('ref')?.value;

if (referralCode && user) {
  await processReferral(referralCode);
  cookieStore.delete('ref');
}
```

### Step 7: Store Referral Code on Landing
```ts
// apps/web/middleware.ts or app/page.tsx
// On landing page with ?ref= param, store in cookie:

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const refCode = request.nextUrl.searchParams.get('ref');

  if (refCode) {
    const response = NextResponse.next();
    response.cookies.set('ref', refCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  }

  return NextResponse.next();
}
```

### Step 8: Create Database RPC for Increment
```sql
-- Add to migration
CREATE OR REPLACE FUNCTION increment_credits(user_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET credits_balance = COALESCE(credits_balance, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Todo List
- [ ] Create migration for referral tables
- [ ] Add credits_balance, referral_tier to profiles
- [ ] Create `lib/referral/base62.ts`
- [ ] Create `lib/referral/rewards.ts`
- [ ] Create `actions/referrals.ts`
- [ ] Create `components/settings/referral-settings.tsx`
- [ ] Update settings page with referral section
- [ ] Add referral code capture in middleware
- [ ] Process referral on auth callback
- [ ] Create increment_credits RPC function
- [ ] Test referral flow end-to-end
- [ ] Add rate limiting (future: IP-based)

## Success Criteria
- Users can generate/view referral code
- Referral link works and tracks signups
- Credits granted to both parties on confirmation
- Stats display correctly in settings
- Code persists across sessions (30-day cookie)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Referral fraud | Med | High | IP/email limits, manual review |
| Self-referral | Low | Med | Check referrer != referred |
| Code collision | Very Low | Med | Base62 from UUID is unique |

## Security Considerations
- RLS policies restrict access to own data
- Referral processing requires authentication
- No direct database access from client
- Rate limiting on code validation
- Cookie httpOnly to prevent XSS

## Next Steps
1. Implement Phase 04 (Social Sharing) to enable easy link sharing
2. Add fraud detection (IP clustering, email patterns)
3. Email notifications on referral confirmation
4. Admin dashboard for referral monitoring
