import Link from "next/link";
import { getArticlesByCategory, type ArticleCategory } from "@/lib/blog/articles";
import { categoryColors } from "@/lib/blog/category-colors";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from "@myprotocolstack/ui";

interface RelatedArticlesProps {
  category: string;
  limit?: number;
}

export function RelatedArticles({ category, limit = 2 }: RelatedArticlesProps) {
  const validCategories: ArticleCategory[] = ["sleep", "focus", "energy", "fitness", "general"];

  if (!validCategories.includes(category as ArticleCategory)) {
    return null;
  }

  const articles = getArticlesByCategory(category as ArticleCategory).slice(0, limit);

  if (articles.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t">
      <h2 className="text-lg font-semibold mb-4">Related Articles</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <Link key={article.slug} href={`/blog/${article.slug}`}>
            <Card className="hover:shadow-md transition-shadow h-full cursor-pointer">
              <CardHeader className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`text-xs ${categoryColors[article.frontmatter.category]}`}>
                    {article.frontmatter.category}
                  </Badge>
                  {article.frontmatter.readingTime && (
                    <span className="text-xs text-muted-foreground">
                      {article.frontmatter.readingTime}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base line-clamp-2">
                  {article.frontmatter.title}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {article.frontmatter.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href={`/blog`}
          className="text-sm text-primary hover:underline"
        >
          View all articles →
        </Link>
      </div>
    </div>
  );
}
