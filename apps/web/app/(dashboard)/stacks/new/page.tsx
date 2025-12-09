import { createClient } from "@myprotocolstack/database/server";
import { StackBuilder } from "@/components/stacks/stack-builder";

export default async function NewStackPage() {
  const supabase = await createClient();

  // Fetch all protocols
  const { data: protocols } = await supabase
    .from("protocols")
    .select("*")
    .order("category")
    .order("name");

  // Fetch user favorites
  let favoriteIds: string[] = [];
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("favorite_protocol_ids")
      .eq("id", user.id)
      .single();
    favoriteIds = profile?.favorite_protocol_ids || [];
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Stack</h1>
        <p className="text-muted-foreground mt-1">
          Combine protocols into a daily routine
        </p>
      </div>

      <StackBuilder protocols={protocols || []} favoriteIds={favoriteIds} />
    </div>
  );
}
