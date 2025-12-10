import { describe, it, expect } from "@jest/globals";
import type { Protocol } from "@myprotocolstack/database";
import {
  filterProtocols,
  sortProtocols,
  countActiveFilters,
  parseFiltersFromParams,
  parseSortFromParams,
  buildParamsFromFilters,
  type ProtocolFilters,
} from "../protocol-filters";

const mockProtocols: Protocol[] = [
  {
    id: "1",
    name: "Morning Sunlight",
    description: "Get sunlight within first hour of waking",
    category: "sleep",
    difficulty: "easy",
    duration_minutes: 15,
    frequency: "daily",
    science_summary: null,
    steps: [],
    tags: ["morning", "quick", "beginner-friendly", "outdoor"],
    created_at: "2024-01-01",
  },
  {
    id: "2",
    name: "Cold Shower",
    description: "End shower with 30 seconds of cold water",
    category: "energy",
    difficulty: "medium",
    duration_minutes: 5,
    frequency: "daily",
    science_summary: null,
    steps: [],
    tags: ["morning", "quick", "no-equipment"],
    created_at: "2024-01-01",
  },
  {
    id: "3",
    name: "Deep Work Blocks",
    description: "90-minute focused work sessions",
    category: "focus",
    difficulty: "hard",
    duration_minutes: 90,
    frequency: "daily",
    science_summary: null,
    steps: [],
    tags: ["advanced", "science-backed"],
    created_at: "2024-01-01",
  },
  {
    id: "4",
    name: "Zone 2 Cardio",
    description: "Low intensity cardio for heart health",
    category: "fitness",
    difficulty: "medium",
    duration_minutes: 45,
    frequency: "weekly",
    science_summary: null,
    steps: [],
    tags: ["beginner-friendly", "outdoor", "science-backed"],
    created_at: "2024-01-01",
  },
];

