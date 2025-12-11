import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticleSlugs } from "@/lib/blog/articles";
import { categoryColors } from "@/lib/blog/category-colors";
import { RelatedProtocols } from "@/components/blog/related-protocols";
import { StructuredData } from "@/components/seo/structured-data";
import { Badge, Button } from "@myprotocolstack/ui";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://protocolstack.app";

  return {
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    openGraph: {
      title: article.frontmatter.title,
      description: article.frontmatter.description,
      type: "article",
      publishedTime: article.frontmatter.date,
      authors: [article.frontmatter.author],
      url: `${baseUrl}/blog/${slug}`,
      images: article.frontmatter.image
        ? [{ url: article.frontmatter.image }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.frontmatter.title,
      description: article.frontmatter.description,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  // Dynamic import of MDX content with error handling
  let Content: React.ComponentType;
  try {
    const mdxModule = await import(`@/content/blog/${slug}.mdx`);
    Content = mdxModule.default;
  } catch {
    notFound();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://protocolstack.app";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.frontmatter.title,
    description: article.frontmatter.description,
    datePublished: article.frontmatter.date,
    author: { "@type": "Person", name: article.frontmatter.author },
    publisher: { "@type": "Organization", name: "MyProtocolStack" },
    mainEntityOfPage: `${baseUrl}/blog/${slug}`,
    image: article.frontmatter.image,
  };

  return (
    <article className="max-w-3xl mx-auto py-8 px-4">
      <StructuredData data={articleSchema} />

      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge className={categoryColors[article.frontmatter.category]}>
            {article.frontmatter.category}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(article.frontmatter.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {article.frontmatter.readingTime && (
            <span className="text-sm text-muted-foreground">
              · {article.frontmatter.readingTime}
            </span>
          )}
        </div>
        <h1 className="text-4xl font-bold mb-4">{article.frontmatter.title}</h1>
        <p className="text-xl text-muted-foreground">
          {article.frontmatter.description}
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          By {article.frontmatter.author}
        </p>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <Content />
      </div>

      {article.frontmatter.relatedProtocols &&
        article.frontmatter.relatedProtocols.length > 0 && (
          <RelatedProtocols slugs={article.frontmatter.relatedProtocols} />
        )}
    </article>
  );
}
