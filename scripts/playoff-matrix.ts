import assert from "node:assert/strict";
import { createConferences, createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import { conferenceDivisionGroups, defaultConferenceAssignment } from "../lib/conferences";
import {
  createDefaultPlayoffSettings,
  getMaximumPlayoffFieldSize,
  getPlayoffByeCount,
  getPlayoffGameBrandingSlots,
  getPlayoffRoundNames,
  getRequiredPlayoffWeeks,
  projectPlayoffRounds,
  projectPlayoffSeeds,
  normalizePlayoffSettings,
  resolvePlayoffPlacementMode,
} from "../lib/playoffs";
import { projectConsolationBracket, projectFinalPlacements, projectPlacementChart } from "../lib/consolation";
import { formatDraftPlace, getTeamsMissingDraftPlaces, getWeekOneTeamOrder, hasCompleteDraftRanking } from "../lib/rankings";
import { getNflWeekWindow } from "../lib/schedule";
import { calculateStandings } from "../lib/standings";
import type { GeneratedSchedule, LeagueSetupInput, PlayoffGame } from "../lib/types";

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
  assert.equal(settings.consolationMode, "standard");
  assert.equal(settings.thirdPlaceGame, true);
});

check(() => {
  const defaults = createDefaultPlayoffSettings(10);
  const normalized = normalizePlayoffSettings({
    ...defaults,
    consolationMode: "division-halves",
    roundLogoUrls: ["data:image/png;base64,round-one"],
    gameLogoUrls: {
      "main-r1-g1": "data:image/png;base64,wild-card-one",
      "invalid-slot": "data:image/png;base64,discard-me",
    },
  }, 10, "#117A45", 14);
  assert.equal(normalized.consolationMode, "division-halves");
  assert.equal(normalized.roundLogoUrls?.[0], "data:image/png;base64,round-one");
  assert.equal(normalized.gameLogoUrls?.["main-r1-g1"], "data:image/png;base64,wild-card-one");
  assert.equal(normalized.gameLogoUrls?.["invalid-slot"], undefined);
  const disabled = normalizePlayoffSettings({ ...defaults, consolationMode: "off", thirdPlaceGame: true }, 10, "#117A45", 14);
  assert.equal(disabled.thirdPlaceGame, false);
});

check(() => {
  const settings = createDefaultPlayoffSettings(10);
  const slots = getPlayoffGameBrandingSlots(settings, 2);
  assert.deepEqual(slots.map((slot) => slot.id), [
    "main-r1-g1",
    "main-r1-g2",
    "main-r2-g1",
    "main-r2-g2",
    "main-r3-g1",
  ]);
});

check(() => {
  const setup = createDefaultSetup();
  setup.playoffs = { ...setup.playoffs, consolationMode: "standard" };
  const bracket = projectConsolationBracket(blankSchedule(setup));
  assert.ok(bracket);
  assert.equal(bracket.mode, "standard");
  const firstRoundTeamGames = bracket.rounds[0].games.filter((game) => game.entrants.every((entrant) => entrant.kind === "team"));
  assert.deepEqual(firstRoundTeamGames.map((game) => game.entrants.map((entrant) => entrant.projectedSeed)), [[7, 10], [8, 9]]);
  assert.ok(bracket.rounds[1].games.some((game) => game.label === "5th Place"));
  assert.ok(bracket.rounds[1].games.some((game) => game.label === "7th Place"));
  assert.ok(bracket.rounds[1].games.some((game) => game.label === "9th Place"));
  assert.ok(bracket.rounds[2].games.some((game) => game.label === "3rd Place"));
});

