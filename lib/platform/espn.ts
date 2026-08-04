import "server-only";
import type { GeneratedSchedule, ImportDataFound, MatchupRosterDetail, MatchupRosterPlayer, PlatformSyncResult, PlatformSyncScoreRow, PriorSeasonFinishEntry } from "@/lib/types";

const ESPN_BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl";

export interface EspnAuthInput {
  swid?: string;
  espnS2?: string;
}

export interface EspnMember { id: string; displayName?: string; firstName?: string; lastName?: string }
interface EspnTeamRecord { overall?: { wins?: number; losses?: number; ties?: number; pointsFor?: number } }
export interface EspnTeam { id: number; name?: string; location?: string; nickname?: string; abbrev?: string; logo?: string; primaryOwner?: string; owners?: string[]; divisionId?: number; playoffSeed?: number; rankCalculatedFinal?: number; rankFinal?: number; record?: EspnTeamRecord }
export interface EspnLeague {
  id: number;
  seasonId?: number;
  members?: EspnMember[];
  teams?: EspnTeam[];
  schedule?: EspnMatchup[];
  draftDetail?: { drafted?: boolean; inProgress?: boolean; picks?: unknown[] };
  settings?: { name?: string; scheduleSettings?: { divisions?: Array<{ id: number; name?: string }> } };
}

interface EspnPlayerStat { appliedStats?: Record<string, number>; appliedTotal?: number; statSourceId?: number; statSplitTypeId?: number; scoringPeriodId?: number }
interface EspnRosterEntry {
  injuryStatus?: string;
  lineupSlotId?: number;
  playerId?: number;
  playerPoolEntry?: {
    appliedStatTotal?: number;
    player?: {
      defaultPositionId?: number;
      eligibleSlots?: number[];
      firstName?: string;
      fullName?: string;
      id?: number;
      injured?: boolean;
      injuryStatus?: string;
      lastName?: string;
      proTeamId?: number;
      stats?: EspnPlayerStat[];
    };
  };
}
interface EspnMatchupTeam { teamId?: number; totalPoints?: number; rosterForCurrentScoringPeriod?: { entries?: EspnRosterEntry[] } }
interface EspnMatchup { id: number; matchupPeriodId: number; home?: EspnMatchupTeam; away?: EspnMatchupTeam }

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

