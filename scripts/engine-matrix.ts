import assert from "node:assert/strict";
import { createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import { normalizeSeriesGameNumbers } from "../lib/matchups";
import { generateLeagueSchedule } from "../lib/schedule";
import { EngineInfeasibleError } from "../lib/engine/v3";
import type { LeagueSetupInput, ScheduleWeek } from "../lib/types";

let checks = 0;
function check(value: unknown, message: string) {
  assert.ok(value, message);
  checks += 1;
}

function setupFor(teamCount: number, weeks: 13 | 14, divisionCount: 2 | 3): LeagueSetupInput {
  const divisions = createDivisions(divisionCount);
  return { ...createDefaultSetup(), id: `matrix-${teamCount}-${divisionCount}-${weeks}`, name: `${teamCount} Team Matrix`, weeks, divisions, teams: createTeams(teamCount, divisions) };
}

function verify(teamCount: number, weeks: 13 | 14, divisionCount: 2 | 3) {
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
  for (const game of games) {
    const home = teamById.get(game.homeTeamId)!;
    const away = teamById.get(game.awayTeamId)!;
    if (home.divisionId !== away.divisionId) continue;
    const key = [home.id, away.id].sort().join(":");
    divisionPairs.set(key, (divisionPairs.get(key) ?? 0) + 1);
  }
  check([...divisionPairs.values()].every((count) => count === 2), `${teamCount}/${divisionCount}/${weeks}: divisional opponents twice`);
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

console.log(`Engine matrix passed: ${checks} checks across 19 league shapes.`);