check(() => {
  const setup = createDefaultSetup();
  setup.playoffs = { ...setup.playoffs, consolationMode: "division-halves" };
  const bracket = projectConsolationBracket(blankSchedule(setup));
  assert.ok(bracket);
  assert.equal(bracket.mode, "division-halves");
  const divisionGames = bracket.rounds[0].games.filter((game) => Boolean(game.divisionId));
  assert.equal(divisionGames.length, 2);
  divisionGames.forEach((game) => {
    const teamEntrants = game.entrants.filter((entrant) => entrant.kind === "team");
    assert.equal(new Set(teamEntrants.map((entrant) => entrant.divisionId)).size, 1);
    assert.match(game.label, /"Not Last Place" Bowl$/);
  });
  assert.ok(bracket.rounds[1].games.some((game) => game.label === "Draft Pick Bowl (7th Place)"));
  assert.ok(bracket.rounds[1].games.some((game) => game.label === "Toilet Bowl (9th Place)"));
  const placements = projectFinalPlacements(blankSchedule(setup));
  assert.equal(placements.length, setup.teams.length);
  assert.equal(placements[6].eventLabel, "Draft Pick Bowl (7th Place)");
  assert.equal(placements[8].eventLabel, "Toilet Bowl (9th Place)");
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
  // reseedMode divergence after an upset (overall placement, where reseeding is global — under
  // division-halves a same-half upset holds its slot either way): a Wild Card upset (seed 6 over
  // seed 3) keeps its bracket slot under "fixed" (the default) but is re-sorted under "each-round".
  const setup = createDefaultSetup();
  setup.playoffs = { ...setup.playoffs, placementMode: "overall" };
  const seeds = projectPlayoffSeeds(blankSchedule(setup));
  const seedTeam = (n: number) => seeds.find((seed) => seed.seed === n)!.teamId;
  const upset = {
    id: "main-r1-g1", week: 15, gameNumber: 1, roundIndex: 0, round: "Wild Card", bracket: "main",
    homeTeamId: seedTeam(3), awayTeamId: seedTeam(6), homeScore: 20, awayScore: 28,
    matchupType: "cross-division", seriesGame: 1, seriesLength: 1, dateLabel: "Dec 15–22, 2026", stadium: "Neutral",
  } as PlayoffGame;
  const withUpset: GeneratedSchedule = { ...blankSchedule(setup), playoffGames: [upset] };

  // no upset: fixed === each-round === projection
  assert.deepEqual(projectPlayoffRounds(blankSchedule(setup))[1].matchups.map((m) => [m.homeSeed, m.awaySeed]), [[1, 4], [2, 3]]);
  // fixed (default): seed 6 advances in seed 3's slot -> [1 vs 4], [2 vs 6]
  assert.deepEqual(projectPlayoffRounds(withUpset)[1].matchups.map((m) => [m.homeSeed, m.awaySeed]), [[1, 4], [2, 6]]);
  // each-round: reseed survivors [1,2,4,6] -> [1 vs 6], [2 vs 4]
  const reseeded = projectPlayoffRounds({ ...withUpset, setup: { ...setup, playoffs: { ...setup.playoffs, reseedMode: "each-round" } } });
  assert.deepEqual(reseeded[1].matchups.map((m) => [m.homeSeed, m.awaySeed]), [[1, 6], [2, 4]]);
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

// ── Conferences & large-league playoffs ────────────────────────────────────
check(() => {
  // Even divisions (8) with a conference assignment → division-halves across two conferences.
  const divisions = defaultConferenceAssignment(createDivisions(8), createConferences(2));
  const conferences = createConferences(2);
  const base = createDefaultSetup();
  const setup = { ...base, divisions, conferences, teams: createTeams(32, divisions), playoffs: { ...base.playoffs, fieldSize: 8, placementMode: "auto" as const } };
  assert.equal(resolvePlayoffPlacementMode(setup), "division-halves");
  const seeds = projectPlayoffSeeds(blankSchedule(setup), 8);
  // Two bracket sides, four seeds each; an 8-field / 8-division bracket is all division winners.
  assert.equal(seeds.filter((seed) => seed.bracketSide === "A").length, 4);
  assert.equal(seeds.filter((seed) => seed.bracketSide === "B").length, 4);
  assert.ok(seeds.every((seed) => seed.divisionLeader));
});

check(() => {
  // Conference halves stay conference-local even when playoff spots are tighter than division
  // count: 8 division winners, 6 playoff spots → top 3 leaders per conference, no wildcards.
  const divisions = defaultConferenceAssignment(createDivisions(8), createConferences(2));
  const conferences = createConferences(2);
  const base = createDefaultSetup();
  const setup = { ...base, divisions, conferences, teams: createTeams(16, divisions), playoffs: { ...base.playoffs, fieldSize: 6, placementMode: "auto" as const } };
  assert.equal(resolvePlayoffPlacementMode(setup), "division-halves");
  const seeds = projectPlayoffSeeds(blankSchedule(setup), 6);
  assert.equal(seeds.length, 6);
  assert.equal(seeds.filter((seed) => seed.bracketSide === "A").length, 3);
  assert.equal(seeds.filter((seed) => seed.bracketSide === "B").length, 3);
  assert.ok(seeds.every((seed) => seed.divisionLeader));
});

check(() => {
  // Six divisions with conferences → 3 per side; 12-field seats all six leaders + six wild cards.
  const divisions = defaultConferenceAssignment(createDivisions(6), createConferences(2));
  const conferences = createConferences(2);
  const base = createDefaultSetup();
  const setup = { ...base, weeks: 13 as const, divisions, conferences, teams: createTeams(24, divisions), playoffs: { ...base.playoffs, fieldSize: 12, placementMode: "auto" as const } };
  assert.equal(resolvePlayoffPlacementMode(setup), "division-halves");
  const seeds = projectPlayoffSeeds(blankSchedule(setup), 12);
  assert.equal(seeds.filter((seed) => seed.bracketSide === "A").length, 6);
  assert.equal(seeds.filter((seed) => seed.bracketSide === "B").length, 6);
  assert.equal(seeds.filter((seed) => seed.divisionLeader).length, 6);
});

check(() => {
  // Odd divisions (5) → one unified bracket (division-leaders), no conferences.
  const divisions = createDivisions(5);
  const base = createDefaultSetup();
  const setup = { ...base, weeks: 13 as const, divisions, teams: createTeams(20, divisions), playoffs: { ...base.playoffs, fieldSize: 8, placementMode: "auto" as const } };
  assert.equal(resolvePlayoffPlacementMode(setup), "division-leaders");
  const seeds = projectPlayoffSeeds(blankSchedule(setup), 8);
  assert.ok(seeds.slice(0, 5).every((seed) => seed.divisionLeader));
});

check(() => {
  // Odd division counts use one unified bracket, but leaders are still protected before
  // wildcards. A 7-team field gives one bye and seats all 5 division winners first.
  const divisions = createDivisions(5);
  const base = createDefaultSetup();
  const setup = { ...base, weeks: 14 as const, divisions, teams: createTeams(15, divisions), playoffs: { ...base.playoffs, fieldSize: 7, placementMode: "auto" as const } };
  assert.equal(resolvePlayoffPlacementMode(setup), "division-leaders");
  const seeds = projectPlayoffSeeds(blankSchedule(setup), 7);
  assert.equal(seeds.length, 7);
  assert.equal(seeds.filter((seed) => seed.divisionLeader).length, 5);
  assert.ok(seeds.slice(0, 5).every((seed) => seed.divisionLeader));
  assert.equal(getPlayoffByeCount(7), 1);
});

check(() => {
  // Even divisions but NO conference assignment → falls back to division-leaders (needs two real sides).
  const divisions = createDivisions(6);
  const base = createDefaultSetup();
  const setup = { ...base, weeks: 13 as const, divisions, teams: createTeams(24, divisions), playoffs: { ...base.playoffs, fieldSize: 8, placementMode: "auto" as const } };
  assert.equal(resolvePlayoffPlacementMode(setup), "division-leaders");
});

check(() => {
  // Round naming uses "Conference Championship" for a conference bracket.
  const divisions = defaultConferenceAssignment(createDivisions(8), createConferences(2));
  const settings = { ...createDefaultPlayoffSettings(32), fieldSize: 8, placementMode: "division-halves" as const };
  const names = getPlayoffRoundNames(settings, divisions.length);
  assert.ok(names.includes("Conference Championship"));
  assert.equal(names[names.length - 1], "Championship");
});

check(() => {
  // conferenceDivisionGroups splits divisions evenly into two conferences.
  const divisions = defaultConferenceAssignment(createDivisions(6), createConferences(2));
  const groups = conferenceDivisionGroups({ divisions, conferences: createConferences(2) });
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((group) => group.length), [3, 3]);
});

check(() => {
  // Placement chart — 32 teams / 3 playoff weeks / 8-team field: 1–8 exact, then 9,10, 11–12,
  // 13–16, tail 17–32 (matches the locked design).
  const divisions = defaultConferenceAssignment(createDivisions(8), createConferences(2));
  const conferences = createConferences(2);
  const base = createDefaultSetup();
  const setup = { ...base, divisions, conferences, teams: createTeams(32, divisions), playoffs: { ...base.playoffs, fieldSize: 8, placementMode: "auto" as const, consolationMode: "standard" as const } };
  const bands = projectPlacementChart(blankSchedule(setup)).map((slot) => [slot.placeStart, slot.placeEnd]);
  assert.deepEqual(bands, [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 9], [10, 10], [11, 12], [13, 16], [17, 32]]);
});

