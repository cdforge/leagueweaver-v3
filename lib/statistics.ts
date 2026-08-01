import { calculateMatchupRating, getGameOfWeekSelection } from "./matchups";
import { calculateTeamClinchStates } from "./clinch";
import { getWeekOneRankMap } from "./rankings";
import { calculateStandings, formatRecord, getEnteringWeekRankMap, getLiveRankHistory } from "./standings";
import type { GeneratedSchedule, ScheduledGame, StandingsRow } from "./types";

export interface SplitRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface TeamSeasonStats extends StandingsRow {
  record: string;
  home: SplitRecord;
  away: SplitRecord;
  bestStreak: string;
  divisionPointsFor: number;
  divisionPointsAgainst: number;
  strengthOfVictory: number | null;
  strengthOfSchedule: number | null;
  playoffOdds: number;
  featuredWins: number;
}

export type GameOfWeekStatus = "previous" | "current" | "projected";
export type GameOfWeekLens = "preseason" | "live";

export interface GameOfWeekTimelineEntry {
  weekNumber: number;
  dateLabel: string;
  game: ScheduledGame;
  status: GameOfWeekStatus;
  locked: boolean;
  lens: GameOfWeekLens;
  rating: number;
  planningRating: number;
  liveRating: number;
  playoffImplication: boolean;
  pureGame: ScheduledGame;
  pureRating: number;
  ranks: Map<string, number>;
}

export type GameBadge = "GOTW" | "Upset" | "Shootout";

export interface GameAnalytics {
  game: ScheduledGame;
  margin: number;
  total: number;
  marginRank: number;
  totalRank: number;
  qualityScore: number;
  qualityRank: number;
  badges: GameBadge[];
}

export function recordGames(record: SplitRecord) {
  return record.wins + record.losses + record.ties;
}

export function recordPercentage(record: SplitRecord) {
  const games = recordGames(record);
  return games ? (record.wins + record.ties * 0.5) / games : 0;
}

export function formatSplitRecord(record: SplitRecord) {
  return record.ties ? `${record.wins}-${record.losses}-${record.ties}` : `${record.wins}-${record.losses}`;
}

/** Format an accumulated/derived point figure for display. Fantasy scores are
 *  commonly decimals, and summing/subtracting them accrues floating-point drift
 *  (e.g. 1217.3999999999999). Round to a single decimal and group thousands. */
