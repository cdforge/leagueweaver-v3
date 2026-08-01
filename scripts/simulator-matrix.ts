import assert from "node:assert/strict";
import { createDefaultSetup } from "../lib/defaults";
import {
  calculateBlendedTeamStrengths,
  calculateMonteCarloOdds,
  clearSimulationResults,
  createSimulationSandbox,
  getGameWinProbability,
  getNextSimulationGame,
  materializeSimulationSchedule,
  overrideSimulationGame,
  restartSimulationFromBeginning,
  rerollSimulation,
  rerollSimulationGame,
  simulateNextGame,
  simulateRemainingSeason,
  simulateThroughWeek,
  simulateToChampion,
  toggleSimulationGameLock,
} from "../lib/simulator";
import { freezeCompletedRankHistory } from "../lib/standings";
import type { GeneratedSchedule, ScheduledGame } from "../lib/types";

let checks = 0;
function check(test: () => void) {
  test();
  checks += 1;
}

function game(
  id: string,
  week: number,
  homeTeamId: string,
  awayTeamId: string,
  homeScore?: number,
  awayScore?: number,
): ScheduledGame {
  return {
    id,
    week,
    homeTeamId,
    awayTeamId,
    matchupType: "cross-division",
    seriesGame: 1,
    seriesLength: 1,
    dateLabel: `Week ${week}`,
    stadium: "Simulation Field",
    homeScore,
    awayScore,
  };
}

function testSchedule(): GeneratedSchedule {
  const setup = createDefaultSetup();
  setup.teams = setup.teams.slice(0, 4);
  setup.playoffs = {
    ...setup.playoffs,
    fieldSize: 4,
    placementMode: "overall",
    fieldStatus: "live",
    lockedTeamIds: [],
  };
  return {
    id: "simulator-test",
    seed: "simulator-test",
    createdAt: "2026-07-30T00:00:00.000Z",
    setup,
    weeks: [
      {
        weekNumber: 1,
        dateLabel: "Week 1",
        games: [
          game("recorded-1", 1, "team-1", "team-4", 90, 130),
          game("recorded-2", 1, "team-2", "team-3", 112, 101),
        ],
      },
      {
        weekNumber: 2,
        dateLabel: "Week 2",
        games: [
          game("future-1", 2, "team-1", "team-2"),
          game("future-2", 2, "team-3", "team-4"),
        ],
      },
      {
        weekNumber: 3,
        dateLabel: "Week 3",
        games: [
          game("future-3", 3, "team-1", "team-3"),
          game("future-4", 3, "team-4", "team-2"),
        ],
      },
    ],
    fairness: {
      hardPass: true,
      score: 100,
      homeAwaySpread: 0,
      immediateRematches: 0,
      divisionalFinishShare: 0,
      notes: [],
    },
    revision: 1,
  };
}

const schedule = testSchedule();

check(() => {
  const before = structuredClone(schedule);
  const first = simulateRemainingSeason(schedule, "deterministic-run");
  const second = simulateRemainingSeason(schedule, "deterministic-run");
  assert.deepEqual(first, second);
  assert.deepEqual(schedule, before);
  assert.equal(first.weeks[0].games[0].homeScore, 90);
  assert.equal(first.weeks[0].games[0].awayScore, 130);
});

check(() => {
  const sandbox = createSimulationSandbox(schedule, "sandbox-json");
  assert.doesNotThrow(() => JSON.stringify(sandbox));
  assert.equal(sandbox.results["recorded-1"].source, "recorded");
  assert.equal(sandbox.results["recorded-1"].locked, true);
  assert.ok(sandbox.probabilitiesByGameId["future-1"]);
  assert.equal(getNextSimulationGame(sandbox)?.game.id, "future-1");
});

