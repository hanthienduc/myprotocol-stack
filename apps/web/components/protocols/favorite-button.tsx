"use client";

import { useTransition, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@myprotocolstack/ui";
import { cn } from "@myprotocolstack/utils";
import { toggleFavorite } from "@/actions/favorites";
import { toast } from "sonner";

interface FavoriteButtonProps {
  protocolId: string;
  isFavorite: boolean;
  className?: string;
}

export function FavoriteButton({ protocolId, isFavorite: initialFavorite, className }: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useState(initialFavorite);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    // Prevent card dialog from opening
    e.stopPropagation();
    e.preventDefault();

    // Optimistic update
    const newState = !optimisticFavorite;
    setOptimisticFavorite(newState);

    // Trigger animation on favorite
    if (newState) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    startTransition(async () => {
      const result = await toggleFavorite(protocolId);

      if (!result.success) {
        // Revert on error
        setOptimisticFavorite(!newState);
        toast.error(result.error || "Failed to update favorite");
        return;
      }

      // Show toast on first favorite
      if (result.isFavorite) {
        toast.success("Added to favorites");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-full transition-all duration-200",
        optimisticFavorite && "text-red-500 hover:text-red-600",
        !optimisticFavorite && "text-muted-foreground hover:text-red-500",
        isPending && "opacity-50 pointer-events-none",
        className
      )}
      onClick={handleToggle}
      disabled={isPending}
      aria-label={optimisticFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-transform duration-200",
          optimisticFavorite && "fill-current",
          isAnimating && "scale-125"
        )}
      />
    </Button>
  );
}
