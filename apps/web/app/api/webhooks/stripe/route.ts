import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createAdminClient } from "@myprotocolstack/database/server";
import { getStripe, getPlanFromPriceId, isActiveSubscription } from "@/lib/stripe";

// Lazy getters for runtime-only values
function getSupabaseAdmin() {
  return createAdminClient();
}

function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

// Events we care about
const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Skip events we don't care about
  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  // Idempotency check - have we already processed this event?
  const { data: existingEvent } = await supabaseAdmin
    .from("webhook_events")
    .select("id, status")
    .eq("stripe_event_id", event.id)
    .single();

  if (existingEvent?.status === "completed") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record event as processing
  if (!existingEvent) {
    await supabaseAdmin.from("webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: "processing",
      payload: event.data.object as unknown as Record<string, unknown>,
    });
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    // Mark event as completed
    await supabaseAdmin
      .from("webhook_events")
      .update({ status: "completed" })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);

    // Mark event as failed with error details
    await supabaseAdmin
      .from("webhook_events")
      .update({
        status: "failed",
        error_details: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("stripe_event_id", event.id);

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout - link customer to user if needed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  // User ID is stored in session metadata during checkout creation
  const userId = session.metadata?.supabase_user_id;

  if (!userId) {
    // Try to find user by customer ID
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile) {
      console.error("No user found for checkout session:", session.id);
      return;
    }
  }

  // Subscription will be handled by subscription.created event
  console.log("Checkout completed:", { customerId, subscriptionId, userId });
}

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const supabaseAdmin = getSupabaseAdmin();
  const customerId = subscription.customer as string;
  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;

  // Find user by customer ID
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) {
    // Try metadata
    const userId = subscription.metadata?.supabase_user_id;
    if (!userId) {
      console.error("No user found for subscription:", subscription.id);
      return;
    }
    // Update profile with customer ID
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  const userId = profile?.id || subscription.metadata?.supabase_user_id;
  if (!userId) return;

  // Upsert subscription record
  // Note: In Stripe API 2025+, billing periods are on subscription items, not subscription
  const currentPeriodStart = subscriptionItem?.current_period_start;
  const currentPeriodEnd = subscriptionItem?.current_period_end;

  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      price_id: priceId,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    },
    {
      onConflict: "stripe_subscription_id",
    }
  );

  // Update profile subscription tier
  const tier = isActiveSubscription(subscription.status) && priceId
    ? getPlanFromPriceId(priceId)
    : "free";

  await supabaseAdmin
    .from("profiles")
    .update({ subscription_tier: tier })
    .eq("id", userId);

  console.log("Subscription updated:", {
    userId,
    subscriptionId: subscription.id,
    status: subscription.status,
    tier,
  });
}

/**
 * Handle subscription deletion (canceled and expired)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabaseAdmin = getSupabaseAdmin();
  const customerId = subscription.customer as string;

  // Find user
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  // Update subscription record
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Downgrade to free
  await supabaseAdmin
    .from("profiles")
    .update({ subscription_tier: "free" })
    .eq("id", profile.id);

  console.log("Subscription deleted:", {
    userId: profile.id,
    subscriptionId: subscription.id,
  });
}

/**
 * Handle failed payment - could notify user or take action
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;
  // In newer Stripe API, subscription may be in parent or needs to be fetched from lines
  const subscriptionId = invoice.lines?.data[0]?.subscription;

  console.log("Payment failed:", { customerId, subscriptionId });

  // Could add email notification here
  // For now, Stripe will handle dunning (retry) automatically
}