check(() => {
  // Small league (M = 4 ≤ 2^3) → everyone gets an exact place, no ranges.
  const divisions = createDivisions(2);
  const base = createDefaultSetup();
  const setup = { ...base, divisions, teams: createTeams(10, divisions), playoffs: { ...base.playoffs, fieldSize: 6, placementMode: "overall" as const, consolationMode: "standard" as const } };
  const chart = projectPlacementChart(blankSchedule(setup));
  assert.equal(chart.length, 10);
  assert.ok(chart.every((slot) => slot.exact));
});

check(() => {
  // 10 teams / 2 divisions / 6 playoff teams: four non-qualifiers can fully settle 7th-10th.
  const setup = createDefaultSetup();
  setup.playoffs = { ...setup.playoffs, fieldSize: 6, placementMode: "division-halves", consolationMode: "division-halves" };
  const bracket = projectConsolationBracket(blankSchedule(setup));
  assert.ok(bracket);
  assert.equal(bracket.admittedTeamIds.length, 4);
  assert.equal(bracket.eliminatedTeamIds.length, 0);
  assert.equal(bracket.rounds[0].games.filter((game) => Boolean(game.divisionId)).length, 2);
  assert.ok(bracket.rounds[1].games.some((game) => game.label === "Draft Pick Bowl (7th Place)"));
  assert.ok(bracket.rounds[1].games.some((game) => game.label === "Toilet Bowl (9th Place)"));
});

