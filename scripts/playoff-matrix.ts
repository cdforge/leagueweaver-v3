import assert from "node:assert/strict";
import { createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import {
  createDefaultPlayoffSettings,
  getMaximumPlayoffFieldSize,
  getPlayoffByeCount,
  getPlayoffRoundNames,
  getRequiredPlayoffWeeks,
  projectPlayoffRounds,
  projectPlayoffSeeds,
  resolvePlayoffPlacementMode,
} from "../lib/playoffs";
import { formatDraftPlace, getTeamsMissingDraftPlaces, getWeekOneTeamOrder, hasCompleteDraftRanking } from "../lib/rankings";
import { getNflWeekWindow } from "../lib/schedule";
import { calculateStandings } from "../lib/standings";
import type { GeneratedSchedule, LeagueSetupInput } from "../lib/types";

let checks = 0;
function check(test: () => void) {
  test();
  checks += 1;
}

function blankSchedule(setup: LeagueSetupInput): GeneratedSchedule {
  return {
    id: "playoff-test",
    seed: "playoff-test",
    createdAt: "2026-07-29T00:00:00.000Z",
    setup,
    weeks: [],
    fairness: { hardPass: true, score: 100, homeAwaySpread: 0, immediateRematches: 0, divisionalFinishShare: 1, notes: [] },
    revision: 1,
  };
}

check(() => assert.deepEqual([2, 3, 6, 10, 14].map(getPlayoffByeCount), [0, 1, 2, 6, 2]));
check(() => assert.equal(getRequiredPlayoffWeeks(6), 3));
check(() => assert.equal(getMaximumPlayoffFieldSize(16, 14), 8));
check(() => assert.equal(getMaximumPlayoffFieldSize(16, 13), 16));
check(() => assert.equal(getMaximumPlayoffFieldSize(16, 14, "ladder"), 4));
check(() => assert.equal(getMaximumPlayoffFieldSize(16, 13, "ladder"), 5));

check(() => {
  const settings = createDefaultPlayoffSettings(10);
  assert.deepEqual(getPlayoffRoundNames(settings, 2), ["Wild Card", "Divisional Championship", "Championship"]);
  assert.deepEqual(getPlayoffRoundNames({ ...settings, placementMode: "overall" }, 2), ["Wild Card", "Semifinals", "Championship"]);
  assert.deepEqual(getPlayoffRoundNames({ ...settings, fieldSize: 8 }, 2), ["Round 1", "Divisional Championship", "Championship"]);
  assert.deepEqual(getPlayoffRoundNames({ ...settings, fieldSize: 16, placementMode: "overall" }, 2), ["Round 1", "Round 2", "Semifinals", "Championship"]);
  assert.deepEqual(getPlayoffRoundNames({ ...settings, fieldSize: 14, placementMode: "overall" }, 2), ["Wild Card", "Round 2", "Semifinals", "Championship"]);
  assert.deepEqual(getPlayoffRoundNames({ ...settings, roundNames: ["Opening Night"] }, 2), ["Opening Night", "Divisional Championship", "Championship"]);
});

check(() => {
  const settings = createDefaultPlayoffSettings(10);
  assert.equal(settings.fieldSize, 6);
  assert.equal(settings.theme, "gold");
  assert.equal(settings.bracketType, "single-elimination");
  assert.equal(settings.reseedMode, "fixed");
});

check(() => {
  const setup = createDefaultSetup();
  assert.equal(resolvePlayoffPlacementMode(setup), "division-halves");
  const schedule = blankSchedule(setup);
  const seeds = projectPlayoffSeeds(schedule);
  assert.equal(seeds.filter((seed) => seed.bracketSide === "A").length, 3);
  assert.equal(seeds.filter((seed) => seed.bracketSide === "B").length, 3);
  assert.ok(seeds.find((seed) => seed.seed === 1)?.divisionLeader);
  assert.ok(seeds.find((seed) => seed.seed === 2)?.divisionLeader);
  assert.equal(new Set(seeds.filter((seed) => seed.bracketSide === "A").map((seed) => seed.divisionId)).size, 1);
  assert.equal(new Set(seeds.filter((seed) => seed.bracketSide === "B").map((seed) => seed.divisionId)).size, 1);
  for (const [high, low] of [[3, 6], [4, 5]]) {
    assert.equal(seeds.find((seed) => seed.seed === high)?.bracketSide, seeds.find((seed) => seed.seed === low)?.bracketSide);
  }
  const rounds = projectPlayoffRounds(schedule);
  assert.deepEqual(rounds.map((round) => [round.weekNumber, round.name]), [[15, "Wild Card"], [16, "Divisional Championship"], [17, "Championship"]]);
  assert.deepEqual(rounds[0].matchups.map((matchup) => [matchup.homeSeed, matchup.awaySeed]), [[3, 6], [4, 5]]);
  assert.deepEqual(rounds[0].byeSeeds, [1, 2]);
  assert.deepEqual(rounds[1].matchups.map((matchup) => [matchup.homeSeed, matchup.awaySeed]), [[1, 4], [2, 3]]);
  assert.deepEqual(rounds[2].matchups.map((matchup) => [matchup.homeSeed, matchup.awaySeed]), [[1, 2]]);
  setup.playoffs = { ...setup.playoffs, fieldStatus: "locked", lockedTeamIds: seeds.map((seed) => seed.teamId) };
  const lockedSeeds = projectPlayoffSeeds(blankSchedule(setup));
  assert.deepEqual(lockedSeeds.map((seed) => seed.bracketSide), seeds.map((seed) => seed.bracketSide));
});

check(() => {
  const setup = createDefaultSetup();
  setup.playoffs = { ...setup.playoffs, bracketType: "ladder", placementMode: "division-halves", fieldSize: 4 };
  assert.equal(resolvePlayoffPlacementMode(setup), "overall");
  const rounds = projectPlayoffRounds(blankSchedule(setup));
  assert.deepEqual(rounds.map((round) => round.matchups.map((matchup) => [matchup.homeSeed, matchup.awaySeed])), [[[3, 4]], [[2, 3]], [[1, 2]]]);
  assert.deepEqual(rounds.map((round) => round.byeSeeds), [[1, 2], [1], []]);
});

check(() => {
  const divisions = createDivisions(3);
  const setup = { ...createDefaultSetup(), divisions, teams: createTeams(12, divisions) };
  assert.equal(resolvePlayoffPlacementMode(setup), "division-leaders");
  const seeds = projectPlayoffSeeds(blankSchedule(setup));
  assert.ok(seeds.slice(0, 3).every((seed) => seed.divisionLeader));
});

check(() => {
  const setup = createDefaultSetup();
  setup.playoffs = { ...setup.playoffs, placementMode: "overall" };
  const schedule = blankSchedule(setup);
  assert.deepEqual(projectPlayoffSeeds(schedule).map((seed) => seed.teamId), calculateStandings(schedule).slice(0, 6).map((row) => row.teamId));
});

check(() => {
  const thanksgiving = getNflWeekWindow(2026, 12);
  const christmas = getNflWeekWindow(2026, 16);
  const newYear = getNflWeekWindow(2026, 17);
  assert.deepEqual(thanksgiving.holidays, ["Thanksgiving"]);
  assert.deepEqual(christmas.holidays, ["Christmas"]);
  assert.deepEqual(newYear.holidays, ["New Year’s"]);
  assert.equal(thanksgiving.cutoffLabel, "Tue 4:00 AM ET → Tue 4:00 AM ET");
  assert.match(newYear.label, /2026.*2027/);
});

check(() => {
  const setup = createDefaultSetup();
  setup.weekOne.rankingSource = "draft-day";
  setup.teams = setup.teams.map((team, index) => ({ ...team, draftPlace: index === 4 ? 1 : index < 4 ? index + 2 : index + 1 }));
  assert.equal(getWeekOneTeamOrder(setup)[0].id, setup.teams[4].id);
  assert.equal(hasCompleteDraftRanking(setup), true);
});

check(() => {
  const setup = createDefaultSetup();
  setup.weekOne.rankingSource = "draft-day";
  setup.teams = setup.teams.map((team) => ({ ...team, draftPlace: undefined }));
  assert.equal(getTeamsMissingDraftPlaces(setup).length, setup.teams.length);
  assert.equal(hasCompleteDraftRanking(setup), false);
  assert.deepEqual(getWeekOneTeamOrder(setup).map((team) => team.id), [...setup.teams].sort((left, right) => left.overallRank - right.overallRank).map((team) => team.id));
});

check(() => {
  assert.deepEqual([1, 2, 3, 4, 11].map((place) => formatDraftPlace(place, 12)), ["1st of 12", "2nd of 12", "3rd of 12", "4th of 12", "11th of 12"]);
});

console.log(`Playoff, holiday, and opening-week matrix: ${checks} checks passed.`);
