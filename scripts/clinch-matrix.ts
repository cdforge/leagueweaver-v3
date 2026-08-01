import assert from "node:assert/strict";
import { calculateDivisionStandings, calculateStandings } from "../lib/standings";
import { projectPlayoffSeeds } from "../lib/playoffs";
import { calculateTeamClinchStates, getTeamClinchTimelines } from "../lib/clinch";
import {
  buildTeamRanges,
  clinchedWithin,
  isEliminatedFor,
  isLockedFor,
  resolveClinchPool,
  type ClinchAchievement,
} from "../lib/clinchCore";
import { buildLeague, teamId, type GameSpec } from "./support/leagueFixture";
import type { GeneratedSchedule } from "../lib/types";

let checks = 0;
function check(label: string, test: () => void) {
  try {
    test();
    checks += 1;
  } catch (error) {
    console.error(`FAIL: ${label}`);
    throw error;
  }
}

const CLINCH_ACHIEVEMENTS: ClinchAchievement[] = ["top-seed", "division-title", "playoff-berth"];

// ---------------------------------------------------------------------------
// Brute-force oracle: enumerate every completion of the unplayed games (each →
// home win / away win / tie with representative scores) and check whether the
// team achieves the target in ALL / SOME completions. Ground truth for the
// exact verdicts of the points certificate. Capped for tractability.
// ---------------------------------------------------------------------------
function unplayedRefs(schedule: GeneratedSchedule) {
  const refs: Array<[number, number]> = [];
  schedule.weeks.forEach((week, weekIndex) =>
    week.games.forEach((game, gameIndex) => {
      if (game.homeScore == null || game.awayScore == null) refs.push([weekIndex, gameIndex]);
    }),
  );
  return refs;
}

function achieves(schedule: GeneratedSchedule, id: string, achievement: ClinchAchievement, divisionId: string) {
  if (achievement === "top-seed") return calculateStandings(schedule)[0]?.teamId === id;
  if (achievement === "division-title") return calculateDivisionStandings(schedule, divisionId)[0]?.teamId === id;
  return projectPlayoffSeeds(schedule).some((seed) => seed.teamId === id);
}

function oracle(schedule: GeneratedSchedule, id: string, achievement: ClinchAchievement) {
  const team = schedule.setup.teams.find((entry) => entry.id === id)!;
  const refs = unplayedRefs(schedule);
  if (refs.length > 12) return null;
  const total = 3 ** refs.length;
  let inAll = true;
  let inSome = false;
  for (let mask = 0; mask < total; mask += 1) {
    const clone: GeneratedSchedule = structuredClone(schedule);
    let cursor = mask;
    for (const [weekIndex, gameIndex] of refs) {
      const outcome = cursor % 3;
      cursor = Math.floor(cursor / 3);
      const game = clone.weeks[weekIndex].games[gameIndex];
      if (outcome === 0) { game.homeScore = 1; game.awayScore = 0; }
      else if (outcome === 1) { game.homeScore = 0; game.awayScore = 1; }
      else { game.homeScore = 0; game.awayScore = 0; }
    }
    const got = achieves(clone, id, achievement, team.divisionId);
    inAll = inAll && got;
    inSome = inSome || got;
  }
  return { inAll, inSome };
}