describe("filterProtocols", () => {
  it("returns all protocols when no filters applied", () => {
    const result = filterProtocols(mockProtocols, {});
    expect(result).toHaveLength(4);
  });

  it("filters by search query in name", () => {
    const result = filterProtocols(mockProtocols, { query: "sunlight" });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Morning Sunlight");
  });

  it("filters by search query in description", () => {
    const result = filterProtocols(mockProtocols, { query: "cold water" });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Cold Shower");
  });

  it("filters by single category", () => {
    const result = filterProtocols(mockProtocols, { categories: ["sleep"] });
    expect(result).toHaveLength(1);
    expect(result[0]?.category).toBe("sleep");
  });

  it("filters by multiple categories", () => {
    const result = filterProtocols(mockProtocols, { categories: ["sleep", "energy"] });
    expect(result).toHaveLength(2);
  });

  it("filters by difficulty", () => {
    const result = filterProtocols(mockProtocols, { difficulty: "medium" });
    expect(result).toHaveLength(2);
  });

  it("filters by minimum duration", () => {
    const result = filterProtocols(mockProtocols, { minDuration: 30 });
    expect(result).toHaveLength(2);
  });

  it("filters by maximum duration", () => {
    const result = filterProtocols(mockProtocols, { maxDuration: 15 });
    expect(result).toHaveLength(2);
  });

  it("filters by duration range", () => {
    const result = filterProtocols(mockProtocols, { minDuration: 10, maxDuration: 50 });
    expect(result).toHaveLength(2);
  });

  it("filters by favorites", () => {
    const favoriteIds = ["1", "3"];
    const result = filterProtocols(mockProtocols, { favorites: true }, favoriteIds);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("filters by single tag", () => {
    const result = filterProtocols(mockProtocols, { tags: ["morning"] });
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["Morning Sunlight", "Cold Shower"]);
  });

  it("filters by multiple tags (AND logic)", () => {
    const result = filterProtocols(mockProtocols, { tags: ["morning", "quick"] });
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["Morning Sunlight", "Cold Shower"]);
  });

  it("filters by tags with no matches", () => {
    const result = filterProtocols(mockProtocols, { tags: ["morning", "advanced"] });
    expect(result).toHaveLength(0);
  });

  it("filters by outdoor tag", () => {
    const result = filterProtocols(mockProtocols, { tags: ["outdoor"] });
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["Morning Sunlight", "Zone 2 Cardio"]);
  });

  it("combines multiple filters", () => {
    const result = filterProtocols(mockProtocols, {
      categories: ["sleep", "energy"],
      difficulty: "easy",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Morning Sunlight");
  });
});

describe("sortProtocols", () => {
  it("sorts by name ascending", () => {
    const result = sortProtocols(mockProtocols, { field: "name", order: "asc" });
    expect(result[0]?.name).toBe("Cold Shower");
    expect(result[3]?.name).toBe("Zone 2 Cardio");
  });

  it("sorts by name descending", () => {
    const result = sortProtocols(mockProtocols, { field: "name", order: "desc" });
    expect(result[0]?.name).toBe("Zone 2 Cardio");
    expect(result[3]?.name).toBe("Cold Shower");
  });

  it("sorts by difficulty ascending", () => {
    const result = sortProtocols(mockProtocols, { field: "difficulty", order: "asc" });
    expect(result[0]?.difficulty).toBe("easy");
    expect(result[3]?.difficulty).toBe("hard");
  });

  it("sorts by difficulty descending", () => {
    const result = sortProtocols(mockProtocols, { field: "difficulty", order: "desc" });
    expect(result[0]?.difficulty).toBe("hard");
  });

  it("sorts by duration ascending", () => {
    const result = sortProtocols(mockProtocols, { field: "duration", order: "asc" });
    expect(result[0]?.duration_minutes).toBe(5);
    expect(result[3]?.duration_minutes).toBe(90);
  });

  it("sorts by duration descending", () => {
    const result = sortProtocols(mockProtocols, { field: "duration", order: "desc" });
    expect(result[0]?.duration_minutes).toBe(90);
    expect(result[3]?.duration_minutes).toBe(5);
  });
});

describe("countActiveFilters", () => {
  it("returns 0 for empty filters", () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it("counts query filter", () => {
    expect(countActiveFilters({ query: "test" })).toBe(1);
  });

  it("counts categories filter", () => {
    expect(countActiveFilters({ categories: ["sleep", "focus"] })).toBe(1);
  });

  it("counts difficulty filter", () => {
    expect(countActiveFilters({ difficulty: "easy" })).toBe(1);
  });

  it("counts duration filter", () => {
    expect(countActiveFilters({ minDuration: 10 })).toBe(1);
    expect(countActiveFilters({ maxDuration: 60 })).toBe(1);
    expect(countActiveFilters({ minDuration: 10, maxDuration: 60 })).toBe(1);
  });

  it("counts favorites filter", () => {
    expect(countActiveFilters({ favorites: true })).toBe(1);
  });

  it("counts tags filter", () => {
    expect(countActiveFilters({ tags: ["morning", "quick"] })).toBe(1);
  });

  it("counts multiple filters", () => {
    const filters: ProtocolFilters = {
      query: "test",
      categories: ["sleep"],
      difficulty: "easy",
      minDuration: 10,
      favorites: true,
    };
    expect(countActiveFilters(filters)).toBe(5);
  });

  it("counts all filters including tags", () => {
    const filters: ProtocolFilters = {
      query: "test",
      categories: ["sleep"],
      difficulty: "easy",
      minDuration: 10,
      tags: ["morning"],
      favorites: true,
    };
    expect(countActiveFilters(filters)).toBe(6);
  });
});

describe("parseFiltersFromParams", () => {
  it("parses search query", () => {
    const params = new URLSearchParams("search=test");
    expect(parseFiltersFromParams(params).query).toBe("test");
  });

  it("parses categories", () => {
    const params = new URLSearchParams("categories=sleep,focus");
    expect(parseFiltersFromParams(params).categories).toEqual(["sleep", "focus"]);
  });

  it("parses difficulty", () => {
    const params = new URLSearchParams("difficulty=medium");
    expect(parseFiltersFromParams(params).difficulty).toBe("medium");
  });

  it("parses duration", () => {
    const params = new URLSearchParams("minDuration=10&maxDuration=60");
    const filters = parseFiltersFromParams(params);
    expect(filters.minDuration).toBe(10);
    expect(filters.maxDuration).toBe(60);
  });

  it("parses favorites", () => {
    const params = new URLSearchParams("favorites=true");
    expect(parseFiltersFromParams(params).favorites).toBe(true);
  });

  it("parses tags", () => {
    const params = new URLSearchParams("tags=morning,quick,outdoor");
    expect(parseFiltersFromParams(params).tags).toEqual(["morning", "quick", "outdoor"]);
  });
});

describe("parseSortFromParams", () => {
  it("returns default sort when no params", () => {
    const params = new URLSearchParams();
    const sort = parseSortFromParams(params);
    expect(sort.field).toBe("name");
    expect(sort.order).toBe("asc");
  });

  it("parses sort field and order", () => {
    const params = new URLSearchParams("sort=duration&order=desc");
    const sort = parseSortFromParams(params);
    expect(sort.field).toBe("duration");
    expect(sort.order).toBe("desc");
  });
});

describe("buildParamsFromFilters", () => {
  it("builds params from filters", () => {
    const filters: ProtocolFilters = {
      query: "test",
      categories: ["sleep", "focus"],
      difficulty: "easy",
      minDuration: 10,
      maxDuration: 60,
      favorites: true,
    };
    const params = buildParamsFromFilters(filters);
    expect(params.get("search")).toBe("test");
    expect(params.get("categories")).toBe("sleep,focus");
    expect(params.get("difficulty")).toBe("easy");
    expect(params.get("minDuration")).toBe("10");
    expect(params.get("maxDuration")).toBe("60");
    expect(params.get("favorites")).toBe("true");
  });

  it("builds params with tags", () => {
    const filters: ProtocolFilters = {
      tags: ["morning", "quick"],
    };
    const params = buildParamsFromFilters(filters);
    expect(params.get("tags")).toBe("morning,quick");
  });

  it("builds params from all filters including tags", () => {
    const filters: ProtocolFilters = {
      query: "test",
      categories: ["sleep"],
      difficulty: "easy",
      minDuration: 10,
      maxDuration: 60,
      tags: ["morning", "outdoor"],
      favorites: true,
    };
    const params = buildParamsFromFilters(filters);
    expect(params.get("search")).toBe("test");
    expect(params.get("categories")).toBe("sleep");
    expect(params.get("difficulty")).toBe("easy");
    expect(params.get("minDuration")).toBe("10");
    expect(params.get("maxDuration")).toBe("60");
    expect(params.get("tags")).toBe("morning,outdoor");
    expect(params.get("favorites")).toBe("true");
  });

  it("includes sort params when not default", () => {
    const params = buildParamsFromFilters({}, { field: "duration", order: "desc" });
    expect(params.get("sort")).toBe("duration");
    expect(params.get("order")).toBe("desc");
  });

  it("omits default sort params", () => {
    const params = buildParamsFromFilters({}, { field: "name", order: "asc" });
    expect(params.has("sort")).toBe(false);
    expect(params.has("order")).toBe(false);
  });
});
