import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient, getEntitlements } from "@/lib/supabase/auth";
import type { GeneratedSchedule } from "@/lib/types";

const saveSchema = z.object({ schedule: z.unknown() });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function numericSeed(seed: string) {
  if (!/^\d{1,9}$/.test(seed)) return null;
  const value = Number(seed);
  return Number.isSafeInteger(value) ? value : null;
}

export async function GET() {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ seasons: [] });
  const entitlements = await getEntitlements(auth.userId, auth.supabase);
  const { data, error } = await auth.supabase.from("schedules").select("id,title,status,current_revision_id,requires_pro,updated_at,time_frame").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Saved seasons could not be loaded." }, { status: 500 });
  return NextResponse.json({ seasons: (data ?? []).map((season) => ({ ...season, editable: entitlements.accountPro || !season.requires_pro })), plan: entitlements.plan });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in to save cloud revisions." }, { status: 401 });
  const parsed = saveSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "The season data is incomplete." }, { status: 400 });
  const schedule = parsed.data.schedule as GeneratedSchedule;
  if (!schedule?.setup?.name || !Array.isArray(schedule.weeks) || !Array.isArray(schedule.setup.teams)) return NextResponse.json({ error: "The season data is incomplete." }, { status: 400 });
  const entitlements = await getEntitlements(auth.userId, auth.supabase, schedule.id);
  let scheduleId = UUID.test(schedule.id) ? schedule.id : null;
  let revisionNumber = 1;

  if (scheduleId) {
    const { data: existing } = await auth.supabase.from("schedules").select("id,requires_pro").eq("id", scheduleId).maybeSingle();
    if (!existing) scheduleId = null;
    else if (existing.requires_pro && !entitlements.accountPro && !entitlements.schedulePro) return NextResponse.json({ error: "This season is view-only after downgrade. Choose your editable Free season in Account." }, { status: 403 });
  }

  if (!scheduleId) {
    if (!entitlements.accountPro) {
      const { data: existingFree } = await auth.supabase.from("schedules").select("id,title,updated_at").eq("requires_pro", false).neq("status", "archived").order("updated_at", { ascending: false });
      if ((existingFree ?? []).length >= 1) return NextResponse.json({ error: "Free includes one editable saved season. Open Account to choose it or upgrade for unlimited seasons.", code: "FREE_SEASON_LIMIT", seasons: existingFree }, { status: 409 });
    }
    const { data: created, error } = await auth.supabase.from("schedules").insert({
      user_id: auth.userId,
      title: schedule.setup.name,
      format: "fantasy_football",
      status: "generated",
      requires_pro: entitlements.accountPro,
      time_frame: { seasonYear: schedule.setup.seasonYear, weeks: schedule.setup.weeks },
    }).select("id").single();
    if (error || !created) return NextResponse.json({ error: "The season could not be saved." }, { status: 500 });
    scheduleId = created.id;
  } else {
    const { data } = await auth.supabase.from("schedule_revisions").select("revision_number").eq("schedule_id", scheduleId).order("revision_number", { ascending: false }).limit(1).maybeSingle();
    revisionNumber = (data?.revision_number ?? 0) + 1;
  }

  const cloudSchedule = { ...schedule, id: scheduleId, revision: revisionNumber };
  const { data: revision, error: revisionError } = await auth.supabase.from("schedule_revisions").insert({
    schedule_id: scheduleId,
    user_id: auth.userId,
    revision_number: revisionNumber,
    source: revisionNumber === 1 ? "home_generate" : "manual_save",
    input_json: cloudSchedule.setup,
    schedule_json: cloudSchedule,
    summary_json: cloudSchedule.fairness,
    seed: numericSeed(cloudSchedule.seed),
    generated_at: cloudSchedule.createdAt,
  }).select("id").single();
  if (revisionError || !revision) return NextResponse.json({ error: "The cloud revision could not be created." }, { status: 500 });
  const { error: updateError } = await auth.supabase.from("schedules").update({ current_revision_id: revision.id, title: cloudSchedule.setup.name, status: "generated", last_opened_at: new Date().toISOString(), time_frame: { seasonYear: cloudSchedule.setup.seasonYear, weeks: cloudSchedule.setup.weeks } }).eq("id", scheduleId);
  if (updateError) return NextResponse.json({ error: "The season was saved, but its current revision could not be selected." }, { status: 500 });

  const scoreRows = cloudSchedule.weeks.flatMap((week) => week.games.filter((game) => game.homeScore != null || game.awayScore != null).map((game) => ({
    user_id: auth.userId, schedule_id: scheduleId, game_id: game.id, week: week.weekNumber, home_score: game.homeScore ?? null, away_score: game.awayScore ?? null, is_final: game.homeScore != null && game.awayScore != null,
  })));
  if (scoreRows.length) await auth.supabase.from("season_scores").upsert(scoreRows, { onConflict: "schedule_id,game_id" });
  return NextResponse.json({ schedule: cloudSchedule, revisionId: revision.id, plan: entitlements.plan });
}
