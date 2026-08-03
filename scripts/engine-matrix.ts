import assert from "node:assert/strict";
import { createConferences, createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import { normalizeSeriesGameNumbers } from "../lib/matchups";
import { generateLeagueSchedule } from "../lib/schedule";
import { EngineInfeasibleError } from "../lib/engine/v3";
import { buildInventory } from "../lib/engine/v3/phases/inventory";
import { createSeededRng } from "../lib/engine/v3/rng";
import { defaultConferenceAssignment } from "../lib/conferences";
import { analyzeScheduledCrossDivisionInventoryPriority } from "../lib/engine/crossDivisionPriority";
import type { EngineInput } from "../lib/engine/v3/domain/types";
import type { LeagueSetupInput, ScheduleWeek } from "../lib/types";

let checks = 0;
function check(value: unknown, message: string) {
  assert.ok(value, message);
  checks += 1;
}

function setupFor(teamCount: number, weeks: 13 | 14, divisionCount: 2 | 3 | 4): LeagueSetupInput {
  const divisions = createDivisions(divisionCount);
  return { ...createDefaultSetup(), id: `matrix-${teamCount}-${divisionCount}-${weeks}`, name: `${teamCount} Team Matrix`, weeks, divisions, teams: createTeams(teamCount, divisions) };
}

function conferenceSetupFor(teamCount: number, weeks: 13 | 14, divisionCount: 4): LeagueSetupInput {
  const conferences = createConferences(2);
  const divisions = defaultConferenceAssignment(createDivisions(divisionCount), conferences);
  return {
    ...createDefaultSetup(),
    id: `conference-matrix-${teamCount}-${divisionCount}-${weeks}`,
    name: `${teamCount} Team Conference Matrix`,
    weeks,
    conferences,
    divisions,
    teams: createTeams(teamCount, divisions),
  };
}

function inventoryInputFor(setup: LeagueSetupInput, weeks: number): EngineInput {
  const divisionTeams = new Map<string, typeof setup.teams>();
  for (const division of setup.divisions) divisionTeams.set(division.id, []);
  for (const team of setup.teams) divisionTeams.get(team.divisionId)?.push(team);
  const divisionSeedByTeam = new Map<string, number>();
  for (const teams of divisionTeams.values()) {
    [...teams]
      .sort((a, b) => a.overallRank - b.overallRank || a.id.localeCompare(b.id))
      .forEach((team, index) => divisionSeedByTeam.set(team.id, index + 1));
  }
  const conferenceByDivision = new Map(setup.divisions.map((division) => [division.id, division.conferenceId ?? null]));
  return {
    format: "fantasy_nfl_divisional",
    divisions: setup.divisions.map((division, index) => ({ id: division.id, orderIndex: index })),
    teams: setup.teams.map((team) => ({
      id: team.id,
      divisionId: team.divisionId,
      conferenceId: conferenceByDivision.get(team.divisionId) ?? null,
      divisionSeed: divisionSeedByTeam.get(team.id) ?? team.overallRank,
      overallSeed: team.overallRank,
    })),
    settings: {
      weeks,
      byesPerTeam: 0,
      divisionalGamesPerOpponent: 2,
      poolOpponentRepeatCount: 1,
      classicRoundRobinMode: "season_length",
      classicRoundRobinCycleCount: 1,
      maxHomeAwayStreak: 3,
      maxDivisionalStreak: 4,
      preventImmediateRematches: true,
      byeWeekPlacement: "anywhere",
      relaxStreaks: false,
      prioritizeOpeningWeekTopFive: true,
      prioritizeFinalWeekTopFive: true,
      prioritizeThanksgivingWindow: true,
      thanksgivingWeek: null,
      regularSeasonFinalWeekDivisional: true,
      divisionalPlacement: "end",
      seasonFlowStyle: "balanced",
      crossDivisionVariety: "max_variety",
      divisionalFinishStrength: "strong_finish",
    },
  };
}

function verify(teamCount: number, weeks: 13 | 14, divisionCount: 2 | 3 | 4) {
  const setup = setupFor(teamCount, weeks, divisionCount);
  const sizes = setup.divisions.map((division) => setup.teams.filter((team) => team.divisionId === division.id).length);
  const expectedInfeasible = weeks === 13 && ((divisionCount === 3 && teamCount === 10) || sizes.some((size) => 2 * (size - 1) > weeks || (size % 2 === 1 && weeks < 2 * size)));
  let schedule;
  try {
    schedule = generateLeagueSchedule(setup, `matrix-${teamCount}-${divisionCount}-${weeks}`);
  } catch (error) {
    check(expectedInfeasible, `${teamCount}/${divisionCount}/${weeks}: only known impossible shapes fail`);
    check(error instanceof EngineInfeasibleError, `${teamCount}/${divisionCount}/${weeks}: clear feasibility error`);
    return;
  }
  check(!expectedInfeasible, `${teamCount}/${divisionCount}/${weeks}: expected-valid shape generates`);
  check(schedule.fairness.hardPass, `${teamCount}/${divisionCount}/${weeks}: hard constraints`);
  check(schedule.weeks.length === weeks, `${teamCount}/${divisionCount}/${weeks}: week count`);
  check(schedule.weeks.every((week) => week.games.length === teamCount / 2), `${teamCount}/${divisionCount}/${weeks}: games each week`);
  check(schedule.weeks.every((week) => new Set(week.games.flatMap((game) => [game.homeTeamId, game.awayTeamId])).size === teamCount), `${teamCount}/${divisionCount}/${weeks}: each team once per week`);
  check(schedule.weeks.flatMap((week) => week.games).length === teamCount * weeks / 2, `${teamCount}/${divisionCount}/${weeks}: total games`);
  check(schedule.weeks.every((week) => Boolean(week.dateLabel) && week.games.every((game) => game.dateLabel === week.dateLabel)), `${teamCount}/${divisionCount}/${weeks}: NFL dates`);
  check(schedule.weeks.every((week) => week.games.every((game, index) => game.gameNumber === index + 1)), `${teamCount}/${divisionCount}/${weeks}: matchup game numbers`);
  check(schedule.weeks.every((week) => week.games.every((game, index) => index === 0 || (week.games[index - 1].matchupRating ?? 999) <= (game.matchupRating ?? 999))), `${teamCount}/${divisionCount}/${weeks}: games ordered by rating`);
  check(schedule.weeks.every((week) => week.bestMatchupRating === week.games[0]?.matchupRating), `${teamCount}/${divisionCount}/${weeks}: best weekly rating`);
  check(new Set(schedule.weeks.map((week) => week.matchupRank)).size === weeks, `${teamCount}/${divisionCount}/${weeks}: weekly matchup ranks`);
  check(schedule.fairness.homeAwaySpread <= 1, `${teamCount}/${divisionCount}/${weeks}: home/away balance`);
  check(schedule.fairness.immediateRematches === 0, `${teamCount}/${divisionCount}/${weeks}: no immediate rematches`);
  check(new Set(schedule.weeks.map((week) => week.weekNumber)).size === weeks, `${teamCount}/${divisionCount}/${weeks}: unique week numbers`);
  check(new Set(schedule.weeks.flatMap((week) => week.games.map((game) => game.id))).size === teamCount * weeks / 2, `${teamCount}/${divisionCount}/${weeks}: unique game IDs`);
  const seenSeriesGames = new Map<string, number>();
  check(schedule.weeks.every((week) => week.games.every((game) => {
    const key = [game.homeTeamId, game.awayTeamId].sort().join(":");
    const expected = (seenSeriesGames.get(key) ?? 0) + 1;
    seenSeriesGames.set(key, expected);
    return game.seriesGame === expected && (week.weekNumber !== 1 || game.seriesGame === 1);
  })), `${teamCount}/${divisionCount}/${weeks}: chronological series numbering`);

  const games = schedule.weeks.flatMap((week) => week.games);
  const teamById = new Map(setup.teams.map((team) => [team.id, team]));
  const divisionPairs = new Map<string, number>();
  const pairHomeCounts = new Map<string, Map<string, number>>();
  for (const game of games) {
    const home = teamById.get(game.homeTeamId)!;
    const away = teamById.get(game.awayTeamId)!;
    const homeKey = [home.id, away.id].sort().join(":");
    const homeCounts = pairHomeCounts.get(homeKey) ?? new Map<string, number>();
    homeCounts.set(home.id, (homeCounts.get(home.id) ?? 0) + 1);
    pairHomeCounts.set(homeKey, homeCounts);
    if (home.divisionId !== away.divisionId) continue;
    const key = homeKey;
    divisionPairs.set(key, (divisionPairs.get(key) ?? 0) + 1);
  }
  check([...divisionPairs.values()].every((count) => count === 2), `${teamCount}/${divisionCount}/${weeks}: divisional opponents twice`);
  check([...pairHomeCounts.values()].every((homeCounts) => {
    const counts = [...homeCounts.values()];
    const total = counts.reduce((sum, value) => sum + value, 0);
    if (total < 2) return true;
    const high = Math.max(...counts);
    const low = homeCounts.size < 2 ? 0 : Math.min(...counts);
    return high - low <= total % 2;
  }), `${teamCount}/${divisionCount}/${weeks}: per-opponent home/away split is balanced`);
}

for (const teamCount of [8, 10, 12, 14, 16]) {
  verify(teamCount, 13, 2);
  verify(teamCount, 14, 2);
}

for (const teamCount of [8, 12, 14, 16]) {
  verify(teamCount, 13, 3);
  verify(teamCount, 14, 3);
}
verify(10, 14, 3);

const conferenceSetup = conferenceSetupFor(16, 13, 4);
const conferenceSchedule = generateLeagueSchedule(conferenceSetup, "conference-rank-priority");
const conferenceByDivision = new Map(
  conferenceSetup.divisions.map((division) => [division.id, division.conferenceId ?? null]),
);
const teamsByDivision = new Map<string, typeof conferenceSetup.teams>();
for (const division of conferenceSetup.divisions) teamsByDivision.set(division.id, []);
for (const team of conferenceSetup.teams) teamsByDivision.get(team.divisionId)?.push(team);
const divisionSeedByTeam = new Map<string, number>();
for (const teams of teamsByDivision.values()) {
  [...teams]
    .sort((a, b) => a.overallRank - b.overallRank || a.id.localeCompare(b.id))
    .forEach((team, index) => divisionSeedByTeam.set(team.id, index + 1));
}
const conferencePriorityTeams = conferenceSetup.teams.map((team) => ({
  ...team,
  conferenceId: conferenceByDivision.get(team.divisionId) ?? null,
  divisionSeed: divisionSeedByTeam.get(team.id) ?? team.overallRank,
}));
const conferencePriority = analyzeScheduledCrossDivisionInventoryPriority(
  conferencePriorityTeams,
  conferenceSchedule.weeks,
);
check(conferencePriority.isPriorityCompliant, "16/4/13: conference same-rank cross inventory priority");
check(
  conferencePriority.teamSummaries.every(
    (summary) =>
      (summary.missingSameConferenceSameSeedOpponentIds?.length ?? 0) === 0 &&
      (summary.missingCrossConferenceSameSeedOpponentIds?.length ?? 0) === 0,
  ),
  "16/4/13: all same-rank conference and cross-conference opponents are scheduled",
);

const longCycleSetup = setupFor(8, 14, 2);
const longCycleInventory = buildInventory(inventoryInputFor(longCycleSetup, 21), createSeededRng("long-cycle"));
check(Boolean(longCycleInventory), "8/2/21 inventory: future long-season cycle builds");
const longCycleTeamById = new Map(longCycleSetup.teams.map((team) => [team.id, team]));
const longCycleDivisionCounts = new Map<string, number>();
const longCycleCrossCounts = new Map<string, number>();
for (const pair of longCycleInventory?.pairs ?? []) {
  const a = longCycleTeamById.get(pair.a)!;
  const b = longCycleTeamById.get(pair.b)!;
  const key = [pair.a, pair.b].sort().join(":");
  if (a.divisionId === b.divisionId) {
    longCycleDivisionCounts.set(key, pair.count);
  } else {
    longCycleCrossCounts.set(key, pair.count);
  }
}
check(
  [...longCycleDivisionCounts.values()].every((count) => count === 4),
  "8/2/21 inventory: division rounds 3 and 4 are added before cross round 3",
);
check(
  Math.max(...longCycleCrossCounts.values()) === 3,
  "8/2/21 inventory: cross cycle resumes after division rounds 3 and 4",
);

// Four-division shapes. [3,3,3,3] (12 teams) is the all-odd case whose final-week
// cross reservation once broke inventory construction — see the complete-cross
// shortcut in phases/inventory.ts. Every four-division shape is feasible at 13 and
// 14 weeks, so all generate.
for (const teamCount of [8, 10, 12, 14, 16]) {
  verify(teamCount, 13, 4);
  verify(teamCount, 14, 4);
}

const deterministicSetup = setupFor(12, 14, 3);
const first = generateLeagueSchedule(deterministicSetup, "deterministic-check");
const second = generateLeagueSchedule(deterministicSetup, "deterministic-check");
check(JSON.stringify(first.weeks) === JSON.stringify(second.weeks), "same seed produces the same schedule");

const legacyWeeks: ScheduleWeek[] = [
  {
    weekNumber: 1,
    dateLabel: "Week 1",
    games: [{
      id: "legacy-week-1",
      week: 1,
      homeTeamId: "team-a",
      awayTeamId: "team-b",
      matchupType: "division",
      seriesGame: 2,
      seriesLength: 2,
      dateLabel: "Week 1",
      stadium: "Stadium A",
    }],
  },
  {
    weekNumber: 7,
    dateLabel: "Week 7",
    games: [{
      id: "legacy-week-7",
      week: 7,
      homeTeamId: "team-b",
      awayTeamId: "team-a",
      matchupType: "division",
      seriesGame: 1,
      seriesLength: 2,
      dateLabel: "Week 7",
      stadium: "Stadium B",
    }],
  },
];
const repairedLegacyWeeks = normalizeSeriesGameNumbers(legacyWeeks);
check(repairedLegacyWeeks[0].games[0].seriesGame === 1, "saved Week 1 series numbering is repaired");
check(repairedLegacyWeeks[1].games[0].seriesGame === 2, "saved later series numbering follows chronology");

console.log(`Engine matrix passed: ${checks} checks across 29 league shapes.`);
