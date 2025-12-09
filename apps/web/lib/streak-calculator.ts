import type { BadgeType } from "@myprotocolstack/database";

export interface StreakCalculationResult {
  newStreak: number;
  longestStreak: number;
  gracePeriodUsed: boolean;
  isNewMilestone: boolean;
  badgeToUnlock: BadgeType | null;
}

const MILESTONES: { days: number; badge: BadgeType }[] = [
  { days: 7, badge: "streak_7" },
  { days: 30, badge: "streak_30" },
  { days: 100, badge: "streak_100" },
];

/**
 * Get today's date in user's timezone as YYYY-MM-DD string
 */
export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

/**
 * Calculate days difference between two date strings (YYYY-MM-DD format)
 */
function daysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1 + "T00:00:00Z");
  const d2 = new Date(date2 + "T00:00:00Z");
  const diffMs = d1.getTime() - d2.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate streak based on last activity date
 *
 * Rules:
 * - Same day: no change to streak
 * - Yesterday: increment streak
 * - 2 days ago + grace not used: increment, mark grace used
 * - >2 days ago: reset to 1
 */
export function calculateStreak(
  lastActivityDate: string | null,
  currentStreak: number,
  longestStreak: number,
  gracePeriodUsed: boolean,
  userTimezone: string,
  existingBadges: BadgeType[]
): StreakCalculationResult {
  const today = getTodayInTimezone(userTimezone);

  // First activity ever
  if (!lastActivityDate) {
    return {
      newStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      gracePeriodUsed: false,
      isNewMilestone: false,
      badgeToUnlock: null,
    };
  }

  const daysSinceLastActivity = daysDifference(today, lastActivityDate);

  // Same day - no change
  if (daysSinceLastActivity === 0) {
    return {
      newStreak: currentStreak,
      longestStreak,
      gracePeriodUsed,
      isNewMilestone: false,
      badgeToUnlock: null,
    };
  }

  let newStreak: number;
  let newGracePeriodUsed = gracePeriodUsed;

  if (daysSinceLastActivity === 1) {
    // Yesterday - consecutive day, increment streak and reset grace
    newStreak = currentStreak + 1;
    newGracePeriodUsed = false;
  } else if (daysSinceLastActivity === 2 && !gracePeriodUsed) {
    // 2 days ago, grace not used - use grace period
    newStreak = currentStreak + 1;
    newGracePeriodUsed = true;
  } else {
    // More than 2 days ago or grace already used - reset
    newStreak = 1;
    newGracePeriodUsed = false;
  }

  const newLongestStreak = Math.max(newStreak, longestStreak);

  // Check for milestone
  let badgeToUnlock: BadgeType | null = null;
  for (const milestone of MILESTONES) {
    if (newStreak >= milestone.days && !existingBadges.includes(milestone.badge)) {
      badgeToUnlock = milestone.badge;
      break;
    }
  }

  return {
    newStreak,
    longestStreak: newLongestStreak,
    gracePeriodUsed: newGracePeriodUsed,
    isNewMilestone: badgeToUnlock !== null,
    badgeToUnlock,
  };
}

/**
 * Get badge display info
 */
export function getBadgeInfo(badgeType: BadgeType): { label: string; days: number } {
  switch (badgeType) {
    case "streak_7":
      return { label: "7-Day Streak", days: 7 };
    case "streak_30":
      return { label: "30-Day Streak", days: 30 };
    case "streak_100":
      return { label: "100-Day Streak", days: 100 };
    default:
      return { label: "Unknown", days: 0 };
  }
}

/**
 * Check if streak is at risk (grace period active)
 */
export function isStreakAtRisk(
  lastActivityDate: string | null,
  gracePeriodUsed: boolean,
  userTimezone: string
): boolean {
  if (!lastActivityDate) return false;

  const today = getTodayInTimezone(userTimezone);
  const daysSinceLastActivity = daysDifference(today, lastActivityDate);

  // At risk if: yesterday and grace already used, or 2 days ago and grace not used
  if (daysSinceLastActivity === 1 && gracePeriodUsed) {
    return true;
  }
  if (daysSinceLastActivity === 2 && !gracePeriodUsed) {
    return true;
  }

  return false;
}
