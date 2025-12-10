# SEO & Open Graph Implementation for Next.js 16 App Router

**Date:** 2025-12-10 | **Project:** MyProtocolStack

## Executive Summary

Next.js 16 provides native SEO capabilities via Metadata API, eliminating need for external packages. Use `generateMetadata` for dynamic pages, file-based conventions for OG/Twitter images, native sitemap.ts/robots.ts, and JSON-LD for structured data. App Router streams metadata separately, improving perceived performance.

---

## 1. Metadata API (generateMetadata & Static)

### Static Metadata (Layout/Page)
```typescript
// app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MyProtocolStack - Build Science-Backed Health Protocols',
  description: 'Browse 30+ curated health protocols. Create custom stacks. Track adherence.',
  keywords: 'health protocols, wellness, habit tracking',
  applicationName: 'MyProtocolStack',
  authors: [{ name: 'MyProtocolStack' }],
  creator: 'MyProtocolStack',
  formatDetection: { email: false, telephone: false, address: false }
}
```

### Dynamic Metadata (Page Parameters)
```typescript
// app/(dashboard)/protocols/[slug]/page.tsx
import { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const protocol = await fetchProtocol(slug)

  return {
    title: protocol.name,
    description: protocol.description,
    openGraph: {
      title: protocol.name,
      description: protocol.description,
      url: `https://myprotocolstack.com/protocols/${slug}`,
      type: 'website',
      images: [
        {
          url: protocol.imageUrl,
          width: 1200,
          height: 630,
          alt: protocol.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: protocol.name,
      description: protocol.description,
      images: [protocol.imageUrl],
      creator: '@MyProtocolStack'
    }
  }
}
```

### New in Next.js 16: Streaming Metadata
Metadata streams separately without blocking UI rendering for dynamic routes. Disabled for bots/crawlers expecting `<head>` tags.

---

## 2. OpenGraph & Twitter Cards

### Best Practices
- **OG Image:** 1200x630px (1.91:1 ratio), max 8MB
- **Twitter Image:** 5MB max (same 1200x630 optimal)
- **Card Type:** Use `summary_large_image` (18% more engagement than summary)
- **Title:** Max 70 chars | **Description:** Max 200 chars

### File-Based Images
```
app/
├── opengraph-image.jpg (site default)
├── twitter-image.jpg
├── (dashboard)/protocols/[slug]/
│   ├── opengraph-image.tsx (dynamic generation)
│   └── twitter-image.tsx
```

### Dynamic OG Image Generation
```typescript
// app/(dashboard)/protocols/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Protocol Open Graph Image'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const protocol = await fetchProtocol(slug)

  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 60,
        fontWeight: 'bold',
        color: 'white'
      }}>
        {protocol.name}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

---

## 3. Sitemap & robots.txt (Native APIs)

### Sitemap Generation
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const protocols = await fetchAllProtocols()
  const baseUrl = 'https://myprotocolstack.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1
    },
    ...protocols.map(p => ({
      url: `${baseUrl}/protocols/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8
    }))
  ]
}
```

### robots.txt Configuration
```typescript
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
        crawlDelay: 1
      },
      {
        userAgent: 'GPTBot',
        disallow: '/'
      }
    ],
    sitemap: 'https://myprotocolstack.com/sitemap.xml',
    host: 'https://myprotocolstack.com'
  }
}
```

---

## 4. JSON-LD Structured Data

### Reusable StructuredData Component
```typescript
// components/StructuredData.tsx
export interface StructuredDataProps {
  data: Record<string, any>
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  )
}
```

### Protocol Schema Example
```typescript
// app/(dashboard)/protocols/[slug]/page.tsx
<StructuredData
  data={{
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: protocol.name,
    description: protocol.description,
    image: protocol.imageUrl,
    author: { '@type': 'Organization', name: 'MyProtocolStack' },
    datePublished: protocol.createdAt,
    inLanguage: 'en-US'
  }}
/>
```

### Organization Schema (Layout)
```typescript
// app/layout.tsx - in root HTML
<StructuredData
  data={{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MyProtocolStack',
    url: 'https://myprotocolstack.com',
    logo: 'https://myprotocolstack.com/logo.png',
    sameAs: ['https://twitter.com/MyProtocolStack'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Support',
      email: 'support@myprotocolstack.com'
    }
  }}
/>
```

---

## 5. Recommended Packages & Configuration

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| **next** | 16.x | Native sitemap/robots/metadata | No external package needed |
| **next-og** | Built-in | Dynamic OG image generation | Use via `next/og` |
| **zod** | 3.x | Schema validation for metadata | Type-safe OG/structured data |

**Alternative:** `next-sitemap` (7.x) for advanced multi-language sitemaps only if native sitemap.ts insufficient.

---

## 6. MyProtocolStack Implementation Roadmap

### Phase 1: Foundation
- [ ] Update root layout metadata (title, description, OG defaults)
- [ ] Add organization JSON-LD schema to layout
- [ ] Create static sitemap.ts and robots.ts
- [ ] Configure robots.ts to disallow /api, /admin routes

### Phase 2: Dynamic Routes
- [ ] Implement generateMetadata for `/protocols/[slug]`
- [ ] Add protocol JSON-LD schema to protocol detail page
- [ ] Create dynamic `opengraph-image.tsx` for protocol sharing
- [ ] Add Twitter metadata to protocol pages

### Phase 3: Social Optimization
- [ ] Setup `twitter-image.tsx` with custom branding
- [ ] Configure site-wide Twitter handle in metadata
- [ ] Test OG images via Facebook Sharing Debugger, Twitter validator
- [ ] Add og:image:alt tags for accessibility

### Phase 4: Performance & Monitoring
- [ ] Implement streaming metadata for dynamic routes
- [ ] Monitor Core Web Vitals impact
- [ ] Add structured data testing via Google's Rich Results Tester
- [ ] Setup search console monitoring

---

## Key Performance Metrics

- Static metadata improves build performance (cached at build time)
- Streaming metadata in Next.js 16 improves LCP by deferring head completion
- OG image optimization can increase social CTR by 30-40%
- JSON-LD rich results improve SERP visibility for featured snippets

---

## Sources

- [Next.js Metadata API Documentation](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js Getting Started: Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Meta Tags & Open Graph Complete Implementation Guide](https://vladimirsiedykh.com/blog/meta-tags-open-graph-complete-implementation-guide-nextjs-react-helmet)
- [Dynamic Open Graph in Next.js App Router](https://www.bbnsinc.com/blog/dynamic-open-graph-in-next-js-app-router)
- [Next.js App Router SEO Features](https://www.kodaps.dev/en/blog/nextjs-app-seo-features)
- [Generating Dynamic robots.txt and sitemap.xml in Next.js App Router](https://dev.to/arfatapp/generating-dynamic-robotstxt-and-sitemapxml-in-a-nextjs-app-router-with-typescript-35l9)
- [Complete Next.js SEO Guide for Building Crawlable Apps](https://strapi.io/blog/nextjs-seo)
