# ESPN + Sleeper Data Collection Research

Summary: The two-tier model is still the right shape: one shared player identity catalog plus per-league scored-week caches. Sleeper is the lower-risk provider because it has official read-only docs, no auth requirement, documented request etiquette, stable league traversal through `previous_league_id`, and a direct weekly matchup endpoint. ESPN is the higher-risk provider because it is unofficial, undocumented, and has changed endpoint behavior before. The biggest implementation change from the original plan is score finality: ESPN says NFL stat corrections can land up to 7 days after a game, so "cache once and never re-fetch" is too aggressive unless the cache is written only after a late correction window.

## 1. ESPN Unofficial API Rate Limits At Scale

Finding: **ANECDOTAL.** I found no official ESPN Fantasy API rate limit. Community guidance says ESPN has tolerated roughly 60 requests/minute in personal use, but that is not a scale guarantee and says nothing about shared serverless IPs. Public ESPN API docs in community repos warn that excessive requests may be blocked and recommend caching/error handling. For Vercel/serverless, assume IP reputation can be shared and bursty; use a global queue, low concurrency, jitter, exponential backoff on 429/403/5xx, and circuit breakers per host.

- https://www.reddit.com/r/fantasyfootballcoding/comments/1j9b6e8/what_are_the_current_api_rate_limits_for_yahoo/
- https://github.com/pseudo-r/Public-ESPN-API
- https://dev.to/zuplo/unlocking-espns-hidden-api-a-developers-guide-1pp7
- https://ffscrapr.ffverse.com/articles/espn_getendpoint.html
- https://www.reddit.com/r/fantasyfootballcoding/comments/1uyi77k/what_free_resources_are_everyone_using/

## 2. ESPN X-Fantasy-Filter For /players Catalog

Finding: **CONFIRMED.** Header shape is endpoint-specific. For the global `/players` endpoint, the working active-player filter is `{"players":{"limit":2000},"filterActive":{"value":true}}` or the smaller `{"filterActive":{"value":true}}`. Live validation on 2026-08-01 against 2025 returned 2,725 active player/coach/DST rows with either filter, so `filterActive` is the required trim and `players.limit` is not a complete pagination solution by itself. For league player views such as `kona_player_info`, working examples nest under `players`, such as `{"players":{"filterSlotIds":{"value":[0]},"limit":42,"offset":0,"sortPercOwned":{"sortPriority":4,"sortAsc":false}}}`. This explains why a naive `{"players":{"limit":N}}` may be ignored or insufficient against `/seasons/{year}/players`: the global catalog needs top-level `filterActive`; league player tables need nested `players` filters.

Useful candidate filters:

```json
{"players":{"limit":2000},"filterActive":{"value":true}}
```

```json
{
  "players": {
    "limit": 1500,
    "offset": 0,
    "sortDraftRanks": {
      "sortPriority": 100,
      "sortAsc": true,
      "value": "STANDARD"
    }
  }
}
```

```json
{
  "players": {
    "filterStatus": {"value": ["FREEAGENT", "WAIVERS"]},
    "filterSlotIds": {"value": [0, 2, 4, 6, 16, 17, 23]},
    "sortPercOwned": {"sortPriority": 2, "sortAsc": false},
    "limit": 300
  }
}
```

- https://github.com/cwendt94/espn-api/blob/master/espn_api/requests/espn_requests.py
- https://www.reddit.com/r/fantasyfootball/comments/im6mui/espn_api_question/
- https://ffscrapr.ffverse.com/articles/espn_getendpoint.html
- https://thomaswildetech.com/projects/espn/player-info-json-views/
- https://www.semaphorepartners.com/post/when-apis-dont-exist-we-make-our-own-a-fantasy-football-data-integration-story
- https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c
- https://github.com/nntrn/espn-wiki/blob/main/espn-api.md
- https://github.com/FantasyFootballAnalytics/ffanalytics/blob/master/R/adp_functions.R

## 3. ESPN Endpoint Stability And History

Finding: **CONFIRMED that endpoints have changed; ANECDOTAL for purge/history behavior.** ESPN Fantasy moved from older v2-style routes to v3 around 2019, breaking wrappers. Current common endpoints are `lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{season}/segments/0/leagues/{leagueId}` for 2018+ and `.../leagueHistory/{leagueId}?seasonId={season}` for older seasons. Recent community reports say unauthenticated access to 2017-and-earlier history became restricted or returned "league not found"; fflr now warns that historical data access changed and may require an `espn_s2` cookie. Because LeagueWeaver is public-only/no-cookie, treat older ESPN history as not reliable for import.

- https://github.com/mkreiser/ESPN-Fantasy-Football-API/issues/95
- https://github.com/rbarton65/espnff/issues/59
- https://ffscrapr.ffverse.com/articles/espn_getendpoint.html
- https://k5cents.github.io/fflr/
- https://www.reddit.com/r/fantasyfootballcoding/comments/1lrom9f/espn_fantasy_football_api_seasons_2018_and/
- https://github.com/cwendt94/espn-api/issues/650
- https://onyxmueller.net/2022/12/28/accessing-fantasy-football-data-through-espns-api/

