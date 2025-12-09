"use client";

import { cn } from "@myprotocolstack/utils";
import type { BadgeType } from "@myprotocolstack/database";
import { getBadgeInfo } from "@/lib/streak-calculator";

interface StreakBadgeProps {
  badgeType: BadgeType;
  isUnlocked: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const BADGE_ICONS: Record<BadgeType, string> = {
  streak_7: "🥉",
  streak_30: "🥈",
  streak_100: "🥇",
};

export function StreakBadge({
  badgeType,
  isUnlocked,
  size = "md",
  showLabel = true,
  className,
}: StreakBadgeProps) {
  const info = getBadgeInfo(badgeType);
  const icon = BADGE_ICONS[badgeType];

  const sizeClasses = {
    sm: "text-xl p-1.5",
    md: "text-2xl p-2",
    lg: "text-3xl p-3",
  };

  const containerClasses = {
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center",
        containerClasses[size],
        className
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center transition-all",
          sizeClasses[size],
          isUnlocked
            ? "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 shadow-md"
            : "bg-muted grayscale opacity-50"
        )}
        title={isUnlocked ? info.label : `Locked: Reach ${info.days} days`}
      >
        <span className={cn(!isUnlocked && "grayscale")}>{icon}</span>
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-sm font-medium",
            isUnlocked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {info.label}
        </span>
      )}
    </div>
  );
}

interface StreakBadgesProps {
  unlockedBadges: BadgeType[];
  showAll?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ALL_BADGES: BadgeType[] = ["streak_7", "streak_30", "streak_100"];

export function StreakBadges({
  unlockedBadges,
  showAll = false,
  size = "sm",
  className,
}: StreakBadgesProps) {
  const badgesToShow = showAll
    ? ALL_BADGES
    : unlockedBadges.length > 0
      ? unlockedBadges
      : [];

  if (badgesToShow.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {badgesToShow.map((badge) => (
        <StreakBadge
          key={badge}
          badgeType={badge}
          isUnlocked={unlockedBadges.includes(badge)}
          size={size}
          showLabel={false}
        />
      ))}
    </div>
  );
}
