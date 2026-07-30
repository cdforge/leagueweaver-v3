import { NextResponse } from "next/server";
import { readSavedSeasonTimeFrame, readSavedSeasonTimeFrameFromSchedule, savedSeasonIdentity } from "@/lib/savedSeasons";
import { getAuthenticatedClient } from "@/lib/supabase/auth";
import type { GeneratedSchedule } from "@/lib/types";

async function getSeasonGroup(
  supabase: NonNullable<Awaited<ReturnType<typeof getAuthenticatedClient>>>["supabase"],
  id: string,
) {
  const { data: target } = await supabase
    .from("schedules")
    .select("id,title,time_frame,current_revision_id")
    .eq("id", id)
    .maybeSingle();
  if (!target) return null;
  const { data: seasons, error } = await supabase
    .from("schedules")
    .select("id,title,time_frame,current_revision_id")
    .neq("status", "archived");
  if (error) return null;
  const { data: revisions } = await supabase
    .from("schedule_revisions")
    .select("id,schedule_id,schedule_json,created_at")
    .order("created_at", { ascending: false });
  const revisionById = new Map((revisions ?? []).map((revision) => [revision.id, revision]));
  const latestRevisionBySchedule = new Map<string, NonNullable<typeof revisions>[number]>();
  for (const revision of revisions ?? []) {
    if (!latestRevisionBySchedule.has(revision.schedule_id)) latestRevisionBySchedule.set(revision.schedule_id, revision);
  }
  const resolvedTimeFrame = (season: { id: string; time_frame: unknown; current_revision_id: string | null }) => {
    const storedFrame = readSavedSeasonTimeFrame(season.time_frame);
    if (storedFrame.seasonYear && storedFrame.weeks) return storedFrame;
    const revision = (season.current_revision_id ? revisionById.get(season.current_revision_id) : undefined) ?? latestRevisionBySchedule.get(season.id);
    const revisionFrame = readSavedSeasonTimeFrameFromSchedule(revision?.schedule_json);
    return revisionFrame.seasonYear && revisionFrame.weeks ? revisionFrame : season.time_frame;
  };
  const targetIdentity = savedSeasonIdentity(target.title, resolvedTimeFrame(target));
  return {
    target,
    ids: (seasons ?? [])
      .filter((season) => savedSeasonIdentity(season.title, resolvedTimeFrame(season)) === targetIdentity)
      .map((season) => season.id),
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ revisions: [] }, { status: 401 });
  const { id } = await context.params;
  const group = await getSeasonGroup(auth.supabase, id);
  if (!group) return NextResponse.json({ error: "That saved season was not found." }, { status: 404 });
  const { data, error } = await auth.supabase
    .from("schedule_revisions")
    .select("id,schedule_id,revision_number,source,summary_json,schedule_json,created_at")
    .in("schedule_id", group.ids)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Revisions could not be loaded." }, { status: 500 });
  const revisions = (data ?? []).map((revision, index, all) => ({
    id: revision.id,
    schedule_id: revision.schedule_id,
    source: revision.source,
    summary_json: revision.summary_json,
    created_at: revision.created_at,
    stored_revision_number: revision.revision_number,
    revision_number: all.length - index,
    current: revision.id === group.target.current_revision_id,
    restorable: Boolean((revision.schedule_json as GeneratedSchedule | undefined)?.setup),
  }));
  return NextResponse.json({ revisions, current_revision_id: group.target.current_revision_id });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await context.params;
  const { revisionId } = await request.json() as { revisionId?: string };
  if (!revisionId) return NextResponse.json({ error: "Choose a revision." }, { status: 400 });
  const group = await getSeasonGroup(auth.supabase, id);
  if (!group) return NextResponse.json({ error: "That saved season was not found." }, { status: 404 });
  const { data: revision } = await auth.supabase
    .from("schedule_revisions")
    .select("id,schedule_id,input_json,schedule_json,summary_json,seed,generated_at")
    .eq("id", revisionId)
    .in("schedule_id", group.ids)
    .maybeSingle();
  if (!revision) return NextResponse.json({ error: "That revision was not found." }, { status: 404 });
  if (!(revision.schedule_json as GeneratedSchedule | undefined)?.setup) {
    return NextResponse.json({ error: "This legacy revision is preserved for history, but it cannot replace the current League Weaver v3 season." }, { status: 409 });
  }

  let restoredRevisionId = revision.id;
  if (revision.schedule_id !== id) {
    const { data: latest } = await auth.supabase
      .from("schedule_revisions")
      .select("revision_number")
      .eq("schedule_id", id)
      .order("revision_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const revisionNumber = (latest?.revision_number ?? 0) + 1;
    const sourceSchedule = revision.schedule_json as GeneratedSchedule;
    const restoredSchedule = { ...sourceSchedule, id, revision: revisionNumber };
    const { data: copied, error: copyError } = await auth.supabase
      .from("schedule_revisions")
      .insert({
        schedule_id: id,
        user_id: auth.userId,
        revision_number: revisionNumber,
        source: "manual_save",
        input_json: restoredSchedule.setup ?? revision.input_json,
        schedule_json: restoredSchedule,
        summary_json: restoredSchedule.fairness ?? revision.summary_json,
        seed: revision.seed,
        generated_at: revision.generated_at,
      })
      .select("id")
      .single();
    if (copyError || !copied) return NextResponse.json({ error: "The older save could not be added to this season's history." }, { status: 500 });
    restoredRevisionId = copied.id;
  }

  const { error } = await auth.supabase
    .from("schedules")
    .update({ current_revision_id: restoredRevisionId, last_opened_at: new Date().toISOString() })
    .eq("id", id);
  return error
    ? NextResponse.json({ error: "The revision could not be restored." }, { status: 500 })
    : NextResponse.json({ restored: true, revisionId: restoredRevisionId });
}