export async function fetchEspnLeague(leagueId: string, seasonYear: number, views: string[], auth?: EspnAuthInput, opts?: { scoringPeriodId?: number }) {
  const params = new URLSearchParams();
  views.forEach((view) => params.append("view", view));
  if (opts?.scoringPeriodId != null) params.set("scoringPeriodId", String(opts.scoringPeriodId));
  const response = await fetch(`${ESPN_BASE}/seasons/${seasonYear}/segments/0/leagues/${leagueId}?${params.toString()}`, {
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
    hasRosterData: true,
    hasPlayerData: true,
    hasScoreSync: true,
  };
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

const ESPN_SLOT_LABELS: Record<number, string> = {
  0: "QB",
  1: "TQB",
  2: "RB",
  3: "RB/WR",
  4: "WR",
  5: "WR/TE",
  6: "TE",
  7: "OP",
  8: "DT",
  9: "DE",
  10: "LB",
  11: "DL",
  12: "CB",
  13: "S",
  14: "DB",
  15: "DP",
  16: "D/ST",
  17: "K",
  18: "P",
  19: "HC",
  20: "BE",
  21: "IR",
  23: "FLEX",
  24: "EDGE",
};

const ESPN_POSITION_LABELS: Record<number, string> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "D/ST",
};

const ESPN_PRO_TEAM_ABBR: Record<number, string> = {
  0: "FA",
  1: "ATL",
  2: "BUF",
  3: "CHI",
  4: "CIN",
  5: "CLE",
  6: "DAL",
  7: "DEN",
  8: "DET",
  9: "GB",
  10: "TEN",
  11: "IND",
  12: "KC",
  13: "LV",
  14: "LAR",
  15: "MIA",
  16: "MIN",
  17: "NE",
  18: "NO",
  19: "NYG",
  20: "NYJ",
  21: "PHI",
  22: "ARI",
  23: "PIT",
  24: "LAC",
  25: "SF",
  26: "SEA",
  27: "TB",
  28: "WSH",
  29: "CAR",
  30: "JAX",
  33: "BAL",
  34: "HOU",
};

function espnSlotLabel(slotId?: number) {
  return slotId == null ? "BE" : ESPN_SLOT_LABELS[slotId] || `S${slotId}`;
}

function espnPlayerPoints(entry: EspnRosterEntry) {
  const actual = entry.playerPoolEntry?.player?.stats?.find((stat) => stat.statSourceId === 0 && stat.statSplitTypeId === 1)?.appliedTotal;
  return actual ?? entry.playerPoolEntry?.appliedStatTotal;
}

function espnProjectedPoints(entry: EspnRosterEntry) {
  return entry.playerPoolEntry?.player?.stats?.find((stat) => stat.statSourceId === 1 && stat.statSplitTypeId === 1)?.appliedTotal;
}

function espnStatDetails(entry: EspnRosterEntry) {
  const appliedStats = entry.playerPoolEntry?.player?.stats?.find((stat) => stat.statSourceId === 0 && stat.statSplitTypeId === 1)?.appliedStats;
  if (!appliedStats) return undefined;
  return Object.entries(appliedStats)
    .map(([raw, points]) => ({
      raw,
      label: `Stat ${raw}`,
      points,
    }))
    .sort((left, right) => Math.abs(right.points) - Math.abs(left.points));
}

function mapEspnRosterPlayer(entry: EspnRosterEntry): MatchupRosterPlayer | null {
  const player = entry.playerPoolEntry?.player;
  const id = String(entry.playerId ?? player?.id ?? "");
  if (!id || !player) return null;
  const slot = espnSlotLabel(entry.lineupSlotId);
  const position = ESPN_POSITION_LABELS[player.defaultPositionId ?? -1] || slot;
  const points = espnPlayerPoints(entry);
  const projectedPoints = espnProjectedPoints(entry);
  return {
    id: `espn-${id}`,
    providerPlayerId: id,
    name: player.fullName || [player.firstName, player.lastName].filter(Boolean).join(" ") || `Player ${id}`,
    fullName: player.fullName,
    slot,
    position,
    proTeam: ESPN_PRO_TEAM_ABBR[player.proTeamId ?? -1],
    injuryStatus: entry.injuryStatus && entry.injuryStatus !== "NORMAL" ? entry.injuryStatus : player.injuryStatus,
    points: typeof points === "number" ? points : undefined,
    projectedPoints: typeof projectedPoints === "number" ? projectedPoints : undefined,
    statLine: typeof points === "number" ? `${points.toFixed(1)} pts` : undefined,
    statDetails: espnStatDetails(entry),
  };
}

function splitEspnRoster(side?: EspnMatchupTeam) {
  const starters: MatchupRosterPlayer[] = [];
  const bench: MatchupRosterPlayer[] = [];
  for (const entry of side?.rosterForCurrentScoringPeriod?.entries ?? []) {
    const player = mapEspnRosterPlayer(entry);
    if (!player) continue;
    if (entry.lineupSlotId === 20 || entry.lineupSlotId === 21) bench.push(player);
    else starters.push(player);
  }
  return { starters, bench };
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
  const sideByTeamWeek = new Map<string, EspnMatchupTeam>();
  for (const matchup of league.schedule ?? []) {
    for (const side of [matchup.home, matchup.away]) {
      if (side?.teamId == null || side.totalPoints == null) continue;
      const key = `${matchup.matchupPeriodId}:${espnProviderId(leagueId, side.teamId)}`;
      pointsByTeamWeek.set(key, side.totalPoints);
      sideByTeamWeek.set(key, side);
    }
  }
  const rows: PlatformSyncScoreRow[] = [];
  const rosterDetails: Record<string, MatchupRosterDetail> = {};
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
      const homeSide = sideByTeamWeek.get(`${week.weekNumber}:${home.providerId}`);
      const awaySide = sideByTeamWeek.get(`${week.weekNumber}:${away.providerId}`);
      const homeRoster = splitEspnRoster(homeSide);
      const awayRoster = splitEspnRoster(awaySide);
      if (homeRoster.starters.length || awayRoster.starters.length || homeRoster.bench.length || awayRoster.bench.length) {
        rosterDetails[game.id] = {
          gameId: game.id,
          week: week.weekNumber,
          seasonYear: schedule.setup.seasonYear,
          provider: "espn",
          sourceSeasonYear: league.seasonId ?? connection?.seasonYear ?? schedule.setup.seasonYear,
          status: "final",
          syncedAt: new Date().toISOString(),
          home: { teamId: home.id, total: homeScore, starters: homeRoster.starters, bench: homeRoster.bench },
          away: { teamId: away.id, total: awayScore, starters: awayRoster.starters, bench: awayRoster.bench },
        };
      }
    }
  }
  return { rows, rosterDetails, unmatched, warnings: unmatched.length ? ["Some weeks had no ESPN scores yet — refresh once those fantasy weeks are final."] : [], syncedAt: new Date().toISOString() };
}
