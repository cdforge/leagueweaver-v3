import { calculateTeamClinchStates } from "./clinch";
import {
  buildTeamRanges,
  isEliminatedFor,
  isLockedFor,
  resolveClinchPool,
  resolvedPlayoffFieldSize,
  type ClinchAchievement,
  type TeamRange,
} from "./clinchCore";
import { resolvePlayoffPlacementMode } from "./playoffs";
import { calculateStandings } from "./standings";
import type { GeneratedSchedule, ScheduledGame } from "./types";

/**
 * Prospective "Stakes" scenario engine. For the live week, returns every outcome that can be
 * clinched or sealed this week and exactly what it would take — built on the exact
 * clinch/elimination core so it never contradicts the official badges. See
 * docs/stakes-engine-scope.md (§3b, §4).
 */

export type ScenarioAchievement = ClinchAchievement | "elimination";

/** The subject's own required result. `none` = the subject has no game this week (bye). */
export type OwnResult = "win" | "win-or-tie" | "tie" | "loss" | "none";
/** A required result for another team's game this week. */
export type ConditionResult = "win" | "win-or-tie" | "loss" | "loss-or-tie";

export interface ScenarioCondition {
  teamId: string;
  result: ConditionResult;
  /** The rival's week game that decides this condition (for opponent display + deep link). */
  gameId: string;
}

export interface ScenarioPath {
  kind: "clean" | "needs-help";
  own: OwnResult;
  conditions: ScenarioCondition[];
  /** More than one interchangeable set of help would also work (only the tightest is listed). */
  hasAlternates?: boolean;
}

export interface Scenario {
  teamId: string;
  achievement: ScenarioAchievement;
  /** Set for division-title — drives the division logo/name in the headline. */
  divisionId?: string;
  /** The subject's own game this week (header matchup + deep link); undefined on a bye. */
  subjectGameId?: string;
  /** True when a clean path exists (win/tie and in — no scoreboard-watching). */
  controlsOwnDestiny: boolean;
  /** Clean paths first, then needs-help. */
  paths: ScenarioPath[];
}

export interface WeekScenarios {
  week: number;
  scenarios: Scenario[];
}

const ACHIEVEMENT_ORDER: ScenarioAchievement[] = ["top-seed", "division-title", "playoff-berth", "elimination"];

// ---------------------------------------------------------------------------
// Schedule hypothesis helpers
// ---------------------------------------------------------------------------
function liveWeek(schedule: GeneratedSchedule): number {
  for (const week of [...schedule.weeks].sort((a, b) => a.weekNumber - b.weekNumber)) {
    if (week.games.some((game) => game.homeScore == null || game.awayScore == null)) return week.weekNumber;
  }
  return 0;
}

/** The earliest week with an unplayed game — where the "Stakes" trigger should appear. */
export function getLiveWeek(schedule: GeneratedSchedule): number {
  return liveWeek(schedule);
}

function weekGamesOf(schedule: GeneratedSchedule, week: number): ScheduledGame[] {
  return schedule.weeks.find((entry) => entry.weekNumber === week)?.games ?? [];
}

function teamGameThisWeek(schedule: GeneratedSchedule, week: number, teamId: string): ScheduledGame | undefined {
  return weekGamesOf(schedule, week).find((game) => game.homeTeamId === teamId || game.awayTeamId === teamId);
}

/** Set a game's score so `teamId` gets `result`. Winner scores 1 (margins are irrelevant to
 * the clinch core, which reasons over win/loss/tie). */
function applyResult(game: ScheduledGame, teamId: string, result: "win" | "tie" | "loss") {
  const isHome = game.homeTeamId === teamId;
  if (result === "tie") { game.homeScore = 0; game.awayScore = 0; return; }
  const teamWins = result === "win";
  const homeScore = (isHome === teamWins) ? 1 : 0;
  game.homeScore = homeScore;
  game.awayScore = homeScore === 1 ? 0 : 1;
}

interface Assignment { gameId: string; teamId: string; result: "win" | "tie" | "loss"; }

function hypothesis(schedule: GeneratedSchedule, week: number, assignments: Assignment[]): GeneratedSchedule {
  const clone: GeneratedSchedule = structuredClone(schedule);
  const games = clone.weeks.find((entry) => entry.weekNumber === week)?.games ?? [];
  for (const assignment of assignments) {
    const game = games.find((entry) => entry.id === assignment.gameId);
    if (game) applyResult(game, assignment.teamId, assignment.result);
  }
  return clone;
}

