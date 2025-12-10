import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
} from "@myprotocolstack/ui";
import { Eye } from "lucide-react";
import type { FeaturedProfile } from "@/actions/profile";

interface FeaturedProfilesProps {
  profiles: FeaturedProfile[];
}

export function FeaturedProfiles({ profiles }: FeaturedProfilesProps) {
  if (profiles.length === 0) return null;

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Featured Stack Builders</h2>
          <p className="mt-2 text-muted-foreground">
            Discover stacks created by our community
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <FeaturedProfileCard key={profile.id} profile={profile} />
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Want to be featured?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Create your public profile
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function FeaturedProfileCard({ profile }: { profile: FeaturedProfile }) {
  const initials = (profile.name || profile.username)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/profile/${profile.username}`}>
      <Card className="hover:shadow-md transition-all hover:border-primary/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {profile.name || profile.username}
              </h3>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>

              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{profile.stack_count} public stack{profile.stack_count !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {profile.total_views} views
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
