"use server";

import { createClient, createAdminClient } from "@myprotocolstack/database/server";
import { revalidatePath } from "next/cache";

// Validation constants
const USERNAME_REGEX = /^[a-z0-9_-]{3,50}$/;
const TWITTER_HANDLE_REGEX = /^[a-zA-Z0-9_]{1,15}$/;
const VALID_URL_PROTOCOLS = ["http:", "https:"];
const MAX_BIO_LENGTH = 200;

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  is_public?: boolean;
  social_links?: {
    twitter?: string;
    website?: string;
  };
}

// URL validation to prevent XSS via javascript: protocol
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return VALID_URL_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

export async function updateProfile(input: UpdateProfileInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // Validate username if provided
    if (input.username) {
      if (!USERNAME_REGEX.test(input.username)) {
        return {
          success: false,
          error: "Username must be 3-50 characters, lowercase, numbers, _ or -",
        };
      }
    }

    // Validate bio length
    if (input.bio && input.bio.length > MAX_BIO_LENGTH) {
      return {
        success: false,
        error: `Bio must be ${MAX_BIO_LENGTH} characters or less`,
      };
    }

    // Validate social links
    if (input.social_links?.twitter) {
      if (!TWITTER_HANDLE_REGEX.test(input.social_links.twitter)) {
        return {
          success: false,
          error: "Invalid Twitter handle format",
        };
      }
    }
    if (input.social_links?.website) {
      if (!isValidUrl(input.social_links.website)) {
        return {
          success: false,
          error: "Invalid website URL (must start with http:// or https://)",
        };
      }
    }

    // Prepare update data
    const updateData = {
      is_public: input.is_public,
      bio: input.bio || null,
      social_links: input.social_links
        ? {
            twitter: input.social_links.twitter || undefined,
            website: input.social_links.website || undefined,
          }
        : undefined,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    if (input.username) {
      updateData.username = input.username;
    }

    // Use DB constraint for username uniqueness (avoids TOCTOU race condition)
    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      // Handle unique constraint violation (username taken)
      if (error.code === "23505") {
        return { success: false, error: "Username already taken" };
      }
      console.error("Profile update error:", { code: error.code, message: error.message });
      return { success: false, error: "Failed to update profile" };
    }

    revalidatePath("/settings");
    if (input.username) {
      revalidatePath(`/profile/${input.username}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  // Use shared validation constant
  if (!USERNAME_REGEX.test(username)) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user?.id || "")
    .single();

  return !data;
}

export async function updateStackVisibility(stackId: string, isPublic: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // Verify ownership
    const { data: stack } = await supabase
      .from("stacks")
      .select("user_id")
      .eq("id", stackId)
      .single();

    if (!stack || stack.user_id !== user.id) {
      return { success: false, error: "Stack not found" };
    }

    const { error } = await supabase
      .from("stacks")
      .update({ is_public: isPublic })
      .eq("id", stackId);

    if (error) {
      return { success: false, error: "Failed to update stack" };
    }

    revalidatePath("/stacks");
    revalidatePath("/settings");

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export interface PublicProfile {
  id: string;
  full_name: string | null;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  social_links: { twitter?: string; website?: string } | null;
  created_at: string;
}

export interface PublicStack {
  id: string;
  name: string;
  description: string | null;
  view_count: number;
  created_at: string;
  protocol_ids: string[];
  protocols: { id: string; name: string; category: string }[];
}

export async function getPublicProfile(username: string) {
  // Use admin client to bypass RLS for public profile reads
  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, username, bio, avatar_url, social_links, created_at, is_public")
    .eq("username", username)
    .eq("is_public", true)
    .single();

  if (!profile) return null;

  // Get public stacks only (is_public = true filter enforced)
  // Note: stacks use protocol_ids array, not a junction table
  const { data: stacks } = await supabase
    .from("stacks")
    .select("id, name, description, is_public, view_count, created_at, protocol_ids")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  // Get all protocol IDs from all stacks
  const allProtocolIds = [...new Set((stacks || []).flatMap((s) => s.protocol_ids || []))];

  // Fetch protocol details
  let protocolsMap: Record<string, { id: string; name: string; category: string }> = {};
  if (allProtocolIds.length > 0) {
    const { data: protocols } = await supabase
      .from("protocols")
      .select("id, name, category")
      .in("id", allProtocolIds);

    protocolsMap = (protocols || []).reduce((acc, p) => {
      acc[p.id] = { id: p.id, name: p.name, category: p.category };
      return acc;
    }, {} as Record<string, { id: string; name: string; category: string }>);
  }

  // Map stacks to proper format
  const mappedStacks: PublicStack[] = (stacks || []).map((stack) => ({
    id: stack.id,
    name: stack.name,
    description: stack.description,
    view_count: stack.view_count ?? 0,
    created_at: stack.created_at,
    protocol_ids: stack.protocol_ids || [],
    protocols: (stack.protocol_ids || [])
      .map((pid: string) => protocolsMap[pid])
      .filter(Boolean),
  }));

  return {
    profile: {
      id: profile.id,
      full_name: profile.name,
      username: profile.username!,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      social_links: profile.social_links as { twitter?: string; website?: string } | null,
      created_at: profile.created_at,
    } as PublicProfile,
    stacks: mappedStacks,
  };
}

export async function incrementStackViewCount(stackId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_view_count", { stack_id: stackId });
}

export async function getProfileForSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, bio, is_public, social_links")
    .eq("id", user.id)
    .single();

  return profile;
}
