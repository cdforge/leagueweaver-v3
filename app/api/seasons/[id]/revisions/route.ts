import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ revisions: [] }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await auth.supabase.from("schedule_revisions").select("id,revision_number,source,summary_json,created_at").eq("schedule_id", id).order("revision_number", { ascending: false });
  return error ? NextResponse.json({ error: "Revisions could not be loaded." }, { status: 500 }) : NextResponse.json({ revisions: data });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await context.params;
  const { revisionId } = await request.json() as { revisionId?: string };
  if (!revisionId) return NextResponse.json({ error: "Choose a revision." }, { status: 400 });
  const { data: revision } = await auth.supabase.from("schedule_revisions").select("id").eq("id", revisionId).eq("schedule_id", id).single();
  if (!revision) return NextResponse.json({ error: "That revision was not found." }, { status: 404 });
  const { error } = await auth.supabase.from("schedules").update({ current_revision_id: revision.id }).eq("id", id);
  return error ? NextResponse.json({ error: "The revision could not be restored." }, { status: 500 }) : NextResponse.json({ restored: true });
}
