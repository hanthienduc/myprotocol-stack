import type { Protocol, ProtocolCategory, ProtocolDifficulty } from "@myprotocolstack/database";

export interface ProtocolFilters {
  query?: string;
  categories?: ProtocolCategory[];
  difficulty?: ProtocolDifficulty;
  minDuration?: number;
  maxDuration?: number;
  tags?: string[];
  favorites?: boolean;
}

// Common protocol tags
export const PROTOCOL_TAGS = [
  "morning",
  "evening",
  "quick",
  "science-backed",
  "beginner-friendly",
  "advanced",
  "no-equipment",
  "outdoor",
] as const;

export type ProtocolTag = typeof PROTOCOL_TAGS[number];

export type SortField = "name" | "difficulty" | "duration";
export type SortOrder = "asc" | "desc";

export interface ProtocolSort {
  field: SortField;
  order: SortOrder;
}

// Duration presets for filtering
export const DURATION_PRESETS = [
  { label: "< 15 min", minDuration: 0, maxDuration: 14 },
  { label: "15-30 min", minDuration: 15, maxDuration: 30 },
  { label: "30-60 min", minDuration: 31, maxDuration: 60 },
  { label: "60+ min", minDuration: 61, maxDuration: undefined },
] as const;

// Difficulty order for sorting
const DIFFICULTY_ORDER: Record<ProtocolDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * Filter protocols based on search query and filter criteria
 */
export function filterProtocols(
  protocols: Protocol[],
  filters: ProtocolFilters,
  favoriteIds?: string[]
): Protocol[] {
  return protocols.filter((p) => {
    // Text search (name + description)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      if (
        !p.name.toLowerCase().includes(query) &&
        !p.description.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Category filter (multi-select)
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(p.category)) {
        return false;
      }
    }

    // Difficulty filter
    if (filters.difficulty && p.difficulty !== filters.difficulty) {
      return false;
    }

    // Duration filter
    if (filters.minDuration !== undefined && p.duration_minutes !== null) {
      if (p.duration_minutes < filters.minDuration) {
        return false;
      }
    }
    if (filters.maxDuration !== undefined && p.duration_minutes !== null) {
      if (p.duration_minutes > filters.maxDuration) {
        return false;
      }
    }

    // Tags filter (protocol must have ALL selected tags)
    if (filters.tags && filters.tags.length > 0) {
      const protocolTags = p.tags || [];
      if (!filters.tags.every((tag) => protocolTags.includes(tag))) {
        return false;
      }
    }

    // Favorites filter
    if (filters.favorites && favoriteIds) {
      if (!favoriteIds.includes(p.id)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort protocols by specified field and order
 */
export function sortProtocols(
  protocols: Protocol[],
  sort: ProtocolSort
): Protocol[] {
  const sorted = [...protocols];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "difficulty":
        comparison = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
        break;
      case "duration":
        const durationA = a.duration_minutes ?? 0;
        const durationB = b.duration_minutes ?? 0;
        comparison = durationA - durationB;
        break;
    }

    return sort.order === "desc" ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: ProtocolFilters): number {
  let count = 0;
  if (filters.query) count++;
  if (filters.categories && filters.categories.length > 0) count++;
  if (filters.difficulty) count++;
  if (filters.minDuration !== undefined || filters.maxDuration !== undefined) count++;
  if (filters.tags && filters.tags.length > 0) count++;
  if (filters.favorites) count++;
  return count;
}

/**
 * Parse URL search params into filter object
 */
export function parseFiltersFromParams(params: URLSearchParams): ProtocolFilters {
  const filters: ProtocolFilters = {};

  const search = params.get("search");
  if (search) filters.query = search;

  const categories = params.get("categories");
  if (categories) {
    filters.categories = categories.split(",") as ProtocolCategory[];
  }

  const difficulty = params.get("difficulty");
  if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
    filters.difficulty = difficulty as ProtocolDifficulty;
  }

  const minDuration = params.get("minDuration");
  if (minDuration) filters.minDuration = parseInt(minDuration, 10);

  const maxDuration = params.get("maxDuration");
  if (maxDuration) filters.maxDuration = parseInt(maxDuration, 10);

  const tags = params.get("tags");
  if (tags) {
    filters.tags = tags.split(",");
  }

  const favorites = params.get("favorites");
  if (favorites === "true") filters.favorites = true;

  return filters;
}

/**
 * Parse sort from URL params
 */
export function parseSortFromParams(params: URLSearchParams): ProtocolSort {
  const sortField = params.get("sort") as SortField | null;
  const sortOrder = params.get("order") as SortOrder | null;

  return {
    field: sortField && ["name", "difficulty", "duration"].includes(sortField)
      ? sortField
      : "name",
    order: sortOrder === "desc" ? "desc" : "asc",
  };
}

/**
 * Build URL params from filters
 */
export function buildParamsFromFilters(
  filters: ProtocolFilters,
  sort?: ProtocolSort
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) params.set("search", filters.query);
  if (filters.categories?.length) params.set("categories", filters.categories.join(","));
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.minDuration !== undefined) params.set("minDuration", String(filters.minDuration));
  if (filters.maxDuration !== undefined) params.set("maxDuration", String(filters.maxDuration));
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.favorites) params.set("favorites", "true");

  if (sort && sort.field !== "name") {
    params.set("sort", sort.field);
    if (sort.order === "desc") params.set("order", "desc");
  } else if (sort?.order === "desc") {
    params.set("sort", sort.field);
    params.set("order", "desc");
  }

  return params;
}