check(() => {
  const completed = structuredClone(schedule);
  completed.weeks = completed.weeks.map((week) => ({
    ...week,
    games: week.games.map((scheduledGame, index) => ({
      ...scheduledGame,
      homeScore: scheduledGame.homeScore ?? 120 + index,
      awayScore: scheduledGame.awayScore ?? 110 + index,
    })),
  }));
  completed.playoffGames = [{
    ...game("completed-final", 4, "team-1", "team-2", 141, 132),
    round: "Championship",
    roundIndex: 0,
    bracket: "main",
  }];
  const frozenCompleted = freezeCompletedRankHistory(completed);
  const sandbox = createSimulationSandbox(frozenCompleted, "restart-seed");
  assert.equal(getNextSimulationGame(sandbox), undefined);
  assert.ok((sandbox.baseSchedule.rankHistory?.length ?? 0) > 1);

  const restarted = restartSimulationFromBeginning(sandbox);
  const materialized = materializeSimulationSchedule(restarted);
  // H11: restart re-seeds the anchored recorded (real) results — it resets the
  // SIMULATION, not the season. A fully-recorded season survives restart with
  // every real score intact; materialize must never blank it back to empty.
  assert.ok(Object.keys(restarted.results).length > 0);
  assert.ok(Object.values(restarted.results).every((result) => result.source === "recorded"));
  assert.equal(materialized.playoffGames, undefined);
  assert.equal(materialized.rankHistory, undefined);
  assert.equal(getNextSimulationGame(restarted), undefined);
  assert.ok(materialized.weeks.every((week) => week.games.every((scheduledGame) =>
    scheduledGame.homeScore != null && scheduledGame.awayScore != null,
  )));
  assert.ok(completed.weeks.every((week) => week.games.every((scheduledGame) =>
    scheduledGame.homeScore != null && scheduledGame.awayScore != null,
  )));
  assert.ok((frozenCompleted.rankHistory?.length ?? 0) > 1);
});

check(() => {
  // H11 (partial season): simulating forward then restarting must clear the
  // hypothetical games but keep the two anchored recorded results, and materialize
  // must preserve exactly those two real scores — never a blank schedule.
  const simmed = simulateThroughWeek(createSimulationSandbox(schedule, "h11-partial"), 3);
  assert.equal(Object.keys(simmed.results).length, 6);
  const restarted = restartSimulationFromBeginning(simmed);
  assert.equal(Object.keys(restarted.results).length, 2);
  assert.ok(Object.values(restarted.results).every((result) => result.source === "recorded"));
  assert.ok(restarted.results["recorded-1"] && restarted.results["recorded-2"]);
  const materialized = materializeSimulationSchedule(restarted);
  const scored = materialized.weeks.flatMap((week) => week.games).filter((scheduledGame) => scheduledGame.homeScore != null);
  assert.equal(scored.length, 2);
  assert.ok(materialized.weeks[0].games.every((scheduledGame) => scheduledGame.homeScore != null));
  assert.ok(materialized.weeks[1].games.every((scheduledGame) => scheduledGame.homeScore == null));
});

check(() => {
  const probability = getGameWinProbability(schedule, "future-1");
  assert.ok(probability.home >= 0.02 && probability.home <= 0.98);
  assert.ok(probability.away >= 0.02 && probability.away <= 0.98);
  assert.ok(Math.abs(probability.home + probability.away - 1) < 1e-9);
});

check(() => {
  const blank = structuredClone(schedule);
  blank.weeks = blank.weeks.map((week) => ({
    ...week,
    games: week.games.map((scheduledGame) => ({ ...scheduledGame, homeScore: undefined, awayScore: undefined })),
  }));
  const prior = new Map(calculateBlendedTeamStrengths(blank).map((strength) => [strength.teamId, strength]));
  const observed = new Map(calculateBlendedTeamStrengths(schedule).map((strength) => [strength.teamId, strength]));
  assert.equal(prior.get("team-4")?.observationWeight, 0);
  assert.equal(observed.get("team-4")?.observationWeight, Math.round((1 / 7) * 1_000_000) / 1_000_000);
  assert.ok(observed.get("team-4")!.blendedStrength > prior.get("team-4")!.priorStrength);
  assert.equal(prior.get("team-1")?.blendedStrength, prior.get("team-1")?.priorStrength);
});

check(() => {
  const first = simulateNextGame(createSimulationSandbox(schedule, "step-seed"));
  const second = simulateNextGame(createSimulationSandbox(schedule, "step-seed"));
  assert.deepEqual(first.results["future-1"], second.results["future-1"]);
  assert.equal(first.results["future-1"].source, "simulated");
  assert.ok(first.results["future-1"].probability);
  assert.equal(getNextSimulationGame(first)?.game.id, "future-2");
});

