# QA Public League Fixtures for ESPN and Sleeper

Validated on 2026-08-01. These public league fixtures are intended for LeagueWeaver import QA, schedule sync QA, roster-shape QA, weekly player scoring QA, and future history tracking tests. ESPN uses one stable `leagueId` across seasons. Sleeper creates a new `league_id` each season, so use the 2025 ID as the entry point and walk backward through `previous_league_id` to reach 2024 and 2023.

Important caveat: these are public leagues found through public pages or public APIs. They are good QA fixtures, not guaranteed permanent contracts. Keep them as seed fixtures and revalidate them before using them in automated CI.

## Validation Method

- ESPN endpoint used: `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{season}/segments/0/leagues/{leagueId}?view=mSettings&view=mTeam&view=mMatchup&view=mRoster`
- ESPN pass criteria: 2023, 2024, and 2025 return HTTP 200, `settings.isPublic=true`, teams present, schedule present, and roster entries present.
- Sleeper endpoints used:
  - `https://api.sleeper.app/v1/league/{league_id}`
  - `https://api.sleeper.app/v1/league/{league_id}/rosters`
  - `https://api.sleeper.app/v1/league/{league_id}/matchups/1`
- Sleeper pass criteria: 2025 league links backward to 2024 and 2023 through `previous_league_id`, each season has status `complete`, rosters present, week 1 matchups present, and `players_points` present in matchup data.

## 10 ESPN Public League IDs

| # | ESPN league ID | Seasons verified | League name(s) | Teams | Why it is useful |
|---|---:|---|---|---:|---|
| 1 | `42654852` | 2023, 2024, 2025 | FFLR Test League | 4 | Small stable fixture; fast import smoke test. |
| 2 | `1127533051` | 2023, 2024, 2025 | JamisonVirtualSquads-NFLRock | 10 | Large roster, IDP slots, offensive player slot, many bench/IR spots. |
| 3 | `620064817` | 2023, 2024, 2025 | Jamison/Jamieson Blu crew variants | 10 | Similar IDP-heavy setup with changing league display names. |
| 4 | `1305` | 2023, 2024, 2025 | All-Star League | 12 | Superflex/OP-style roster without normal K/DST slots. |
| 5 | `16525` | 2023, 2024, 2025 | Tyler Perry's League Schmuck | 12 | Roster settings changed between 2023 and 2024/2025. |
| 6 | `40849` | 2023, 2024, 2025 | CHFFL | 12 | Schedule size changed from 103 to 84 while league stayed public. |
| 7 | `957075` | 2023, 2024, 2025 | Strip Sack Siege - IDP Superflex | 16 -> 14 -> 12 | Best ESPN stress fixture: team count changes, IDP, Superflex/OP, very large rosters. |
| 8 | `11593953` | 2023, 2024, 2025 | Prodigies vs Esteemed FFL | 8 -> 10 -> 10 | Rare ESPN Head Coach fixture; slot `19` is present as `HC`. |
| 9 | `53072` | 2023, 2024, 2025 | The Pigskin Kings | 12 | Standard-ish league with K/DST and no flex slot. |
| 10 | `520992816` | 2023, 2024, 2025 | My 2023 League / My 2024 League / My 2025 League | 12 | Public league with confirmed history and changing season names. |

### ESPN Fixture Details

- `42654852`: 4 teams each year; schedule count 34 each year; roster entries 64 each year; slots: QB, RB, WR, TE, D/ST, K, FLEX, Bench, IR.
- `1127533051`: 10 teams; schedule count 86 each year; roster entries 363/364/364; slots include RB/WR, OP, LB, DL, DB, DP, K, Bench, IR.
- `620064817`: 10 teams; schedule count 86 each year; roster entries 360/362/370; slots include RB/WR, OP, LB, DL, DB, DP, K, Bench, IR.
- `1305`: 12 teams; schedule count 103 each year; roster entries 330/322/334; slots include OP and FLEX, no normal K/DST in the validated settings.
- `16525`: 12 teams; schedule count 103 each year; roster entries 186/193/201; 2023 had D/ST and one FLEX; 2024/2025 had two FLEX and no D/ST in the active slot map.
- `40849`: 12 teams; schedule count 103/84/84; roster entries 196 each year; standard QB/RB/WR/TE/DST/K/FLEX shape.
- `957075`: teams 16/14/12; schedule count 139/122/105; roster entries 676/586/524; slots include OP, LB, DL, DB, DP, and two FLEX.
- `11593953`: teams 8/10/10; schedule count 69/86/86; roster entries 166/177/183; slots include HC, K, D/ST, FLEX.
- `53072`: 12 teams; schedule count 109 each year; roster entries 190/193/191; standard QB/RB/WR/TE/DST/K with no active FLEX.
- `520992816`: 12 teams; schedule count 103 each year; roster entries 197/200/203; one RB, two WR, two FLEX, K, D/ST, IR.

