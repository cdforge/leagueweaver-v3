import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ESPN_LINEUP_SLOT_ID_TO_SLOT_KEY,
  SLOT_KEYS,
  SLEEPER_ROSTER_POSITION_TO_SLOT_KEY,
  espnSlotKey,
  playerWeekStatKey,
  sleeperSlotKey,
  type PlayerWeekStat,
} from "../lib/playerData";

const sql = readFileSync("supabase/sql/074_player_awards.sql", "utf8");

assert.deepEqual(SLOT_KEYS, [
  "QB", "TQB", "RB", "RB_WR_FLEX", "WR", "WR_TE_FLEX", "TE", "SUPERFLEX",
  "DT", "DE", "DL", "LB", "CB", "S", "DB", "DP", "DST", "K", "P", "HC",
  "FLEX", "IDP", "IDP_FLEX", "BENCH", "IR", "TAXI", "RESERVE", "UNKNOWN",
]);
assert.equal(espnSlotKey(19), "HC");
assert.equal(espnSlotKey(14), "DB");
assert.equal(espnSlotKey(23), "FLEX");
assert.equal(espnSlotKey(999), "UNKNOWN");
assert.equal(sleeperSlotKey("WRRB_FLEX"), "RB_WR_FLEX");
assert.equal(sleeperSlotKey("REC_FLEX"), "WR_TE_FLEX");
assert.equal(sleeperSlotKey("SUPER_FLEX"), "SUPERFLEX");
assert.equal(sleeperSlotKey("DEF"), "DST");
assert.equal(sleeperSlotKey("BN"), "BENCH");
assert.equal(sleeperSlotKey("NOPE"), "UNKNOWN");
assert.ok(Object.keys(ESPN_LINEUP_SLOT_ID_TO_SLOT_KEY).length >= 22);
assert.ok(Object.keys(SLEEPER_ROSTER_POSITION_TO_SLOT_KEY).length >= 16);

for (const table of [
  "player_catalog",
  "season_player_stats",
  "platform_sync_runs",
  "league_seasons",
  "league_team_history",
  "league_schedule_history",
  "player_ownership_history",
]) {
  assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`), `${table}: table exists`);
  assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`), `${table}: RLS enabled`);
}

assert.match(sql, /primary key \(schedule_id, season, week, league_team_id, provider_player_id\)/);
assert.match(sql, /constraint season_player_stats_week_owner_uidx unique \(schedule_id, season, week, canonical_player_id\)/);
assert.match(sql, /primary key \(league_season_id, week, canonical_player_id\)/);
assert.match(sql, /create unique index if not exists player_catalog_gsis_uidx/);
assert.match(sql, /create unique index if not exists player_catalog_sleeper_uidx/);
assert.match(sql, /create unique index if not exists player_catalog_espn_uidx/);
assert.match(sql, /source_payload_hash text not null/);
assert.match(sql, /league_team_id text not null/);
assert.match(sql, /provider_roster_id text not null/);
assert.match(sql, /provider_player_id text not null/);
assert.match(sql, /canonical_player_id text not null references public\.player_catalog \(id\)/);
assert.match(sql, /week integer not null check \(week between 1 and 18\)/);
assert.match(sql, /season integer not null check \(season between 2017 and 2200\)/);

const baseStat = {
  scheduleId: "schedule-1",
  provider: "sleeper",
  providerLeagueId: "league-1",
  season: 2026,
  providerRosterId: "roster-a",
  providerPlayerId: "provider-player-1",
  canonicalPlayerId: "leagueweaver-player-1",
  points: 12.34,
  lineupStatus: "starter",
  starterIndex: 0,
  inferredSlot: "RB",
  slotConfidence: "inferred",
  isProvisional: true,
  syncedAt: "2026-09-10T12:00:00.000Z",
  sourcePayloadHash: "hash-a",
} satisfies Omit<PlayerWeekStat, "week" | "teamId">;

const weekOne = { ...baseStat, week: 1, teamId: "team-a" } satisfies PlayerWeekStat;
const weekTwo = { ...baseStat, week: 2, teamId: "team-b", providerRosterId: "roster-b", sourcePayloadHash: "hash-b" } satisfies PlayerWeekStat;
assert.equal(weekOne.teamId, "team-a");
assert.equal(weekTwo.teamId, "team-b");
assert.notEqual(playerWeekStatKey(weekOne), playerWeekStatKey(weekTwo));
assert.equal(playerWeekStatKey(weekOne), "schedule-1:2026:1:team-a:provider-player-1");

console.log("Player data matrix passed:");
console.log(`- SlotKey enum covers ${SLOT_KEYS.length} canonical slots, including ESPN HC=19`);
console.log("- migration 074 declares all DATA-1 tables, RLS, indexes, and week-scoped ownership keys");
console.log("- traded player sample keeps Week 1 owner team-a and Week 2 owner team-b");
