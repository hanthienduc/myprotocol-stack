"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@myprotocolstack/database/client";
import { DropdownMenuItem } from "@myprotocolstack/ui";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
      Sign out
    </DropdownMenuItem>
  );
}