### ESPN Sources

- FFLR documentation shows public ESPN league usage and the `42654852` test league: https://k5cents.github.io/fflr/
- ESPN API community package notes public league support and private league cookie requirements: https://github.com/cwendt94/espn-api/wiki
- ESPN API package README: https://github.com/cwendt94/espn-api
- CHFFL public source for `40849`: https://www.youtube.com/c/AlexEngler/about
- Public forum source for `520992816`: https://www.fftodayforums.com/forum/topic/524614-2025-edex-the-sentry/page/3/
- Direct ESPN public API pattern used for every validation: `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{season}/segments/0/leagues/{leagueId}`

## 10 Sleeper Public League Chains

Use the 2025 league ID as the public code. For historic sync, follow `previous_league_id` from the 2025 league response.

| # | Sleeper 2025 league ID | 2024 league ID | 2023 league ID | League name | Teams | Why it is useful |
|---|---:|---:|---:|---|---:|---|
| 1 | `1180985894268776448` | `1049003802214518784` | `929477896622698496` | The Dynasty IDP | 14 | Strong IDP fixture with DL/LB/DB slots and deep benches. |
| 2 | `1257478892810162176` | `1124824107297280000` | `965839099934384128` | Best Ballssss | 12 | Best ball + Superflex style fixture. |
| 3 | `1256776172377739264` | `1065845090503020544` | `986498514869874688` | Game of Inches | 12 | Three FLEX slots; useful for flex handling. |
| 4 | `1208532804833378304` | `1053106166944894976` | `922133357666856960` | Dynasty for Experts - 12 | 12 | Multiple FLEX plus Superflex; stable 12-team dynasty chain. |
| 5 | `1199526163391713280` | `1048344076036259840` | `983487036449406976` | The League | 12 | Similar multi-flex/Superflex setup; good duplicate-shape regression fixture. |
| 6 | `1183056458424250368` | `1051924735317176320` | `928050220875829248` | Real Dynasty SF League | 12 | Superflex dynasty with larger bench. |
| 7 | `1221298010177146880` | `1124839895194402816` | `982311375378657280` | The East Coast Roast | 12 | More standard Sleeper redraft-style roster with DEF and no K. |
| 8 | `1257451451014201344` | `1078780479580540928` | `938576485823107072` | La Gut Forever | 8 -> 10 -> 10 | Team count changes plus K, DEF, DL, LB, DB. |
| 9 | `1250504712831123456` | `1114647006913351680` | `981673630453030912` | FTA #6 House of Pain | 14 | 14-team standard-ish fixture with K/DEF. |
| 10 | `1256617584954978304` | `1116235333244407808` | `993251309690109952` | Northern Indiana | 12 | Compact bench, two FLEX, DEF, no K. |

### Sleeper Fixture Details

- All 10 chains returned `status=complete` for 2023, 2024, and 2025.
- All 10 chains returned rosters for each season.
- All 10 chains returned week 1 matchups for each season.
- All 10 chains had `players_points` in week 1 matchup data for each season.
- Sleeper does not expose ESPN-style numeric lineup slot IDs. It exposes ordered `roster_positions` on the league and ordered `starters` in matchup/roster data. To infer a starter slot, match `starters[index]` to `roster_positions[index]`.
- For FLEX/SUPER_FLEX cases, preserve the exact Sleeper roster slot label in LeagueWeaver (`FLEX`, `SUPER_FLEX`, `WRRB_FLEX`, `REC_FLEX`, etc.) instead of flattening too early.

