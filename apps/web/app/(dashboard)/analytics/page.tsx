import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@myprotocolstack/database/server";
import { getAnalyticsData } from "@/lib/analytics-queries";
import type { DateRange } from "@/lib/types/analytics";
import { AnalyticsSummaryCards } from "@/components/analytics/analytics-summary-cards";
import { AdherenceChart } from "@/components/analytics/adherence-chart";
import { ProtocolCompletionChart } from "@/components/analytics/protocol-completion-chart";
import { DayHeatmap } from "@/components/analytics/day-heatmap";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { DateRangeSelector } from "@/components/analytics/date-range-selector";
import { AnalyticsPageSkeleton } from "./loading";

interface AnalyticsPageProps {
  searchParams: Promise<{ days?: string }>;
}

async function AnalyticsContent({ days }: { days: DateRange }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getAnalyticsData(user.id, days);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <AnalyticsSummaryCards summary={data.summary} />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Adherence Over Time */}
        <AdherenceChart data={data.adherence} />

        {/* Protocol Completion Rates */}
        <ProtocolCompletionChart data={data.protocolRates} />

        {/* Day Heatmap */}
        <DayHeatmap data={data.dayRates} />

        {/* Category Breakdown */}
        <CategoryBreakdown data={data.categoryBreakdown} />
      </div>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const daysParam = params.days;

  // Parse and validate days parameter
  let days: DateRange = 30;
  if (daysParam) {
    const parsed = parseInt(daysParam, 10);
    if (parsed === 7 || parsed === 30 || parsed === 90) {
      days = parsed;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your protocol adherence and progress</p>
        </div>
        <DateRangeSelector currentRange={days} />
      </div>

      {/* Analytics Content */}
      <Suspense fallback={<AnalyticsPageSkeleton />}>
        <AnalyticsContent days={days} />
      </Suspense>
    </div>
  );
}
