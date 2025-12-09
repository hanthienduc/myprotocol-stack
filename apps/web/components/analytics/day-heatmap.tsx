"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myprotocolstack/ui";
import type { DayRate } from "@/lib/types/analytics";

interface DayHeatmapProps {
  data: DayRate[];
}

// Get color intensity based on rate (0-100)
function getHeatColor(rate: number): string {
  if (rate === 0) return "bg-muted";
  if (rate < 25) return "bg-red-200 dark:bg-red-900/50";
  if (rate < 50) return "bg-orange-200 dark:bg-orange-900/50";
  if (rate < 75) return "bg-yellow-200 dark:bg-yellow-900/50";
  if (rate < 90) return "bg-green-200 dark:bg-green-900/50";
  return "bg-green-400 dark:bg-green-700";
}

export function DayHeatmap({ data }: DayHeatmapProps) {
  // Reorder to start with Monday
  const orderedDays = [
    data.find((d) => d.dayOfWeek === 1), // Mon
    data.find((d) => d.dayOfWeek === 2), // Tue
    data.find((d) => d.dayOfWeek === 3), // Wed
    data.find((d) => d.dayOfWeek === 4), // Thu
    data.find((d) => d.dayOfWeek === 5), // Fri
    data.find((d) => d.dayOfWeek === 6), // Sat
    data.find((d) => d.dayOfWeek === 0), // Sun
  ].filter((d): d is DayRate => d !== undefined);

  const hasData = orderedDays.some((d) => d.rate > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Best Performing Days</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[100px] flex items-center justify-center text-muted-foreground">
            No tracking data for this period
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {orderedDays.map((day) => (
              <div key={day.dayOfWeek} className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{day.dayName}</span>
                <div
                  className={`w-full aspect-square rounded-md flex items-center justify-center ${getHeatColor(day.rate)} transition-colors`}
                >
                  <span className="text-sm font-medium">{day.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
