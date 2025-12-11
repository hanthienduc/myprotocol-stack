"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Switch,
  Textarea,
} from "@myprotocolstack/ui";
import { toast } from "sonner";
import { updateProfile, checkUsernameAvailability } from "@/actions/profile";
import { Globe, Lock, Check, X } from "lucide-react";

interface PrivacySettingsProps {
  initialData: {
    username: string | null;
    bio: string | null;
    is_public: boolean;
    social_links: { twitter?: string; website?: string } | null;
  };
}

export function PrivacySettings({ initialData }: PrivacySettingsProps) {
  const [username, setUsername] = useState(initialData.username || "");
  const [bio, setBio] = useState(initialData.bio || "");
  const [isPublic, setIsPublic] = useState(initialData.is_public);
  const [twitter, setTwitter] = useState(
    initialData.social_links?.twitter || ""
  );
  const [website, setWebsite] = useState(
    initialData.social_links?.website || ""
  );

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // AbortController to prevent race conditions
    const controller = new AbortController();
    let isCancelled = false;

    const timeout = setTimeout(async () => {
      if (isCancelled) return;
      setCheckingUsername(true);
      try {
        const available = await checkUsernameAvailability(username);
        if (!isCancelled) {
          setUsernameAvailable(available);
        }
      } finally {
        if (!isCancelled) {
          setCheckingUsername(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      isCancelled = true;
      controller.abort();
    };
  }, [username]);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(sanitized);
  };

  const handleSave = async () => {
    setSaving(true);

    const result = await updateProfile({
      username: username || undefined,
      bio: bio || undefined,
      is_public: isPublic,
      social_links: {
        twitter: twitter || undefined,
        website: website || undefined,
      },
    });

    if (result.success) {
      toast.success("Profile updated!");
    } else {
      toast.error(result.error || "Failed to update profile");
    }

    setSaving(false);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://protocolstack.app";
  const profileUrl = username ? `${baseUrl}/profile/${username}` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPublic ? (
            <Globe className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
          Public Profile
        </CardTitle>
        <CardDescription>
          Control your profile visibility and share your stacks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Public Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Make profile public</Label>
            <p className="text-sm text-muted-foreground">
              Allow others to view your profile and public stacks
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="your-username"
              className="pr-10"
            />
            {username.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername ? (
                  <span className="text-xs text-muted-foreground">...</span>
                ) : usernameAvailable ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          {profileUrl && isPublic && (
            <p className="text-xs text-muted-foreground">
              Your profile: {profileUrl}
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about your health journey..."
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">
            {bio.length}/200
          </p>
        </div>

        {/* Social Links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value.replace("@", ""))}
              placeholder="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
