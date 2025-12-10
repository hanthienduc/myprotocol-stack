"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Plus, Trash2, Check } from "lucide-react";
import { createClient } from "@myprotocolstack/database/client";
import { Button } from "@myprotocolstack/ui";
import { Input } from "@myprotocolstack/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@myprotocolstack/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@myprotocolstack/ui";
import { toast } from "sonner";
import type { SavedFilterPreset } from "@myprotocolstack/database";
import {
  type ProtocolFilters,
  buildParamsFromFilters,
  countActiveFilters,
} from "@/lib/protocol-filters";
import { updateUrlParams } from "@/lib/url-utils";

interface SavedFilterPresetsProps {
  currentFilters: ProtocolFilters;
}

export function SavedFilterPresets({ currentFilters }: SavedFilterPresetsProps) {
  const searchParams = useSearchParams();
  const [presets, setPresets] = useState<SavedFilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const activeFilterCount = countActiveFilters(currentFilters);

  // Load presets on mount
  useEffect(() => {
    async function loadPresets() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("saved_filter_presets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setPresets(data as SavedFilterPreset[]);
      }
      setIsLoading(false);
    }

    loadPresets();
  }, []);

  // Apply a preset
  const applyPreset = useCallback(
    (preset: SavedFilterPreset) => {
      const params = buildParamsFromFilters(preset.filters as ProtocolFilters, {
        field: (preset.sort_field as "name" | "difficulty" | "duration") || "name",
        order: (preset.sort_order as "asc" | "desc") || "asc",
      });
      // Convert URLSearchParams to Record<string, string | null>
      const updates: Record<string, string | null> = {};
      // First clear all existing params
      ["search", "categories", "difficulty", "minDuration", "maxDuration", "tags", "favorites", "sort", "order"].forEach(key => {
        updates[key] = null;
      });
      // Then set new values from preset
      params.forEach((value, key) => {
        updates[key] = value;
      });
      updateUrlParams(updates);
      toast.success(`Applied "${preset.name}" filters`);
    },
    []
  );

  // Save current filters as preset
  const savePreset = useCallback(async () => {
    if (!userId || !presetName.trim()) return;

    const supabase = createClient();

    const sortField = searchParams.get("sort") || "name";
    const sortOrder = searchParams.get("order") || "asc";

    const { data, error } = await supabase
      .from("saved_filter_presets")
      .insert({
        user_id: userId,
        name: presetName.trim(),
        filters: currentFilters,
        sort_field: sortField,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to save preset");
      return;
    }

    if (data) {
      setPresets((prev) => [data as SavedFilterPreset, ...prev]);
      toast.success(`Saved "${presetName}" preset`);
      setPresetName("");
      setIsSaveDialogOpen(false);
    }
  }, [userId, presetName, currentFilters, searchParams]);

  // Delete a preset
  const deletePreset = useCallback(
    async (presetId: string, presetName: string) => {
      const supabase = createClient();

      const { error } = await supabase
        .from("saved_filter_presets")
        .delete()
        .eq("id", presetId);

      if (error) {
        toast.error("Failed to delete preset");
        return;
      }

      setPresets((prev) => prev.filter((p) => p.id !== presetId));
      toast.success(`Deleted "${presetName}" preset`);
    },
    []
  );

  // Don't render if not logged in
  if (!userId && !isLoading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Bookmark className="h-4 w-4 mr-1" />
            Presets
            {presets.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({presets.length})
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {presets.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              No saved presets yet
            </div>
          ) : (
            presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                className="flex items-center justify-between group"
                onSelect={(e) => {
                  e.preventDefault();
                  applyPreset(preset);
                }}
              >
                <span className="truncate">{preset.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset(preset.id, preset.name);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </DropdownMenuItem>
            ))
          )}

          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Save current filters
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Save Filter Preset</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="preset-name"
                        className="text-sm font-medium"
                      >
                        Preset Name
                      </label>
                      <Input
                        id="preset-name"
                        placeholder="e.g., Morning Routines"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && presetName.trim()) {
                            savePreset();
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      This will save your current {activeFilterCount} filter
                      {activeFilterCount > 1 ? "s" : ""} and sort settings.
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={savePreset}
                        disabled={!presetName.trim()}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save Preset
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
