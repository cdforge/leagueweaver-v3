import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service role key not configured." }, { status: 500 });
  const { data: pools, error } = await admin
    .from("pickem_pools")
    .select("id,name,status")
    .eq("status", "active")
    .limit(100);
  if (error) return NextResponse.json({ error: "Pick'em pools could not be loaded. Apply the Pick'em SQL first." }, { status: 503 });
  return NextResponse.json({
    ok: true,
    considered: pools?.length ?? 0,
    queued: 0,
    note: "Reminder scan is wired. Delivery uses /api/pickem/reminders after week window matching is enabled.",
  });
}
