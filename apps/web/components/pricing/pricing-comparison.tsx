"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge, Button } from "@myprotocolstack/ui";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/actions/subscription";

interface PricingComparisonProps {
  isLoggedIn?: boolean;
}

const FEATURES = [
  { name: "Stacks", free: "3", pro: "Unlimited" },
  { name: "Protocol Library", free: "30+ protocols", pro: "30+ protocols" },
  { name: "Tracking History", free: "7 days", pro: "Unlimited" },
  { name: "Basic Analytics", free: true, pro: true },
  { name: "Day-of-Week Insights", free: false, pro: true },
  { name: "Category Breakdowns", free: false, pro: true },
  { name: "Priority Support", free: false, pro: true },
];

export function PricingComparison({ isLoggedIn = false }: PricingComparisonProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  const handleGetStarted = async () => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setLoading(true);
    const { url, error } = await createCheckoutSession(billingCycle);

    if (error || !url) {
      toast.error(error || "Failed to start checkout");
      setLoading(false);
      return;
    }

    window.location.href = url;
  };

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-background shadow-sm"
                : "hover:bg-background/50"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors relative ${
              billingCycle === "annual"
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
      </div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="border rounded-xl p-6 bg-card">
          <div className="text-center pb-6 border-b">
            <h3 className="text-xl font-bold">Free</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
            </div>
            <p className="text-muted-foreground mt-2">Forever free</p>
          </div>
          <ul className="mt-6 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.name} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{feature.name}</span>
                {renderValue(feature.free)}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Get Started Free
            </Button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-primary rounded-xl p-6 bg-card relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
            Most Popular
          </Badge>
          <div className="text-center pb-6 border-b">
            <h3 className="text-xl font-bold">Pro</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold">
                {billingCycle === "monthly" ? "$12" : "$99"}
              </span>
              <span className="text-muted-foreground">
                {billingCycle === "monthly" ? "/month" : "/year"}
              </span>
            </div>
            {billingCycle === "annual" && (
              <p className="text-sm text-muted-foreground mt-1">
                That&apos;s just $8.25/month
              </p>
            )}
          </div>
          <ul className="mt-6 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.name} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{feature.name}</span>
                {renderValue(feature.pro)}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button
              className="w-full"
              onClick={handleGetStarted}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                `Get Pro ${billingCycle === "annual" ? "Annual" : "Monthly"}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
