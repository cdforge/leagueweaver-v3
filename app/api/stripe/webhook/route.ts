import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRO_FEATURES } from "@/lib/supabase/auth";

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");
  const userId = subscription.metadata.userId;
  const planKey = subscription.metadata.planKey === "annual_pro" ? "annual_pro" : "monthly_pro";
  if (!userId) return;
  await admin.from("billing_access_grants").delete().eq("source_type", "subscription").eq("source_id", subscription.id);
  const active = subscription.status === "active" || subscription.status === "trialing";
  if (active) {
    await admin.from("billing_access_grants").insert(PRO_FEATURES.map((feature) => ({
      user_id: userId,
      feature,
      plan_key: planKey,
      scope_type: "account",
      schedule_id: null,
      source_type: "subscription",
      source_id: subscription.id,
    })));
    await admin.from("schedules").update({ requires_pro: true }).eq("user_id", userId);
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database service is not configured." }, { status: 503 });
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id;
      const planKey = session.metadata?.planKey === "annual_pro" ? "annual_pro" : "monthly_pro";
      const stripeCustomerId = customerId(session.customer);
      if (userId && stripeCustomerId) await admin.from("billing_customers").upsert({ user_id: userId, stripe_customer_id: stripeCustomerId, email: session.customer_details?.email ?? null });
      if (userId) await admin.from("billing_checkout_sessions").upsert({
        user_id: userId,
        stripe_checkout_session_id: session.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
        plan_key: planKey,
        scope_type: "account",
        checkout_mode: "subscription",
        status: "complete",
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata_json: session.metadata ?? {},
        purchased_at: new Date().toISOString(),
      }, { onConflict: "stripe_checkout_session_id" });
      if (typeof session.subscription === "string") await syncSubscription(await stripe.subscriptions.retrieve(session.subscription));
    }
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await syncSubscription(event.data.object);
    }
    if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === "string" ? invoice.parent.subscription_details.subscription : invoice.parent?.subscription_details?.subscription?.id;
      if (subscriptionId) await syncSubscription(await stripe.subscriptions.retrieve(subscriptionId));
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
