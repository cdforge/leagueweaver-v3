import "server-only";
import { buildEspnLeagueHistoryDraft, espnPublicUnreliableHistoryYears, type LeagueHistoryDraft } from "@/lib/platform/history";
import { deriveEspnTemplates, mapEspnPlayerWeekStats, type EspnMatchupPayload, type EspnPlayerEntryPayload, type LineupTemplate, type PlayerWeekStat, type RosterTemplate } from "@/lib/playerData";
import { mapEspnTransactions, type EspnTransactionPayload, type NormalizedTransaction } from "@/lib/transactions";
import { fetchProviderJson } from "./request";
import type { GeneratedSchedule, ImportDataFound, PlatformSyncResult, PlatformSyncScoreRow, PriorSeasonFinishEntry } from "@/lib/types";

const ESPN_BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl";

export interface EspnAuthInput {
  swid?: string;
  espnS2?: string;
}

export interface EspnMember { id: string; displayName?: string; firstName?: string; lastName?: string }
interface EspnTeamRecord { overall?: { wins?: number; losses?: number; ties?: number; pointsFor?: number } }
export interface EspnTeam { id: number; name?: string; location?: string; nickname?: string; abbrev?: string; logo?: string; primaryOwner?: string; owners?: string[]; divisionId?: number; playoffSeed?: number; rankCalculatedFinal?: number; rankFinal?: number; record?: EspnTeamRecord }
export interface EspnScheduleSettings {
  divisions?: Array<{ id: number; name?: string; size?: number }>;
  matchupPeriodCount?: number;
  matchupPeriodLength?: number;
  playoffMatchupPeriodLength?: number;
  playoffReseed?: boolean;
  playoffSeedingRule?: string;
  playoffSeedingRuleBy?: number;
  playoffTeamCount?: number;
  variablePlayoffMatchupPeriodLength?: boolean;
}

export interface EspnLeague {
  id: number;
  seasonId?: number;
  members?: EspnMember[];
  teams?: EspnTeam[];
  schedule?: EspnMatchup[];
  draftDetail?: { drafted?: boolean; inProgress?: boolean; picks?: unknown[] };
  settings?: { name?: string; scheduleSettings?: EspnScheduleSettings; rosterSettings?: { lineupSlotCounts?: Record<string, number> } };
  transactions?: EspnTransactionPayload[];
}

interface EspnMatchupTeam { teamId?: number; totalPoints?: number }
interface EspnMatchupSide extends EspnMatchupTeam { rosterForCurrentScoringPeriod?: { entries?: EspnPlayerEntryPayload[] } }
interface EspnMatchup { id: number; matchupPeriodId: number; home?: EspnMatchupSide; away?: EspnMatchupSide }

export function parseEspnLeagueId(identifier: string) {
  if (/^\d{4,}$/.test(identifier)) return identifier;
  try {
    const url = new URL(identifier);
    return url.searchParams.get("leagueId") || url.pathname.match(/leagueId\/(\d+)/i)?.[1] || "";
  } catch {
    return "";
  }
}

function espnHeaders(auth?: EspnAuthInput) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth?.swid && auth.espnS2) headers.Cookie = `SWID=${auth.swid}; espn_s2=${auth.espnS2}`;
  return headers;
}

export async function fetchEspnLeague(leagueId: string, seasonYear: number, views: string[], auth?: EspnAuthInput, params?: Record<string, string | number>) {
  const searchParams = new URLSearchParams();
  for (const view of views) searchParams.append("view", view);
  for (const [key, value] of Object.entries(params ?? {})) searchParams.set(key, String(value));
  const { response, json: league } = await fetchProviderJson<EspnLeague & { messages?: string[]; details?: { message?: string }[] }>(
    `${ESPN_BASE}/seasons/${seasonYear}/segments/0/leagues/${leagueId}?${searchParams}`,
    { headers: espnHeaders(auth) },
  );
  if (!response.ok || league?.messages?.length || league?.details?.length) {
    const message = league?.messages?.[0] || league?.details?.[0]?.message || "We couldn't load that ESPN league.";
    throw new Error(message);
  }
  return league as EspnLeague;
}

