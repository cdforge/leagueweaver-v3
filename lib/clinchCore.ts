import { conferenceDivisionGroups } from "./conferences";
import { projectPlayoffSeeds, resolvePlayoffPlacementMode } from "./playoffs";
import { calculateDivisionStandings, calculateStandings } from "./standings";
import type { GeneratedSchedule, StandingsRow } from "./types";

/**
 * Shared clinch/elimination core — the single source of truth for the points-range
 * model used by both the retrospective badges (`lib/clinch.ts`) and the prospective
 * "Stakes" scenario engine (`lib/scenarios.ts`). See docs/stakes-engine-scope.md.
 *
 * Scoring: win = 2 points, tie = 1 (`wins*2 + ties`). Each remaining game is worth up
 * to 2. The model reasons purely over per-team point ranges; it never breaks ties. That
 * makes every *positive* clinch it reports exact (if no rival can even reach a team on
 * points, tiebreakers are moot) while tie-boundary questions are deferred to the exact
 * evaluator (not yet built) and surfaced via `approximate`.
 */

export type ClinchAchievement = "top-seed" | "division-title" | "playoff-berth";

export interface TeamRange {
  teamId: string;
  divisionId: string;
  /** Points already guaranteed (games played through the cutoff). */
  minimumPoints: number;
  /** Best case: guaranteed points + 2 per remaining game. */
  maximumPoints: number;
}

export function standingsPoints(row: Pick<StandingsRow, "wins" | "ties">) {
  return row.wins * 2 + row.ties;
}

export function getLatestScoredWeek(schedule: GeneratedSchedule) {
  return schedule.weeks.reduce((latest, week) => (
    week.games.some((game) => game.homeScore != null && game.awayScore != null)
      ? Math.max(latest, week.weekNumber)
      : latest
  ), 0);
}

export function isRegularSeasonComplete(schedule: GeneratedSchedule, throughWeek: number) {
  return schedule.weeks.every((week) => (
    week.weekNumber > throughWeek
      ? week.games.length === 0
      : week.games.every((game) => game.homeScore != null && game.awayScore != null)
  ));
}

export function buildTeamRanges(schedule: GeneratedSchedule, throughWeek: number): TeamRange[] {
  const standings = calculateStandings(schedule, throughWeek);
  const standingsByTeam = new Map(standings.map((row) => [row.teamId, row]));
  const totalGames = new Map(schedule.setup.teams.map((team) => [team.id, 0]));
  const playedGames = new Map(schedule.setup.teams.map((team) => [team.id, 0]));

  for (const week of schedule.weeks) {
    for (const game of week.games) {
      totalGames.set(game.homeTeamId, (totalGames.get(game.homeTeamId) ?? 0) + 1);
      totalGames.set(game.awayTeamId, (totalGames.get(game.awayTeamId) ?? 0) + 1);
      if (week.weekNumber <= throughWeek && game.homeScore != null && game.awayScore != null) {
        playedGames.set(game.homeTeamId, (playedGames.get(game.homeTeamId) ?? 0) + 1);
        playedGames.set(game.awayTeamId, (playedGames.get(game.awayTeamId) ?? 0) + 1);
      }
    }
  }

  return schedule.setup.teams.map((team): TeamRange => {
    const row = standingsByTeam.get(team.id)!;
    const remainingGames = Math.max(0, (totalGames.get(team.id) ?? 0) - (playedGames.get(team.id) ?? 0));
    const minimumPoints = standingsPoints(row);
    return {
      teamId: team.id,
      divisionId: team.divisionId,
      minimumPoints,
      maximumPoints: minimumPoints + remainingGames * 2,
    };
  });
}

/** A team clinches one of `slots` spots iff fewer than `slots` rivals can still reach it. */
export function clinchedWithin(ranges: TeamRange[], team: TeamRange, slots: number) {
  if (slots >= ranges.length) return true;
  return ranges.filter((rival) => rival.teamId !== team.teamId && rival.maximumPoints >= team.minimumPoints).length < slots;
}

