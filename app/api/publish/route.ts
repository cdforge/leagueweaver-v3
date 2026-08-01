import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "league";
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in to publish a schedule." }, { status: 401 });
  const body = await request.json() as { scheduleId?: string };
  if (!body.scheduleId) return NextResponse.json({ error: "Save the season before publishing." }, { status: 400 });
  const { data: season } = await auth.supabase.from("schedules").select("id,title,format,current_revision_id").eq("id", body.scheduleId).maybeSingle();
  if (!season?.current_revision_id) return NextResponse.json({ error: "Save the season before publishing." }, { status: 404 });
  const { data: revision } = await auth.supabase.from("schedule_revisions").select("id,input_json,schedule_json").eq("id", season.current_revision_id).maybeSingle();
  if (!revision?.schedule_json) return NextResponse.json({ error: "The current revision could not be published." }, { status: 404 });
  const { data: existing } = await auth.supabase.from("published_schedules").select("slug").eq("schedule_id", season.id).maybeSingle();
  const schedule = revision.schedule_json as { setup?: { name?: string; description?: string } };
  const slug = existing?.slug || `${slugify(schedule.setup?.name || season.title)}-${randomUUID().slice(0, 6)}`;
  const { error } = await auth.supabase.from("published_schedules").upsert({
    schedule_id: season.id,
    revision_id: revision.id,
    user_id: auth.userId,
    slug,
    title: season.title,
    league_name: schedule.setup?.name || season.title,
    league_description: schedule.setup?.description || null,
    format: season.format,
    input_json: revision.input_json,
    schedule_json: revision.schedule_json,
    is_active: true,
    published_at: new Date().toISOString(),
  }, { onConflict: "schedule_id" });
  if (error) return NextResponse.json({ error: "The public schedule could not be updated." }, { status: 500 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/share/${slug}`, slug });
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const scheduleId = new URL(request.url).searchParams.get("scheduleId");
  if (!scheduleId) return NextResponse.json({ error: "Choose a season." }, { status: 400 });
  // RLS scopes this to the signed-in user's own schedules.
  const { data } = await auth.supabase.from("published_schedules").select("slug,is_active").eq("schedule_id", scheduleId).maybeSingle();
  if (!data?.is_active) return NextResponse.json({ published: false });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return NextResponse.json({ published: true, url: `${origin}/share/${data.slug}`, slug: data.slug });
}

export async function DELETE(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const scheduleId = new URL(request.url).searchParams.get("scheduleId");
  if (!scheduleId) return NextResponse.json({ error: "Choose a published season." }, { status: 400 });
  const { error } = await auth.supabase.from("published_schedules").update({ is_active: false }).eq("schedule_id", scheduleId);
  return error ? NextResponse.json({ error: "Sharing could not be disabled." }, { status: 500 }) : NextResponse.json({ unpublished: true });
}
