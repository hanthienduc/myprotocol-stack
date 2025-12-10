"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { createClient } from "@myprotocolstack/database/client";
import type { Protocol } from "@myprotocolstack/database";
import { ProtocolCard } from "./protocol-card";

const MAX_RECENT = 6;
const STORAGE_KEY = "recently_viewed_protocols";

interface RecentlyViewedProtocolsProps {
  allProtocols: Protocol[];
  favoriteIds: string[];
}

export function RecentlyViewedProtocols({
  allProtocols,
  favoriteIds,
}: RecentlyViewedProtocolsProps) {
  const [recentProtocols, setRecentProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecentlyViewed() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let recentIds: string[] = [];

        if (user) {
          // Fetch from database for logged-in users
          const { data } = await supabase
            .from("recently_viewed")
            .select("protocol_id")
            .eq("user_id", user.id)
            .order("viewed_at", { ascending: false })
            .limit(MAX_RECENT);

          if (data) {
            recentIds = data.map((r) => r.protocol_id);
          }
        } else {
          // Use localStorage for anonymous users
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            recentIds = JSON.parse(stored).slice(0, MAX_RECENT);
          }
        }

        // Map IDs to protocols, preserving order
        const protocols = recentIds
          .map((id) => allProtocols.find((p) => p.id === id))
          .filter((p): p is Protocol => p !== undefined);

        setRecentProtocols(protocols);
      } catch (error) {
        console.error("Error loading recently viewed:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentlyViewed();
  }, [allProtocols]);

  if (isLoading || recentProtocols.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        Recently Viewed
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recentProtocols.map((protocol) => (
          <ProtocolCard
            key={protocol.id}
            protocol={protocol}
            isFavorite={favoriteIds.includes(protocol.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Utility function to track protocol view (called from ProtocolCard)
export async function trackProtocolView(protocolId: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Use database for logged-in users
      await supabase.rpc("upsert_recently_viewed", {
        p_user_id: user.id,
        p_protocol_id: protocolId,
      });
    } else {
      // Use localStorage for anonymous users
      const stored = localStorage.getItem(STORAGE_KEY);
      let recentIds: string[] = stored ? JSON.parse(stored) : [];

      // Remove if exists, then add to front
      recentIds = recentIds.filter((id) => id !== protocolId);
      recentIds.unshift(protocolId);

      // Keep only MAX_RECENT
      recentIds = recentIds.slice(0, MAX_RECENT);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentIds));
    }
  } catch (error) {
    console.error("Error tracking protocol view:", error);
  }
}
