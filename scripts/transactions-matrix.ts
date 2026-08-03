import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ESPN_TRANSACTION_TYPES,
  mapEspnTransactions,
  mapSleeperTransactions,
  summarizeTransactionCounts,
  type EspnTransactionPayload,
  type SleeperTransactionPayload,
} from "../lib/transactions";
import type { Team } from "../lib/types";

const fixtureRoot = path.join(process.cwd(), "scripts", "fixtures", "provider");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(fixtureRoot, relativePath), "utf8")) as T;
}

function providerTeams(provider: "espn" | "sleeper", leagueId: string, ids: number[]): Team[] {
  return ids.map((id, index) => ({
    id: `team-${id}`,
    providerId: `${provider}-${leagueId}-${id}`,
    city: "",
    name: `Team ${id}`,
    shortName: `T${id}`,
    manager: "",
    color: "#117a45",
    divisionId: "division-1",
    overallRank: index + 1,
    stadium: "",
  }));
}

const sleeperLeagueId = "856201517630328832";
const sleeperTransactions = readJson<SleeperTransactionPayload[]>(`sleeper-${sleeperLeagueId}/transactions-week-8.json`);
const sleeperRows = mapSleeperTransactions({
  providerLeagueId: sleeperLeagueId,
  week: 8,
  teams: providerTeams("sleeper", sleeperLeagueId, [1, 2, 3, 4, 5, 6, 7, 8]),
  transactions: sleeperTransactions,
});
const sleeperCounts = summarizeTransactionCounts(sleeperRows);
assert.equal(sleeperTransactions.length, 43, "Sleeper fixture has 43 raw week-8 transactions");
assert.equal(sleeperRows.length, 36, "Sleeper parser excludes failed transactions and maps completed team rows");
assert.deepEqual(sleeperCounts.map(({ providerRosterId, transactions, adds, drops, waivers, trades }) => ({ providerRosterId, transactions, adds, drops, waivers, trades })), [
  { providerRosterId: "1", transactions: 3, adds: 3, drops: 3, waivers: 3, trades: 0 },
  { providerRosterId: "3", transactions: 2, adds: 2, drops: 2, waivers: 2, trades: 0 },
  { providerRosterId: "4", transactions: 1, adds: 1, drops: 0, waivers: 1, trades: 0 },
  { providerRosterId: "6", transactions: 15, adds: 0, drops: 15, waivers: 0, trades: 0 },
  { providerRosterId: "7", transactions: 7, adds: 4, drops: 4, waivers: 7, trades: 0 },
  { providerRosterId: "8", transactions: 8, adds: 6, drops: 5, waivers: 8, trades: 0 },
]);

const espnLeagueId = "42654852";
const espnFixture = readJson<{ transactions?: EspnTransactionPayload[] }>(`espn-${espnLeagueId}/transactions-week-1.json`);
const espn = mapEspnTransactions({
  providerLeagueId: espnLeagueId,
  week: 1,
  teams: providerTeams("espn", espnLeagueId, [1, 2, 3, 4]),
  transactions: espnFixture.transactions,
});
assert.equal(espn.warnings.length, 0, "ESPN fixture uses known transaction enum values");
assert.ok(espn.rows.length > 0, "ESPN best-effort parser returns normalized rows");
assert.equal(ESPN_TRANSACTION_TYPES.includes("TRADED" as never), false, "ESPN enum never uses invalid TRADED type");

const unavailableEspn = mapEspnTransactions({
  providerLeagueId: espnLeagueId,
  week: 2,
  teams: providerTeams("espn", espnLeagueId, [1, 2, 3, 4]),
  transactions: undefined,
});
assert.deepEqual(unavailableEspn, { rows: [], warnings: [] }, "ESPN missing transactions degrade to empty rows");

console.log("Transactions matrix passed:");
console.log("- Sleeper 856201517630328832 week 8 counts:");
for (const row of sleeperCounts) {
  console.log(`  roster ${row.providerRosterId}: tx ${row.transactions}, adds ${row.adds}, drops ${row.drops}, waivers ${row.waivers}, trades ${row.trades}`);
}
console.log(`- ESPN 42654852 week 1 best-effort rows: ${espn.rows.length}`);
console.log("- ESPN missing/unavailable payload degrades to empty rows");