## 4. ESPN Head Coach Scoring

Finding: **CONFIRMED.** `espn-api` maps lineup/slot id `19` to `HC`, and maps head-coach scoring stat ids 155-174 for team win/loss/tie, points scored, margin, and margin buckets. Live public ESPN catalog validation on 2026-08-01 against `seasons/2025/players?view=players_wl` with `X-Fantasy-Filter: {"players":{"limit":2000},"filterActive":{"value":true}}` returned coach entries such as `"Falcons Coach"` with negative ids, `defaultPositionId: 14`, and `eligibleSlots: [19,20,21]`. Implementation rule: identify HC by `eligibleSlots` containing `19` or roster `lineupSlotId === 19`; do not rely on `defaultPositionId === 19`.

- https://github.com/cwendt94/espn-api/blob/master/espn_api/football/constant.py
- https://support.espn.com/hc/en-us/articles/360000087791-Scoring-Settings
- https://support.espn.com/hc/en-us/articles/360003914032-Scoring-Formats
- https://www.reddit.com/r/fantasyfootball/comments/76fy3q/til_that_espn_has_scoring_settings_for_head/
- https://forums.footballguys.com/threads/head-coach-scoring-category-need-help.687770/
- https://fantasy.espn.com/apis/v3/games/ffl/seasons/2025/players?scoringPeriodId=0&view=players_wl

## 5. Stat Corrections And Immutability

Finding: **CONFIRMED.** ESPN explicitly says post-game NFL stat corrections can appear up to 7 days after the game. ESPN also says League Manager scoring settings can be changed midseason and retroactively update previous results; LM manual score adjustments can also change matchup scores. Sleeper exposes stat corrections in-app for starters, but I did not find an API endpoint for corrections. Therefore, caching a week 15 minutes after slate end and never re-fetching is not safe.

- https://support.espn.com/hc/en-us/articles/360000099732-Scoring-Stat-Corrections
- https://support.espn.com/hc/en-us/articles/360000087791-Scoring-Settings
- https://support.espn.com/hc/en-us/articles/360000069552-Stat-Corrections
- https://support.sleeper.com/en/articles/2441282-stat-corrections
- https://www.reddit.com/r/fantasyfootball/comments/pnf72i/stat_corrections_time_frame/

## 6. Detecting Public Vs Private Before Pulling

Finding: **CONFIRMED for ESPN public setting; PARTLY ANECDOTAL for error codes.** ESPN has an official setting named public viewability. Without auth, the reliable detection method is still to pull the public league endpoint and classify: `200` with expected `teams/settings/status` = public; `401`/`403` = private or denied; `404`, empty, or "league not found" = invalid/unavailable/history-restricted. Multiple wrapper docs say private leagues require cookies. I found a concrete 401 private-league access-denied report, but not a complete ESPN error-code contract.

- https://support.espn.com/hc/en-us/articles/47160849553940-Making-a-Private-League-Public-LM-Only
- https://onyxmueller.net/2022/12/28/accessing-fantasy-football-data-through-espns-api/
- https://www.dustysturner.com/post/espn-fantasy-football-v3-api-for-private-leagues-python-through-r/
- https://github.com/cwendt94/espn-api/issues/278
- https://espn-fantasy-football-api.s3-website.us-east-2.amazonaws.com/
- https://community.hubitat.com/t/release-espn-fantasy-football-integration/143555

## 7. Sleeper API Specifics

Finding: **CONFIRMED.** Sleeper’s official docs say the API is read-only, requires no token, and recommends staying under 1000 calls/minute to avoid IP blocking. The matchup endpoint returns one object per roster for a week. It includes `starters` as an ordered list, `players` as all players, and bench can be deduced by subtracting starters from players. Live validation on 2026-08-01 against public league `856201517630328832`, week 8, confirmed `players_points`, `starters_points`, `starters`, and `players` are present; `starters_points[0]` matched `players_points[starters[0]]`. A second pass against 10 public Sleeper 2025 leagues confirmed `starters.length` matched the count of non-bench roster positions for standard, IDP, multi-FLEX, Superflex, and one best-ball fixture. Sleeper still does not expose an explicit named lineup slot per started player in matchup data; community discussion says no easy way to identify Flex/IR slot. You can infer by comparing ordered `starters` to league `roster_positions`, but LeagueWeaver should keep this as `slotConfidence: "inferred"` because the official docs do not explicitly promise the index-to-slot contract. `/players/nfl` is a large catalog and official docs say it should be called sparingly, at most once per day. Projections exist through undocumented endpoints reported by community libraries and Reddit, but they are not part of the core official docs and should not be required for All-Stars or MVT.

Sleeper endpoints that matter for LeagueWeaver:

```text
GET /v1/league/{league_id}
GET /v1/league/{league_id}/rosters
GET /v1/league/{league_id}/users
GET /v1/league/{league_id}/matchups/{week}
GET /v1/league/{league_id}/transactions/{round}
GET /v1/players/nfl
```

