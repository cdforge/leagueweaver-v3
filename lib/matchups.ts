import type { ScheduleWeek, ScheduledGame } from "./types";

export interface MatchupSignal {
  rating: number;
  normalized: number;
  /**
   * User-facing 0.1–10.0 rating (one decimal, higher is better) derived from `rating`.
   * `rating` stays the raw lower-is-better figure used for sorting, GOTW selection, and
   * the engine; `score10` is display-only. See {@link toMatchupScore10}.
   */
  score10: number;
  bars: 1 | 2 | 3;
  label: "Competitive" | "Neutral" | "Lopsided";
}

export interface MatchupRatingRange {
  min: number;
  max: number;
}

// The raw matchup rating is "lower is better" and league-size dependent: the best
// possible game (ranks #1 vs #2) is always 3.7, and the worst (rank #1 vs #N) grows with
// the league. We surface a recognizable 0.1–10.0 score where 10 = the best matchup the
// league can produce, anchored to that theoretical span so a given score means the same
// thing across weeks and across leagues of the same size (never a hard 0 — floored at 0.1).
export const MATCHUP_SCORE10_FLOOR = 0.1;
const MATCHUP_BEST_RAW = 3.7; // ranks #1 vs #2: (1 + 2) / 2 + 2.2 * 1

export function matchupScoreBounds(teamCount: number) {
  const teams = Math.max(2, Math.round(teamCount));
  return { best: MATCHUP_BEST_RAW, worst: (1 + teams) / 2 + 2.2 * (teams - 1) };
}

export function toMatchupScore10(raw: number, teamCount: number): number {
  const { best, worst } = matchupScoreBounds(teamCount);
  const span = worst - best;
  const strength = span > 0 ? (worst - raw) / span : 1; // 1 = best possible, 0 = worst possible
  const score = Math.max(MATCHUP_SCORE10_FLOOR, Math.min(10, strength * 10));
  return Math.round(score * 10) / 10;
}

// A week's 0.1–10.0 slate score, on the SAME scale as individual matchups. Computed from the
// AVERAGE of the week's matchups so it reflects the whole slate, not just its best game. The
// slate RANK is ordered by this same average (see normalizeScheduleMatchups), so the score and
// the rank never disagree (better rank ⇒ higher score). Returns undefined for un-normalized weeks.
export function weekSlateScore10(averageMatchupRating: number | undefined, teamCount: number): number | undefined {
  return averageMatchupRating == null ? undefined : toMatchupScore10(averageMatchupRating, teamCount);
}

export interface GameOfWeekContext {
  weekNumber: number;
  regularSeasonWeeks: number;
  playoffFieldSize: number;
  playoffBerthTeamIds?: ReadonlySet<string>;
  eliminatedTeamIds?: ReadonlySet<string>;
}

export interface GameOfWeekSelection {
  gameId: string;
  rating: number;
  adjustedRating: number;
  playoffImplication: boolean;
  pureGameId: string;
  pureRating: number;
}

export function calculateMatchupRating(game: Pick<ScheduledGame, "homeTeamId" | "awayTeamId">, ranks: Map<string, number>) {
  const homeRank = ranks.get(game.homeTeamId) ?? 999;
  const awayRank = ranks.get(game.awayTeamId) ?? 999;
  return Math.round(((awayRank + homeRank) / 2 + 2.2 * Math.abs(awayRank - homeRank)) * 10) / 10;
}

export function matchupRating(game: ScheduledGame, ranks?: Map<string, number>) {
  return ranks ? calculateMatchupRating(game, ranks) : game.matchupRating ?? 999;
}

export function getMatchupRatingRange(games: ScheduledGame[], ranks?: Map<string, number>): MatchupRatingRange {
  const ratings = games.map((game) => matchupRating(game, ranks)).filter(Number.isFinite);
  return ratings.length ? { min: Math.min(...ratings), max: Math.max(...ratings) } : { min: 0, max: 0 };
}

export function getMatchupSignal(game: ScheduledGame, ranks?: Map<string, number>, range?: MatchupRatingRange, teamCount?: number): MatchupSignal {
  const rating = matchupRating(game, ranks);
  const resolvedRange = range ?? getMatchupRatingRange([game], ranks);
  const span = resolvedRange.max - resolvedRange.min;
  const normalized = span > 0 ? Math.max(0, Math.min(1, (rating - resolvedRange.min) / span)) : 0.5;
  // teamCount anchors the absolute 0–10 score; fall back to the rank map's size, then 12.
  const score10 = toMatchupScore10(rating, teamCount ?? ranks?.size ?? 12);
  if (normalized <= 1 / 3) return { rating, normalized, score10, bars: 3, label: "Competitive" };
  if (normalized <= 2 / 3) return { rating, normalized, score10, bars: 2, label: "Neutral" };
  return { rating, normalized, score10, bars: 1, label: "Lopsided" };
}

