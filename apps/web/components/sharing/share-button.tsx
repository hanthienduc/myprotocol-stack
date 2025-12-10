"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@myprotocolstack/ui";
import { toast } from "sonner";
import { ShareDialog } from "./share-dialog";
import { buildShareUrl } from "@/lib/sharing/utm";

interface ShareButtonProps {
  title: string;
  description: string;
  url: string;
  referralCode?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function ShareButton({
  title,
  description,
  url,
  referralCode,
  variant = "outline",
  size = "default",
  className,
  showLabel = true,
}: ShareButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const getShareUrl = (source: string) => {
    return buildShareUrl(
      url,
      {
        source,
        medium: "social",
        campaign: "share",
      },
      referralCode
    );
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl("native");

    // Try Web Share API first (mobile/modern browsers)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
        return;
      } catch (error) {
        // User cancelled or error - fall through to dialog
        if ((error as Error).name === "AbortError") {
          return; // User cancelled, don't show fallback
        }
      }
    }

    // Fallback: show share dialog
    setShowDialog(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleShare}
        className={className}
        aria-label="Share"
      >
        <Share2 className={showLabel ? "h-4 w-4 mr-2" : "h-4 w-4"} />
        {showLabel && "Share"}
      </Button>

      <ShareDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={title}
        description={description}
        url={url}
        referralCode={referralCode}
      />
    </>
  );
}
