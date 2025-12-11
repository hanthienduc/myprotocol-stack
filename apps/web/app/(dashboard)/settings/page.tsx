import { createClient } from "@myprotocolstack/database/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@myprotocolstack/ui";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { RetakeQuizSettings } from "@/components/settings/retake-quiz-settings";
import { PrivacySettings } from "@/components/settings/privacy-settings";
import { SubscriptionCard } from "@/components/subscription/subscription-card";
import { getNotificationPreferences } from "@/actions/notification-preferences";
import { getProfileForSettings } from "@/actions/profile";
import { getSubscriptionStatus } from "@/actions/subscription";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get notification preferences, privacy settings, and subscription in parallel
  const [notificationPreferences, privacyProfile, subscriptionStatus] = await Promise.all([
    getNotificationPreferences(),
    getProfileForSettings(),
    getSubscriptionStatus(),
  ]);

  const privacyData = {
    username: privacyProfile?.username || null,
    bio: privacyProfile?.bio || null,
    is_public: privacyProfile?.is_public || false,
    social_links: privacyProfile?.social_links as { twitter?: string; website?: string } | null,
  };

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

      {/* Public Profile / Privacy Settings */}
      <PrivacySettings initialData={privacyData} />

      {/* Notifications */}
      <NotificationSettings initialPreferences={notificationPreferences} />

      {/* Subscription */}
      <SubscriptionCard
        tier={subscriptionStatus.tier}
        currentPeriodEnd={subscriptionStatus.currentPeriodEnd}
        cancelAtPeriodEnd={subscriptionStatus.cancelAtPeriodEnd}
      />

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
