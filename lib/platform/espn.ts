import "server-only";
import { deriveEspnTemplates, mapEspnPlayerWeekStats, type EspnMatchupPayload, type EspnPlayerEntryPayload, type LineupTemplate, type PlayerWeekStat, type RosterTemplate } from "@/lib/playerData";
import type { GeneratedSchedule, ImportDataFound, PlatformSyncResult, PlatformSyncScoreRow } from "@/lib/types";

const ESPN_BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl";

export interface EspnAuthInput {
  swid?: string;
  espnS2?: string;
}

export interface EspnMember { id: string; displayName?: string; firstName?: string; lastName?: string }
export interface EspnTeam { id: number; name?: string; location?: string; nickname?: string; abbrev?: string; logo?: string; primaryOwner?: string; owners?: string[]; divisionId?: number }
export interface EspnLeague {
  id: number;
  seasonId?: number;
  members?: EspnMember[];
  teams?: EspnTeam[];
  schedule?: EspnMatchup[];
  draftDetail?: { drafted?: boolean; inProgress?: boolean; picks?: unknown[] };
  settings?: { name?: string; scheduleSettings?: { divisions?: Array<{ id: number; name?: string }> }; rosterSettings?: { lineupSlotCounts?: Record<string, number> } };
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
  const response = await fetch(`${ESPN_BASE}/seasons/${seasonYear}/segments/0/leagues/${leagueId}?${searchParams}`, {
    headers: espnHeaders(auth),
    cache: "no-store",
  });
  const league = await response.json().catch(() => null) as (EspnLeague & { messages?: string[]; details?: { message?: string }[] }) | null;
  if (!response.ok || league?.messages?.length || league?.details?.length) {
    const message = league?.messages?.[0] || league?.details?.[0]?.message || "We couldn't load that ESPN league.";
    throw new Error(message);
  }
  return league as EspnLeague;
}

export async function scanEspnHistory(leagueId: string, seasonYear: number, auth?: EspnAuthInput): Promise<ImportDataFound> {
  const startYear = Math.max(2017, seasonYear - 8);
  const years = Array.from({ length: seasonYear - startYear + 1 }, (_, index) => startYear + index);
  const results = await Promise.allSettled(years.map(async (year) => {
    const league = await fetchEspnLeague(leagueId, year, ["mTeam", "mStandings", "mDraftDetail"], auth);
    return { year, league };
  }));
  const availableHistoryYears: number[] = [];
  const blockedHistoryYears: number[] = [];
  let hasDraftData = false;
  for (const result of results) {
    const year = years[results.indexOf(result)];
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
