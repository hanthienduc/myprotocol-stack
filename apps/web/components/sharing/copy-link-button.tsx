"use client";

import { useState } from "react";
import { Button } from "@myprotocolstack/ui";
import { Link, Check } from "lucide-react";
import { toast } from "sonner";
import { buildShareUrl } from "@/lib/sharing/utm";

interface CopyLinkButtonProps {
  url: string;
  referralCode?: string;
  source?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function CopyLinkButton({
  url,
  referralCode,
  source = "copy",
  variant = "ghost",
  size = "sm",
  className,
  showLabel = true,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // SSR safety check
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard not available");
      return;
    }

    const shareUrl = buildShareUrl(
      url,
      {
        source,
        medium: "social",
        campaign: "copy_link",
      },
      referralCode
    );

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
      aria-label={copied ? "Link copied" : "Copy link"}
    >
      {copied ? (
        <>
          <Check className={showLabel ? "h-4 w-4 mr-2" : "h-4 w-4"} />
          {showLabel && "Copied!"}
        </>
      ) : (
        <>
          <Link className={showLabel ? "h-4 w-4 mr-2" : "h-4 w-4"} />
          {showLabel && "Copy Link"}
        </>
      )}
    </Button>
  );
}
