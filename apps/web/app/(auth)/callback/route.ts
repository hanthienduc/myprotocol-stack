import { NextResponse } from "next/server";
import { createClient } from "@myprotocolstack/database/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/today";

  const supabase = await createClient();

  // Handle OAuth callback (Google, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  }
  // Handle Magic Link / Email OTP callback
  else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email" | "magiclink",
      token_hash,
    });
    if (error) {
      console.error("Magic link verification error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  } else {
    // No valid auth parameters
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Auth successful - check onboarding status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    // Redirect to onboarding if not completed
    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
