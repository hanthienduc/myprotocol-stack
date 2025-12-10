import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";

export const articleCategorySchema = z.enum([
  "sleep",
  "focus",
  "energy",
  "fitness",
  "general",
]);

export type ArticleCategory = z.infer<typeof articleCategorySchema>;

export const articleFrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  category: articleCategorySchema,
  author: z.string().min(1, "Author is required"),
  readingTime: z.string().optional(),
  relatedProtocols: z.array(z.string()).optional(),
  image: z.string().url().optional(),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;

export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "content/blog");

function parseArticle(filename: string): Article | null {
  const slug = filename.replace(".mdx", "");
  const filePath = path.join(BLOG_DIR, filename);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const result = articleFrontmatterSchema.safeParse(data);
  if (!result.success) {
    console.error(`Invalid frontmatter in ${filename}:`, result.error.format());
    return null;
  }

  return { slug, frontmatter: result.data, content };
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => parseArticle(filename))
    .filter((article): article is Article => article !== null)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    );
}

export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  return parseArticle(`${slug}.mdx`);
}

export function getArticleSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(".mdx", ""));
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return getAllArticles().filter((a) => a.frontmatter.category === category);
}
