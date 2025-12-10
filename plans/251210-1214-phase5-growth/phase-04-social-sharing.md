# Phase 04: Social Sharing

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 03 (Referral Program) for referral codes in share links
- **Docs**: [Referral Research](./research/researcher-referral-social-report.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 251210 |
| Description | Web Share API with fallback buttons, UTM tracking |
| Priority | P1 |
| Implementation Status | Complete (251210) |
| Review Status | Reviewed - Fixes Required |
| Review Report | [code-reviewer-251210-phase04-social-sharing.md](./reports/code-reviewer-251210-phase04-social-sharing.md) |

## Key Insights
- Web Share API: Native share sheet on mobile/modern browsers, no SDKs
- Fallback: Pre-constructed intent URLs for Twitter, Facebook, LinkedIn
- UTM parameters for tracking share source attribution
- Copy-link button for universal sharing
- OG images (Phase 01) ensure shared links preview well

## Requirements
1. Share button component using Web Share API
2. Fallback share buttons (Twitter, Facebook, LinkedIn, Copy Link)
3. Share functionality on protocol detail pages
4. Share functionality on stack pages (for public stacks)
5. UTM parameter generation for tracking
6. Include user's referral code in share links (if logged in)
7. Toast confirmation on successful share/copy

## Architecture

```
components/
├── sharing/
│   ├── share-button.tsx        # Main share component
│   ├── share-dialog.tsx        # Fallback dialog with buttons
│   ├── social-share-links.ts   # URL generators
│   └── copy-link-button.tsx    # Copy to clipboard

lib/
├── sharing/
│   └── utm.ts                  # UTM parameter utilities
```

## Related Code Files

### Create
- `apps/web/components/sharing/share-button.tsx`
- `apps/web/components/sharing/share-dialog.tsx`
- `apps/web/components/sharing/copy-link-button.tsx`
- `apps/web/lib/sharing/utm.ts`
- `apps/web/lib/sharing/social-links.ts`

### Modify
- `apps/web/app/(dashboard)/protocols/[slug]/page.tsx` - Add share button
- `apps/web/components/protocols/protocol-detail.tsx` - Add share action

## Implementation Steps

### Step 1: Create UTM Utility
```ts
// apps/web/lib/sharing/utm.ts
export interface UTMParams {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
}

export function buildShareUrl(
  baseUrl: string,
  utm: UTMParams,
  referralCode?: string
): string {
  const url = new URL(baseUrl);

  url.searchParams.set('utm_source', utm.source);
  url.searchParams.set('utm_medium', utm.medium);

  if (utm.campaign) {
    url.searchParams.set('utm_campaign', utm.campaign);
  }
  if (utm.content) {
    url.searchParams.set('utm_content', utm.content);
  }
  if (referralCode) {
    url.searchParams.set('ref', referralCode);
  }

  return url.toString();
}

export function getProtocolShareUrl(
  slug: string,
  source: string,
  referralCode?: string
): string {
  const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com'}/protocols/${slug}`;

  return buildShareUrl(baseUrl, {
    source,
    medium: 'social',
    campaign: 'protocol_share',
    content: slug,
  }, referralCode);
}