Minimum weekly shape to persist:

```ts
type SleeperWeeklyPlayerRow = {
  platform: "sleeper";
  providerLeagueId: string;
  season: number;
  week: number;
  rosterId: number;
  playerId: string;
  points: number;
  isStarter: boolean;
  starterIndex: number | null;
  inferredSlot: string | null;
  slotConfidence: "confirmed" | "inferred" | "ambiguous" | "bench";
};
```

- https://docs.sleeper.com/
- https://www.reddit.com/r/SleeperApp/comments/xpp9s6/sleeper_api_lineup_slot/
- https://support.sleeper.com/en/articles/4172355-how-can-i-add-additional-roster-positions
- https://github.com/SwapnikKatkoori/sleeper-api-wrapper
- https://pkg.go.dev/github.com/lum8rjack/sleeper-go
- https://github.com/berkayk/sleeper-api-python
- https://ffscrapr.ffverse.com/articles/sleeper_getendpoint.html
- https://www.postman.com/api-reference-library/sleeper-fantasy-football/collection/42476947-e54d2c49-0e73-49d1-a728-51349c29a19d
- https://api.sleeper.app/v1/league/856201517630328832
- https://api.sleeper.app/v1/league/856201517630328832/matchups/8
- https://www.reddit.com/r/fantasyfootball/comments/zmnhpt/sleeper_api_for_daily_draft_rankings/

## 7A. Sleeper Implementation On LeagueWeaver

Finding: **CONFIRMED by current repo shape plus Sleeper docs.** LeagueWeaver already has the right entry point: `lib/platform/sleeper.ts` pulls `/league/{league_id}/matchups/{week}` today for team scores. The professional implementation is to add a parallel player-stat parser to the same provider layer, then persist rows into a new Supabase table instead of calculating awards directly from live API responses. The UI should only read LeagueWeaver-normalized data, never raw Sleeper payloads.

Recommended data flow:

```text
Connect Sleeper league
  -> save providerLeagueId + roster-to-LeagueWeaver team mapping
  -> cron or Refresh calls Sleeper matchups for current week
  -> normalize roster rows into season_player_stats
  -> compute All-Stars and MVT from cached rows
  -> show awards with sync status, source, and missing-data states
```

Recommended Supabase tables or table additions:

```text
player_catalog
- id
- canonical_name
- normalized_name
- position
- nfl_team
- gsis_id
- sleeper_id
- espn_id
- status
- updated_at

season_player_stats
- schedule_id
- provider
- provider_league_id
- season
- week
- league_team_id
- provider_roster_id
- provider_player_id
- canonical_player_id
- fantasy_points
- lineup_status
- starter_index
- inferred_slot
- slot_confidence
- is_provisional
- final_lock_at
- synced_at
- source_payload_hash

platform_sync_runs
- id
- provider
- schedule_id
- week
- status
- rows_written
- warnings
- started_at
- finished_at
```

UX guidance for the site:

- Put All-Stars and MVT behind a clear "Connect ESPN or Sleeper scores" empty state when no platform is connected.
- For Sleeper, show "Sleeper connected" with last synced time, week, and a small "Refresh" action in Settings and on awards pages.
- If player data exists but is still inside the correction window, label the week "Provisional" instead of "Final".
- If Sleeper slot inference is ambiguous, avoid strong copy like "started in FLEX"; use "started" or "inferred FLEX" only where we can show confidence.
- If a week is missing rows for one roster, show a calm data-quality notice and exclude only the incomplete rows. Do not fabricate award winners.
- Make the awards pages read from cached data so they load instantly and do not hammer Sleeper when users open the page.
- Keep the dense commissioner-workspace pattern from `SeasonWorkspace`: compact summary strip, week selector, desktop table, mobile card list, and practical empty states.

Engineering guidance:

- Keep `lib/platform/sleeper.ts` as the provider adapter and add a new function such as `mapSleeperPlayerStats(schedule, week)`.
- Reuse the existing `platformConnection` and `providerId` team mapping. Sleeper roster ids should continue to map to LeagueWeaver team ids through `sleeper-{leagueId}-{roster_id}`.
- Add provider-normalized types in `lib/types.ts` or a new `lib/platform/playerStats.ts` so ESPN and Sleeper feed one shared awards engine.
- Add cron logic alongside `sync-scores`, but do not block team-score sync if player-stat sync fails. Team scores are core; awards can show "updating".
- Store raw payload hashes and row counts for diagnostics, not full raw payloads by default. This keeps storage lean and avoids retaining extra data.
- Add a one-league manual Refresh path for users, but keep the scaled path batched by request budget and correction window.

