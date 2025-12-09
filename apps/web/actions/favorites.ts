"use server";

import { createClient } from "@myprotocolstack/database/server";
import { revalidatePath } from "next/cache";

interface ToggleFavoriteResult {
  success: boolean;
  isFavorite: boolean;
  error?: string;
}

export async function toggleFavorite(protocolId: string): Promise<ToggleFavoriteResult> {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, isFavorite: false, error: "Unauthorized" };
    }

    // Validate protocolId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(protocolId)) {
      return { success: false, isFavorite: false, error: "Invalid protocol ID" };
    }

    // Verify protocol exists
    const { data: protocol, error: protocolError } = await supabase
      .from("protocols")
      .select("id")
      .eq("id", protocolId)
      .single();

    if (protocolError || !protocol) {
      return { success: false, isFavorite: false, error: "Protocol not found" };
    }

    // Get current favorites
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("favorite_protocol_ids")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return { success: false, isFavorite: false, error: "Failed to fetch profile" };
    }

    const currentFavorites: string[] = profile?.favorite_protocol_ids || [];
    const isFavorited = currentFavorites.includes(protocolId);

    // Toggle: add if not present, remove if present
    const newFavorites = isFavorited
      ? currentFavorites.filter((id) => id !== protocolId)
      : [...currentFavorites, protocolId];

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        favorite_protocol_ids: newFavorites,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, isFavorite: isFavorited, error: "Failed to update favorites" };
    }

    // Revalidate paths where favorites appear
    revalidatePath("/protocols");
    revalidatePath("/stacks");
    revalidatePath("/today");

    return { success: true, isFavorite: !isFavorited };
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return { success: false, isFavorite: false, error: "Something went wrong" };
  }
}

export async function getFavorites(): Promise<string[]> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("favorite_protocol_ids")
      .eq("id", user.id)
      .single();

    return profile?.favorite_protocol_ids || [];
  } catch {
    return [];
  }
}
