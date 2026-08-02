import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  mapEspnPlayerWeekStats,
  mapSleeperPlayerWeekStats,
  type EspnMatchupPayload,
  type SleeperMatchupPlayerPayload,
} from "../lib/playerData";
import type { Team } from "../lib/types";

const fixtureRoot = path.join(process.cwd(), "scripts", "fixtures", "provider");
const syncedAt = "2026-08-02T00:00:00.000Z";

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(fixtureRoot, relativePath), "utf8")) as T;
}

function closeTo(actual: number | undefined, expected: number, label: string) {
  assert.ok(actual !== undefined, `${label} is present`);
  assert.equal(actual.toFixed(2), expected.toFixed(2), label);
}

function providerTeams(provider: "espn" | "sleeper", leagueId: string, count: number): Team[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `team-${index + 1}`,
    providerId: `${provider}-${leagueId}-${index + 1}`,
    city: "",
    name: `Team ${index + 1}`,
    shortName: `T${index + 1}`,
    manager: "",
    color: "#117a45",
    divisionId: "division-1",
    overallRank: index + 1,
    stadium: "",
  }));
}

function espnProviderTeams(leagueId: string, teams: Array<{ id: number }>): Team[] {
  return teams.map((team, index) => ({
    id: `team-${team.id}`,
    providerId: `espn-${leagueId}-${team.id}`,
    city: "",
    name: `Team ${team.id}`,
    shortName: `T${team.id}`,
    manager: "",
    color: "#117a45",
    divisionId: "division-1",
    overallRank: index + 1,
    stadium: "",
  }));
}

const sleeperLeagueId = "856201517630328832";
const sleeperLeague = readJson<{ season: string; roster_positions: string[] }>(`${sleeperLeagueId.startsWith("sleeper-") ? sleeperLeagueId : `sleeper-${sleeperLeagueId}`}/league.json`);
const sleeperMatchups = readJson<SleeperMatchupPlayerPayload[]>(`sleeper-${sleeperLeagueId}/matchups-week-1.json`);
const sleeperRows = mapSleeperPlayerWeekStats({
  scheduleId: "schedule-sleeper",
  providerLeagueId: sleeperLeagueId,
  season: Number(sleeperLeague.season),
  week: 1,
  teams: providerTeams("sleeper", sleeperLeagueId, 8),
  rosterPositions: sleeperLeague.roster_positions,
  matchups: sleeperMatchups,
  syncedAt,
});
const sleeperKnown = sleeperRows.find((row) => row.providerRosterId === "1" && row.providerPlayerId === "4046");
assert.equal(sleeperRows.length, 112, "Sleeper fixture maps every rostered week player");
assert.equal(sleeperKnown?.teamId, "team-1", "Sleeper ownership uses week roster id");
assert.equal(sleeperKnown?.lineupStatus, "starter", "Sleeper starter parsed from starters array");
assert.equal(sleeperKnown?.starterIndex, 0, "Sleeper starter index follows platform starter order");
assert.equal(sleeperKnown?.inferredSlot, "QB", "Sleeper slot inferred from roster_positions[0]");
assert.equal(sleeperKnown?.slotConfidence, "inferred", "Sleeper starter slot is inferred");
closeTo(sleeperKnown?.points, 34.9, "Sleeper player 4046 displayed Week 1 points");

const sleeperBench = sleeperRows.find((row) => row.providerRosterId === "1" && row.providerPlayerId === "1689");
assert.equal(sleeperBench?.lineupStatus, "bench", "Sleeper non-starter parsed as bench");
assert.equal(sleeperBench?.inferredSlot, "BENCH", "Sleeper bench slot normalized");
assert.equal(sleeperBench?.slotConfidence, "bench", "Sleeper bench slot confidence");

const espnLeague42654852 = readJson<{ id: number; seasonId: number; schedule: EspnMatchupPayload[]; teams: Array<{ id: number }> }>("espn-42654852/league-week-1.json");
const espnRows42654852 = mapEspnPlayerWeekStats({
  scheduleId: "schedule-espn-42654852",
  providerLeagueId: "42654852",
  season: espnLeague42654852.seasonId,
  teams: espnProviderTeams("42654852", espnLeague42654852.teams),
  schedule: espnLeague42654852.schedule,
  weeks: [1],
  syncedAt,
});
const joshAllen = espnRows42654852.find((row) => row.providerPlayerId === "3918298");
assert.equal(espnRows42654852.length, 64, "ESPN 42654852 maps Week 1 roster entries");
assert.equal(joshAllen?.teamId, "team-1", "ESPN ownership uses matchup side teamId");
assert.equal(joshAllen?.lineupStatus, "starter", "ESPN starter parsed from lineup slot");
assert.equal(joshAllen?.inferredSlot, "QB", "ESPN lineupSlotId 0 maps to QB");
assert.equal(joshAllen?.slotConfidence, "confirmed", "ESPN slot is platform-confirmed");
closeTo(joshAllen?.points, 38.76, "ESPN Josh Allen displayed Week 1 applied points");

const espnLeague11593953 = readJson<{ id: number; seasonId: number; schedule: EspnMatchupPayload[]; teams: Array<{ id: number }> }>("espn-11593953/league-week-1.json");
const espnRows11593953 = mapEspnPlayerWeekStats({
  scheduleId: "schedule-espn-11593953",
  providerLeagueId: "11593953",
  season: espnLeague11593953.seasonId,
  teams: espnProviderTeams("11593953", espnLeague11593953.teams),
  schedule: espnLeague11593953.schedule,
  weeks: [1],
  syncedAt,
});
const commandersCoach = espnRows11593953.find((row) => row.providerPlayerId === "-14028");
assert.ok(espnRows11593953.some((row) => row.rawSlot === 19), "ESPN 11593953 fixture includes HC slot 19");
assert.equal(commandersCoach?.inferredSlot, "HC", "ESPN lineupSlotId 19 maps to HC");
assert.equal(commandersCoach?.lineupStatus, "starter", "ESPN HC is treated as a starter slot");
closeTo(commandersCoach?.points, 12.3, "ESPN Commanders Coach displayed Week 1 applied points");

console.log("Player parser matrix passed:");
console.log("- Sleeper 856201517630328832 player 4046: 34.90 pts, starter index 0, inferred QB");
console.log("- ESPN 42654852 Josh Allen: 38.76 pts, confirmed QB slot");
console.log("- ESPN 11593953 Commanders Coach: 12.30 pts, confirmed HC slot 19");