- https://docs.sleeper.com/
- https://support.sleeper.com/en/articles/5486620-general-terms-of-use
- https://ffscrapr.ffverse.com/articles/sleeper_getendpoint.html
- https://github.com/ffverse/ffscrapr/blob/main/R/sleeper_transactions.R
- https://github.com/berkayk/sleeper-api-python
- https://github.com/SwapnikKatkoori/sleeper-api-wrapper
- https://github.com/lum8rjack/sleeper-go
- docs/ALL-STAR-AND-MVT-PRD.md
- docs/SPEC-connect-scores.md
- lib/platform/sleeper.ts
- app/api/cron/sync-scores/route.ts

## 7B. Roster Templates, IDP, And Position Coverage

Finding: **CONFIRMED.** LeagueWeaver must not hardcode the award universe to QB/RB/WR/TE/FLEX/DST/K/HC. Both platforms support flexible and defensive roster structures, and the user's league roster settings must drive collection and awards. ESPN support documents offensive slots such as QB, RB, WR, TE, WR/TE, FLEX, and OP/Superflex; ESPN support also documents defensive slots such as DT, DE, DL, LB, CB, S, DB, and DP. `espn-api` maps those slot ids as `8 DT`, `9 DE`, `10 LB`, `11 DL`, `12 CB`, `13 S`, `14 DB`, and `15 DP`. Sleeper exposes `roster_positions` directly on the league payload and Sleeper support documents available player positions QB, RB, WR, TE, K, DL, LB, and DB; community evidence confirms Sleeper IDP roster slots such as `DL`, `LB`, `DB`, and `IDP_FLEX`.

Implementation rule: **starting slots become award categories.** If a league starts 2 DL, 2 LB, 2 DB, and 2 IDP_FLEX, then All-Stars and MVT must include DL, LB, DB, and IDP_FLEX categories. If a league has no K, DST, HC, or IDP, those categories do not exist for that season. This avoids the wrong outcome where a league's defensive players score points but are invisible in awards.

Recommended normalized slot vocabulary:

```ts
type NormalizedLineupSlot =
  | "QB" | "TQB"
  | "RB" | "WR" | "TE"
  | "FLEX" | "WR_TE_FLEX" | "SUPERFLEX"
  | "DST" | "K" | "P" | "HC"
  | "DT" | "DE" | "DL" | "LB" | "CB" | "S" | "DB" | "IDP" | "IDP_FLEX"
  | "BENCH" | "IR" | "TAXI" | "UNKNOWN";
```

Provider mapping notes:

```text
ESPN
- 0 QB
- 1 TQB
- 2 RB
- 3 RB/WR
- 4 WR
- 5 WR/TE
- 6 TE
- 7 OP / Superflex
- 8 DT
- 9 DE
- 10 LB
- 11 DL
- 12 CB
- 13 S
- 14 DB
- 15 DP / defensive-player utility
- 16 D/ST
- 17 K
- 18 P
- 19 HC
- 20 Bench
- 21 IR
- 23 RB/WR/TE Flex

Sleeper
- Read `league.roster_positions` in order.
- Common offensive values include QB, RB, WR, TE, FLEX, REC_FLEX, SUPER_FLEX, BN, IR.
- Common defensive values include DL, LB, DB, IDP_FLEX.
- Treat unknown values as `UNKNOWN` but preserve the raw provider value.
```

All-Stars and MVT rules:

- Generate a full `RosterTemplate` from all roster slots, including starter slots, Bench, IR, Taxi, and Reserve. Use it for roster capacity checks, import validation, and history.
- Generate the award `LineupTemplate` from starting slots only. Exclude bench, IR, taxi, and reserve slots from All-Star/MVT positional awards.
- Preserve duplicate slot counts. Two LB slots means LB1 and LB2 awards for All-Stars.
- Preserve non-starter slot counts too. ESPN Bench is slot `20` and IR is slot `21`; Sleeper uses `BN`, `IR`, and may expose `taxi`/reserve arrays. These should be stored as normalized roster groups even when no player currently occupies every available spot.
- For exact slots like QB/RB/LB/DB, select players who actually started in that slot.
- For utility slots like FLEX, SUPERFLEX, OP, DP, or IDP_FLEX, select players who actually occupied that utility slot when the provider can tell us. If the provider only allows inference, mark `slotConfidence: "inferred"` and avoid overly certain UI copy.
- Add MVT positional awards for every normalized starting slot in that league's `LineupTemplate`, not just the example eight positions.
- Keep provider raw slot values and confidence so we can fix mappings without corrupting history.

- https://support.espn.com/hc/en-us/articles/115003939432-Roster-Slots-Offense
- https://support.espn.com/hc/en-us/articles/115003939192-Roster-Slots-Defense
- https://support.espn.com/hc/en-us/articles/115003849751-Position-Eligibility
- https://support.espn.com/hc/en-us/articles/115003862972-Fantasy-Football-Acronyms
- https://raw.githubusercontent.com/cwendt94/espn-api/master/espn_api/football/constant.py
- https://docs.sleeper.com/
- https://support.sleeper.com/en/articles/5992251-positional-designations-info-requests
- https://support.sleeper.com/en/articles/4172355-how-can-i-add-additional-roster-positions
- https://www.reddit.com/r/SleeperApp/comments/10db8af/will_sleeper_ever_adopt_individual_idp_positions/
- https://mydynastyvalues.com/idp-trends

