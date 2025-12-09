"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { ProtocolCategory, ExperienceLevel } from "@myprotocolstack/database";

const STORAGE_KEY = "onboarding-wizard-state";

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface WizardData {
  goals: ProtocolCategory[];
  experience: ExperienceLevel | null;
  time_minutes: number;
}

interface WizardContextValue {
  step: OnboardingStep;
  data: WizardData;
  isLoading: boolean;
  setGoals: (goals: ProtocolCategory[]) => void;
  setExperience: (experience: ExperienceLevel) => void;
  setTimeMinutes: (minutes: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  canProceed: () => boolean;
}

const defaultData: WizardData = {
  goals: [],
  experience: null,
  time_minutes: 30,
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function OnboardingWizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<WizardData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData(parsed.data);
        if (parsed.step) setStep(parsed.step);
      }
    } catch {
      // Ignore parsing errors
    }
    setIsLoading(false);
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    }
  }, [step, data, isLoading]);

  const setGoals = useCallback((goals: ProtocolCategory[]) => {
    setData((prev) => ({ ...prev, goals }));
  }, []);

  const setExperience = useCallback((experience: ExperienceLevel) => {
    setData((prev) => ({ ...prev, experience }));
  }, []);

  const setTimeMinutes = useCallback((time_minutes: number) => {
    setData((prev) => ({ ...prev, time_minutes }));
  }, []);

  const nextStep = useCallback(() => {
    setStep((prev) => (prev < 4 ? ((prev + 1) as OnboardingStep) : prev));
  }, []);

  const prevStep = useCallback(() => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as OnboardingStep) : prev));
  }, []);

  const goToStep = useCallback((newStep: OnboardingStep) => {
    setStep(newStep);
  }, []);

  const canProceed = useCallback(() => {
    switch (step) {
      case 1:
        return data.goals.length >= 1 && data.goals.length <= 2;
      case 2:
        return data.experience !== null;
      case 3:
        return data.time_minutes >= 15;
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, data]);

  return (
    <WizardContext.Provider
      value={{
        step,
        data,
        isLoading,
        setGoals,
        setExperience,
        setTimeMinutes,
        nextStep,
        prevStep,
        goToStep,
        canProceed,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within OnboardingWizardProvider");
  }
  return context;
}

export function clearOnboardingStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
