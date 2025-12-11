"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
} from "@myprotocolstack/ui";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/subscription";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    "annual"
  );

  const handleCheckout = async (priceType: "monthly" | "annual") => {
    setLoading(priceType);

    const { url, error } = await createCheckoutSession(priceType);

    if (error || !url) {
      toast.error(error || "Failed to start checkout");
      setLoading(null);
      return;
    }

    window.location.href = url;
  };

  const features = [
    "Unlimited stacks",
    "Full protocol library (30+ protocols)",
    "Advanced analytics dashboard",
    "Unlimited tracking history",
    "Day-of-week insights",
    "Category breakdowns",
    "Priority support",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            Unlock all features and take your health optimization to the next
            level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Toggle */}
          <div className="flex justify-center gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedPlan === "monthly"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan("annual")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors relative ${
                selectedPlan === "annual"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              Annual
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Save 17%
              </Badge>
            </button>
          </div>

          {/* Pricing */}
          <div className="text-center">
            {selectedPlan === "monthly" ? (
              <div>
                <span className="text-4xl font-bold">$12</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            ) : (
              <div>
                <span className="text-4xl font-bold">$99</span>
                <span className="text-muted-foreground">/year</span>
                <p className="text-sm text-muted-foreground mt-1">
                  That&apos;s just $8.25/month
                </p>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="space-y-3">
            <p className="font-medium text-sm">Everything in Free, plus:</p>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => handleCheckout(selectedPlan)}
            disabled={loading !== null}
          >
            {loading === selectedPlan ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Start Pro ${selectedPlan === "annual" ? "Annual" : "Monthly"}`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
