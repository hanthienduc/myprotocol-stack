"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@myprotocolstack/ui";
import { Lock } from "lucide-react";
import type { DateRange } from "@/lib/types/analytics";

interface DateRangeSelectorProps {
  currentRange: DateRange;
  isPro?: boolean;
}

const RANGES: { value: DateRange; label: string; proOnly: boolean }[] = [
  { value: 7, label: "7 days", proOnly: false },
  { value: 30, label: "30 days", proOnly: true },
  { value: 90, label: "90 days", proOnly: true },
];

export function DateRangeSelector({ currentRange, isPro = false }: DateRangeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRangeChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", range.toString());
    router.push(`/analytics?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {RANGES.map(({ value, label, proOnly }) => {
        const isLocked = proOnly && !isPro;
        return (
          <Button
            key={value}
            variant={currentRange === value ? "default" : "ghost"}
            size="sm"
            onClick={() => !isLocked && handleRangeChange(value)}
            className={`px-4 ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isLocked}
            title={isLocked ? "Upgrade to Pro for extended history" : undefined}
          >
            {label}
            {isLocked && <Lock className="h-3 w-3 ml-1" />}
          </Button>
        );
      })}
    </div>
  );
}
