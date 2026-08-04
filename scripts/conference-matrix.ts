import assert from "node:assert/strict";
import { createConferences, createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import {
  applyTeamConferenceIds,
  conferenceTeamGroups,
  defaultConferenceAssignment,
  hasConferences,
  reconcileConferenceSetup,
} from "../lib/conferences";
import { generateLeagueSchedule } from "../lib/schedule";
import { identityFromSetup, normalizeSavedLeague } from "../lib/savedLeagues";
import type { LeagueSetupInput } from "../lib/types";

function matchupSignature(setup: LeagueSetupInput) {
  return generateLeagueSchedule(setup, "conference-matrix")
    .weeks.map((week) => week.games.map((game) => `${game.homeTeamId}:${game.awayTeamId}:${game.matchupType}`).join("|"))
    .join("\n");
}

function scheduleCoverage(setup: LeagueSetupInput) {
  const schedule = generateLeagueSchedule(setup, "conference-matrix");
  return {
    games: schedule.weeks.reduce((total, week) => total + week.games.length, 0),
    teams: new Set(
      schedule.weeks.flatMap((week) =>
        week.games.flatMap((game) => [game.homeTeamId, game.awayTeamId]),
      ),
    ).size,
    weeks: schedule.weeks.length,
  };
}

const nonConference = createDefaultSetup();
assert.equal(hasConferences(nonConference), false);
assert.ok(nonConference.teams.every((team) => team.conferenceId === undefined));
assert.deepEqual(conferenceTeamGroups(nonConference), []);

const conferences = createConferences(2);
const divisions = defaultConferenceAssignment(createDivisions(4), conferences);
const conferenceSetup: LeagueSetupInput = {
  ...createDefaultSetup(),
  id: "conference-matrix",
  name: "Conference Matrix",
  divisions,
  conferences,
  teams: createTeams(16, divisions),
};

assert.equal(hasConferences(conferenceSetup), true);
assert.ok(conferenceSetup.teams.every((team) => team.conferenceId === divisions.find((division) => division.id === team.divisionId)?.conferenceId));
assert.deepEqual(conferenceTeamGroups(conferenceSetup).map((group) => [group.conference.id, group.teams.length]), [["conference-1", 8], ["conference-2", 8]]);

const strippedDivisions = divisions.map((division) => ({ ...division, conferenceId: undefined }));
const strippedSetup: LeagueSetupInput = {
  ...conferenceSetup,
  conferences: undefined,
  divisions: strippedDivisions,
  teams: applyTeamConferenceIds(conferenceSetup.teams, strippedDivisions),
};
assert.ok(strippedSetup.teams.every((team) => team.conferenceId === undefined));
assert.equal(matchupSignature(conferenceSetup), matchupSignature(strippedSetup));
assert.deepEqual(scheduleCoverage(conferenceSetup), scheduleCoverage(strippedSetup));

const reconciled = reconcileConferenceSetup(createDivisions(6));
assert.equal(reconciled.conferences?.length, 2);
assert.ok(reconciled.divisions.every((division) => Boolean(division.conferenceId)));

const normalizedPreset = normalizeSavedLeague({
  id: "saved-conf",
  name: "Saved Conference Matrix",
  data: identityFromSetup(conferenceSetup),
});
assert.equal(normalizedPreset?.data.conferences?.length, 2);
assert.ok(normalizedPreset?.data.teams.every((team) => team.conferenceId));

console.log("Conference matrix passed:");
console.log("- non-conference setup has no team conference ids and no groups");
console.log("- 4-division conference setup groups 16 teams as 8 + 8");
console.log("- conference metadata is preserved without changing generated matchups");
console.log("- saved conference setup round-trips with conferences and team conference ids");
