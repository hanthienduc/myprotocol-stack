import Link from "next/link";
import { Button } from "@myprotocolstack/ui";

export function BlogHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold">
            MyProtocolStack
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/blog" className="text-muted-foreground hover:text-foreground">
            Blog
          </Link>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/protocols">
            <Button variant="ghost" size="sm">
              Protocols
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
