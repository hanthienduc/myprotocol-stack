# Phase 05: Public Profiles

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 01 (SEO), Phase 04 (Social Sharing)
- **Docs**: [Referral Research](./research/researcher-referral-social-report.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 251210 |
| Description | Optional public profiles with shareable stack collections |
| Priority | P2 |
| Implementation Status | ✅ Complete |
| Review Status | REVIEWED - All Issues Fixed |
| Review Report | [reports/code-reviewer-251210-phase05-public-profiles.md](./reports/code-reviewer-251210-phase05-public-profiles.md) |

## Key Insights
- Public profiles drive organic discovery (SEO)
- View counts incentivize quality stack curation
- Privacy-first: profiles private by default
- Username-based URLs are shareable and memorable
- Similar to ProductHunt makers, Notion template galleries

## Requirements
1. Username field on profiles (unique, URL-safe)
2. Public/private toggle for profile visibility
3. Public/private toggle per stack
4. Public profile page at `/profile/[username]`
5. Display user's public stacks on profile
6. SEO metadata for public profiles
7. View count tracking for public stacks
8. Privacy settings UI in settings page

## Architecture

```
Database (profiles table):
├── username VARCHAR(50) UNIQUE
├── is_public BOOLEAN DEFAULT FALSE
├── bio TEXT
├── social_links JSONB

Database (stacks table):
├── is_public BOOLEAN DEFAULT FALSE
├── view_count INTEGER DEFAULT 0

Routes:
├── /profile/[username]     # Public profile page
├── /settings               # Privacy settings section

Components:
├── components/profile/
│   ├── public-profile.tsx
│   ├── public-stack-card.tsx
│   └── profile-header.tsx
├── components/settings/
│   └── privacy-settings.tsx
```

## Database Schema

```sql
-- Modify profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Add constraint for URL-safe usernames
ALTER TABLE public.profiles
  ADD CONSTRAINT username_format CHECK (
    username IS NULL OR username ~ '^[a-z0-9_-]{3,50}$'
  );

-- Modify stacks table
ALTER TABLE public.stacks
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Index for public profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_public ON public.profiles(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_stacks_public ON public.stacks(is_public) WHERE is_public = TRUE;

-- RLS: Allow public profile reads
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles FOR SELECT
  USING (is_public = TRUE OR auth.uid() = id);

-- RLS: Allow public stack reads
CREATE POLICY "Anyone can view public stacks"
  ON public.stacks FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);
```

## Related Code Files

### Create
- `apps/web/app/profile/[username]/page.tsx`
- `apps/web/components/profile/public-profile.tsx`
- `apps/web/components/profile/public-stack-card.tsx`
- `apps/web/components/profile/profile-header.tsx`
- `apps/web/components/settings/privacy-settings.tsx`
- `apps/web/actions/profile.ts`
- `supabase/migrations/YYYYMMDD_public_profiles.sql`

### Modify
- `apps/web/app/(dashboard)/settings/page.tsx` - Add privacy section
- `apps/web/app/sitemap.ts` - Include public profiles
- `packages/database/types.ts` - Update types

## Implementation Steps

### Step 1: Create Profile Actions
```ts
// apps/web/actions/profile.ts
'use server';

import { createClient } from '@myprotocolstack/database/server';
import { revalidatePath } from 'next/cache';

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  is_public?: boolean;
  social_links?: {
    twitter?: string;
    website?: string;
  };
}

export async function updateProfile(input: UpdateProfileInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Validate username if provided
    if (input.username) {
      const usernameRegex = /^[a-z0-9_-]{3,50}$/;
      if (!usernameRegex.test(input.username)) {
        return { success: false, error: 'Username must be 3-50 characters, lowercase, numbers, _ or -' };
      }

      // Check uniqueness
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', input.username)
        .neq('id', user.id)
        .single();

      if (existing) {
        return { success: false, error: 'Username already taken' };
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile' };
    }

    revalidatePath('/settings');
    if (input.username) {
      revalidatePath(`/profile/${input.username}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, error: 'Something went wrong' };
  }
}

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const usernameRegex = /^[a-z0-9_-]{3,50}$/;
  if (!usernameRegex.test(username)) return false;

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user?.id || '')
    .single();

  return !data;
}

export async function updateStackVisibility(stackId: string, isPublic: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify ownership
    const { data: stack } = await supabase
      .from('stacks')
      .select('user_id')
      .eq('id', stackId)
      .single();

    if (!stack || stack.user_id !== user.id) {
      return { success: false, error: 'Stack not found' };
    }

    const { error } = await supabase
      .from('stacks')
      .update({ is_public: isPublic })
      .eq('id', stackId);

    if (error) {
      return { success: false, error: 'Failed to update stack' };
    }

    revalidatePath('/stacks');
    revalidatePath('/settings');

    return { success: true };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
}

