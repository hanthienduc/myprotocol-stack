import { createClient } from "@myprotocolstack/database/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@myprotocolstack/ui";
import { Badge } from "@myprotocolstack/ui";
import type { Profile } from "@myprotocolstack/database";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { RetakeQuizSettings } from "@/components/settings/retake-quiz-settings";
import { getNotificationPreferences } from "@/actions/notification-preferences";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get profile and notification preferences in parallel
  const [profileResult, notificationPreferences] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getNotificationPreferences(),
  ]);

  const profile = profileResult.data as Profile | null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <p>{user.user_metadata?.name || "Not set"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p>{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Account created
            </label>
            <p>
              {new Date(user.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Preferences / Retake Quiz */}
      <RetakeQuizSettings />

      {/* Notifications */}
      <NotificationSettings initialPreferences={notificationPreferences} />

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free Plan</p>
              <p className="text-sm text-muted-foreground">
                3 protocol stacks, basic tracking
              </p>
            </div>
            <Badge variant={profile?.subscription_tier === "pro" ? "default" : "secondary"}>
              {profile?.subscription_tier === "pro" ? "Pro" : "Free"}
            </Badge>
          </div>
          {profile?.subscription_tier !== "pro" && (
            <div className="rounded-lg border border-dashed p-4">
              <h4 className="font-medium">Upgrade to Pro</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Unlimited stacks, advanced analytics, AI recommendations, and more.
              </p>
              <p className="text-lg font-bold mt-2">$9.99/month</p>
              <p className="text-xs text-muted-foreground mt-1">
                Coming soon
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Export or delete your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Data export and account deletion coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
