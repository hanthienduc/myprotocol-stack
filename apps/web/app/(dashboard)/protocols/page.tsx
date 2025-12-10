import { createClient } from "@myprotocolstack/database/server";
import { ProtocolCard } from "@/components/protocols/protocol-card";
import { ProtocolFilters } from "@/components/protocols/protocol-filters";
import { RecentlyViewedProtocols } from "@/components/protocols/recently-viewed-protocols";
import type { Protocol, ProtocolCategory, ProtocolDifficulty } from "@myprotocolstack/database";
import {
  filterProtocols,
  sortProtocols,
  type ProtocolFilters as FilterType,
  type ProtocolSort,
  type SortField,
  type SortOrder,
} from "@/lib/protocol-filters";

interface ProtocolsPageProps {
  searchParams: Promise<{
    search?: string;
    categories?: string;
    difficulty?: ProtocolDifficulty;
    minDuration?: string;
    maxDuration?: string;
    favorites?: string;
    sort?: SortField;
    order?: SortOrder;
  }>;
}

export default async function ProtocolsPage({ searchParams }: ProtocolsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch all protocols
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
  const totalCount = allProtocols.length;

  // Build filter object from URL params
  const filters: FilterType = {
    query: params.search,
    categories: params.categories
      ? (params.categories.split(",") as ProtocolCategory[])
      : undefined,
    difficulty: params.difficulty,
    minDuration: params.minDuration ? parseInt(params.minDuration, 10) : undefined,
    maxDuration: params.maxDuration ? parseInt(params.maxDuration, 10) : undefined,
    favorites: params.favorites === "true",
  };

  // Build sort object from URL params
  const sort: ProtocolSort = {
    field: params.sort || "name",
    order: params.order || "asc",
  };

  // Apply filters and sort
  let protocols = filterProtocols(allProtocols, filters, favoriteIds);
  protocols = sortProtocols(protocols, sort);
  const filteredCount = protocols.length;

  // Group by category for display
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

  // Check if we have active category filters for single category view
  const singleCategory = filters.categories?.length === 1 ? filters.categories[0] : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Protocol Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse science-backed protocols to add to your stacks
        </p>
      </div>

      <ProtocolFilters totalCount={totalCount} filteredCount={filteredCount} />

      {/* Recently Viewed - only show when no filters active */}
      {!filters.query && !filters.categories?.length && !filters.difficulty &&
       !filters.minDuration && !filters.maxDuration && !filters.favorites && (
        <RecentlyViewedProtocols
          allProtocols={allProtocols}
          favoriteIds={favoriteIds}
        />
      )}

      {singleCategory ? (
        // Single category view
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {categoryLabels[singleCategory].icon} {categoryLabels[singleCategory].label}
            <span className="text-sm font-normal text-muted-foreground">
              ({groupedProtocols[singleCategory]?.length || 0} protocols)
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupedProtocols[singleCategory]?.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                isFavorite={favoriteIds.includes(protocol.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        // All categories view (grouped)
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
      {filters.favorites && protocols.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No favorite protocols yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the heart icon on any protocol to add it to your favorites
          </p>
        </div>
      )}

      {/* Empty state for general filters */}
      {!filters.favorites && protocols.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No protocols found matching your filters</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