### Sleeper Sources

- Sleeper official API docs: https://docs.sleeper.com/
- Sleeper docs confirm the API is read-only, no token is needed, and recommend staying under 1000 calls/minute to avoid IP-blocking: https://docs.sleeper.com/
- Sleeper league endpoint docs: `GET https://api.sleeper.app/v1/league/{league_id}`
- Sleeper rosters endpoint docs: `GET https://api.sleeper.app/v1/league/{league_id}/rosters`
- Sleeper matchup endpoint docs: `GET https://api.sleeper.app/v1/league/{league_id}/matchups/{week}`
- Example validated Sleeper 2025 league endpoint: https://api.sleeper.app/v1/league/1180985894268776448
- Example validated Sleeper 2025 matchup endpoint: https://api.sleeper.app/v1/league/1180985894268776448/matchups/1

## High-Scale / Limit Testing Fixtures

Validated on 2026-08-01. These fixtures are specifically for testing large league sizes, long schedules, large rosters, IDP slots, IR counts, and importer performance. They are not all 2023-2025 continuity fixtures.

### ESPN High-Team Fixtures

| ESPN league ID | Season(s) verified | Teams | Status | Use |
|---:|---|---:|---|---|
| `1368762714` | 2025, 2026 | 20 | Public | Best ESPN 20-team fixture found. Use 2025 for roster, schedule, lineup-slot, and player-score stress QA. 2026 is public but had zero roster entries at validation time. |
| `957075` | 2023, 2024, 2025, 2026 | 16 -> 14 -> 12 -> 12 | Public | Best ESPN IDP/Superflex stress fixture. Use 2023 for the 16-team version; later years are still useful for changing team-count behavior. |

ESPN high-team details:

- `1368762714` in 2025: 20 teams, 160 schedule rows, 322 roster entries, slots `QB:1`, `RB:2`, `WR:2`, `TE:1`, `D/ST:1`, `K:1`, `FLEX:1`, `Bench:7`, `IR:1`.
- `1368762714` in 2026: 20 teams and public settings, but zero roster entries at validation time. Treat this as schedule/settings only until rosters populate.
- `957075` in 2023: 16 teams, 139 schedule rows, 676 roster entries, slots `QB:1`, `RB:2`, `WR:3`, `TE:1`, `OP:1`, `FLEX:2`, `DL:3`, `LB:3`, `DB:3`, `DP:2`, `Bench:19`, `IR:4`.

ESPN high-team sources:

- Public 20-team ESPN league recruitment source for `1368762714`: https://www.reddit.com/r/findaleague/comments/1mu5rmz/espn_fantasy_football_20_team_competitive_league/
- Direct ESPN 2025 validation endpoint for `1368762714`: https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/segments/0/leagues/1368762714?view=mSettings&view=mTeam&view=mMatchup&view=mRoster
- Direct ESPN 2023 validation endpoint for `957075`: https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2023/segments/0/leagues/957075?view=mSettings&view=mTeam&view=mMatchup&view=mRoster

### Sleeper 32-Team Fixtures

| Sleeper league ID | Season | Teams | Status | Player points | Use |
|---:|---:|---:|---|---|---|
| `1346973753954820096` | 2026 | 32 | `in_season` | Yes, weeks 1/2/8/14/17 validated | Best current 32-team Sleeper stress fixture. Includes `IDP_FLEX`, `K`, and deep benches. |
| `1126896305147629568` | 2024 | 32 | `complete` | Yes, weeks 1/2/8/14/17 validated | Compact 32-team completed fixture with `SUPER_FLEX`; good for per-player score import and performance tests. |
| `1103082281528369152` | 2024 | 32 | `complete` | Yes, weeks 1/2/8/14/17 validated | 32-team dynasty fixture with `SUPER_FLEX` and multiple flex slots. |
| `923716894677458944` | 2023 | 32 | `complete` | Yes, weeks 1/2/8/14/17 validated | 32-team completed fixture with `SUPER_FLEX` and `IDP_FLEX`; good 2023 player-score stress test. |
| `1017257785409134592` | 2023 | 32 | `complete` | Yes, weeks 8/14/17 validated | Largest roster-shape fixture found: offense, K, DL/LB/DB, three `IDP_FLEX`, and very deep bench. Week 1/2 did not return player points, so use later weeks for score QA. |
| `1381132434342416384` | 2026 | 32 | `pre_draft` | No | Future 32-team roster-template fixture only. Good for importer settings, not scoring yet. |

