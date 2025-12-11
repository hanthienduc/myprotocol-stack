import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Price IDs from environment (accessed at runtime via getters)
export const STRIPE_PRICES = {
  get MONTHLY() {
    return process.env.STRIPE_PRICE_MONTHLY!;
  },
  get ANNUAL() {
    return process.env.STRIPE_PRICE_ANNUAL!;
  },
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
