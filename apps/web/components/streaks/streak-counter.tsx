"use client";

import { cn } from "@myprotocolstack/utils";

interface StreakCounterProps {
  streak: number;
  isAtRisk?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakCounter({
  streak,
  isAtRisk = false,
  showLabel = false,
  size = "md",
  className,
}: StreakCounterProps) {
  const sizeClasses = {
    sm: "text-sm gap-1",
    md: "text-base gap-1.5",
    lg: "text-lg gap-2",
  };

  const iconSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  if (streak === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center font-semibold",
        sizeClasses[size],
        isAtRisk && "text-amber-500",
        className
      )}
      title={`${streak} day streak${isAtRisk ? " (at risk)" : ""}`}
    >
      <span className={cn(iconSizes[size], "animate-pulse")}>🔥</span>
      <span className="tabular-nums">{streak}</span>
      {showLabel && (
        <span className="text-muted-foreground font-normal">
          {streak === 1 ? "day" : "days"}
        </span>
      )}
      {isAtRisk && (
        <span className="text-xs text-amber-500 font-normal">(at risk)</span>
      )}
    </div>
  );
}
