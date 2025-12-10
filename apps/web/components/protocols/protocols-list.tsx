"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Protocol, ProtocolCategory, ProtocolDifficulty } from "@myprotocolstack/database";
import { ProtocolCard } from "./protocol-card";
import { ProtocolFilters } from "./protocol-filters";
import { RecentlyViewedProtocols } from "./recently-viewed-protocols";
import {
  filterProtocols,
  sortProtocols,
  type ProtocolFilters as FilterType,
  type ProtocolSort,
  type SortField,
  type SortOrder,
} from "@/lib/protocol-filters";

interface ProtocolsListProps {
  allProtocols: Protocol[];
  favoriteIds: string[];
}

const categoryLabels: Record<ProtocolCategory, { label: string; icon: string }> = {
  sleep: { label: "Sleep", icon: "🌙" },
  focus: { label: "Focus", icon: "🎯" },
  energy: { label: "Energy", icon: "⚡" },
  fitness: { label: "Fitness", icon: "💪" },
};

const categoryOrder: ProtocolCategory[] = ["sleep", "focus", "energy", "fitness"];

export function ProtocolsList({ allProtocols, favoriteIds }: ProtocolsListProps) {
  const searchParams = useSearchParams();

  // Parse filters from URL - client-side
  const filters = useMemo((): FilterType => {
    const categories = searchParams.get("categories");
    const tags = searchParams.get("tags");
    return {
      query: searchParams.get("search") || undefined,
      categories: categories ? (categories.split(",") as ProtocolCategory[]) : undefined,
      difficulty: (searchParams.get("difficulty") as ProtocolDifficulty) || undefined,
      minDuration: searchParams.get("minDuration")
        ? parseInt(searchParams.get("minDuration")!, 10)
        : undefined,
      maxDuration: searchParams.get("maxDuration")
        ? parseInt(searchParams.get("maxDuration")!, 10)
        : undefined,
      tags: tags ? tags.split(",") : undefined,
      favorites: searchParams.get("favorites") === "true",
    };
  }, [searchParams]);

  // Parse sort from URL
  const sort = useMemo((): ProtocolSort => ({
    field: (searchParams.get("sort") as SortField) || "name",
    order: (searchParams.get("order") as SortOrder) || "asc",
  }), [searchParams]);

  // Apply filters and sort - client-side (instant)
  const { protocols, filteredCount } = useMemo(() => {
    let result = filterProtocols(allProtocols, filters, favoriteIds);
    result = sortProtocols(result, sort);
    return { protocols: result, filteredCount: result.length };
  }, [allProtocols, filters, favoriteIds, sort]);

  // Group by category for display
  const groupedProtocols = useMemo(() => {
    return protocols.reduce<Partial<Record<ProtocolCategory, Protocol[]>>>(
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
  }, [protocols]);

  const totalCount = allProtocols.length;
  const singleCategory = filters.categories?.length === 1 ? filters.categories[0] : null;
  const hasActiveFilters = !!(
    filters.query ||
    filters.categories?.length ||
    filters.difficulty ||
    filters.minDuration ||
    filters.maxDuration ||
    filters.tags?.length ||
    filters.favorites
  );

  return (
    <>
      <ProtocolFilters totalCount={totalCount} filteredCount={filteredCount} />

      {/* Recently Viewed - only show when no filters active */}
      {!hasActiveFilters && (
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
                allProtocols={allProtocols}
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
                    allProtocols={allProtocols}
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
    </>
  );
}
