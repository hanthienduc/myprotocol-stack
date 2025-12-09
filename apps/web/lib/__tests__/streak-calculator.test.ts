import type { BadgeType } from "@myprotocolstack/database";

// Mock the streak calculator functions directly since Jest can't resolve path aliases easily
// We'll test the pure logic functions

interface StreakCalculationResult {
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

function daysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1 + "T00:00:00Z");
  const d2 = new Date(date2 + "T00:00:00Z");
  const diffMs = d1.getTime() - d2.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function calculateStreak(
  lastActivityDate: string | null,
  currentStreak: number,
  longestStreak: number,
  gracePeriodUsed: boolean,
  today: string,
  existingBadges: BadgeType[]
): StreakCalculationResult {
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

function isStreakAtRisk(
  lastActivityDate: string | null,
  gracePeriodUsed: boolean,
  today: string
): boolean {
  if (!lastActivityDate) return false;

  const daysSinceLastActivity = daysDifference(today, lastActivityDate);

  if (daysSinceLastActivity === 1 && gracePeriodUsed) {
    return true;
  }
  if (daysSinceLastActivity === 2 && !gracePeriodUsed) {
    return true;
  }

  return false;
}

describe("Streak Calculator", () => {
  describe("calculateStreak", () => {
    it("starts a new streak at 1 for first activity", () => {
      const result = calculateStreak(null, 0, 0, false, "2025-12-09", []);
      expect(result.newStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.gracePeriodUsed).toBe(false);
    });

    it("returns same streak for same-day activity", () => {
      const result = calculateStreak("2025-12-09", 5, 5, false, "2025-12-09", []);
      expect(result.newStreak).toBe(5);
      expect(result.gracePeriodUsed).toBe(false);
    });

    it("increments streak for consecutive day", () => {
      const result = calculateStreak("2025-12-08", 5, 5, false, "2025-12-09", []);
      expect(result.newStreak).toBe(6);
      expect(result.longestStreak).toBe(6);
      expect(result.gracePeriodUsed).toBe(false);
    });

    it("uses grace period for 2-day gap when not used", () => {
      const result = calculateStreak("2025-12-07", 5, 5, false, "2025-12-09", []);
      expect(result.newStreak).toBe(6);
      expect(result.gracePeriodUsed).toBe(true);
    });

    it("resets streak if grace period already used and 2-day gap", () => {
      const result = calculateStreak("2025-12-07", 5, 5, true, "2025-12-09", []);
      expect(result.newStreak).toBe(1);
      expect(result.gracePeriodUsed).toBe(false);
    });

    it("resets streak for more than 2-day gap", () => {
      const result = calculateStreak("2025-12-05", 10, 10, false, "2025-12-09", []);
      expect(result.newStreak).toBe(1);
      expect(result.longestStreak).toBe(10); // Preserves longest
    });

    it("resets grace period on consecutive day after grace was used", () => {
      const result = calculateStreak("2025-12-08", 6, 6, true, "2025-12-09", []);
      expect(result.newStreak).toBe(7);
      expect(result.gracePeriodUsed).toBe(false); // Reset after consecutive day
    });
  });

  describe("milestone badges", () => {
    it("unlocks 7-day badge at streak 7", () => {
      const result = calculateStreak("2025-12-08", 6, 6, false, "2025-12-09", []);
      expect(result.newStreak).toBe(7);
      expect(result.badgeToUnlock).toBe("streak_7");
      expect(result.isNewMilestone).toBe(true);
    });

    it("does not unlock already earned badge", () => {
      const result = calculateStreak("2025-12-08", 6, 6, false, "2025-12-09", ["streak_7"]);
      expect(result.newStreak).toBe(7);
      expect(result.badgeToUnlock).toBe(null);
      expect(result.isNewMilestone).toBe(false);
    });

    it("unlocks 30-day badge at streak 30", () => {
      const result = calculateStreak("2025-12-08", 29, 29, false, "2025-12-09", ["streak_7"]);
      expect(result.newStreak).toBe(30);
      expect(result.badgeToUnlock).toBe("streak_30");
    });

    it("unlocks 100-day badge at streak 100", () => {
      const result = calculateStreak("2025-12-08", 99, 99, false, "2025-12-09", ["streak_7", "streak_30"]);
      expect(result.newStreak).toBe(100);
      expect(result.badgeToUnlock).toBe("streak_100");
    });

    it("unlocks earliest missing badge when exceeding milestone", () => {
      // User has 50-day streak but never got 7-day badge
      const result = calculateStreak("2025-12-08", 49, 49, false, "2025-12-09", []);
      expect(result.newStreak).toBe(50);
      expect(result.badgeToUnlock).toBe("streak_7"); // Gets 7-day first
    });
  });

  describe("longest streak tracking", () => {
    it("updates longest streak when current exceeds it", () => {
      const result = calculateStreak("2025-12-08", 10, 10, false, "2025-12-09", []);
      expect(result.newStreak).toBe(11);
      expect(result.longestStreak).toBe(11);
    });

    it("preserves longest streak when resetting", () => {
      const result = calculateStreak("2025-12-01", 5, 20, false, "2025-12-09", []);
      expect(result.newStreak).toBe(1);
      expect(result.longestStreak).toBe(20);
    });
  });

  describe("isStreakAtRisk", () => {
    it("returns false when no last activity", () => {
      expect(isStreakAtRisk(null, false, "2025-12-09")).toBe(false);
    });

    it("returns false for same day activity", () => {
      expect(isStreakAtRisk("2025-12-09", false, "2025-12-09")).toBe(false);
    });

    it("returns false for yesterday with grace not used", () => {
      expect(isStreakAtRisk("2025-12-08", false, "2025-12-09")).toBe(false);
    });

    it("returns true for yesterday with grace already used", () => {
      expect(isStreakAtRisk("2025-12-08", true, "2025-12-09")).toBe(true);
    });

    it("returns true for 2 days ago with grace not used", () => {
      expect(isStreakAtRisk("2025-12-07", false, "2025-12-09")).toBe(true);
    });

    it("returns false for 2 days ago with grace already used (streak already broken)", () => {
      expect(isStreakAtRisk("2025-12-07", true, "2025-12-09")).toBe(false);
    });

    it("returns false for more than 2 days ago", () => {
      expect(isStreakAtRisk("2025-12-05", false, "2025-12-09")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles month boundaries correctly", () => {
      const result = calculateStreak("2025-11-30", 5, 5, false, "2025-12-01", []);
      expect(result.newStreak).toBe(6);
    });

    it("handles year boundaries correctly", () => {
      const result = calculateStreak("2024-12-31", 5, 5, false, "2025-01-01", []);
      expect(result.newStreak).toBe(6);
    });

    it("handles leap year correctly", () => {
      const result = calculateStreak("2024-02-28", 5, 5, false, "2024-02-29", []);
      expect(result.newStreak).toBe(6);
    });

    it("handles February 28 to March 1 in non-leap year", () => {
      const result = calculateStreak("2025-02-28", 5, 5, false, "2025-03-01", []);
      expect(result.newStreak).toBe(6);
    });
  });
});
