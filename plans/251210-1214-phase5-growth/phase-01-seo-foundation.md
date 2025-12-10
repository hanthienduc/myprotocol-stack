# Phase 01: SEO Foundation

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: None (can start immediately)
- **Docs**: [SEO Research](./research/researcher-seo-og-report.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 251210 |
| Description | SEO infrastructure using native Next.js 16 APIs |
| Priority | P0 |
| Implementation Status | Complete |
| Review Status | ✅ Approved |
| Review Report | [code-review-251210-seo-foundation.md](./reports/code-review-251210-seo-foundation.md) |

## Key Insights
- Next.js 16 provides native Metadata API - no external packages needed
- `generateMetadata` for dynamic routes, static export for fixed pages
- File-based OG images (`opengraph-image.tsx`) auto-discovered
- Sitemap/robots via `.ts` files with type-safe MetadataRoute
- JSON-LD for structured data (Organization, Thing schemas)

## Requirements
1. Enhanced root layout metadata (title template, OG defaults, Twitter config)
2. Dynamic `generateMetadata` for `/protocols/[slug]` pages
3. Sitemap.xml with all protocols and static pages
4. Robots.txt blocking /api, /auth, crawlers
5. Organization JSON-LD schema on layout
6. Protocol JSON-LD schema on detail pages
7. Dynamic OG image generation for protocol sharing

## Architecture

```
apps/web/app/
├── layout.tsx              # Enhanced metadata + Organization JSON-LD
├── sitemap.ts              # Dynamic sitemap generation
├── robots.ts               # Robots.txt configuration
├── opengraph-image.tsx     # Default site OG image (static)
├── twitter-image.tsx       # Default Twitter card image
├── (dashboard)/protocols/[slug]/
│   ├── page.tsx            # Add generateMetadata + Protocol JSON-LD
│   └── opengraph-image.tsx # Dynamic OG image per protocol
components/
├── seo/
│   └── structured-data.tsx # Reusable JSON-LD component
```

## Related Code Files

### Create
- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`
- `apps/web/app/opengraph-image.tsx`
- `apps/web/app/twitter-image.tsx`
- `apps/web/app/(dashboard)/protocols/[slug]/opengraph-image.tsx`
- `apps/web/components/seo/structured-data.tsx`

### Modify
- `apps/web/app/layout.tsx` - Enhanced metadata + JSON-LD
- `apps/web/app/(dashboard)/protocols/[slug]/page.tsx` - Add generateMetadata

## Implementation Steps

### Step 1: Create StructuredData Component
```tsx
// apps/web/components/seo/structured-data.tsx
interface StructuredDataProps {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  );
}
```

### Step 2: Enhance Root Layout Metadata
```tsx
// apps/web/app/layout.tsx
import { Metadata } from 'next';
import { StructuredData } from '@/components/seo/structured-data';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MyProtocolStack - Build Science-Backed Health Protocols',
    template: '%s | MyProtocolStack',
  },
  description: 'Build and track personalized health protocols. Browse 30+ curated protocols, create custom stacks, track adherence.',
  keywords: ['health protocols', 'biohacking', 'habit tracking', 'sleep optimization', 'productivity'],
  authors: [{ name: 'MyProtocolStack' }],
  creator: 'MyProtocolStack',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'MyProtocolStack',
    title: 'MyProtocolStack - Build Science-Backed Health Protocols',
    description: 'Build and track personalized health protocols based on science.',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'MyProtocolStack' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyProtocolStack',
    description: 'Build and track personalized health protocols.',
    creator: '@MyProtocolStack',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

// Add in body: <StructuredData data={organizationSchema} />
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MyProtocolStack',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  sameAs: ['https://twitter.com/MyProtocolStack'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Support',
    email: 'support@myprotocolstack.com',
  },
};
```

### Step 3: Create sitemap.ts
```tsx
// apps/web/app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@myprotocolstack/database/server';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';

  // Fetch all protocols
  const { data: protocols } = await supabase
    .from('protocols')
    .select('slug, updated_at')
    .order('slug');

  const protocolUrls = (protocols || []).map((p) => ({
    url: `${baseUrl}/protocols/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/protocols`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    ...protocolUrls,
  ];
}
```

### Step 4: Create robots.ts
```tsx
// apps/web/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/(dashboard)/today/', '/(dashboard)/settings/', '/(dashboard)/analytics/'],
      },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
