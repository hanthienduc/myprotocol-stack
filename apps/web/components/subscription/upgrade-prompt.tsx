"use client";

import { useState } from "react";
import { Button } from "@myprotocolstack/ui";
import { Crown, Lock, ArrowRight } from "lucide-react";
import { PricingModal } from "./pricing-modal";

interface UpgradePromptProps {
  feature?: string;
  message?: string;
  variant?: "inline" | "card";
  showPricing?: boolean;
}

export function UpgradePrompt({
  feature,
  message,
  variant = "inline",
  showPricing = true,
}: UpgradePromptProps) {
  const [showModal, setShowModal] = useState(false);

  const defaultMessage = feature
    ? `Upgrade to Pro to unlock ${feature}`
    : "Upgrade to Pro for unlimited access";

  if (variant === "inline") {
    return (
      <>
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
            {message || defaultMessage}
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
            <Crown className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </div>
        <PricingModal open={showModal} onOpenChange={setShowModal} />
      </>
    );
  }

  // Card variant
  return (
    <>
      <div className="border rounded-lg p-6 text-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 mb-4">
          <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
        <p className="text-muted-foreground mb-4">{message || defaultMessage}</p>
        {showPricing && (
          <p className="text-2xl font-bold mb-4">
            $12
            <span className="text-sm font-normal text-muted-foreground">
              /mo
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              or $99/yr
            </span>
          </p>
        )}
        <Button onClick={() => setShowModal(true)}>
          Upgrade Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      <PricingModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
