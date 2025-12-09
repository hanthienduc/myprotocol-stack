import { z } from "zod";

export const categories = ["sleep", "focus", "energy", "fitness"] as const;
export const experienceLevels = ["beginner", "intermediate", "advanced"] as const;
export const timeOptions = [15, 30, 45, 60] as const;

export const goalsSchema = z.object({
  goals: z
    .array(z.enum(categories))
    .min(1, "Select at least one goal")
    .max(2, "Select up to 2 goals"),
});

export const experienceSchema = z.object({
  experience: z.enum(experienceLevels),
});

export const timeSchema = z.object({
  time_minutes: z
    .number()
    .min(15, "Minimum 15 minutes")
    .max(240, "Maximum 240 minutes"),
});

export const fullOnboardingSchema = z.object({
  goals: z
    .array(z.enum(categories))
    .min(1, "Select at least one goal")
    .max(2, "Select up to 2 goals"),
  experience: z.enum(experienceLevels),
  time_minutes: z.number().min(15).max(240),
});

export type GoalsFormData = z.infer<typeof goalsSchema>;
export type ExperienceFormData = z.infer<typeof experienceSchema>;
export type TimeFormData = z.infer<typeof timeSchema>;
export type FullOnboardingData = z.infer<typeof fullOnboardingSchema>;
