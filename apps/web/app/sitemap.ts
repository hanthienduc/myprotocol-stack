import type { MetadataRoute } from "next";
import { createClient } from "@myprotocolstack/database/server";

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
    // Note: Blog routes will be added in Phase 02
    ...protocolUrls,
  ];
}
