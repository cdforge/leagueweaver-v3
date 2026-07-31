import type { GeneratedSchedule } from "@/lib/types";

/**
 * Pure, deterministic stat derivations for the generation reveal / season recap.
 * Everything is read off the already-solved schedule and the commissioner's
 * rankings — no randomness, no fake data. Leagues play exactly one game per team
 * per week with no byes, so each team's opponent list is one entry per week.
 */

export type SeriesGap = { aId: string; bId: string; first: number; last: number; gap: number };
export type StrengthPick = { teamId: string; avgOpponentRank: number };
export type Gauntlet = { teamId: string; startWeek: number; endWeek: number; avgOpponentRank: number; opponentRanks: number[] };

function pairKey(a: string, b: string): string {
  return [a, b].sort((left, right) => left.localeCompare(right)).join("~");
}

/** Per team, opponents in ascending week order (one opponent per week). */
export function opponentsByWeek(schedule: GeneratedSchedule): Map<string, { week: number; opponentId: string }[]> {
  const table = new Map<string, { week: number; opponentId: string }[]>();
  for (const team of schedule.setup.teams) table.set(team.id, []);
  for (const week of [...schedule.weeks].sort((a, b) => a.weekNumber - b.weekNumber)) {
    for (const game of week.games) {
      table.get(game.homeTeamId)?.push({ week: week.weekNumber, opponentId: game.awayTeamId });
      table.get(game.awayTeamId)?.push({ week: week.weekNumber, opponentId: game.homeTeamId });
    }
  }
  for (const list of table.values()) list.sort((a, b) => a.week - b.week);
  return table;
}

/**
 * Hardest and easiest schedules by mean opponent overall-rank (lower rank number
 * = stronger team, so the lowest average is the toughest slate). Divisional
 * double-plays are counted twice because both games really happen.
 */
export function strengthOfSchedule(schedule: GeneratedSchedule): { hardest?: StrengthPick; easiest?: StrengthPick } {
  const rankById = new Map(schedule.setup.teams.map((team) => [team.id, team.overallRank]));
  let hardest: StrengthPick | undefined;
  let easiest: StrengthPick | undefined;
  for (const [teamId, games] of opponentsByWeek(schedule)) {
    if (!games.length) continue;
    const avg = games.reduce((sum, game) => sum + (rankById.get(game.opponentId) ?? 0), 0) / games.length;
    if (!hardest || avg < hardest.avgOpponentRank) hardest = { teamId, avgOpponentRank: avg };
    if (!easiest || avg > easiest.avgOpponentRank) easiest = { teamId, avgOpponentRank: avg };
  }
  return { hardest, easiest };
}

/** The single toughest run: the consecutive-week window with the lowest average opponent rank. */
export function toughestGauntlet(schedule: GeneratedSchedule, windowSize = 4): Gauntlet | undefined {
  const rankById = new Map(schedule.setup.teams.map((team) => [team.id, team.overallRank]));
  let best: Gauntlet | undefined;
  for (const [teamId, games] of opponentsByWeek(schedule)) {
    const size = Math.min(windowSize, games.length);
    if (size < 2) continue;
    for (let start = 0; start + size <= games.length; start += 1) {
      const slice = games.slice(start, start + size);
      // Only genuinely consecutive weeks count as one stretch.
      if (slice[size - 1].week - slice[0].week !== size - 1) continue;
      const ranks = slice.map((game) => rankById.get(game.opponentId) ?? 0);
      const avg = ranks.reduce((sum, rank) => sum + rank, 0) / size;
      if (!best || avg < best.avgOpponentRank) {
        best = { teamId, startWeek: slice[0].week, endWeek: slice[size - 1].week, avgOpponentRank: avg, opponentRanks: ranks };
      }
    }
  }
  return best;
}

/**
 * Among divisional rematch series (each pair meets twice), the one whose two
 * meetings are spaced furthest apart and the one spaced closest together.
 */
export function divisionSeriesGaps(schedule: GeneratedSchedule): { longest?: SeriesGap; closest?: SeriesGap } {
  const pairs = new Map<string, { aId: string; bId: string; weeks: number[] }>();
  for (const week of schedule.weeks) {
    for (const game of week.games) {
      if (game.matchupType !== "division") continue;
      const key = pairKey(game.homeTeamId, game.awayTeamId);
      const entry = pairs.get(key) ?? { aId: game.homeTeamId, bId: game.awayTeamId, weeks: [] };
      entry.weeks.push(week.weekNumber);
      pairs.set(key, entry);
    }
  }
  let longest: SeriesGap | undefined;
  let closest: SeriesGap | undefined;
  for (const entry of pairs.values()) {
    if (entry.weeks.length < 2) continue;
    const sorted = [...entry.weeks].sort((a, b) => a - b);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const record: SeriesGap = { aId: entry.aId, bId: entry.bId, first, last, gap: last - first };
    if (!longest || record.gap > longest.gap) longest = record;
    if (!closest || record.gap < closest.gap) closest = record;
  }
  return { longest, closest };
}