/** A team is eliminated from `slots` spots iff at least `slots` rivals are already ahead of its ceiling. */
export function eliminatedWithin(ranges: TeamRange[], team: TeamRange, slots: number) {
  if (slots >= ranges.length) return false;
  return ranges.filter((rival) => rival.teamId !== team.teamId && rival.minimumPoints > team.maximumPoints).length >= slots;
}

export function divisionGroups(schedule: GeneratedSchedule) {
  // Conference-aware: even divisions with an assignment split into two conferences; two
  // divisions each become a side; odd/unassigned collapse to a single unified group.
  return conferenceDivisionGroups(schedule.setup);
}

export function resolvedPlayoffFieldSize(schedule: GeneratedSchedule) {
  return Math.max(2, Math.min(schedule.setup.teams.length, Math.round(schedule.setup.playoffs.fieldSize)));
}

export interface ClinchPool {
  /** Team ids that compete for the pool's spots (includes the subject team). */
  teamIds: string[];
  /** Number of qualifying spots in the pool. */
  slots: number;
}

/**
 * The pool of rivals + number of spots a team competes for, for a given achievement.
 * Mirrors the branch logic in `calculateTeamClinchStates` so the boolean states and the
 * scenario engine can never diverge.
 *
 * Returns `null` when the achievement is not applicable (e.g. division title with no
 * divisions) or not yet supported by the single-pool model — currently the
 * division-aware playoff placement modes (`division-leaders`, `division-halves`), whose
 * berth clinch combines a division-title check with an at-large check and therefore is
 * not a single pool. Those are handled in a later phase (see scope doc §8).
 */
export function resolveClinchPool(
  schedule: GeneratedSchedule,
  teamId: string,
  achievement: ClinchAchievement,
  throughWeek: number,
): ClinchPool | null {
  const teams = schedule.setup.teams;
  const team = teams.find((entry) => entry.id === teamId);
  if (!team) return null;
  const hasDivisions = schedule.setup.divisions.length > 1;

  if (achievement === "top-seed") {
    return { teamIds: teams.map((entry) => entry.id), slots: 1 };
  }

  if (achievement === "division-title") {
    if (!hasDivisions) return null;
    return {
      teamIds: teams.filter((entry) => entry.divisionId === team.divisionId).map((entry) => entry.id),
      slots: 1,
    };
  }

  // playoff-berth
  const fieldSize = resolvedPlayoffFieldSize(schedule);
  const placementMode = resolvePlayoffPlacementMode({
    divisions: schedule.setup.divisions,
    conferences: schedule.setup.conferences,
    playoffs: { ...schedule.setup.playoffs, fieldSize },
  });
  if (placementMode === "overall") {
    return { teamIds: teams.map((entry) => entry.id), slots: fieldSize };
  }
  // division-leaders / division-halves: not a single pool — deferred.
  void throughWeek;
  return null;
}

export interface LockResult {
  /** True iff the achievement (or, for elimination, the elimination) is mathematically certain. */
  locked: boolean;
  /**
   * True only when a search cap forced a fallback to the conservative points certificate —
   * the answer could actually be `locked` but wasn't verified. `{ locked: false,
   * approximate: true }` means "conservatively reported not-locked; may actually be locked".
   * When the exact evaluator runs to completion this is always `false`.
   */
  approximate: boolean;
}

export type EliminationLockResult = LockResult;

export interface LockOptions {
  /**
   * Upper bound on `3^(remaining games)` the exact tie-boundary search will enumerate before
   * falling back to the conservative certificate (`approximate: true`). The certificate
   * resolves the vast majority of calls without any search; only exact tie boundaries reach
   * this. Default keeps a single call to ≤ ~2200 standings evaluations.
   */
  maxSearchNodes?: number;
  /** Precomputed `buildTeamRanges(schedule, throughWeek)` to reuse across many calls. */
  ranges?: TeamRange[];
}

