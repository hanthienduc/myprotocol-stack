import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@myprotocolstack/database/server";
import { getAnalyticsData } from "@/lib/analytics-queries";
import { isPro } from "@/lib/subscription";
import type { DateRange } from "@/lib/types/analytics";
import { AnalyticsSummaryCards } from "@/components/analytics/analytics-summary-cards";
import { AdherenceChart } from "@/components/analytics/adherence-chart";
import { ProtocolCompletionChart } from "@/components/analytics/protocol-completion-chart";
import { DayHeatmap } from "@/components/analytics/day-heatmap";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { DateRangeSelector } from "@/components/analytics/date-range-selector";
import { UpgradePrompt } from "@/components/subscription";
import { AnalyticsPageSkeleton } from "./loading";

interface AnalyticsPageProps {
  searchParams: Promise<{ days?: string }>;
}

async function AnalyticsContent({ days, userIsPro }: { days: DateRange; userIsPro: boolean }) {
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
        {/* Adherence Over Time - Available to all */}
        <AdherenceChart data={data.adherence} />

        {/* Protocol Completion Rates - Available to all */}
        <ProtocolCompletionChart data={data.protocolRates} />

        {/* Day Heatmap - Pro only */}
        {userIsPro ? (
          <DayHeatmap data={data.dayRates} />
        ) : (
          <ProFeatureCard
            title="Best Performing Days"
            feature="day-of-week insights"
          />
        )}

        {/* Category Breakdown - Pro only */}
        {userIsPro ? (
          <CategoryBreakdown data={data.categoryBreakdown} />
        ) : (
          <ProFeatureCard
            title="Category Breakdown"
            feature="category analytics"
          />
        )}
      </div>
    </div>
  );
}

function ProFeatureCard({ title, feature }: { title: string; feature: string }) {
  return (
    <div className="border rounded-lg p-6 bg-muted/30">
      <h3 className="text-lg font-semibold mb-4 text-muted-foreground">{title}</h3>
      <UpgradePrompt feature={feature} variant="card" showPricing={false} />
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const daysParam = params.days;
  const userIsPro = await isPro();

  // Parse and validate days parameter
  // Free users are limited to 7 days
  let days: DateRange = userIsPro ? 30 : 7;
  if (daysParam) {
    const parsed = parseInt(daysParam, 10);
    if (parsed === 7 || parsed === 30 || parsed === 90) {
      // Free users can only access 7 days, even if they manipulate the URL
      if (!userIsPro && parsed !== 7) {
        days = 7;
      } else {
        days = parsed;
      }
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
        <DateRangeSelector currentRange={days} isPro={userIsPro} />
      </div>

      {/* Analytics Content */}
      <Suspense fallback={<AnalyticsPageSkeleton />}>
        <AnalyticsContent days={days} userIsPro={userIsPro} />
      </Suspense>
    </div>
  );
}
