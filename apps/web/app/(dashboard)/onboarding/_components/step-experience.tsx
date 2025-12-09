"use client";

import { useWizard } from "./onboarding-wizard-context";
import { Button } from "@myprotocolstack/ui";
import { Card } from "@myprotocolstack/ui";
import { cn } from "@myprotocolstack/utils";
import type { ExperienceLevel } from "@myprotocolstack/database";

const experienceOptions: {
  id: ExperienceLevel;
  title: string;
  description: string;
}[] = [
  {
    id: "beginner",
    title: "Beginner",
    description: "New to health protocols. Start with simple, easy-to-follow routines.",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Some experience with health routines. Ready for more structure.",
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Experienced with protocols. Looking to optimize and refine.",
  },
];

export function StepExperience() {
  const { data, setExperience, nextStep, prevStep, canProceed } = useWizard();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">What's your experience level?</h1>
        <p className="text-muted-foreground">
          This helps us recommend the right protocols for you
        </p>
      </div>

      <div className="space-y-3">
        {experienceOptions.map((option) => {
          const isSelected = data.experience === option.id;
          return (
            <Card
              key={option.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary",
                isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20"
              )}
              onClick={() => setExperience(option.id)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected ? "border-primary" : "border-muted-foreground"
                  )}
                >
                  {isSelected && (
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </div>
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

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canProceed()} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
