"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { createClient } from "@myprotocolstack/database/client";
import type { Protocol } from "@myprotocolstack/database";
import { Badge } from "@myprotocolstack/ui";
import Link from "next/link";

interface SimilarProtocolsProps {
  protocolId: string;
  category: string;
  difficulty: string;
  tags?: string[];
  allProtocols: Protocol[];
}

export function SimilarProtocols({
  protocolId,
  category,
  difficulty,
  tags = [],
  allProtocols,
}: SimilarProtocolsProps) {
  const [similarProtocols, setSimilarProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilarProtocols() {
      try {
        const supabase = createClient();

        // Try database function first
        const { data, error } = await supabase.rpc("find_similar_protocols", {
          p_protocol_id: protocolId,
          p_limit: 3,
        });

        if (!error && data && data.length > 0) {
          setSimilarProtocols(data as Protocol[]);
        } else {
          // Fallback to client-side calculation
          const similar = findSimilarProtocolsClient(
            protocolId,
            category,
            difficulty,
            tags,
            allProtocols
          );
          setSimilarProtocols(similar);
        }
      } catch {
        // Fallback to client-side calculation
        const similar = findSimilarProtocolsClient(
          protocolId,
          category,
          difficulty,
          tags,
          allProtocols
        );
        setSimilarProtocols(similar);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSimilarProtocols();
  }, [protocolId, category, difficulty, tags, allProtocols]);

  if (isLoading || similarProtocols.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        Similar Protocols
      </h4>
      <div className="space-y-2">
        {similarProtocols.map((protocol) => (
          <Link
            key={protocol.id}
            href={`/protocols?search=${encodeURIComponent(protocol.name)}`}
            className="block p-3 rounded-lg border hover:border-primary hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{protocol.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {protocol.description}
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {protocol.category}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Client-side similarity calculation (fallback)
function findSimilarProtocolsClient(
  protocolId: string,
  category: string,
  difficulty: string,
  tags: string[],
  allProtocols: Protocol[]
): Protocol[] {
  const scored = allProtocols
    .filter((p) => p.id !== protocolId)
    .map((p) => {
      let score = 0;

      // Same category = 3 points
      if (p.category === category) score += 3;

      // Same difficulty = 2 points
      if (p.difficulty === difficulty) score += 2;

      // Shared tags = 1 point each
      const protocolTags = p.tags || [];
      const sharedTags = tags.filter((t) => protocolTags.includes(t));
      score += sharedTags.length;

      return { protocol: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((s) => s.protocol);
}