export function getStackShareUrl(
  stackId: string,
  source: string,
  referralCode?: string
): string {
  const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/stacks/${stackId}`;

  return buildShareUrl(baseUrl, {
    source,
    medium: 'social',
    campaign: 'stack_share',
    content: stackId,
  }, referralCode);
}
```

### Step 2: Create Social Links Generator
```ts
// apps/web/lib/sharing/social-links.ts
export interface ShareContent {
  title: string;
  description: string;
  url: string;
}

export function getTwitterShareUrl(content: ShareContent): string {
  const params = new URLSearchParams({
    text: `${content.title}\n\n${content.description}`,
    url: content.url,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function getFacebookShareUrl(content: ShareContent): string {
  const params = new URLSearchParams({
    u: content.url,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function getLinkedInShareUrl(content: ShareContent): string {
  const params = new URLSearchParams({
    url: content.url,
  });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

export function getWhatsAppShareUrl(content: ShareContent): string {
  const text = `${content.title}\n${content.description}\n${content.url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getEmailShareUrl(content: ShareContent): string {
  const subject = encodeURIComponent(content.title);
  const body = encodeURIComponent(`${content.description}\n\n${content.url}`);
  return `mailto:?subject=${subject}&body=${body}`;
}
```

### Step 3: Create Share Button Component
```tsx
// apps/web/components/sharing/share-button.tsx
'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@myprotocolstack/ui';
import { toast } from 'sonner';
import { ShareDialog } from './share-dialog';
import { buildShareUrl, type UTMParams } from '@/lib/sharing/utm';

interface ShareButtonProps {
  title: string;
  description: string;
  url: string;
  referralCode?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ShareButton({
  title,
  description,
  url,
  referralCode,
  variant = 'outline',
  size = 'default',
  className,
}: ShareButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const getShareUrl = (source: string) => {
    return buildShareUrl(url, {
      source,
      medium: 'social',
      campaign: 'share',
    }, referralCode);
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl('native');

    // Try Web Share API first (mobile/modern browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
        return;
      } catch (error) {
        // User cancelled or error - fall through to dialog
        if ((error as Error).name === 'AbortError') {
          return; // User cancelled, don't show fallback
        }
      }
    }

    // Fallback: show share dialog
    setShowDialog(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleShare}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <ShareDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={title}
        description={description}
        url={url}
        referralCode={referralCode}
      />
    </>
  );
}
```

### Step 4: Create Share Dialog Component
```tsx
// apps/web/components/sharing/share-dialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@myprotocolstack/ui';
import { Button, Input } from '@myprotocolstack/ui';
import { Twitter, Facebook, Linkedin, Mail, MessageCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTwitterShareUrl,
  getFacebookShareUrl,
  getLinkedInShareUrl,
  getWhatsAppShareUrl,
  getEmailShareUrl,
} from '@/lib/sharing/social-links';
import { buildShareUrl } from '@/lib/sharing/utm';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  url: string;
  referralCode?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  title,
  description,
  url,
  referralCode,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = (source: string) => {
    return buildShareUrl(url, {
      source,
      medium: 'social',
      campaign: 'share',
    }, referralCode);
  };

  const shareContent = (source: string) => ({
    title,
    description,
    url: getShareUrl(source),
  });

  const copyLink = async () => {
    const shareUrl = getShareUrl('copy');
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  const socialButtons = [
    {
      name: 'Twitter',
      icon: Twitter,
      onClick: () => openShareWindow(getTwitterShareUrl(shareContent('twitter'))),
      className: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      onClick: () => openShareWindow(getFacebookShareUrl(shareContent('facebook'))),
      className: 'hover:bg-[#4267B2]/10 hover:text-[#4267B2]',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      onClick: () => openShareWindow(getLinkedInShareUrl(shareContent('linkedin'))),
      className: 'hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      onClick: () => window.open(getWhatsAppShareUrl(shareContent('whatsapp')), '_blank'),
      className: 'hover:bg-[#25D366]/10 hover:text-[#25D366]',
    },
    {
      name: 'Email',
      icon: Mail,
      onClick: () => window.location.href = getEmailShareUrl(shareContent('email')),
      className: 'hover:bg-muted',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Social Buttons */}
          <div className="flex justify-center gap-2">
            {socialButtons.map((button) => (
              <Button
                key={button.name}
                variant="outline"
                size="icon"
                onClick={button.onClick}
                className={button.className}
                title={`Share on ${button.name}`}
              >
                <button.icon className="h-5 w-5" />
              </Button>
            ))}
          </div>

          {/* Copy Link */}
          <div className="flex items-center gap-2">
            <Input
              value={getShareUrl('copy')}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {referralCode && (
            <p className="text-xs text-muted-foreground text-center">
              Your referral code is included. Earn credits when friends sign up!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 5: Create Copy Link Button (Standalone)
```tsx
// apps/web/components/sharing/copy-link-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@myprotocolstack/ui';
import { Link, Check } from 'lucide-react';
import { toast } from 'sonner';
import { buildShareUrl } from '@/lib/sharing/utm';

interface CopyLinkButtonProps {
  url: string;
  referralCode?: string;
  source?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CopyLinkButton({
  url,
  referralCode,
  source = 'copy',
  variant = 'ghost',
  size = 'sm',
  className,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const shareUrl = buildShareUrl(url, {
      source,
      medium: 'social',
      campaign: 'copy_link',
    }, referralCode);

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Link className="h-4 w-4 mr-2" />
          Copy Link
        </>
      )}
    </Button>
  );
}
```

### Step 6: Add Share Button to Protocol Page
```tsx
// apps/web/app/(dashboard)/protocols/[slug]/page.tsx
// Add in component:
import { ShareButton } from '@/components/sharing/share-button';

// In the page component, after fetching protocol and user:
const referralCode = user ? await getReferralCode(user.id) : undefined;

// In JSX, in the header area:
<ShareButton
  title={`${protocol.name} | MyProtocolStack`}
  description={protocol.description || 'Science-backed health protocol'}
  url={`${process.env.NEXT_PUBLIC_APP_URL}/protocols/${protocol.slug}`}
  referralCode={referralCode}
/>
```

### Step 7: Add Share to Protocol Card (Optional)
```tsx
// apps/web/components/protocols/protocol-card.tsx
// Add share icon button in card actions:
import { ShareButton } from '@/components/sharing/share-button';

// In card footer/actions:
<ShareButton
  title={protocol.name}
  description={protocol.description || ''}
  url={`/protocols/${protocol.slug}`}
  size="icon"
  variant="ghost"
/>
```

### Step 8: Create Server Action for Referral Code Lookup
```ts
// apps/web/actions/referrals.ts
// Add helper function:
export async function getUserReferralCode(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', userId)
    .single();

  return data?.code || null;
}
```

## Todo List
- [x] Create `lib/sharing/utm.ts`
- [x] Create `lib/sharing/social-links.ts`
- [x] Create `components/sharing/share-button.tsx`
- [x] Create `components/sharing/share-dialog.tsx`
- [x] Create `components/sharing/copy-link-button.tsx`
- [x] Add ShareButton to protocol detail page
- [x] Add ShareButton to protocol cards (optional)
- [x] **[CRITICAL]** Fix clipboard error handling (C1 from review) - try/catch added
- [x] **[HIGH]** Fix SSR safety check in copy-link-button (H2 from review) - navigator check added
- [x] **[HIGH]** Add memoization to share-dialog (H1 from review) - WONTFIX: low impact per YAGNI
- [ ] Test Web Share API on mobile devices
- [ ] Test fallback dialog on desktop
- [ ] Verify UTM parameters track in analytics

**Review Notes**: Code review completed 251210. All critical fixes applied (error handling, SSR safety). See [review report](./reports/code-reviewer-251210-phase04-social-sharing.md) for details.

## Success Criteria
- Share button triggers native share sheet on mobile
- Fallback dialog shows on desktop browsers
- Social platform buttons open correct intent URLs
- Copy link includes UTM params and referral code
- OG previews display correctly on all platforms
- UTM tracking visible in analytics

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Web Share API unsupported | Med | Low | Fallback dialog always available |
| Share URLs too long | Low | Low | URL shortener if needed (future) |
| Social platform changes | Low | Med | Test quarterly, update URLs |

## Security Considerations
- No sensitive data in share URLs
- Referral codes are not secret (just attribution)
- UTM params are standard tracking
- Open in new window prevents navigation hijacking

## Next Steps
1. Monitor share analytics for most popular channels
2. A/B test share button placement
3. Consider URL shortener for cleaner links
4. Add share tracking events to PostHog
