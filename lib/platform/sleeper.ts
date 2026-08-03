import "server-only";
import { buildSleeperLeagueHistoryDraft, type LeagueHistoryDraft, type SleeperHistorySeasonPayload } from "@/lib/platform/history";
import { deriveSleeperTemplates, mapSleeperPlayerWeekStats, type LineupTemplate, type PlayerWeekStat, type RosterTemplate } from "@/lib/playerData";
import { mapSleeperTransactions, type NormalizedTransaction, type SleeperTransactionPayload } from "@/lib/transactions";
import { fetchProviderJson } from "./request";
import type { GeneratedSchedule, ImportDataFound, PlatformSyncResult, PlatformSyncScoreRow, PriorSeasonFinishEntry } from "@/lib/types";

const SLEEPER_API = "https://api.sleeper.app/v1";

export interface SleeperLeague {
  league_id: string;
  name?: string;
  season?: string;
  avatar?: string | null;
  draft_id?: string | null;
  previous_league_id?: string | null;
  roster_positions?: string[];
  settings?: {
    taxi_slots?: number;
    best_ball?: number;
    num_teams?: number;
    last_scored_leg?: number;
    leg?: number;
    playoff_teams?: number;
    playoff_week_start?: number;
    playoff_type?: number;
  };
}
export interface SleeperUser { user_id: string; display_name?: string; avatar?: string | null; metadata?: { team_name?: string } }
export interface SleeperRoster {
  roster_id: number;
  owner_id?: string | null;
  metadata?: { team_name?: string };
  settings?: {
    division?: number;
    wins?: number;
    losses?: number;
    ties?: number;
    fpts?: number;
    fpts_decimal?: number;
    fpts_against?: number;
    fpts_against_decimal?: number;
  };
}
type SleeperRosterSettings = NonNullable<SleeperRoster["settings"]>;
export interface SleeperMatchup { roster_id: number; matchup_id?: number; points?: number; players?: string[]; starters?: string[]; players_points?: Record<string, number> }
/** One node of Sleeper's winners_bracket. `p` marks a placement game (1 = title). */
interface SleeperBracketMatch { r?: number; m?: number; t1?: number | null; t2?: number | null; w?: number | null; l?: number | null; p?: number }

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

export async function collectSleeperLeagueHistory(scheduleId: string, leagueId: string, opts?: { maxSeasons?: number; weeks?: number[] }): Promise<LeagueHistoryDraft> {
  const seasons: SleeperHistorySeasonPayload[] = [];
  let current: string | null | undefined = leagueId;
  for (let index = 0; index < (opts?.maxSeasons ?? 8) && current; index += 1) {
    const league: SleeperLeague = await sleeperFetch<SleeperLeague>(`/league/${encodeURIComponent(current)}`);
    const leagueIdForFetch = current;
    const lastScoredLeg = league.settings?.last_scored_leg ?? league.settings?.leg ?? 18;
    const weekCount = Math.max(1, Math.min(18, Number.isFinite(lastScoredLeg) ? Number(lastScoredLeg) : 18));
    const weeks = opts?.weeks ?? Array.from({ length: weekCount }, (_, week) => week + 1);
    const [rosters, users, matchupPairs] = await Promise.all([
      sleeperFetch<SleeperRoster[]>(`/league/${encodeURIComponent(leagueIdForFetch)}/rosters`),
      sleeperFetch<SleeperUser[]>(`/league/${encodeURIComponent(leagueIdForFetch)}/users`),
      Promise.all(weeks.map(async (week) => {
        try {
          return [week, await sleeperFetch<SleeperMatchup[]>(`/league/${encodeURIComponent(leagueIdForFetch)}/matchups/${week}`)] as const;
        } catch {
          return [week, []] as const;
        }
      })),
    ]);
    seasons.push({ league, rosters, users, matchupsByWeek: Object.fromEntries(matchupPairs) });
    current = league.previous_league_id;
  }
  return buildSleeperLeagueHistoryDraft(scheduleId, seasons);
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

function sleeperRosterPoints(settings?: SleeperRosterSettings) {
  return (settings?.fpts ?? 0) + (settings?.fpts_decimal ?? 0) / 100;
}

/**
 * Last season's finish for seeding a new schedule. Walks one `previous_league_id`
 * hop from the connected league, then reads the prior season's rosters (for the
 * regular-season order) and winners_bracket (for the true playoff finish). Keyed by
 * owner id, which is stable across Sleeper seasons even though roster ids are not.
 * Returns [] when there is no prior season to walk back to.
 */
export async function fetchSleeperPriorFinish(leagueId: string): Promise<PriorSeasonFinishEntry[]> {
  const league = await sleeperFetch<SleeperLeague>(`/league/${encodeURIComponent(leagueId)}`);
  const previousId = league.previous_league_id;
  if (!previousId) return [];
  const [rosters, bracket] = await Promise.all([
    sleeperFetch<SleeperRoster[]>(`/league/${encodeURIComponent(previousId)}/rosters`),
    sleeperFetch<SleeperBracketMatch[]>(`/league/${encodeURIComponent(previousId)}/winners_bracket`).catch(() => [] as SleeperBracketMatch[]),
  ]);
  if (rosters.length === 0) return [];
  // Regular-season order: most wins, then most points.
  const regularSeasonRankByRoster = new Map<number, number>(
    [...rosters]
      .sort((left, right) =>
        (right.settings?.wins ?? 0) - (left.settings?.wins ?? 0) ||
        sleeperRosterPoints(right.settings) - sleeperRosterPoints(left.settings) ||
        left.roster_id - right.roster_id,
      )
      .map((roster, index) => [roster.roster_id, index + 1]),
  );
  // Playoff finish from placement games: a match with `p` awards rank p to the
  // winner and p + 1 to the loser (p:1 title game -> champion + runner-up). Keep the
  // best rank if a roster somehow appears in more than one placement game.
  const playoffRankByRoster = new Map<number, number>();
  for (const match of bracket) {
    if (!match.p) continue;
    const assign = (rosterId: number | null | undefined, rank: number) => {
      if (rosterId == null) return;
      const existing = playoffRankByRoster.get(rosterId);
      if (existing == null || rank < existing) playoffRankByRoster.set(rosterId, rank);
    };
    assign(match.w, match.p);
    assign(match.l, match.p + 1);
  }
  return rosters.map((roster) => ({
    ownerId: roster.owner_id ?? undefined,
    providerTeamId: String(roster.roster_id),
    regularSeasonRank: regularSeasonRankByRoster.get(roster.roster_id),
    playoffRank: playoffRankByRoster.get(roster.roster_id),
  }));
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

export async function fetchSleeperTransactions(schedule: GeneratedSchedule, week: number): Promise<NormalizedTransaction[]> {
  const connection = schedule.setup.platformConnection;
  if (!connection?.providerLeagueId) throw new Error("This season is not connected to Sleeper.");
  const transactions = await sleeperFetch<SleeperTransactionPayload[]>(`/league/${encodeURIComponent(connection.providerLeagueId)}/transactions/${week}`);
  return mapSleeperTransactions({
    providerLeagueId: connection.providerLeagueId,
    week,
    teams: schedule.setup.teams,
    transactions,
  });
}