Sleeper high-team details:

- `1346973753954820096`: roster positions `QB/RB/WR/WR/TE/FLEX/K/IDP_FLEX/IDP_FLEX/IDP_FLEX/BN...`; 32 rosters and 32 week matchup rows.
- `1126896305147629568`: roster positions `RB/WR/TE/FLEX/FLEX/SUPER_FLEX/BN...`; 32 rosters and 32 week matchup rows.
- `1103082281528369152`: roster positions `RB/WR/WR/FLEX/FLEX/SUPER_FLEX/BN...`; 32 rosters and 32 week matchup rows.
- `923716894677458944`: roster positions `RB/WR/WR/TE/FLEX/SUPER_FLEX/IDP_FLEX/IDP_FLEX/IDP_FLEX/BN...`; 32 rosters and 32 week matchup rows.
- `1017257785409134592`: roster positions `QB/RB/RB/WR/WR/WR/TE/TE/FLEX/FLEX/FLEX/K/DL/DL/LB/LB/DB/DB/IDP_FLEX/IDP_FLEX/IDP_FLEX/BN...`; 32 rosters and 32 week matchup rows.
- `1381132434342416384`: roster positions `FLEX/FLEX/FLEX/FLEX/SUPER_FLEX/DL/LB/DB/IDP_FLEX/IDP_FLEX/BN...`; 32 rosters, but no matchups/player points yet.

Sleeper high-team sources:

- Sleeper invite page for `1103082281528369152`: https://sleeper.com/invite/LMwBoXNdYWw3
- Sleeper invite page for `1381132434342416384`: https://sleeper.com/i/QB87WALQdL1Vg
- Public Reddit source for Hybrid Gridiron League invite: https://www.reddit.com/r/DynastyFFIDP/comments/1v6r2wu/hybrid_gridiron_league/
- Direct Sleeper validation endpoint for `1346973753954820096`: https://api.sleeper.app/v1/league/1346973753954820096
- Direct Sleeper validation endpoint for `1126896305147629568`: https://api.sleeper.app/v1/league/1126896305147629568
- Direct Sleeper validation endpoint for `1103082281528369152`: https://api.sleeper.app/v1/league/1103082281528369152
- Direct Sleeper validation endpoint for `923716894677458944`: https://api.sleeper.app/v1/league/923716894677458944
- Direct Sleeper validation endpoint for `1017257785409134592`: https://api.sleeper.app/v1/league/1017257785409134592
- Direct Sleeper validation endpoint for `1381132434342416384`: https://api.sleeper.app/v1/league/1381132434342416384

Recommended high-scale QA path:

- Use ESPN `1368762714` season 2025 as the primary ESPN 20-team limit test.
- Use ESPN `957075` season 2023 as the ESPN 16-team IDP/Superflex/IR stress test.
- Use Sleeper `1346973753954820096` season 2026 and Sleeper `1126896305147629568` season 2024 as the primary 32-team score-import tests.
- Use Sleeper `1017257785409134592` season 2023 week 8 or later as the deep-roster IDP stress test.
- Keep these in a separate QA seed group named `limit_fixtures` so normal import tests stay fast.

## How This Should Be Implemented in LeagueWeaver

### ESPN Import Shape

- Store `provider = "espn"`.
- Store the user-entered `external_league_id`.
- For each season, request ESPN with the selected `season`.
- Store a LeagueWeaver internal season row keyed by `(provider, external_league_id, season)`.
- Store ESPN lineup slots using our own normalized enum plus raw values:
  - `raw_slot_id`: ESPN numeric slot ID, for example `19`.
  - `raw_slot_label`: ESPN label, for example `HC`.
  - `normalized_slot`: LeagueWeaver label, for example `HEAD_COACH`.
  - `slot_group`: starter, bench, injured reserve, taxi/other.

