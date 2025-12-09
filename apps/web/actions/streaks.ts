"use server";

import { createClient } from "@myprotocolstack/database/server";
import { revalidatePath } from "next/cache";
import type { BadgeType, UserStreak, UserBadge } from "@myprotocolstack/database";
import { calculateStreak, getTodayInTimezone } from "@/lib/streak-calculator";

export interface UpdateStreakResult {
  success: boolean;
  streak: number;
  longestStreak: number;
  badgeUnlocked: BadgeType | null;
  error?: string;
}

/**
 * Update streak for a specific stack when user completes all protocols for the day
 * @param stackId - The stack UUID
 * @param clientTimezone - User's timezone from browser (Intl.DateTimeFormat().resolvedOptions().timeZone)
 */
export async function updateStreak(stackId: string, clientTimezone?: string): Promise<UpdateStreakResult> {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, streak: 0, longestStreak: 0, badgeUnlocked: null, error: "Unauthorized" };
    }

    // Validate stackId (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(stackId)) {
      return { success: false, streak: 0, longestStreak: 0, badgeUnlocked: null, error: "Invalid stack ID" };
    }

    // Verify stack ownership
    const { data: stack, error: stackError } = await supabase
      .from("stacks")
      .select("id, user_id")
      .eq("id", stackId)
      .eq("user_id", user.id)
      .single();

    if (stackError || !stack) {
      return { success: false, streak: 0, longestStreak: 0, badgeUnlocked: null, error: "Stack not found" };
    }

    // Use client timezone (passed from browser) or fallback to UTC
    // Client MUST pass timezone for correct streak calculation
    const userTimezone = clientTimezone || "UTC";

    // Get or create streak record
    const { data: existingStreak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .eq("stack_id", stackId)
      .single();

    // Get existing badges for this stack
    const { data: existingBadges } = await supabase
      .from("user_badges")
      .select("badge_type")
      .eq("user_id", user.id)
      .eq("stack_id", stackId);

    const badgeTypes = (existingBadges || []).map((b) => b.badge_type as BadgeType);

    // Calculate new streak
    const result = calculateStreak(
      existingStreak?.last_activity_date || null,
      existingStreak?.current_streak || 0,
      existingStreak?.longest_streak || 0,
      existingStreak?.grace_period_used || false,
      userTimezone,
      badgeTypes
    );

    const today = getTodayInTimezone(userTimezone);

    // Upsert streak record
    const { error: streakError } = await supabase
      .from("user_streaks")
      .upsert(
        {
          user_id: user.id,
          stack_id: stackId,
          current_streak: result.newStreak,
          longest_streak: result.longestStreak,
          last_activity_date: today,
          grace_period_used: result.gracePeriodUsed,
          timezone: userTimezone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,stack_id" }
      );

    if (streakError) {
      console.error("Error updating streak:", streakError);
      return { success: false, streak: 0, longestStreak: 0, badgeUnlocked: null, error: "Failed to update streak" };
    }

    // Unlock badge if milestone reached
    if (result.badgeToUnlock) {
      const { error: badgeError } = await supabase
        .from("user_badges")
        .insert({
          user_id: user.id,
          badge_type: result.badgeToUnlock,
          stack_id: stackId,
        });

      if (badgeError && !badgeError.message.includes("duplicate")) {
        console.error("Error unlocking badge:", badgeError);
      }
    }

    revalidatePath("/today");

    return {
      success: true,
      streak: result.newStreak,
      longestStreak: result.longestStreak,
      badgeUnlocked: result.badgeToUnlock,
    };
  } catch (error) {
    console.error("Update streak error:", error);
    return { success: false, streak: 0, longestStreak: 0, badgeUnlocked: null, error: "Something went wrong" };
  }
}

/**
 * Get streak data for a specific stack
 */
export async function getStackStreak(stackId: string): Promise<UserStreak | null> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .eq("stack_id", stackId)
      .single();

    return data as UserStreak | null;
  } catch {
    return null;
  }
}

/**
 * Get all streaks for current user
 */
export async function getUserStreaks(): Promise<UserStreak[]> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id);

    return (data || []) as UserStreak[];
  } catch {
    return [];
  }
}

/**
 * Get all badges for current user
 */
export async function getUserBadges(): Promise<UserBadge[]> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", user.id);

    return (data || []) as UserBadge[];
  } catch {
    return [];
  }
}

/**
 * Get badges for a specific stack
 */
export async function getStackBadges(stackId: string): Promise<UserBadge[]> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", user.id)
      .eq("stack_id", stackId);

    return (data || []) as UserBadge[];
  } catch {
    return [];
  }
}
