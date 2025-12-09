"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myprotocolstack/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ProtocolRate } from "@/lib/types/analytics";
import type { ProtocolCategory } from "@myprotocolstack/database";

interface ProtocolCompletionChartProps {
  data: ProtocolRate[];
}

const CATEGORY_COLORS: Record<ProtocolCategory, string> = {
  sleep: "hsl(var(--chart-1))",
  focus: "hsl(var(--chart-2))",
  energy: "hsl(var(--chart-3))",
  fitness: "hsl(var(--chart-4))",
};

export function ProtocolCompletionChart({ data }: ProtocolCompletionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Protocol Completion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No protocol data for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  // Truncate long names for chart display
  const chartData = data.map((item) => ({
    ...item,
    displayName: item.name.length > 20 ? `${item.name.slice(0, 18)}...` : item.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Protocol Completion Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                className="fill-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="displayName"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={140}
                className="fill-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as ProtocolRate & { displayName: string };
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">{item.rate}%</span>
                        <span className="text-muted-foreground ml-1">
                          ({item.completed}/{item.total})
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={CATEGORY_COLORS[entry.category]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
