import { redirect } from "next/navigation";
import { createClient } from "@myprotocolstack/database/server";
import { OnboardingWizard } from "./_components/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Check if already completed
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/today");
  }

  // Fetch protocols for recommendations
  const { data: protocols } = await supabase
    .from("protocols")
    .select("*")
    .order("category")
    .order("difficulty");

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8">
      <OnboardingWizard protocols={protocols ?? []} />
    </div>
  );
}
