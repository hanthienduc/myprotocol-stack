"use client";

import { useWizard } from "./onboarding-wizard-context";
import { Button } from "@myprotocolstack/ui";
import { Card } from "@myprotocolstack/ui";
import { cn } from "@myprotocolstack/utils";

const timeOptions = [
  { minutes: 15, label: "15 min", description: "Quick daily routine" },
  { minutes: 30, label: "30 min", description: "Balanced routine" },
  { minutes: 45, label: "45 min", description: "Comprehensive routine" },
  { minutes: 60, label: "60+ min", description: "Full optimization" },
];

export function StepTime() {
  const { data, setTimeMinutes, nextStep, prevStep, canProceed } = useWizard();

  const getProtocolEstimate = (minutes: number): string => {
    if (minutes <= 15) return "2-3 protocols";
    if (minutes <= 30) return "4-5 protocols";
    if (minutes <= 45) return "6-7 protocols";
    return "8+ protocols";
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">How much time can you commit daily?</h1>
        <p className="text-muted-foreground">
          We'll recommend protocols that fit your schedule
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {timeOptions.map((option) => {
          const isSelected = data.time_minutes === option.minutes;
          return (
            <Card
              key={option.minutes}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary text-center",
                isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20"
              )}
              onClick={() => setTimeMinutes(option.minutes)}
            >
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{option.label}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <p className="text-xs text-primary font-medium">
                  {getProtocolEstimate(option.minutes)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canProceed()} size="lg">
          See Recommendations
        </Button>
      </div>
    </div>
  );
}
