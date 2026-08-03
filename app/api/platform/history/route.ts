import { NextResponse } from "next/server";
import { z } from "zod";
import {
  collectEspnLeagueHistory,
  parseEspnLeagueId,
  scanEspnHistory,
  type EspnAuthInput,
} from "@/lib/platform/espn";
import { decryptSecret } from "@/lib/platform/crypto";
import { collectSleeperLeagueHistory, resolveSleeperLeagueId, scanSleeperHistory } from "@/lib/platform/sleeper";
import { dataFoundFromDraft, persistLeagueHistory } from "@/lib/platform/historyPersistence";
import { getAuthenticatedClient } from "@/lib/supabase/auth";
import type { ImportHistoryEvent, PastChampion } from "@/lib/types";

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
const HISTORY_PAGE_SIZE = 1000;
const CATALOG_LOOKUP_SIZE = 500;

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

function cleanError(message: string) {
  return message
    .replace(/espn_s2=[^;\s]+/gi, "espn_s2=[redacted]")
    .replace(/SWID=[^;\s]+/gi, "SWID=[redacted]")
    .slice(0, 500);
}

async function loadSavedEspnAuth(
  auth: NonNullable<Awaited<ReturnType<typeof getAuthenticatedClient>>>,
  scheduleId: string,
  leagueId: string,
): Promise<EspnAuthInput | undefined> {
  const { data: link } = await auth.supabase
    .from("external_league_links")
    .select("id")
    .eq("schedule_id", scheduleId)
    .eq("provider", "espn")
    .eq("provider_league_id", leagueId)
    .maybeSingle();
  if (!link) return undefined;
  const { data: credentials } = await auth.supabase
    .from("platform_provider_credentials")
    .select("credential_json")
    .eq("external_league_link_id", link.id)
    .maybeSingle();
  const payload = credentials?.credential_json as
    | { swid?: string; espnS2?: string }
    | undefined;
  if (!payload?.swid || !payload.espnS2) return undefined;
  return {
    swid: decryptSecret(payload.swid),
    espnS2: decryptSecret(payload.espnS2),
  };
}

type HistoryBrowserSeason = {
  id: string;
  season: number;
  provider: "espn" | "sleeper";
  providerLeagueId: string;
  leagueName: string;
  teamCount: number;
  rosterPositions: string[];
  regularSeasonWeekCount?: number;
  playoffSettings: Record<string, unknown>;
  teams: Array<{
    leagueTeamId: string;
    providerRosterOrTeamId: string;
    teamName: string;
    managerName?: string;
    divisionId?: string;
    conferenceId?: string;
    finalStanding?: number;
    wins?: number;
    losses?: number;
    ties?: number;
    pointsFor?: number;
    pointsAgainst?: number;
  }>;
  games: Array<{
    week: number;
    providerMatchupId: string;
    homeLeagueTeamId: string;
    awayLeagueTeamId: string;
    homeScore?: number;
    awayScore?: number;
    status: string;
    finalLockAt?: string;
  }>;
  playerRows: Array<{
    week: number;
    canonicalPlayerId: string;
    leagueTeamId: string;
    providerPlayerId: string;
    playerName: string;
    position: string;
    nflTeam?: string;
    lineupStatus: string;
    lineupSlot: string;
    fantasyPoints: number;
  }>;
};

type OwnershipHistoryRow = {
  league_season_id: string;
  week: number;
  canonical_player_id: string;
  league_team_id: string;
  provider_player_id: string;
  nfl_team_at_time?: string | null;
  position_at_time?: string | null;
  roster_status: string;
  lineup_slot: string;
  fantasy_points?: number | string | null;
};

async function readOwnershipRows(auth: NonNullable<Awaited<ReturnType<typeof getAuthenticatedClient>>>, seasonIds: string[]) {
  const rows: OwnershipHistoryRow[] = [];
  for (let from = 0; ; from += HISTORY_PAGE_SIZE) {
    const { data, error } = await auth.supabase
      .from("player_ownership_history")
      .select("league_season_id,week,canonical_player_id,league_team_id,provider_player_id,nfl_team_at_time,position_at_time,roster_status,lineup_slot,fantasy_points")
      .in("league_season_id", seasonIds)
      .order("week", { ascending: true })
      .range(from, from + HISTORY_PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as OwnershipHistoryRow[]));
    if (!data || data.length < HISTORY_PAGE_SIZE) break;
  }
  return rows;
}

