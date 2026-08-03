import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

const reminderSchema = z.object({
  poolId: z.string().uuid(),
  week: z.number().int().min(1).max(22),
  type: z.enum(["manual-incomplete", "thursday-submit", "sunday-progress"]).default("manual-incomplete"),
  channel: z.enum(["email", "sms", "both"]).default("email"),
});

function smsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_PHONE);
}

async function sendSms(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_PHONE!;
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  if (!response.ok) throw new Error("SMS could not be sent.");
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const parsed = reminderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Reminder details are incomplete." }, { status: 400 });
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL || process.env.FEEDBACK_FROM_EMAIL;
  const wantsEmail = parsed.data.channel === "email" || parsed.data.channel === "both";
  const wantsSms = parsed.data.channel === "sms" || parsed.data.channel === "both";
  if (wantsEmail && (!process.env.RESEND_API_KEY || !fromEmail)) return NextResponse.json({ error: "Email delivery is not configured yet." }, { status: 503 });
  if (wantsSms && !smsConfigured()) return NextResponse.json({ error: "SMS delivery is not configured yet. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_PHONE." }, { status: 503 });
  const { data: pool } = await auth.supabase.from("pickem_pools").select("id,name,public_slug,user_id").eq("id", parsed.data.poolId).eq("user_id", auth.userId).maybeSingle();
  if (!pool) return NextResponse.json({ error: "Pick'em pool could not be found." }, { status: 404 });
  const { data: participants, error } = await auth.supabase
    .from("pickem_participants")
    .select("id,display_name,email,email_opt_in,phone,sms_opt_in")
    .eq("pool_id", pool.id)
    .eq("is_active", true);
  if (error) return NextResponse.json({ error: "Participants could not be loaded." }, { status: 500 });
  const emailRecipients = wantsEmail ? (participants ?? []).filter((participant) => participant.email && participant.email_opt_in) : [];
  const smsRecipients = wantsSms ? (participants ?? []).filter((participant) => participant.phone && participant.sms_opt_in) : [];
  if (!emailRecipients.length && !smsRecipients.length) return NextResponse.json({ sent: 0, skipped: participants?.length ?? 0, message: "No opted-in participants to remind." });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const subject = parsed.data.type === "sunday-progress" ? `${pool.name}: track today's Pick'em progress` : `${pool.name}: submit your Pick'em picks`;
  const cta = `${origin}/pickem/${pool.public_slug}`;
  const message = parsed.data.type === "sunday-progress"
    ? `Track your ${pool.name} Pick'em progress today: ${cta}`
    : `${pool.name}: submit your Pick'em picks before kickoff. ${cta}`;
  if (emailRecipients.length) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await Promise.all(emailRecipients.map((participant) => resend.emails.send({
      from: fromEmail!,
      to: participant.email!,
      subject,
      html: `<p>Hey ${participant.display_name},</p><p>${parsed.data.type === "sunday-progress" ? "Track your Pick'em progress today." : "Your Pick'em week starts soon. Submit your picks before kickoff."}</p><p><a href="${cta}">Open Pick'em</a></p>`,
    })));
  }
  if (smsRecipients.length) await Promise.all(smsRecipients.map((participant) => sendSms(participant.phone!, message)));
  const logs = [];
  if (emailRecipients.length) logs.push({
    pool_id: pool.id,
    week: parsed.data.week,
    reminder_type: parsed.data.type,
    channel: "email",
    sent_count: emailRecipients.length,
    status: "sent",
  });
  if (smsRecipients.length) logs.push({
    pool_id: pool.id,
    week: parsed.data.week,
    reminder_type: parsed.data.type,
    channel: "sms",
    sent_count: smsRecipients.length,
    status: "sent",
  });
  if (logs.length) await auth.supabase.from("pickem_reminders").insert(logs);
  return NextResponse.json({
    sent: emailRecipients.length + smsRecipients.length,
    emailSent: emailRecipients.length,
    smsSent: smsRecipients.length,
    skipped: (participants?.length ?? 0) - Math.max(emailRecipients.length, smsRecipients.length),
  });
}
