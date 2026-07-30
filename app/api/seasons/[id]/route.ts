import { NextResponse } from "next/server";
import { getAuthenticatedClient, getEntitlements } from "@/lib/supabase/auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in to open saved seasons." }, { status: 401 });
  const { id } = await context.params;
  const { data: season } = await auth.supabase.from("schedules").select("id,title,current_revision_id,requires_pro,status").eq("id", id).single();
  if (!season) return NextResponse.json({ error: "That season was not found." }, { status: 404 });
  const { data: revision } = await auth.supabase.from("schedule_revisions").select("schedule_json,revision_number").eq("id", season.current_revision_id).single();
  if (!revision?.schedule_json) return NextResponse.json({ error: "That season has no generated revision." }, { status: 404 });
  const entitlements = await getEntitlements(auth.userId, auth.supabase, id);
  return NextResponse.json({ schedule: revision.schedule_json, editable: entitlements.accountPro || entitlements.schedulePro || !season.requires_pro, plan: entitlements.plan });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json() as { status?: "archived" | "generated" };
  if (!body.status) return NextResponse.json({ error: "Choose a valid status." }, { status: 400 });
  const { error } = await auth.supabase.from("schedules").update({ status: body.status }).eq("id", id);
  return error ? NextResponse.json({ error: "The season could not be updated." }, { status: 500 }) : NextResponse.json({ updated: true });
}