// ---------------------------------------------------------------------------
// Clinch scenarios (top-seed / division-title / playoff-berth)
// ---------------------------------------------------------------------------
function clinchLocked(schedule: GeneratedSchedule, teamId: string, achievement: ClinchAchievement, week: number) {
  return isLockedFor(schedule, teamId, achievement, week).locked;
}

/** Rival week-`week` games whose subject-adverse result would help `teamId` clinch, ordered
 * strongest-blocker first. For each, the rival that must be knocked down is the higher-ceiling
 * pool member in that game. */
function blockerGames(
  schedule: GeneratedSchedule,
  teamId: string,
  poolTeamIds: string[],
  ranges: TeamRange[],
  week: number,
): Array<{ game: ScheduledGame; rivalId: string }> {
  const rangeById = new Map(ranges.map((range) => [range.teamId, range]));
  const subject = rangeById.get(teamId)!;
  const poolSet = new Set(poolTeamIds);
  const result: Array<{ game: ScheduledGame; rivalId: string; ceiling: number }> = [];
  for (const game of weekGamesOf(schedule, week)) {
    if (game.homeTeamId === teamId || game.awayTeamId === teamId) continue;
    if (game.homeScore != null && game.awayScore != null) continue;
    const endpoints = [game.homeTeamId, game.awayTeamId].filter((id) => poolSet.has(id) && id !== teamId);
    const blockers = endpoints.filter((id) => (rangeById.get(id)?.maximumPoints ?? 0) >= subject.minimumPoints);
    if (!blockers.length) continue;
    const rivalId = blockers.sort((a, b) => (rangeById.get(b)!.maximumPoints) - (rangeById.get(a)!.maximumPoints))[0];
    result.push({ game, rivalId, ceiling: rangeById.get(rivalId)!.maximumPoints });
  }
  return result.sort((a, b) => b.ceiling - a.ceiling).map(({ game, rivalId }) => ({ game, rivalId }));
}

/** Find the minimal set of rival results (subject's own already fixed in `base`) that locks the
 * clinch. Returns null if it can't be clinched this week even with maximum help. */
function findClinchHelp(
  schedule: GeneratedSchedule,
  base: GeneratedSchedule,
  teamId: string,
  achievement: ClinchAchievement,
  week: number,
): { conditions: ScenarioCondition[]; hasAlternates: boolean } | null {
  const pool = resolveClinchPool(schedule, teamId, achievement, week);
  if (!pool) return null;
  const ranges = buildTeamRanges(base, week);
  const candidates = blockerGames(base, teamId, pool.teamIds, ranges, week);
  if (!candidates.length) return null;

  const applyAll = (games: Array<{ game: ScheduledGame; rivalId: string }>) =>
    hypothesis(base, week, games.map(({ game, rivalId }) => ({ gameId: game.id, teamId: rivalId, result: "loss" as const })));

  if (!clinchLocked(applyAll(candidates), teamId, achievement, week)) return null; // unreachable this week

  // Greedy minimize: drop any condition that isn't needed.
  let needed = [...candidates];
  for (const candidate of [...candidates]) {
    const trial = needed.filter((entry) => entry !== candidate);
    if (trial.length && clinchLocked(applyAll(trial), teamId, achievement, week)) needed = trial;
  }

  // Relax each remaining condition from "loss" to "loss-or-tie" where a tie still suffices.
  const conditions: ScenarioCondition[] = needed.map(({ game, rivalId }) => {
    const others = needed.filter((entry) => entry.game !== game);
    const withTie = hypothesis(base, week, [
      ...others.map(({ game: g, rivalId: r }) => ({ gameId: g.id, teamId: r, result: "loss" as const })),
      { gameId: game.id, teamId: rivalId, result: "tie" as const },
    ]);
    const result: ConditionResult = clinchLocked(withTie, teamId, achievement, week) ? "loss-or-tie" : "loss";
    return { teamId: rivalId, result, gameId: game.id };
  });

  return { conditions, hasAlternates: needed.length < candidates.length };
}

