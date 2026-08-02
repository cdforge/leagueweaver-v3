import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  mergePlayerStatsForSync,
  providerBackoffDelayMs,
  shouldBackoffStatus,
  shouldRefreshPlayerStat,
  type ExistingPlayerStatSyncState,
} from "../lib/platform/playerSync";
import type { PlayerWeekStat } from "../lib/playerData";

function stat(points: number, hash = `hash-${points}`): PlayerWeekStat {
  return {
    scheduleId: "00000000-0000-4000-8000-000000000001",
    provider: "sleeper",
    providerLeagueId: "856201517630328832",
    season: 2025,
    week: 1,
    teamId: "team-a",
    providerRosterId: "1",
    providerPlayerId: "4046",
    canonicalPlayerId: "sleeper:4046",
    points,
    lineupStatus: "starter",
    starterIndex: 0,
    inferredSlot: "QB",
    rawSlot: "QB",
    slotConfidence: "inferred",
    isProvisional: true,
    syncedAt: "2026-09-09T12:00:00.000Z",
    sourcePayloadHash: hash,
  };
}

const firstSync = "2026-09-09T12:00:00.000Z";
const insideWindow = new Date("2026-09-11T12:00:00.000Z");
const afterWindow = new Date("2026-09-17T12:00:01.000Z");
const existing: ExistingPlayerStatSyncState = {
  scheduleId: "00000000-0000-4000-8000-000000000001",
  season: 2025,
  week: 1,
  teamId: "team-a",
  providerPlayerId: "4046",
  isProvisional: true,
  syncedAt: firstSync,
};

const corrected = mergePlayerStatsForSync([stat(36.9, "corrected")], [existing], insideWindow);
assert.equal(corrected.rows.length, 1, "correction inside finality window is written");
assert.equal(corrected.rows[0].points, 36.9, "correction inside window updates points");
assert.equal(corrected.rows[0].isProvisional, true, "correction inside window remains provisional");
assert.equal(corrected.rows[0].finalLockAt, undefined, "correction inside window does not lock");

const locked = mergePlayerStatsForSync([stat(37.9, "lock")], [existing], afterWindow);
assert.equal(locked.rows.length, 1, "day-7 sync writes the final row");
assert.equal(locked.rows[0].isProvisional, false, "day-7 sync clears provisional");
assert.equal(locked.rows[0].finalLockAt, afterWindow.toISOString(), "day-7 sync sets final lock");

const alreadyFinal = mergePlayerStatsForSync([stat(99.9, "late")], [{ ...existing, isProvisional: false, finalLockAt: afterWindow.toISOString() }], new Date("2026-09-18T12:00:00.000Z"));
assert.equal(alreadyFinal.rows.length, 0, "locked rows are not rewritten");
assert.equal(alreadyFinal.skippedFinal, 1, "locked rows are counted as skipped");

assert.equal(shouldRefreshPlayerStat(existing, new Date("2026-09-10T13:00:00.000Z")), true, "Thu AM correction re-fetch is eligible");
assert.equal(shouldRefreshPlayerStat({ ...existing, isProvisional: false, finalLockAt: afterWindow.toISOString() }, new Date("2026-09-18T12:00:00.000Z")), false, "final rows never re-fetch");
assert.equal(shouldBackoffStatus(429), true, "429 backs off");
assert.equal(shouldBackoffStatus(403), true, "403 backs off");
assert.equal(shouldBackoffStatus(503), true, "5xx backs off");
assert.equal(shouldBackoffStatus(404), false, "404 does not retry as rate/server backoff");
assert.equal(providerBackoffDelayMs(429, 1), 1000, "first retry delay");
assert.equal(providerBackoffDelayMs(503, 3), 4000, "exponential retry delay");

const cronRoute = readFileSync("app/api/cron/sync-scores/route.ts", "utf8");
assert.match(cronRoute, /computeScheduleScores\(schedule\)/, "cron still syncs scores first");
assert.match(cronRoute, /persistPlayerRows\(admin, link, schedule\)/, "cron attempts player rows after score upsert");
assert.match(cronRoute, /PLAYER_SYNC_DISABLED/, "cron has a player sync kill switch");
const manualRoute = readFileSync("app/api/platform/sync/scores/route.ts", "utf8");
assert.match(manualRoute, /await persistScores\(schedule, result\)/, "manual refresh persists scores before player sync");
assert.match(manualRoute, /playerSync: \{ rowsWritten: 0, failed: true \}/, "manual player failure returns warning without failing scores");
const catalogRoute = readFileSync("app/api/cron/sync-player-catalog/route.ts", "utf8");
assert.match(catalogRoute, /X-Fantasy-Filter/, "catalog route sends ESPN X-Fantasy-Filter");
assert.match(catalogRoute, /players: \{ limit: 2000 \}/, "catalog route limits ESPN catalog");
const sleeperModule = readFileSync("lib/platform/sleeper.ts", "utf8");
const espnModule = readFileSync("lib/platform/espn.ts", "utf8");
assert.match(sleeperModule, /fetchProviderJson/, "Sleeper fetches use provider backoff wrapper");
assert.match(espnModule, /fetchProviderJson/, "ESPN fetches use provider backoff wrapper");

console.log("Player sync matrix passed:");
console.log("- correction inside window updates provisional row: 36.90");
console.log("- day-7 sync locks final row and late correction is skipped");
console.log("- 429/403/5xx backoff registered; score sync remains isolated from player failures");
console.log("- catalog refresh is central and uses ESPN X-Fantasy-Filter limit 2000");
