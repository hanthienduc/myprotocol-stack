import { getAllArticles } from "@/lib/blog/articles";

export async function GET() {
  const articles = getAllArticles();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myprotocolstack.com";

  const rssItems = articles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${article.frontmatter.title}]]></title>
      <link>${baseUrl}/blog/${article.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${article.slug}</guid>
      <description><![CDATA[${article.frontmatter.description}]]></description>
      <pubDate>${new Date(article.frontmatter.date).toUTCString()}</pubDate>
      <category>${article.frontmatter.category}</category>
      <author>${article.frontmatter.author}</author>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MyProtocolStack Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Science-backed insights on health protocols, biohacking, and optimization.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
