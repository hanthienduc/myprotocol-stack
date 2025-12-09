"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myprotocolstack/ui";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryData } from "@/lib/types/analytics";
import type { ProtocolCategory } from "@myprotocolstack/database";

interface CategoryBreakdownProps {
  data: CategoryData[];
}

const CATEGORY_INFO: Record<ProtocolCategory, { color: string; icon: string; label: string }> = {
  sleep: { color: "hsl(var(--chart-1))", icon: "🌙", label: "Sleep" },
  focus: { color: "hsl(var(--chart-2))", icon: "🎯", label: "Focus" },
  energy: { color: "hsl(var(--chart-3))", icon: "⚡", label: "Energy" },
  fitness: { color: "hsl(var(--chart-4))", icon: "💪", label: "Fitness" },
};

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const hasData = data.some((d) => d.total > 0);

  // Filter out categories with no data
  const chartData = data.filter((d) => d.total > 0).map((d) => ({
    ...d,
    ...CATEGORY_INFO[d.category],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No tracking data for this period
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Chart */}
            <div className="h-[200px] w-[200px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="completed"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.completed}/{item.total} ({item.rate}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {chartData.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">{item.rate}%</span>
                    <span className="ml-1">({item.completed}/{item.total})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
