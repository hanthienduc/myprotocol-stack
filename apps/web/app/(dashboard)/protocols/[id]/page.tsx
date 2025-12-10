import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@myprotocolstack/database/server";
import { Badge, Button, Card, CardContent } from "@myprotocolstack/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StructuredData } from "@/components/seo/structured-data";
import { RelatedArticles } from "@/components/blog/related-articles";
import { ShareButton } from "@/components/sharing/share-button";

interface Props {
  params: Promise<{ id: string }>;
}

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://myprotocolstack.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: protocol } = await supabase
    .from("protocols")
    .select("name, description, category")
    .eq("id", id)
    .single();

  if (!protocol) {
    return { title: "Protocol Not Found" };
  }

  return {
    title: protocol.name,
    description: protocol.description,
    openGraph: {
      title: protocol.name,
      description: protocol.description || "",
      url: `${baseUrl}/protocols/${id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: protocol.name,
      description: protocol.description || "",
    },
  };
}

const categoryColors: Record<string, string> = {
  sleep: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  focus: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  energy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  fitness: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default async function ProtocolDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: protocol, error } = await supabase
    .from("protocols")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !protocol) {
    notFound();
  }

  const protocolSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: protocol.name,
    description: protocol.description,
    totalTime: protocol.duration_minutes
      ? `PT${protocol.duration_minutes}M`
      : undefined,
    step: protocol.steps?.map((step: string, index: number) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: step,
    })),
  };

  return (
    <div className="space-y-6">
      <StructuredData data={protocolSchema} />

      <div className="flex items-center justify-between gap-4">
        <Link href="/protocols">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Protocols
          </Button>
        </Link>
        <ShareButton
          title={`${protocol.name} | MyProtocolStack`}
          description={protocol.description || "Science-backed health protocol"}
          url={`${baseUrl}/protocols/${id}`}
          size="sm"
        />
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{protocol.name}</h1>
              <p className="text-muted-foreground mt-2">{protocol.description}</p>
            </div>
            <Badge
              variant="secondary"
              className={categoryColors[protocol.category]}
            >
              {protocol.category}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={difficultyColors[protocol.difficulty]}
            >
              {protocol.difficulty}
            </Badge>
            {protocol.duration_minutes && (
              <Badge variant="outline">{protocol.duration_minutes} minutes</Badge>
            )}
            <Badge variant="outline">{protocol.frequency}</Badge>
          </div>

          {protocol.tags && protocol.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {protocol.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {protocol.science_summary && (
            <div>
              <h2 className="font-semibold text-lg mb-2">The Science</h2>
              <p className="text-muted-foreground">{protocol.science_summary}</p>
            </div>
          )}

          {protocol.steps && protocol.steps.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-2">How to Do It</h2>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                {protocol.steps.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <RelatedArticles category={protocol.category} />
        </CardContent>
      </Card>
    </div>
  );
}
