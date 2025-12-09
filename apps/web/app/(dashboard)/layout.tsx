import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@myprotocolstack/database/server";
import { Button } from "@myprotocolstack/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@myprotocolstack/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@myprotocolstack/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initials = user.user_metadata?.name
    ? user.user_metadata.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/today" className="text-xl font-bold">
              MyProtocolStack
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/today">
                <Button variant="ghost">Today</Button>
              </Link>
              <Link href="/protocols">
                <Button variant="ghost">Protocols</Button>
              </Link>
              <Link href="/stacks">
                <Button variant="ghost">My Stacks</Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost">Analytics</Button>
              </Link>
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.name || "User"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.user_metadata?.name && (
                    <p className="font-medium">{user.user_metadata.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SignOutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden border-b">
        <div className="container mx-auto flex justify-around py-2">
          <Link href="/today">
            <Button variant="ghost" size="sm">
              Today
            </Button>
          </Link>
          <Link href="/protocols">
            <Button variant="ghost" size="sm">
              Protocols
            </Button>
          </Link>
          <Link href="/stacks">
            <Button variant="ghost" size="sm">
              Stacks
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              Analytics
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
