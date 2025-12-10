import { Suspense } from "react";
import { createClient } from "@myprotocolstack/database/server";
import type { Protocol } from "@myprotocolstack/database";
import { ProtocolsList } from "@/components/protocols/protocols-list";

export default async function ProtocolsPage() {
  const supabase = await createClient();

  // Fetch all protocols once
  const { data, error } = await supabase
    .from("protocols")
    .select("*")
    .order("category")
    .order("name");

  if (error) {
    console.error("Error fetching protocols:", error);
  }

  // Fetch user favorites
  let favoriteIds: string[] = [];
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("favorite_protocol_ids")
      .eq("id", user.id)
      .single();
    favoriteIds = profile?.favorite_protocol_ids || [];
  }

  const allProtocols = (data || []) as Protocol[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Protocol Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse science-backed protocols to add to your stacks
        </p>
      </div>

      <Suspense fallback={<ProtocolsListSkeleton />}>
        <ProtocolsList allProtocols={allProtocols} favoriteIds={favoriteIds} />
      </Suspense>
    </div>
  );
}

function ProtocolsListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted rounded w-full max-w-xs" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-20 bg-muted rounded" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
