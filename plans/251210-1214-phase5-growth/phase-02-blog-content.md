# Phase 02: Blog/Content System

## Context
- **Parent**: [plan.md](./plan.md)
- **Dependencies**: Phase 01 (SEO Foundation) for metadata patterns
- **Docs**: [SEO Research](./research/researcher-seo-og-report.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 251210 |
| Completion Date | 251210 |
| Description | MDX-based blog for content marketing & SEO |
| Priority | P1 |
| Implementation Status | ✅ DONE |
| Review Status | ✅ Reviewed - All Items Addressed |
| Review Date | 2025-12-10 |
| Review Grade | A |
| Review Report | [code-reviewer-251210-phase02-blog-content.md](./reports/code-reviewer-251210-phase02-blog-content.md) |

## Key Insights
- **MDX recommended for MVP**: Git-tracked, no CMS dependency, simpler than DB
- No external blog platform needed - Next.js has native MDX support
- Content drives organic traffic, links back to protocols
- Categories align with protocol categories (sleep, focus, energy, fitness)

## Decision: MDX vs Database

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **MDX** | Git-tracked, versioned, no infra, fast builds | No admin UI, dev-only edits | **YES** |
| Database | Admin UI, dynamic, user comments | More complexity, needs CMS | Future |
| External CMS | Full features | Vendor lock-in, cost | No |

**Rationale**: For MVP, MDX keeps blog simple. Content updates through PRs. Migrate to DB/CMS when scaling content team.

## Requirements
1. Blog index page at `/blog` with article list
2. Individual article pages at `/blog/[slug]`
3. MDX support with custom components (callouts, code blocks)
4. Article frontmatter: title, description, date, category, author, relatedProtocols
5. Category filtering on index
6. SEO metadata per article
7. Related protocols section linking to protocol pages

## Architecture

```
apps/web/
├── app/
│   ├── blog/
│   │   ├── page.tsx              # Blog index
│   │   └── [slug]/
│   │       └── page.tsx          # Article page (dynamic import MDX)
├── content/
│   └── blog/
│       ├── morning-sunlight-science.mdx
│       ├── cold-exposure-benefits.mdx
│       └── intermittent-fasting-guide.mdx
├── components/
│   └── blog/
│       ├── article-card.tsx
│       ├── article-content.tsx
│       ├── mdx-components.tsx    # Custom MDX components
│       └── related-protocols.tsx
├── lib/
│   └── blog/
│       └── articles.ts           # Article fetching utilities
```

## Related Code Files

### Create
- `apps/web/app/blog/page.tsx`
- `apps/web/app/blog/[slug]/page.tsx`
- `apps/web/content/blog/` (directory + sample articles)
- `apps/web/components/blog/article-card.tsx`
- `apps/web/components/blog/article-content.tsx`
- `apps/web/components/blog/mdx-components.tsx`
- `apps/web/components/blog/related-protocols.tsx`
- `apps/web/lib/blog/articles.ts`
- `apps/web/mdx-components.tsx` (root level for Next.js)

### Modify
- `apps/web/next.config.ts` - Add MDX support
- `apps/web/app/sitemap.ts` - Include blog articles

## Implementation Steps

### Step 1: Install MDX Dependencies
```bash
pnpm add @next/mdx @mdx-js/loader @mdx-js/react gray-matter
pnpm add -D @types/mdx
```

### Step 2: Configure Next.js for MDX
```ts
// apps/web/next.config.ts
import createMDX from '@next/mdx';

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // ... existing config
};

export default withMDX(nextConfig);
```

### Step 3: Create Article Types & Utilities
```ts
// apps/web/lib/blog/articles.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface ArticleFrontmatter {
  title: string;
  description: string;
  date: string;
  category: 'sleep' | 'focus' | 'energy' | 'fitness' | 'general';
  author: string;
  readingTime?: string;
  relatedProtocols?: string[]; // protocol slugs
  image?: string;
}

export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export function getAllArticles(): Article[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));

  return files
    .map((filename) => {
      const slug = filename.replace('.mdx', '');
      const filePath = path.join(BLOG_DIR, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        frontmatter: data as ArticleFrontmatter,
        content,
      };
    })
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
}

export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return { slug, frontmatter: data as ArticleFrontmatter, content };
}

export function getArticleSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace('.mdx', ''));
}
```

### Step 4: Create MDX Components
```tsx
// apps/web/components/blog/mdx-components.tsx
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { cn } from '@myprotocolstack/ui/lib/utils';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-medium mt-4 mb-2">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-muted-foreground leading-7 mb-4">{children}</p>
    ),
    a: ({ href, children }) => (
      <Link href={href || '#'} className="text-primary underline hover:no-underline">
        {children}
      </Link>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
    ),
    // Custom callout component
    Callout: ({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) => (
      <div className={cn(
        'p-4 rounded-lg mb-4 border',
        type === 'info' && 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
        type === 'warning' && 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
        type === 'tip' && 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
      )}>
        {children}
      </div>
    ),
    ...components,
  };
}
```

### Step 5: Create Root MDX Components Export
```tsx
// apps/web/mdx-components.tsx
export { useMDXComponents } from '@/components/blog/mdx-components';
```

### Step 6: Create Blog Index Page
```tsx
// apps/web/app/blog/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '@/lib/blog/articles';
import { Badge, Card, CardHeader, CardTitle, CardDescription } from '@myprotocolstack/ui';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Science-backed insights on health protocols, biohacking, and optimization.',
};

export default function BlogPage() {
  const articles = getAllArticles();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="text-muted-foreground mt-2">
          Science-backed insights on health protocols and optimization
        </p>
      </div>

      <div className="grid gap-6">
        {articles.map((article) => (
          <Link key={article.slug} href={`/blog/${article.slug}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">
                    {article.frontmatter.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(article.frontmatter.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <CardTitle>{article.frontmatter.title}</CardTitle>
                <CardDescription>{article.frontmatter.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}

        {articles.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            No articles yet. Check back soon!
          </p>
        )}
      </div>
    </div>
  );
}
```

### Step 7: Create Article Detail Page
```tsx
// apps/web/app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getArticleSlugs } from '@/lib/blog/articles';
import { RelatedProtocols } from '@/components/blog/related-protocols';
import { StructuredData } from '@/components/seo/structured-data';
import { Badge } from '@myprotocolstack/ui';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found' };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';

  return {
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    openGraph: {
      title: article.frontmatter.title,
      description: article.frontmatter.description,
      type: 'article',
      publishedTime: article.frontmatter.date,
      authors: [article.frontmatter.author],
      url: `${baseUrl}/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.frontmatter.title,
      description: article.frontmatter.description,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  // Dynamic import of MDX content
  const { default: Content } = await import(`@/content/blog/${slug}.mdx`);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprotocolstack.com';
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.frontmatter.title,
    description: article.frontmatter.description,
    datePublished: article.frontmatter.date,
    author: { '@type': 'Person', name: article.frontmatter.author },
    publisher: { '@type': 'Organization', name: 'MyProtocolStack' },
    mainEntityOfPage: `${baseUrl}/blog/${slug}`,
  };

  return (
    <article className="max-w-3xl mx-auto py-8">
      <StructuredData data={articleSchema} />

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="capitalize">
            {article.frontmatter.category}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(article.frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{article.frontmatter.title}</h1>
        <p className="text-xl text-muted-foreground">{article.frontmatter.description}</p>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <Content />
      </div>

      {article.frontmatter.relatedProtocols && (
        <RelatedProtocols slugs={article.frontmatter.relatedProtocols} />
      )}
    </article>
  );
}
```

### Step 8: Create Sample Article
```mdx
---
title: "The Science of Morning Sunlight Exposure"
description: "How 10-30 minutes of morning sunlight can transform your sleep, energy, and focus throughout the day."
date: "2025-01-15"
category: "sleep"
author: "MyProtocolStack"
relatedProtocols: ["morning-sunlight-exposure", "consistent-sleep-wake-time"]
---

Morning sunlight exposure is one of the most powerful, free interventions for optimizing your circadian rhythm and overall health.

## Why Morning Light Matters

When light enters your eyes in the morning, it signals to your brain's suprachiasmatic nucleus (SCN) that it's time to wake up. This triggers a cascade of hormonal changes:

- **Cortisol spike**: Healthy morning cortisol helps you feel alert
- **Melatonin suppression**: Stops sleep hormone production
- **Dopamine release**: Improves mood and motivation

<Callout type="tip">
Get outside within 30-60 minutes of waking for best results. Cloudy days still work - outdoor light is 10-50x brighter than indoor.
</Callout>

## The Protocol

1. Wake up at a consistent time
2. Go outside within 30-60 minutes
3. Spend 10-30 minutes in natural light (no sunglasses)
4. Face toward the sun (don't stare directly)

## Research Support

Studies show morning light exposure can:

- Improve sleep onset by 20-30 minutes
- Reduce symptoms of seasonal depression
- Enhance cognitive performance throughout the day

Ready to try it? Add the [Morning Sunlight Protocol](/protocols/morning-sunlight-exposure) to your stack.
```

### Step 9: Create Related Protocols Component
```tsx
// apps/web/components/blog/related-protocols.tsx
import Link from 'next/link';
import { createClient } from '@myprotocolstack/database/server';
import { Card, CardHeader, CardTitle, CardDescription, Badge } from '@myprotocolstack/ui';

interface RelatedProtocolsProps {
  slugs: string[];
}

export async function RelatedProtocols({ slugs }: RelatedProtocolsProps) {
  const supabase = await createClient();
  const { data: protocols } = await supabase
    .from('protocols')
    .select('name, slug, description, category')
    .in('slug', slugs);

  if (!protocols?.length) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-4">Related Protocols</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {protocols.map((protocol) => (
          <Link key={protocol.slug} href={`/protocols/${protocol.slug}`}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader>
                <Badge variant="outline" className="w-fit capitalize mb-2">
                  {protocol.category}
                </Badge>
                <CardTitle className="text-lg">{protocol.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {protocol.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Step 10: Update Sitemap
```ts
// Add to apps/web/app/sitemap.ts
import { getArticleSlugs } from '@/lib/blog/articles';

// In sitemap function, add:
const articleSlugs = getArticleSlugs();
const articleUrls = articleSlugs.map((slug) => ({
  url: `${baseUrl}/blog/${slug}`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
}));

// Include in return array: ...articleUrls
```

## Todo List
- [x] Install MDX dependencies (@next/mdx, gray-matter)
- [x] Configure next.config.ts for MDX
- [x] Create `lib/blog/articles.ts` utilities
- [x] Create `components/blog/mdx-components.tsx`
- [x] Create root `mdx-components.tsx`
- [x] Create `app/blog/page.tsx` index
- [x] Create `app/blog/[slug]/page.tsx` detail
- [x] Create `components/blog/related-protocols.tsx`
- [x] Create `content/blog/` directory
- [x] Write 8 sample articles (2 per category: sleep, focus, energy, fitness)
- [x] Update sitemap.ts to include blog articles
- [x] Test MDX rendering and custom components
- [x] Add RSS feed at /blog/feed.xml
- [x] Implement internal linking (blog <-> protocols)
- [x] Add blog navigation to landing page header/footer

## Post-Review Action Items (ADDRESSED)
- [x] **H2**: Add frontmatter validation with Zod schema (prevents build failures)
- [x] **M2**: Extract categoryColors to shared constants file (DRY violation)
- [x] **H1**: Add static generation config to blog index page (performance)
- [x] **H3**: Verify database index exists on protocols.slug column
- [x] **M5**: Add @tailwindcss/typography plugin or remove prose classes
- [x] **M1**: Add error boundary for MDX dynamic import
- [x] **M4**: Fix sitemap lastModified dates to use article dates
- [x] **M3**: Add rel="noopener" to external links

## Success Criteria
- Blog index shows all articles sorted by date
- Article pages render MDX with custom components
- Related protocols link to protocol pages
- SEO metadata correct on all blog pages
- Articles appear in sitemap.xml

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MDX build errors | Low | Med | Strict frontmatter validation |
| Slow builds with many articles | Low | Low | Static generation, ISR |
| Content quality | Med | Med | Editorial guidelines |

## Security Considerations
- No user-generated content in MDX
- All MDX files git-tracked and reviewed
- No dynamic MDX evaluation

## Next Steps
1. Write 5-10 foundational articles covering each protocol category
2. Internal linking strategy (protocols <-> blog)
3. Consider RSS feed for subscribers
4. Track article performance in analytics
