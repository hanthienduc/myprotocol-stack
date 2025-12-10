"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@myprotocolstack/ui";
import { Button } from "@myprotocolstack/ui";
import { updateUrlParams } from "@/lib/url-utils";

interface ProtocolSearchProps {
  className?: string;
}

export function ProtocolSearch({ className }: ProtocolSearchProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const searchParamsRef = useRef(searchParams);

  // Keep ref updated
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // Debounced search effect - only depends on query
  useEffect(() => {
    const urlSearch = searchParamsRef.current.get("search") || "";
    // Skip if query matches URL (no change needed)
    if (query === urlSearch) return;

    const timer = setTimeout(() => {
      updateUrlParams({ search: query.trim() || null });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Sync with URL changes (e.g., when cleared externally via "Clear all" button)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    // Only sync from URL to state when URL changes and input is not focused
    // This prevents overwriting user input during typing
    if (urlSearch !== query && document.activeElement?.tagName !== "INPUT") {
      setQuery(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleClear = useCallback(() => {
    setQuery("");
    updateUrlParams({ search: null });
  }, []);

  return (
    <div className={`relative ${className || ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search protocols..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-9"
        aria-label="Search protocols"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
