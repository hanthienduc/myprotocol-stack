"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Button,
  Input,
} from "@myprotocolstack/ui";
import { toast } from "sonner";
import {
  updateNotificationPreferences,
  type NotificationPreferencesInput,
} from "@/actions/notification-preferences";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import type { NotificationPreferences } from "@myprotocolstack/database";

interface NotificationSettingsProps {
  initialPreferences: NotificationPreferences | null;
}

// Common timezones for dropdown
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;

export function NotificationSettings({ initialPreferences }: NotificationSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const push = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferencesInput>({
    email_daily_reminder: initialPreferences?.email_daily_reminder ?? true,
    email_weekly_summary: initialPreferences?.email_weekly_summary ?? true,
    email_streak_alerts: initialPreferences?.email_streak_alerts ?? true,
    push_enabled: initialPreferences?.push_enabled ?? false,
    push_daily_reminder: initialPreferences?.push_daily_reminder ?? false,
    push_streak_alerts: initialPreferences?.push_streak_alerts ?? true,
    reminder_time: initialPreferences?.reminder_time ?? "09:00",
    timezone: initialPreferences?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Sync push subscription state with preferences
  useEffect(() => {
    if (!push.isLoading) {
      setPreferences((prev) => ({ ...prev, push_enabled: push.isSubscribed }));
    }
  }, [push.isSubscribed, push.isLoading]);

  const handleToggle = (key: keyof NotificationPreferencesInput, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await push.subscribe();
      if (success) {
        handleToggle("push_enabled", true);
        toast.success("Push notifications enabled");
      } else if (push.error) {
        toast.error(push.error);
      }
    } else {
      const success = await push.unsubscribe();
      if (success) {
        handleToggle("push_enabled", false);
        toast.success("Push notifications disabled");
      } else if (push.error) {
        toast.error(push.error);
      }
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateNotificationPreferences(preferences);
      if (result.success) {
        toast.success("Notification preferences saved");
      } else {
        toast.error(result.error || "Failed to save preferences");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Configure how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Email Notifications</h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Daily Reminder</label>
              <p className="text-xs text-muted-foreground">
                Receive a daily email reminder to complete your protocols
              </p>
            </div>
            <Switch
              checked={preferences.email_daily_reminder}
              onCheckedChange={(checked: boolean) => handleToggle("email_daily_reminder", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Weekly Summary</label>
              <p className="text-xs text-muted-foreground">
                Get a weekly summary of your progress and achievements
              </p>
            </div>
            <Switch
              checked={preferences.email_weekly_summary}
              onCheckedChange={(checked: boolean) => handleToggle("email_weekly_summary", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Streak Alerts</label>
              <p className="text-xs text-muted-foreground">
                Get notified when your streak is at risk
              </p>
            </div>
            <Switch
              checked={preferences.email_streak_alerts}
              onCheckedChange={(checked: boolean) => handleToggle("email_streak_alerts", checked)}
            />
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium">Push Notifications</h4>

          {!push.isSupported ? (
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported in your browser.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Enable Push</label>
                  <p className="text-xs text-muted-foreground">
                    {push.permission === "denied"
                      ? "Permission denied. Enable in browser settings."
                      : "Receive browser push notifications"}
                  </p>
                </div>
                <Switch
                  checked={preferences.push_enabled}
                  onCheckedChange={handlePushToggle}
                  disabled={push.isLoading || push.permission === "denied"}
                />
              </div>

              {preferences.push_enabled && (
                <>
                  <div className="flex items-center justify-between pl-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Daily Reminder</label>
                      <p className="text-xs text-muted-foreground">
                        Push notification for daily protocols
                      </p>
                    </div>
                    <Switch
                      checked={preferences.push_daily_reminder}
                      onCheckedChange={(checked: boolean) => handleToggle("push_daily_reminder", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pl-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Streak Alerts</label>
                      <p className="text-xs text-muted-foreground">
                        Push notification when streak at risk
                      </p>
                    </div>
                    <Switch
                      checked={preferences.push_streak_alerts}
                      onCheckedChange={(checked: boolean) => handleToggle("push_streak_alerts", checked)}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Timing Settings */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium">Timing</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reminder Time</label>
              <Input
                type="time"
                value={preferences.reminder_time}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, reminder_time: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={preferences.timezone}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, timezone: e.target.value }))
                }
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
