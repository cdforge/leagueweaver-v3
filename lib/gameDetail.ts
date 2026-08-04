import { getMatchupRatingRange, getMatchupSignal } from "@/lib/matchups";
import { formatDivisionRecord, formatRecord, getEnteringWeekRankSnapshot } from "@/lib/standings";
import { lineupSlotSortRank, type LineupStatus, type PlayerWeekStat, type SlotKey } from "@/lib/playerData";
import type { Division, GeneratedSchedule, MatchupRosterPlayer, MatchupRosterSide, PlayerScoreDetail, ScheduledGame, Team } from "@/lib/types";

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
  statLine?: string;
  statDetails?: PlayerScoreDetail[];
  source: "player-stats" | "roster-detail";
  lineupStatus: LineupStatus;
  starterIndex?: number;
  confidence: PlayerWeekStat["slotConfidence"];
  isProvisional: boolean;
}

export interface GameDetailSideVM {
  team: Team;
  division?: Division;
  rank: number;
  overallRecord: string;
  divisionRecord: string;
  platformTotal: number | null;
  starterTotal: number | null;
  projectedTotal: number | null;
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
  status: "predraft" | "upcoming" | "live" | "final";
  isPlayoff: boolean;
  playoffLabel?: string;
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

function slotLabelRank(slot: SlotKey | string) {
  const normalized = slot.toUpperCase() === "D/ST" ? "DST" : slot;
  return lineupSlotSortRank(normalized);
}

function slotRank(row: GameDetailPlayerStat) {
  const slotOrder = slotLabelRank(row.inferredSlot);
  if (row.lineupStatus === "starter") return slotOrder * 10 + (row.starterIndex ?? 0) / 1000;
  if (row.lineupStatus === "bench") return 1000 + slotOrder;
  if (row.lineupStatus === "ir") return 2000 + slotOrder;
  if (row.lineupStatus === "taxi") return 2100 + slotOrder;
  if (row.lineupStatus === "reserve") return 2200 + slotOrder;
  return 3000 + slotOrder;
}

function rosterSlotRank(row: GameDetailSlotVM) {
  return slotLabelRank(row.slot) * 10 + (row.starterIndex ?? 0) / 1000;
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
    source: "player-stats",
    lineupStatus: row.lineupStatus,
    starterIndex: row.starterIndex,
    confidence: row.slotConfidence,
    isProvisional: row.isProvisional,
  };
}

function rosterPlayerToSlotVM({
  player,
  teamId,
  weekNumber,
  lineupStatus,
  starterIndex,
}: {
  player: MatchupRosterPlayer;
  teamId: string;
  weekNumber: number;
  lineupStatus: LineupStatus;
  starterIndex?: number;
}): GameDetailSlotVM {
  const providerPlayerId = player.providerPlayerId || player.id;
  return {
    key: `${teamId}:${weekNumber}:${player.id}:${lineupStatus}:${starterIndex ?? "bench"}`,
    teamId,
    week: weekNumber,
    playerId: providerPlayerId,
    canonicalPlayerId: providerPlayerId,
    name: player.name || player.fullName || providerPlayerId,
    slot: player.slot,
    position: player.position || player.slot,
    nflTeam: player.proTeam,
    points: typeof player.points === "number" ? player.points : 0,
    projected: player.projectedPoints,
    statLine: player.statLine,
    statDetails: player.statDetails,
    source: "roster-detail",
    lineupStatus,
    starterIndex,
    confidence: lineupStatus === "starter" ? "confirmed" : "bench",
    isProvisional: false,
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
  overallRecord,
  divisionRecord,
  platformTotal,
  rosterSide,
}: {
  rows: GameDetailPlayerStat[];
  team: Team;
  division?: Division;
  weekNumber: number;
  rank: number;
  overallRecord: string;
  divisionRecord: string;
  platformTotal: number | null;
  rosterSide?: MatchupRosterSide;
}): GameDetailSideVM {
  if (rosterSide && (rosterSide.starters.length || rosterSide.bench.length)) {
    const starters = rosterSide.starters
      .map((player, index) => rosterPlayerToSlotVM({ player, teamId: team.id, weekNumber, lineupStatus: "starter", starterIndex: index }))
      .sort((left, right) => rosterSlotRank(left) - rosterSlotRank(right) || left.name.localeCompare(right.name));
    const bench = rosterSide.bench.map((player) => rosterPlayerToSlotVM({ player, teamId: team.id, weekNumber, lineupStatus: "bench" }));
    const starterTotal = starters.some((row) => Number.isFinite(row.points))
      ? Math.round(starters.reduce((sum, row) => sum + row.points, 0) * 100) / 100
      : scoreValue(rosterSide.total);
    const projectedTotal = scoreValue(rosterSide.projectedTotal) ?? (starters.some((row) => row.projected != null)
      ? Math.round(starters.reduce((sum, row) => sum + (row.projected ?? 0), 0) * 100) / 100
      : null);
    return {
      team,
      division,
      rank,
      overallRecord,
      divisionRecord,
      platformTotal: scoreValue(rosterSide.total) ?? platformTotal,
      starterTotal,
      projectedTotal,
      starters,
      bench,
      reserves: [],
      hasPlayerData: true,
    };
  }
  const teamRows = rowsForSide(rows, team.id, weekNumber);
  const starters = teamRows.filter(isStarter).map(toSlotVM);
  const bench = teamRows.filter((row) => row.lineupStatus === "bench" || row.lineupStatus === "unknown").map(toSlotVM);
  const reserves = teamRows.filter((row) => row.lineupStatus === "ir" || row.lineupStatus === "taxi" || row.lineupStatus === "reserve").map(toSlotVM);
  const starterTotal = starters.length ? Math.round(starters.reduce((sum, row) => sum + row.points, 0) * 100) / 100 : null;
  const projectedTotal = starters.some((row) => row.projected != null) ? Math.round(starters.reduce((sum, row) => sum + (row.projected ?? 0), 0) * 100) / 100 : null;

  return {
    team,
    division,
    rank,
    overallRecord,
    divisionRecord,
    platformTotal,
    starterTotal,
    projectedTotal,
    starters,
    bench,
    reserves,
    hasPlayerData: teamRows.length > 0,
  };
}

