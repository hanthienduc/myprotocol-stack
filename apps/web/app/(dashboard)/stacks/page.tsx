import Link from "next/link";
import { createClient } from "@myprotocolstack/database/server";
import { Button } from "@myprotocolstack/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@myprotocolstack/ui";
import { Badge } from "@myprotocolstack/ui";
import type { Stack, Protocol } from "@myprotocolstack/database";
import { StackLimitBanner } from "@/components/subscription";

export default async function StacksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's stacks
  const { data: stacksData } = await supabase
    .from("stacks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const stacks = (stacksData || []) as Stack[];

  // Get all protocol IDs from stacks
  const allProtocolIds = stacks.flatMap((s) => s.protocol_ids);
  const uniqueProtocolIds = [...new Set(allProtocolIds)];

  // Fetch protocols
  const { data: protocolsData } = uniqueProtocolIds.length
    ? await supabase.from("protocols").select("*").in("id", uniqueProtocolIds)
    : { data: [] };

  const protocols = (protocolsData || []) as Protocol[];
  const protocolMap = new Map(protocols.map((p) => [p.id, p]));

  const scheduleLabels: Record<string, string> = {
    daily: "Every day",
    weekdays: "Weekdays",
    weekends: "Weekends",
    custom: "Custom days",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Stacks</h1>
          <p className="text-muted-foreground mt-1">
            Manage your protocol combinations
          </p>
        </div>
        <Link href="/stacks/new">
          <Button>Create Stack</Button>
        </Link>
      </div>

      {/* Show banner if user is at stack limit */}
      <StackLimitBanner />

      {!stacks || stacks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">No stacks yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first protocol stack to start optimizing your daily routine.
            </p>
            <Link href="/stacks/new">
              <Button>Create Your First Stack</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stacks.map((stack) => {
            const stackProtocols = stack.protocol_ids
              .map((id) => protocolMap.get(id))
              .filter(Boolean);

            return (
              <Link key={stack.id} href={`/stacks/${stack.id}`}>
                <Card className="h-full cursor-pointer transition-colors hover:border-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{stack.name}</CardTitle>
                      <Badge variant={stack.is_active ? "default" : "secondary"}>
                        {stack.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {stack.description && (
                      <CardDescription className="line-clamp-2">
                        {stack.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{stackProtocols.length} protocols</span>
                        <span>•</span>
                        <span>{scheduleLabels[stack.schedule]}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {stackProtocols.slice(0, 3).map((protocol) => (
                          <Badge key={protocol!.id} variant="outline" className="text-xs">
                            {protocol!.name}
                          </Badge>
                        ))}
                        {stackProtocols.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{stackProtocols.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
