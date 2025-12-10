import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/blog/articles";
import { categoryColors } from "@/lib/blog/category-colors";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@myprotocolstack/ui";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Science-backed insights on health protocols, biohacking, and optimization.",
  alternates: {
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
};

// Static generation - rebuild on new deployments
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour

export default function BlogPage() {
  const articles = getAllArticles();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-muted-foreground mt-2">
            Science-backed insights on health protocols and optimization
          </p>
        </div>
        <Link
          href="/blog/feed.xml"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          target="_blank"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z"/>
          </svg>
          RSS
        </Link>
      </div>

      <div className="grid gap-6">
        {articles.map((article) => (
          <Link key={article.slug} href={`/blog/${article.slug}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={categoryColors[article.frontmatter.category]}>
                    {article.frontmatter.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(article.frontmatter.date).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                  {article.frontmatter.readingTime && (
                    <span className="text-sm text-muted-foreground">
                      · {article.frontmatter.readingTime}
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl">
                  {article.frontmatter.title}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {article.frontmatter.description}
                </CardDescription>
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