async function readCatalogRows(auth: NonNullable<Awaited<ReturnType<typeof getAuthenticatedClient>>>, playerIds: string[]) {
  const catalogById = new Map<string, { canonical_name?: string | null; position?: string | null; nfl_team?: string | null }>();
  for (let index = 0; index < playerIds.length; index += CATALOG_LOOKUP_SIZE) {
    const { data } = await auth.supabase
      .from("player_catalog")
      .select("id,canonical_name,position,nfl_team")
      .in("id", playerIds.slice(index, index + CATALOG_LOOKUP_SIZE));
    for (const row of data ?? []) catalogById.set(row.id, row);
  }
  return catalogById;
}

async function readHistoryBrowser(auth: NonNullable<Awaited<ReturnType<typeof getAuthenticatedClient>>>, scheduleId: string): Promise<HistoryBrowserSeason[]> {
  try {
    const { data: seasons, error: seasonsError } = await auth.supabase
      .from("league_seasons")
      .select("id,provider,provider_league_id,season,league_name,team_count,roster_positions,regular_season_week_count,playoff_settings")
      .eq("schedule_id", scheduleId)
      .order("season", { ascending: false })
      .limit(8);
    if (seasonsError || !seasons?.length) return [];
    const seasonIds = seasons.map((season) => season.id);
    const [{ data: teams }, { data: games }, ownership] = await Promise.all([
      auth.supabase
        .from("league_team_history")
        .select("league_season_id,league_team_id,provider_roster_or_team_id,team_name,manager_name,division_id,conference_id,final_standing,wins,losses,ties,points_for,points_against")
        .in("league_season_id", seasonIds),
      auth.supabase
        .from("league_schedule_history")
        .select("league_season_id,week,provider_matchup_id,home_league_team_id,away_league_team_id,home_score,away_score,status,final_lock_at")
        .in("league_season_id", seasonIds)
        .order("week", { ascending: true }),
      readOwnershipRows(auth, seasonIds),
    ]);
    const playerIds = [...new Set((ownership ?? []).map((row) => row.canonical_player_id).filter(Boolean))];
    const catalogById = playerIds.length ? await readCatalogRows(auth, playerIds) : new Map<string, { canonical_name?: string | null; position?: string | null; nfl_team?: string | null }>();
    const teamsBySeason = new Map<string, NonNullable<typeof teams>>();
    for (const row of teams ?? []) teamsBySeason.set(row.league_season_id, [...(teamsBySeason.get(row.league_season_id) ?? []), row]);
    const gamesBySeason = new Map<string, NonNullable<typeof games>>();
    for (const row of games ?? []) gamesBySeason.set(row.league_season_id, [...(gamesBySeason.get(row.league_season_id) ?? []), row]);
    const ownershipBySeason = new Map<string, NonNullable<typeof ownership>>();
    for (const row of ownership ?? []) ownershipBySeason.set(row.league_season_id, [...(ownershipBySeason.get(row.league_season_id) ?? []), row]);

    return seasons.map((season): HistoryBrowserSeason => ({
      id: season.id,
      season: season.season,
      provider: season.provider,
      providerLeagueId: season.provider_league_id,
      leagueName: season.league_name,
      teamCount: season.team_count,
      rosterPositions: season.roster_positions ?? [],
      regularSeasonWeekCount: season.regular_season_week_count ?? undefined,
      playoffSettings: season.playoff_settings ?? {},
      teams: (teamsBySeason.get(season.id) ?? []).map((team) => ({
        leagueTeamId: team.league_team_id,
        providerRosterOrTeamId: team.provider_roster_or_team_id,
        teamName: team.team_name,
        managerName: team.manager_name ?? undefined,
        divisionId: team.division_id ?? undefined,
        conferenceId: team.conference_id ?? undefined,
        finalStanding: team.final_standing ?? undefined,
        wins: team.wins ?? undefined,
        losses: team.losses ?? undefined,
        ties: team.ties ?? undefined,
        pointsFor: team.points_for == null ? undefined : Number(team.points_for),
        pointsAgainst: team.points_against == null ? undefined : Number(team.points_against),
      })),
      games: (gamesBySeason.get(season.id) ?? []).map((game) => ({
        week: game.week,
        providerMatchupId: game.provider_matchup_id,
        homeLeagueTeamId: game.home_league_team_id,
        awayLeagueTeamId: game.away_league_team_id,
        homeScore: game.home_score == null ? undefined : Number(game.home_score),
        awayScore: game.away_score == null ? undefined : Number(game.away_score),
        status: game.status,
        finalLockAt: game.final_lock_at ?? undefined,
      })),
      playerRows: (ownershipBySeason.get(season.id) ?? []).map((row) => {
        const catalog = catalogById.get(row.canonical_player_id);
        return {
          week: row.week,
          canonicalPlayerId: row.canonical_player_id,
          leagueTeamId: row.league_team_id,
          providerPlayerId: row.provider_player_id,
          playerName: catalog?.canonical_name || row.provider_player_id,
          position: row.position_at_time || catalog?.position || "UNKNOWN",
          nflTeam: row.nfl_team_at_time || catalog?.nfl_team || undefined,
          lineupStatus: row.roster_status,
          lineupSlot: row.lineup_slot,
          fantasyPoints: Number(row.fantasy_points ?? 0),
        };
      }),
    }));
  } catch {
    return [];
  }
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
  const includeBrowser = new URL(request.url).searchParams.get("include") === "browser";
  const history = includeBrowser ? await readHistoryBrowser(auth, scheduleId) : undefined;
  return NextResponse.json({ events: events.slice(0, 10), champions, history });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a provider, league, and season." }, { status: 400 });
  try {
    if (parsed.data.provider === "espn") {
      const leagueId = parseEspnLeagueId(parsed.data.identifier);
      if (!leagueId) return NextResponse.json({ error: "Enter an ESPN league URL or ID." }, { status: 400 });
      const requestAuth = parsed.data.swid && parsed.data.espnS2 ? { swid: parsed.data.swid, espnS2: parsed.data.espnS2 } : undefined;
      if (parsed.data.populate && parsed.data.scheduleId) {
        const userAuth = await getAuthenticatedClient();
        if (!userAuth) return NextResponse.json({ error: "Sign in before saving league history." }, { status: 401 });
        if (!(await assertScheduleOwner(userAuth, parsed.data.scheduleId))) return NextResponse.json({ error: "Choose a saved season you own." }, { status: 403 });
        const auth = requestAuth ?? await loadSavedEspnAuth(userAuth, parsed.data.scheduleId, leagueId);
        const draft = await collectEspnLeagueHistory(parsed.data.scheduleId, leagueId, parsed.data.seasonYear, auth);
        const persisted = await persistLeagueHistory(parsed.data.scheduleId, draft);
        return NextResponse.json({ ...dataFoundFromDraft(draft), champions: draft.champions, rowsWritten: persisted.rowsWritten, warnings: persisted.warnings });
      }
      const savedAuth =
        parsed.data.scheduleId && UUID.test(parsed.data.scheduleId)
          ? await getAuthenticatedClient().then((userAuth) =>
              userAuth
                ? loadSavedEspnAuth(userAuth, parsed.data.scheduleId!, leagueId)
                : undefined,
            )
          : undefined;
      const auth = requestAuth ?? savedAuth;
      return NextResponse.json(await scanEspnHistory(leagueId, parsed.data.seasonYear, auth));
    }
    const { leagueId } = await resolveSleeperLeagueId(parsed.data.identifier, parsed.data.seasonYear);
    if (parsed.data.populate && parsed.data.scheduleId) {
      const auth = await getAuthenticatedClient();
      if (!auth) return NextResponse.json({ error: "Sign in before saving league history." }, { status: 401 });
      if (!(await assertScheduleOwner(auth, parsed.data.scheduleId))) return NextResponse.json({ error: "Choose a saved season you own." }, { status: 403 });
      const draft = await collectSleeperLeagueHistory(parsed.data.scheduleId, leagueId);
      const persisted = await persistLeagueHistory(parsed.data.scheduleId, draft);
      return NextResponse.json({ ...dataFoundFromDraft(draft), champions: draft.champions, rowsWritten: persisted.rowsWritten, warnings: persisted.warnings });
    }
    return NextResponse.json(await scanSleeperHistory(leagueId));
  } catch (caught) {
    return NextResponse.json(
      {
        error: cleanError(
          caught instanceof Error
            ? caught.message
            : "History could not be scanned for this league.",
        ),
      },
      { status: 400 },
    );
  }
}
