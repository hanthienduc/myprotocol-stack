import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { cn } from "@myprotocolstack/utils";

interface CalloutProps {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}

function Callout({ type = "info", children }: CalloutProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg mb-4 border",
        type === "info" &&
          "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        type === "warning" &&
          "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
        type === "tip" &&
          "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
      )}
    >
      {children}
    </div>
  );
}

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
      <Link
        href={href || "#"}
        className="text-primary underline hover:no-underline"
      >
        {children}
      </Link>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-muted-foreground">{children}</li>
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
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
        {children}
      </pre>
    ),
    Callout,
    ...components,
  };
}
