import { createClient } from "@myprotocolstack/database/server";
import type {
  DateRange,
  AdherenceDataPoint,
  ProtocolRate,
  DayRate,
  CategoryData,
  AnalyticsSummary,
  AnalyticsData,
} from "./types/analytics";
import type { ProtocolCategory } from "@myprotocolstack/database";

const DAY_NAMES: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Analytics queries for tracking data.
 * NOTE: All date calculations use UTC. Users in Asia/Pacific timezones
 * may see slight discrepancies in day-of-week grouping.
 *
 * Performance: For optimal query performance with >1k users, ensure
 * the following index exists:
 * CREATE INDEX idx_tracking_user_date ON tracking(user_id, date DESC);
 */

// Helper to format date for chart labels
function formatDateLabel(date: Date, range: DateRange): string {
  if (range === 7) {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get weekly adherence data points
export async function getAdherenceData(
  userId: string,
  days: DateRange
): Promise<AdherenceDataPoint[]> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("tracking")
    .select("date, completed")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]);

  if (error) {
    console.error("[Analytics] getAdherenceData:", error.message);
    return [];
  }
  if (!data) return [];

  // Group by date and calculate rate
  const byDate = new Map<string, { completed: number; total: number }>();

  data.forEach((record) => {
    const existing = byDate.get(record.date) || { completed: 0, total: 0 };
    existing.total++;
    if (record.completed) existing.completed++;
    byDate.set(record.date, existing);
  });

  // Convert to array sorted by date
  const result: AdherenceDataPoint[] = [];
  const dateEntries = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));

  dateEntries.forEach(([dateStr, { completed, total }]) => {
    const date = new Date(dateStr);
    result.push({
      date: dateStr,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      label: formatDateLabel(date, days),
    });
  });

  return result;
}

// Get per-protocol completion rates
export async function getProtocolCompletionRates(
  userId: string,
  days: DateRange
): Promise<ProtocolRate[]> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get tracking data with protocol info
  const { data: trackingData, error: trackingError } = await supabase
    .from("tracking")
    .select("protocol_id, completed")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]);

  if (trackingError) {
    console.error("[Analytics] getProtocolCompletionRates tracking:", trackingError.message);
    return [];
  }
  if (!trackingData) return [];

  // Get all protocols for names
  const { data: protocols, error: protocolError } = await supabase
    .from("protocols")
    .select("id, name, category");

  if (protocolError) {
    console.error("[Analytics] getProtocolCompletionRates protocols:", protocolError.message);
    return [];
  }
  if (!protocols) return [];

  // Build protocol map
  const protocolMap = new Map(protocols.map((p) => [p.id, p]));

  // Group by protocol
  const byProtocol = new Map<string, { completed: number; total: number }>();

  trackingData.forEach((record) => {
    const existing = byProtocol.get(record.protocol_id) || { completed: 0, total: 0 };
    existing.total++;
    if (record.completed) existing.completed++;
    byProtocol.set(record.protocol_id, existing);
  });

  // Convert to array, sorted by rate descending
  const result: ProtocolRate[] = [];

  byProtocol.forEach(({ completed, total }, protocolId) => {
    const protocol = protocolMap.get(protocolId);
    if (!protocol) return;

    result.push({
      id: protocolId,
      name: protocol.name,
      category: protocol.category as ProtocolCategory,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
    });
  });

  return result.sort((a, b) => b.rate - a.rate).slice(0, 10);
}

// Get day of week completion rates
export async function getDayOfWeekRates(userId: string, days: DateRange): Promise<DayRate[]> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("tracking")
    .select("date, completed")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]);

  if (error) {
    console.error("[Analytics] getDayOfWeekRates:", error.message);
    return [];
  }
  if (!data) return [];

  // Group by day of week (0-6)
  const byDay = new Map<number, { completed: number; total: number }>();

  data.forEach((record) => {
    const date = new Date(record.date);
    const dow = date.getUTCDay();
    const existing = byDay.get(dow) || { completed: 0, total: 0 };
    existing.total++;
    if (record.completed) existing.completed++;
    byDay.set(dow, existing);
  });

  // Build full week array
  const result: DayRate[] = [];
  for (let i = 0; i < 7; i++) {
    const stats = byDay.get(i) || { completed: 0, total: 0 };
    result.push({
      dayOfWeek: i,
      dayName: DAY_NAMES[i] ?? "N/A",
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    });
  }

  return result;
}

