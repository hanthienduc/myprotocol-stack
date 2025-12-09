import { createClient } from "@myprotocolstack/database/server";
import { TodayView } from "@/components/tracking/today-view";
import { Button } from "@myprotocolstack/ui";
import Link from "next/link";
import type { Stack, Protocol, Tracking, UserStreak } from "@myprotocolstack/database";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's active stacks with protocols
  const { data: stacksData } = await supabase
    .from("stacks")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const stacks = (stacksData || []) as Stack[];

  // Get today's date in ISO format
  const today = new Date().toISOString().split("T")[0] as string;

  // Get today's tracking records
  const { data: trackingData } = await supabase
    .from("tracking")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today);

  const trackingRecords = (trackingData || []) as Tracking[];

  // Get all protocol IDs from stacks
  const allProtocolIds = stacks.flatMap((s) => s.protocol_ids);
  const uniqueProtocolIds = [...new Set(allProtocolIds)];

  // Fetch protocols
  const { data: protocolsData } = uniqueProtocolIds.length
    ? await supabase.from("protocols").select("*").in("id", uniqueProtocolIds)
    : { data: [] };

  const protocols = (protocolsData || []) as Protocol[];

  // Fetch user favorites
  const { data: profile } = await supabase
    .from("profiles")
    .select("favorite_protocol_ids")
    .eq("id", user.id)
    .single();
  const favoriteIds = profile?.favorite_protocol_ids || [];

  // Fetch streak data for user's stacks
  const stackIds = stacks.map((s) => s.id);
  const { data: streakData } = stackIds.length
    ? await supabase.from("user_streaks").select("*").eq("user_id", user.id).in("stack_id", stackIds)
    : { data: [] };

  const streakRecords = (streakData || []) as UserStreak[];

  // Check if user has any stacks
  if (!stacks || stacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h1 className="text-2xl font-bold mb-2">Welcome to MyProtocolStack!</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          You don&apos;t have any protocol stacks yet. Create your first stack
          to start tracking your daily protocols.
        </p>
        <div className="flex gap-4">
          <Link href="/protocols">
            <Button variant="outline">Browse Protocols</Button>
          </Link>
          <Link href="/stacks/new">
            <Button>Create Your First Stack</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Today</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <TodayView
        stacks={stacks}
        protocols={protocols}
        trackingRecords={trackingRecords}
        streakRecords={streakRecords}
        favoriteIds={favoriteIds}
        userId={user.id}
        date={today}
      />
    </div>
  );
}