const DEFAULT_MAX_SEARCH_NODES = 2200;
const ADVERSARIAL_MARGIN = 100;

interface RemainingGameRef {
  weekIndex: number;
  gameIndex: number;
  homeTeamId: string;
  awayTeamId: string;
}

function listRemainingGames(schedule: GeneratedSchedule): RemainingGameRef[] {
  const games: RemainingGameRef[] = [];
  schedule.weeks.forEach((week, weekIndex) =>
    week.games.forEach((game, gameIndex) => {
      if (game.homeScore == null || game.awayScore == null) {
        games.push({ weekIndex, gameIndex, homeTeamId: game.homeTeamId, awayTeamId: game.awayTeamId });
      }
    }),
  );
  return games;
}

/**
 * Score a hypothesized game outcome (0 = home win, 1 = away win, 2 = tie) with the margin
 * that is *worst* (`perspective: "against"`) or *best* (`"for"`) for `teamId`'s tiebreakers.
 * Win/loss/tie is fixed by the outcome; only the margin varies, feeding the score-based
 * tiebreaker rules (point-differential, points-for) adversarially. Rules that depend on
 * opponents' win/loss records (SoV/SoS, head-to-head, division %) are margin-invariant, so
 * this single scoring realizes the true worst/best case for the subject given the outcome.
 */
function scoreOutcome(game: RemainingGameRef, outcome: number, teamId: string, perspective: "for" | "against"): [number, number] {
  if (outcome === 2) return [0, 0];
  const homeWins = outcome === 0;
  const teamIsWinner = (homeWins && game.homeTeamId === teamId) || (!homeWins && game.awayTeamId === teamId);
  const winnerBig = perspective === "for" ? teamIsWinner : !teamIsWinner;
  const winnerScore = winnerBig ? ADVERSARIAL_MARGIN : 1;
  return homeWins ? [winnerScore, 0] : [0, winnerScore];
}

function evaluateAchieved(schedule: GeneratedSchedule, teamId: string, achievement: ClinchAchievement, divisionId: string): boolean {
  if (achievement === "top-seed") return calculateStandings(schedule)[0]?.teamId === teamId;
  if (achievement === "division-title") return calculateDivisionStandings(schedule, divisionId)[0]?.teamId === teamId;
  return projectPlayoffSeeds(schedule).some((seed) => seed.teamId === teamId);
}

/**
 * Exact tie-boundary evaluator. Enumerates every completion of the remaining games (each →
 * home win / away win / tie) with margins scored adversarially for the subject, and asks
 * whether the subject achieves the target in *all* of them (clinch) or *none* of them
 * (elimination). Sound by construction — worst-case margins mean a positive verdict holds
 * for every scoreline, and rival-vs-rival games are handled because a real completion can't
 * let two opponents both win their shared game. Returns `approximate` when the space exceeds
 * `maxNodes` (falls back to the conservative certificate, never a false verdict).
 */
function exactBoundary(
  schedule: GeneratedSchedule,
  teamId: string,
  achievement: ClinchAchievement,
  divisionId: string,
  goal: "clinch" | "eliminate",
  maxNodes: number,
): LockResult {
  const remaining = listRemainingGames(schedule);
  const total = 3 ** remaining.length;
  if (total > maxNodes) return { locked: false, approximate: true };
  const clone: GeneratedSchedule = structuredClone(schedule);
  const perspective = goal === "clinch" ? "against" : "for";
  for (let mask = 0; mask < total; mask += 1) {
    let cursor = mask;
    for (const ref of remaining) {
      const outcome = cursor % 3;
      cursor = (cursor - outcome) / 3;
      const [homeScore, awayScore] = scoreOutcome(ref, outcome, teamId, perspective);
      const game = clone.weeks[ref.weekIndex].games[ref.gameIndex];
      game.homeScore = homeScore;
      game.awayScore = awayScore;
    }
    const achieved = evaluateAchieved(clone, teamId, achievement, divisionId);
    if (goal === "clinch" && !achieved) return { locked: false, approximate: false };
    if (goal === "eliminate" && achieved) return { locked: false, approximate: false };
  }
  return { locked: true, approximate: false };
}