export async function getPublicProfile(username: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, bio, avatar_url, social_links, created_at')
    .eq('username', username)
    .eq('is_public', true)
    .single();

  if (!profile) return null;

  // Get public stacks
  const { data: stacks } = await supabase
    .from('stacks')
    .select(`
      id,
      name,
      description,
      is_public,
      view_count,
      created_at,
      stack_protocols (
        protocol_id,
        protocols (name, category)
      )
    `)
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return { profile, stacks: stacks || [] };
}

export async function incrementStackViewCount(stackId: string) {
  const supabase = await createClient();

  await supabase.rpc('increment_view_count', { stack_id: stackId });
}
```

### Step 2: Create Public Profile Page
```tsx
// apps/web/app/profile/[username]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/actions/profile';
import { PublicProfile } from '@/components/profile/public-profile';
import { StructuredData } from '@/components/seo/structured-data';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicProfile(username);

  if (!data) return { title: 'Profile Not Found' };

  const { profile } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';

  return {
    title: `${profile.full_name || profile.username}'s Health Stacks`,
    description: profile.bio || `Check out ${profile.username}'s health protocol stacks on MyProtocolStack`,
    openGraph: {
      title: `${profile.full_name || profile.username} | MyProtocolStack`,
      description: profile.bio || 'Health protocol stacks',
      url: `${baseUrl}/profile/${username}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${profile.full_name || profile.username}'s Stacks`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getPublicProfile(username);

  if (!data) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';
  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.profile.full_name || data.profile.username,
    url: `${baseUrl}/profile/${username}`,
    image: data.profile.avatar_url,
    description: data.profile.bio,
  };

  return (
    <>
      <StructuredData data={profileSchema} />
      <PublicProfile
        profile={data.profile}
        stacks={data.stacks}
      />
    </>
  );
}
```

### Step 3: Create Public Profile Component
```tsx
// apps/web/components/profile/public-profile.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@myprotocolstack/ui';
import { Badge, Card, CardHeader, CardTitle, CardDescription } from '@myprotocolstack/ui';
import { Calendar, Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Profile {
  id: string;
  full_name: string | null;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  social_links: { twitter?: string; website?: string } | null;
  created_at: string;
}

interface Stack {
  id: string;
  name: string;
  description: string | null;
  view_count: number;
  created_at: string;
  stack_protocols: {
    protocol_id: string;
    protocols: { name: string; category: string };
  }[];
}

interface PublicProfileProps {
  profile: Profile;
  stacks: Stack[];
}

export function PublicProfile({ profile, stacks }: PublicProfileProps) {
  const initials = (profile.full_name || profile.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-muted-foreground">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-2 text-sm">{profile.bio}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {profile.social_links?.twitter && (
              <a
                href={`https://twitter.com/${profile.social_links.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                @{profile.social_links.twitter}
              </a>
            )}
            {profile.social_links?.website && (
              <a
                href={profile.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Public Stacks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Public Stacks ({stacks.length})
        </h2>

        {stacks.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No public stacks yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {stacks.map((stack) => (
              <PublicStackCard key={stack.id} stack={stack} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PublicStackCard({ stack }: { stack: Stack }) {
  const protocols = stack.stack_protocols || [];
  const categories = [...new Set(protocols.map((p) => p.protocols?.category))];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1">
            {categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="capitalize text-xs">
                {cat}
              </Badge>
            ))}
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            {stack.view_count}
          </span>
        </div>
        <CardTitle className="text-lg">{stack.name}</CardTitle>
        {stack.description && (
          <CardDescription className="line-clamp-2">
            {stack.description}
          </CardDescription>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {protocols.length} protocol{protocols.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
    </Card>
  );
}
```

### Step 4: Create Privacy Settings Component
```tsx
// apps/web/components/settings/privacy-settings.tsx
'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@myprotocolstack/ui';
import { Button, Input, Label, Switch, Textarea } from '@myprotocolstack/ui';
import { toast } from 'sonner';
import { updateProfile, checkUsernameAvailability } from '@/actions/profile';
import { Globe, Lock, Check, X } from 'lucide-react';

interface PrivacySettingsProps {
  initialData: {
    username: string | null;
    bio: string | null;
    is_public: boolean;
    social_links: { twitter?: string; website?: string } | null;
  };
}

export function PrivacySettings({ initialData }: PrivacySettingsProps) {
  const [username, setUsername] = useState(initialData.username || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [isPublic, setIsPublic] = useState(initialData.is_public);
  const [twitter, setTwitter] = useState(initialData.social_links?.twitter || '');
  const [website, setWebsite] = useState(initialData.social_links?.website || '');

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    const available = await checkUsernameAvailability(value);
    setUsernameAvailable(available);
    setCheckingUsername(false);
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(sanitized);

    // Debounce check
    const timeout = setTimeout(() => checkUsername(sanitized), 500);
    return () => clearTimeout(timeout);
  };

  const handleSave = async () => {
    setSaving(true);

    const result = await updateProfile({
      username: username || undefined,
      bio: bio || undefined,
      is_public: isPublic,
      social_links: {
        twitter: twitter || undefined,
        website: website || undefined,
      },
    });

    if (result.success) {
      toast.success('Profile updated!');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }

    setSaving(false);
  };

  const profileUrl = username
    ? `${process.env.NEXT_PUBLIC_APP_URL}/profile/${username}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          Public Profile
        </CardTitle>
        <CardDescription>
          Control your profile visibility and share your stacks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Public Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Make profile public</Label>
            <p className="text-sm text-muted-foreground">
              Allow others to view your profile and public stacks
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="your-username"
              className="pr-10"
            />
            {username.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername ? (
                  <span className="text-xs text-muted-foreground">...</span>
                ) : usernameAvailable ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          {profileUrl && isPublic && (
            <p className="text-xs text-muted-foreground">
              Your profile: {profileUrl}
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about your health journey..."
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">
            {bio.length}/200
          </p>
        </div>

        {/* Social Links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value.replace('@', ''))}
              placeholder="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Update Settings Page
```tsx
// In apps/web/app/(dashboard)/settings/page.tsx
// Add import:
import { PrivacySettings } from '@/components/settings/privacy-settings';

// After profile query, extract privacy data:
const privacyData = {
  username: profile?.username || null,
  bio: profile?.bio || null,
  is_public: profile?.is_public || false,
  social_links: profile?.social_links || null,
};

// Add component after ReferralSettings:
<PrivacySettings initialData={privacyData} />
```

### Step 6: Add View Count RPC
```sql
-- Add to migration
CREATE OR REPLACE FUNCTION increment_view_count(stack_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.stacks
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = stack_id AND is_public = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 7: Update Sitemap with Public Profiles
```ts
// In apps/web/app/sitemap.ts
// Add public profiles:
const { data: publicProfiles } = await supabase
  .from('profiles')
  .select('username, updated_at')
  .eq('is_public', true)
  .not('username', 'is', null);

const profileUrls = (publicProfiles || []).map((p) => ({
  url: `${baseUrl}/profile/${p.username}`,
  lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
  changeFrequency: 'weekly' as const,
  priority: 0.6,
}));

// Include in return: ...profileUrls
```

## Todo List
- [x] Create migration for profile/stack columns
- [x] Create `actions/profile.ts` server actions
- [x] Create `app/profile/[username]/page.tsx`
- [x] Create `components/profile/public-profile.tsx`
- [x] Create `components/settings/privacy-settings.tsx`
- [x] Add PrivacySettings to settings page
- [x] Create view count RPC function
- [x] Update sitemap with public profiles
- [x] Add stack visibility toggle in stack editor
- [x] Test public profile accessibility

## Success Criteria
- Users can set username and make profile public
- Public profiles accessible at /profile/[username]
- Only public stacks visible on public profile
- View counts increment on profile visits
- SEO metadata renders for public profiles
- Private profiles return 404

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Username squatting | Med | Low | Reserved list, minimum activity |
| Inappropriate content | Low | Med | Terms of service, report mechanism |
| Privacy leaks | Low | High | RLS policies, visibility checks |

## Security Considerations
- [x] RLS ensures only public profiles/stacks visible (admin client + explicit is_public filter)
- [x] Username validation prevents injection (server-side regex)
- [x] No PII exposed beyond user's choice
- [x] View counts don't reveal viewer identity (anonymous RPC)
- [x] XSS via URL prevented (protocol whitelist: http/https only)
- [x] Twitter handle validated server-side (1-15 alphanumeric + underscore)
- [x] Race condition in useEffect fixed (AbortController)
- [x] TOCTOU prevented (DB UNIQUE constraint + error code 23505)
- [x] Bio length enforced server-side (MAX_BIO_LENGTH = 200)

## Next Steps
1. ~~Add stack visibility toggle in stack editor~~ ✅ Done
2. Consider "Clone Stack" feature from public profiles
3. Add report/flag mechanism for inappropriate content
4. Featured profiles section on landing page
