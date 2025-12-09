"use client";

import { useWizard } from "./onboarding-wizard-context";
import { Button } from "@myprotocolstack/ui";
import { Card } from "@myprotocolstack/ui";
import { cn } from "@myprotocolstack/utils";
import type { ProtocolCategory } from "@myprotocolstack/database";

const goalOptions: {
  id: ProtocolCategory;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "sleep",
    title: "Better Sleep",
    description: "Improve sleep quality and recovery",
    icon: "🌙",
  },
  {
    id: "focus",
    title: "Sharper Focus",
    description: "Boost concentration and mental clarity",
    icon: "🎯",
  },
  {
    id: "energy",
    title: "More Energy",
    description: "Increase vitality throughout the day",
    icon: "⚡",
  },
  {
    id: "fitness",
    title: "Physical Fitness",
    description: "Optimize workouts and recovery",
    icon: "💪",
  },
];

export function StepGoals() {
  const { data, setGoals, nextStep, canProceed } = useWizard();

  const toggleGoal = (goal: ProtocolCategory) => {
    const current = data.goals;
    if (current.includes(goal)) {
      setGoals(current.filter((g) => g !== goal));
    } else if (current.length < 2) {
      setGoals([...current, goal]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">What are your health goals?</h1>
        <p className="text-muted-foreground">
          Select 1-2 areas you want to focus on
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goalOptions.map((option) => {
          const isSelected = data.goals.includes(option.id);
          return (
            <Card
              key={option.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary",
                isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20"
              )}
              onClick={() => toggleGoal(option.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <h3 className="font-semibold">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={nextStep} disabled={!canProceed()} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
