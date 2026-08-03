# AGENT BUILD DOC — Player Data + All-Stars + MVT + Game-Detail Rosters

**This is the single source of truth for the autonomous build. Read the whole file once, then implement
one story at a time. Do NOT open other docs to build a story — everything needed is here.** (Design
provenance, if ever needed: `MASTER-PLAYER-DATA-AWARDS-PRD.md`, `RESEARCH-espn-sleeper-data-collection.md`.)

> **Anti-drift contract:** (1) Implement only the story you picked; smallest change that passes its
> Acceptance. (2) The **Canon (§B)** and **Codebase Map (§D)** are law — do not invent alternatives. (3)
> **Done = the story's QA passes**, not a typecheck. (4) Never weaken/skip/delete a test to go green. (5)
> No fake data; no PVE hardcoding; public ESPN/Sleeper only; platform-scored points only.

---

## §0. Domain context (what you are building — assume nothing)
**LeagueWeaver v3** is a fantasy-football commissioner web app (Next.js App Router, TypeScript, Tailwind v4)
that builds a league setup, generates a fair schedule, and runs a season workspace. Today it is **team-level
only** — teams, divisions, matchups with two team scores; **no player data exists anywhere** (ESPN/Sleeper
syncs pull only each team's weekly total). This effort adds a shared **player-level dataset** from **public**
ESPN/Sleeper leagues and three features on top of it:

- **Game-detail modal roster** — clicking a matchup opens a box-score modal that lists each team's
  starters + bench with per-player points. The approved interactive design is the HTML prototype
  `game-modal-responsive-mockup.html` (see §E2).
- **All-Stars** — for each completed week, the best-scoring **started** player at **every lineup slot across
  the whole league** (a "Team of the Week"); plus a season All-Star **count per fantasy team** and a **badge**
  on the player's row.
- **MVT (Most Valuable Team)** — an **awards-points power ranking**: fantasy teams earn points across ~40
  sub-awards in four buckets (**Positional + Achievement + Divisional/League + Bonus**); the sum drives a
  leaderboard. "MVT" is the user's existing spreadsheet system, now productized. Exact award points = **§AW**.
- **"This Week"** — a new top-level page and the **home base for the current week** (first in the nav, before
  League Schedule): a headline-focused, roster-aware view of the current week's matchups; clicking a game opens
  the game-detail modal. Story **TW-1**; the modal itself is story **GDM-1**; a weekly **Results/Recap**
  (story **RW-1**) surfaces when a week finalizes.

Key nouns: a **fantasy team** = a `Team` (LeagueWeaver `Team.id`); a **matchup/game** = a `ScheduledGame`
(week, home/away team, `homeScore`/`awayScore`); a **division** groups teams; a **lineup slot** (QB, RB, WR,
FLEX, D/ST, K, HC, IDP…) is a roster position that scores. All three features read one player dataset
(§C) — build it once.

---

## §A. How the agent runs a story
1. Pick the next story whose `Blocked by` are all merged/closed.
2. Branch `agent/<STORY-ID>` off `feat/player-data-awards`.
3. Implement to the story's **Build** (insertion points in §D).
4. Run the story's **QA** + the universal gate: `npm run typecheck && npm run build && npm test`.
5. Open a PR `Closes #NN` into `feat/player-data-awards` listing each Acceptance box + the command output
   that proves the golden numbers. Auto-merge only on green `ci`.
6. If red and unfixable: open a **draft** PR + comment exactly what failed. Never force green.

---

## §B. Canon (locked decisions — do not regress)
- **Public ESPN/Sleeper only.** Private (401/403) → skip. No cookies, no auth, no HTML scraping.
- **Platform-scored points only.** ESPN `playerPoolEntry.appliedStatTotal`; Sleeper `players_points`. **No
  scoring engine.**
- **Player-centric, week-scoped immutable ownership.** A mid-season trade credits each week to that week's
  owner; prior weeks never move. Not siloed per team.
- **Two-tier storage:** one global player **catalog** + per-league **scored weekly stats**.
- **All-Star slots roster-driven** from the league's starting slots (never hardcoded). **Ties inclusive.**
- **MVT = Positional + Achievement + Divisional/League + Bonus.** Scale 8–32 teams, 1–8 divisions. **Conference
  is first-class (1.5-pt tier).**
- **Transactions (DEP-3) are in v1.**
- **No fake data.** Unsynced/manual leagues degrade; team-level MVT still computes.
- **Rating = `score10`** via `getMatchupSignal`/`toMatchupScore10`. Never a parallel rating. Every division
  name carries its `DivisionMark`; every conference name carries a `ConferenceMark`.
- **Gold = shared accolade** across GOTW + MVT + All-Stars.
- **Persistence = normalized tables** (§C).
- **Never hardcode PVE's roster/divisions/team count.**
- **Pro-gating deferred** — build every feature **fully accessible** (no paywall/access gate). Monetization
  (the Pro/free split) is decided later; do not add gates now.
- **No player photos** — use position + NFL-team-color badge (the game-detail treatment) everywhere players show.

---

## §C. Data model (canonical — inline law)

### C.1 `SlotKey` enum
```
QB TQB RB RB_WR_FLEX WR WR_TE_FLEX TE SUPERFLEX
DT DE DL LB CB S DB DP DST K P HC
FLEX IDP IDP_FLEX BENCH IR TAXI RESERVE UNKNOWN
```
**ESPN `lineupSlotId` →** 0 QB · 1 TQB · 2 RB · 3 RB_WR_FLEX · 4 WR · 5 WR_TE_FLEX · 6 TE · 7 SUPERFLEX ·
8 DT · 9 DE · 10 LB · 11 DL · 12 CB · 13 S · 14 DB · 15 DP · 16 DST · 17 K · 18 P · **19 HC** · 20 BENCH ·
21 IR · 23 FLEX. **Detect HC by slot/eligibleSlots == 19, NOT `defaultPositionId` (coaches show 14).**
**Sleeper `roster_positions` →** QB/RB/WR/TE/K same · FLEX→FLEX · WRRB_FLEX→RB_WR_FLEX · REC_FLEX→WR_TE_FLEX ·
SUPER_FLEX→SUPERFLEX · DL/LB/DB/IDP_FLEX same · DEF→DST · BN→BENCH · IR→IR · TAXI→TAXI · else UNKNOWN
(keep raw). Preserve raw provider slot + `slot_confidence ∈ {confirmed,inferred,ambiguous,bench}`.

### C.2 Identity
Internal **`leagueweaver_player_id`**. Aliases: `gsis_id` (**preferred**), `sleeper_id`, `espn_id`,
`pfr_id`, `yahoo_id`. Seed from nflverse `ff_playerids` + `mayscopeland/ffb_ids`. **No name-only matching**
(except a reviewed fallback).

### C.3 Field names
`points` (league-scored) · `projected` (ESPN optional) · `score10` (rating) · `teamId` = LeagueWeaver
`Team.id`. Sync boundary carries `league_team_id` (= LW id) + `provider_roster_id` (raw). Ownership keys on `teamId`.

### C.4 Shapes
Flat `season_player_stats` rows are canonical (engines read them). The game-detail modal's grouped
`SideVM.starters[]`/`bench[]` (`SlotVM`) is **derived at read time**. VM names: `GameDetailVM/SideVM/SlotVM`.

### C.5 Supabase (normalized; migration `074_player_awards.sql`; pattern-match `070_v3_launch_foundation.sql`)
```
player_catalog(id[=leagueweaver_player_id], canonical_name, normalized_name, position, nfl_team,
  gsis_id, sleeper_id, espn_id, status, updated_at)
season_player_stats(schedule_id, provider, provider_league_id, season, week, league_team_id,
  provider_roster_id, provider_player_id, canonical_player_id, fantasy_points, lineup_status,
  starter_index, inferred_slot, slot_confidence, is_provisional, final_lock_at, synced_at,
  source_payload_hash)  -- PK (schedule_id, season, week, league_team_id, provider_player_id)
platform_sync_runs(id, provider, schedule_id, week, status, rows_written, warnings, started_at, finished_at)
league_seasons(id, schedule_id, provider, provider_league_id, previous_provider_league_id, season,
  league_name, scoring_type, roster_positions, playoff_settings, regular_season_week_count, team_count, synced_at)
league_team_history(league_season_id, league_team_id, provider_roster_or_team_id, team_name, manager_name,
  division_id, conference_id, final_standing, wins, losses, ties, points_for, points_against)
league_schedule_history(league_season_id, week, provider_matchup_id, home_league_team_id, away_league_team_id,
  home_score, away_score, status, final_lock_at)
player_ownership_history(league_season_id, week, canonical_player_id, league_team_id, provider_player_id,
  nfl_team_at_time, position_at_time, roster_status, lineup_slot, fantasy_points)
```
Raw provider payloads → `platform_sync_snapshots` (exists; `snapshot_type ∈ {players,rosters,boxscores}`) as
**hash/traceability only**, never the award source.

### C.6 Conference entity (new, first-class)
`Conference { id, name, initials?, color, logoUrl? }`; `Team.conferenceId?`. Wire schedule setup +
`fromLegacyInput` (`college_conference_style`). `ConferenceMark` parallels `DivisionMark`. Non-conference
leagues render exactly as today.

---

## §D. Collection rules + Codebase Map (inline law)

### D.1 Collection
- **Provider order: Sleeper first, ESPN second (best-effort).**
- **Rates/etiquette:** ESPN 10–20 req/min per IP + jitter + global queue + exponential backoff on
  429/403/5xx. Sleeper cap 300–500/min. Stable User-Agent + contact email. **Per-platform kill switch.**
  Cache heavily. No cookies. No HTML scraping.
- **Budget cron:** `max_requests/max_bytes/max_seconds`, queue-claim, checkpoint, clean exit. **Team-score
  sync must never be blocked by player-sync failure.**
- **Finality:** write `is_provisional=true`; re-fetch **Tue AM / Thu AM / after day-7**; set `final_lock_at`
  only after the 7-day correction window; finalized weeks never re-fetched (except manual Refresh/admin).
- **Catalog:** refresh **daily in-season / weekly off-season, never per league.** ESPN `/players` trim
  header `X-Fantasy-Filter: {"players":{"limit":2000},"filterActive":{"value":true}}`. Sleeper `/players/nfl`
  ≤ 1/day.
- **Public/private:** pull & classify (200+`settings.isPublic`=public; 401/403=private→skip; 404/empty=invalid).
- **Schedule sync = scores-only**; store provider schedule separately; never rewrite the generated schedule.
- **Normalized translation layer:** convert provider→LeagueWeaver names/types **before** any engine/UI; UI &
  engines read only cached normalized rows.

### D.2 Codebase Map (exact seams; line numbers approximate — confirm on checkout)
- **Nav:** `components/season/SeasonWorkspace.tsx` — `ViewKey` union ~L110 · `VIEW_ITEMS` ~L170–178 · render
  switch `{view === "…" && <X/>}` ~L2187–2216 · rail maps VIEW_ITEMS ~L2149 · `?view=` validation ~L1590.
  (No separate mobile tab bar — rail collapses via CSS.)
- **Standings:** `components/season/StatsWorkspace.tsx` — inline `<table class="standings-table">` `<thead>`
  + rows ~L668 · `teamStats` useMemo ~L560 (`TeamSeasonStats` per team) · `visibleStandings` ~L593.
- **Engines/selectors:** `lib/statistics.ts` (`TeamSeasonStats` L14, `GameAnalytics` L50, badges
  `GOTW|Upset|Shootout` L48, `calculateTeamSeasonStats` L103, `getScheduleGameSignals` L291) ·
  `lib/matchups.ts` (`getMatchupSignal` L82 → `{rating,normalized,score10,bars,label}`, `toMatchupScore10`
  L34, `getGameOfWeekId` L211, `orderWeekGamesByMatchupRating`/`gameNumber` L135) · `lib/standings.ts`
  (`getEnteringWeekRankMap` L280, `resolveStandings` L152, `getLiveRankHistory` L285, `formatRecord` L363) ·
  `lib/rankings.ts` (week-1 seeds only).
- **Sync layer:** `lib/platform/sleeper.ts` (`sleeperFetch` L11, `mapSleeperScores` L49, `scanSleeperHistory`
  L33 + `hasPlayerData:false` L46) · `lib/platform/espn.ts` (`espnHeaders` L36, `fetchEspnLeague` L42,
  `mapEspnScores` L89, `scanEspnHistory` L56 + `hasPlayerData:false` L79) · `lib/platform/sync.ts`
  (`computeScheduleScores` L13) · `lib/platform/matchTeams.ts` (roster↔LW team mapping).
- **Cron/persistence:** `app/api/cron/sync-scores/route.ts` (`authorized` L25, flow L39–93, upsert
  `season_scores` onConflict `schedule_id,game_id` L77). Tables in `supabase/sql/070_v3_launch_foundation.sql`
  (`season_scores` L65, `external_league_links` L25) + `073_platform_sync_credentials.sql`
  (`platform_sync_snapshots`, `platform_provider_credentials`).
- **Types:** `lib/types.ts` (`Division` ~L22, `Team` L30–44, `ScheduledGame` L126–148, `StandingsRow` L192,
  `RankedStandingsRow` L230). `fromLegacyInput.ts` `college_conference_style` ~L44.
- **Tokens:** `app/globals.css` — `--pk-*` L22 · `--gold*` L8–10 · `--field*` L4–7 · `--strength-*` L26–27 ·
  `--text-*` L53–60 · `--radius*` L72 · `--z-modal*` L40–43. **No literals — use tokens.**
- **Components to reuse:** `EntityLogo`, `DivisionMark`/`DivisionIdentity`, `Modal` (`--z-modal-elevated`),
  reference dark surface `PlayoffPicturePanel` (`.pp-panel`).

### D.3 Test convention
Repo uses **`tsx scripts/*-matrix.ts`** wired into `npm test` (NOT vitest/jest). Add award matrices the same
way. `typecheck` = `tsc --noEmit`. UI smoke = Playwright `scripts/ui-smoke.ts` → `npm run test:ui` (uploads
`artifacts/screenshots/`).

---

## §E. Golden fixtures + numbers (the objective truth)
- **Primary:** Sleeper `856201517630328832` (+ `previous_league_id` chain) · ESPN `42654852` · ESPN
  `11593953` (HC present).
- **Scale/roster-shape:** Sleeper `1180985894268776448` (Dynasty IDP) · ESPN `1127533051` (IDP) · ESPN
  `1305` (Superflex, no K/DST).
- **Must reproduce (assert against the committed sheet, not from memory):** Wk1 All-Star total **288.42** ·
  GREEN **23** / YARDIES **17** All-Stars (confirmed in `all-stars.csv`) · GREEN tops the MVT leaderboard —
  read GREEN's actual `MVT 2.0` total + every team's bucket breakdown from `mvt-20.csv` (the PNG's 55.50 /
  DECOUPES 26.00=8+16+0+2 are the **structure**, but the exact values are whatever the committed sheet says).
- **Golden source (MVT sheet) — COMMITTED & AUTHORITATIVE.** Link:
  https://docs.google.com/spreadsheets/d/1xZItJvFRPzJdsC0GZyQna16d2SbcCTlbp4ovpDaq43w/edit . Exported to
  `scripts/fixtures/mvt-sheet/` — full `mvt-source.xlsx` (28 tabs) + key tabs as CSV: `mvt-20.csv` (MVT 2.0),
  `all-stars.csv`, `mvt-scoring.csv` (point rules), `league-standings.csv`, `settings.csv`, `weekly-scores.csv`.
  **TEST-0 asserts against these committed files; the sheet WINS over the PNG mockups (§E2) if they disagree.**
  Confirmed in the data: All-Stars Wk1 TOTAL **288.42**, GREEN **23**. ⚠ **Discrepancy:** the MVT-Overview PNG
  shows GREEN **55.50**, but the live sheet's GREEN MVT total reads **~59.50** (sheet updated since the mockup).
  **Read GREEN's actual `MVT 2.0` total from the committed CSV — do NOT hardcode 55.50.** Refresh anytime via
  `…/export?format=xlsx` or `…/gviz/tq?tqx=out:csv&sheet=<Tab>`.

---

## §E2. Visual references — build the UI to MATCH these exactly (source of truth)
- **Game-detail modal → interactive HTML prototype:** `game-modal-responsive-mockup.html` (repo root, 92 KB).
  The approved, responsive, state-aware modal: mobile full-screen w/ back-exit · tablet dialog · desktop
  2-column; states pre-draft / upcoming / live / final; auto **GOTW dark broadcast + team-color glows**; the
  week strip (logos/ranks/scores, ★/G2–G5, tap + swipe, mobile-mini); collapse-on-scroll header; the
  **PlayerRow** (slot badge, two-tone team pill/badge, opponent + kickoff, points/proj, and the **All-Star
  badge slot AS-3 fills**). This is the visual truth for the game-detail modal.
- **MVT page → static mockups:** `reference images/MVT and All Star/MVT - Overview, Page 1.png` (leaderboard,
  GREEN 55.50 top), `… Positional Awards, Page 2.png`, `… Achievement Awards, Page 3.png`,
  `… Div and League Awards, Page 4.png`, `… Bonus Awards, Page 5.png`. Truth for **MVT-2 / CONF-2**.
- **All-Star page → static mockup:** `reference images/MVT and All Star/PVE ALL-STAR TEAM OF THE WEEK.png`
  (slot rows tinted by the winning team's color + logo, "All-Stars by Team" count rail, weekly-total trend
  line). Truth for **AS-2**.
- **Match-of-the-Week PREVIEW →** `reference images/MVT and All Star/Thursday Gameday.png`. Truth for **TW-1**
  hero: headline storyline, venue + mark, seeds, records + L1 + division record, avg pts scored, key rostered
  players per team, all-time head-to-head, a "Head-to-Head Snapshot" panel (this-season / all-time / series,
  last-MOTW meeting, MOTW poll %, reg-season all-time win %), the other matchups as compact bars, and a
  MOTW-by-week season timeline. **No player photos** — use position + NFL-team-color badge per the game-detail
  treatment.
- **Weekly RESULTS/RECAP →** `reference images/MVT and All Star/Recap.png`. Truth for **RW-1**: big final
  scores, MVP + top-3 performers per team with **All-Star-of-the-Week** markers, per-matchup UPSET/BLOWOUT
  badges, and a generated **storyline recap** sentence per game (with playoff implications).
- **Current Team Ranking →** `reference images/MVT and All Star/Current Team Ranking.png` — additional
  power-ranking layout reference for **MVT-2**.
- **Playoff Picture →** `reference images/MVT and All Star/2025 Playoff Picture.png` — seeding/bracket
  reference; **adjacent** to this effort (relates to the existing playoff work + a possible playoff strip on
  TW-1). Not a v1 story here; informs TW-1 stakes storylines + future playoff surfaces.

**Fidelity rule:** port the prototype's structure + tokens; reuse app *primitives* (`EntityLogo`,
`DivisionMark`, `Modal`), **not** app *layouts* (do not substitute `MatchupCard`/`WeekScoreBar`). Match each
state × device. (Design record only, do not build from: `GAME-DETAIL-MODAL-PRD.md` §4.)

