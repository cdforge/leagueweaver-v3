import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient, getEntitlements } from "@/lib/supabase/auth";
import { isSeasonCopyTitle, nextSeasonCopyTitle, readSavedSeasonBrandingFromSchedule, readSavedSeasonTimeFrame, readSavedSeasonTimeFrameFromSchedule, savedSeasonIdentity } from "@/lib/savedSeasons";
import type { GeneratedSchedule } from "@/lib/types";

const saveSchema = z.object({
  schedule: z.unknown(),
  saveMode: z.enum(["overwrite", "copy"]).optional(),
  existingScheduleId: z.string().uuid().optional(),
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function numericSeed(seed: string) {
  if (!/^\d{1,9}$/.test(seed)) return null;
  const value = Number(seed);
  return Number.isSafeInteger(value) ? value : null;
}

function setupFromStoredSchedule(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const setup = record.setup;
  return setup && typeof setup === "object" && !Array.isArray(setup) ? setup as Record<string, unknown> : record;
}

function arrayField(setup: Record<string, unknown>, key: string) {
  const value = setup[key];
  return Array.isArray(value) ? value : [];
}

function savedLeagueField(setup: Record<string, unknown>) {
  const value = setup.savedLeague;
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const savedLeague = value as Record<string, unknown>;
  return typeof savedLeague.id === "string" ? {
    id: savedLeague.id,
    updatedAt: typeof savedLeague.updatedAt === "string" ? savedLeague.updatedAt : undefined,
  } : undefined;
}

export async function GET() {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ seasons: [] });
  const entitlements = await getEntitlements(auth.userId, auth.supabase);
  const { data, error } = await auth.supabase.from("schedules").select("id,title,status,current_revision_id,requires_pro,updated_at,time_frame").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Saved seasons could not be loaded." }, { status: 500 });
  const activeSeasons = (data ?? []).filter((season) => season.status !== "archived");
  if (!activeSeasons.length) return NextResponse.json({ seasons: [], plan: entitlements.plan });
  const activeSeasonIds = activeSeasons.map((season) => season.id);
  const { data: revisions } = await auth.supabase
    .from("schedule_revisions")
    .select("id,schedule_id,input_json,schedule_json,created_at")
    .in("schedule_id", activeSeasonIds)
    .order("created_at", { ascending: false });
  const revisionsBySchedule = new Map<string, number>();
  const revisionById = new Map<string, NonNullable<typeof revisions>[number]>();
  const latestRevisionBySchedule = new Map<string, NonNullable<typeof revisions>[number]>();
  for (const revision of revisions ?? []) {
    revisionsBySchedule.set(revision.schedule_id, (revisionsBySchedule.get(revision.schedule_id) ?? 0) + 1);
    revisionById.set(revision.id, revision);
    if (!latestRevisionBySchedule.has(revision.schedule_id)) latestRevisionBySchedule.set(revision.schedule_id, revision);
  }
  const resolvedTimeFrame = (season: typeof activeSeasons[number]) => {
    const storedFrame = readSavedSeasonTimeFrame(season.time_frame);
    if (storedFrame.seasonYear && storedFrame.weeks) return storedFrame;
    const currentRevision = season.current_revision_id ? revisionById.get(season.current_revision_id) : undefined;
    const revision = currentRevision ?? latestRevisionBySchedule.get(season.id);
    const revisionFrame = readSavedSeasonTimeFrameFromSchedule(revision?.schedule_json);
    return revisionFrame.seasonYear && revisionFrame.weeks ? revisionFrame : season.time_frame;
  };
  const resolvedBranding = (season: typeof activeSeasons[number]) => {
    const currentRevision = season.current_revision_id ? revisionById.get(season.current_revision_id) : undefined;
    const revision = currentRevision ?? latestRevisionBySchedule.get(season.id);
    return readSavedSeasonBrandingFromSchedule(revision?.schedule_json);
  };
  const resolvedSetupMarks = (season: typeof activeSeasons[number]) => {
    const currentRevision = season.current_revision_id ? revisionById.get(season.current_revision_id) : undefined;
    const revision = currentRevision ?? latestRevisionBySchedule.get(season.id);
    const scheduleSetup = setupFromStoredSchedule(revision?.schedule_json);
    const inputSetup = setupFromStoredSchedule(revision?.input_json);
    const scheduleTeams = arrayField(scheduleSetup, "teams");
    const inputTeams = arrayField(inputSetup, "teams");
    const scheduleDivisions = arrayField(scheduleSetup, "divisions");
    const inputDivisions = arrayField(inputSetup, "divisions");
    const scheduleConferences = arrayField(scheduleSetup, "conferences");
    const inputConferences = arrayField(inputSetup, "conferences");
    const savedLeague = savedLeagueField(scheduleSetup) ?? savedLeagueField(inputSetup);
    return {
      teams: scheduleTeams.length >= inputTeams.length ? scheduleTeams : inputTeams,
      divisions: scheduleDivisions.length >= inputDivisions.length ? scheduleDivisions : inputDivisions,
      conferences: scheduleConferences.length >= inputConferences.length ? scheduleConferences : inputConferences,
      savedLeague,
    };
  };

  const grouped = new Map<string, typeof activeSeasons>();
  for (const season of activeSeasons) {
    const key = savedSeasonIdentity(season.title, resolvedTimeFrame(season));
    const group = grouped.get(key) ?? [];
    group.push(season);
    grouped.set(key, group);
  }

  const seasons = [...grouped.values()].map((group) => {
    const season = group[0];
    const branding = resolvedBranding(season);
    const marks = resolvedSetupMarks(season);
    return {
      ...season,
      time_frame: resolvedTimeFrame(season),
      logo_url: branding.logoUrl ?? null,
      color: branding.color ?? null,
      initials: branding.initials ?? null,
      teams: marks.teams,
      divisions: marks.divisions,
      conferences: marks.conferences,
      savedLeague: marks.savedLeague,
      editable: true,
      revision_count: group.reduce((total, item) => total + (revisionsBySchedule.get(item.id) ?? 0), 0),
    };
  });
  return NextResponse.json({ seasons, plan: entitlements.plan });
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
  let persistedTitle = schedule.setup.name;
  const timeFrame = { seasonYear: schedule.setup.seasonYear, weeks: schedule.setup.weeks };

  if (scheduleId) {
    const { data: existing } = await auth.supabase.from("schedules").select("id,title,requires_pro").eq("id", scheduleId).maybeSingle();
    if (!existing) scheduleId = null;
    else persistedTitle = isSeasonCopyTitle(existing.title, schedule.setup.name) ? existing.title : schedule.setup.name;
  }

  if (!scheduleId) {
    const { data: activeRows, error: activeError } = await auth.supabase
      .from("schedules")
      .select("id,title,requires_pro,updated_at,time_frame,status")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });
    if (activeError) return NextResponse.json({ error: "Saved seasons could not be checked for an existing copy." }, { status: 500 });
    const targetIdentity = savedSeasonIdentity(schedule.setup.name, timeFrame);
    const matchingRows = (activeRows ?? []).filter((row) => savedSeasonIdentity(row.title, row.time_frame) === targetIdentity);

    if (matchingRows.length && !parsed.data.saveMode) {
      const existingSeason = matchingRows[0];
      return NextResponse.json({
        error: "A saved season already uses this league name and timeframe.",
        code: "SEASON_EXISTS",
        existingSeason: {
          id: existingSeason.id,
          title: existingSeason.title,
          time_frame: existingSeason.time_frame,
          updated_at: existingSeason.updated_at,
        },
      }, { status: 409 });
    }

    if (parsed.data.saveMode === "overwrite") {
      const existingSeason = matchingRows.find((row) => row.id === parsed.data.existingScheduleId) ?? matchingRows[0];
      if (!existingSeason) return NextResponse.json({ error: "The existing season could not be found." }, { status: 404 });
      scheduleId = existingSeason.id;
      persistedTitle = existingSeason.title;
    }

    if (parsed.data.saveMode === "copy") {
      persistedTitle = nextSeasonCopyTitle(schedule.setup.name, (activeRows ?? []).map((row) => row.title));
    }
    if (!scheduleId) {
      const { data: created, error } = await auth.supabase.from("schedules").insert({
        user_id: auth.userId,
        title: persistedTitle,
        format: "fantasy_football",
        status: "generated",
        requires_pro: false,
        time_frame: timeFrame,
      }).select("id").single();
      if (error || !created) return NextResponse.json({ error: "The season could not be saved." }, { status: 500 });
      scheduleId = created.id;
    }
  }

  if (scheduleId) {
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
  const { error: updateError } = await auth.supabase.from("schedules").update({ current_revision_id: revision.id, title: persistedTitle, status: "generated", last_opened_at: new Date().toISOString(), time_frame: timeFrame }).eq("id", scheduleId);
  if (updateError) return NextResponse.json({ error: "The season was saved, but its current revision could not be selected." }, { status: 500 });

  const scoreRows = cloudSchedule.weeks.flatMap((week) => week.games.filter((game) => game.homeScore != null || game.awayScore != null).map((game) => ({
    user_id: auth.userId, schedule_id: scheduleId, game_id: game.id, week: week.weekNumber, home_score: game.homeScore ?? null, away_score: game.awayScore ?? null, is_final: game.homeScore != null && game.awayScore != null,
  })));
  if (scoreRows.length) await auth.supabase.from("season_scores").upsert(scoreRows, { onConflict: "schedule_id,game_id" });
  return NextResponse.json({ schedule: cloudSchedule, revisionId: revision.id, title: persistedTitle, plan: entitlements.plan });
}
