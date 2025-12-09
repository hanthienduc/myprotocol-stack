import { createClient } from "@myprotocolstack/database/server";
import { ProtocolCard } from "@/components/protocols/protocol-card";
import { ProtocolFilters } from "@/components/protocols/protocol-filters";
import type { Protocol, ProtocolCategory } from "@myprotocolstack/database";

interface ProtocolsPageProps {
  searchParams: Promise<{
    category?: ProtocolCategory;
    search?: string;
    favorites?: string;
  }>;
}

export default async function ProtocolsPage({ searchParams }: ProtocolsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch protocols
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

  // Type assertion and filtering
  let protocols = (data || []) as Protocol[];

  if (params.category) {
    protocols = protocols.filter((p) => p.category === params.category);
  }

  if (params.search) {
    const search = params.search.toLowerCase();
    protocols = protocols.filter((p) =>
      p.name.toLowerCase().includes(search)
    );
  }

  // Filter by favorites if requested
  const showFavoritesOnly = params.favorites === "true";
  if (showFavoritesOnly) {
    protocols = protocols.filter((p) => favoriteIds.includes(p.id));
  }

  // Group by category
  const groupedProtocols = protocols.reduce<Partial<Record<ProtocolCategory, Protocol[]>>>(
    (acc, protocol) => {
      const category = protocol.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(protocol);
      return acc;
    },
    {}
  );

  const categoryLabels: Record<ProtocolCategory, { label: string; icon: string }> = {
    sleep: { label: "Sleep", icon: "🌙" },
    focus: { label: "Focus", icon: "🎯" },
    energy: { label: "Energy", icon: "⚡" },
    fitness: { label: "Fitness", icon: "💪" },
  };

  const categoryOrder: ProtocolCategory[] = ["sleep", "focus", "energy", "fitness"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Protocol Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse science-backed protocols to add to your stacks
        </p>
      </div>

      <ProtocolFilters />

      {params.category ? (
        // Single category view
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {categoryLabels[params.category].icon}{" "}
            {categoryLabels[params.category].label}
            <span className="text-sm font-normal text-muted-foreground">
              ({groupedProtocols[params.category]?.length || 0} protocols)
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupedProtocols[params.category]?.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                isFavorite={favoriteIds.includes(protocol.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        // All categories view
        categoryOrder.map((category) => {
          const categoryProtocols = groupedProtocols[category];
          if (!categoryProtocols?.length) return null;

          return (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {categoryLabels[category].icon} {categoryLabels[category].label}
                <span className="text-sm font-normal text-muted-foreground">
                  ({categoryProtocols.length} protocols)
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryProtocols.map((protocol) => (
                  <ProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    isFavorite={favoriteIds.includes(protocol.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Empty state for favorites filter */}
      {showFavoritesOnly && protocols.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No favorite protocols yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the heart icon on any protocol to add it to your favorites
          </p>
        </div>
      )}

      {/* Empty state for general search */}
      {!showFavoritesOnly && (!protocols || protocols.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No protocols found</p>
        </div>
      )}
    </div>
  );
}
