import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@myprotocolstack/ui";
import { Calendar, Eye, ExternalLink } from "lucide-react";
import type { PublicProfile as ProfileType, PublicStack } from "@/actions/profile";

interface PublicProfileProps {
  profile: ProfileType;
  stacks: PublicStack[];
}

export function PublicProfile({ profile, stacks }: PublicProfileProps) {
  const initials = (profile.full_name || profile.username)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-muted-foreground">@{profile.username}</p>

          {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined{" "}
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
            {profile.social_links?.twitter && (
              <a
                href={`https://twitter.com/${profile.social_links.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                @{profile.social_links.twitter}
              </a>
            )}
            {profile.social_links?.website && (
              <a
                href={profile.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Public Stacks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Public Stacks ({stacks.length})
        </h2>

        {stacks.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No public stacks yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {stacks.map((stack) => (
              <PublicStackCard key={stack.id} stack={stack} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PublicStackCard({ stack }: { stack: PublicStack }) {
  const categories = [
    ...new Set(stack.protocols.map((p) => p.category)),
  ];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="capitalize text-xs">
                {cat}
              </Badge>
            ))}
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            {stack.view_count}
          </span>
        </div>
        <div>
          <CardTitle className="text-lg">{stack.name}</CardTitle>
          {stack.description && (
            <CardDescription className="line-clamp-2 mt-1">
              {stack.description}
            </CardDescription>
          )}
        </div>
        {/* Protocol list */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {stack.protocols.length} protocol{stack.protocols.length !== 1 ? "s" : ""}:
          </p>
          <div className="flex flex-wrap gap-1">
            {stack.protocols.slice(0, 5).map((protocol) => (
              <span
                key={protocol.id}
                className="text-xs bg-muted px-2 py-0.5 rounded-full"
              >
                {protocol.name}
              </span>
            ))}
            {stack.protocols.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{stack.protocols.length - 5} more
              </span>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
