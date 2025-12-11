"use server";

import { createClient } from "@myprotocolstack/database/server";
import { redirect } from "next/navigation";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://protocolstack.app";

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  priceType: "monthly" | "annual"
): Promise<{ url: string | null; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { url: null, error: "Unauthorized" };
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await getStripe().customers.create({
        email: profile?.email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Get price ID
    const priceId =
      priceType === "monthly" ? STRIPE_PRICES.MONTHLY : STRIPE_PRICES.ANNUAL;

    // Create checkout session
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/settings?checkout=success`,
      cancel_url: `${APP_URL}/settings?checkout=canceled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      allow_promotion_codes: true,
    });

    return { url: session.url };
  } catch (error) {
    console.error("Checkout session error:", error);
    return { url: null, error: "Failed to create checkout session" };
  }
}

/**
 * Create a Stripe Customer Portal session for subscription management
 */
export async function createPortalSession(): Promise<{
  url: string | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { url: null, error: "Unauthorized" };
    }

    // Get Stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return { url: null, error: "No subscription found" };
    }

    // Create portal session
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${APP_URL}/settings`,
    });

    return { url: session.url };
  } catch (error) {
    console.error("Portal session error:", error);
    return { url: null, error: "Failed to create portal session" };
  }
}

/**
 * Get current subscription status for the user
 */
export async function getSubscriptionStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      tier: "free" as const,
      subscription: null,
      isActive: false,
    };
  }

  // Get profile with subscription tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  // Get active subscription details
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .single();

  const tier = profile?.subscription_tier || "free";
  const isActive = tier === "pro" && !!subscription;

  return {
    tier,
    subscription,
    isActive,
    currentPeriodEnd: subscription?.current_period_end,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end,
  };
}

/**
 * Redirect to checkout (convenience action for form submission)
 */
export async function redirectToCheckout(formData: FormData) {
  const priceType = formData.get("priceType") as "monthly" | "annual";
  const { url, error } = await createCheckoutSession(priceType);

  if (error || !url) {
    // Return to settings with error
    redirect(`/settings?error=${encodeURIComponent(error || "Unknown error")}`);
  }

  redirect(url);
}

/**
 * Redirect to customer portal (convenience action for form submission)
 */
export async function redirectToPortal() {
  const { url, error } = await createPortalSession();

  if (error || !url) {
    redirect(`/settings?error=${encodeURIComponent(error || "Unknown error")}`);
  }

  redirect(url);
}
