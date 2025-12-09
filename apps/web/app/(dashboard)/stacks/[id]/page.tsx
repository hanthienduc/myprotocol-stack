import { notFound } from "next/navigation";
import { createClient } from "@myprotocolstack/database/server";
import { StackBuilder } from "@/components/stacks/stack-builder";
import { DeleteStackButton } from "@/components/stacks/delete-stack-button";
import type { Stack, Protocol } from "@myprotocolstack/database";

interface StackPageProps {
  params: Promise<{ id: string }>;
}

export default async function StackPage({ params }: StackPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get the stack
  const { data: stackData } = await supabase
    .from("stacks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const stack = stackData as Stack | null;

  if (!stack) {
    notFound();
  }

  // Fetch all protocols
  const { data: protocolsData } = await supabase
    .from("protocols")
    .select("*")
    .order("category")
    .order("name");

  const protocols = (protocolsData || []) as Protocol[];

  // Fetch user favorites
  const { data: profile } = await supabase
    .from("profiles")
    .select("favorite_protocol_ids")
    .eq("id", user.id)
    .single();
  const favoriteIds = profile?.favorite_protocol_ids || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Stack</h1>
          <p className="text-muted-foreground mt-1">
            Update your protocol combination
          </p>
        </div>
        <DeleteStackButton stackId={stack.id} stackName={stack.name} />
      </div>

      <StackBuilder protocols={protocols} favoriteIds={favoriteIds} initialStack={stack} />
    </div>
  );
}
