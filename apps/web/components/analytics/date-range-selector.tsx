"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@myprotocolstack/ui";
import type { DateRange } from "@/lib/types/analytics";

interface DateRangeSelectorProps {
  currentRange: DateRange;
}

const RANGES: { value: DateRange; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

export function DateRangeSelector({ currentRange }: DateRangeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRangeChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", range.toString());
    router.push(`/analytics?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {RANGES.map(({ value, label }) => (
        <Button
          key={value}
          variant={currentRange === value ? "default" : "ghost"}
          size="sm"
          onClick={() => handleRangeChange(value)}
          className="px-4"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
