import { createClient } from "@myprotocolstack/database/server";

// Free tier limits
export const FREE_LIMITS = {
  maxStacks: 3,
  maxProtocolsPerStack: 10,
  historyDays: 7,
  advancedAnalytics: false,
  aiRecommendations: false,
  wearableSync: false,
} as const;

// Pro tier features
export const PRO_FEATURES = {
  maxStacks: Infinity,
  maxProtocolsPerStack: Infinity,
  historyDays: Infinity,
  advancedAnalytics: true,
  aiRecommendations: true,
  wearableSync: true,
} as const;

export type SubscriptionTier = "free" | "pro";

/**
 * Get the current user's subscription tier (server-side)
 */
export async function getUserTier(): Promise<SubscriptionTier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "free";

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  return (profile?.subscription_tier as SubscriptionTier) || "free";
}

/**
 * Check if user can create more stacks
 */
export async function canCreateStack(): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { allowed: false, current: 0, limit: 0 };

  const tier = await getUserTier();
  const limit = tier === "pro" ? PRO_FEATURES.maxStacks : FREE_LIMITS.maxStacks;

  // Count existing stacks
  const { count } = await supabase
    .from("stacks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const current = count || 0;
  const allowed = current < limit;

  return { allowed, current, limit };
}

/**
 * Check if user has access to advanced analytics
 */
export async function hasAdvancedAnalytics(): Promise<boolean> {
  const tier = await getUserTier();
  return tier === "pro" ? PRO_FEATURES.advancedAnalytics : FREE_LIMITS.advancedAnalytics;
}

/**
 * Get history days limit for user
 */
export async function getHistoryDaysLimit(): Promise<number> {
  const tier = await getUserTier();
  return tier === "pro" ? PRO_FEATURES.historyDays : FREE_LIMITS.historyDays;
}

/**
 * Check if user is on Pro tier
 */
export async function isPro(): Promise<boolean> {
  const tier = await getUserTier();
  return tier === "pro";
}

/**
 * Get feature limits for the current user
 */
export async function getFeatureLimits() {
  const tier = await getUserTier();
  return tier === "pro" ? PRO_FEATURES : FREE_LIMITS;
}

/**
 * Require Pro tier - throws if not Pro (for server actions)
 */
export async function requirePro(): Promise<void> {
  const tier = await getUserTier();
  if (tier !== "pro") {
    throw new Error("This feature requires a Pro subscription");
  }
}
