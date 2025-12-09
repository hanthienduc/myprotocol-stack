"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@myprotocolstack/database/server";
import type { NotificationPreferences } from "@myprotocolstack/database";

export type NotificationPreferencesInput = {
  email_daily_reminder: boolean;
  email_weekly_summary: boolean;
  email_streak_alerts: boolean;
  push_enabled: boolean;
  push_daily_reminder: boolean;
  push_streak_alerts: boolean;
  reminder_time: string;
  timezone: string;
};

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    console.error("[Notifications] getPreferences error:", error.message);
    return null;
  }

  return data as NotificationPreferences | null;
}

export async function updateNotificationPreferences(
  input: NotificationPreferencesInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Upsert: create if not exists, update if exists
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      ...input,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("[Notifications] updatePreferences error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function getOrCreateNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Try to get existing
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return existing as NotificationPreferences;
  }

  // Create default preferences
  const defaultPrefs: NotificationPreferencesInput = {
    email_daily_reminder: true,
    email_weekly_summary: true,
    email_streak_alerts: true,
    push_enabled: false,
    push_daily_reminder: false,
    push_streak_alerts: true,
    reminder_time: "09:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };

  const { data: created, error } = await supabase
    .from("notification_preferences")
    .insert({
      user_id: user.id,
      ...defaultPrefs,
    })
    .select()
    .single();

  if (error) {
    console.error("[Notifications] createPreferences error:", error.message);
    throw new Error("Failed to create notification preferences");
  }

  return created as NotificationPreferences;
}
