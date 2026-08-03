import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildSleeperLeagueHistoryDraft, espnPublicUnreliableHistoryYears, type SleeperHistorySeasonPayload } from "../lib/platform/history";
import type { SleeperLeague, SleeperMatchup, SleeperRoster, SleeperUser } from "../lib/platform/sleeper";

const root = path.join(process.cwd(), "scripts", "fixtures", "provider", "sleeper-history-856201517630328832");
const leagueIds = ["856201517630328832", "705887891657674752"];

function readJson<T>(leagueId: string, filename: string): T {
  return JSON.parse(readFileSync(path.join(root, leagueId, filename), "utf8")) as T;
}

const seasons: SleeperHistorySeasonPayload[] = leagueIds.map((leagueId) => ({
  league: readJson<SleeperLeague>(leagueId, "league.json"),
  rosters: readJson<SleeperRoster[]>(leagueId, "rosters.json"),
  users: readJson<SleeperUser[]>(leagueId, "users.json"),
  matchupsByWeek: { 1: readJson<SleeperMatchup[]>(leagueId, "matchups-week-1.json") },
}));

assert.equal(seasons[0].league.previous_league_id, seasons[1].league.league_id, "fixture follows Sleeper previous_league_id");

const draft = buildSleeperLeagueHistoryDraft("11111111-1111-4111-8111-111111111111", seasons);
assert.deepEqual(draft.leagueSeasons.map((season) => season.season), [2022, 2021], "Sleeper history captures two prior-season chain rows");
assert.equal(draft.leagueSeasons.length, 2, "league_seasons rows");
assert.equal(draft.teamHistory.length, 16, "league_team_history rows");
assert.equal(draft.scheduleHistory.length, 8, "league_schedule_history rows from two week-one matchup slates");
assert.ok(draft.ownershipHistory.length > 150, "player_ownership_history rows from public matchup player points");
assert.ok(draft.playerCatalog.length > 120, "player_catalog rows generated for ownership FK safety");
assert.deepEqual(draft.champions.map((champion) => `${champion.season}:${champion.wins}-${champion.losses}`), ["2022:14-4", "2021:17-1"], "past champions derived from final standings");

async function main() {
  assert.deepEqual(espnPublicUnreliableHistoryYears(2017), [2017], "ESPN public pre-2018 is flagged blocked/unreliable");
  assert.deepEqual(espnPublicUnreliableHistoryYears(2018), [2017], "ESPN public scan keeps 2017 blocked while allowing 2018+ queries");

  console.log("History matrix passed:");
  console.log("- Sleeper previous_league_id chain captured seasons: 2022, 2021");
  console.log(`- history rows: ${draft.leagueSeasons.length} league seasons, ${draft.teamHistory.length} teams, ${draft.scheduleHistory.length} games, ${draft.ownershipHistory.length} ownership rows`);
  console.log("- past champions row data: 2022 14-4, 2021 17-1");
  console.log("- ESPN public 2017 flagged blocked/unreliable");
}

void main();