---

## §AW. Complete award catalog — EXACT points (law for AS-1 / MVT-1; do not summarize)

### AW.1 All-Stars (drives AS-1 + the Achievement "All-Star Players" award)
For each **completed** week, for each **starting slot** in the league's `LineupTemplate` (in league order,
ranked for duplicates: RB1/RB2, WR1/WR2/WR3, LB1/LB2…): the All-Star is the player with the highest
`fantasy_points` **who was actually started in that exact slot** that week (occupancy — a FLEX winner is the
best player *started in FLEX*, not the best remaining). **Ties are inclusive** — every tied player wins the
spot and gets a badge; the weekly team-total counts that slot's score **once**. Only started players; a slot
with no starter is omitted. **Weekly All-Star total** = Σ winning slot scores (Wk1 golden = **288.42**).
**Season All-Star count per fantasy team** = number of slot-wins its players earned across weeks (golden:
GREEN **23**, YARDIES **17**). The **badge**: single-count slots show an icon; ranked-duplicate slots show
icon + numeral (RB1→"1", WR3→"3").

### AW.2 MVT total
`MVT = Positional + Achievement + Divisional/League(+Conference) + Bonus`. Golden seam:
`DECOUPES 26.00 = 8 (Positional) + 16 (Achievement) + 0 (Div/League) + 2 (Bonus)`; GREEN tops at **55.50**.