### Sleeper Import Shape

- Store `provider = "sleeper"`.
- Store the user-entered 2025 `external_league_id`.
- During import, walk `previous_league_id` until the requested history window is covered.
- Store each Sleeper season with its own `external_league_id`, because Sleeper IDs are season-specific.
- Store a canonical LeagueWeaver league ID that ties all linked Sleeper seasons together.
- Preserve `roster_positions` exactly and map each `starters[index]` to `roster_positions[index]`.

### Normalized Values Layer

Yes, LeagueWeaver should have its own internal values. ESPN and Sleeper call the same concepts different names, so we should translate both into LeagueWeaver language.

Recommended structure:

| LeagueWeaver normalized value | ESPN example | Sleeper example |
|---|---|---|
| `QUARTERBACK` | slot `0`, `QB` | `QB` |
| `RUNNING_BACK` | slot `2`, `RB` | `RB` |
| `WIDE_RECEIVER` | slot `4`, `WR` | `WR` |
| `TIGHT_END` | slot `6`, `TE` | `TE` |
| `KICKER` | slot `17`, `K` | `K` |
| `TEAM_DEFENSE` | slot `16`, `D/ST` | `DEF` |
| `HEAD_COACH` | slot `19`, `HC` | not commonly supported in Sleeper fixtures found |
| `FLEX_STANDARD` | slot `23`, `FLEX` | `FLEX` |
| `SUPER_FLEX` | slot `7`, `OP` | `SUPER_FLEX` |
| `DEFENSIVE_LINE` | slot `11`, `DL` | `DL` |
| `LINEBACKER` | slot `10`, `LB` | `LB` |
| `DEFENSIVE_BACK` | slot `14`, `DB` | `DB` |
| `DEFENSIVE_PLAYER` | slot `15`, `DP` | IDP/flexible defensive slots where present |
| `BENCH` | slot `20`, `Bench` | `BN` |
| `INJURED_RESERVE` | slot `21`, `IR` | `IR` where present |

Keep both values:

- Raw platform value: needed for audits, bug reports, and platform-specific edge cases.
- Normalized LeagueWeaver value: needed so All-Stars, MVT, history, and UI can work the same way across ESPN and Sleeper.

## Recommended QA Coverage

- Small ESPN smoke test: `42654852`.
- ESPN Head Coach test: `11593953`.
- ESPN heavy IDP/Superflex test: `957075`.
- ESPN changing schedule-size test: `40849`.
- ESPN changing team-count test: `957075` and `11593953`.
- Sleeper IDP test: `1180985894268776448`.
- Sleeper Superflex test: `1257478892810162176`, `1208532804833378304`, or `1183056458424250368`.
- Sleeper multiple FLEX test: `1256776172377739264`.
- Sleeper changing team-count test: `1257451451014201344`.
- Sleeper season-chain/history test: any Sleeper fixture above, especially `1180985894268776448` because it links back beyond 2023.

## Rejected or Weaker Candidates

- ESPN `883112` / Pure Flex: 2023, 2024, and 2025 were public and had schedules, but 2023 returned zero roster entries through `mRoster`. Use only for schedule/settings tests, not per-player scoring tests.
- ESPN `72861577`: 2023 and 2024 had rosters, but 2025 returned zero roster entries.
- ESPN `1429032`: 2023 worked, but 2024 and 2025 returned 404.
- ESPN `1563450345`: 2024 and 2025 worked, but 2023 returned 404.
- ESPN `2114978539`: 2024 and 2025 worked, but 2023 returned 404.
- ESPN `644346` and `869339`: returned 401 for the tested seasons.
- Older Sleeper public sample chains from docs and StackOverflow were useful for API shape, but did not meet the 2023/2024/2025 requirement.

## Recommended Next Step

Add these fixtures to a non-production QA seed file with a `last_validated_at` date and a nightly or manual revalidation script. The script should not fail the whole app build if a public league disappears; it should report which fixture drifted and suggest a replacement.
