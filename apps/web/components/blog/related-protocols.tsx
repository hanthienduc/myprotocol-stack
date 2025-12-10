import Link from "next/link";
import { createClient } from "@myprotocolstack/database/server";
import { categoryColors } from "@/lib/blog/category-colors";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from "@myprotocolstack/ui";

interface RelatedProtocolsProps {
  slugs: string[];
}

export async function RelatedProtocols({ slugs }: RelatedProtocolsProps) {
  const supabase = await createClient();
  const { data: protocols } = await supabase
    .from("protocols")
    .select("name, slug, description, category")
    .in("slug", slugs);

  if (!protocols?.length) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-4">Related Protocols</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {protocols.map((protocol) => (
          <Link key={protocol.slug} href={`/protocols/${protocol.slug}`}>
            <Card className="hover:shadow-md transition-shadow h-full cursor-pointer">
              <CardHeader>
                <Badge
                  className={`w-fit mb-2 ${categoryColors[protocol.category] || ""}`}
                >
                  {protocol.category}
                </Badge>
                <CardTitle className="text-lg">{protocol.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {protocol.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