### AW.3 Positional (one pair of sub-awards per **starting slot** in the league's LineupTemplate)
"Team value at a slot" = that team's own starters in that slot. Two sub-awards per slot:
| Sub-award | 1st | 2nd | 3rd |
|---|---|---|---|
| **Average** — team's season avg at the slot | 4 | 2 | 1 |
| **High Score** — team's single best week at the slot | 2 | 1 | 0.5 |
Pool scales with the **actual** roster (PVE's 8 slots × 6 = 48 max; IDP/Superflex leagues have more/fewer).
Never hardcode `{QB,RB,WR,TE,FLEX,D/ST,K,HC}` — read the LineupTemplate.

### AW.4 Achievement
| Award | Metric | 1st | 2nd | 3rd |
|---|---|---|---|---|
| MVP | single highest player score, any position/week | 4 | 2 | 1 |
| Total Score — Average | team's season avg weekly total | 8 | 4 | 2 |
| Total Score — High Score | team's single best week total | 6 | 3 | 1.5 |
| All-Star Players | season All-Star count (AW.1) | 6 | 3 | 1.5 |
| Best Record | best Game-of-the-Week (GOTW) record | 6 | 3 | 1.5 |
| Most Blowouts | count of blowout wins (**blowout = win margin ≥ 40 pts; threshold user-configurable**) | 4 | 2 | 1 |
| Most Upsets | count of upset wins | 4 | 2 | 1 |
| Most Trades | trades executed (DEP-3) | 1 | 0.5 | 0.25 |
| Waiver Wire Warrior | total transactions (DEP-3) | 1 | 0.5 | 0.25 |

### AW.5 Divisional / League / Conference (7 rows; tiers STACK)
Each row: every **division** best = **1**, every **conference** best = **1.5** (only when conferences exist),
the **league** best = **2**. A team can win its division *and* the league (1+2). Rows:
`Best Overall Record · Best Divisional Record · Best Cross-Divisional Record · Most Div/Cross-Div Sweeps ·
Longest Win Streak · Best Home Record · Best Away Record`. **Dynamic 1–8 divisions** from
`schedule.setup.divisions`: one column per real division + league column. A **1-division** league awards the
league tier only (no double-count). Tiers are **fixed** (1/1.5/2) — points do NOT inflate with team count.
Headers use real division names + `DivisionMark`; conference names + `ConferenceMark`.

### AW.6 Bonus (rating rows consume `toMatchupScore10`/`getMatchupSignal` — never a parallel rating)
| Award | Metric | Winner | Runner-up (losing/opposing team) |
|---|---|---|---|
| Best Game of the Week (GOTW) | best GOTW matchup of the season (app term is GOTW, not "MOTW") | 2 | 0.5 |
| Best Regular-Season Match | top-ranked matchup of all reg-season games | 2 | 0.5 |
| Top Ranked Matchup | #1 by matchup rating (score10); **ties → best regular-season match rank** | 2 | 0.5 |
| Largest Blowout Win Margin | max win margin | 2 | — |
| Smallest Win Margin | min positive win margin | 2 | — |
| Largest Combined Total Score | max combined-points game | 2 | 0.5 |
| Biggest Upset of the Season | lowest seed beats highest | 2 | — |
| Biggest Rank Jump Since Draft | **draft-day / preseason rank** → current rank gain | 2 | — |

### AW.7 Standings values (STD-1) — the sheet tracks four per team
`MVTS-SCORE` (MVT total, AW.2) · `MVTS-RANK` (rank by MVT total) · `ALL-STARS-COUNT` (AW.1 season count) ·
`ALL-STARS-RANK` (rank by count).

### AW.8 Configurable thresholds & definitions (single-source, no scattered literals)
- **Blowout threshold** — default **40-pt win margin**; expose as an awards/league setting read from **one
  constant/config**; used by Most Blowouts (AW.4). Never hardcode `40` in multiple places.
- **Upset** — a win by the **lower-seeded** team over the higher-seeded (by entering-week rank).
- **Draft-day / preseason rank** — the baseline for "Biggest Rank Jump" (AW.6) is the **preseason/draft rank**
  (`Team.draftPlace` / `lib/rankings.ts` week-1 seed / `preseasonRank`), **not** week-1 standings or current rank.
- **Rating awards** — consume `toMatchupScore10`/`getMatchupSignal`; "best regular-season match rank" = a
  game's score10 rank among all regular-season games (also the Top-Ranked-Matchup tiebreaker).

### AW.9 Game MVP + recap performers (display rule — used by TW-1 & RW-1; NOT an MVT award)
Distinct from the season **MVP** MVT award (AW.4). Per game, from player points that game:
- **Game MVP** = the single highest-scoring player in that game (across both teams).
- **Game of the Week:** show **top-3 performers per team** (per the Recap/`Thursday Gameday` layouts); the
  **winning team's** top scorer is labeled **MVP**.
- **All other games:** show just the single **Game MVP**.
- **All-Star denotion:** any displayed performer who is that week's **All-Star** (AW.1) at their slot gets a
  **★ All-Star-of-the-Week** marker next to their line.
- No player photos — position + NFL-team-color badge.

---

## §F. Universal QA protocol (how "done" is proven)
Every story's PR must show:
1. `npm run typecheck` ✔ · `npm run build` ✔ · `npm test` ✔ (paste tail output).
2. The story's **specific** assertion passing (e.g., the awards-matrix line printing `288.42`/`55.50`).
3. **Data/parser stories:** one real endpoint hit to *capture* a fixture, then tests run **offline** against
   the committed fixture; parsed totals cross-checked against the platform's own UI (note the number).
4. **Engine stories:** golden-matrix asserts the exact §E numbers with **no skips**.
5. **UI stories:** `npm run dev` (or `.claude/launch.json`), navigate the new route, **screenshot**, confirm
   **console is clean**, check **mobile + desktop**, and (for MVT/All-Stars) compare to the named reference
   image. Playwright smoke uploads the screenshot artifact.
6. **Degradation:** verify the unsynced/manual-league empty state and the provisional/inferred labels.
7. **Scale:** engines re-run against a non-PVE roster shape + an IDP league (§E) — no hardcoded assumptions.
**Never declare done on a typecheck alone.**

---

## §G. Stories (self-contained; implement one at a time)

Labels on each: `phase:*` `type:*` `area:*`. Milestone `Player Data + Awards v1`. `Blocked by` = the
dependency gate.

### TEST-0 · Test harness + golden fixtures  ·  `phase:P0 type:cross area:player-data`  ·  Blocked by: —
**Goal:** make CI the objective definition-of-done for every later story.
**Build:** add `scripts/awards-matrix.ts` (+ `allstar`/`mvt` splits if cleaner) wired into `npm test` as
`test:awards`; commit real JSON fixtures from §E primaries under `scripts/fixtures/` (no live calls in
tests); install Playwright + `scripts/ui-smoke.ts` (`test:ui`) writing to `artifacts/screenshots/`
(no-ops until routes exist). Pattern-match `scripts/statistics-matrix.ts`.
**Acceptance:** [ ] matrices run in `npm test`; [ ] fixtures committed; [ ] golden constants encoded
(288.42, 55.50, 26.00=8+16+0+2, 23/17) — engine-dependent assertions start `pending`, **activated (no skips)
by AS-1/MVT-1**; [ ] Playwright smoke wired; [ ] `ci.yml` green fresh.
**QA:** §F.1; show the matrix skeleton listing the golden constants; `npm run test:ui` produces an artifact.

### CONF-1 · First-class Conference entity  ·  `phase:P0 type:data area:conference`  ·  Blocked by: —  ·  ⚠ cross-cutting
**Goal:** model Conference so MVT's 1.5 tier + grouping exist without regressing non-conference leagues.
**Context:** today only `Division` (`lib/types.ts` ~L22); teams have `divisionId`, no `conferenceId`.
**Build:** add `Conference` type + `Team.conferenceId?` (§C.6); wire schedule setup + `fromLegacyInput`
(`college_conference_style` ~L44); add `ConferenceMark` beside `DivisionIdentity.tsx`.
**Acceptance:** [ ] types + optional field; [ ] setup/legacy populate conferences; [ ] `ConferenceMark`
(name never bare); [ ] standings/awards can group by conference; [ ] **non-conference leagues unchanged**.
**QA:** §F.1; run the engine/schedule matrices — existing fixtures **byte-identical output**; boot a
conference fixture and a non-conference fixture, screenshot both.
**Guardrails:** additive only; do not touch division behavior.

### DATA-1 · Canonical player data model + tables  ·  `phase:P0 type:data area:player-data`  ·  Blocked by: —
**Goal:** land the reusable player×year×week dataset with week-scoped immutable ownership.
**Build:** TS types for `SlotKey` (§C.1), `PlayerIdentity` (id=`leagueweaver_player_id`), `PlayerWeekStat`,
`LineupTemplate`, `RosterTemplate`, `SeasonPlayerDataset`; migration `074_player_awards.sql` with all §C.5
tables + indexes.
**Acceptance:** [ ] types compile; [ ] migration applies clean on fresh DB; [ ] ownership week-scoped
immutable (trade credits each week to that week's owner; prior weeks fixed); [ ] dedup by
`leagueweaver_player_id`; year-scoped.
**QA:** §F.1; apply the migration to a scratch DB and assert tables/indexes exist; a small script inserts a
traded player across 2 weeks and shows prior-week ownership unchanged.

### DATA-2 · Sleeper player parser (then ESPN)  ·  `phase:P1 type:data area:player-data`  ·  Blocked by: #DATA-1
**Goal:** parse per-player applied points + lineup slot, normalized, Sleeper first.
**Build:** `mapSleeperPlayers` beside `mapSleeperScores` (L49): from `/league/{id}/matchups/{week}` read
`starters` + `players_points`; infer slot from ordered `starters[i]`↔`roster_positions[i]` →
`starter_index`+`inferred_slot`+`slot_confidence='inferred'`; flip `scanSleeperHistory.hasPlayerData` true.
Then `mapEspnPlayers` (`views:[mRoster,mBoxscore]`, exact `lineupSlotId`, **HC=19**,
`appliedStatTotal`). Add `computeSchedulePlayers` in `sync.ts` mirroring `computeScheduleScores` (L13). All
rows through the normalization layer (§D.1).
**Acceptance:** [ ] Sleeper parser produces normalized `PlayerWeekStat`; [ ] ESPN parser (confirmed slot,
HC via 19); [ ] **parser tests match the platform UI** for Sleeper `856201517630328832` + ESPN `42654852` +
`11593953`.
**QA:** §F.1, §F.3; capture the three fixtures, assert a known player's week total equals the platform's
displayed number; show HC parsed at slot 19 on `11593953`.

### DATA-4 · Lineup + Roster templates  ·  `phase:P1 type:data area:player-data`  ·  Blocked by: #DATA-2
**Goal:** award categories = the league's own starting slots, ranked, never hardcoded.
**Build:** derive `LineupTemplate` (starting slots, league order) + `RosterTemplate` (full incl. bench/IR/
taxi) from both providers; rank duplicate slots (RB×2→RB1/RB2, WR×3→WR1/WR2/WR3, LB×2→LB1/LB2).
**Acceptance:** [ ] templates correct on §E scale fixtures (IDP, Superflex, HC); [ ] duplicate slots ranked;
[ ] Sleeper best_ball/taxi/co_owner slots flagged `inferred`.
**QA:** §F.1, §F.7; print the derived template for `1180985894268776448` (IDP) and `1305` (Superflex/no-K-DST)
and eyeball against the league settings.

### DATA-3 · Collection at scale + finality  ·  `phase:P1 type:data area:player-data`  ·  Blocked by: #DATA-1,#DATA-2
**Goal:** wire player stats into cron + Refresh with provisional→re-sync→final-lock, budget + backoff.
**Build:** add players upsert branch after the scores upsert (`sync-scores/route.ts` ~L77); provisional/
re-sync (Tue/Thu/day-7)/`final_lock_at`; budget cron (`max_requests/max_bytes/max_seconds`, queue, checkpoint);
rate/backoff/UA/kill-switch (§D.1); daily catalog refresh route with the ESPN `X-Fantasy-Filter` header.
**Acceptance:** [ ] provisional rows re-fetched on schedule, locked after day-7, never re-fetched after; [ ]
team-score sync unaffected by player-sync failure; [ ] backoff on 429/403/5xx; [ ] catalog daily not per-league.
**QA:** §F.1; simulate a correction inside the window (row updates) and after lock (row stable); force a 429
and show backoff; confirm scores still sync when the player step throws.

### AS-1 · All-Star engine `lib/allStars.ts`  ·  `phase:P2 type:engine area:awards`  ·  Blocked by: #DATA-2,#DATA-4
**Goal:** weekly best-**started**-per-slot; inclusive ties; season counts + weekly totals.
**Build:** new `lib/allStars.ts` implementing the **exact algorithm in §AW.1** (occupancy per LineupTemplate
slot, FLEX = best started in FLEX, inclusive ties badged with slot scored once, season count per team).
**Acceptance:** [ ] FLEX-slot rule; [ ] inclusive ties; [ ] only started players, empty slot omitted; [ ]
**Wk1 total = 288.42**, season **GREEN 23 / YARDIES 17**, reproduces the sheet's weekly winners.
**QA:** §F.1, §F.4; activate the pending awards-matrix assertions (no skips) — they print `288.42` / `23` /
`17` and pass. Run §F.7 on an IDP fixture (IDP slots produce all-stars).

### MVT-1 · MVT engine `lib/mvt.ts`  ·  `phase:P2 type:engine area:awards`  ·  Blocked by: #DATA-2,#DATA-4,#AS-1,#CONF-1,#DEP-3
**Goal:** `MVT = Positional + Achievement + Divisional/League + Bonus`, scale-aware, conference tier live.
**Build:** new `lib/mvt.ts` implementing **§AW.2–§AW.6 exactly** (all four buckets with the precise point
tables — Positional AW.3, Achievement AW.4 incl. All-Star Players from AS-1 + Most Trades/Waiver from DEP-3,
Div/League/Conference AW.5 with stacking 1/1.5/2 tiers, Bonus AW.6 via `toMatchupScore10`). Add ▲/▼/–
movement vs previous computation.
**Acceptance:** [ ] all four buckets; scale-aware (1-div→league only; conference col only for conference
leagues); [ ] **GREEN tops 55.50**, **DECOUPES 26.00 = 8+16+0+2**, reproduces the sheet's bucket math; [ ]
▲/▼/– movement.
**QA:** §F.1, §F.4; awards-matrix prints `55.50` and DECOUPES `8+16+0+2=26.00` and passes; run §F.7 on
Superflex + a 1-division fixture (conference tier absent, division/league correct).

### DEP-3 · Transactions (Sleeper→ESPN)  ·  `phase:P2.5 type:data area:awards`  ·  Blocked by: #DATA-3
**Goal:** unlock Most Trades + Waiver Wire Warrior.
**Build:** Sleeper `/league/{id}/transactions/{round}` → adds/drops/waivers/trades per team per week; ESPN
`mTransactions2&scoringPeriodId={week}` best-effort, classify with enum `TRADE_ACCEPT/WAIVER/FREEAGENT/
ROSTER` (**never `TRADED`**). Counts feed MVT-1.
**Acceptance:** [ ] Sleeper transactions parsed on `856201517630328832`; [ ] ESPN best-effort + telemetry-
gated; [ ] Most Trades + Waiver counts available; [ ] degrade cleanly when unavailable.
**QA:** §F.1, §F.3; print per-team trade/waiver counts for the Sleeper fixture and sanity-check against the
league's transaction log.

### STD-1 · Standings MVT + ★ columns + chips  ·  `phase:P3 type:ui area:awards`  ·  Blocked by: #MVT-1,#AS-1
**Goal:** surface MVT total + All-Star count in standings + team-schedule header.
**Build:** extend `TeamSeasonStats` (statistics.ts L14) with `mvtScore,mvtRank,allStarCount,allStarRank`;
add `mvtByTeam`/`allStarCountByTeam` useMemo near `teamStats` (StatsWorkspace ~L560); add sortable **MVT** +
**★** `<th>`/`<td>` at ~L668 (+ legend); MVT/★ chips in the team-schedule header identity block.
**Acceptance:** [ ] sortable columns + legend; [ ] chips; [ ] **team-level MVT still shows when unsynced**
(player cells degrade, not the row).
**QA:** §F.1, §F.5, §F.6; screenshot standings (synced) + an unsynced league (columns degrade gracefully);
sort by MVT works.

### MVT-2 · MVT page  ·  `phase:P4 type:ui area:awards`  ·  Blocked by: #MVT-1
**Goal:** the MVT power-ranking page (Overview + 4 detail tabs) — dark broadcast + accolade gold.
**Build:** add `ViewKey "mvt"` (SeasonWorkspace L110), `VIEW_ITEMS` entry (L170–178), render guard (~L2191);
new `components/season/MvtWorkspace.tsx` (pattern-match `MatchupRatingsView`). **MVT IS the league's power ranking** — a
math-based, unbiased "MVP of the season" (also ref `Current Team Ranking.png`, §E2). Overview = two-column
power-ranking leaderboard (rank, nick, MVT total, prev in parens, ▲/▼ movement, `EntityLogo`) **on a
power-ranking scale** (visualize each team's MVT total on a shared scale — reuse the `--strength-*` /
matchup-rating vocabulary; **gold = accolade**). Tabs: Positional / Achievement / Divisional-League(+Conference)
/ Bonus. **Previous MVT winners** row commemorating prior seasons' champions (history-dependent — show when
DEP-4/history exists, otherwise omit). Dark `--pk-*` surface, gold accents, tokens only.
**Acceptance:** [ ] appears on rail (auto on mobile); [ ] Overview matches the leaderboard layout; [ ] 4
detail tables; [ ] GREEN shows **55.50** top.
**QA:** §F.1, §F.5; `npm run dev`, open `/?view=mvt`, screenshot desktop+mobile, console clean, compare to
`reference images/MVT and All Star/MVT - Overview, Page 1.png` (+ detail pages 2–5) per §E2; verify GREEN
55.50 renders top.

### AS-2 · All-Stars page  ·  `phase:P4 type:ui area:awards`  ·  Blocked by: #AS-1
**Goal:** weekly All-Star board + by-team rail + trend.
**Build:** `ViewKey "all-stars"` + VIEW_ITEMS + render guard; new `components/season/AllStarsWorkspace.tsx`.
- **Week selector** to browse **every completed week's** All-Star Team of the Week (default = latest week).
- **Week board:** one row per slot, each highlighted by the **fantasy-team color of the team that rostered the
  player** + that team's logo + slot badge + player (position + NFL-team-color, no photos) + points.
- **"All-Stars by Team" count rail** (descending season counts).
- **Line-graph view:** the weekly-total **trend line** across the season (min red / max green; prior-year
  comparison line) — the primary "how the week stacked up" visual.
**Acceptance:** [ ] board + rail + trend + week switcher; [ ] Wk1 total **288.42**, GREEN **23** on the rail.
**QA:** §F.1, §F.5; open `/?view=all-stars`, switch weeks, screenshot desktop+mobile, console clean, compare
to `reference images/MVT and All Star/PVE ALL-STAR TEAM OF THE WEEK.png` per §E2; verify 288.42 / 23.

### GDM-1 · Game-detail modal (roster box score)  ·  `phase:P4 type:ui area:game-detail`  ·  Blocked by: #DATA-2
**Goal:** clicking a matchup opens a box-score modal listing both teams' rosters (starters + bench) with
per-player points — matching the approved prototype. This is the **DEP-1 surface** AS-3 badges into and TW-1
links to. (Only referenced before; now an explicit story.)
**Context:** matchups are team-score-only today; this builds the missing modal from real player data (§C.4).
**Build:** port `game-modal-responsive-mockup.html` (repo root, §E2) into a real React component behind the
shared `Modal` (`--z-modal-elevated`): device chrome (mobile full-screen w/ back · tablet dialog · desktop
2-col), states pre-draft/upcoming/live/final, auto-GOTW dark broadcast + team-color glows, the week strip,
collapse-on-scroll header, and the **PlayerRow** (slot badge, two-tone team pill/badge, opponent + kickoff,
points/proj, **All-Star badge slot**). Data = `GameDetailVM/SideVM/SlotVM` derived from `season_player_stats`.
Rating = `score10`; win prob = simulator `{away,home}`; stadium = real `Team.stadium`.
**Acceptance:** [ ] opens from a game; [ ] matches the prototype per **state × device × style** (§E2 fidelity);
[ ] rosters from real player data; [ ] IR/bench excluded from the matchup total; [ ] reuses app **primitives**
(`EntityLogo`/`DivisionMark`/`Modal`), **not** app layouts (no `MatchupCard`/`WeekScoreBar` swap-in);
[ ] degrades to team-level when unsynced.
**QA:** §F.1, §F.5; open the modal on synced + unsynced leagues; screenshot each state × device; compare to
`game-modal-responsive-mockup.html`; console clean. **Mark the PR "needs human visual review vs §E2."**
**Guardrails:** port structure + tokens; no fake data (no fabricated live clock/kickoff); may be split into
sub-stories if large. Design record (provenance only): `GAME-DETAIL-MODAL-PRD.md`.

### AS-3 · `<AllStarBadge>` in game-detail PlayerRow  ·  `phase:P4 type:ui area:game-detail`  ·  Blocked by: #AS-1, #GDM-1
**Goal:** the roster badge in the modal's PlayerRow.
**Build:** `components/season/AllStarBadge.tsx` (`slot,rank,week,points`): single-slot = icon; multi-slot =
icon + rank numeral (RB1→"1", WR3→"3"); tooltip "Week {w} All-Star — {slot} · {points} pts". Render in the
game-detail `PlayerRow` badge slot **exactly where the prototype shows it** — visual truth:
`game-modal-responsive-mockup.html` (PlayerRow badge slot), §E2.
**Acceptance:** [ ] rank numeral on multi-slot; [ ] tooltip; [ ] renders without layout shift.
**QA:** §F.1, §F.5; screenshot a PlayerRow with + without a badge; hover shows the tooltip.

### TW-1 · "This Week" page — current-week home base  ·  `phase:P4 type:ui area:this-week`  ·  Blocked by: #GDM-1, #DATA-2
**Goal:** a new top-level page, **FIRST in the nav (before "League Schedule")**, that is the home base for the
active week — a **headline-focused, roster-aware** view of the current week's matchups, each clickable to open
the game-detail modal (GDM-1).
**Context:** the season workspace opens to a schedule list today; there is no "what's happening now" hub. This
is that hub. Reuse existing selectors — do not reinvent rating/GOTW/ranks/win-prob.
**Build:**
- **Nav:** add `ViewKey "this-week"` as the **first** `VIEW_ITEMS` entry (before `league-schedule`) with an
  icon; make it the **default landing view** when an active/current week exists (preserve deep-links to other
  views; don't break `?view=`); route `?view=this-week`.
- **Current week:** resolve via `getCurrentSlateWeek`/`getNflWeekWindow` (`lib/schedule.ts`) + week phase
  (upcoming/live/final). Offseason/preseason → degrade to next/last week or a calm empty state.
- **Hero — Match of the Week** (visual truth: the MOTW Preview mockup, §E2): a marquee card for the GOTW with
  a generated **headline storyline**, both teams (seeds/ranks + `DivisionMark`, **records + L1 last-result +
  division record**, **avg pts scored**), **venue** (`Team.stadium` + mark), **win-probability bar**, **rating
  `score10`**, GOTW dark/gold treatment, and **key players per team** (position + NFL-team-color badge — **NO
  player photos**) from DATA-2 — upcoming: projected leaders; **live/final: top-3 performers + MVP with ★
  All-Star denotion (§AW.9)** → click opens the game-detail modal.
- **Head-to-Head Snapshot panel** (from the MOTW preview): the season series between the two GOTW teams
  (this-season H2H + record vs the field), the last GOTW meeting + winner, and the season MOTW-by-week
  timeline (`getGameOfWeekId` per week). ⚠ **All-time** H2H / last-MOTW-across-seasons / reg-season all-time
  win% need **history (DEP-4)** — show this-season now, all-time when history lands. **MOTW fan-poll %** and
  the **sponsor slot** are optional/future — omit in v1 unless trivially available.
- **Headline/storylines strip:** the week's narrative from existing signals — closest game, biggest projected
  blowout, upset watch, stakes (1st-place / clinch / elimination), standout rostered players — via
  `getMatchupSignal`, `getScheduleGameSignals` badges (Upset/Shootout), standings.
- **Layout — Featured ↔ Grid (default Featured):** the default view gives **~80% to the GOTW hero** + a compact
  **~20% strip** of the other matchups. A **toggle button** shrinks the GOTW to a normal card and renders **all
  matchups equal-size**, scroll/tap through them, each opening the modal. Persist the choice; animate the shrink.
- **Slate cards:** each matchup card = teams, ranks, live/proj/final scores, win prob, GOTW/badges, and — when
  live/final — the **Game MVP (+ ★ All-Star denotion)** per **§AW.9** → opens the **game-detail modal (GDM-1)**.
- **Roster detail:** each card surfaces a glimpse beyond the team score — e.g., each side's top scorer /
  projected leader / the game's All-Star — from player data (DATA-2). **Degrade to team-level when unsynced.**
- new `components/season/ThisWeekWorkspace.tsx`.
**Acceptance:** [ ] "This Week" is **first** in the rail (before League Schedule) + default landing in-season;
[ ] current week + phase correct; [ ] GOTW hero + headline strip; [ ] **every matchup card opens the
game-detail modal**; [ ] roster glimpse when synced, team-level when not; [ ] offseason empty state; [ ] mobile
parity; tokens only (no literals); one clear nav layer (AGENTS.md).
**Insertion points:** `components/season/SeasonWorkspace.tsx` (`ViewKey` L110 — add first; `VIEW_ITEMS`
L170–178 — first entry; render guard ~L2191; default-view/`initialView` logic ~L1421/L1590 — land on
`this-week` in-season without breaking deep-links); `lib/schedule.ts` (`getCurrentSlateWeek`); reuse GDM-1 modal
+ `getMatchupSignal`/`getGameOfWeekId` + simulator win-prob + `getEnteringWeekRankMap` + DATA-2 rosters +
`DivisionMark`/`EntityLogo`.
**QA:** §F.1, §F.5; `npm run dev`, open `/?view=this-week` — verify it's **first** in the rail and the default
landing in-season; current week + status correct; GOTW hero renders; **click a game → the modal opens**; roster
glimpse on a synced league vs team-level on unsynced; offseason empty state; screenshot desktop + mobile;
console clean.
**Guardrails:** reuse the modal + existing selectors, don't reinvent; **no fabricated data** (no fake
kickoff/roster/live); degrade gracefully offseason/unsynced; don't hardcode PVE; keep one navigation layer.

### RW-1 · Weekly Results / Recap  ·  `phase:P4 type:ui area:this-week`  ·  Blocked by: #GDM-1, #AS-1, #MVT-1
**Goal:** when a week **finalizes** (all its games final), surface a **Results/Recap** view that summarizes the
week — headline outcome, the Match-of-the-Week result, and every matchup's score + MVP + All-Star + badges +
a storyline sentence. Visual truth: the Weekly Results mockup (§E2). Reachable from "This Week" (TW-1) and via
`?view=results` / a "Week N Recap" entry; **auto-prompts when the week completes**.
**Build:**
- **Trigger:** detect week-complete (all games `final`, per §F/scores); show a "Week N — Final" recap state
  (a page/panel, and a light prompt from TW-1). Offseason/mid-week → not shown.
- **MOTW result hero:** the GOTW's big **final scores**, winner, updated head-to-head, and its performers per
  **§AW.9** (top-3 per team, winner's top = MVP, ★ All-Star-of-the-Week denotion from AS-1) → click opens the
  game-detail modal.
- **All matchups:** each with seeds/records, final scores + winner, the **single Game MVP + ★ All-Star marker
  (§AW.9)**, **UPSET / BLOWOUT badges** (`getScheduleGameSignals` → Upset; Blowout via the §AW.8 margin≥40
  config), and a
  **generated storyline recap sentence** (templated from real signals: winner, margin, upset, MVP, and
  playoff implications).
- **Playoff implications in recaps** (e.g., "secures the bye," "eliminated," "faces X in the Wild Card"):
  source from the clinch/stakes logic. ⚠ v1 = **data-driven templated recap** (winner/margin/upset/MVP/
  standings move); rich clinch/elimination phrasing depends on the **Stakes/clinch engine** (see
  `stakes-engine-scope.md`) — gate the playoff-implication sentences on it, degrade to the result summary
  without them.
- new `components/season/WeekRecapWorkspace.tsx` (or a recap mode of TW-1).
**Acceptance:** [ ] appears only when the week is final; [ ] MOTW result hero with MVP/top-3 + All-Star
markers; [ ] every matchup shows score + MVP + All-Star + UPSET/BLOWOUT + a recap sentence; [ ] cards open the
modal; [ ] playoff-implication phrasing present when the stakes engine exists, omitted (not faked) otherwise;
[ ] mobile parity; tokens only.
**Insertion points:** `components/season/SeasonWorkspace.tsx` (ViewKey/VIEW_ITEMS/render guard for a recap
entry; TW-1 prompt hook); reuse GDM-1 modal + AS-1 + MVT-1 (MVP) + `getScheduleGameSignals` (badges) +
`getEnteringWeekRankMap` + player data (DATA-2); optional `lib/clinch*`/stakes for playoff lines.
**QA:** §F.1, §F.5; force a fully-final week fixture → recap appears with correct scores/MVP/All-Star/badges;
verify a non-final week does NOT show it; compare to the Weekly Results mockup (§E2); screenshot desktop+mobile.
**Guardrails:** **no fabricated recaps or playoff claims** — every sentence traces to a real signal; omit what
you can't source; reuse the modal + selectors; don't hardcode PVE.

### CONF-2 · Conference in MVT + standings  ·  `phase:P4 type:ui area:conference`  ·  Blocked by: #CONF-1,#MVT-1
**Goal:** surface the conference tier + grouping.
**Build:** Conference Awards sub-view in `MvtWorkspace`; conference grouping in the Div/League table;
`ConferenceMark` on names; hide entirely for non-conference leagues.
**Acceptance:** [ ] sub-view + grouping; [ ] mark on names; [ ] hidden for non-conference; [ ] 1.5 tier in
totals only for conference leagues.
**QA:** §F.1, §F.5; screenshot a conference league (sub-view present) + a non-conference league (absent).

### UI-1 · Brand + degradation + mobile parity  ·  `phase:P5 type:ui area:awards`  ·  Blocked by: #STD-1,#MVT-2,#AS-2
**Goal:** dark broadcast chrome + accolade gold + graceful empty states.
**Build:** `--pk-*` surfaces; **gold = shared accolade** (GOTW+MVT+All-Stars); `--strength-*` for ranked
signals (never red); tokens only. Match the broadcast dark + gold + team-color-glow treatment demonstrated in
`game-modal-responsive-mockup.html` (GOTW state) and `reference images/MVT and All Star/*` per §E2. Degradation: unsynced/manual → "connect a public ESPN/Sleeper league"
empty states; provisional weeks labeled; inferred slots softened. `<PointChip>` primitive. Mobile card parity.
**Acceptance:** [ ] tokens (no literals); [ ] empty/provisional/inferred states; [ ] mobile parity.
**QA:** §F.1, §F.5, §F.6; screenshot each empty/provisional state; mobile + desktop for MVT + All-Stars.

### X-1 · Scale + roster-shape verification  ·  `phase:cross type:cross area:awards`  ·  Blocked by: #MVT-1
**Goal:** prove no PVE hardcoding.
**Build:** none new — a verification story: run the engines against the §E scale fixtures + a 1-division league.
**Acceptance:** [ ] passes on IDP + Superflex + large + 1-division; [ ] conference tier only when the entity
exists; [ ] division tiers scale 1–8; [ ] no PVE assumptions in the engines.
**QA:** §F.7; matrix runs green across all scale fixtures; grep the engines for hardcoded team/div/slot counts (none).

### DEP-4 · League history tables populated  ·  `phase:P6 type:data area:player-data`  ·  Blocked by: #DATA-3  ·  (v2/later)
**Goal:** multi-season traversal + past-champions.
**Build:** populate the §C.5 history tables by walking `previous_provider_league_id`; past-champions row on
MVT/All-Stars pages; treat ESPN pre-2018 no-cookie as unreliable (skip/flag).
**Acceptance:** [ ] history populated across seasons; [ ] past-champions row; [ ] pre-2018 ESPN flagged.
**QA:** §F.1; walk the Sleeper `previous_league_id` chain and show ≥2 prior seasons captured.

### HIST-1 · Historical MVT / All-Stars browser  ·  issue:#136  ·  `phase:P7 type:ui area:history`  ·  Blocked by: #DEP-4,#MVT-2,#AS-2
**Goal:** let commissioners browse prior-year award boards without inventing missing data.
**Build:** add a season selector to MVT and All-Stars. MVT shows the selected season's leaderboard + award
tables from saved `league_seasons` / award rows when present. All-Stars adds season + week selection and shows
that historical week's board plus that season's team selection counts. If a season has no saved history rows,
show a clear empty state and a safe "sync history" action only for public ESPN/Sleeper connections.
**Acceptance:** [ ] MVT season selector; [ ] All-Stars season + week selector; [ ] uses only saved provider-scored
history; [ ] missing years/weeks are empty, never fabricated; [ ] current-season default remains unchanged.
**QA:** §F.1, §F.5; use the committed Sleeper history fixture to prove at least two prior seasons appear; screenshot
MVT desktop + All-Stars mobile for current season, historical season, and missing-data state.

### HIST-2 · Previous schedule browser  ·  issue:#137  ·  `phase:P7 type:ui area:history`  ·  Blocked by: #DEP-4
**Goal:** let commissioners open previous schedules when LeagueWeaver has real saved schedules or provider matchup
history for that season.
**Build:** add a previous-schedules entry point from the season workspace. If a historical LeagueWeaver schedule is
saved, open that schedule. If only provider history exists, show a read-only provider-history schedule using
`league_schedule_history` rows with provider matchup labels and scores. Do not generate replacement matchups for
missing seasons.
**Acceptance:** [ ] previous schedule list; [ ] saved LeagueWeaver schedules open normally; [ ] provider-history-only
seasons open read-only; [ ] missing seasons clearly explain there is no saved schedule; [ ] no fake generated matchups.
**QA:** §F.1, §F.5; fixture-backed schedule-history rows render ≥2 prior seasons; screenshot saved-schedule,
provider-history-only, and missing-data states.

### GDM-2 · Game card opens box score directly  ·  issue:#138  ·  `phase:P7 type:ui area:game-detail`  ·  Blocked by: #GDM-1,#TW-1
**Goal:** remove duplicate box-score buttons and make the game card itself the click target.
**Build:** remove the separate "Box score" button from game/team cards where the full card can safely open the
game-detail modal. Preserve keyboard access with a single focusable card/button pattern and an accessible label.
Clicking or pressing Enter/Space on a live-week game opens the game-detail modal for that week.
**Acceptance:** [ ] no redundant box-score button on team/game cards; [ ] clicking the card opens the game detail;
[ ] keyboard activation works; [ ] live-week games open the same modal; [ ] no layout shift on cards.
**QA:** §F.5, §F.6; Playwright clicks a This Week card and a schedule/team card; keyboard activates the card;
screenshots desktop + mobile with no extra box-score button.

### GDM-3 · Navigate week games inside modal  ·  issue:#139  ·  `phase:P7 type:ui area:game-detail`  ·  Blocked by: #GDM-2
**Goal:** let commissioners move through every game in the selected week without closing the modal.
**Build:** add Previous/Next game controls inside the game-detail modal, scoped to the current week. Preserve the
selected week and modal state. Disable controls at the first/last game or wrap only if the UI clearly labels it.
Keep focus management accessible after navigation and update the dialog title/score/rosters immediately.
**Acceptance:** [ ] previous/next controls in modal; [ ] navigates all games in the current week; [ ] title, teams,
score, rosters, All-Star/MVT badges update; [ ] focus remains inside the dialog; [ ] mobile controls are 44px+.
**QA:** §F.5, §F.6; Playwright opens a live-week modal, clicks through all games in the week, verifies the title
changes each time, and screenshots desktop + mobile.

---

## §H. Run order (dependency graph)
**Start (P0, parallel):** `TEST-0` (keystone) · `CONF-1` · `DATA-1`. Then, by dependency:
- `DATA-1` → **`DATA-2`** → `DATA-4`
- `DATA-1`,`DATA-2` → `DATA-3` → **`DEP-3`**
- `DATA-2` → **`GDM-1`** (game-detail modal) → `AS-3` (badge) · **`TW-1`** ("This Week" hub)
- `GDM-1`+`AS-1`+`MVT-1` → **`RW-1`** (weekly Results/Recap — surfaces when a week finalizes)
- `DATA-2`,`DATA-4` → **`AS-1`** → `AS-2` ; and `AS-1`+`CONF-1`+`DEP-3` → **`MVT-1`** → `STD-1` · `MVT-2` · `X-1`
- `CONF-1`+`MVT-1` → `CONF-2`
- `STD-1`+`MVT-2`+`AS-2` → **`UI-1`** (brand pass also covers GDM-1/TW-1 surfaces)
- `DATA-3` → `DEP-4` (v2/later)
- `DEP-4`+`MVT-2`+`AS-2` → **`HIST-1`** → `HIST-2`
- `GDM-1`+`TW-1` → **`GDM-2`** → `GDM-3`

Full blocked-by: AS-3 ← AS-1, GDM-1 · TW-1 ← GDM-1, DATA-2. Label `agent:build` on ready stories
(TEST-0, CONF-1, DATA-1 first); blocked stories are held automatically until their `Blocked by` issues close.
