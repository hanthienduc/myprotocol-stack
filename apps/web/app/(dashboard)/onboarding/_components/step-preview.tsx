"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWizard, clearOnboardingStorage } from "./onboarding-wizard-context";
import { Button } from "@myprotocolstack/ui";
import { Card } from "@myprotocolstack/ui";
import { Badge } from "@myprotocolstack/ui";
import { completeOnboarding } from "@/actions/onboarding";
import { toast } from "sonner";
import type { Protocol } from "@myprotocolstack/database";

interface StepPreviewProps {
  protocols: Protocol[];
}

const categoryColors: Record<string, string> = {
  sleep: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  focus: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  energy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  fitness: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function StepPreview({ protocols }: StepPreviewProps) {
  const router = useRouter();
  const { data, prevStep } = useWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter protocols based on user selections
  const recommendedProtocols = useMemo(() => {
    const filtered = protocols.filter((p) => data.goals.includes(p.category));

    // Sort by difficulty (easy first for beginners, hard first for advanced)
    const difficultyOrder =
      data.experience === "advanced"
        ? { hard: 0, medium: 1, easy: 2 }
        : data.experience === "intermediate"
          ? { medium: 0, easy: 1, hard: 2 }
          : { easy: 0, medium: 1, hard: 2 };

    const sorted = filtered.sort(
      (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    );

    // Limit based on time
    const protocolCount =
      data.time_minutes <= 15
        ? 3
        : data.time_minutes <= 30
          ? 5
          : data.time_minutes <= 45
            ? 7
            : 8;

    return sorted.slice(0, protocolCount);
  }, [protocols, data]);

  const handleCreateStack = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await completeOnboarding({
        goals: data.goals,
        experience: data.experience!,
        time_minutes: data.time_minutes,
        protocol_ids: recommendedProtocols.map((p) => p.id),
      });

      if (result.success) {
        clearOnboardingStorage();
        toast.success("Your first stack is ready!");
        router.push("/today");
      } else {
        toast.error(result.error || "Failed to create stack");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Your Recommended Stack</h1>
        <p className="text-muted-foreground">
          Based on your goals, we've selected {recommendedProtocols.length} protocols
        </p>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto">
        {recommendedProtocols.map((protocol) => (
          <Card key={protocol.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{protocol.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {protocol.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {protocol.duration_minutes && (
                    <span>{protocol.duration_minutes} min</span>
                  )}
                  <span className="capitalize">{protocol.difficulty}</span>
                </div>
              </div>
              <Badge variant="secondary" className={categoryColors[protocol.category]}>
                {protocol.category}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={handleCreateStack} disabled={isSubmitting} size="lg">
          {isSubmitting ? "Creating..." : "Create My Stack"}
        </Button>
      </div>
    </div>
  );
}
