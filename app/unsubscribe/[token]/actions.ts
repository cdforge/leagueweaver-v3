"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Explicitly change a public-schedule subscription's unsubscribe state.
 * Runs only in response to a user action (button/form POST) — never on page
 * render — so link prefetchers and email scanners can't silently unsubscribe.
 */
export async function setSubscriptionUnsubscribed(token: string, unsubscribed: boolean): Promise<{ ok: boolean; configured: boolean }> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, configured: false };
  const { data } = await admin
    .from("public_schedule_subscriptions")
    .update({ unsubscribed_at: unsubscribed ? new Date().toISOString() : null })
    .eq("unsubscribe_token", token)
    .select("id")
    .maybeSingle();
  return { ok: Boolean(data), configured: true };
}
