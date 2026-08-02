# Master PRD — Player Data + All-Stars + MVT + Game-Detail Rosters

**Status:** Stage A (build-ready plan) · **Date:** 2026-08-01 · **Owner:** Anthony
**Merges:** `GAME-DETAIL-MODAL-PRD.md` (canonical seam) · `ALL-STAR-AND-MVT-PRD.md` ·
`RESEARCH-espn-sleeper-data-collection.md` (data-collection ground truth) · `GAME-DETAIL-MODAL-SPEC.md` ·
`QA-public-league-fixtures.md`. Visual refs: `reference images/MVT and All Star/*`.

> One shared player dataset powers three surfaces — the **game-detail modal roster**, the **All-Stars**
> feature, and the **MVT** power ranking — plus new **standings columns**. Build the dataset once; every
> feature reads the same normalized rows.

### 0. Decisions resolved (2026-08-01)
1. **Gold = shared accolade** — gold now spans GOTW + MVT + All-Stars (the GOTW-only rule is relaxed
   deliberately; see §7).
2. **v1 scope includes transactions (DEP-3)** — Sleeper transactions → Most Trades + Waiver Wire Warrior
   ship in v1 (ESPN transactions best-effort).
3. **Conference is a first-class entity, added now** — a `Conference` model lands in v1; teams carry
   `conferenceId`; the MVT **1.5-pt Conference tier** + Conference Awards sub-view are IN v1.
4. **Persistence = normalized tables** (§3.5); `platform_sync_snapshots` keeps raw payload/hash only.

---

## 1. Overview & scope

Add a **reusable, player-centric dataset** (keyed by player × year × week, week-scoped immutable
ownership) collected from **public** ESPN/Sleeper leagues using **platform-scored points** (no scoring
engine), then build All-Stars, MVT, standings columns, and the game-detail roster body on top of it.

**In scope (v1 recommendation — confirm in §10):** Sleeper-first data layer → All-Stars → MVT
(Positional + Achievement + Divisional/League + Bonus, **conference tier deferred**) → standings MVT/★
columns → All-Stars page + MVT page + All-Star roster badge → brand/degradation pass. ESPN added as
best-effort second provider. Game-detail modal roster body (DEP-1) shares the identical seam.

**Out of scope:** private leagues (no cookies), any custom/parallel scoring, conference awards (until a
`Conference` entity exists), ESPN historical pre-2018 no-cookie, best-ball exact-slot awards until
validated.

---

## 2. Locked decisions (carried forward — do not regress)

- **Public ESPN/Sleeper only.** Private → detect and skip.
- **Platform-scored points only.** ESPN `playerPoolEntry.appliedStatTotal`; Sleeper `players_points`.
  No scoring engine, no global stats warehouse.
- **Player-centric, week-scoped immutable ownership.** A trade credits each week to that week's owner;
  prior weeks never move. Not siloed per team.
- **Two-tier storage:** one global player **identity catalog** + per-league **scored weekly stats**.
- **All-Star slots roster-driven** from the league's starting slots (never hardcoded). **Ties inclusive.**
- **MVT = Positional + Achievement + Divisional/League + Bonus.** Scale 8–32 teams, 1–8 divisions,
  dynamic. **Conference is now a first-class entity (v1):** MVT gains a **1.5-pt Conference tier**
  (between division 1 and league 2) + a Conference Awards sub-view.
- **Transactions ship in v1 (DEP-3):** Sleeper adds/drops/trades → Most Trades + Waiver Wire Warrior;
  ESPN best-effort.
- **No fake data.** Unsynced/manual leagues degrade; team-level MVT still computes.
- **Rating-dependent awards consume `toMatchupScore10`/`getMatchupSignal`** — never a parallel rating.
  Every division name carries its `DivisionMark`.

---

## 3. Reconciled data model (canonical — resolves the doc conflicts)

The four docs disagreed on slot names, identity key, field names, and VM types. **Canonical decisions:**

### 3.1 Canonical `SlotKey` (supersedes all three docs' variants)
Base = research `NormalizedLineupSlot`, plus `RB_WR_FLEX` (ESPN slot 3):

