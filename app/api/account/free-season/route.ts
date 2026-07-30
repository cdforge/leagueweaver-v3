import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json() as { scheduleId?: string };
  if (!body.scheduleId) return NextResponse.json({ error: "Choose the season to keep editable." }, { status: 400 });
  const { data: owned } = await auth.supabase.from("schedules").select("id").eq("id", body.scheduleId).maybeSingle();
  if (!owned) return NextResponse.json({ error: "That season was not found." }, { status: 404 });
  const { error: lockError } = await auth.supabase.from("schedules").update({ requires_pro: true }).neq("status", "archived");
  if (lockError) return NextResponse.json({ error: "Your season access could not be updated." }, { status: 500 });
  const { error: unlockError } = await auth.supabase.from("schedules").update({ requires_pro: false }).eq("id", body.scheduleId);
  if (unlockError) return NextResponse.json({ error: "The selected season could not be unlocked." }, { status: 500 });
  const { error: preferenceError } = await auth.supabase.from("user_plan_preferences").upsert({ user_id: auth.userId, free_editable_schedule_id: body.scheduleId }, { onConflict: "user_id" });
  return preferenceError ? NextResponse.json({ error: "The preference could not be saved." }, { status: 500 }) : NextResponse.json({ scheduleId: body.scheduleId });
}
