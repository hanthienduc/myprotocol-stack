import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

// Price IDs from environment
export const STRIPE_PRICES = {
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY!,
  ANNUAL: process.env.STRIPE_PRICE_ANNUAL!,
} as const;

// Subscription tier mapping
export function getPlanFromPriceId(priceId: string): "pro" | "free" {
  if (priceId === STRIPE_PRICES.MONTHLY || priceId === STRIPE_PRICES.ANNUAL) {
    return "pro";
  }
  return "free";
}

// Check if subscription status grants access
export function isActiveSubscription(status: string): boolean {
  return ["active", "trialing"].includes(status);
}