export async function scanEspnHistory(leagueId: string, seasonYear: number, auth?: EspnAuthInput): Promise<ImportDataFound> {
  const startYear = Math.max(2017, seasonYear - 8);
  const years = Array.from({ length: seasonYear - startYear + 1 }, (_, index) => startYear + index);
  const publicUnreliableYears = auth ? [] : espnPublicUnreliableHistoryYears(seasonYear);
  const queryYears = years.filter((year) => !publicUnreliableYears.includes(year));
  const results = await Promise.allSettled(queryYears.map(async (year) => {
    const league = await fetchEspnLeague(leagueId, year, ["mTeam", "mStandings", "mDraftDetail"], auth);
    return { year, league };
  }));
  const availableHistoryYears: number[] = [];
  const blockedHistoryYears: number[] = [...publicUnreliableYears];
  let hasDraftData = false;
  for (const result of results) {
    const year = queryYears[results.indexOf(result)];
    if (result.status === "fulfilled") {
      availableHistoryYears.push(result.value.year);
      hasDraftData ||= Boolean(result.value.league.draftDetail?.picks?.length);
    } else {
      blockedHistoryYears.push(year);
    }
  }
  return {
    availableHistoryYears,
    blockedHistoryYears,
    hasDraftData,
    hasRosterData: false,
    hasPlayerData: true,
    hasScoreSync: true,
  };
}

export async function collectEspnLeagueHistory(scheduleId: string, leagueId: string, seasonYear: number, auth?: EspnAuthInput): Promise<LeagueHistoryDraft> {
  const dataFound = await scanEspnHistory(leagueId, seasonYear, auth);
  const years = dataFound.availableHistoryYears.filter((year) => year <= seasonYear);
  const results = await Promise.allSettled(years.map(async (year) => {
    const league = await fetchEspnLeague(leagueId, year, ["mTeam", "mStandings", "mSettings", "mMatchup", "mScoreboard"], auth);
    const weeks = [...new Set((league.schedule ?? []).map((matchup) => matchup.matchupPeriodId).filter((week) => week >= 1 && week <= 18))];
    const playerWeekResults = await Promise.allSettled(weeks.map((week) => fetchEspnLeague(leagueId, year, ["mMatchup", "mRoster", "mBoxscore"], auth, { scoringPeriodId: week })));
    return {
      league,
      playerWeeks: playerWeekResults.flatMap((result) => result.status === "fulfilled" ? [result.value] : []),
      playerWarnings: playerWeekResults.flatMap((result, index) => result.status === "rejected" ? [`ESPN ${year} Week ${weeks[index]} player rows could not be loaded.`] : []),
    };
  }));
  const seasons = results.flatMap((result) => result.status === "fulfilled" ? [{ league: result.value.league, playerWeeks: result.value.playerWeeks }] : []);
  const warnings = results.flatMap((result, index) => result.status === "fulfilled" ? result.value.playerWarnings : [`ESPN ${years[index]} history rows could not be loaded.`]);
  const draft = buildEspnLeagueHistoryDraft(scheduleId, seasons);
  return { ...draft, warnings: [...draft.warnings, ...warnings] };
}

function positiveRank(value?: number) {
  return typeof value === "number" && value > 0 ? value : undefined;
}

/**
 * Last season's finish for seeding a new schedule. Public leagues only — reuses the
 * same no-cookie path as the import. ESPN keeps the same leagueId across seasons, so
 * we read the prior year (seasonYear - 1) and return each team's regular-season seed
 * and final (playoff-inclusive) standing, keyed by owner id with the team id as a
 * fallback. Teams with no match this season are treated as newbies by the caller.
 */
export async function fetchEspnPriorFinish(leagueId: string, seasonYear: number, auth?: EspnAuthInput): Promise<PriorSeasonFinishEntry[]> {
  const league = await fetchEspnLeague(leagueId, seasonYear - 1, ["mTeam", "mStandings"], auth);
  const teams = league.teams ?? [];
  if (teams.length === 0) return [];
  // Prefer ESPN's own regular-season seed when every team has one; otherwise derive
  // the order from final records (wins, then points-for) so we never hand back
  // duplicate ranks from a half-populated payload.
  const everyTeamSeeded = teams.every((team) => positiveRank(team.playoffSeed) != null)
    && new Set(teams.map((team) => team.playoffSeed)).size === teams.length;
  const recordOrder = [...teams].sort((left, right) =>
    (right.record?.overall?.wins ?? 0) - (left.record?.overall?.wins ?? 0) ||
    (right.record?.overall?.pointsFor ?? 0) - (left.record?.overall?.pointsFor ?? 0) ||
    left.id - right.id,
  );
  const regularSeasonRankByTeam = new Map<number, number>(
    everyTeamSeeded
      ? teams.map((team) => [team.id, team.playoffSeed as number])
      : recordOrder.map((team, index) => [team.id, index + 1]),
  );
  return teams.map((team) => ({
    ownerId: team.primaryOwner || team.owners?.[0],
    providerTeamId: String(team.id),
    regularSeasonRank: regularSeasonRankByTeam.get(team.id),
    playoffRank: positiveRank(team.rankCalculatedFinal) ?? positiveRank(team.rankFinal),
  }));
}

