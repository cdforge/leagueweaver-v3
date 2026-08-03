import { NextResponse } from "next/server";
import { z } from "zod";
import { parseEspnLeagueId, scanEspnHistory } from "@/lib/platform/espn";
import { collectSleeperLeagueHistory, resolveSleeperLeagueId, scanSleeperHistory } from "@/lib/platform/sleeper";
import type { LeagueHistoryDraft } from "@/lib/platform/history";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/auth";
import type { ImportDataFound, ImportHistoryEvent, PastChampion } from "@/lib/types";

const schema = z.object({
  provider: z.enum(["espn", "sleeper"]),
  identifier: z.string().trim().min(1),
  seasonYear: z.number().int().min(2017).max(2200),
  swid: z.string().trim().optional(),
  espnS2: z.string().trim().optional(),
  scheduleId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i).optional(),
  populate: z.boolean().optional(),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readSummary(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function eventMessage(summary: Record<string, unknown>, fallback?: string | null) {
  return typeof summary.message === "string" ? summary.message : fallback || undefined;
}

function revisionAction(source?: string | null) {
  if (source === "home_generate") return "Generated season";
  if (source === "manual_save") return "Saved revision";
  if (source === "restore") return "Restored revision";
  return "Saved revision";
}

function seasonKey(providerLeagueId: string, season: number) {
  return `${providerLeagueId}:${season}`;
}

async function readPastChampions(auth: NonNullable<Awaited<ReturnType<typeof getAuthenticatedClient>>>, scheduleId: string): Promise<PastChampion[]> {
  const { data: seasons } = await auth.supabase
    .from("league_seasons")
    .select("id,provider,provider_league_id,season,league_name")
    .eq("schedule_id", scheduleId)
    .order("season", { ascending: false })
    .limit(8);
  const seasonRows = seasons ?? [];
  if (!seasonRows.length) return [];
  const { data: teams } = await auth.supabase
    .from("league_team_history")
    .select("league_season_id,team_name,manager_name,wins,losses,ties,points_for,final_standing")
    .in("league_season_id", seasonRows.map((season) => season.id))
    .eq("final_standing", 1);
  const championBySeason = new Map((teams ?? []).map((team) => [team.league_season_id, team]));
  const champions: PastChampion[] = [];
  for (const season of seasonRows) {
    const champion = championBySeason.get(season.id);
    if (!champion) continue;
    champions.push({
      season: season.season,
      provider: season.provider,
      providerLeagueId: season.provider_league_id,
      leagueName: season.league_name,
      teamName: champion.team_name,
      managerName: champion.manager_name ?? undefined,
      wins: champion.wins ?? undefined,
      losses: champion.losses ?? undefined,
      ties: champion.ties ?? undefined,
      pointsFor: champion.points_for == null ? undefined : Number(champion.points_for),
    });
  }
  return champions;
}

async function assertScheduleOwner(auth: NonNullable<Awaited<ReturnType<typeof getAuthenticatedClient>>>, scheduleId: string) {
  const { data } = await auth.supabase.from("schedules").select("id").eq("id", scheduleId).maybeSingle();
  return Boolean(data?.id);
}

async function persistLeagueHistory(scheduleId: string, draft: LeagueHistoryDraft) {
  const admin = createAdminClient();
  if (!admin) return { rowsWritten: 0, warnings: ["History scanned, but server Supabase admin access is not configured for table population."] };
  if (!draft.leagueSeasons.length) return { rowsWritten: 0, warnings: draft.warnings };

  const { data: seasonRows, error: seasonError } = await admin
    .from("league_seasons")
    .upsert(draft.leagueSeasons, { onConflict: "schedule_id,provider,provider_league_id,season" })
    .select("id,provider_league_id,season");
  if (seasonError) throw seasonError;
  const idBySeason = new Map((seasonRows ?? []).map((season) => [seasonKey(season.provider_league_id, season.season), season.id]));

  const teamRows = draft.teamHistory.map((row) => {
    const { providerLeagueId, season, ...rest } = row;
    const leagueSeasonId = idBySeason.get(seasonKey(providerLeagueId, season));
    return leagueSeasonId ? { league_season_id: leagueSeasonId, ...rest } : null;
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  const scheduleRows = draft.scheduleHistory.map((row) => {
    const { providerLeagueId, season, ...rest } = row;
    const leagueSeasonId = idBySeason.get(seasonKey(providerLeagueId, season));
    return leagueSeasonId ? { league_season_id: leagueSeasonId, ...rest } : null;
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  const ownershipRows = draft.ownershipHistory.map((row) => {
    const { providerLeagueId, season, ...rest } = row;
    const leagueSeasonId = idBySeason.get(seasonKey(providerLeagueId, season));
    return leagueSeasonId ? { league_season_id: leagueSeasonId, ...rest } : null;
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (draft.playerCatalog.length) {
    const { error } = await admin.from("player_catalog").upsert(draft.playerCatalog, { onConflict: "id" });
    if (error) throw error;
  }
  if (teamRows.length) {
    const { error } = await admin.from("league_team_history").upsert(teamRows, { onConflict: "league_season_id,league_team_id" });
    if (error) throw error;
  }
  if (scheduleRows.length) {
    const { error } = await admin.from("league_schedule_history").upsert(scheduleRows, { onConflict: "league_season_id,week,provider_matchup_id" });
    if (error) throw error;
  }
  if (ownershipRows.length) {
    const { error } = await admin.from("player_ownership_history").upsert(ownershipRows, { onConflict: "league_season_id,week,canonical_player_id" });
    if (error) throw error;
  }
  return {
    rowsWritten: draft.leagueSeasons.length + teamRows.length + scheduleRows.length + ownershipRows.length,
    warnings: draft.warnings,
  };
}

function dataFoundFromDraft(draft: LeagueHistoryDraft): ImportDataFound {
  return {
    availableHistoryYears: draft.leagueSeasons.map((season) => season.season).sort((left, right) => right - left),
    blockedHistoryYears: [],
    hasDraftData: true,
    hasRosterData: draft.teamHistory.length > 0,
    hasPlayerData: draft.ownershipHistory.length > 0,
    hasScoreSync: draft.scheduleHistory.length > 0,
  };
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ events: [] }, { status: 401 });
  const scheduleId = new URL(request.url).searchParams.get("scheduleId") || "";
  if (!UUID.test(scheduleId)) return NextResponse.json({ error: "Choose a saved season." }, { status: 400 });

  const events: ImportHistoryEvent[] = [];

  const { data: imports } = await auth.supabase
    .from("import_runs")
    .select("id,provider,status,sanitized_error,summary_json,created_at,committed_at")
    .eq("schedule_id", scheduleId)
    .order("created_at", { ascending: false })
    .limit(8);

  for (const item of imports ?? []) {
    const summary = readSummary(item.summary_json);
    events.push({
      id: item.id,
      provider: item.provider,
      action: typeof summary.action === "string" ? summary.action : "Imported data",
      status: item.status,
      createdAt: item.committed_at || item.created_at,
      week: typeof summary.week === "number" ? summary.week : undefined,
      seasonYear: typeof summary.seasonYear === "number" ? summary.seasonYear : undefined,
      message: eventMessage(summary, item.sanitized_error),
      revisionId: typeof summary.revisionId === "string" ? summary.revisionId : undefined,
    });
  }

  const { data: links } = await auth.supabase
    .from("external_league_links")
    .select("id,provider,provider_league_id,sync_status,last_sync_at,sanitized_error,metadata_json,created_at")
    .eq("schedule_id", scheduleId);

  for (const link of links ?? []) {
    const metadata = readSummary(link.metadata_json);
    events.push({
      id: `sync-${link.id}`,
      provider: link.provider,
      action: "Platform score sync",
      status: link.sync_status,
      createdAt: link.last_sync_at || link.created_at,
      seasonYear: typeof metadata.seasonYear === "number" ? metadata.seasonYear : undefined,
      message: link.sanitized_error || `League ${link.provider_league_id}`,
    });
  }

  const { data: revisions } = await auth.supabase
    .from("schedule_revisions")
    .select("id,source,revision_number,summary_json,created_at")
    .eq("schedule_id", scheduleId)
    .order("created_at", { ascending: false })
    .limit(5);

  for (const revision of revisions ?? []) {
    const summary = readSummary(revision.summary_json);
    events.push({
      id: `revision-${revision.id}`,
      provider: "leagueweaver",
      action: revisionAction(revision.source),
      status: "saved",
      createdAt: revision.created_at,
      message: `Revision ${revision.revision_number}`,
      revisionId: revision.id,
      seasonYear: typeof summary.seasonYear === "number" ? summary.seasonYear : undefined,
    });
  }

  events.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const champions = await readPastChampions(auth, scheduleId);
  return NextResponse.json({ events: events.slice(0, 10), champions });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a provider, league, and season." }, { status: 400 });
  try {
    if (parsed.data.provider === "espn") {
      const leagueId = parseEspnLeagueId(parsed.data.identifier);
      if (!leagueId) return NextResponse.json({ error: "Enter an ESPN league URL or ID." }, { status: 400 });
      const auth = parsed.data.swid && parsed.data.espnS2 ? { swid: parsed.data.swid, espnS2: parsed.data.espnS2 } : undefined;
      return NextResponse.json(await scanEspnHistory(leagueId, parsed.data.seasonYear, auth));
    }
    const { leagueId } = await resolveSleeperLeagueId(parsed.data.identifier, parsed.data.seasonYear);
    if (parsed.data.populate && parsed.data.scheduleId) {
      const auth = await getAuthenticatedClient();
      if (!auth) return NextResponse.json({ error: "Sign in before saving league history." }, { status: 401 });
      if (!(await assertScheduleOwner(auth, parsed.data.scheduleId))) return NextResponse.json({ error: "Choose a saved season you own." }, { status: 403 });
      const draft = await collectSleeperLeagueHistory(parsed.data.scheduleId, leagueId, { weeks: [1] });
      const persisted = await persistLeagueHistory(parsed.data.scheduleId, draft);
      return NextResponse.json({ ...dataFoundFromDraft(draft), champions: draft.champions, rowsWritten: persisted.rowsWritten, warnings: persisted.warnings });
    }
    return NextResponse.json(await scanSleeperHistory(leagueId));
  } catch {
    return NextResponse.json({ error: "History could not be scanned for this league." }, { status: 400 });
  }
}