/**
 * Whether `teamId` has locked `achievement` given results through `throughWeek`. Three
 * layers: a points certificate (exact whenever decisive), then — only at a genuine tie
 * boundary — the exact adversarial search. Never a false positive; `approximate: true` only
 * when a search cap forced the conservative fallback.
 */
export function isLockedFor(
  schedule: GeneratedSchedule,
  teamId: string,
  achievement: ClinchAchievement,
  throughWeek: number,
  options: LockOptions = {},
): LockResult {
  const pool = resolveClinchPool(schedule, teamId, achievement, throughWeek);
  if (!pool) return { locked: false, approximate: true };
  const ranges = options.ranges ?? buildTeamRanges(schedule, throughWeek);
  const rangeById = new Map(ranges.map((range) => [range.teamId, range]));
  const team = rangeById.get(teamId);
  if (!team) return { locked: false, approximate: false };
  const poolRanges = pool.teamIds.map((id) => rangeById.get(id)).filter((range): range is TeamRange => Boolean(range));

  // Fast path: no rival can even reach the subject on points → exactly clinched.
  if (clinchedWithin(poolRanges, team, pool.slots)) return { locked: true, approximate: false };
  // Fast path: too many rivals strictly ahead on points even if every points-tie broke the
  // subject's way → no tiebreaker can help, exactly not locked.
  const strictBlockers = poolRanges.filter((rival) => rival.teamId !== teamId && rival.maximumPoints > team.minimumPoints).length;
  if (strictBlockers >= pool.slots) return { locked: false, approximate: false };

  // Tie boundary: a rival can match the subject on points. Resolve exactly.
  const divisionId = schedule.setup.teams.find((entry) => entry.id === teamId)?.divisionId ?? "";
  return exactBoundary(schedule, teamId, achievement, divisionId, "clinch", options.maxSearchNodes ?? DEFAULT_MAX_SEARCH_NODES);
}

/**
 * Dual of `isLockedFor` for playoff elimination: is `teamId` mathematically out of the
 * playoff field given results through `throughWeek`? Same pool/slots, exact at the boundary.
 */
export function isEliminatedFor(
  schedule: GeneratedSchedule,
  teamId: string,
  throughWeek: number,
  options: LockOptions = {},
): EliminationLockResult {
  const pool = resolveClinchPool(schedule, teamId, "playoff-berth", throughWeek);
  if (!pool) return { locked: false, approximate: true };
  const ranges = options.ranges ?? buildTeamRanges(schedule, throughWeek);
  const rangeById = new Map(ranges.map((range) => [range.teamId, range]));
  const team = rangeById.get(teamId);
  if (!team) return { locked: false, approximate: false };
  const poolRanges = pool.teamIds.map((id) => rangeById.get(id)).filter((range): range is TeamRange => Boolean(range));

  // Fast path: at least `slots` rivals already strictly ahead of the subject's ceiling.
  if (eliminatedWithin(poolRanges, team, pool.slots)) return { locked: true, approximate: false };
  // Fast path: fewer than `slots` rivals can even reach the subject's ceiling → still alive.
  const canReach = poolRanges.filter((rival) => rival.teamId !== teamId && rival.minimumPoints >= team.maximumPoints).length;
  if (canReach < pool.slots) return { locked: false, approximate: false };

  const divisionId = schedule.setup.teams.find((entry) => entry.id === teamId)?.divisionId ?? "";
  return exactBoundary(schedule, teamId, "playoff-berth", divisionId, "eliminate", options.maxSearchNodes ?? DEFAULT_MAX_SEARCH_NODES);
}
