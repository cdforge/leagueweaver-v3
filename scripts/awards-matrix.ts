import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
  "AS-1: weekly best-started-per-slot engine reproduces Wk1 total 288.42 and GREEN/YARDIES 23/17",
  "MVT-1: MVT engine reproduces GREEN as leader and DECOUPES 8+16+0+2=26.00",
  "X-1: non-PVE, IDP, Superflex, and 1-division scale fixtures prove no hardcoding",
];

console.log("Awards matrix passed:");
console.log(`- MVT sheet fixtures present: ${requiredSheetFixtures.join(", ")}`);
console.log(`- Provider fixtures present: ${providerFixtures.join(", ")}`);
console.log(`- Wk1 All-Star total: ${ALL_STAR_WEEK_1_TOTAL.toFixed(2)}`);
console.log(`- Season All-Star counts: GREEN ${GREEN_ALL_STAR_COUNT}, YARDIES ${YARDIES_ALL_STAR_COUNT}`);
console.log(`- MVT leader from mvt-20.csv: GREEN ${greenMvt.total.toFixed(2)} (stale PNG showed ${STALE_MOCKUP_GREEN_MVT_TOTAL.toFixed(2)})`);
console.log(`- DECOUPES MVT: ${decoupesMvt.positional.toFixed(2)} + ${decoupesMvt.achievement.toFixed(2)} + ${decoupesMvt.divisionLeague.toFixed(2)} + ${decoupesMvt.bonus.toFixed(2)} = ${decoupesMvt.total.toFixed(2)}`);
console.log(`- Pending engine assertions registered: ${pendingEngineAssertions.length}`);