```
QB TQB RB RB_WR_FLEX WR WR_TE_FLEX TE SUPERFLEX
DT DE DL LB CB S DB DP DST K P HC
FLEX IDP IDP_FLEX BENCH IR TAXI RESERVE UNKNOWN
```
- **HC** (not `HEAD_COACH`), **DST** (not `D-ST`/`DEF`), **BENCH** (not `BE`), **DL/LB/DB** (not
  `IDP_DL`…). The game-detail SPEC §11 enum is **updated to this**.
- **ESPN `lineupSlotId` →** 0 QB · 1 TQB · 2 RB · 3 RB_WR_FLEX · 4 WR · 5 WR_TE_FLEX · 6 TE ·
  7 SUPERFLEX · 8 DT · 9 DE · 10 LB · 11 DL · 12 CB · 13 S · 14 DB · 15 DP · 16 DST · 17 K · 18 P ·
  **19 HC** · 20 BENCH · 21 IR · 23 FLEX. **Detect HC by slot/eligibleSlots == 19, never
  `defaultPositionId`** (coaches show `defaultPositionId 14`).
- **Sleeper `roster_positions` →** QB/RB/WR/TE/K→same · FLEX→FLEX · WRRB_FLEX→RB_WR_FLEX ·
  REC_FLEX→WR_TE_FLEX · SUPER_FLEX→SUPERFLEX · DL/LB/DB/IDP_FLEX→same · DEF→DST · BN→BENCH · IR→IR ·
  TAXI→TAXI · unknown→UNKNOWN (keep raw value + `slot_confidence`).
- Preserve **raw provider slot** + a `slot_confidence` (`confirmed|inferred|ambiguous|bench`).

### 3.2 Canonical identity key
Internal **`leagueweaver_player_id`** (LW-owned, not a provider id). Aliases: `gsis_id` (**preferred**),
`sleeper_id`, `espn_id`, `pfr_id`, `yahoo_id`. Seed from nflverse `ff_playerids` + `mayscopeland/ffb_ids`.
**No name-only matching** except reviewed fallback. Supersedes the game-detail SPEC's provider-id `Player.id`.

### 3.3 Canonical field names
- Player fantasy points: **`points`** (league-scored). Projected: `projected` (ESPN only, optional).
- Matchup rating: **`score10`** everywhere (via `getMatchupSignal`/`toMatchupScore10`) — never raw.
- Fantasy team: **`teamId`** = LeagueWeaver `Team.id` in engines/VMs. Sync boundary carries
  `league_team_id` (= LW id) + `provider_roster_id` (raw). Ownership keys on `teamId`.

### 3.4 Canonical shapes
- **Flat fact is canonical** (`season_player_stats` row / `PlayerWeekStat`): the atomic
  `{ playerId, teamId, year, week, points, lineup_status, starter_index, inferred_slot, slot_confidence }`.
  The engines (All-Star/MVT) read the flat rows.
