"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Filter, X, ChevronDown, Tag } from "lucide-react";
import { Button } from "@myprotocolstack/ui";
import { Checkbox } from "@myprotocolstack/ui";
import { Badge } from "@myprotocolstack/ui";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@myprotocolstack/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@myprotocolstack/ui";
import { cn } from "@myprotocolstack/utils";
import type { ProtocolCategory, ProtocolDifficulty } from "@myprotocolstack/database";
import { ProtocolSearch } from "./protocol-search";
import { SavedFilterPresets } from "./saved-filter-presets";
import {
  type ProtocolFilters as FilterType,
  type SortField,
  type SortOrder,
  DURATION_PRESETS,
  PROTOCOL_TAGS,
  countActiveFilters,
} from "@/lib/protocol-filters";

const CATEGORIES: { value: ProtocolCategory; label: string; icon: string }[] = [
  { value: "sleep", label: "Sleep", icon: "🌙" },
  { value: "focus", label: "Focus", icon: "🎯" },
  { value: "energy", label: "Energy", icon: "⚡" },
  { value: "fitness", label: "Fitness", icon: "💪" },
];

const DIFFICULTIES: { value: ProtocolDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const SORT_OPTIONS: { field: SortField; order: SortOrder; label: string }[] = [
  { field: "name", order: "asc", label: "Name (A-Z)" },
  { field: "name", order: "desc", label: "Name (Z-A)" },
  { field: "difficulty", order: "asc", label: "Difficulty (Easy first)" },
  { field: "difficulty", order: "desc", label: "Difficulty (Hard first)" },
  { field: "duration", order: "asc", label: "Duration (Shortest)" },
  { field: "duration", order: "desc", label: "Duration (Longest)" },
];

interface ProtocolFiltersProps {
  totalCount?: number;
  filteredCount?: number;
}

export function ProtocolFilters({ totalCount, filteredCount }: ProtocolFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const currentFilters = useMemo((): FilterType => {
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

  const currentSort = useMemo(() => {
    const field = (searchParams.get("sort") as SortField) || "name";
    const order = (searchParams.get("order") as SortOrder) || "asc";
    return { field, order };
  }, [searchParams]);

  const activeFilterCount = countActiveFilters(currentFilters);

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`/protocols?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Category toggle
  const toggleCategory = useCallback(
    (category: ProtocolCategory) => {
      const current = currentFilters.categories || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      updateParams({
        categories: updated.length > 0 ? updated.join(",") : null,
      });
    },
    [currentFilters.categories, updateParams]
  );

  // Difficulty toggle
  const setDifficulty = useCallback(
    (difficulty: ProtocolDifficulty | null) => {
      updateParams({ difficulty });
    },
    [updateParams]
  );

  // Duration preset toggle
  const setDuration = useCallback(
    (minDuration: number | null, maxDuration: number | null | undefined) => {
      updateParams({
        minDuration: minDuration !== null ? String(minDuration) : null,
        maxDuration: maxDuration !== null && maxDuration !== undefined
          ? String(maxDuration)
          : null,
      });
    },
    [updateParams]
  );

  // Tag toggle
  const toggleTag = useCallback(
    (tag: string) => {
      const current = currentFilters.tags || [];
      const updated = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      updateParams({
        tags: updated.length > 0 ? updated.join(",") : null,
      });
    },
    [currentFilters.tags, updateParams]
  );

  // Favorites toggle
  const toggleFavorites = useCallback(() => {
    updateParams({
      favorites: currentFilters.favorites ? null : "true",
    });
  }, [currentFilters.favorites, updateParams]);

  // Sort change
  const setSort = useCallback(
    (field: SortField, order: SortOrder) => {
      updateParams({
        sort: field === "name" && order === "asc" ? null : field,
        order: order === "asc" ? null : order,
      });
    },
    [updateParams]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    router.push("/protocols");
  }, [router]);

  // Check active duration preset
  const activeDurationPreset = useMemo(() => {
    return DURATION_PRESETS.findIndex(
      (preset) =>
        preset.minDuration === currentFilters.minDuration &&
        preset.maxDuration === currentFilters.maxDuration
    );
  }, [currentFilters.minDuration, currentFilters.maxDuration]);

  // Filter panel content (shared between desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-medium mb-3 text-sm">Categories</h4>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={currentFilters.categories?.includes(cat.value) ?? false}
                onCheckedChange={() => toggleCategory(cat.value)}
                aria-label={`Filter by ${cat.label}`}
              />
              <span className="text-sm">
                {cat.icon} {cat.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <h4 className="font-medium mb-3 text-sm">Difficulty</h4>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((diff) => (
            <Button
              key={diff.value}
              variant={currentFilters.difficulty === diff.value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setDifficulty(
                  currentFilters.difficulty === diff.value ? null : diff.value
                )
              }
              aria-pressed={currentFilters.difficulty === diff.value}
            >
              {diff.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <h4 className="font-medium mb-3 text-sm">Duration</h4>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset, idx) => (
            <Button
              key={preset.label}
              variant={activeDurationPreset === idx ? "default" : "outline"}
              size="sm"
              onClick={() =>
                activeDurationPreset === idx
                  ? setDuration(null, null)
                  : setDuration(preset.minDuration, preset.maxDuration ?? null)
              }
              aria-pressed={activeDurationPreset === idx}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h4 className="font-medium mb-3 text-sm flex items-center gap-1">
          <Tag className="h-4 w-4" />
          Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {PROTOCOL_TAGS.map((tag) => (
            <Button
              key={tag}
              variant={currentFilters.tags?.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleTag(tag)}
              aria-pressed={currentFilters.tags?.includes(tag)}
              className="text-xs"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div>
        <h4 className="font-medium mb-3 text-sm">Other</h4>
        <Button
          variant={currentFilters.favorites ? "default" : "outline"}
          size="sm"
          onClick={toggleFavorites}
          className={cn(
            currentFilters.favorites && "bg-red-500 hover:bg-red-600 text-white"
          )}
          aria-pressed={currentFilters.favorites}
        >
          <Heart
            className={cn("h-4 w-4 mr-1", currentFilters.favorites && "fill-current")}
          />
          Favorites only
        </Button>
      </div>
    </div>
  );

  const currentSortLabel =
    SORT_OPTIONS.find(
      (opt) => opt.field === currentSort.field && opt.order === currentSort.order
    )?.label || "Name (A-Z)";

  return (
    <div className="space-y-4">
      {/* Top row: Search + Mobile filter button + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <ProtocolSearch className="flex-1 sm:max-w-xs" />

        {/* Mobile filter button */}
        <div className="flex gap-2 sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filters
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear all
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto flex-1 py-4">
                <FilterContent />
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button className="w-full">
                    Apply Filters
                    {filteredCount !== undefined && totalCount !== undefined && (
                      <span className="ml-2 text-sm opacity-80">
                        ({filteredCount} results)
                      </span>
                    )}
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Sort dropdown mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={`${opt.field}-${opt.order}`}
                  onClick={() => setSort(opt.field, opt.order)}
                  className={cn(
                    currentSort.field === opt.field &&
                      currentSort.order === opt.order &&
                      "bg-accent"
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop: Sort dropdown + Saved Presets */}
        <div className="hidden sm:flex items-center gap-2">
          <SavedFilterPresets currentFilters={currentFilters} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[180px] justify-between">
                {currentSortLabel}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={`${opt.field}-${opt.order}`}
                  onClick={() => setSort(opt.field, opt.order)}
                  className={cn(
                    currentSort.field === opt.field &&
                      currentSort.order === opt.order &&
                      "bg-accent"
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop: Inline filters */}
      <div className="hidden sm:block">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick category buttons */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={
                  currentFilters.categories?.includes(cat.value) ? "default" : "outline"
                }
                size="sm"
                onClick={() => toggleCategory(cat.value)}
                aria-pressed={currentFilters.categories?.includes(cat.value)}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Difficulty buttons */}
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((diff) => (
              <Button
                key={diff.value}
                variant={currentFilters.difficulty === diff.value ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setDifficulty(
                    currentFilters.difficulty === diff.value ? null : diff.value
                  )
                }
                aria-pressed={currentFilters.difficulty === diff.value}
              >
                {diff.label}
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Duration presets */}
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((preset, idx) => (
              <Button
                key={preset.label}
                variant={activeDurationPreset === idx ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  activeDurationPreset === idx
                    ? setDuration(null, null)
                    : setDuration(preset.minDuration, preset.maxDuration ?? null)
                }
                aria-pressed={activeDurationPreset === idx}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Favorites */}
          <Button
            variant={currentFilters.favorites ? "default" : "outline"}
            size="sm"
            onClick={toggleFavorites}
            className={cn(
              currentFilters.favorites && "bg-red-500 hover:bg-red-600 text-white"
            )}
            aria-pressed={currentFilters.favorites}
          >
            <Heart
              className={cn("h-4 w-4 mr-1", currentFilters.favorites && "fill-current")}
            />
            Favorites
          </Button>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <>
              <div className="h-6 w-px bg-border" />
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear all ({activeFilterCount})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Result count */}
      {filteredCount !== undefined && totalCount !== undefined && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} protocols
        </p>
      )}
    </div>
  );
}
