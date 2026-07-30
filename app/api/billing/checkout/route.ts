import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

const checkoutSchema = z.object({ interval: z.enum(["monthly", "annual"]) });

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in before starting checkout." }, { status: 401 });
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose monthly or annual Pro." }, { status: 400 });
  const interval = parsed.data.interval;
  const price = interval === "monthly" ? process.env.STRIPE_MONTHLY_PRO_PRICE_ID : process.env.STRIPE_ANNUAL_PRO_PRICE_ID;
  if (!price) return NextResponse.json({ error: "That billing option is not configured yet." }, { status: 503 });

  const { data: savedCustomer } = await admin.from("billing_customers").select("stripe_customer_id").eq("user_id", auth.userId).maybeSingle();
  let customerId = savedCustomer?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: auth.email, metadata: { userId: auth.userId } });
    customerId = customer.id;
    await admin.from("billing_customers").upsert({ user_id: auth.userId, stripe_customer_id: customerId, email: auth.email ?? null });
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const planKey = interval === "monthly" ? "monthly_pro" : "annual_pro";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/account?billing=success`,
    cancel_url: `${origin}/pricing?billing=cancelled`,
    client_reference_id: auth.userId,
    allow_promotion_codes: true,
    metadata: { userId: auth.userId, planKey },
    subscription_data: { metadata: { userId: auth.userId, planKey } },
  });
  await admin.from("billing_checkout_sessions").insert({
    user_id: auth.userId,
    stripe_checkout_session_id: session.id,
    stripe_customer_id: customerId,
    plan_key: planKey,
    scope_type: "account",
    checkout_mode: "subscription",
    status: "open",
    metadata_json: session.metadata ?? {},
  });
  return NextResponse.json({ url: session.url });
}
