"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@myprotocolstack/ui";
import { Button } from "@myprotocolstack/ui";

interface ProtocolSearchProps {
  className?: string;
}

export function ProtocolSearch({ className }: ProtocolSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  // Update URL with debounce
  const updateUrl = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    router.push(`/protocols?${params.toString()}`);
  }, [router, searchParams]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, updateUrl]);

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

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(`/protocols?${params.toString()}`);
  };

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
