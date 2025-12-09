"use server";

import { createClient } from "@myprotocolstack/database/server";
import { revalidatePath } from "next/cache";
import { fullOnboardingSchema } from "@/lib/schemas/onboarding";
import type { ProtocolCategory, ExperienceLevel } from "@myprotocolstack/database";

interface CompleteOnboardingInput {
  goals: ProtocolCategory[];
  experience: ExperienceLevel;
  time_minutes: number;
  protocol_ids: string[];
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Idempotency check - prevent duplicate submissions
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (existingProfile?.onboarding_completed) {
      return { success: true }; // Already completed, treat as success
    }

    // Validate input
    const validation = fullOnboardingSchema.safeParse({
      goals: input.goals,
      experience: input.experience,
      time_minutes: input.time_minutes,
    });

    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message };
    }

    // Build onboarding profile
    const onboardingProfile = {
      goals: input.goals,
      experience: input.experience,
      time_minutes: input.time_minutes,
      completed_at: new Date().toISOString(),
    };

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_profile: onboardingProfile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return { success: false, error: "Failed to save profile" };
    }

    // Create first stack with recommended protocols
    if (input.protocol_ids.length > 0) {
      const goal1 = input.goals[0] ?? "Health";
      const goal2 = input.goals[1];
      const stackName =
        input.goals.length === 1
          ? `My ${capitalize(goal1)} Stack`
          : `My ${capitalize(goal1)} & ${capitalize(goal2 ?? "")} Stack`;

      const { error: stackError } = await supabase.from("stacks").insert({
        user_id: user.id,
        name: stackName,
        description: "Auto-created from onboarding quiz",
        protocol_ids: input.protocol_ids,
        schedule: "daily",
        is_active: true,
      });

      if (stackError) {
        console.error("Stack creation error:", stackError);
        // Non-critical - continue even if stack creation fails
      }
    }

    revalidatePath("/today");
    revalidatePath("/stacks");

    return { success: true };
  } catch (error) {
    console.error("Onboarding error:", error);
    return { success: false, error: "Something went wrong" };
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
