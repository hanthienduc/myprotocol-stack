"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@myprotocolstack/ui";
import { Crown, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createPortalSession } from "@/actions/subscription";
import { PricingModal } from "./pricing-modal";

interface SubscriptionCardProps {
  tier: "free" | "pro";
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export function SubscriptionCard({
  tier,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const isPro = tier === "pro";

  const handleManageSubscription = async () => {
    setLoading(true);
    const { url, error } = await createPortalSession();

    if (error || !url) {
      toast.error(error || "Failed to open billing portal");
      setLoading(false);
      return;
    }

    window.location.href = url;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown
                  className={`h-5 w-5 ${isPro ? "text-yellow-500" : "text-muted-foreground"}`}
                />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </div>
            <Badge variant={isPro ? "default" : "secondary"}>
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPro ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You have access to all Pro features:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Unlimited stacks</li>
                  <li>✓ Full protocol library</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Unlimited history</li>
                </ul>
              </div>

              {currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  {cancelAtPeriodEnd ? (
                    <>
                      Your subscription will end on{" "}
                      <span className="font-medium">
                        {formatDate(currentPeriodEnd)}
                      </span>
                    </>
                  ) : (
                    <>
                      Next billing date:{" "}
                      <span className="font-medium">
                        {formatDate(currentPeriodEnd)}
                      </span>
                    </>
                  )}
                </p>
              )}

              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You&apos;re on the Free plan. Upgrade to Pro for:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>→ Unlimited stacks (currently limited to 3)</li>
                  <li>→ Full protocol library</li>
                  <li>→ Advanced analytics & insights</li>
                  <li>→ Unlimited tracking history</li>
                </ul>
              </div>

              <Button onClick={() => setShowPricing(true)}>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <PricingModal open={showPricing} onOpenChange={setShowPricing} />
    </>
  );
}