```

### Step 5: Add generateMetadata to Protocol Detail Page
```tsx
// apps/web/app/(dashboard)/protocols/[slug]/page.tsx
import { Metadata } from 'next';
import { createClient } from '@myprotocolstack/database/server';
import { StructuredData } from '@/components/seo/structured-data';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: protocol } = await supabase
    .from('protocols')
    .select('name, description, category')
    .eq('slug', slug)
    .single();

  if (!protocol) return { title: 'Protocol Not Found' };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';

  return {
    title: protocol.name,
    description: protocol.description,
    openGraph: {
      title: protocol.name,
      description: protocol.description || '',
      url: `${baseUrl}/protocols/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: protocol.name,
      description: protocol.description || '',
    },
  };
}

// In component, add Protocol JSON-LD:
// <StructuredData data={{ '@context': 'https://schema.org', '@type': 'Thing', name, description }} />
```

### Step 6: Create Dynamic OG Image for Protocols
```tsx
// apps/web/app/(dashboard)/protocols/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { createClient } from '@myprotocolstack/database/server';

export const runtime = 'edge';
export const alt = 'Protocol Image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: protocol } = await supabase
    .from('protocols')
    .select('name, category, difficulty')
    .eq('slug', slug)
    .single();

  const name = protocol?.name || 'Protocol';
  const category = protocol?.category || '';

  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: 60,
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32, color: '#94a3b8' }}>MyProtocolStack</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 'bold', color: 'white', lineHeight: 1.2 }}>
            {name}
          </div>
          <div style={{
            fontSize: 28,
            color: '#60a5fa',
            textTransform: 'capitalize',
          }}>
            {category} Protocol
          </div>
        </div>
        <div style={{ fontSize: 24, color: '#64748b' }}>
          Science-backed health optimization
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### Step 7: Create Default Site OG Image
```tsx
// apps/web/app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MyProtocolStack';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: 60,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: 72, fontWeight: 'bold', color: 'white', marginBottom: 24 }}>
          MyProtocolStack
        </div>
        <div style={{ fontSize: 32, color: '#94a3b8', textAlign: 'center' }}>
          Build and track science-backed health protocols
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

## Todo List
- [x] Create `components/seo/structured-data.tsx`
- [x] Update `app/layout.tsx` with enhanced metadata + Organization JSON-LD
- [x] Create `app/sitemap.ts`
- [x] Create `app/robots.ts`
- [x] Create `app/opengraph-image.tsx` (default)
- [x] Create `app/twitter-image.tsx` (copy of OG)
- [x] Add `generateMetadata` to protocol detail page
- [x] Create `protocols/[id]/opengraph-image.tsx` (using ID, not slug)
- [x] Add Protocol JSON-LD to protocol detail page (upgraded to HowTo schema)
- [ ] **[BLOCKING]** Fix sitemap: Add updated_at column to protocols table
- [ ] **[BLOCKING]** Decision: Keep ID-based URLs or migrate to slug-based
- [ ] Test with Facebook Sharing Debugger (manual)
- [ ] Test with Twitter Card Validator (manual)
- [ ] Submit sitemap to Google Search Console (post-deploy)

## Success Criteria
- All protocol pages have unique meta titles/descriptions
- OG images render correctly on social platforms
- Sitemap.xml accessible and includes all protocols
- robots.txt blocks private routes
- JSON-LD validates in Google Rich Results Test
- No SEO-related console errors

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OG image generation slow | Low | Med | Edge runtime, cache headers |
| Missing protocols in sitemap | Low | Med | Query all protocols, no pagination |
| Metadata streaming issues | Low | Low | Next.js handles crawler detection |

## Security Considerations
- No user data exposed in metadata
- Private routes blocked in robots.txt
- No API keys in client-side code

## Next Steps
After SEO foundation complete:
1. Submit sitemap to Google Search Console
2. Monitor indexing progress
3. Begin Phase 02 (Blog/Content) for organic traffic
