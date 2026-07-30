import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  const { data: customer } = await auth.supabase.from("billing_customers").select("stripe_customer_id").eq("user_id", auth.userId).maybeSingle();
  if (!customer?.stripe_customer_id) return NextResponse.json({ error: "No billing account was found." }, { status: 404 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const session = await stripe.billingPortal.sessions.create({ customer: customer.stripe_customer_id, return_url: `${origin}/account` });
  return NextResponse.json({ url: session.url });
}