## 8. Transactions For Most Trades And Waiver Wire Warrior

Finding: **CONFIRMED for Sleeper; PARTLY CONFIRMED for ESPN public-only.** Sleeper has documented weekly transactions via `/league/{league_id}/transactions/{round}` and returns free agents, waivers, and trades. Live validation on public Sleeper league `856201517630328832`, week 8, returned 43 transaction rows with `type`, `status`, `adds`, `drops`, `roster_ids`, `waiver_budget`, `created`, and `status_updated`. ESPN has `mTransactions2`; follow-up validation showed public no-cookie transaction rows can be returned by `view=mTransactions2&scoringPeriodId={week}` without an `X-Fantasy-Filter`. Public ESPN fixtures `42654852`, `11593953`, and `520992816` returned transaction arrays for selected 2025 scoring periods; examples included week 1 draft/roster activity and later-week transaction rows. Bad or unsupported `X-Fantasy-Filter` shapes can produce HTTP 400, so the safe implementation is: request one scoring period at a time, no custom filter first, then classify returned transaction `type` values locally. ESPN's accepted transaction type enum includes `DRAFT`, `TRADE_ACCEPT`, `WAIVER`, `TRADE_VETO`, `FUTURE_ROSTER`, `ROSTER`, `RETRO_ROSTER`, `TRADE_PROPOSAL`, `TRADE_UPHOLD`, `FREEAGENT`, `TRADE_DECLINE`, `WAIVER_ERROR`, and `TRADE_ERROR`; using non-enum strings such as `TRADED` returns a deserialization error. However, ffscrapr still marks ESPN transaction collection as requiring private/auth-cookie and cwendt94 issue reports show recent activity/history can fail, so LeagueWeaver should support Sleeper transaction awards first and keep ESPN transaction awards best-effort until validated in production telemetry.

- https://docs.sleeper.com/
- https://github.com/ffverse/ffscrapr/blob/main/R/sleeper_transactions.R
- https://github.com/ffverse/ffscrapr/blob/main/R/espn_transactions.R
- https://ffscrapr.ffverse.com/reference/ff_transactions.html
- https://github.com/cwendt94/espn-api/blob/master/espn_api/football/constant.py
- https://github.com/cwendt94/espn-api/blob/master/espn_api/football/activity.py
- https://github.com/cwendt94/espn-api/issues/71
- https://github.com/cwendt94/espn-api/issues/546
- https://github.com/cwendt94/espn-api/blob/master/espn_api/football/league.py
- https://api.sleeper.app/v1/league/856201517630328832/transactions/8

## 9. Cross-Platform Player Identity

Finding: **CONFIRMED that crosswalks exist; RECOMMENDED canonical key is internal.** nflverse/nflreadr exposes `ff_playerids` with `gsis_id`, `sleeper_id`, `espn_id`, `yahoo_id`, `pfr_id`, and more. The `mayscopeland/ffb_ids` repo also maps Sleeper, Yahoo, ESPN, CBS, NFL.com, FantasyPros, and Footballguys ids for fantasy-relevant players. Best LeagueWeaver approach: create an internal `leagueweaver_player_id`, store every platform id as aliases, and use `gsis_id` when available as the strongest football stat identity. Do not use name-only matching except as a reviewed fallback because suffixes, defense/team players, rookies, and name changes will cause collisions.

- https://cran.r-project.org/web/packages/nflreadr/vignettes/dictionary_ff_playerids.html
- https://nflreadr.nflverse.com/
- https://github.com/mayscopeland/ffb_ids
- https://www.reddit.com/r/fantasyfootball/comments/15n6k9f/do_you_ever_need_player_names_and_ids/
- https://ffscrapr.ffverse.com/

## 9A. League History And Future-Proof Data Collection

Finding: **CONFIRMED for Sleeper season traversal; PARTLY CONFIRMED for ESPN history.** It is beneficial to collect a small, normalized league-history layer now, as long as it stays read-only, public-only, and does not slow the MVP path. Sleeper makes this cleaner than ESPN because each league can expose `previous_league_id`, letting LeagueWeaver walk prior seasons in a controlled chain. ESPN has historical league endpoints, but public/no-cookie access is less reliable, especially for older seasons. For both providers, the right model is not "copy every provider field forever"; it is "snapshot the facts LeagueWeaver will need later."

Recommended history facts to collect:

```text
league_seasons
- id
- schedule_id
- provider
- provider_league_id
- previous_provider_league_id
- season
- league_name
- scoring_type
- roster_positions
- playoff_settings
- regular_season_week_count
- team_count
- synced_at

league_team_history
- league_season_id
- league_team_id
- provider_roster_id_or_team_id
- team_name
- manager_name
- division_id
- final_standing
- wins
- losses
- ties
- points_for
- points_against

league_schedule_history
- league_season_id
- week
- provider_matchup_id
- home_league_team_id
- away_league_team_id
- home_score
- away_score
- status
- final_lock_at

player_ownership_history
- league_season_id
- week
- canonical_player_id
- league_team_id
- provider_player_id
- nfl_team_at_time
- position_at_time
- roster_status
- lineup_slot
- fantasy_points
```