// ===========================================================================
// 1. Characterization — lock current badge behavior on a completed season.
// ===========================================================================
check("final-season clinch states", () => {
  // 4 teams, 2 divisions (N={t1,t3}, S={t2,t4}), single round robin, all played.
  const schedule = buildLeague({
    teamCount: 4,
    divisionCount: 2,
    fieldSize: 2,
    placementMode: "overall",
    weeks: [
      [[0, 1, 1, 0], [2, 3, 1, 0]],
      [[0, 2, 1, 0], [1, 3, 1, 0]],
      [[0, 3, 1, 0], [1, 2, 1, 0]],
    ] as GameSpec[][],
  });
  const states = new Map(calculateTeamClinchStates(schedule, 3).map((state) => [state.teamId, state]));
  // Final order t1 > t2 > t3 > t4; field size 2 → t1,t2 in.
  assert.equal(states.get(teamId(0))!.topSeed, true);
  assert.equal(states.get(teamId(0))!.playoffBerth, true);
  assert.equal(states.get(teamId(0))!.divisionTitle, true, "t1 wins North");
  assert.equal(states.get(teamId(0))!.eliminated, false);
  assert.equal(states.get(teamId(1))!.divisionTitle, true, "t2 wins South");
  assert.equal(states.get(teamId(1))!.playoffBerth, true);
  assert.equal(states.get(teamId(1))!.topSeed, false);
  assert.equal(states.get(teamId(3))!.eliminated, true, "t4 last → out");
  assert.equal(states.get(teamId(3))!.playoffBerth, false);

  const timelines = new Map(getTeamClinchTimelines(schedule).map((timeline) => [timeline.teamId, timeline]));
  assert.equal(timelines.get(teamId(0))!.topSeed, true);
  assert.equal(timelines.get(teamId(0))!.divisionTitle, true);
  assert.equal(timelines.get(teamId(3))!.eliminated, true);
  assert.ok((timelines.get(teamId(3))!.eliminatedWeek ?? 99) <= 3);
});

// ===========================================================================
// 2. resolveClinchPool — pools & unsupported modes.
// ===========================================================================
check("resolveClinchPool pools", () => {
  const schedule = buildLeague({ teamCount: 6, divisionCount: 3, fieldSize: 4, placementMode: "overall", weeks: [[]] });
  const top = resolveClinchPool(schedule, teamId(0), "top-seed", 0)!;
  assert.equal(top.slots, 1);
  assert.equal(top.teamIds.length, 6);
  const division = resolveClinchPool(schedule, teamId(0), "division-title", 0)!;
  assert.equal(division.slots, 1);
  assert.equal(division.teamIds.length, 2, "3 divisions over 6 teams → 2 per division");
  assert.ok(division.teamIds.includes(teamId(0)) && division.teamIds.includes(teamId(3)));
  const berth = resolveClinchPool(schedule, teamId(0), "playoff-berth", 0)!;
  assert.equal(berth.slots, 4);
  assert.equal(berth.teamIds.length, 6);
});

check("resolveClinchPool — division-title needs divisions; division placement deferred", () => {
  const overall = buildLeague({ teamCount: 6, divisionCount: 4, fieldSize: 4, placementMode: "division-leaders", weeks: [[]] });
  assert.equal(resolveClinchPool(overall, teamId(0), "playoff-berth", 0), null, "division-leaders berth pool deferred");
  assert.equal(isLockedFor(overall, teamId(0), "playoff-berth", 0).approximate, true);
});

// ===========================================================================
// 3. isLockedFor / isEliminatedFor vs the brute-force oracle (exact verdicts).
// ===========================================================================
const crossCheckFixtures: Array<{ label: string; schedule: GeneratedSchedule }> = [
  {
    label: "4-team overall, 2 weeks played",
    schedule: buildLeague({
      teamCount: 4, divisionCount: 2, fieldSize: 2, placementMode: "overall",
      weeks: [
        [[0, 1, 1, 0], [2, 3, 1, 0]],
        [[0, 2, 1, 0], [1, 3, 1, 0]],
        [[0, 3], [1, 2]],
        [[0, 2], [1, 3]],
      ] as GameSpec[][],
    }),
  },
  {
    label: "6-team overall field 4, one week left",
    schedule: buildLeague({
      teamCount: 6, divisionCount: 3, fieldSize: 4, placementMode: "overall",
      weeks: [
        [[0, 1, 3, 0], [2, 3, 3, 0], [4, 5, 3, 0]],
        [[0, 2, 3, 0], [1, 4, 3, 0], [3, 5, 3, 0]],
        [[0, 3, 3, 0], [1, 5, 3, 0], [2, 4, 3, 0]],
        [[0, 4], [1, 2], [3, 5]],
      ] as GameSpec[][],
    }),
  },
];

