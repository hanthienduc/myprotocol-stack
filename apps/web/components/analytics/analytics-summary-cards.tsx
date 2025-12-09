"use client";

import { Card, CardContent } from "@myprotocolstack/ui";
import { CheckCircle2, Percent, Flame, Trophy } from "lucide-react";
import type { AnalyticsSummary } from "@/lib/types/analytics";

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
}

const cards = [
  {
    key: "totalCompleted" as const,
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
    format: (value: number) => value.toString(),
  },
  {
    key: "averageRate" as const,
    label: "Avg Adherence",
    icon: Percent,
    color: "text-blue-500",
    format: (value: number) => `${value}%`,
  },
  {
    key: "currentStreak" as const,
    label: "Current Streak",
    icon: Flame,
    color: "text-orange-500",
    format: (value: number) => `${value} day${value !== 1 ? "s" : ""}`,
  },
  {
    key: "bestStreak" as const,
    label: "Best Streak",
    icon: Trophy,
    color: "text-yellow-500",
    format: (value: number) => `${value} day${value !== 1 ? "s" : ""}`,
  },
];

export function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, color, format }) => (
        <Card key={key}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 bg-muted ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{format(summary[key])}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
