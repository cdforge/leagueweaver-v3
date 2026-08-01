import assert from "node:assert/strict";
import { autoMatchTeams, MATCH_THRESHOLDS, type MappableTeam, type MappingCandidate } from "../lib/platform/matchTeams";

// ── Exact + fuzzy names, manager-carried matches ──────────────────────────────
// A hand-built league whose names range from identical to reworded, plus one
// extra roster the commissioner's league doesn't have.
const teams: MappableTeam[] = [
  { id: "t1", name: "Sunday Architects", city: "Brooklyn", manager: "Anthony" },
  { id: "t2", name: "Fourth & Forever", city: "Chicago", manager: "Riley" },
  { id: "t3", name: "Red Zone Society", city: "Seattle", manager: "Morgan" },
];
const candidates: MappingCandidate[] = [
  { providerId: "sleeper-99-1", name: "Sunday Architects", city: "Brooklyn", manager: "Anthony" },
  { providerId: "sleeper-99-2", name: "4th and Forever", city: "Chicago", manager: "Riley" },   // reworded name, exact owner
  { providerId: "sleeper-99-3", name: "Redzone Society", city: "Seattle", manager: "Morgan" },  // spelling drift, exact owner
  { providerId: "sleeper-99-4", name: "Waiver Wire Works", city: "Denver", manager: "Jordan" }, // extra roster, no team
];
const matched = autoMatchTeams(teams, candidates);
const byTeam = new Map(matched.map((row) => [row.leagueTeamId, row]));

assert.equal(byTeam.get("t1")!.providerId, "sleeper-99-1");
assert.equal(byTeam.get("t1")!.confidence, "high");
assert.equal(byTeam.get("t2")!.providerId, "sleeper-99-2");
assert.equal(byTeam.get("t2")!.confidence, "high", "exact owner should lift a reworded name into the confident band");
assert.equal(byTeam.get("t3")!.providerId, "sleeper-99-3");
assert.equal(byTeam.get("t3")!.confidence, "high");
// Every mapped roster is distinct and the spare candidate is simply unused.
const usedProviderIds = matched.map((row) => row.providerId).filter(Boolean);
assert.equal(new Set(usedProviderIds).size, usedProviderIds.length, "no roster maps to two teams");
assert.ok(!usedProviderIds.includes("sleeper-99-4"));

// ── One-to-one guard: overlapping names disambiguated by owner ────────────────
// Both teams share the "Blitz" token; only the manager tells them apart. Neither
// should steal the other's roster.
const blitzTeams: MappableTeam[] = [
  { id: "a", name: "Blitz Department", manager: "Casey" },
  { id: "b", name: "Blitz Brigade", manager: "Sam" },
];
const blitzCandidates: MappingCandidate[] = [
  { providerId: "espn-7-1", name: "Blitz Department", manager: "Casey" },
  { providerId: "espn-7-2", name: "Blitz Brigade", manager: "Sam" },
];
const blitz = new Map(autoMatchTeams(blitzTeams, blitzCandidates).map((row) => [row.leagueTeamId, row]));
assert.equal(blitz.get("a")!.providerId, "espn-7-1");
assert.equal(blitz.get("b")!.providerId, "espn-7-2");

// ── Weak signal stays unmatched, not silently wrong ───────────────────────────
// Nothing in the candidate pool resembles this team, so it comes back blank for
// the commissioner rather than grabbing an unrelated roster.
const lonely = autoMatchTeams(
  [{ id: "solo", name: "Goal Line Guild", manager: "Quinn" }],
  [{ providerId: "espn-7-9", name: "Tide Turners", manager: "Devon" }],
);
assert.equal(lonely[0].providerId, null);
assert.equal(lonely[0].confidence, "none");
assert.equal(lonely[0].score, 0);

// ── Missing managers: falls back to name similarity alone ─────────────────────
const noManager = autoMatchTeams(
  [{ id: "n1", name: "Huddle House" }],
  [{ providerId: "sleeper-1-5", name: "Huddle House" }],
);
assert.equal(noManager[0].providerId, "sleeper-1-5");
assert.equal(noManager[0].confidence, "high");

// ── Determinism: identical input yields identical output ──────────────────────
assert.deepEqual(autoMatchTeams(teams, candidates), autoMatchTeams(teams, candidates));

// ── Thresholds are ordered as documented ──────────────────────────────────────
assert.ok(MATCH_THRESHOLDS.high > MATCH_THRESHOLDS.review);
assert.ok(MATCH_THRESHOLDS.review > 0);

console.log("team-mapping-matrix: all assertions passed");