- **The modal's grouped VM** (`SideVM.starters[]`/`bench[]` of `SlotVM`) is **derived at read time**
  by a selector from the flat rows. Canonical VM names = game-detail PRD's
  **`GameDetailVM`/`SideVM`/`SlotVM`** (SPEC's `GameDetail`/`TeamSide`/`PlayerSlot` superseded).

### 3.5 Persistence — Supabase tables (from research schema; **OPEN: normalized vs JSONB, see §10**)
Recommendation: **normalized tables** (queryable for awards). `platform_sync_snapshots` (already exists,
`snapshot_type ∈ {players,rosters,boxscores,…}`) holds **raw payload + hash for traceability only**.

```
player_catalog                — global, daily refresh, app-wide
  id(=leagueweaver_player_id), canonical_name, normalized_name, position, nfl_team,
  gsis_id, sleeper_id, espn_id, status, updated_at

season_player_stats           — per-league scored weekly facts (award source)
  schedule_id, provider, provider_league_id, season, week,
  league_team_id, provider_roster_id, provider_player_id, canonical_player_id,
  fantasy_points, lineup_status, starter_index, inferred_slot, slot_confidence,
  is_provisional, final_lock_at, synced_at, source_payload_hash
  PK/idx: (schedule_id, season, week, league_team_id, provider_player_id)

platform_sync_runs            — diagnostics
  id, provider, schedule_id, week, status, rows_written, warnings, started_at, finished_at

-- future-proof history (build the tables now so nothing is ever lost; populate later)
league_seasons(id, schedule_id, provider, provider_league_id, previous_provider_league_id, season,
  league_name, scoring_type, roster_positions, playoff_settings, regular_season_week_count,
  team_count, synced_at)
league_team_history(league_season_id, league_team_id, provider_roster_id_or_team_id, team_name,
  manager_name, division_id, final_standing, wins, losses, ties, points_for, points_against)
league_schedule_history(league_season_id, week, provider_matchup_id, home_league_team_id,
  away_league_team_id, home_score, away_score, status, final_lock_at)
player_ownership_history(league_season_id, week, canonical_player_id, league_team_id,
  provider_player_id, nfl_team_at_time, position_at_time, roster_status, lineup_slot, fantasy_points)
```
Team-mapping (provider_roster_id → LW teamId) reuses existing `external_league_links` +
`lib/platform/matchTeams.ts`.

### 3.6 Score finality / re-sync (mandatory — corrections land up to 7 days)
Write each week `is_provisional=true`; **re-fetch Tue AM, Thu AM, and after day-7**; set `final_lock_at`
only after the 7-day window. Post-lock updates only on manual Refresh / admin repair. Setting/LM changes
inside the window = normal re-sync. UI shows "Provisional" until locked, then "Final".

---

## 4. Collection-at-scale plan (rates / queue / budget / etiquette)

- **Provider order: Sleeper first** (official, no-auth, ~1000/min guidance; matchups already return
  `players_points`/`starters_points`/`starters`/`players`). **ESPN second, best-effort** (unofficial).
- **Rate/etiquette:** ESPN **10–20 req/min per outbound IP** with jitter, low concurrency, a **global
  queue**, hard exponential backoff on **429/403/5xx**. Sleeper **cap ~300–500/min** globally. Stable
  **User-Agent + contact email**; **per-platform kill switch**; cache heavily; **no cookies**; **no HTML
  scraping**.
- **Budget-based cron:** each run gets `max_requests` / `max_bytes` / `max_seconds`; claims from a queue,
  checkpoints, exits clean. **Never block team-score sync if player sync fails** (scores are core;
  awards show "updating"). Reuse `MAX_LINKS_PER_RUN=100` batching; spillover next tick.
- **Catalogs refresh DAILY in-season / weekly off-season, NEVER per league.** ESPN global `/players`
  trim header `X-Fantasy-Filter: {"players":{"limit":2000},"filterActive":{"value":true}}` (~2,725 active
  rows). Sleeper `/players/nfl` ≤ once/day (~5 MB).
- **Normalized translation layer:** convert provider fields → LeagueWeaver names/types **before** any UI
  or engine; store raw ids + **payload hashes** (not full payloads). UI/engines read **only cached
  normalized rows**, never live provider payloads.
- **Public/private:** no reliable preflight — pull & classify. `200`+`settings.isPublic` = public;
  `401/403` = private → skip; `404`/empty = invalid. ESPN pre-2018 unreliable no-cookie.
- **Schedule sync stays scores-only;** store provider schedule as reference; **never silently rewrite**
  the generated LeagueWeaver schedule. Mark Sleeper best_ball/taxi/co_owner slots `inferred` until validated.

---

## 5. Feature specs

### 5A. Game-detail modal roster (DEP-1 seam — shared foundation)
The modal's roster body reads `SideVM.starters[]`/`bench[]` derived from `season_player_stats`. Each
`<PlayerRow>` renders slot badge (canonical `SlotKey`), name, opponent/kickoff (DEP-2, optional), points
(+projected on ESPN), and a **`badge` slot where the All-Star badge renders**. `<PlayerLedger>` (tap) is
ESPN-only (per-stat `appliedStats`); Sleeper shows the total (+ optional computed line). IR/Bench/Taxi
excluded from matchup total. Visual fidelity governed by `game-modal-responsive-mockup.html` (PRD §4).

### 5B. All-Stars (`lib/allStars.ts`)  — ref: `PVE ALL-STAR TEAM OF THE WEEK.png`
- **Roster-driven slots** from the synced `LineupTemplate` (starting slots only), in the league's order;
  `count>1` slots ranked (RB1/RB2, WR1/WR2/WR3). IDP/HC first-class.
- **Selection (per completed week):** for each template slot, take the top-`count` players **actually
  started in that same slot** (occupancy, not eligibility — FLEX winner = best player started in FLEX).
  **Ties inclusive** (all tied players win the spot, each badged; weekly total counts the slot's score
  once). Only **started** players; empty slot omitted.
- **Weekly total** = sum of winning slot scores. **Season All-Star count per team** = selections across
  weeks. Golden: **Wk1 total 288.42; GREEN 23, YARDIES 17.**
- **Page:** hero week board (slot rows tinted by the **winning fantasy team's color** + that team's
  logo) · "All-Stars by Team" count rail (desc) · weekly-total **trend line** (season min red / max
  green; prior-year comparison line). Week switcher.
- **Badge:** `<AllStarBadge slot rank week points/>` — icon for single slots, **icon + rank numeral** for
  multi-slot (RB1→"1", WR3→"3"); tooltip "Week {w} All-Star — {slot} · {points} pts".

### 5C. MVT (`lib/mvt.ts`)  — ref: `MVT - *.png` (5 pages)
`MVT total = Positional + Achievement + Divisional/League + Bonus`. Golden: **GREEN tops (55.50).**
- **Positional (§4.2):** per starting slot → Average (1st 4 / 2nd 2 / 3rd 1) + High Score (2 / 1 / 0.5).
  Pool scales with the league's actual roster.
- **Achievement (§4.3):** MVP (4/2/1) · Total-Avg (8/4/2) · Total-High (6/3/1.5) · All-Star Players
  (6/3/1.5) · Best Record (6/3/1.5) · Most Blowouts (4/2/1) · Most Upsets (4/2/1) · Most Trades
  (1/.5/.25, DEP-3) · Waiver Warrior (1/.5/.25, DEP-3).
- **Divisional/League (§4.4):** per row, each **division best = 1**, **league best = 2** (stack). 7 rows
  (Overall/Div/Cross-Div record, Sweeps, Longest Streak, Home, Away). **Dynamic 1–8 divisions** from
  `schedule.setup.divisions`; single-division league awards league tier only. Real names + `DivisionMark`.
  **Conference tier (1.5) IN v1** via the new first-class `Conference` entity (teams carry `conferenceId`;
  each conference's best = 1.5, stacks with division 1 + league 2). Conference-structured leagues also get
  a Conference Awards sub-view; non-conference leagues omit it. A `ConferenceMark` (parallel to
  `DivisionMark`) accompanies each conference name.
- **Bonus (§4.5):** Best MOTW · Best Reg Match · Top Ranked Matchup · Largest Blowout Margin · Smallest
  Win Margin · Largest Combined Total · Biggest Upset · Biggest Rank Jump (2/0.5 tiers). Rating rows use
  `toMatchupScore10`.
- **Page:** two-column power-ranking Overview (rank, nick, MVT total, prev in parens, ▲/▼ movement,
  team logo) + swipeable **Positional · Achievement · Divisional/League · Bonus** detail tables.
  Past-champions row optional (history dependent).

### 5D. Standings integration (`StatsWorkspace.tsx`)
Extend `TeamSeasonStats` with `mvtScore`, `mvtRank`, `allStarCount`, `allStarRank`. Add sortable **MVT**
and **★** columns to the standings `<thead>`/rows (+ legend). Compact **MVT** and **★** chips in the
team-schedule header identity block.

---

## 6. Graceful degradation (no fake data)
- **Not connected / manual league:** player features hidden; **team-level MVT still computes** (Div/League,
  record, rating, streak, home/away, bonus-from-scores). All-Stars + Positional + player-dependent
  achievements show a "connect a public ESPN/Sleeper league" empty state.
- **Provisional week:** award pages label "Updating / Provisional"; never present as final.
- **Inferred Sleeper slots:** soften copy ("started" / "inferred FLEX"), never "started in FLEX".
- **Player sync failure:** team scores still sync; awards show last-good + "updating".

---

## 7. Brand
Dark broadcast surface via `--pk-*` + reference `.pp-panel`; type/space/radius from the `--text-*` /
`--radius-*` tokens (no literals); ranked signals on the monotone `--strength-*` scale (never red).
`DivisionMark` always accompanies a division name. **Gold = shared accolade color** (resolved): gold now
spans GOTW + MVT + All-Stars, matching the reference graphics (the prior GOTW-only rule is relaxed).
Update the `strength-scale` / `week-score-bar` memories to reflect gold's widened role.

---

## 8. Dependency-ordered build plan (phases; verify each live; keep `tsc` + `next build` green)

- **P0 — Data model + tables + Conference entity.** Types (canonical §3) + Supabase migration
  `074_player_awards.sql` (player_catalog, season_player_stats, platform_sync_runs, history tables) +
  normalization/translation layer. **Also lands the first-class `Conference` entity** (`Conference {id,
  name, initials?, color, logoUrl?}`; `Team.conferenceId?`; schedule-setup + `fromLegacyInput` wiring;
  `ConferenceMark` component). Deps: none. ⚠ Cross-cutting — touches `lib/types.ts`, schedule setup, and
  standings grouping; scope carefully.
- **P1 — Sleeper player parser FIRST, then ESPN.** `mapSleeperPlayers` (matchups `starters` +
  `players_points`, infer slot from `roster_positions`) → normalized rows; global catalog daily; wire into
  `sync-scores` cron + Refresh with provisional/re-sync/final-lock + budget/backoff. Then `mapEspnPlayers`
  (`views:[mRoster,mBoxscore]`, confirmed slot, HC=19, `appliedStatTotal`). Unit-test parsers against
  **Sleeper 856201517630328832** and **ESPN 42654852 / 11593953 (HC)**. Deps: P0.
- **P2 — Engines.** `lib/allStars.ts` + `lib/mvt.ts` on normalized rows. **Golden-fixture tests:**
  GREEN tops MVT (55.50), Wk1 all-star total 288.42, GREEN 23 / YARDIES 17, sheet bucket math
  (DECOUPES 26.00 = 8+16+0+2). Deps: P1.
- **P3 — Standings integration.** MVT + ★ columns + team-schedule chips (extend `TeamSeasonStats`). Deps: P2.
- **P4 — Pages + badge.** MVT page (Overview + 4 detail tabs) · All-Stars page (board + rail + trend) ·
  `<AllStarBadge>` in the game-detail `PlayerRow`. New `ViewKey` + `VIEW_ITEMS` entries in
  `SeasonWorkspace.tsx`. Deps: P2 (P3 parallel-ok).
- **P5 — Brand + degradation + mobile parity.** `--pk-*`/gold (per §10 ruling), `<PointChip>`, empty
  states, mobile card parity. Deps: P4.
- **P2.5 — Transactions (DEP-3, now v1).** Sleeper `/transactions/{round}` → Most Trades + Waiver Warrior
  achievements (feed MVT-1); ESPN `mTransactions2` best-effort. Deps: P1.
- **P6 (later) — History (DEP-4)** populate the history tables; past-champions row.

**Scale proof (X-1):** verify against a **non-PVE roster shape and an IDP league** (e.g. Sleeper
`1180985894268776448` Dynasty IDP; ESPN `1127533051` IDP; ESPN `1305` Superflex/no-K-DST) and a
large league — never hardcode PVE's roster/divisions/team count.

---

## 9. Finalized design-story list

| ID | Type | Goal | Acceptance | Deps |
|---|---|---|---|---|
| **CONF-1** | data | First-class `Conference` entity | `Conference` type + `Team.conferenceId?`; schedule-setup + `fromLegacyInput` wiring; `ConferenceMark`; standings can group by conference; no regressions for non-conference leagues | — |
| **DATA-1** | data | Canonical player-centric model + tables (§3) | Week-scoped immutable ownership; dedup by `leagueweaver_player_id`; year-scoped; migration applies clean | — |
| **DATA-2** | data | Sleeper player parser (then ESPN) | Real pull from `856201517630328832` (& ESPN `42654852`/`11593953`) matches platform UI totals; HC by slot 19; slot_confidence set | DATA-1 |
| **DATA-3** | data | Collection at scale + finality | Provisional→re-sync (Tue/Thu/day7)→final_lock; finalized weeks never re-fetched; budget/backoff/kill-switch; catalog daily | DATA-1,2 |
| **DATA-4** | data | `LineupTemplate` + `RosterTemplate` sync | Starting slots (award categories) + full roster derived per provider; ranked duplicate slots (LB1/LB2) | DATA-2 |
| **AS-1** | engine | `lib/allStars.ts` | Reproduces sheet weekly teams + counts; FLEX-slot rule; inclusive ties; Wk1=288.42; GREEN 23/YARDIES 17 | DATA-2,4 |
| **MVT-1** | engine | `lib/mvt.ts` (4 buckets, scale-aware) | Reproduces sheet bucket math + totals; GREEN 55.50 tops; dynamic 1–8 div; conference **1.5 tier active**; Most Trades/Waiver from DEP-3 | DATA-2,4; AS-1; CONF-1; DEP-3 |
| **STD-1** | ui | MVT + ★ standings columns + chips | Sortable columns + legend; team-schedule chips; team-level MVT works when unsynced | MVT-1, AS-1 |
| **MVT-2** | ui | MVT page (Overview + 4 tabs) | Two-col leaderboard w/ movement + prev; 4 detail tables; matches ref pages 1–5; swipeable | MVT-1 |
| **AS-2** | ui | All-Stars page | Week board (team-color rows) + by-team rail + trend line + week switcher | AS-1 |
| **AS-3** | ui | `<AllStarBadge>` in modal `PlayerRow` | Rank numeral on multi-slot; tooltip; renders in game-detail roster | AS-1; DEP-1 seam |
| **UI-1** | ui | Brand + degradation + mobile parity | `--pk-*`/gold per §10; empty states; mobile card parity; no fake data | STD-1, MVT-2, AS-2 |
| **X-1** | cross | Scale + roster-shape + conference conditionals | Passes on IDP + Superflex + large league + 1-div league; conference only with entity | MVT-1 |
| **DEP-3** | data | Transactions (Sleeper→ESPN) — **v1** | Sleeper adds/drops/trades; Most Trades + Waiver Warrior; ESPN best-effort enums (`TRADE_ACCEPT/WAIVER/FREEAGENT/ROSTER`) | DATA-3 |
| **CONF-2** | ui | Conference in MVT + standings | Conference Awards sub-view; conference grouping in Div/League tables; `ConferenceMark` on names; hidden for non-conference leagues | CONF-1, MVT-1 |
| **DEP-4** | data | League history tables populated (later) | Multi-season via previous_league_id; past-champions row | DATA-3 |

---

## 10. Decisions & remaining opens

**Resolved 2026-08-01:** gold = shared accolade · transactions (DEP-3) in v1 · Conference = first-class
entity now (1.5-tier + sub-view in v1) · persistence = normalized tables. (See §0.)

**Still open (non-blocking for P0):**
1. **DEP-2 (player opponent/kickoff)** in the modal for v1, or defer? (rows already truncation-safe)
2. **ESPN provider tier** — best-effort second (recommended) vs co-equal. Confirm at P1.

**Research still-unresolved (telemetry-gated, not v1 blockers):** ESPN safe rate at 100k-league scale
from shared Vercel IPs; ESPN private-league error contract; ESPN public-transaction reliability; whether
Sleeper `starters`↔`roster_positions` order is contractual; best-ball/taxi/co-owner semantics; ToS/legal
review of public-only ESPN use before scaling ESPN.

**Research still-unresolved (telemetry-gated, not v1 blockers):** ESPN safe rate at 100k-league scale
from shared Vercel IPs; ESPN private-league error contract; ESPN public-transaction reliability; whether
Sleeper `starters`↔`roster_positions` order is contractual; best-ball/taxi/co-owner semantics; ToS/legal
review of public-only ESPN use before scaling ESPN.
