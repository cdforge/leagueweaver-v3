import assert from "node:assert/strict";
import { createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import { buildGameDetailVM, type GameDetailPlayerStat } from "../lib/gameDetail";
import { generateLeagueSchedule } from "../lib/schedule";
import type { LeagueSetupInput, MatchupRosterDetail, PlayoffGame } from "../lib/types";

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

function row(teamId: string, providerPlayerId: string, points: number, lineupStatus: GameDetailPlayerStat["lineupStatus"], starterIndex?: number, slot: GameDetailPlayerStat["inferredSlot"] = starterIndex === 0 ? "QB" : "RB", week = game.week): GameDetailPlayerStat {
  return {
    scheduleId: schedule.id,
    provider: "sleeper",
    providerLeagueId: "gdm-matrix",
    season: schedule.setup.seasonYear,
    week,
    teamId,
    providerRosterId: teamId,
    providerPlayerId,
    canonicalPlayerId: `sleeper:${providerPlayerId}`,
    displayName: `Player ${providerPlayerId}`,
    position: slot,
    nflTeam: starterIndex === 0 ? "KC" : "DET",
    points,
    lineupStatus,
    starterIndex,
    inferredSlot: slot,
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

const rosterDetail: MatchupRosterDetail = {
  gameId: game.id,
  week: game.week,
  seasonYear: schedule.setup.seasonYear,
  provider: "espn",
  sourceSeasonYear: 2025,
  status: "final",
  home: {
    teamId: game.homeTeamId,
    total: 111.22,
    starters: [
      { id: "espn-home-qb", name: "Roster Home QB", slot: "QB", position: "QB", proTeam: "KC", points: 31.4, projectedPoints: 24.2, statLine: "250 Pass Yds, 2 Pass TD" },
    ],
    bench: [
      { id: "espn-home-bench", name: "Roster Home Bench", slot: "BE", position: "RB", proTeam: "DET", points: 8.8 },
    ],
  },
  away: {
    teamId: game.awayTeamId,
    total: 99.11,
    starters: [
      { id: "espn-away-qb", name: "Roster Away QB", slot: "QB", position: "QB", proTeam: "BUF", points: 28.6, projectedPoints: 22.9 },
    ],
    bench: [],
  },
};
const rosterSchedule = { ...schedule, matchupRosterDetails: { [game.id]: rosterDetail } };
const rosterSynced = buildGameDetailVM(rosterSchedule, game.id, []);
assert.equal(rosterSynced?.away.starters[0]?.name, "Roster Away QB", "matchup roster detail feeds away starters");
assert.equal(rosterSynced?.home.starters[0]?.projected, 24.2, "matchup roster detail carries projections");
assert.equal(rosterSynced?.home.bench[0]?.name, "Roster Home Bench", "matchup roster detail feeds bench");
assert.equal(rosterSynced?.home.platformTotal, 111.22, "matchup roster detail carries platform total");
assert.equal(rosterSynced?.status, "final", "matchup roster detail carries final status");
assert.equal(rosterSynced?.away.overallRecord, "0-0", "matchup detail carries entering overall record");
assert.equal(rosterSynced?.away.divisionRecord, "0-0", "matchup detail carries entering division record");
const upcomingDetail: MatchupRosterDetail = {
  ...rosterDetail,
  status: "upcoming",
  home: { ...rosterDetail.home, total: undefined, projectedTotal: 44.4 },
  away: { ...rosterDetail.away, total: undefined, projectedTotal: 33.3 },
};
const upcomingSynced = buildGameDetailVM({ ...schedule, matchupRosterDetails: { [game.id]: upcomingDetail } }, game.id, []);
assert.equal(upcomingSynced?.status, "upcoming", "matchup roster detail carries upcoming status");
assert.equal(upcomingSynced?.home.projectedTotal, 44.4, "upcoming roster detail carries projected total");
const liveSynced = buildGameDetailVM({ ...schedule, matchupRosterDetails: { [game.id]: { ...rosterDetail, status: "live" } } }, game.id, []);
assert.equal(liveSynced?.status, "live", "matchup roster detail carries live status");
const predraftSynced = buildGameDetailVM({ ...schedule, matchupRosterDetails: { [game.id]: { ...rosterDetail, status: "predraft" } } }, game.id, []);
assert.equal(predraftSynced?.status, "predraft", "matchup roster detail carries predraft status");
checks += 11;

const orderedRows = [
  row(game.awayTeamId, "away-flex", 8.1, "starter", 4, "FLEX"),
  row(game.awayTeamId, "away-wr", 9.2, "starter", 2, "WR"),
  row(game.awayTeamId, "away-qb-sort", 17.3, "starter", 0, "QB"),
  row(game.awayTeamId, "away-te", 7.4, "starter", 3, "TE"),
  row(game.awayTeamId, "away-rb-sort", 11.5, "starter", 1, "RB"),
];
const ordered = buildGameDetailVM(schedule, game.id, orderedRows);
assert.deepEqual(ordered?.away.starters.map((item) => item.slot), ["QB", "RB", "WR", "TE", "FLEX"], "starters render in standard slot order");
checks += 1;

const playoffGame: PlayoffGame = {
  id: "main-r1-g1",
  week: 14,
  gameNumber: 1,
  homeTeamId: game.homeTeamId,
  awayTeamId: game.awayTeamId,
  matchupType: "cross-division",
  seriesGame: 1,
  seriesLength: 1,
  dateLabel: "Playoff Week",
  stadium: "Historic Playoff Field",
  homeScore: 101.1,
  awayScore: 99.9,
  round: "Semifinal",
  roundIndex: 0,
  bracket: "main",
};
const playoffSchedule = { ...schedule, playoffGames: [playoffGame] };
const playoffRows = [
  row(playoffGame.awayTeamId, "away-playoff-qb", 25, "starter", 0, "QB", playoffGame.week),
  row(playoffGame.homeTeamId, "home-playoff-qb", 28, "starter", 0, "QB", playoffGame.week),
];
const playoff = buildGameDetailVM(playoffSchedule, playoffGame.id, playoffRows);
assert.equal(playoff?.isPlayoff, true, "playoff game detail is recognized");
assert.equal(playoff?.playoffLabel, "Semifinal", "playoff round label is carried into the modal VM");
assert.equal(playoff?.home.starterTotal, 28, "playoff roster rows populate from the playoff week");
checks += 3;

const unsynced = buildGameDetailVM(schedule, game.id, []);
check(unsynced, "unsynced game detail builds");
assert.ok(unsynced);
check(unsynced.unsynced, "unsynced fallback is detected");
assert.equal(unsynced.away.starterTotal, null, "unsynced away has no starter total");
assert.equal(unsynced.away.platformTotal, 44.44, "unsynced away falls back to team score");
assert.equal(unsynced.home.platformTotal, 66.66, "unsynced home falls back to team score");

console.log(`Game detail matrix passed (${checks} checks): starters count, bench/IR excluded, fallback available, rating score10, standard slot order, and playoff game details.`);
