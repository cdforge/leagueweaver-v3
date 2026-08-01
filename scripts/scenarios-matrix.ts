import assert from "node:assert/strict";
import { calculateTeamClinchStates } from "../lib/clinch";
import { getWeekScenarios, type Scenario, type ScenarioPath } from "../lib/scenarios";
import { buildLeague, teamId, type GameSpec } from "./support/leagueFixture";
import type { GeneratedSchedule, ScheduledGame } from "../lib/types";

let checks = 0;
function check(label: string, test: () => void) {
  try { test(); checks += 1; } catch (error) { console.error(`FAIL: ${label}`); throw error; }
}

// Local mirror of the engine's hypothesis helpers (kept internal to lib/scenarios.ts).
function applyResult(game: ScheduledGame, id: string, result: "win" | "tie" | "loss") {
  const isHome = game.homeTeamId === id;
  if (result === "tie") { game.homeScore = 0; game.awayScore = 0; return; }
  const teamWins = result === "win";
  const homeScore = isHome === teamWins ? 1 : 0;
  game.homeScore = homeScore;
  game.awayScore = homeScore === 1 ? 0 : 1;
}
function hypothesis(schedule: GeneratedSchedule, week: number, assignments: Array<{ gameId: string; teamId: string; result: "win" | "tie" | "loss" }>) {
  const clone: GeneratedSchedule = structuredClone(schedule);
  const games = clone.weeks.find((entry) => entry.weekNumber === week)?.games ?? [];
  for (const a of assignments) { const g = games.find((entry) => entry.id === a.gameId); if (g) applyResult(g, a.teamId, a.result); }
  return clone;
}

const ACHIEVEMENT_FLAG = {
  "top-seed": "topSeed",
  "division-title": "divisionTitle",
  "playoff-berth": "playoffBerth",
  "elimination": "eliminated",
} as const;

// Apply a path at its WEAKEST allowed outcome, then confirm the badges agree — the core
// correctness invariant: every path the engine prints must actually be sufficient.
function verifyPath(schedule: GeneratedSchedule, week: number, scenario: Scenario, path: ScenarioPath) {
  const assignments: Array<{ gameId: string; teamId: string; result: "win" | "tie" | "loss" }> = [];
  if (scenario.subjectGameId && path.own !== "none") {
    const ownApply = path.own === "win" ? "win" : path.own === "loss" ? "loss" : "tie"; // win-or-tie/tie → tie
    assignments.push({ gameId: scenario.subjectGameId, teamId: scenario.teamId, result: ownApply });
  }
  for (const condition of path.conditions) {
    const apply = condition.result === "win" ? "win" : condition.result === "loss" ? "loss" : "tie"; // *-or-tie → tie
    assignments.push({ gameId: condition.gameId, teamId: condition.teamId, result: apply });
  }
  const hypo = hypothesis(schedule, week, assignments);
  const states = new Map(calculateTeamClinchStates(hypo, week).map((state) => [state.teamId, state]));
  const flag = ACHIEVEMENT_FLAG[scenario.achievement];
  assert.equal(states.get(scenario.teamId)![flag], true, `${scenario.teamId}/${scenario.achievement}/${path.kind}(own=${path.own}) must be sufficient`);
}

function verifyAll(label: string, schedule: GeneratedSchedule) {
  check(`consistency — ${label}`, () => {
    const { week, scenarios } = getWeekScenarios(schedule);
    for (const scenario of scenarios) {
      assert.ok(scenario.paths.length > 0, "a scenario must have at least one path");
      // Clean paths first.
      const firstHelp = scenario.paths.findIndex((p) => p.kind === "needs-help");
      const lastClean = scenario.paths.map((p) => p.kind).lastIndexOf("clean");
      if (firstHelp >= 0 && lastClean >= 0) assert.ok(lastClean < firstHelp, "clean paths must precede needs-help");
      assert.equal(scenario.controlsOwnDestiny, scenario.paths.some((p) => p.kind === "clean"));
      for (const path of scenario.paths) verifyPath(schedule, week, scenario, path);
    }
  });
  return getWeekScenarios(schedule);
}

