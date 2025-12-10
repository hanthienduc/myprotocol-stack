"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@myprotocolstack/ui";
import { Label } from "@myprotocolstack/ui";
import { Textarea } from "@myprotocolstack/ui";
import { Calendar, Eye, ExternalLink, Copy, Flag, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { PublicProfile as ProfileType, PublicStack, ReportReason } from "@/actions/profile";
import { cloneStack, reportContent } from "@/actions/profile";

interface PublicProfileProps {
  profile: ProfileType;
  stacks: PublicStack[];
}

export function PublicProfile({ profile, stacks }: PublicProfileProps) {
  const [showProfileReport, setShowProfileReport] = useState(false);

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {profile.full_name || profile.username}
              </h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
            <ReportDialog
              contentType="profile"
              contentId={profile.id}
              contentName={profile.full_name || profile.username}
              open={showProfileReport}
              onOpenChange={setShowProfileReport}
            />
          </div>

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
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const categories = [
    ...new Set(stack.protocols.map((p) => p.category)),
  ];

  const handleClone = async () => {
    setIsCloning(true);
    const result = await cloneStack(stack.id);
    setIsCloning(false);

    if (result.success) {
      toast.success("Stack cloned to your account!");
      router.push("/stacks");
    } else {
      toast.error(result.error || "Failed to clone stack");
    }
  };

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
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {stack.view_count}
            </span>
          </div>
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
        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleClone}
            disabled={isCloning}
          >
            <Copy className="h-3 w-3 mr-1" />
            {isCloning ? "Cloning..." : "Clone"}
          </Button>
          <ReportDialog
            contentType="stack"
            contentId={stack.id}
            contentName={stack.name}
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
          />
        </div>
      </CardHeader>
    </Card>
  );
}

// Report dialog component
const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam or promotional" },
  { value: "misleading", label: "Misleading information" },
  { value: "copyright", label: "Copyright violation" },
  { value: "other", label: "Other" },
];

function ReportDialog({
  contentType,
  contentId,
  contentName,
  open,
  onOpenChange,
}: {
  contentType: "profile" | "stack";
  contentId: string;
  contentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await reportContent({
      content_type: contentType,
      content_id: contentId,
      reason,
      details: details.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Report submitted. Thank you for helping keep the community safe.");
      onOpenChange(false);
      setDetails("");
    } else {
      toast.error(result.error || "Failed to submit report");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2">
          <Flag className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Report &quot;{contentName}&quot; for review by our team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                    reason === r.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="sr-only"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context about the issue..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {details.length}/500
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
