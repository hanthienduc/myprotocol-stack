import type { MetadataRoute } from "next";
import { createClient } from "@myprotocolstack/database/server";
import { getAllArticles } from "@/lib/blog/articles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://myprotocolstack.com";

  // Fetch all protocols
  const { data: protocols } = await supabase
    .from("protocols")
    .select("id, created_at")
    .order("name");

  const protocolUrls = (protocols || []).map((p) => ({
    url: `${baseUrl}/protocols/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Fetch all blog articles with dates
  const articles = getAllArticles();
  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Fetch public profiles
  const { data: publicProfiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .eq("is_public", true)
    .not("username", "is", null);

  const profileUrls = (publicProfiles || []).map((p) => ({
    url: `${baseUrl}/profile/${p.username}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/protocols`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...protocolUrls,
    ...articleUrls,
    ...profileUrls,
  ];
}