function buildClinchScenario(
  schedule: GeneratedSchedule,
  teamId: string,
  achievement: ClinchAchievement,
  week: number,
  divisionId: string | undefined,
): Scenario | null {
  const game = teamGameThisWeek(schedule, week, teamId);
  const subjectGameId = game?.id;
  const paths: ScenarioPath[] = [];

  // Clean path: minimal own result that clinches alone (other games left open).
  let cleanOwn: OwnResult | null = null;
  if (game) {
    const withTie = hypothesis(schedule, week, [{ gameId: game.id, teamId, result: "tie" }]);
    const withWin = hypothesis(schedule, week, [{ gameId: game.id, teamId, result: "win" }]);
    if (clinchLocked(withTie, teamId, achievement, week)) cleanOwn = "win-or-tie";
    else if (clinchLocked(withWin, teamId, achievement, week)) cleanOwn = "win";
  }
  if (cleanOwn) paths.push({ kind: "clean", own: cleanOwn, conditions: [] });

  // Needs-help path: the best own result short of the clean one that still clinches with help.
  const helpOwns: Array<"win" | "tie" | "loss"> = cleanOwn === "win-or-tie"
    ? ["loss"]
    : cleanOwn === "win"
      ? ["tie", "loss"]
      : ["win", "tie", "loss"];
  for (const own of helpOwns) {
    const base = game
      ? hypothesis(schedule, week, [{ gameId: game.id, teamId, result: own }])
      : structuredClone(schedule);
    if (!game && own !== "loss") continue; // no game → own is fixed; only evaluate once
    if (clinchLocked(base, teamId, achievement, week)) continue; // own alone already clinches (clean handles it)
    const help = findClinchHelp(schedule, base, teamId, achievement, week);
    if (help) {
      paths.push({ kind: "needs-help", own: game ? own : "none", conditions: help.conditions, hasAlternates: help.hasAlternates });
      break;
    }
  }

  if (!paths.length) return null;
  return { teamId, achievement, divisionId, subjectGameId, controlsOwnDestiny: cleanOwn != null, paths };
}

// ---------------------------------------------------------------------------
// Elimination scenarios
// ---------------------------------------------------------------------------
function eliminationLocked(schedule: GeneratedSchedule, teamId: string, week: number) {
  return isEliminatedFor(schedule, teamId, week).locked;
}

function findEliminationHelp(
  schedule: GeneratedSchedule,
  base: GeneratedSchedule,
  teamId: string,
  week: number,
): { conditions: ScenarioCondition[]; hasAlternates: boolean } | null {
  const pool = resolveClinchPool(schedule, teamId, "playoff-berth", week);
  if (!pool) return null;
  const ranges = buildTeamRanges(base, week);
  const rangeById = new Map(ranges.map((range) => [range.teamId, range]));
  const subject = rangeById.get(teamId)!;
  const poolSet = new Set(pool.teamIds);

  // Rivals who can climb above the subject; a win this week pushes them up.
  const candidates: Array<{ game: ScheduledGame; rivalId: string; floor: number }> = [];
  for (const game of weekGamesOf(schedule, week)) {
    if (game.homeTeamId === teamId || game.awayTeamId === teamId) continue;
    if (game.homeScore != null && game.awayScore != null) continue;
    for (const rivalId of [game.homeTeamId, game.awayTeamId]) {
      if (rivalId === teamId || !poolSet.has(rivalId)) continue;
      const rival = rangeById.get(rivalId);
      if (rival && rival.maximumPoints >= subject.minimumPoints) {
        candidates.push({ game, rivalId, floor: rival.minimumPoints });
        break;
      }
    }
  }
  if (!candidates.length) return null;
  const ordered = candidates.sort((a, b) => b.floor - a.floor);

  const applyAll = (games: typeof ordered) =>
    hypothesis(base, week, games.map(({ game, rivalId }) => ({ gameId: game.id, teamId: rivalId, result: "win" as const })));
  if (!eliminationLocked(applyAll(ordered), teamId, week)) return null;

  let needed = [...ordered];
  for (const candidate of [...ordered]) {
    const trial = needed.filter((entry) => entry !== candidate);
    if (trial.length && eliminationLocked(applyAll(trial), teamId, week)) needed = trial;
  }

  const conditions: ScenarioCondition[] = needed.map(({ game, rivalId }) => {
    const others = needed.filter((entry) => entry.game !== game);
    const withTie = hypothesis(base, week, [
      ...others.map(({ game: g, rivalId: r }) => ({ gameId: g.id, teamId: r, result: "win" as const })),
      { gameId: game.id, teamId: rivalId, result: "tie" as const },
    ]);
    const result: ConditionResult = eliminationLocked(withTie, teamId, week) ? "win-or-tie" : "win";
    return { teamId: rivalId, result, gameId: game.id };
  });
  return { conditions, hasAlternates: needed.length < ordered.length };
}

