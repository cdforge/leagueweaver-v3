import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { deriveEspnTemplates, deriveSleeperTemplates, type LineupTemplate, type RosterTemplate } from "../lib/playerData";

const fixtureRoot = path.join(process.cwd(), "scripts", "fixtures", "provider");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(fixtureRoot, relativePath), "utf8")) as T;
}

function labels(template: LineupTemplate | RosterTemplate) {
  return template.slots.map((slot) => slot.label ?? slot.slot);
}

function printTemplate(label: string, template: LineupTemplate | RosterTemplate) {
  console.log(`${label}: ${labels(template).join(" ")}`);
}

const sleeperIdpLeague = readJson<{
  season: string;
  roster_positions: string[];
  settings?: { taxi_slots?: number; best_ball?: number };
}>("sleeper-1180985894268776448/league.json");
const sleeperIdp = deriveSleeperTemplates({
  season: Number(sleeperIdpLeague.season),
  rosterPositions: sleeperIdpLeague.roster_positions,
  taxiSlots: sleeperIdpLeague.settings?.taxi_slots,
});
assert.deepEqual(labels(sleeperIdp.lineupTemplate), [
  "QB",
  "RB1", "RB2",
  "WR1", "WR2", "WR3",
  "TE",
  "FLEX",
  "RB_WR_FLEX",
  "WR_TE_FLEX",
  "DL1", "DL2", "DL3",
  "LB1", "LB2", "LB3", "LB4",
  "DB1", "DB2", "DB3",
]);
assert.equal(sleeperIdp.lineupTemplate.slots.every((slot) => slot.confidence === "inferred"), true, "Sleeper starter template slots are inferred");
assert.equal(sleeperIdp.rosterTemplate.slots.filter((slot) => slot.group === "bench").length, 20, "Sleeper IDP bench count preserved");
assert.equal(sleeperIdp.rosterTemplate.slots.filter((slot) => slot.group === "taxi").length, 5, "Sleeper IDP taxi slots preserved");
assert.equal(sleeperIdp.rosterTemplate.slots.filter((slot) => slot.group === "taxi").every((slot) => slot.confidence === "inferred"), true, "Sleeper taxi slots are inferred");

const espn1305 = readJson<{
  seasonId: number;
  settings?: { rosterSettings?: { lineupSlotCounts?: Record<string, number> } };
}>("espn-1305/league-settings.json");
const espnSuperflex = deriveEspnTemplates({
  season: espn1305.seasonId,
  lineupSlotCounts: espn1305.settings?.rosterSettings?.lineupSlotCounts ?? {},
});
assert.deepEqual(labels(espnSuperflex.lineupTemplate), [
  "QB",
  "RB1", "RB2", "RB3",
  "WR1", "WR2", "WR3",
  "TE",
  "SUPERFLEX",
  "FLEX",
]);
assert.equal(espnSuperflex.lineupTemplate.slots.some((slot) => slot.slot === "K"), false, "ESPN 1305 has no K award slot");
assert.equal(espnSuperflex.lineupTemplate.slots.some((slot) => slot.slot === "DST"), false, "ESPN 1305 has no DST award slot");
assert.equal(espnSuperflex.lineupTemplate.slots.every((slot) => slot.confidence === "confirmed"), true, "ESPN template slots are confirmed");
assert.equal(espnSuperflex.rosterTemplate.slots.filter((slot) => slot.group === "bench").length, 15, "ESPN 1305 bench count preserved");
assert.equal(espnSuperflex.rosterTemplate.slots.filter((slot) => slot.group === "ir").length, 4, "ESPN 1305 IR count preserved");

const espnHc = readJson<{
  seasonId: number;
  settings?: { rosterSettings?: { lineupSlotCounts?: Record<string, number> } };
}>("espn-11593953/league-week-1.json");
const espnHcTemplate = deriveEspnTemplates({
  season: espnHc.seasonId,
  lineupSlotCounts: espnHc.settings?.rosterSettings?.lineupSlotCounts ?? {},
});
assert.ok(espnHcTemplate.lineupTemplate.slots.some((slot) => slot.slot === "HC" && slot.rawSlot === 19), "ESPN HC slot 19 is a starter template slot");

const sleeperInferredEdge = deriveSleeperTemplates({
  season: 2025,
  rosterPositions: ["QB", "RB", "BN", "IR"],
  taxiSlots: 1,
});
assert.equal(sleeperInferredEdge.rosterTemplate.slots.every((slot) => slot.confidence === "inferred"), true, "Sleeper best-ball/taxi/co-owner edge slots stay inferred until validated");

console.log("Lineup template matrix passed:");
printTemplate("- Sleeper 1180985894268776448 IDP lineup", sleeperIdp.lineupTemplate);
printTemplate("- Sleeper 1180985894268776448 roster", sleeperIdp.rosterTemplate);
printTemplate("- ESPN 1305 Superflex/no-K-DST lineup", espnSuperflex.lineupTemplate);
printTemplate("- ESPN 1305 roster", espnSuperflex.rosterTemplate);
printTemplate("- ESPN 11593953 HC lineup", espnHcTemplate.lineupTemplate);