How this helps future site features:

- Team history pages: year-by-year records, points, standings finish, playoff finishes, and rivalry history.
- Player history pages: which fantasy team owned a player each week, where they started, how many points they scored, and awards earned.
- Franchise timelines: manager/team name changes, division changes, and connected platform history.
- Award archives: All-Stars by week, MVT by season, Most Trades, Waiver Wire Warrior, and future career/all-time leaderboards.
- Schedule import: provider schedules can become a reference layer that maps real platform matchups into LeagueWeaver without replacing the generated LeagueWeaver schedule unless the user chooses to sync it.

Schedule sync guidance:

- Keep LeagueWeaver's generated schedule as the app's primary schedule.
- Store the provider schedule separately as `provider_schedule_history`.
- Map provider rosters to LeagueWeaver teams using the existing provider-team mapping.
- If a provider matchup does not match the generated LeagueWeaver matchup, do not silently rewrite the schedule. Show a review state: "Platform schedule differs from LeagueWeaver schedule."
- Offer three future modes: `scores-only`, `compare-provider-schedule`, and `adopt-provider-schedule`. Start with `scores-only`.
- For historical imports, allow season-by-season sync. Do not pull every prior season automatically for every connected league.

Professional implementation rule: create a provider-normalized translation layer. ESPN and Sleeper fields should be translated into LeagueWeaver names before anything reaches the UI or awards engines. Store the original provider ids for traceability, but make LeagueWeaver's own values the source used by product features.

Example:

```ts
type NormalizedLineupSlot = "QB" | "RB" | "WR" | "TE" | "FLEX" | "SUPERFLEX" | "DST" | "K" | "HC" | "BENCH" | "IR" | "TAXI" | "UNKNOWN";

type ProviderMappedValue = {
  leagueWeaverValue: NormalizedLineupSlot;
  provider: "espn" | "sleeper";
  providerValue: string | number;
  confidence: "confirmed" | "inferred" | "unknown";
};
```

- https://docs.sleeper.com/
- https://ffscrapr.ffverse.com/articles/sleeper_getendpoint.html
- https://ffscrapr.ffverse.com/articles/espn_getendpoint.html
- https://k5cents.github.io/fflr/
- https://cran.r-project.org/web/packages/nflreadr/vignettes/dictionary_ff_playerids.html
- docs/SPEC-connect-scores.md
- docs/ALL-STAR-AND-MVT-PRD.md

## 9B. CSV / Manual History Import Beyond API Reach

Finding: **CONFIRMED for Sleeper no native export; PARTLY CONFIRMED for ESPN community exports; NOT A BYPASS for missing API history.** Sleeper support says there is no in-app export/download function and the only supported data path is the public API. Sleeper does have a mobile League History Editor, but it is manual entry only: commissioners can add seasons back to 1990, with Top 3, regular season standings, and notes; Sleeper explicitly says there is no automatic import/upload. That means Sleeper cannot provide a CSV that fills detailed player/team data beyond what its API exposes, though a user could manually enter summary history in Sleeper and then separately enter/import the same summaries into LeagueWeaver.

ESPN does not appear to have an official, complete "export all league history to CSV" product path for the detailed data LeagueWeaver needs. Community tools exist: an ESPN Excel/Power Query workbook exports league settings, matchups, teams, and members for a selected year, and `adamvaldez/ESPN_Extractor` outputs CSV/XLSX league-history rows such as owner, year, team name, wins/losses, final standing, points for/against, acquisitions, trades, drops, streak, and playoff seed. However, those tools still pull ESPN API/page data. If ESPN's public/no-cookie API cannot reach an old season, a CSV tool built on that API generally cannot recover it either.

Implementation guidance: LeagueWeaver should support **user-uploaded historical CSV** as a fallback, but treat it as a separate manual/history import source, not as platform-verified scored player data. This can fill older record-book facts such as champions, standings, team records, points for/against, playoff seed, trades/acquisitions counts, and notes. It should not unlock All-Stars/MVT player awards unless the upload includes week-by-week player rows with lineup slot, owning team, and league-scored fantasy points.

Recommended CSV import tiers:

```text
Tier 1: Season summary CSV
- season
- team_name
- manager_name
- wins
- losses
- ties
- points_for
- points_against
- final_standing
- playoff_seed
- champion_flag
- runner_up_flag
- notes

Tier 2: Weekly matchup CSV
- season
- week
- home_team
- away_team
- home_score
- away_score
- matchup_type

Tier 3: Weekly player CSV
- season
- week
- team_name
- player_name
- provider_player_id
- canonical_player_id
- nfl_team
- position
- lineup_slot
- roster_status
- fantasy_points
```