export function getWeeklyMatchupSignal(rank: number, totalWeeks: number): MatchupSignal {
  const total = Math.max(1, Math.round(totalWeeks));
  const safeRank = Math.max(1, Math.min(total, Math.round(rank)));
  const normalized = total > 1 ? (safeRank - 1) / (total - 1) : 0;
  // Slate strength on a 0.1–10 scale (higher = stronger slate); this signal is rank-based,
  // so the score is relative to the season rather than league-anchored like game scores.
  const score10 = Math.round(Math.max(0.1, Math.min(10, (1 - normalized) * 10)) * 10) / 10;
  if (normalized <= 1 / 3) return { rating: safeRank, normalized, score10, bars: 3, label: "Competitive" };
  if (normalized <= 2 / 3) return { rating: safeRank, normalized, score10, bars: 2, label: "Neutral" };
  return { rating: safeRank, normalized, score10, bars: 1, label: "Lopsided" };
}

function matchupTypeOrder(game: ScheduledGame) {
  return game.matchupType === "division" ? 0 : 1;
}

function orderedRankPair(game: ScheduledGame, ranks: Map<string, number>) {
  const values = [ranks.get(game.homeTeamId) ?? 999, ranks.get(game.awayTeamId) ?? 999];
  return values.sort((left, right) => left - right);
}

function orderedTeamPair(game: ScheduledGame) {
  return [game.homeTeamId, game.awayTeamId].sort((left, right) => left.localeCompare(right));
}

export function compareGamesByMatchupRating(left: ScheduledGame, right: ScheduledGame, ranks: Map<string, number>) {
  const ratingDifference = calculateMatchupRating(left, ranks) - calculateMatchupRating(right, ranks);
  if (ratingDifference) return ratingDifference;
  const typeDifference = matchupTypeOrder(left) - matchupTypeOrder(right);
  if (typeDifference) return typeDifference;
  const leftRanks = orderedRankPair(left, ranks);
  const rightRanks = orderedRankPair(right, ranks);
  const firstRankDifference = leftRanks[0] - rightRanks[0];
  if (firstRankDifference) return firstRankDifference;
  const secondRankDifference = leftRanks[1] - rightRanks[1];
  if (secondRankDifference) return secondRankDifference;
  const leftTeams = orderedTeamPair(left);
  const rightTeams = orderedTeamPair(right);
  return leftTeams[0].localeCompare(rightTeams[0]) || leftTeams[1].localeCompare(rightTeams[1]) || left.id.localeCompare(right.id);
}

export function orderWeekGamesByMatchupRating(games: ScheduledGame[], ranks: Map<string, number>) {
  return games
    .map((game) => ({ ...game, matchupRating: calculateMatchupRating(game, ranks) }))
    .sort((left, right) => compareGamesByMatchupRating(left, right, ranks))
    .map((game, index) => ({ ...game, gameNumber: index + 1 }));
}

export function normalizeScheduleMatchups(weeks: ScheduleWeek[], ranksForWeek: (weekNumber: number) => Map<string, number>): ScheduleWeek[] {
  const orderedWeeks = normalizeSeriesGameNumbers(weeks.map((week) => ({
    ...week,
    games: orderWeekGamesByMatchupRating(week.games, ranksForWeek(week.weekNumber)),
  })));
  const metrics = orderedWeeks.map((week) => {
    const ratings = week.games.map((game) => game.matchupRating ?? 999);
    const bestMatchupRating = Math.min(...ratings);
    const averageMatchupRating = Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / Math.max(1, ratings.length)) * 10) / 10;
    return { weekNumber: week.weekNumber, bestMatchupRating, averageMatchupRating };
  });
  // Rank weeks by AVERAGE matchup rating (lower raw = stronger slate = rank #1), with the best
  // single matchup as the tiebreak. The slate score (weekSlateScore10) uses the same average, so
  // rank and score stay consistent, and this matches the home-page preview's average-based rank.
  const ranked = [...metrics].sort((left, right) =>
    left.averageMatchupRating - right.averageMatchupRating
    || left.bestMatchupRating - right.bestMatchupRating
    || left.weekNumber - right.weekNumber,
  );
  const matchupRankByWeek = new Map(ranked.map((week, index) => [week.weekNumber, index + 1]));
  const metricsByWeek = new Map(metrics.map((week) => [week.weekNumber, week]));
  return orderedWeeks.map((week) => ({
    ...week,
    ...metricsByWeek.get(week.weekNumber),
    matchupRank: matchupRankByWeek.get(week.weekNumber),
  }));
}

