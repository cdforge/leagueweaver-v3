import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ slug: z.string().min(3).max(80), email: z.string().email().max(254), teamId: z.string().max(120).optional() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Email subscriptions are not configured yet." }, { status: 503 });
  const { data: published } = await admin.from("published_schedules").select("id,title").eq("slug", parsed.data.slug).eq("is_active", true).maybeSingle();
  if (!published) return NextResponse.json({ error: "That public schedule is no longer active." }, { status: 404 });
  const teamScope = parsed.data.teamId || "__all__";
  const { data: subscription, error } = await admin.from("public_schedule_subscriptions").insert({
    published_schedule_id: published.id,
    email: parsed.data.email.toLowerCase(),
    phone: null,
    delivery_channel: "email",
    team_id: parsed.data.teamId || null,
    team_scope: teamScope,
  }).select("unsubscribe_token").single();
  if (error && error.code !== "23505") return NextResponse.json({ error: "Email updates could not be enabled." }, { status: 500 });
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL || process.env.FEEDBACK_FROM_EMAIL;
  if (subscription?.unsubscribe_token && process.env.RESEND_API_KEY && fromEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    await resend.emails.send({
      from: fromEmail,
      to: parsed.data.email,
      subject: `Updates enabled for ${published.title}`,
      html: `<p>You will receive League Weaver schedule updates for <strong>${published.title}</strong>.</p><p><a href="${origin}/unsubscribe/${subscription.unsubscribe_token}">Unsubscribe</a></p>`,
    });
  }
  return NextResponse.json({ subscribed: true, duplicate: error?.code === "23505" });
}