Product rule: expose this as "Import Old History CSV" or "Add Past Season," with a clear review step. Label imported rows as `source="csv_upload"` and `verification="user_provided"`. Keep platform API data as the higher-trust source. If a CSV conflicts with ESPN/Sleeper API data for the same season/week/team, show a review screen instead of silently overwriting.

- https://support.sleeper.com/en/articles/4172600-can-i-export-my-data-from-my-league
- https://support.sleeper.com/en/articles/5704241-adding-league-history-to-sleeper
- https://support.sleeper.com/en/articles/3204499-league-history-and-weekly-reports
- https://www.reddit.com/r/fantasyfootball/comments/1egqgej/export_your_espn_fantasy_history_to_excel_updated/
- https://github.com/adamvaldez/ESPN_Extractor
- https://www.leaguehistory.app/guides/how-to-see-sleeper-league-history
- https://fantasyhistorydata.com/how-to-access-and-export-fantasy-history-data/

## 10. ToS, Legal, And Rate Etiquette

Finding: **CONFIRMED that ESPN is unofficial; LEGAL specifics unresolved.** ESPN Fantasy endpoints are undocumented and not officially supported. Community API documentation says endpoints may change without notice and excessive requests may be blocked. Sleeper officially allows read-only API access without a token but warns to stay under 1000 calls/minute or risk IP blocking. For 100k leagues, LeagueWeaver should behave like a careful API client: identify itself with a stable User-Agent and contact email, cache aggressively, avoid private data, avoid browser-cookie collection, never sell raw copied data as a dataset, honor deletions/disconnects, and add kill switches if a platform starts returning blocks.

- https://github.com/pseudo-r/Public-ESPN-API
- https://dev.to/zuplo/unlocking-espns-hidden-api-a-developers-guide-1pp7
- https://docs.sleeper.com/
- https://support.sleeper.com/en/articles/5486620-general-terms-of-use
- https://www.espn.com/espn/story/_/id/29124657/terms-conditions
- https://www.reddit.com/r/fantasyfootballcoding/comments/1uyi77k/what_free_resources_are_everyone_using/

## Recommendations For The Collection Layer

- Keep the two-tier model. Use one global player identity catalog, refreshed daily, plus per-league scored stats cached by `(platform, league_id, season, week, roster_id/team_id, player_id)`.
- Do not mark a week immutable 15 minutes after the slate. Store it as `provisional`, then re-fetch after Tuesday morning, Thursday morning, and after day 7. Mark `final_locked` only after the 7-day correction window.
- ESPN request rate: because no official limit exists, start conservatively at 10-20 requests/minute per outbound IP/host with jitter, low concurrency, and a global queue. Increase only after telemetry proves low error rates. Back off hard on 429/403/5xx.
- Sleeper request rate: stay far under the official 1000/minute guidance. For production, cap around 300-500/minute globally unless Sleeper confirms more, because Vercel IP sharing can make bursts look larger than intended.
- Batch size: make cron runs budget-based, not league-count-based. Example: each run gets `max_requests`, `max_bytes`, and `max_seconds`; it claims rows from a queue, writes checkpoints, and exits cleanly.
- Catalog cadence: ESPN global `/players` and Sleeper `/players/nfl` should refresh daily in season, weekly out of season, with hash/etag-style change detection if available. Do not fetch the large catalogs per league.
- ESPN player catalog trim: use `/players` with top-level `filterActive`; use league `kona_player_info` only when league-scored/projection/ranking context is needed.
- Sleeper Flex rule: do not promise exact "started in FLEX" awards from Sleeper unless we can confirm ordered `starters` always matches `roster_positions` well enough. Store `starter_order_index` and inferred slot with a confidence flag.
- Sleeper implementation: build Sleeper first for player-level awards. It is official, public, no-auth, and already aligned with the current score-sync connection model.
- Awards pages: compute from cached Supabase rows, not live provider calls. The page should be fast, stable, and honest about sync state.
- Data quality: persist `rows_written`, missing roster ids, missing player ids, and slot-confidence counts per run. Show user-friendly warnings only when a week cannot produce trustworthy awards.
- Roster templates: generate All-Star and MVT positional categories from each league's starting roster slots. IDP and unusual utility slots are first-class when the connected league uses them.
- Full roster templates: separately count Bench, IR, Taxi, and Reserve slots for roster validation/history. Do not let those counts create award categories.
- Future history: collect history as normalized snapshots, not raw provider dumps. Prioritize league seasons, team records, provider schedules, weekly scores, player ownership, lineup slots, and transactions.
- Historical sync: make it opt-in and season-by-season. Sleeper can walk `previous_league_id`; ESPN history should be treated as best-effort public-only.
- Schedule sync: store provider schedules separately from LeagueWeaver schedules, then compare and review before adopting. Never silently replace a generated schedule.
- ESPN transactions: public no-cookie `mTransactions2` can work by scoring period, but keep ESPN transaction awards best-effort and telemetry-gated. Sleeper transaction awards are feasible now.
- Legal/rate etiquette: use a clear User-Agent, cache heavily, no auth cookies, no private leagues, no scraping browser HTML, and add per-platform remote kill switches.

