"use server";

import { createClient } from "@myprotocolstack/database/server";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function savePushSubscription(
  subscription: PushSubscriptionInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Upsert subscription (one per endpoint per user)
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      keys_p256dh: subscription.keys.p256dh,
      keys_auth: subscription.keys.auth,
    },
    {
      onConflict: "endpoint",
    }
  );

  if (error) {
    console.error("[Push] savePushSubscription error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removePushSubscription(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("[Push] removePushSubscription error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getPushSubscriptions(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint")
    .eq("user_id", user.id);

  if (error) {
    console.error("[Push] getPushSubscriptions error:", error.message);
    return [];
  }

  return data.map((row) => row.endpoint);
}