function espnProviderId(leagueId: string, teamId?: number) {
  return teamId == null ? "" : `espn-${leagueId}-${teamId}`;
}

export function mapEspnScores(schedule: GeneratedSchedule, league: EspnLeague): PlatformSyncResult {
  const connection = schedule.setup.platformConnection;
  const leagueId = connection?.providerLeagueId || String(league.id);
  // Each team's total fantasy points, per matchup period. A LeagueWeaver game
  // takes each of its two teams' weekly points — the exact values a commissioner
  // would type by hand — regardless of who they faced in the fantasy platform.
  // (LeagueWeaver generates its own matchups, so joining on the fantasy pairing
  // would leave a generated schedule almost entirely unscored.)
  const pointsByTeamWeek = new Map<string, number>();
  for (const matchup of league.schedule ?? []) {
    for (const side of [matchup.home, matchup.away]) {
      if (side?.teamId == null || side.totalPoints == null) continue;
      pointsByTeamWeek.set(`${matchup.matchupPeriodId}:${espnProviderId(leagueId, side.teamId)}`, side.totalPoints);
    }
  }
  const rows: PlatformSyncScoreRow[] = [];
  const unmatched: PlatformSyncResult["unmatched"] = [];
  for (const week of schedule.weeks) {
    for (const game of week.games) {
      const home = schedule.setup.teams.find((team) => team.id === game.homeTeamId);
      const away = schedule.setup.teams.find((team) => team.id === game.awayTeamId);
      if (!home?.providerId || !away?.providerId) continue;
      const homeScore = pointsByTeamWeek.get(`${week.weekNumber}:${home.providerId}`);
      const awayScore = pointsByTeamWeek.get(`${week.weekNumber}:${away.providerId}`);
      if (homeScore == null || awayScore == null) {
        unmatched.push({ week: week.weekNumber, providerHomeId: home.providerId, providerAwayId: away.providerId, reason: "No ESPN scores were posted for this week yet." });
        continue;
      }
      rows.push({ gameId: game.id, week: week.weekNumber, homeTeamId: home.id, awayTeamId: away.id, homeScore, awayScore, confidence: "high", source: "espn" });
    }
  }
  return { rows, unmatched, warnings: unmatched.length ? ["Some weeks had no ESPN scores yet — refresh once those fantasy weeks are final."] : [], syncedAt: new Date().toISOString() };
}

export function mapEspnPlayers(schedule: GeneratedSchedule, league: EspnLeague, opts?: { weeks?: number[] }): PlayerWeekStat[] {
  const connection = schedule.setup.platformConnection;
  const leagueId = connection?.providerLeagueId || String(league.id);
  return mapEspnPlayerWeekStats({
    scheduleId: schedule.id,
    providerLeagueId: leagueId,
    season: league.seasonId ?? connection?.seasonYear ?? new Date().getFullYear(),
    teams: schedule.setup.teams,
    schedule: (league.schedule ?? []) as EspnMatchupPayload[],
    weeks: opts?.weeks,
  });
}

export function mapEspnTemplates(league: EspnLeague): { lineupTemplate: LineupTemplate; rosterTemplate: RosterTemplate } {
  return deriveEspnTemplates({
    season: league.seasonId ?? new Date().getFullYear(),
    lineupSlotCounts: league.settings?.rosterSettings?.lineupSlotCounts ?? {},
  });
}

export async function fetchEspnTransactions(schedule: GeneratedSchedule, week: number): Promise<{ rows: NormalizedTransaction[]; warnings: string[] }> {
  const connection = schedule.setup.platformConnection;
  if (!connection?.providerLeagueId) throw new Error("This season is not connected to ESPN.");
  const league = await fetchEspnLeague(connection.providerLeagueId, connection.seasonYear, ["mTransactions2"], undefined, { scoringPeriodId: week });
  return mapEspnTransactions({
    providerLeagueId: connection.providerLeagueId,
    week,
    teams: schedule.setup.teams,
    transactions: league.transactions,
  });
}