export function formatPoints(value: number) {
  // Fantasy points read as ###.## everywhere — hand-typed and platform-synced
  // scores must look identical, and fantasy scoring is inherently two-decimal.
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format a point differential with an explicit sign and a tone for styling.
 *  A value that rounds to zero is neutral (plain "0", no "+"), never green. */
export function formatDifferential(value: number): { text: string; tone: "positive" | "negative" | "neutral" } {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return { text: "0", tone: "neutral" };
  if (rounded > 0) return { text: `+${formatPoints(rounded)}`, tone: "positive" };
  return { text: formatPoints(rounded), tone: "negative" };
}

function updateRecord(record: SplitRecord, score: number, opponentScore: number) {
  if (score === opponentScore) record.ties += 1;
  else if (score > opponentScore) record.wins += 1;
  else record.losses += 1;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function calculateTeamSeasonStats(schedule: GeneratedSchedule, playoffOdds = new Map<string, number>()): TeamSeasonStats[] {
  const standings = calculateStandings(schedule);
  const standingsByTeam = new Map(standings.map((row) => [row.teamId, row]));
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const home = new Map(schedule.setup.teams.map((team) => [team.id, { wins: 0, losses: 0, ties: 0 } satisfies SplitRecord]));
  const away = new Map(schedule.setup.teams.map((team) => [team.id, { wins: 0, losses: 0, ties: 0 } satisfies SplitRecord]));
  const divisionPoints = new Map(schedule.setup.teams.map((team) => [team.id, { for: 0, against: 0 }]));
  const opponents = new Map(schedule.setup.teams.map((team) => [team.id, [] as string[]]));
  const defeated = new Map(schedule.setup.teams.map((team) => [team.id, [] as string[]]));
  const featuredWins = new Map(schedule.setup.teams.map((team) => [team.id, 0]));
  const activeWinStreak = new Map(schedule.setup.teams.map((team) => [team.id, 0]));
  const bestWinStreak = new Map(schedule.setup.teams.map((team) => [team.id, 0]));
  const gotwIds = getRegularSeasonGotwIds(schedule);

  for (const week of [...schedule.weeks].sort((left, right) => left.weekNumber - right.weekNumber)) {
    for (const game of week.games) {
      if (game.homeScore == null || game.awayScore == null) continue;
      updateRecord(home.get(game.homeTeamId)!, game.homeScore, game.awayScore);
      updateRecord(away.get(game.awayTeamId)!, game.awayScore, game.homeScore);
      for (const [teamId, won] of [
        [game.homeTeamId, game.homeScore > game.awayScore],
        [game.awayTeamId, game.awayScore > game.homeScore],
      ] as const) {
        const next = won ? (activeWinStreak.get(teamId) ?? 0) + 1 : 0;
        activeWinStreak.set(teamId, next);
        bestWinStreak.set(teamId, Math.max(bestWinStreak.get(teamId) ?? 0, next));
      }
      opponents.get(game.homeTeamId)!.push(game.awayTeamId);
      opponents.get(game.awayTeamId)!.push(game.homeTeamId);
      if (game.homeScore > game.awayScore) defeated.get(game.homeTeamId)!.push(game.awayTeamId);
      if (game.awayScore > game.homeScore) defeated.get(game.awayTeamId)!.push(game.homeTeamId);
      if (gotwIds.has(game.id) && game.homeScore !== game.awayScore) {
        const winnerId = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
        featuredWins.set(winnerId, (featuredWins.get(winnerId) ?? 0) + 1);
      }
      if (teamById.get(game.homeTeamId)?.divisionId === teamById.get(game.awayTeamId)?.divisionId) {
        divisionPoints.get(game.homeTeamId)!.for += game.homeScore;
        divisionPoints.get(game.homeTeamId)!.against += game.awayScore;
        divisionPoints.get(game.awayTeamId)!.for += game.awayScore;
        divisionPoints.get(game.awayTeamId)!.against += game.homeScore;
      }
    }
  }

  return standings.map((row) => {
    const opponentStrengths = opponents.get(row.teamId)!.map((teamId) => standingsByTeam.get(teamId)?.winPercentage ?? 0);
    const victoryStrengths = defeated.get(row.teamId)!.map((teamId) => standingsByTeam.get(teamId)?.winPercentage ?? 0);
    const division = divisionPoints.get(row.teamId)!;
    return {
      ...row,
      record: formatRecord(row),
      home: home.get(row.teamId)!,
      away: away.get(row.teamId)!,
      bestStreak: bestWinStreak.get(row.teamId) ? `W${bestWinStreak.get(row.teamId)}` : "—",
      divisionPointsFor: division.for,
      divisionPointsAgainst: division.against,
      strengthOfVictory: average(victoryStrengths),
      strengthOfSchedule: average(opponentStrengths),
      playoffOdds: playoffOdds.get(row.teamId) ?? 0,
      featuredWins: featuredWins.get(row.teamId) ?? 0,
    };
  });
}

function competitionRanks(games: ScheduledGame[], value: (game: ScheduledGame) => number, direction: "asc" | "desc") {
  const sorted = [...games].sort((left, right) => {
    const difference = value(left) - value(right);
    return (direction === "asc" ? difference : -difference) || left.id.localeCompare(right.id);
  });
  const ranks = new Map<string, number>();
  let previous: number | undefined;
  let rank = 0;
  sorted.forEach((game, index) => {
    const current = value(game);
    if (previous === undefined || current !== previous) rank = index + 1;
    ranks.set(game.id, rank);
    previous = current;
  });
  return ranks;
}

export function gameOfWeekStatusLabel(status: GameOfWeekStatus) {
  if (status === "previous" || status === "current") return "GOTW";
  return "Projected GOTW";
}

export function getGameOfWeekTimeline(schedule: GeneratedSchedule): GameOfWeekTimelineEntry[] {
  const orderedWeeks = [...schedule.weeks].sort((left, right) => left.weekNumber - right.weekNumber);
  const completedWeeks = new Set(orderedWeeks.filter((week) => week.games.length > 0 && week.games.every((game) => game.homeScore != null && game.awayScore != null)).map((week) => week.weekNumber));
  const currentWeek = orderedWeeks.find((week) => !completedWeeks.has(week.weekNumber))?.weekNumber;
  const openingWeekRanks = getWeekOneRankMap(schedule.setup);
  const preseasonRanks = new Map(schedule.setup.teams.map((team) => [team.id, team.overallRank]));
  const rankHistory = getLiveRankHistory(schedule);
  const latestLiveSnapshot = [...rankHistory].reverse().find((snapshot) => snapshot.playedGames > 0);
  const latestLiveRanks = latestLiveSnapshot ? new Map(latestLiveSnapshot.rows.map((row) => [row.teamId, row.rank])) : openingWeekRanks;
  const hasLiveResults = Boolean(latestLiveSnapshot);

  return orderedWeeks.flatMap((week): GameOfWeekTimelineEntry[] => {
    const status: GameOfWeekStatus = completedWeeks.has(week.weekNumber)
      ? "previous"
      : week.weekNumber === currentWeek
        ? "current"
        : "projected";
    const planningRanks = week.weekNumber === 1 ? openingWeekRanks : preseasonRanks;
    const ranks = status === "previous"
      ? getEnteringWeekRankMap(schedule, week.weekNumber)
      : hasLiveResults
        ? latestLiveRanks
        : planningRanks;
    const enteringSnapshot = rankHistory.find((snapshot) => snapshot.weekNumber === Math.max(0, week.weekNumber - 1));
    const usesLiveRanks = status === "previous" ? (enteringSnapshot?.playedGames ?? 0) > 0 : hasLiveResults;
    const implicationThroughWeek = status === "previous"
      ? Math.max(0, week.weekNumber - 1)
      : latestLiveSnapshot?.weekNumber ?? 0;
    const clinchStates = calculateTeamClinchStates(schedule, implicationThroughWeek);
    const selection = getGameOfWeekSelection(week.games, ranks, {
      weekNumber: week.weekNumber,
      regularSeasonWeeks: schedule.setup.weeks,
      playoffFieldSize: schedule.setup.playoffs.fieldSize,
      playoffBerthTeamIds: new Set(clinchStates.filter((state) => state.playoffBerth).map((state) => state.teamId)),
      eliminatedTeamIds: new Set(clinchStates.filter((state) => state.eliminated).map((state) => state.teamId)),
    });
    if (!selection) return [];
    const game = week.games.find((item) => item.id === selection.gameId);
    const pureGame = week.games.find((item) => item.id === selection.pureGameId);
    if (!game || !pureGame) return [];
    return [{
      weekNumber: week.weekNumber,
      dateLabel: week.dateLabel,
      game,
      status,
      locked: status === "previous",
      lens: usesLiveRanks ? "live" : "preseason",
      rating: selection.rating,
      planningRating: calculateMatchupRating(game, planningRanks),
      liveRating: calculateMatchupRating(game, ranks),
      playoffImplication: selection.playoffImplication,
      pureGame,
      pureRating: selection.pureRating,
      ranks,
    }];
  });
}

export function getRegularSeasonGotwIds(schedule: GeneratedSchedule) {
  return new Set(getGameOfWeekTimeline(schedule).map((entry) => entry.game.id));
}

export function isUpsetResult(game: ScheduledGame, ranks?: Map<string, number>) {
  if (!ranks || game.homeScore == null || game.awayScore == null || game.homeScore === game.awayScore) return false;
  const winnerId = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
  const loserId = winnerId === game.homeTeamId ? game.awayTeamId : game.homeTeamId;
  const winnerRank = ranks.get(winnerId);
  const loserRank = ranks.get(loserId);
  return winnerRank != null && loserRank != null && winnerRank > loserRank;
}

export function calculateGameAnalytics(games: ScheduledGame[], gotwIds = new Set<string>(), ranksByGameId = new Map<string, Map<string, number>>()) {
  const played = games.filter((game) => game.homeScore != null && game.awayScore != null);
  const margin = (game: ScheduledGame) => Math.abs(game.homeScore! - game.awayScore!);
  const total = (game: ScheduledGame) => game.homeScore! + game.awayScore!;
  const marginRanks = competitionRanks(played, margin, "asc");
  const totalRanks = competitionRanks(played, total, "desc");
  const quality = (game: ScheduledGame) => (marginRanks.get(game.id) ?? played.length) + (totalRanks.get(game.id) ?? played.length);
  const qualityRanks = competitionRanks(played, quality, "asc");
  return played.map((game): GameAnalytics => {
    const marginRank = marginRanks.get(game.id)!;
    const totalRank = totalRanks.get(game.id)!;
    const qualityRank = qualityRanks.get(game.id)!;
    const badges: GameBadge[] = [];
    if (gotwIds.has(game.id)) badges.push("GOTW");
    if (isUpsetResult(game, ranksByGameId.get(game.id))) badges.push("Upset");
    if (totalRank <= 3) badges.push("Shootout");
    return { game, margin: margin(game), total: total(game), marginRank, totalRank, qualityScore: quality(game), qualityRank, badges };
  });
}

export function getScheduleGameSignals(schedule: GeneratedSchedule) {
  const gotwTimeline = getGameOfWeekTimeline(schedule);
  const gotwIds = new Set(gotwTimeline.map((entry) => entry.game.id));
  const gotwByWeek = new Map(gotwTimeline.map((entry) => [entry.weekNumber, entry]));
  const games = schedule.weeks.flatMap((week) => week.games);
  const ranksByGameId = new Map<string, Map<string, number>>();
  schedule.weeks.forEach((week) => {
    const ranks = getEnteringWeekRankMap(schedule, week.weekNumber);
    week.games.forEach((game) => ranksByGameId.set(game.id, ranks));
  });
  const analytics = calculateGameAnalytics(games, gotwIds, ranksByGameId);
  const byGameId = new Map(analytics.map((item) => [item.game.id, item]));
  return { gotwIds, byGameId, gotwTimeline, gotwByWeek };
}
