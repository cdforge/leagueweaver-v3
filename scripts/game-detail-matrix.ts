import assert from "node:assert/strict";
import { createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import { buildGameDetailVM, type GameDetailPlayerStat } from "../lib/gameDetail";
import { generateLeagueSchedule } from "../lib/schedule";
import type { LeagueSetupInput } from "../lib/types";

let checks = 0;
function check(value: unknown, message: string) {
  assert.ok(value, message);
  checks += 1;
}

const divisions = createDivisions(2);
const setup: LeagueSetupInput = {
  ...createDefaultSetup(),
  id: "gdm-1-non-pve",
  name: "GDM Matrix League",
  weeks: 13,
  divisions,
  teams: createTeams(10, divisions),
};
const schedule = generateLeagueSchedule(setup, "gdm-1-non-pve-seed");
const game = schedule.weeks[0].games[0];
game.awayScore = 44.44;
game.homeScore = 66.66;
const now = new Date("2026-08-02T12:00:00.000Z").toISOString();

function row(teamId: string, providerPlayerId: string, points: number, lineupStatus: GameDetailPlayerStat["lineupStatus"], starterIndex?: number): GameDetailPlayerStat {
  return {
    scheduleId: schedule.id,
    provider: "sleeper",
    providerLeagueId: "gdm-matrix",
    season: schedule.setup.seasonYear,
    week: game.week,
    teamId,
    providerRosterId: teamId,
    providerPlayerId,
    canonicalPlayerId: `sleeper:${providerPlayerId}`,
    displayName: `Player ${providerPlayerId}`,
    position: starterIndex === 0 ? "QB" : "RB",
    nflTeam: starterIndex === 0 ? "KC" : "DET",
    points,
    lineupStatus,
    starterIndex,
    inferredSlot: starterIndex === 0 ? "QB" : "RB",
    rawSlot: starterIndex ?? "BN",
    slotConfidence: lineupStatus === "starter" ? "confirmed" : "bench",
    isProvisional: false,
    finalLockAt: now,
    syncedAt: now,
    sourcePayloadHash: `hash-${providerPlayerId}`,
  };
}

const rows = [
  row(game.awayTeamId, "away-qb", 18.1, "starter", 0),
  row(game.awayTeamId, "away-rb", 12.2, "starter", 1),
  row(game.awayTeamId, "away-bench", 99.9, "bench"),
  row(game.awayTeamId, "away-ir", 44.4, "ir"),
  row(game.homeTeamId, "home-qb", 21.5, "starter", 0),
  row(game.homeTeamId, "home-rb", 15.25, "starter", 1),
  row(game.homeTeamId, "home-bench", 88.8, "bench"),
];

const synced = buildGameDetailVM(schedule, game.id, rows);
check(synced, "synced game detail builds");
assert.ok(synced);
assert.equal(synced.away.starterTotal, 30.3, "away total excludes bench and IR");
assert.equal(synced.home.starterTotal, 36.75, "home total excludes bench");
assert.equal(synced.away.bench.length, 1, "away bench is visible");
assert.equal(synced.away.reserves.length, 1, "away IR is visible as reserve");
assert.equal(synced.away.platformTotal, 44.44, "platform team score remains available");
check(synced.ratingScore10 >= 0.1 && synced.ratingScore10 <= 10, "rating is score10");
check(!synced.unsynced, "synced data is detected");
check(synced.stadium === game.stadium, "stadium is the real scheduled stadium");

const unsynced = buildGameDetailVM(schedule, game.id, []);
check(unsynced, "unsynced game detail builds");
assert.ok(unsynced);
check(unsynced.unsynced, "unsynced fallback is detected");
assert.equal(unsynced.away.starterTotal, null, "unsynced away has no starter total");
assert.equal(unsynced.away.platformTotal, 44.44, "unsynced away falls back to team score");
assert.equal(unsynced.home.platformTotal, 66.66, "unsynced home falls back to team score");

console.log(`Game detail matrix passed (${checks} checks): starters count, bench/IR excluded, fallback available, rating score10.`);
