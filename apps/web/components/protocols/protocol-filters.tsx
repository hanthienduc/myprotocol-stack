"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@myprotocolstack/ui";
import { Input } from "@myprotocolstack/ui";
import { cn } from "@myprotocolstack/utils";
import type { ProtocolCategory } from "@myprotocolstack/database";

const categories: { value: ProtocolCategory | "all"; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "📚" },
  { value: "sleep", label: "Sleep", icon: "🌙" },
  { value: "focus", label: "Focus", icon: "🎯" },
  { value: "energy", label: "Energy", icon: "⚡" },
  { value: "fitness", label: "Fitness", icon: "💪" },
];

export function ProtocolFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("search") || "";
  const showFavorites = searchParams.get("favorites") === "true";

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "false") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/protocols?${params.toString()}`);
  };

  const toggleFavorites = () => {
    updateParams("favorites", showFavorites ? "false" : "true");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={currentCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => updateParams("category", category.value)}
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </Button>
        ))}
        {/* Favorites filter */}
        <Button
          variant={showFavorites ? "default" : "outline"}
          size="sm"
          onClick={toggleFavorites}
          className={cn(showFavorites && "bg-red-500 hover:bg-red-600 text-white")}
        >
          <Heart className={cn("h-4 w-4 mr-1", showFavorites && "fill-current")} />
          Favorites
        </Button>
      </div>

      {/* Search */}
      <div className="flex-1 sm:max-w-xs">
        <Input
          placeholder="Search protocols..."
          value={currentSearch}
          onChange={(e) => updateParams("search", e.target.value)}
        />
      </div>
    </div>
  );
}