export function buildGameDetailVM(schedule: GeneratedSchedule, gameId: string, playerStats: GameDetailPlayerStat[] = []): GameDetailVM | null {
  const week = schedule.weeks.find((item) => item.games.some((game) => game.id === gameId));
  const regularGame = week?.games.find((item) => item.id === gameId);
  const playoffGame = regularGame ? undefined : (schedule.playoffGames ?? []).find((item) => item.id === gameId);
  const game = regularGame ?? playoffGame;
  if (!game) return null;
  const weekNumber = week?.weekNumber ?? game.week;

  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const away = teamById.get(game.awayTeamId);
  const home = teamById.get(game.homeTeamId);
  if (!away || !home) return null;

  const rankWeek = week?.weekNumber ?? schedule.weeks.at(-1)?.weekNumber ?? game.week;
  const rankRows = getEnteringWeekRankSnapshot(schedule, rankWeek).rows;
  const rankByTeam = new Map(rankRows.map((row) => [row.teamId, row.rank]));
  const standingByTeam = new Map(rankRows.map((row) => [row.teamId, row]));
  const ratingRange = getMatchupRatingRange(week?.games ?? [game], rankByTeam);
  const signal = getMatchupSignal(game, rankByTeam, ratingRange, schedule.setup.teams.length);
  const featured = Boolean(week?.games.some((candidate) => candidate.id === game.id && candidate.gameNumber === 1));
  const rosterDetail = schedule.matchupRosterDetails?.[game.id];
  const rosterHome = rosterDetail?.home.teamId === home.id ? rosterDetail.home : rosterDetail?.away.teamId === home.id ? rosterDetail.away : undefined;
  const rosterAway = rosterDetail?.away.teamId === away.id ? rosterDetail.away : rosterDetail?.home.teamId === away.id ? rosterDetail.home : undefined;

  const awaySide = sideVM({
    rows: playerStats,
    team: away,
    division: divisionById.get(away.divisionId),
    weekNumber,
    rank: rankByTeam.get(away.id) ?? away.overallRank,
    overallRecord: standingByTeam.get(away.id) ? formatRecord(standingByTeam.get(away.id)!) : "0-0",
    divisionRecord: standingByTeam.get(away.id) ? formatDivisionRecord(standingByTeam.get(away.id)!) : "0-0",
    platformTotal: scoreValue(game.awayScore),
    rosterSide: rosterAway,
  });
  const homeSide = sideVM({
    rows: playerStats,
    team: home,
    division: divisionById.get(home.divisionId),
    weekNumber,
    rank: rankByTeam.get(home.id) ?? home.overallRank,
    overallRecord: standingByTeam.get(home.id) ? formatRecord(standingByTeam.get(home.id)!) : "0-0",
    divisionRecord: standingByTeam.get(home.id) ? formatDivisionRecord(standingByTeam.get(home.id)!) : "0-0",
    platformTotal: scoreValue(game.homeScore),
    rosterSide: rosterHome,
  });

  return {
    scheduleId: schedule.id,
    season: schedule.setup.seasonYear,
    weekNumber,
    dateLabel: week?.dateLabel ?? game.dateLabel,
    game,
    status: rosterDetail?.status ?? (game.awayScore != null && game.homeScore != null ? "final" : "upcoming"),
    isPlayoff: Boolean(playoffGame),
    playoffLabel: playoffGame?.round,
    featured,
    ratingScore10: signal.score10,
    stadium: game.stadium || home.stadium,
    away: awaySide,
    home: homeSide,
    unsynced: !awaySide.hasPlayerData && !homeSide.hasPlayerData,
  };
}

export const GAME_DETAIL_CACHE_PREFIX = "leagueweaver:v3:player-stats:";