check(() => {
  // 16 teams / 6 playoff teams / 14-week regular season: only 3 playoff weeks, so consolation
  // admits 8 teams and the final 2 teams are outside the bracket.
  const divisions = defaultConferenceAssignment(createDivisions(4), createConferences(2));
  const conferences = createConferences(2);
  const base = createDefaultSetup();
  const setup = { ...base, weeks: 14 as const, divisions, conferences, teams: createTeams(16, divisions), playoffs: { ...base.playoffs, fieldSize: 6, placementMode: "division-halves" as const, consolationMode: "standard" as const } };
  const bracket = projectConsolationBracket(blankSchedule(setup));
  assert.ok(bracket);
  assert.equal(bracket.placementCap, 8);
  assert.equal(bracket.admittedTeamIds.length, 8);
  assert.equal(bracket.eliminatedTeamIds.length, 2);
  const chart = projectPlacementChart(blankSchedule(setup));
  assert.deepEqual(chart.at(-1), { placeStart: 15, placeEnd: 16, label: "15th–16th", tier: "eliminated", source: "Outside the bracket", teamIds: chart.at(-1)?.teamIds ?? [], exact: false });
});

check(() => {
  // 16 teams / 6 playoff teams / 13-week regular season with 4 playoff weeks: all ten
  // consolation teams fit, with top consolation seeds receiving byes into Week 2.
  const divisions = defaultConferenceAssignment(createDivisions(4), createConferences(2));
  const conferences = createConferences(2);
  const base = createDefaultSetup();
  const setup = { ...base, weeks: 13 as const, divisions, conferences, teams: createTeams(16, divisions), playoffs: { ...base.playoffs, playoffWeeks: 4 as const, fieldSize: 6, placementMode: "division-halves" as const, consolationMode: "standard" as const } };
  const bracket = projectConsolationBracket(blankSchedule(setup));
  assert.ok(bracket);
  assert.equal(bracket.placementCap, 16);
  assert.equal(bracket.admittedTeamIds.length, 10);
  assert.equal(bracket.eliminatedTeamIds.length, 0);
  assert.equal(bracket.rounds.length, 4);
  assert.equal(bracket.rounds[0].games.length, 2);
  assert.ok(bracket.rounds[1].games.some((game) => game.entrants.some((entrant) => entrant.kind === "team" && entrant.projectedSeed <= 8)));
  assert.ok(bracket.rounds[3].games.some((game) => game.label === "7th Place"));
});

check(() => {
  // Playoff length: 13-week seasons choose 3 (≤8 seeds) or 4 (≤16) weeks; 14-week is always 3.
  assert.equal(getMaximumPlayoffFieldSize(32, 13, "single-elimination", 3), 8);
  assert.equal(getMaximumPlayoffFieldSize(32, 13, "single-elimination", 4), 16);
  assert.equal(getMaximumPlayoffFieldSize(32, 14, "single-elimination"), 8);
  assert.equal(getMaximumPlayoffFieldSize(32, 14, "single-elimination", 4), 8); // clamped to the 14-week ceiling
});

console.log(`Playoff, holiday, and opening-week matrix: ${checks} checks passed.`);
