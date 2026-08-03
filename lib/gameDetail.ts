import { getMatchupRatingRange, getMatchupSignal } from "@/lib/matchups";
import { getEnteringWeekRankSnapshot } from "@/lib/standings";
import type { LineupStatus, PlayerWeekStat, SlotKey } from "@/lib/playerData";
import type { Division, GeneratedSchedule, ScheduledGame, Team } from "@/lib/types";

export interface GameDetailPlayerStat extends PlayerWeekStat {
  displayName?: string;
  position?: string;
  nflTeam?: string;
}

export interface GameDetailSlotVM {
  key: string;
  teamId: string;
  week: number;
  playerId: string;
  canonicalPlayerId: string;
  name: string;
  slot: SlotKey | string;
  position: string;
  nflTeam?: string;
  points: number;
  projected?: number;
  lineupStatus: LineupStatus;
  starterIndex?: number;
  confidence: PlayerWeekStat["slotConfidence"];
}

export interface GameDetailSideVM {
  team: Team;
  division?: Division;
  rank: number;
  platformTotal: number | null;
  starterTotal: number | null;
  starters: GameDetailSlotVM[];
  bench: GameDetailSlotVM[];
  reserves: GameDetailSlotVM[];
  hasPlayerData: boolean;
}

export interface GameDetailVM {
  scheduleId: string;
  season: number;
  weekNumber: number;
  dateLabel: string;
  game: ScheduledGame;
  status: "upcoming" | "final";
  featured: boolean;
  ratingScore10: number;
  stadium: string;
  away: GameDetailSideVM;
  home: GameDetailSideVM;
  unsynced: boolean;
}

function scoreValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isStarter(row: Pick<GameDetailPlayerStat, "lineupStatus">) {
  return row.lineupStatus === "starter";
}

function slotRank(row: GameDetailPlayerStat) {
  if (typeof row.starterIndex === "number") return row.starterIndex;
  if (row.lineupStatus === "starter") return 0;
  if (row.lineupStatus === "bench") return 1000;
  if (row.lineupStatus === "ir") return 2000;
  if (row.lineupStatus === "taxi") return 2100;
  if (row.lineupStatus === "reserve") return 2200;
  return 3000;
}

function toSlotVM(row: GameDetailPlayerStat): GameDetailSlotVM {
  return {
    key: `${row.teamId}:${row.week}:${row.providerPlayerId}`,
    teamId: row.teamId,
    week: row.week,
    playerId: row.providerPlayerId,
    canonicalPlayerId: row.canonicalPlayerId,
    name: row.displayName || row.providerPlayerId,
    slot: row.inferredSlot,
    position: row.position || row.inferredSlot,
    nflTeam: row.nflTeam,
    points: row.points,
    projected: row.projected,
    lineupStatus: row.lineupStatus,
    starterIndex: row.starterIndex,
    confidence: row.slotConfidence,
  };
}

function rowsForSide(rows: GameDetailPlayerStat[], teamId: string, weekNumber: number) {
  return rows
    .filter((row) => row.teamId === teamId && row.week === weekNumber)
    .sort((left, right) => slotRank(left) - slotRank(right) || left.inferredSlot.localeCompare(right.inferredSlot) || left.providerPlayerId.localeCompare(right.providerPlayerId));
}

function sideVM({
  rows,
  team,
  division,
  weekNumber,
  rank,
  platformTotal,
}: {
  rows: GameDetailPlayerStat[];
  team: Team;
  division?: Division;
  weekNumber: number;
  rank: number;
  platformTotal: number | null;
}): GameDetailSideVM {
  const teamRows = rowsForSide(rows, team.id, weekNumber);
  const starters = teamRows.filter(isStarter).map(toSlotVM);
  const bench = teamRows.filter((row) => row.lineupStatus === "bench" || row.lineupStatus === "unknown").map(toSlotVM);
  const reserves = teamRows.filter((row) => row.lineupStatus === "ir" || row.lineupStatus === "taxi" || row.lineupStatus === "reserve").map(toSlotVM);
  const starterTotal = starters.length ? Math.round(starters.reduce((sum, row) => sum + row.points, 0) * 100) / 100 : null;

  return {
    team,
    division,
    rank,
    platformTotal,
    starterTotal,
    starters,
    bench,
    reserves,
    hasPlayerData: teamRows.length > 0,
  };
}

export function buildGameDetailVM(schedule: GeneratedSchedule, gameId: string, playerStats: GameDetailPlayerStat[] = []): GameDetailVM | null {
  const week = schedule.weeks.find((item) => item.games.some((game) => game.id === gameId));
  const game = week?.games.find((item) => item.id === gameId);
  if (!week || !game) return null;

  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const away = teamById.get(game.awayTeamId);
  const home = teamById.get(game.homeTeamId);
  if (!away || !home) return null;

  const rankRows = getEnteringWeekRankSnapshot(schedule, week.weekNumber).rows;
  const rankByTeam = new Map(rankRows.map((row) => [row.teamId, row.rank]));
  const ratingRange = getMatchupRatingRange(week.games, rankByTeam);
  const signal = getMatchupSignal(game, rankByTeam, ratingRange, schedule.setup.teams.length);
  const featured = week.games.some((candidate) => candidate.id === game.id && candidate.gameNumber === 1);

  const awaySide = sideVM({
    rows: playerStats,
    team: away,
    division: divisionById.get(away.divisionId),
    weekNumber: week.weekNumber,
    rank: rankByTeam.get(away.id) ?? away.overallRank,
    platformTotal: scoreValue(game.awayScore),
  });
  const homeSide = sideVM({
    rows: playerStats,
    team: home,
    division: divisionById.get(home.divisionId),
    weekNumber: week.weekNumber,
    rank: rankByTeam.get(home.id) ?? home.overallRank,
    platformTotal: scoreValue(game.homeScore),
  });

  return {
    scheduleId: schedule.id,
    season: schedule.setup.seasonYear,
    weekNumber: week.weekNumber,
    dateLabel: week.dateLabel,
    game,
    status: game.awayScore != null && game.homeScore != null ? "final" : "upcoming",
    featured,
    ratingScore10: signal.score10,
    stadium: game.stadium || home.stadium,
    away: awaySide,
    home: homeSide,
    unsynced: !awaySide.hasPlayerData && !homeSide.hasPlayerData,
  };
}

export const GAME_DETAIL_CACHE_PREFIX = "leagueweaver:v3:player-stats:";
