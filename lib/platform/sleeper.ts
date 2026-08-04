import "server-only";
import { buildSleeperLeagueHistoryDraft, type LeagueHistoryDraft, type SleeperHistorySeasonPayload } from "@/lib/platform/history";
import { deriveSleeperTemplates, mapSleeperPlayerWeekStats, type LineupTemplate, type PlayerWeekStat, type RosterTemplate } from "@/lib/playerData";
import { mapSleeperTransactions, type NormalizedTransaction, type SleeperTransactionPayload } from "@/lib/transactions";
import { fetchProviderJson } from "./request";
import type { GeneratedSchedule, ImportDataFound, MatchupRosterDetail, MatchupRosterPlayer, PlatformSyncResult, PlatformSyncScoreRow, PriorSeasonFinishEntry } from "@/lib/types";

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
export interface SleeperMatchup { roster_id: number; matchup_id?: number; points?: number; players?: string[]; starters?: string[]; players_points?: Record<string, number>; starters_points?: number[] }
interface SleeperPlayer {
  player_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string;
  injury_status?: string | null;
  espn_id?: number | string | null;
}
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
  return { availableHistoryYears: years, blockedHistoryYears: [], hasDraftData: true, hasRosterData: true, hasPlayerData: true, hasScoreSync: true };
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

async function resolveSleeperSeasonLeagueId(entryLeagueId: string, seasonYear: number): Promise<{ leagueId: string; league: SleeperLeague | null }> {
  let current: string | null | undefined = entryLeagueId;
  for (let index = 0; index < 8 && current; index += 1) {
    const league: SleeperLeague = await sleeperFetch<SleeperLeague>(`/league/${encodeURIComponent(current)}`);
    if (Number(league.season) === seasonYear) return { leagueId: league.league_id, league };
    current = league.previous_league_id;
  }
  return { leagueId: entryLeagueId, league: null };
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

function sleeperPlayerName(playerId: string, player?: SleeperPlayer) {
  return player?.full_name || [player?.first_name, player?.last_name].filter(Boolean).join(" ") || `Player ${playerId}`;
}

function sleeperSlotLabel(slot?: string | null) {
  if (!slot) return "BE";
  if (slot === "BN") return "BE";
  if (slot === "DEF") return "D/ST";
  if (slot === "SUPER_FLEX") return "OP";
  if (slot === "WRRB_FLEX" || slot === "REC_FLEX") return "FLEX";
  return slot.replaceAll("_", "/");
}

function mapSleeperRosterPlayer(playerId: string, slot: string, points: number | undefined, catalog: Record<string, SleeperPlayer>): MatchupRosterPlayer {
  const player = catalog[playerId];
  const espnId = player?.espn_id == null ? undefined : String(player.espn_id);
  return {
    id: `sleeper-${playerId}`,
    providerPlayerId: espnId || playerId,
    name: sleeperPlayerName(playerId, player),
    fullName: player?.full_name,
    slot: sleeperSlotLabel(slot),
    position: player?.position || sleeperSlotLabel(slot),
    proTeam: player?.team || undefined,
    injuryStatus: player?.injury_status || undefined,
    points,
    statLine: typeof points === "number" ? `${points.toFixed(1)} pts` : undefined,
  };
}

function splitSleeperRoster(matchup: SleeperMatchup | undefined, rosterPositions: string[], catalog: Record<string, SleeperPlayer>) {
  const starters: MatchupRosterPlayer[] = [];
  const bench: MatchupRosterPlayer[] = [];
  const starterSet = new Set(matchup?.starters ?? []);
  for (const [index, playerId] of (matchup?.starters ?? []).entries()) {
    if (!playerId || playerId === "0") continue;
    starters.push(mapSleeperRosterPlayer(playerId, rosterPositions[index] || "FLEX", matchup?.players_points?.[playerId] ?? matchup?.starters_points?.[index], catalog));
  }
  for (const playerId of matchup?.players ?? []) {
    if (!playerId || playerId === "0" || starterSet.has(playerId)) continue;
    bench.push(mapSleeperRosterPlayer(playerId, "BN", matchup?.players_points?.[playerId], catalog));
  }
  return { starters, bench };
}

export async function mapSleeperScores(schedule: GeneratedSchedule, week: number, opts?: { includeRosterDetails?: boolean }): Promise<PlatformSyncResult> {
  const connection = schedule.setup.platformConnection;
  if (!connection?.providerLeagueId) throw new Error("This season is not connected to Sleeper.");
  const seasonLeague = await resolveSleeperSeasonLeagueId(connection.providerLeagueId, connection.seasonYear || schedule.setup.seasonYear);
  const providerLeagueId = seasonLeague.leagueId;
  const [league, matchups, catalog] = await Promise.all([
    opts?.includeRosterDetails
      ? seasonLeague.league
        ? Promise.resolve(seasonLeague.league as SleeperLeague & { roster_positions?: string[] })
        : sleeperFetch<SleeperLeague & { roster_positions?: string[] }>(`/league/${encodeURIComponent(providerLeagueId)}`)
      : Promise.resolve(null),
    sleeperFetch<SleeperMatchup[]>(`/league/${encodeURIComponent(providerLeagueId)}/matchups/${week}`),
    opts?.includeRosterDetails ? sleeperFetch<Record<string, SleeperPlayer>>("/players/nfl") : Promise.resolve({} as Record<string, SleeperPlayer>),
  ]);
  const byRoster = new Map(matchups.flatMap((item) => [
    [`sleeper-${providerLeagueId}-${item.roster_id}`, item],
    [`sleeper-${connection.providerLeagueId}-${item.roster_id}`, item],
  ]));
  const rows: PlatformSyncScoreRow[] = [];
  const rosterDetails: Record<string, MatchupRosterDetail> = {};
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
    if (opts?.includeRosterDetails) {
      const homeRoster = splitSleeperRoster(homeMatchup, league?.roster_positions ?? [], catalog);
      const awayRoster = splitSleeperRoster(awayMatchup, league?.roster_positions ?? [], catalog);
      rosterDetails[game.id] = {
        gameId: game.id,
        week,
        seasonYear: schedule.setup.seasonYear,
        provider: "sleeper",
        sourceSeasonYear: Number(league?.season) || connection.seasonYear || schedule.setup.seasonYear,
        status: "final",
        syncedAt: new Date().toISOString(),
        home: { teamId: game.homeTeamId, total: homeMatchup.points, starters: homeRoster.starters, bench: homeRoster.bench },
        away: { teamId: game.awayTeamId, total: awayMatchup.points, starters: awayRoster.starters, bench: awayRoster.bench },
      };
    }
  }
  return { rows, rosterDetails, unmatched, warnings: unmatched.length ? ["Some Sleeper games did not match the generated LeagueWeaver slate."] : [], syncedAt: new Date().toISOString() };
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
