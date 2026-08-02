import "server-only";
import { deriveSleeperTemplates, mapSleeperPlayerWeekStats, type LineupTemplate, type PlayerWeekStat, type RosterTemplate } from "@/lib/playerData";
import { fetchProviderJson } from "./request";
import type { GeneratedSchedule, ImportDataFound, PlatformSyncResult, PlatformSyncScoreRow } from "@/lib/types";

const SLEEPER_API = "https://api.sleeper.app/v1";

export interface SleeperLeague { league_id: string; name?: string; season?: string; avatar?: string | null; draft_id?: string | null; previous_league_id?: string | null; roster_positions?: string[]; settings?: { taxi_slots?: number; best_ball?: number } }
export interface SleeperUser { user_id: string; display_name?: string; avatar?: string | null; metadata?: { team_name?: string } }
export interface SleeperRoster { roster_id: number; owner_id?: string | null; settings?: { division?: number } }
interface SleeperMatchup { roster_id: number; matchup_id?: number; points?: number; players?: string[]; starters?: string[]; players_points?: Record<string, number> }

export async function sleeperFetch<T>(path: string): Promise<T> {
  const { response, json } = await fetchProviderJson<T>(`${SLEEPER_API}${path}`);
  if (!response.ok) throw new Error(response.status === 404 ? "We couldn't find that Sleeper league or account." : "Sleeper is unavailable right now. Try again in a moment.");
  return json as T;
}

export function sleeperAvatarUrl(value?: string | null) {
  return value ? `https://sleepercdn.com/avatars/thumbs/${value}` : undefined;
}

export async function resolveSleeperLeagueId(identifier: string, seasonYear: number) {
  if (/^\d{5,}$/.test(identifier)) return { leagueId: identifier, warnings: [] as string[] };
  const account = await sleeperFetch<{ user_id?: string }>(`/user/${encodeURIComponent(identifier)}`);
  if (!account.user_id) throw new Error("We couldn't find that Sleeper username.");
  const leagues = await sleeperFetch<SleeperLeague[]>(`/user/${account.user_id}/leagues/nfl/${seasonYear}`);
  if (!leagues.length) throw new Error(`No Sleeper leagues were found for ${seasonYear}.`);
  return {
    leagueId: leagues[0].league_id,
    warnings: leagues.length > 1 ? [`This account has ${leagues.length} leagues. We previewed ${leagues[0].name || "the first one"}; use a league ID to choose another.`] : [],
  };
}

export async function scanSleeperHistory(leagueId: string): Promise<ImportDataFound> {
  const years: number[] = [];
  let current: string | null | undefined = leagueId;
  for (let index = 0; index < 8 && current; index += 1) {
    try {
      const league: SleeperLeague = await sleeperFetch<SleeperLeague>(`/league/${encodeURIComponent(current)}`);
      const season = Number(league.season);
      if (Number.isInteger(season)) years.push(season);
      current = league.previous_league_id;
    } catch {
      current = null;
    }
  }
  return { availableHistoryYears: years, blockedHistoryYears: [], hasDraftData: true, hasRosterData: false, hasPlayerData: true, hasScoreSync: true };
}

export async function mapSleeperPlayers(schedule: GeneratedSchedule, week: number): Promise<PlayerWeekStat[]> {
  const connection = schedule.setup.platformConnection;
  if (!connection?.providerLeagueId) throw new Error("This season is not connected to Sleeper.");
  const [league, matchups] = await Promise.all([
    sleeperFetch<SleeperLeague & { roster_positions?: string[] }>(`/league/${encodeURIComponent(connection.providerLeagueId)}`),
    sleeperFetch<SleeperMatchup[]>(`/league/${encodeURIComponent(connection.providerLeagueId)}/matchups/${week}`),
  ]);
  return mapSleeperPlayerWeekStats({
    scheduleId: schedule.id,
    providerLeagueId: connection.providerLeagueId,
    season: Number(league.season || connection.seasonYear),
    week,
    teams: schedule.setup.teams,
    rosterPositions: league.roster_positions ?? [],
    matchups,
  });
}

export function mapSleeperTemplates(league: SleeperLeague): { lineupTemplate: LineupTemplate; rosterTemplate: RosterTemplate } {
  return deriveSleeperTemplates({
    season: Number(league.season),
    rosterPositions: league.roster_positions ?? [],
    taxiSlots: league.settings?.taxi_slots,
  });
}

export async function mapSleeperScores(schedule: GeneratedSchedule, week: number): Promise<PlatformSyncResult> {
  const connection = schedule.setup.platformConnection;
  if (!connection?.providerLeagueId) throw new Error("This season is not connected to Sleeper.");
  const matchups = await sleeperFetch<SleeperMatchup[]>(`/league/${encodeURIComponent(connection.providerLeagueId)}/matchups/${week}`);
  const byRoster = new Map(matchups.map((item) => [`sleeper-${connection.providerLeagueId}-${item.roster_id}`, item]));
  const rows: PlatformSyncScoreRow[] = [];
  const unmatched: PlatformSyncResult["unmatched"] = [];
  const targetWeek = schedule.weeks.find((item) => item.weekNumber === week);
  for (const game of targetWeek?.games ?? []) {
    const home = schedule.setup.teams.find((team) => team.id === game.homeTeamId);
    const away = schedule.setup.teams.find((team) => team.id === game.awayTeamId);
    const homeMatchup = home?.providerId ? byRoster.get(home.providerId) : undefined;
    const awayMatchup = away?.providerId ? byRoster.get(away.providerId) : undefined;
    if (!homeMatchup || !awayMatchup || homeMatchup.points == null || awayMatchup.points == null) {
      unmatched.push({ week, providerHomeId: home?.providerId, providerAwayId: away?.providerId, reason: "No Sleeper score matched this generated game." });
      continue;
    }
    // Each team's weekly points are the values a commissioner would type by hand,
    // so they auto-apply — the LeagueWeaver pairing needn't mirror Sleeper's.
    rows.push({ gameId: game.id, week, homeTeamId: game.homeTeamId, awayTeamId: game.awayTeamId, homeScore: homeMatchup.points, awayScore: awayMatchup.points, confidence: "high", source: "sleeper" });
  }
  return { rows, unmatched, warnings: unmatched.length ? ["Some Sleeper games did not match the generated LeagueWeaver slate."] : [], syncedAt: new Date().toISOString() };
}
