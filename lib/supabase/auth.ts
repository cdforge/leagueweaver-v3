import "server-only";
import { createClient } from "./server";

export async function getAuthenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const email = typeof data?.claims?.email === "string" ? data.claims.email : undefined;
  return !error && userId ? { supabase, userId, email } : null;
}

export const PRO_FEATURES = ["public_sharing", "scorekeeping", "multiple_schedules", "standings", "playoffs", "simulator", "platform_sync", "notifications", "advanced_fairness", "no_ads"] as const;
export type ProFeature = typeof PRO_FEATURES[number];

export async function getEntitlements(userId: string, supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, scheduleId?: string) {
  const { data } = await supabase.from("billing_access_grants").select("feature,plan_key,scope_type,schedule_id").eq("user_id", userId);
  const grants = data ?? [];
  const accountPro = grants.some((grant) => grant.scope_type === "account" && (grant.plan_key === "monthly_pro" || grant.plan_key === "annual_pro"));
  const schedulePro = Boolean(scheduleId && grants.some((grant) => grant.scope_type === "schedule" && grant.schedule_id === scheduleId));
  const features = accountPro ? [...PRO_FEATURES] : Array.from(new Set(grants.filter((grant) => grant.scope_type === "account" || grant.schedule_id === scheduleId).map((grant) => grant.feature as ProFeature)));
  return { plan: accountPro ? "pro" as const : "free" as const, accountPro, schedulePro, features };
}
