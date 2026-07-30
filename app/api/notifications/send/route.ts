import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAuthenticatedClient, getEntitlements } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json() as { scheduleId?: string };
  if (!body.scheduleId) return NextResponse.json({ error: "Choose a season." }, { status: 400 });
  const entitlements = await getEntitlements(auth.userId, auth.supabase, body.scheduleId);
  if (!entitlements.features.includes("notifications")) return NextResponse.json({ error: "Email notifications are included with Pro." }, { status: 403 });
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATIONS_FROM_EMAIL) return NextResponse.json({ error: "Email delivery is not configured yet." }, { status: 503 });
  const { data: published } = await auth.supabase.from("published_schedules").select("id,slug,title").eq("schedule_id", body.scheduleId).eq("is_active", true).maybeSingle();
  if (!published) return NextResponse.json({ error: "Publish this schedule before sending updates." }, { status: 409 });
  const { data: subscribers } = await auth.supabase.from("public_schedule_subscriptions").select("email,unsubscribe_token").eq("published_schedule_id", published.id).eq("delivery_channel", "email").is("unsubscribed_at", null);
  if (!subscribers?.length) return NextResponse.json({ sent: 0, message: "No one has subscribed yet." });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  await Promise.all(subscribers.filter((item) => item.email).map((item) => resend.emails.send({
    from: process.env.NOTIFICATIONS_FROM_EMAIL!,
    to: item.email!,
    subject: `${published.title} schedule update`,
    html: `<p>The commissioner updated <strong>${published.title}</strong>.</p><p><a href="${origin}/share/${published.slug}">Open the latest schedule</a></p><p><a href="${origin}/unsubscribe/${item.unsubscribe_token}">Unsubscribe</a></p>`,
  })));
  return NextResponse.json({ sent: subscribers.length });
}
