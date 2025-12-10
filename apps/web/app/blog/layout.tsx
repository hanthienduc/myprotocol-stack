import { BlogHeader } from "@/components/blog/blog-header";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <BlogHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MyProtocolStack</p>
          <nav className="flex items-center gap-4">
            <a href="/blog/feed.xml" className="hover:text-foreground">
              RSS
            </a>
            <a href="/protocols" className="hover:text-foreground">
              Protocols
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