function playoffImplicationScore(game: ScheduledGame, ranks: Map<string, number>, context: GameOfWeekContext) {
  const fieldSize = context.playoffFieldSize;
  if (fieldSize >= ranks.size) return 0;
  const hasClinchContext = Boolean(context.playoffBerthTeamIds || context.eliminatedTeamIds);
  if (hasClinchContext) {
    const unsettled = (teamId: string) => !context.playoffBerthTeamIds?.has(teamId) && !context.eliminatedTeamIds?.has(teamId);
    if (!unsettled(game.homeTeamId) && !unsettled(game.awayTeamId)) return 0;
  }
  const homeRank = ranks.get(game.homeTeamId) ?? Number.POSITIVE_INFINITY;
  const awayRank = ranks.get(game.awayTeamId) ?? Number.POSITIVE_INFINITY;
  const cutline = fieldSize + 0.5;
  const proximity = (rank: number) => Math.max(0, 3 - Math.abs(rank - cutline));
  const crossesCutline = (homeRank <= fieldSize) !== (awayRank <= fieldSize);
  const nearCutline = Math.abs(homeRank - cutline) <= 1.5 && Math.abs(awayRank - cutline) <= 1.5;
  const bubbleCrossing = crossesCutline && Math.abs(homeRank - cutline) <= 2.5 && Math.abs(awayRank - cutline) <= 2.5;
  if (!nearCutline && !bubbleCrossing) return 0;
  return proximity(homeRank) + proximity(awayRank) + (crossesCutline ? 4 : 0);
}

export function getGameOfWeekSelection(games: ScheduledGame[], ranks: Map<string, number>, context?: GameOfWeekContext): GameOfWeekSelection | undefined {
  if (!games.length) return undefined;
  const weightPlayoffImplications = context && context.weekNumber >= context.regularSeasonWeeks - 2;
  const candidates = games.map((game, index) => {
    const rating = calculateMatchupRating(game, ranks);
    const implication = weightPlayoffImplications && context ? playoffImplicationScore(game, ranks, context) : 0;
    return { game, index, rating, implication };
  });
  const purePick = [...candidates].sort((left, right) => left.rating - right.rating || compareGamesByMatchupRating(left.game, right.game, ranks) || left.index - right.index)[0];
  const selected = candidates
    .filter((candidate) => candidate.rating === purePick.rating)
    .sort((left, right) => right.implication - left.implication || compareGamesByMatchupRating(left.game, right.game, ranks) || left.index - right.index)[0];
  return {
    gameId: selected.game.id,
    rating: selected.rating,
    adjustedRating: selected.rating,
    playoffImplication: selected.implication > 0 && selected.game.id !== purePick.game.id,
    pureGameId: purePick.game.id,
    pureRating: purePick.rating,
  };
}

export function getGameOfWeekId(games: ScheduledGame[], ranks: Map<string, number>, context?: GameOfWeekContext) {
  return getGameOfWeekSelection(games, ranks, context)?.gameId;
}

export function sortGamesForDisplay(games: ScheduledGame[], ranks?: Map<string, number>) {
  const order = new Map(games.map((game, index) => [game.id, index]));
  return [...games]
    .sort((left, right) => {
      if (ranks) return compareGamesByMatchupRating(left, right, ranks);
      const ratingDifference = matchupRating(left) - matchupRating(right);
      return ratingDifference || (left.gameNumber ?? order.get(left.id) ?? 0) - (right.gameNumber ?? order.get(right.id) ?? 0);
    })
    .map((game, index) => ({ ...game, gameNumber: index + 1 }));
}

export function matchupSeriesLabel(game: ScheduledGame) {
  const type = game.matchupType === "division" ? "Div" : "Cross-div";
  return `${type} · ${game.seriesGame} of ${game.seriesLength}`;
}

export function normalizeSeriesGameNumbers(weeks: ScheduleWeek[]): ScheduleWeek[] {
  const orderedGames = [...weeks]
    .sort((left, right) => left.weekNumber - right.weekNumber)
    .flatMap((week) => week.games);
  const pairKey = (game: ScheduledGame) => [game.homeTeamId, game.awayTeamId].sort().join("|");
  const totals = new Map<string, number>();
  const occurrences = new Map<string, number>();
  const numbering = new Map<string, { seriesGame: number; seriesLength: number }>();
  for (const game of orderedGames) {
    const key = pairKey(game);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  for (const game of orderedGames) {
    const key = pairKey(game);
    const seriesGame = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, seriesGame);
    numbering.set(game.id, { seriesGame, seriesLength: totals.get(key) ?? 1 });
  }
  return weeks.map((week) => ({
    ...week,
    games: week.games.map((game) => ({ ...game, ...numbering.get(game.id) })),
  }));
}

export function formatGameDateTimeOverride(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(date);
}