for (const { label, schedule } of crossCheckFixtures) {
  check(`oracle cross-check — ${label}`, () => {
    const throughWeek = schedule.weeks.length;
    for (const team of schedule.setup.teams) {
      for (const achievement of CLINCH_ACHIEVEMENTS) {
        const pool = resolveClinchPool(schedule, team.id, achievement, throughWeek);
        if (!pool) continue;
        const lock = isLockedFor(schedule, team.id, achievement, throughWeek);
        const truth = oracle(schedule, team.id, achievement);
        if (!truth) continue;
        // Safety direction (the critical one): a locked verdict must hold in every completion.
        if (lock.locked) {
          assert.equal(lock.approximate, false, `${team.id}/${achievement}: locked must be exact`);
          assert.equal(truth.inAll, true, `${team.id}/${achievement}: engine locked but oracle found a miss`);
        }
        // A "guaranteed in every completion" team must never be reported not-locked-exactly.
        if (truth.inAll && !lock.locked) {
          assert.equal(lock.approximate, true, `${team.id}/${achievement}: oracle guaranteed but engine exact-not-locked`);
        }
      }
      // Elimination (playoff field) dual.
      const elim = isEliminatedFor(schedule, team.id, throughWeek);
      const truth = oracle(schedule, team.id, "playoff-berth");
      if (truth) {
        if (elim.locked) {
          assert.equal(elim.approximate, false);
          assert.equal(truth.inSome, false, `${team.id}: engine eliminated but oracle found a way in`);
        }
        if (!truth.inSome && !elim.locked) {
          assert.equal(elim.approximate, true, `${team.id}: oracle impossible but engine exact-not-eliminated`);
        }
      }
    }
  });

  // Badge/core consistency: for overall, non-final fixtures the badge booleans must
  // equal the core's locked verdict (same points math, single source of truth).
  check(`badge == core (overall) — ${label}`, () => {
    const throughWeek = schedule.weeks.length;
    const states = new Map(calculateTeamClinchStates(schedule, throughWeek).map((state) => [state.teamId, state]));
    for (const team of schedule.setup.teams) {
      assert.equal(states.get(team.id)!.topSeed, isLockedFor(schedule, team.id, "top-seed", throughWeek).locked);
      assert.equal(states.get(team.id)!.playoffBerth, isLockedFor(schedule, team.id, "playoff-berth", throughWeek).locked);
      assert.equal(states.get(team.id)!.eliminated, isEliminatedFor(schedule, team.id, throughWeek).locked);
    }
  });
}

// ===========================================================================
// 4. Exact layer beats the points model (rival-vs-rival). Two rivals can each
//    reach the subject on points, but they play each other, so at most one can —
//    the points certificate says "not clinched", the exact search says "clinched".
// ===========================================================================
check("rival-vs-rival exact clinch the points model misses", () => {
  const schedule = buildLeague({
    teamCount: 4, divisionCount: 2, fieldSize: 2, placementMode: "overall",
    weeks: [
      [[0, 1, 1, 0], [2, 3, 1, 0]],
      [[0, 2, 1, 0], [1, 3, 1, 0]],
      [[1, 2]], // only t2 vs t3 remain; t1 (2-0) and t4 (0-2) are done
    ] as GameSpec[][],
  });
  const ranges = buildTeamRanges(schedule, 3);
  const t1 = ranges.find((range) => range.teamId === teamId(0))!;
  // Points model: t2 and t3 can both reach t1's 4 → not clinched on points.
  assert.equal(clinchedWithin(ranges, t1, 2), false, "points model must miss this");
  // Exact: they play each other, so only one can reach 4 → t1 is locked into the top 2.
  const lock = isLockedFor(schedule, teamId(0), "playoff-berth", 3);
  assert.equal(lock.locked, true, "exact search must catch the rival-vs-rival clinch");
  assert.equal(lock.approximate, false);
  // And the oracle agrees t1 makes the field in every completion.
  assert.equal(oracle(schedule, teamId(0), "playoff-berth")!.inAll, true);
});

console.log(`clinch-matrix: ${checks} checks passed`);
