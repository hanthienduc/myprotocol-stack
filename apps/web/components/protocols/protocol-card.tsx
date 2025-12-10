"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@myprotocolstack/ui";
import { Badge } from "@myprotocolstack/ui";
import { Button } from "@myprotocolstack/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@myprotocolstack/ui";
import type { Protocol } from "@myprotocolstack/database";
import { FavoriteButton } from "./favorite-button";
import { trackProtocolView } from "./recently-viewed-protocols";
import { SimilarProtocols } from "./similar-protocols";
import { ShareButton } from "@/components/sharing/share-button";

interface ProtocolCardProps {
  protocol: Protocol;
  allProtocols?: Protocol[];
  onAddToStack?: (protocol: Protocol) => void;
  showAddButton?: boolean;
  isFavorite?: boolean;
}

const categoryColors: Record<string, string> = {
  sleep: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  focus: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  energy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  fitness: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function ProtocolCard({
  protocol,
  allProtocols = [],
  onAddToStack,
  showAddButton = false,
  isFavorite = false,
}: ProtocolCardProps) {
  const [open, setOpen] = useState(false);

  // Track view when dialog opens
  useEffect(() => {
    if (open) {
      trackProtocolView(protocol.id);
    }
  }, [open, protocol.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer transition-colors hover:border-primary relative">
          <FavoriteButton
            protocolId={protocol.id}
            isFavorite={isFavorite}
            className="absolute top-2 right-2 z-10"
          />
          <CardHeader className="pb-2 pr-12">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg leading-tight">{protocol.name}</CardTitle>
              <Badge variant="secondary" className={categoryColors[protocol.category]}>
                {protocol.category}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {protocol.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className={difficultyColors[protocol.difficulty]}>
                {protocol.difficulty}
              </Badge>
              {protocol.duration_minutes && (
                <span>{protocol.duration_minutes} min</span>
              )}
              <span className="capitalize">{protocol.frequency}</span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{protocol.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {protocol.description}
              </DialogDescription>
            </div>
            <Badge variant="secondary" className={categoryColors[protocol.category]}>
              {protocol.category}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={difficultyColors[protocol.difficulty]}>
              {protocol.difficulty}
            </Badge>
            {protocol.duration_minutes && (
              <Badge variant="outline">{protocol.duration_minutes} minutes</Badge>
            )}
            <Badge variant="outline">{protocol.frequency}</Badge>
          </div>

          {/* Tags */}
          {protocol.tags && protocol.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {protocol.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Science summary */}
          {protocol.science_summary && (
            <div>
              <h4 className="font-semibold mb-2">The Science</h4>
              <p className="text-sm text-muted-foreground">
                {protocol.science_summary}
              </p>
            </div>
          )}

          {/* Steps */}
          {protocol.steps && protocol.steps.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">How to Do It</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {protocol.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {showAddButton && onAddToStack && (
              <Button
                className="flex-1"
                onClick={() => {
                  onAddToStack(protocol);
                  setOpen(false);
                }}
              >
                Add to Stack
              </Button>
            )}
            <ShareButton
              title={protocol.name}
              description={protocol.description || "Science-backed health protocol"}
              url={`/protocols/${protocol.id}`}
              variant="outline"
              size={showAddButton ? "icon" : "default"}
              showLabel={!showAddButton}
            />
          </div>

          {/* Similar Protocols */}
          {allProtocols.length > 0 && (
            <SimilarProtocols
              protocolId={protocol.id}
              category={protocol.category}
              difficulty={protocol.difficulty}
              tags={protocol.tags}
              allProtocols={allProtocols}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