// ===========================================================================
// 1. Win-and-in: t1 clinches the #1 seed with a win (or tie) this week.
// ===========================================================================
const winAndIn = buildLeague({
  teamCount: 4, divisionCount: 2, fieldSize: 2, placementMode: "overall",
  weeks: [
    [[0, 1, 1, 0], [2, 3, 1, 0]],
    [[0, 2, 1, 0], [1, 3, 1, 0]],
    [[0, 1], [2, 3]],
  ] as GameSpec[][],
});
check("win-and-in top seed", () => {
  const { week, scenarios } = getWeekScenarios(winAndIn);
  assert.equal(week, 3);
  const top = scenarios.find((s) => s.teamId === teamId(0) && s.achievement === "top-seed");
  assert.ok(top, "t1 should have a top-seed scenario");
  assert.equal(top!.controlsOwnDestiny, true);
  assert.equal(top!.paths[0].kind, "clean");
  assert.equal(top!.paths[0].own, "win-or-tie");
  assert.equal(top!.paths[0].conditions.length, 0);
  // Top-seed present → the redundant berth scenario for t1 is suppressed.
  assert.ok(!scenarios.some((s) => s.teamId === teamId(0) && s.achievement === "playoff-berth"));
});
verifyAll("win-and-in", winAndIn);

// ===========================================================================
// 2. Needs help: subject must win AND a rival must drop.
// ===========================================================================
const needsHelp = buildLeague({
  teamCount: 6, divisionCount: 3, fieldSize: 2, placementMode: "overall",
  weeks: [
    [[0, 1, 1, 0], [2, 3, 1, 0], [4, 5, 1, 0]],
    [[0, 2, 1, 0], [1, 3, 1, 0], [4, 0, 1, 0]],
    [[0, 3, 1, 0], [1, 4, 1, 0], [2, 5, 1, 0]],
    [[0, 5], [1, 2], [3, 4]],
  ] as GameSpec[][],
});
verifyAll("needs-help", needsHelp);
check("needs-help produces referenced conditions with real games", () => {
  const { scenarios } = getWeekScenarios(needsHelp);
  const help = scenarios.flatMap((s) => s.paths.filter((p) => p.kind === "needs-help").map((p) => ({ s, p })));
  for (const { s, p } of help) {
    for (const condition of p.conditions) {
      assert.notEqual(condition.teamId, s.teamId, "a condition names another team");
      assert.ok(condition.gameId, "condition points at a game");
    }
  }
});

// ===========================================================================
// 3. Elimination scenario appears and is sufficient.
// ===========================================================================
const elimFixture = buildLeague({
  teamCount: 4, divisionCount: 2, fieldSize: 2, placementMode: "overall",
  weeks: [
    [[0, 3, 1, 0], [1, 2, 1, 0]],
    [[0, 2, 1, 0], [1, 3, 1, 0]],
    [[0, 1, 1, 0], [2, 3, 1, 0]],
    [[0, 1], [2, 3]],
  ] as GameSpec[][],
});
verifyAll("elimination", elimFixture);

// ===========================================================================
// 4. Early season → no scenarios (nothing decidable yet); ordering sanity.
// ===========================================================================
check("early season yields no scenarios", () => {
  const early = buildLeague({
    teamCount: 6, divisionCount: 2, fieldSize: 4, placementMode: "overall",
    weeks: [
      [[0, 1, 1, 0], [2, 3, 1, 0], [4, 5, 1, 0]],
      [[0, 2], [1, 3], [4, 5]],
      [[0, 3], [1, 4], [2, 5]],
      [[0, 4], [1, 2], [3, 5]],
    ] as GameSpec[][],
  });
  const { week, scenarios } = getWeekScenarios(early);
  assert.equal(week, 2);
  assert.equal(scenarios.length, 0, "week 2 of a 6-team season can't clinch anything");
});

check("scenarios ordered by achievement priority", () => {
  const { scenarios } = getWeekScenarios(winAndIn);
  const order = ["top-seed", "division-title", "playoff-berth", "elimination"];
  for (let i = 1; i < scenarios.length; i += 1) {
    assert.ok(order.indexOf(scenarios[i - 1].achievement) <= order.indexOf(scenarios[i].achievement));
  }
});

console.log(`scenarios-matrix: ${checks} checks passed`);
