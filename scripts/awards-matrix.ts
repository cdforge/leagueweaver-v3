import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { buildAllStars } from "../lib/allStars";
import type { LineupTemplate, PlayerWeekStat, SlotKey } from "../lib/playerData";

type CsvRow = string[];

const fixtureRoot = path.join(process.cwd(), "scripts", "fixtures");
const sheetRoot = path.join(fixtureRoot, "mvt-sheet");
const providerRoot = path.join(fixtureRoot, "provider");

const ALL_STAR_WEEK_1_TOTAL = 288.42;
const GREEN_ALL_STAR_COUNT = 23;
const YARDIES_ALL_STAR_COUNT = 17;
const DECOUPES_MVT_TOTAL = 26;
const DECOUPES_MVT_BUCKETS = {
  positional: 8,
  achievement: 16,
  divisionLeague: 0,
  bonus: 2,
};
const STALE_MOCKUP_GREEN_MVT_TOTAL = 55.5;

function readFixture(relativePath: string) {
  const absolutePath = path.join(fixtureRoot, relativePath);
  assert.ok(existsSync(absolutePath), `fixture exists: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

function parseCsv(contents: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < contents.length; index += 1) {
    const char = contents[index];
    const next = contents[index + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        field += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function closeTo(actual: number | undefined, expected: number, label: string) {
  assert.ok(actual !== undefined, `${label} is present`);
  assert.equal(actual.toFixed(2), expected.toFixed(2), label);
}

function findNumberInRow(row: CsvRow, expected: number) {
  return row.map(toNumber).find((value) => value !== undefined && value.toFixed(2) === expected.toFixed(2));
}

function normalizeSheetSlot(value: string): SlotKey {
  if (value === "D/ST") return "DST";
  if (value === "RB/WR/TE") return "FLEX";
  return value as SlotKey;
}

function sheetSlotLabel(slot: SlotKey, rank: number, total: number) {
  if (slot === "DST") return "D/ST";
  return total > 1 ? `${slot} ${rank}` : slot;
}

function buildSheetLineupTemplate(rows: CsvRow[]): LineupTemplate {
  const boardRows = rows.filter((row) => row[5]?.trim() === "WEEK 1" && row[8]?.trim() && row[9]?.trim() && row[9]?.trim() !== "TOTAL");
  assert.ok(boardRows.length, "All-Star sheet has Week 1 board rows");
  return {
    provider: "espn",
    season: 2025,
    slots: boardRows.map((row, index) => {
      const slot = normalizeSheetSlot(row[8]?.trim() ?? "UNKNOWN");
      const rank = toNumber(row[7]) ?? 1;
      return {
        slot,
        index,
        rank,
        rawSlot: row[8]?.trim(),
        label: row[9]?.trim() || sheetSlotLabel(slot, rank, 1),
        group: "starter",
        confidence: "confirmed",
      };
    }),
  };
}

function buildSheetPlayerStats(rows: CsvRow[], lineupTemplate: LineupTemplate): PlayerWeekStat[] {
  const stats: PlayerWeekStat[] = [];
  const templateBySlotRank = new Map<string, number>();
  for (const slot of lineupTemplate.slots) {
    templateBySlotRank.set(`${slot.slot}:${slot.rank ?? 1}`, slot.index);
  }
  const seenByTeamWeekSlot = new Map<string, number>();
  for (const row of rows) {
    const team = row[1]?.trim();
    const rawSlot = row[2]?.trim();
    const player = row[3]?.trim();
    const score = toNumber(row[4]);
    const weekMatch = row[5]?.trim().match(/^WEEK\s+(\d+)$/);
    if (!team || !rawSlot || !player || score === undefined || !weekMatch) continue;
    const week = Number(weekMatch[1]);
    const normalizedSlot = normalizeSheetSlot(rawSlot);
    const seenKey = `${team}:${week}:${normalizedSlot}`;
    const rank = (seenByTeamWeekSlot.get(seenKey) ?? 0) + 1;
    seenByTeamWeekSlot.set(seenKey, rank);
    const starterIndex = templateBySlotRank.get(`${normalizedSlot}:${rank}`);
    if (starterIndex == null) continue;
    const templateSlot = lineupTemplate.slots[starterIndex];
    const slot = templateSlot?.slot ?? normalizedSlot;
    stats.push({
      scheduleId: "mvt-sheet-all-stars",
      provider: "espn",
      providerLeagueId: "mvt-sheet",
      season: lineupTemplate.season,
      week,
      teamId: team,
      providerRosterId: team,
      providerPlayerId: `${team}:${week}:${starterIndex}:${player}`,
      canonicalPlayerId: `${team}:${player}`,
      points: score,
      lineupStatus: "starter",
      starterIndex,
      inferredSlot: slot,
      rawSlot,
      slotConfidence: "confirmed",
      isProvisional: false,
      finalLockAt: "2026-08-02T00:00:00.000Z",
      syncedAt: "2026-08-02T00:00:00.000Z",
      sourcePayloadHash: "mvt-sheet",
    });
  }
  return stats;
}

function assertIncludesWinner(slot: { winners: Array<{ teamId: string; canonicalPlayerId: string; points: number }> } | undefined, team: string, player: string, score: number, label: string) {
  assert.ok(slot, `${label} slot exists`);
  const winner = slot.winners.find((row) => row.teamId === team && row.canonicalPlayerId.endsWith(`:${player}`));
  assert.ok(winner, `${label} winner ${team} ${player}`);
  closeTo(winner.points, score, `${label} score`);
}

const requiredSheetFixtures = [
  "mvt-source.xlsx",
  "mvt-20.csv",
  "all-stars.csv",
  "mvt-scoring.csv",
  "league-standings.csv",
  "settings.csv",
  "weekly-scores.csv",
];

for (const fixture of requiredSheetFixtures) {
  assert.ok(existsSync(path.join(sheetRoot, fixture)), `MVT sheet fixture exists: ${fixture}`);
}

const allStarRows = parseCsv(readFixture("mvt-sheet/all-stars.csv"));
const mvtRows = parseCsv(readFixture("mvt-sheet/mvt-20.csv"));

const totalRow = allStarRows.find((row) => row.includes("TOTAL"));
closeTo(findNumberInRow(totalRow ?? [], ALL_STAR_WEEK_1_TOTAL), ALL_STAR_WEEK_1_TOTAL, "Wk1 All-Star total from all-stars.csv");

const allStarCounts = new Map<string, number>();
for (const row of allStarRows) {
  const team = row[54]?.trim();
  const count = toNumber(row[55]);
  if (team && count !== undefined) {
    allStarCounts.set(team, count);
  }
}
assert.equal(allStarCounts.get("GREEN"), GREEN_ALL_STAR_COUNT, "GREEN All-Star count");
assert.equal(allStarCounts.get("YARDIES"), YARDIES_ALL_STAR_COUNT, "YARDIES All-Star count");

const sheetLineupTemplate = buildSheetLineupTemplate(allStarRows);
const sheetAllStars = buildAllStars({
  lineupTemplate: sheetLineupTemplate,
  stats: buildSheetPlayerStats(allStarRows, sheetLineupTemplate),
});
const sheetWeek1 = sheetAllStars.weeks.find((week) => week.week === 1);
closeTo(sheetWeek1?.total, ALL_STAR_WEEK_1_TOTAL, "AS-1 engine Wk1 All-Star total");
assert.equal(sheetAllStars.seasonCountByTeam.get("GREEN"), GREEN_ALL_STAR_COUNT, "AS-1 engine GREEN season All-Star count");
assert.equal(sheetAllStars.seasonCountByTeam.get("YARDIES"), YARDIES_ALL_STAR_COUNT, "AS-1 engine YARDIES season All-Star count");
assertIncludesWinner(sheetWeek1?.slots.find((slot) => slot.slotLabel === "QB"), "EAGLES", "J. ALLEN", 49.16, "Wk1 QB");
assertIncludesWinner(sheetWeek1?.slots.find((slot) => slot.slotLabel === "RB 1"), "YARDIES", "D. HENRY", 32, "Wk1 RB1");
assertIncludesWinner(sheetWeek1?.slots.find((slot) => slot.slotLabel === "RB 2"), "GREEN", "B. ROBINSON", 26.6, "Wk1 RB2");
assertIncludesWinner(sheetWeek1?.slots.find((slot) => slot.slotLabel === "WR 1"), "YARDIES", "Z. FLOWERS", 29.3, "Wk1 WR1");
assertIncludesWinner(sheetWeek1?.slots.find((slot) => slot.slotLabel === "FLEX"), "MUTTS", "J. COOK", 22.5, "Wk1 FLEX");
assertIncludesWinner(sheetWeek1?.slots.find((slot) => slot.slotLabel === "D/ST"), "EAGLES", "DEN D/ST", 31.86, "Wk1 DST");
assert.equal(sheetWeek1?.slots.some((slot) => slot.slotLabel === "RB 3"), false, "empty started slot is omitted");

const edgeLineupTemplate: LineupTemplate = {
  provider: "sleeper",
  season: 2025,
  slots: [
    { slot: "QB", index: 0, rank: 1, label: "QB", group: "starter", confidence: "inferred" },
    { slot: "DL", index: 1, rank: 1, label: "DL1", group: "starter", confidence: "inferred" },
    { slot: "DL", index: 2, rank: 2, label: "DL2", group: "starter", confidence: "inferred" },
    { slot: "FLEX", index: 3, rank: 1, label: "FLEX", group: "starter", confidence: "inferred" },
    { slot: "LB", index: 4, rank: 1, label: "LB1", group: "starter", confidence: "inferred" },
  ],
};
function edgeStat(teamId: string, providerPlayerId: string, points: number, starterIndex: number, slot: SlotKey, lineupStatus: PlayerWeekStat["lineupStatus"] = "starter"): PlayerWeekStat {
  return {
    scheduleId: "as-1-idp-edge",
    provider: "sleeper",
    providerLeagueId: "edge",
    season: 2025,
    week: 1,
    teamId,
    providerRosterId: teamId,
    providerPlayerId,
    canonicalPlayerId: providerPlayerId,
    points,
    lineupStatus,
    starterIndex: lineupStatus === "starter" ? starterIndex : undefined,
    inferredSlot: lineupStatus === "starter" ? slot : "BENCH",
    rawSlot: slot,
    slotConfidence: lineupStatus === "starter" ? "inferred" : "bench",
    isProvisional: false,
    syncedAt: "2026-08-02T00:00:00.000Z",
    sourcePayloadHash: "as-1-edge",
  };
}
const edgeAllStars = buildAllStars({
  lineupTemplate: edgeLineupTemplate,
  stats: [
    edgeStat("team-a", "a-qb", 18, 0, "QB"),
    edgeStat("team-b", "b-qb", 18, 0, "QB"),
    edgeStat("team-c", "c-bench-qb", 99, 0, "QB", "bench"),
    edgeStat("team-a", "a-dl1", 7, 1, "DL"),
    edgeStat("team-b", "b-dl1", 8, 1, "DL"),
    edgeStat("team-a", "a-dl2", 20, 2, "DL"),
    edgeStat("team-b", "b-dl2", 9, 2, "DL"),
    edgeStat("team-a", "a-flex", 11, 3, "FLEX"),
    edgeStat("team-b", "b-flex", 12, 3, "FLEX"),
  ],
  completedWeeks: [1],
});
const edgeWeek1 = edgeAllStars.weeks[0];
assert.equal(edgeWeek1.slots.find((slot) => slot.slotLabel === "QB")?.winners.length, 2, "inclusive ties share the QB accolade");
assert.equal(edgeWeek1.slots.find((slot) => slot.slotLabel === "DL1")?.winners[0]?.providerPlayerId, "a-dl2", "IDP duplicate slots rank started DL players by score");
assert.equal(edgeWeek1.slots.find((slot) => slot.slotLabel === "DL2")?.winners[0]?.providerPlayerId, "b-dl2", "IDP DL2 uses the next ranked started DL");
assert.equal(edgeWeek1.slots.find((slot) => slot.slotLabel === "FLEX")?.winners[0]?.providerPlayerId, "b-flex", "FLEX all-star uses FLEX occupancy");
assert.equal(edgeWeek1.slots.some((slot) => slot.slotLabel === "LB1"), false, "empty IDP slot is omitted");
assert.equal(edgeAllStars.seasonCountByTeam.get("team-a"), 2, "tie winners count once per winning slot");
assert.equal(edgeAllStars.seasonCountByTeam.get("team-b"), 3, "season count includes shared accolades");

const mvtByTeam = new Map<string, { total: number; positional: number; achievement: number; divisionLeague: number; bonus: number }>();
for (const row of mvtRows) {
  const team = row[37]?.trim();
  const total = toNumber(row[38]);
  const positional = toNumber(row[39]);
  const achievement = toNumber(row[40]);
  const divisionLeague = toNumber(row[41]);
  const bonus = toNumber(row[42]);
  if (!team || total === undefined || positional === undefined || achievement === undefined || divisionLeague === undefined || bonus === undefined) continue;
  mvtByTeam.set(team, {
    total,
    positional,
    achievement,
    divisionLeague,
    bonus,
  });
}

const greenMvt = mvtByTeam.get("GREEN");
assert.ok(greenMvt, "GREEN MVT row exists");
const mvtLeader = [...mvtByTeam.entries()].sort(([, left], [, right]) => right.total - left.total)[0];
assert.equal(mvtLeader[0], "GREEN", "GREEN tops the MVT leaderboard");
assert.ok(greenMvt.total !== STALE_MOCKUP_GREEN_MVT_TOTAL, "GREEN MVT total comes from mvt-20.csv, not the stale PNG mockup");

const decoupesMvt = mvtByTeam.get("DECOUPES");
assert.ok(decoupesMvt, "DECOUPES MVT row exists");
closeTo(decoupesMvt.total, DECOUPES_MVT_TOTAL, "DECOUPES MVT total");
closeTo(decoupesMvt.positional, DECOUPES_MVT_BUCKETS.positional, "DECOUPES positional bucket");
closeTo(decoupesMvt.achievement, DECOUPES_MVT_BUCKETS.achievement, "DECOUPES achievement bucket");
closeTo(decoupesMvt.divisionLeague, DECOUPES_MVT_BUCKETS.divisionLeague, "DECOUPES div/league bucket");
closeTo(decoupesMvt.bonus, DECOUPES_MVT_BUCKETS.bonus, "DECOUPES bonus bucket");

const providerFixtures = [
  "sleeper-856201517630328832/league.json",
  "sleeper-856201517630328832/rosters.json",
  "sleeper-856201517630328832/matchups-week-1.json",
  "espn-42654852/league-week-1.json",
  "espn-11593953/league-week-1.json",
];

for (const fixture of providerFixtures) {
  const absolutePath = path.join(providerRoot, fixture);
  assert.ok(existsSync(absolutePath), `provider fixture exists: ${fixture}`);
  JSON.parse(readFileSync(absolutePath, "utf8"));
}

const pendingEngineAssertions = [
  "MVT-1: MVT engine reproduces GREEN as leader and DECOUPES 8+16+0+2=26.00",
  "X-1: non-PVE, IDP, Superflex, and 1-division scale fixtures prove no hardcoding",
];

console.log("Awards matrix passed:");
console.log(`- MVT sheet fixtures present: ${requiredSheetFixtures.join(", ")}`);
console.log(`- Provider fixtures present: ${providerFixtures.join(", ")}`);
console.log(`- Wk1 All-Star total: ${ALL_STAR_WEEK_1_TOTAL.toFixed(2)}`);
console.log(`- Season All-Star counts: GREEN ${GREEN_ALL_STAR_COUNT}, YARDIES ${YARDIES_ALL_STAR_COUNT}`);
console.log(`- AS-1 engine: Wk1 total ${sheetWeek1?.total.toFixed(2)}, GREEN ${sheetAllStars.seasonCountByTeam.get("GREEN")}, YARDIES ${sheetAllStars.seasonCountByTeam.get("YARDIES")}`);
console.log("- AS-1 edge cases: inclusive tie, FLEX occupancy, empty slot omission, and IDP DL slots passed");
console.log(`- MVT leader from mvt-20.csv: GREEN ${greenMvt.total.toFixed(2)} (stale PNG showed ${STALE_MOCKUP_GREEN_MVT_TOTAL.toFixed(2)})`);
console.log(`- DECOUPES MVT: ${decoupesMvt.positional.toFixed(2)} + ${decoupesMvt.achievement.toFixed(2)} + ${decoupesMvt.divisionLeague.toFixed(2)} + ${decoupesMvt.bonus.toFixed(2)} = ${decoupesMvt.total.toFixed(2)}`);
console.log(`- Pending engine assertions registered: ${pendingEngineAssertions.length}`);