function buildEliminationScenario(schedule: GeneratedSchedule, teamId: string, week: number): Scenario | null {
  const game = teamGameThisWeek(schedule, week, teamId);
  const base = game
    ? hypothesis(schedule, week, [{ gameId: game.id, teamId, result: "loss" }])
    : structuredClone(schedule);
  const own: OwnResult = game ? "loss" : "none";

  if (eliminationLocked(base, teamId, week)) {
    // A loss alone ends it — self-determined (no scoreboard-watching). `controlsOwnDestiny`
    // stays consistent with "has a no-condition path" across all achievements.
    return { teamId, achievement: "elimination", subjectGameId: game?.id, controlsOwnDestiny: true, paths: [{ kind: "clean", own, conditions: [] }] };
  }
  const help = findEliminationHelp(schedule, base, teamId, week);
  if (!help) return null;
  return {
    teamId,
    achievement: "elimination",
    subjectGameId: game?.id,
    controlsOwnDestiny: false,
    paths: [{ kind: "needs-help", own, conditions: help.conditions, hasAlternates: help.hasAlternates }],
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export function getWeekScenarios(schedule: GeneratedSchedule, week?: number): WeekScenarios {
  const targetWeek = week ?? liveWeek(schedule);
  if (targetWeek <= 0) return { week: targetWeek, scenarios: [] };

  const hasDivisions = schedule.setup.divisions.length > 1;
  const fieldSize = resolvedPlayoffFieldSize(schedule);
  const placementMode = resolvePlayoffPlacementMode({
    divisions: schedule.setup.divisions,
    playoffs: { ...schedule.setup.playoffs, fieldSize },
  });
  const supportsBerth = placementMode === "overall";

  // Baseline through the prior week — matches the badges, so "already secured" agrees.
  const baseline = new Map(calculateTeamClinchStates(schedule, targetWeek - 1).map((state) => [state.teamId, state]));
  const standingsRank = new Map(calculateStandings(schedule, targetWeek - 1).map((row, index) => [row.teamId, index]));
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));

  const scenarios: Scenario[] = [];
  for (const team of schedule.setup.teams) {
    const base = baseline.get(team.id);
    if (!base) continue;

    let hasTopSeedScenario = false;
    if (!base.topSeed) {
      const scenario = buildClinchScenario(schedule, team.id, "top-seed", targetWeek, undefined);
      if (scenario) { scenarios.push(scenario); hasTopSeedScenario = true; }
    }
    if (hasDivisions && !base.divisionTitle) {
      const scenario = buildClinchScenario(schedule, team.id, "division-title", targetWeek, team.divisionId);
      if (scenario) scenarios.push(scenario);
    }
    // A top-seed scenario already implies a berth — don't list the same team twice for the
    // lesser outcome.
    if (supportsBerth && !hasTopSeedScenario && !base.playoffBerth && !base.eliminated) {
      const scenario = buildClinchScenario(schedule, team.id, "playoff-berth", targetWeek, undefined);
      if (scenario) scenarios.push(scenario);
    }
    if (supportsBerth && !base.eliminated && !base.playoffBerth) {
      const scenario = buildEliminationScenario(schedule, team.id, targetWeek);
      if (scenario) scenarios.push(scenario);
    }
  }

  scenarios.sort((a, b) => {
    const orderDelta = ACHIEVEMENT_ORDER.indexOf(a.achievement) - ACHIEVEMENT_ORDER.indexOf(b.achievement);
    if (orderDelta !== 0) return orderDelta;
    return (standingsRank.get(a.teamId) ?? 999) - (standingsRank.get(b.teamId) ?? 999);
  });

  void teamById;
  return { week: targetWeek, scenarios };
}
