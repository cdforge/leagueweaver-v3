import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildEspnLeagueHistoryDraft, buildSleeperLeagueHistoryDraft, espnPublicUnreliableHistoryYears, type EspnHistorySeasonPayload, type SleeperHistorySeasonPayload } from "../lib/platform/history";
import type { EspnLeague } from "../lib/platform/espn";
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
const espnDraft = buildEspnLeagueHistoryDraft("22222222-2222-4222-8222-222222222222", [{
  league: JSON.parse(readFileSync(path.join(process.cwd(), "scripts", "fixtures", "provider", "espn-11593953", "league-week-1.json"), "utf8")) as EspnLeague,
}] satisfies EspnHistorySeasonPayload[]);
assert.deepEqual(draft.leagueSeasons.map((season) => season.season), [2022, 2021], "Sleeper history captures two prior-season chain rows");
assert.ok(draft.leagueSeasons.every((season) => season.regular_season_week_count != null), "Sleeper history stores regular-season week count");
assert.ok(draft.leagueSeasons.every((season) => season.playoff_settings.playoff_week_start != null), "Sleeper history stores playoff start metadata");
assert.equal(draft.leagueSeasons.length, 2, "league_seasons rows");
assert.equal(draft.teamHistory.length, 16, "league_team_history rows");
assert.equal(draft.scheduleHistory.length, 8, "league_schedule_history rows from two week-one matchup slates");
assert.ok(draft.ownershipHistory.length > 150, "player_ownership_history rows from public matchup player points");
assert.ok(draft.playerCatalog.length > 120, "player_catalog rows generated for ownership FK safety");
assert.deepEqual(draft.champions.map((champion) => `${champion.season}:${champion.wins}-${champion.losses}`), ["2022:14-4", "2021:17-1"], "past champions derived from final standings");
assert.deepEqual(espnDraft.leagueSeasons.map((season) => `${season.provider}:${season.provider_league_id}:${season.season}`), ["espn:11593953:2025"], "ESPN history captures the Prodigies vs Esteemed league season");
assert.ok(espnDraft.leagueSeasons[0].regular_season_week_count != null, "ESPN history stores regular-season matchup count");
assert.equal(espnDraft.teamHistory.length, 10, "ESPN history captures 10 league teams");
assert.ok(espnDraft.scheduleHistory.length > 0, "ESPN history captures matchup rows");
assert.ok(espnDraft.ownershipHistory.length > 100, "ESPN history captures player ownership rows from platform-scored entries");
assert.ok(espnDraft.ownershipHistory.some((row) => row.roster_status === "starter" && row.fantasy_points > 0), "ESPN history includes scored starters for MVT");

async function main() {
  assert.deepEqual(espnPublicUnreliableHistoryYears(2017), [2017], "ESPN public pre-2018 is flagged blocked/unreliable");
  assert.deepEqual(espnPublicUnreliableHistoryYears(2018), [2017], "ESPN public scan keeps 2017 blocked while allowing 2018+ queries");

  console.log("History matrix passed:");
  console.log("- Sleeper previous_league_id chain captured seasons: 2022, 2021");
  console.log(`- history rows: ${draft.leagueSeasons.length} league seasons, ${draft.teamHistory.length} teams, ${draft.scheduleHistory.length} games, ${draft.ownershipHistory.length} ownership rows`);
  console.log("- past champions row data: 2022 14-4, 2021 17-1");
  console.log("- ESPN public 2017 flagged blocked/unreliable");
  console.log(`- ESPN 11593953 history rows: ${espnDraft.teamHistory.length} teams, ${espnDraft.scheduleHistory.length} games, ${espnDraft.ownershipHistory.length} ownership rows`);
}

void main();