check(() => {
  const throughWeek = simulateThroughWeek(createSimulationSandbox(schedule, "week-seed"), 2);
  assert.ok(throughWeek.results["future-1"]);
  assert.ok(throughWeek.results["future-2"]);
  assert.equal(throughWeek.results["future-3"], undefined);
  assert.equal(materializeSimulationSchedule(throughWeek).weeks[2].games[0].homeScore, undefined);
});

check(() => {
  let controlled = createSimulationSandbox(schedule, "control-seed");
  controlled = overrideSimulationGame(controlled, "future-1", { winnerTeamId: "team-2", margin: 9, locked: true });
  assert.equal(controlled.results["future-1"].source, "override");
  assert.equal(controlled.results["future-1"].locked, true);
  assert.ok(controlled.results["future-1"].awayScore > controlled.results["future-1"].homeScore);

  controlled = simulateNextGame(controlled);
  controlled = toggleSimulationGameLock(controlled, "future-2");
  const lockedScore = controlled.results["future-2"].homeScore;
  const rerolled = rerollSimulation(controlled, { scope: "full", seed: "reroll-seed" });
  assert.equal(rerolled.results["future-1"].source, "override");
  assert.equal(rerolled.results["future-2"].homeScore, lockedScore);

  controlled = toggleSimulationGameLock(controlled, "future-2");
  const singleReroll = rerollSimulationGame(controlled, "future-2");
  assert.equal(singleReroll.results["future-2"].source, "simulated");
  assert.notStrictEqual(singleReroll.results["future-2"], controlled.results["future-2"]);
});

check(() => {
  let controlled = createSimulationSandbox(schedule, "clear-seed");
  controlled = overrideSimulationGame(controlled, "future-1", { homeScore: 100, awayScore: 120 });
  controlled = simulateNextGame(controlled);
  const simulatedCleared = clearSimulationResults(controlled, "simulated");
  assert.equal(simulatedCleared.results["future-2"], undefined);
  assert.equal(simulatedCleared.results["future-1"].source, "override");
  assert.equal(simulatedCleared.results["recorded-1"].homeScore, 90);

  const allCleared = clearSimulationResults(controlled, "hypothetical");
  assert.equal(allCleared.results["future-1"], undefined);
  assert.equal(allCleared.results["future-2"], undefined);
  assert.equal(allCleared.results["recorded-1"].source, "recorded");
});

check(() => {
  const championRun = simulateToChampion(createSimulationSandbox(schedule, "champion-seed"));
  assert.ok(championRun.playoff?.championTeamId);
  assert.ok(championRun.playoff?.runnerUpTeamId);
  assert.notEqual(championRun.playoff?.championTeamId, championRun.playoff?.runnerUpTeamId);
  assert.equal(championRun.playoff?.seeds.length, 4);
  assert.equal(championRun.playoff?.rounds.length, 2);
  assert.equal(championRun.playoff?.rounds.at(-1)?.games.length, 1);
});

check(() => {
  const first = calculateMonteCarloOdds(schedule, 500, "odds-seed");
  const second = calculateMonteCarloOdds(schedule, 500, "odds-seed");
  assert.deepEqual(first, second);
  assert.equal(first.trials, 500);
  assert.equal(first.teams.length, 4);
  const sum = (key: "playoffOdds" | "divisionOdds" | "championshipOdds" | "topSeedOdds") =>
    first.teams.reduce((total, team) => total + team[key], 0);
  assert.ok(Math.abs(sum("playoffOdds") - 4) < 1e-6);
  assert.ok(Math.abs(sum("divisionOdds") - 2) < 1e-6);
  assert.ok(Math.abs(sum("championshipOdds") - 1) < 1e-6);
  assert.ok(Math.abs(sum("topSeedOdds") - 1) < 1e-6);
  for (const team of first.teams) {
    const finishTotal = team.finishDistribution.reduce((total, finish) => total + finish.probability, 0);
    assert.ok(Math.abs(finishTotal - 1) < 1e-6);
  }
});

console.log(`Simulator matrix: ${checks} focused checks passed.`);
