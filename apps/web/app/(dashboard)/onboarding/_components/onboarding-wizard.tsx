"use client";

import { useWizard, OnboardingWizardProvider } from "./onboarding-wizard-context";
import { StepGoals } from "./step-goals";
import { StepExperience } from "./step-experience";
import { StepTime } from "./step-time";
import { StepPreview } from "./step-preview";
import { Progress } from "@myprotocolstack/ui";
import type { Protocol } from "@myprotocolstack/database";

interface OnboardingWizardProps {
  protocols: Protocol[];
}

function WizardContent({ protocols }: OnboardingWizardProps) {
  const { step, isLoading } = useWizard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const stepLabels = ["Goals", "Experience", "Time", "Preview"];
  const progress = (step / 4) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress header */}
      <div className="mb-8 space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={step === i + 1 ? "text-foreground font-medium" : ""}
            >
              {label}
            </span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 1 && <StepGoals />}
        {step === 2 && <StepExperience />}
        {step === 3 && <StepTime />}
        {step === 4 && <StepPreview protocols={protocols} />}
      </div>
    </div>
  );
}

export function OnboardingWizard({ protocols }: OnboardingWizardProps) {
  return (
    <OnboardingWizardProvider>
      <WizardContent protocols={protocols} />
    </OnboardingWizardProvider>
  );
}