// Get category breakdown
export async function getCategoryBreakdown(
  userId: string,
  days: DateRange
): Promise<CategoryData[]> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get tracking data with protocol info
  const { data: trackingData, error: trackingError } = await supabase
    .from("tracking")
    .select("protocol_id, completed")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]);

  if (trackingError) {
    console.error("[Analytics] getCategoryBreakdown tracking:", trackingError.message);
    return [];
  }
  if (!trackingData) return [];

  // Get all protocols for categories
  const { data: protocols, error: protocolError } = await supabase
    .from("protocols")
    .select("id, category");

  if (protocolError) {
    console.error("[Analytics] getCategoryBreakdown protocols:", protocolError.message);
    return [];
  }
  if (!protocols) return [];

  // Build protocol category map
  const categoryMap = new Map(protocols.map((p) => [p.id, p.category as ProtocolCategory]));

  // Group by category
  const byCategory = new Map<ProtocolCategory, { completed: number; total: number }>();

  trackingData.forEach((record) => {
    const category = categoryMap.get(record.protocol_id);
    if (!category) return;

    const existing = byCategory.get(category) || { completed: 0, total: 0 };
    existing.total++;
    if (record.completed) existing.completed++;
    byCategory.set(category, existing);
  });

  // Convert to array
  const result: CategoryData[] = [];
  const categories: ProtocolCategory[] = ["sleep", "focus", "energy", "fitness"];

  categories.forEach((category) => {
    const stats = byCategory.get(category) || { completed: 0, total: 0 };
    result.push({
      category,
      completed: stats.completed,
      total: stats.total,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    });
  });

  return result;
}

// Get summary stats
export async function getAnalyticsSummary(
  userId: string,
  days: DateRange
): Promise<AnalyticsSummary> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get tracking data
  const { data: trackingData, error: trackingError } = await supabase
    .from("tracking")
    .select("completed")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]);

  if (trackingError) {
    console.error("[Analytics] getAnalyticsSummary tracking:", trackingError.message);
  }

  // Get streak data
  const { data: streakData, error: streakError } = await supabase
    .from("user_streaks")
    .select("current_streak, longest_streak")
    .eq("user_id", userId);

  if (streakError) {
    console.error("[Analytics] getAnalyticsSummary streaks:", streakError.message);
  }

  const totalTracked = trackingData?.length || 0;
  const totalCompleted = trackingData?.filter((t) => t.completed).length || 0;
  const averageRate = totalTracked > 0 ? Math.round((totalCompleted / totalTracked) * 100) : 0;

  // Get best streak across all stacks
  let currentStreak = 0;
  let bestStreak = 0;

  if (!streakError && streakData) {
    streakData.forEach((s) => {
      if (s.current_streak > currentStreak) currentStreak = s.current_streak;
      if (s.longest_streak > bestStreak) bestStreak = s.longest_streak;
    });
  }

  return {
    totalCompleted,
    totalTracked,
    averageRate,
    currentStreak,
    bestStreak,
  };
}

// Get all analytics data in one call
export async function getAnalyticsData(userId: string, days: DateRange): Promise<AnalyticsData> {
  const [summary, adherence, protocolRates, dayRates, categoryBreakdown] = await Promise.all([
    getAnalyticsSummary(userId, days),
    getAdherenceData(userId, days),
    getProtocolCompletionRates(userId, days),
    getDayOfWeekRates(userId, days),
    getCategoryBreakdown(userId, days),
  ]);

  return {
    summary,
    adherence,
    protocolRates,
    dayRates,
    categoryBreakdown,
  };
}