## Resolution Audit From Follow-Up Research

Resolved or reduced on 2026-08-01:

- ESPN Head Coach: **RESOLVED.** HC slot id is `19`; coach catalog rows use `defaultPositionId: 14` and `eligibleSlots: [19,20,21]`. Detect HC by slot/eligible slot `19`, not default position.
- ESPN HC roster shape: **RESOLVED.** Public ESPN league `11593953` returned live roster entries in 2023, 2024, and 2025 with coach player ids such as `-14017`, `lineupSlotId: 19` for started HC, `lineupSlotId: 20` for benched HC, `defaultPositionId: 14`, `eligibleSlots: [19,20,21]`, and `playerPoolEntry.appliedStatTotal` as league-scored coach points.
- ESPN global player filter: **RESOLVED ENOUGH.** Use `X-Fantasy-Filter: {"players":{"limit":2000},"filterActive":{"value":true}}` for active catalog rows. Use `kona_player_info` nested `players` filters for position/ownership/draft-rank tables.
- Sleeper `players_points`: **RESOLVED.** Live matchup rows include `players_points` and `starters_points`; `starters_points[index]` matched `players_points[starters[index]]` in the validation league.
- Sleeper roster-position coverage: **RESOLVED ENOUGH.** The 10 Sleeper QA fixture chains cover IDP, Superflex, multi-FLEX, DEF, K, changing team counts, and one best-ball league. In every tested 2025 fixture, `starters.length` matched the number of non-bench/non-IR roster positions.
- Sleeper transactions: **RESOLVED.** `/league/{league_id}/transactions/{round}` returns adds/drops/waivers/trades with enough data for Most Trades and Waiver Wire Warrior.
- ESPN transaction enum: **RESOLVED.** Use ESPN enum strings such as `TRADE_ACCEPT`, `WAIVER`, `FREEAGENT`, and `ROSTER`; do not use `TRADED`.
- ESPN public transactions: **REDUCED, NOT FULLY RESOLVED.** `mTransactions2` can return public no-cookie transaction rows by scoring period when no custom filter is sent. Custom transaction filters caused HTTP 400 in follow-up tests. Treat ESPN transaction awards as best-effort and parse locally.
- Sleeper projections: **RESOLVED FOR SCOPE.** Projections are available through undocumented community-used endpoints, but not in the core docs. Do not make projections a dependency for All-Stars/MVT.
- LeagueWeaver schedule sync policy: **RESOLVED AS PRODUCT DECISION.** Start `scores-only`; store provider schedules as reference history; compare/adopt schedule is a later reviewed action.
- Roster-driven IDP support: **RESOLVED AS PRODUCT DECISION.** Starting roster slots define All-Star and MVT positional award categories. Defensive and utility slots are collectible when they exist in the synced league template.
- Bench rows: **RESOLVED AS PRODUCT DECISION.** Store bench rows when provided. All-Stars/MVT starter awards filter to starters, but bench history supports future ownership, waiver, and "benched points" features.
- Disconnected-league retention: **RESOLVED AS PRODUCT DECISION.** Keep normalized historical snapshots by default so awards/history do not vanish, but stop future sync and provide a future delete-history control.
- Commissioner/manual platform changes: **RESOLVED AS PRODUCT DECISION.** Treat score/setting changes inside the 7-day correction window as normal re-sync updates; after lock, only update on explicit manual Refresh or a targeted admin repair.

Still genuinely unresolved:

- ESPN: exact safe request rate at 100k public leagues, especially from Vercel/shared IPs. No official limit was found; production must discover this through telemetry, conservative caps, and backoff.
- ESPN: exact private-league error contract across `lm-api-reads` and `fantasy.espn.com`. Public setting can be confirmed after a successful payload via `settings.isPublic`, but there is no reliable no-request "preflight" public/private detector.
- ESPN: public transaction reliability across many real public leagues and historical seasons. Multiple no-cookie tests succeeded only when using `scoringPeriodId` without custom filters, but wrapper warnings and issue reports require production telemetry.
- Sleeper: whether `starters` order matching `roster_positions` is an official contract or a stable implementation detail. Treat inferred slots as `inferred`, not `confirmed`.
- Sleeper: best ball scoring semantics in matchup rows. A public best-ball fixture was found and `settings.best_ball=1`; `starters.length` still matched starter slot count, but LeagueWeaver should verify whether `starters` means submitted lineup or optimized best-ball lineup before using exact slot awards for best-ball leagues.
- Sleeper: taxi/co-owner edge cases. Roster payload exposes `taxi` and `co_owners`; matchup eligibility impact should be validated against public dynasty/co-owned leagues before awards rely on those fields.
- ToS/legal: ESPN remains unofficial and legal risk cannot be fully resolved through technical research. Before scaling ESPN to 100k leagues, get a lightweight legal review of public-only API use, caching, user deletion, and whether app-scale access should seek written permission or a partner route.
