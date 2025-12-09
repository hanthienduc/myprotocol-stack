import type { ProtocolCategory } from "@myprotocolstack/database";

// Time periods for date range selector
export type DateRange = 7 | 30 | 90;

// Weekly/Monthly adherence data point
export type AdherenceDataPoint = {
  date: string;
  rate: number;
  label: string; // formatted date label for chart
};

// Per-protocol completion rate
export type ProtocolRate = {
  id: string;
  name: string;
  category: ProtocolCategory;
  rate: number;
  completed: number;
  total: number;
};

// Day of week rate for heatmap
export type DayRate = {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayName: string;
  rate: number;
};

// Category breakdown data
export type CategoryData = {
  category: ProtocolCategory;
  completed: number;
  total: number;
  rate: number;
};

// Summary stats for cards
export type AnalyticsSummary = {
  totalCompleted: number;
  totalTracked: number;
  averageRate: number;
  currentStreak: number;
  bestStreak: number;
};

// Full analytics data bundle
export type AnalyticsData = {
  summary: AnalyticsSummary;
  adherence: AdherenceDataPoint[];
  protocolRates: ProtocolRate[];
  dayRates: DayRate[];
  categoryBreakdown: CategoryData[];
};
