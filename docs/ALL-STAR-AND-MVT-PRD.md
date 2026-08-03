# All-Stars + MVT — Implementation PRD (grounded in the current site)

**Author:** design/build session · **Date:** 2026-08-01
**Ships with:** the Matchup-Rating-Scale session and the Fantasy-Player-Data prototype session — one combined release.
**Reference source of truth:** the user's "MVC/MVT" Google Sheet (All-Star Team of the Week + MVP 2.0 tabs) and the six brand graphics in `reference images/MVT and All Star/`.

This PRD is written to **mesh with** `docs/GAME-DETAIL-MODAL-PRD.md`. Both features consume the same
player-data seam that PRD calls **DEP-1** (per-player rosters, starters, per-player points, position/team,
head-coach row). This document extends DEP-1 from *one game* to *the whole season, all teams, all weeks*,
adds a small **DEP-3** (league transactions) for two secondary awards, and adds **DEP-4** (league history
snapshots) so future season/team/player history can be built without reworking the data model. Read §6 first if
you own the data layer.

---

## 1. The one decision that governs everything

**Everything in this PRD is a computed leaderboard over player-level data we do not have today.** The team-level
schedule model (`homeScore`/`awayScore` totals) can back *some* MVT awards, but the headline features —
the weekly All-Star team and every positional/MVP award — require per-player weekly scores by position for
every starting lineup in the league. That is exactly the roster data the **Fantasy-Player-Data prototype
session** is standing up (DEP-1).

So the governing rule is: **build the All-Star engine, the MVT engine, the two pages, and the standings columns
against a single normalized season-wide player-data contract (§6). When DEP-1 lands, the features light up with
zero rework. Until then, every surface degrades gracefully** (§7) — awards with no data source are hidden, not
faked. This honors the project's no-fake-data rule (see the AdSense/no-fake-ads and week-score-bar precedents).

**Non-negotiable:** no invented players, scores, transactions, or all-star picks. A team with no synced player
data shows an empty/"needs player data" state, never placeholder athletes.

---

## 2. What already exists (reuse — do not rebuild)

| Need | Backed by (exists today) |
|---|---|
| A new in-app page/tab | `VIEW_ITEMS` + `ViewKey` + content router in `components/season/SeasonWorkspace.tsx` (109, 169-177, 2180-2200); `selectView()` pushes `?view=` (2069-2077) |
| A computed-score page pattern (summary strip + desktop table + mobile card list) | `MatchupRatingsView` (`SeasonWorkspace.tsx:578-655`) — **the template for both new pages** |
| /10 score normalization | `toMatchupScore10`, `matchupScoreBounds`, `weekSlateScore10` (`lib/matchups.ts:26-46`) |
| Standings table (add columns/badges here) | `StatsWorkspace.tsx:668` (`<table class="data-table standings-table">`), sortable via `SortHeader`/`sortableValue` (214, 530) |
| Team season stats (blowouts, upsets, streaks, home/away, div records, GOTW record) | `calculateTeamSeasonStats` + `TeamSeasonStats` (`lib/statistics.ts:14-27,103`); `getScheduleGameSignals` (upset/blowout signals, `statistics.ts:291`) |
| Draft-day / week-one rank (for "Biggest Rank Jump") | `getWeekOneRankMap`/`lib/rankings.ts`; live rank history `getLiveRankHistory` (`lib/standings.ts`) |
| GOTW / "Match of the Week" selection + game number | `getGameOfWeekSelection`, `getGameOfWeekId`, `gameNumber` (`lib/matchups.ts:135-213`) |
| Dark "broadcast" surface (matches the MVT/All-Star graphic aesthetic) | `--pk-*` tokens + `.pp-panel` (`globals.css:20-22`, `PlayoffPictureModal.tsx`) |
| Team logo / division mark | `EntityLogo` (`components/ui/EntityLogo.tsx`), `DivisionMark`/`DivisionIdentity` (`components/ui/DivisionIdentity.tsx`) — **DivisionMark must accompany every division name** (division-mark-always) |
| Adaptive team colors | `readableTextColor`, `accessibleTeamColor`, `accessibleAccentColor`, `tintColor` (`lib/colorContrast.ts`) |
| Strength/quality visualization | green→gray `--strength-fg`/`--strength-bg` scale, `--sig-t` interpolation, **never red** (`globals.css:23-27`) |
| Point formatting | `formatPoints` (2-decimal, thousands-grouped, drift-safe) (`statistics.ts:77`) |

**Implication:** the page shell, tables, standings, records, streaks, blowouts/upsets, GOTW, ranks, division
marks, logos, and the dark theme are **already in the codebase**. The new work is (a) two engines, (b) two
pages, (c) standings columns, (d) a roster badge — all fed by DEP-1/DEP-3.

---

## 3. Feature A — All-Stars

### 3.1 What it is
A season-long **"Fantasy Weekly All-Stars"** feature (see `PVE ALL-STAR TEAM OF THE WEEK.png`). For each
completed week, the app picks the highest-scoring **started** player at each lineup slot across the *entire
league*, attributes each pick to the team that started them, and tallies a season-long **All-Star count per team**.

### 3.2 The weekly All-Star team is **roster-driven** (not hardcoded)
**The slot template comes from the user's own league lineup settings — never from a fixed list.** The PVE
example (QB×1, RB×2, WR×3, TE×1, FLEX×1, D/ST×1, K×1, HC×1) is *this user's* roster; a different league with,
say, 2 QBs, 1 RB, 2 WR, 2 FLEX and no K must produce a 2-QB / 1-RB / 2-WR / 2-FLEX / no-K All-Star team
automatically. An IDP league with DL/LB/DB/IDP_FLEX slots must produce defensive All-Star and MVT categories
too. The engine reads a `LineupTemplate` (the starting-slot shape) synced from the platform and builds exactly
that many slots, in the league's own order.

```ts
interface LineupTemplate {
  slots: Array<{ slot: SlotKey; count: number; rawProviderSlot?: string | number; confidence: "confirmed" | "inferred" }>;
}
interface RosterTemplate {
  // Full roster shape for import/history/count validation. Includes non-award slots.
  slots: Array<{ slot: SlotKey; count: number; rawProviderSlot?: string | number; group: "starter" | "bench" | "ir" | "taxi" | "reserve" | "unknown"; confidence: "confirmed" | "inferred" }>;
}
type SlotKey =
  | 'QB'|'TQB'|'RB'|'WR'|'TE'|'FLEX'|'WR_TE_FLEX'|'SUPERFLEX'
  | 'DST'|'K'|'P'|'HC'
  | 'DT'|'DE'|'DL'|'LB'|'CB'|'S'|'DB'|'IDP'|'IDP_FLEX'
  | 'BENCH'|'IR'|'TAXI'|'RESERVE'
  | string; // extensible; preserve unknown provider values
```

- **Where it comes from:** the platform sync. ESPN/Sleeper both expose lineup-slot settings; map them into
  `LineupTemplate`. This makes the feature correct for *any* league, not just PVE.
- **Ranked vs single:** any slot with `count > 1` is ranked (RB1/RB2, WR1/WR2/WR3, FLEX1/FLEX2…); `count === 1`
  slots are single. The rank numeral drives the roster badge (§3.5).
- **IDP / defensive slots are first-class:** DL, LB, DB, CB, S, DT, DE, DP, IDP, and IDP_FLEX are collected,
  displayed, and scored for awards when they exist in the league's starting lineup.
- **Bench/IR/taxi count logic still matters:** collect and count every non-starter roster bucket in a
  `RosterTemplate` for import validation, roster capacity, ownership history, and future roster tools. ESPN
  exposes Bench as slot `20` and IR as slot `21`; Sleeper exposes `BN`, `IR`, and sometimes `taxi`/reserve
  arrays. These rows are history/count rows, not award rows.
- **Bench/IR/taxi are excluded from starter awards:** All-Stars and MVT positional awards use the starting
  `LineupTemplate` only unless a provider explicitly treats the format as best ball.
- **HC (Head Coach)** is a real scoring slot in this league, **ESPN-only** (the modal PRD already lists the HC
  row as ESPN-only DEP-1). ESPN catalog validation showed coach rows with `defaultPositionId:14` and
  `eligibleSlots:[19,20,21]`, so detect HC by `lineupSlotId === 19` or eligible slot `19`. If a league's
  template has no HC/K/etc., those slots simply don't exist that season.

> **Gating:** because the slot template *and* the player scores both come from a synced platform, the entire
> All-Star feature (and the player-fed half of MVT) is **available only for leagues attached to a _public_ ESPN
> or Sleeper league** (private leagues are out of scope — they'd require auth cookies we won't handle; confirmed
> keyless-public-only in §6.7). Manual-entry leagues never get player awards (see §7 and open decision §13.7 on a manual
> roster-builder step is ever worth adding — recommendation: **no** for this release; it's high-friction
> manual entry for 11+ slots × N teams × every week).

### 3.3 Selection algorithm
For each completed week `w`, using the league's `LineupTemplate`:
1. Collect every player who was **in a starting slot** for **any** team that week, carrying the **slot they
   actually occupied**: `{playerId, name, position, nflTeam, fantasyTeamId, points, startedSlot}`.
2. Fill each template slot **from the pool of players who were started in that same slot** — position occupancy,
   not eligibility:
   - `QB` slot ← highest-scoring player **started at QB**; take top `count`.
   - `RB`/`WR`/`TE`/`DST`/`K`/`HC`/`DL`/`LB`/`DB`/all other exact slots likewise, from players started in that exact slot.
   - **`FLEX` ← highest-scoring player who was actually *started in a FLEX slot* that week** — NOT "best
     remaining RB/WR/TE." A stud RB started at RB is an RB all-star; only a player a manager chose to slot at
     FLEX can be a FLEX all-star. (Same rule governs the MVT FLEX positional award, §4.2.)
   - **Utility defensive slots** like `DP`/`IDP_FLEX` follow the same rule: a player must have occupied that
     utility slot to win that utility-slot award.
3. Each filled slot is an **All-Star selection**, attributed to that player's `fantasyTeamId` **for that week**
   (ownership is week-scoped — see §6), tagged with its slot rank (count=1 → rank 1; RB1=1, RB2=2, WR3=3…).
4. **Weekly total** = sum of each slot's winning score, once per slot (the graphic's per-week "TOTAL", e.g.
   Wk1 = 288.42). Track season min/max/avg for the trend line.

**Ties are inclusive (co-winners).** If two or more players tie for the score at a spot, **all of them win that
spot** — each is a full All-Star selection for their own team, and each renders the badge at that rank. (This
can push a week above the nominal slot count; that's intended, and differs from the original spreadsheet, which
couldn't express it.) The weekly **total** still counts the tied slot's score once, so the trend stays
comparable. A tie that spills into the next rank (e.g. two players tie for RB1) fills that rank with all tied
players and the next rank continues from the following distinct score.

**Eligibility:** only **started** players count (bench excluded) — "based on players rostered **and starting**."
A slot with no eligible player is omitted for that week.

### 3.4 Season "All-Stars by team" count
`allStarCount[teamId]` = number of weekly selections that team earned across all completed weeks (graphic
right rail: GREEN 23, YARDIES 17 …). This single number:
- ranks teams on the All-Stars page,
- appears in the **standings** table (§5),
- feeds the MVT **"All Star Players"** achievement award (§4.3).

### 3.5 The roster badge (the icon the user asked for)
When a player was an All-Star **in a given week**, they render an **All-Star badge** wherever that week's roster
is shown (primary consumer: the Game Detail Modal roster rows from the modal PRD; also the All-Stars page and
any future roster view).
- **Single-slot positions (QB/TE/FLEX/D/ST/K/HC):** icon only.
- **Multi-slot positions (RB, WR):** the **same icon with the rank numeral** (1/2/3) — RB1 shows "1", WR3
  shows "3", per the user's spec.
- Badge tooltip: "Week {w} All-Star — {slot} · {points} pts".
- This is a new shared primitive: `<AllStarBadge slot rank week points/>` in `components/season/` (sits
  beside `GameBadgeChip`). The Game-Detail modal roster row (`PlayerRow`, modal PRD §5) renders it inline.

### 3.6 The All-Stars page
New tab **"All Stars"**. Layout, brand-translated from the graphic (§8):
- **Week selector** (reuse the existing week-selector pattern; default = latest completed week).
- **The 11-slot All-Star board** for the selected week: each row = slot label chip · player · score · the
  attributed team's logo, the row tinted with that team's adaptive color.
- **"All-Stars by team" rail/summary** (season cumulative counts, ranked, green→gray strength scale).
- **Weekly total trend** (season line of weekly All-Star totals, min/max annotated). Optional v1.1.
- Mobile: slot board becomes a card list (mirror `matchup-ratings-cards`).

---

## 4. Feature B — MVT (Most Valuable Team)

### 4.1 What it is
An **awards-points power ranking** (see the five `MVT - *.png` pages). Teams earn MVT points across ~40
sub-awards in four buckets; the MVT total = sum of the four buckets and drives a season leaderboard
(`MVT - Overview`). Each award has a full 1st/2nd/3rd (or division/league) point breakdown shown on four
detail pages.

```
MVT total = Positional + Achievement + Divisional/League + Bonus
```
The sheet's Overview confirms the seam: e.g. `DECOUPES 26.00 = 8.00 (Positional) + 16.00 (Achievement)
+ 0.00 (Div/League) + 2.00 (Bonus)`.

### 4.2 Positional awards (`MVT - Positional Awards, Page 2`)
For **each starting slot in the league's `LineupTemplate`**, create two sub-awards. The reference graphic shows
8 positions `{QB, RB, WR, TE, FLEX, D/ST, K, HC}`, but that is only the PVE league's roster. If a connected
league starts `DL`, `LB`, `DB`, `IDP_FLEX`, `SUPERFLEX`, `WR_TE_FLEX`, `P`, or any other platform-supported
slot, that slot becomes MVT-collectible too. "Team value at a position" = that team's own starters in that slot
(season **average**, and single-week **high score**).

| Sub-award | 1st | 2nd | 3rd |
|---|---|---|---|
| **Average** (team's season avg at position) | 4 | 2 | 1 |
| **High Score** (team's single best week at position) | 2 | 1 | 0.5 |

Max positional = `LineupTemplate` award slots × `(4+2)`. For PVE, that is 8 positions × 6 = 48. For an IDP or
Superflex league, the available positional pool grows or shrinks with that league's actual roster.

### 4.3 Achievement awards (`MVT - Achievement Awards, Page 3`)

| Award | Metric | 1st | 2nd | 3rd |
|---|---|---|---|---|
| **MVP** | single highest player score, any position/week | 4 | 2 | 1 |
| **Total Score — Average** | team's season avg total | 8 | 4 | 2 |
| **Total Score — High Score** | team's single best week total | 6 | 3 | 1.5 |
| **All-Star Players** | season All-Star count (§3.4) | 6 | 3 | 1.5 |
| **Best Record** | best Match-of-the-Week (GOTW) record | 6 | 3 | 1.5 |
| **Most Blowouts** | count of blowout wins | 4 | 2 | 1 |
| **Most Upsets** | count of upset wins | 4 | 2 | 1 |
| **Most Trades** | trades executed | 1 | 0.5 | 0.25 |
| **Waiver Wire Warrior** | total transactions | 1 | 0.5 | 0.25 |

### 4.4 Divisional / League / (Conference) awards (`MVT - Div and League Awards, Page 4`)
Per row: **each division's** best earns 1 pt, **and the league's** best earns 2 pts. A team can win its
division *and* the league (stacks: 1 + 2). Rows:

| Award | Per-division winner | (Per-conference winner) | League winner |
|---|---|---|---|
| Best Overall Record | 1 | 1.5 | 2 |
| Best Divisional Record | 1 | 1.5 | 2 |
| Best Cross-Divisional Record | 1 | 1.5 | 2 |
| Most Div/Cross-Div Sweeps | 1 | 1.5 | 2 |
| Longest Win Streak | 1 | 1.5 | 2 |
| Best Home Record | 1 | 1.5 | 2 |
| Best Away Record | 1 | 1.5 | 2 |

**Scale (must handle): 8–32 teams, 1–8 divisions.** This category is fully **dynamic** — it renders one column
per division that actually exists (from `schedule.setup.divisions`) plus the league column. A 1-division league
collapses "division" and "league" (award the league tier only, no double-count). An 8-division / 32-team league
renders 8 division columns + league. Never hardcode "Prodigies/Esteemed/PVE FFL." Column headers use real
division names + `DivisionMark` (division-mark-always). Points **do not** inflate with team count — the tiers
(1 / 2) are fixed per award; more divisions just means more 1-pt slots exist, which is the intended design.

**Conference tier (new MVT category, conditional).** When a league is **conference-structured** (divisions
grouped into conferences), add a **mid-tier award between division and league**: every divisional award gains a
**per-conference counterpart** worth **1.5 pts** (between the 1-pt division and 2-pt league tiers), and MVT gains
a **"Conference Awards" sub-view** mirroring the Div/League page. This is purely additive — more points earnable
— and only appears when conferences exist.

> ⚠️ **Dependency:** the app does **not** model conferences today. `lib/types.ts:22` has `Division` only; teams
> carry `divisionId` (no `conferenceId`), and "conference" appears only as a *scheduling* option
> (`fromLegacyInput.ts:44` `college_conference_style`). The conference tier is **gated on a `Conference` entity
> being added** (this belongs with the large-league-expansion work — [[large-league-expansion]]). Until then,
> the conference column is omitted and the Div/League category behaves exactly as the 2-tier table above. **This
> is flagged as pre-work in §6.4 / open decision §13.** Do not build the conference tier before the model lands.

### 4.5 Bonus awards (`MVT - Bonus Awards, Page 5`)

| Award | Metric | Winner | Runner-up (losing/opposing team) |
|---|---|---|---|
| Best MOTW | best Game-of-the-Week matchup | 2 | 0.5 |
| Best Regular-Season Match | top-ranked matchup of all reg-season games | 2 | 0.5 |
| Top Ranked Matchup | #1 by matchup rating | 2 | 0.5 |
| Largest Blowout Win Margin | max margin | 2 | — |
| Smallest Win Margin | min positive margin | 2 | — |
| Largest Combined Total Score | max combined points game | 2 | 0.5 |
| Biggest Upset of the Season | lowest seed beats highest | 2 | — |
| Biggest Rank Jump Since Draft | draft rank → current rank gain | 2 | — |

> "Best Match / Top Ranked / Best MOTW" all lean on the **matchup rating scale** the sibling session is
> finalizing. **Consume `toMatchupScore10`/`getMatchupSignal` — do not re-derive a rating.** This is the
> primary meshing point with the rating-scale PRD.

### 4.6 The MVT page
New tab **"MVT"**. It is a **swipeable/tabbed multi-view** mirroring the five graphics:
`Overview · Positional · Achievement · Divisional/League · Bonus` (sub-nav within the MVT view; the graphics
literally show this bottom tab bar + "SWIPE >").
- **Overview** = the MVT power ranking leaderboard: rank, team, MVT total, bucket breakdown, movement arrow
  (▲/▼/–) vs previous computation. This is a `MatchupRatingsView`-shaped page (summary strip + table + mobile
  cards).
- The other four = award-detail tables (Category × 1st/2nd/3rd, or × divisions), each cell showing the winning
  team's logo, the metric value, and the points chip — exactly as the graphics lay them out.

---

## 5. Feature C — Standings integration

Add to the standings table (`StatsWorkspace.tsx:668`) two team-attributed values the sheet already tracks
(`MVTS-RANK`, `MVTS-SCORE`, `ALL-STARS-RANK`, `ALL-STARS-COUNT` in the sheet's standings block):

1. **MVT** — the team's MVT total (and its MVT rank). Sortable column via `SortHeader`/`sortableValue`.
2. **All-Stars (★)** — the team's season All-Star count. Sortable.

Placement: two new `<th>`/`<td>` columns (natural home near the existing computed columns GOTW/SOV/SOS/BEST),
each also documented in the `.stats-abbr-legend`. Values come from an **extended `TeamSeasonStats`** (add
`mvtScore`, `mvtRank`, `allStarCount`, `allStarRank` in `lib/statistics.ts:14-27`, populated in
`calculateTeamSeasonStats:103` by calling the new engines). The user also asked for these "next to your name
on your team schedule" → surface a compact **MVT + ★ chip pair** in the team-schedule header identity block too.

---

## 6. Data model — the reusable player dataset (⚠️ blocking pre-work; mesh point with the player-data PRD)

> **This section is the #1 thing to resolve before any build.** The user's explicit direction: the player data
> must be a **first-class, reusable, player-centric dataset — not values siloed on a team.** All-Stars, MVT, the
> game-detail modal, and future features all read from it. **Do not start building the engines/pages until this
> data model is agreed with the Fantasy-Player-Data prototype PRD** (the two PRDs merge into one, and the data +
> process are designed together). What follows is the proposed contract to bring into that merge.

### 6.1 Design principles (from the user)
1. **Player-centric, not team-centric.** Every player who is *ever* rostered gets their own dataset. Stats are
   keyed to **(player, year, week)**, not stored under a team.
2. **Ownership is a point-in-time fact.** A player can switch fantasy teams mid-season. Each weekly record
   records **which fantasy team owned them that week**. That week's production is **immutably** credited to the
   team that owned them *at the time* — trading a player away does not retroactively move their prior weeks.
3. **Reusable across the league.** One dataset, referenced by many features; queryable by player, by team, by
   week, by position, by year.
4. **Year-scoped and additive.** Records accrue by season year; historical years are retained (enables
   legacy/all-time views later, and the "Biggest Rank Jump Since Draft" / multi-year awards).

### 6.2 Proposed entities

```ts
// A durable identity for a real athlete/DST/coach, deduped across teams and weeks and years.
interface PlayerIdentity {
  id: string;                 // LeagueWeaver canonical id, not a provider id
  name: string;
  position: string;           // QB, RB, WR, TE, DST, K, HC, DL, LB, DB, ...
  nflTeam?: string;           // current NFL team (may change; snapshot also stored per-week below)
  providerIds: {
    espn?: string;
    sleeper?: string;
    gsis?: string;
    pfr?: string;
  };
}

// The atomic, reusable fact: what a player did in one week, and who owned them then.
interface PlayerWeekStat {
  playerId: string;           // → PlayerIdentity
  year: number;               // season year (e.g. 2025)
  week: number;
  points: number;             // fantasy points scored that week (league scoring)
  nflTeamAtTime?: string;     // NFL team snapshot that week
  ownership: {
    fantasyTeamId: string | null;   // the fantasy team that OWNED them that week (null = free agent)
    started: boolean;               // in a starting slot that week
    startedSlot?: SlotKey;          // exact occupied slot (QB/RB/FLEX/DL/IDP_FLEX/etc.) — drives awards (§3.3)
  };
}

// The league's starting-slot shape for a season (roster-driven; §3.2). Synced from the platform.
interface LineupTemplate {
  slots: Array<{ slot: SlotKey; count: number; rawProviderSlot?: string | number; confidence: "confirmed" | "inferred" }>;
}

// The full roster shape for a season. Used for import validation/history, not starter awards.
interface RosterTemplate {
  slots: Array<{ slot: SlotKey; count: number; rawProviderSlot?: string | number; group: "starter" | "bench" | "ir" | "taxi" | "reserve" | "unknown"; confidence: "confirmed" | "inferred" }>;
}

// The season bundle the engines consume. Team-level already exists; player-level is DEP-1.
interface SeasonPlayerDataset {
  year: number;
  lineupTemplate: LineupTemplate;
  rosterTemplate: RosterTemplate;         // includes Bench/IR/Taxi/Reserve counts
  playerStats: PlayerWeekStat[];          // every rostered player × every week (started AND bench)
  players: Map<string, PlayerIdentity>;   // dedup registry
  hasPlayerData: boolean;                 // false → features degrade (§7)
}

// DEP-3 (small, secondary — two Achievement awards only). Also player/team + week scoped.
interface LeagueTransactions {
  trades: Array<{ teamId: string; week: number; playerIds?: string[] }>;
  waivers: Array<{ teamId: string; week: number; playerId?: string }>;  // adds/claims/drops
  hasTransactionData: boolean;            // false → hide Most Trades + Waiver Wire Warrior
}

// DEP-4. A normalized season snapshot for future history pages.
interface LeagueSeasonHistory {
  provider: "espn" | "sleeper";
  providerLeagueId: string;
  previousProviderLeagueId?: string;       // Sleeper exposes previous_league_id
  season: number;
  leagueName: string;
  teams: Array<{
    leagueTeamId: string;
    providerTeamId: string;
    teamName: string;
    managerName?: string;
    divisionId?: string;
    finalStanding?: number;
    pointsFor?: number;
    pointsAgainst?: number;
  }>;
  schedule: Array<{
    week: number;
    providerMatchupId?: string;
    homeLeagueTeamId: string;
    awayLeagueTeamId: string;
    homeScore?: number;
    awayScore?: number;
    status: "scheduled" | "provisional" | "final";
  }>;
}
```

### 6.3 Collection logic (how the dataset gets populated)
- **Source:** platform sync only (ESPN box-score/roster views; Sleeper `matchups` `players_points` + the
  `/players/nfl` catalog). Both providers currently hardcode `hasPlayerData:false` and fetch team totals only
  (`lib/platform/espn.ts:79-80`, `lib/platform/sleeper.ts:46`) — DEP-1 is the prototype session turning these on.
- **Per week, per team:** read the team's lineup → for each roster spot emit a `PlayerWeekStat` with
  `ownership.fantasyTeamId = thisTeam`, `started`, and `startedSlot`. Bench players are recorded too (needed for
  future features and to know a player was owned-but-benched), but only `started` players are eligible for
  All-Star/positional awards.
- **Dedup by `playerId`:** the same athlete appears for many teams across weeks — one `PlayerIdentity`, many
  `PlayerWeekStat`s. **Never** key production under a team as the primary record.
- **Ownership changes:** because ownership is stamped per week, a mid-season trade needs no special handling —
  week N credits the week-N owner; week N+1 credits the new owner. No back-dating, ever.
- **Free agents / unrostered weeks:** a week a player was unowned → `fantasyTeamId: null`, `started:false`
  (retained so a later pickup's history is complete).
- **HC (Head Coach):** ESPN-only; emit as a `PlayerWeekStat` with `position:'HC'` when present, omit otherwise.
- **Idempotent + year-scoped:** re-syncing a week overwrites that (player, year, week) record; different years
  never collide.

### 6.3A Provider-normalized values (the translation layer)

**LeagueWeaver needs its own data language.** ESPN and Sleeper use different ids, names, roster fields, lineup
slot values, and transaction labels. Those differences should end at the provider adapter. Everything after the
adapter should read LeagueWeaver values only.

```ts
type NormalizedLineupSlot =
  | "QB" | "TQB" | "RB" | "WR" | "TE" | "FLEX" | "WR_TE_FLEX" | "SUPERFLEX"
  | "DST" | "K" | "P" | "HC"
  | "DT" | "DE" | "DL" | "LB" | "CB" | "S" | "DB" | "IDP" | "IDP_FLEX"
  | "BENCH" | "IR" | "TAXI" | "UNKNOWN";

interface ProviderMappedValue<T> {
  value: T;                                 // LeagueWeaver value
  source: "espn" | "sleeper";
  sourceValue: string | number | null;      // original provider value for tracing
  confidence: "confirmed" | "inferred" | "unknown";
}
```

Examples:

| LeagueWeaver value | ESPN source | Sleeper source |
|---|---|---|
| `leagueTeamId` | ESPN `teamId` | Sleeper `roster_id` |
| `fantasy_points` | `appliedStatTotal` / box score totals | `players_points[player_id]` |
| `lineupSlot` | ESPN `lineupSlotId` map | inferred from `starters` order + `roster_positions` |
| `canonicalPlayerId` | ESPN player id + crosswalk | Sleeper player id + crosswalk |

Roster slot examples:

| LeagueWeaver slot | ESPN source | Sleeper source |
|---|---|---|
| `SUPERFLEX` | ESPN `OP` / slot id `7` | `SUPER_FLEX` |
| `FLEX` | ESPN `RB/WR/TE` / slot id `23` | `FLEX` |
| `WR_TE_FLEX` | ESPN `WR/TE` / slot id `5` | `REC_FLEX` |
| `DL` | ESPN `DL` / slot id `11` | `DL` |
| `LB` | ESPN `LB` / slot id `10` | `LB` |
| `DB` | ESPN `DB` / slot id `14` | `DB` |
| `IDP_FLEX` | ESPN `DP` / slot id `15` | `IDP_FLEX` |

The UI, All-Star engine, MVT engine, standings, and history pages should never branch on raw ESPN/Sleeper
fields. They should branch on normalized LeagueWeaver values and use the provider fields only for debugging.

### 6.3B DEP-4 history tracking and schedule sync

Collecting history is useful, but it should be opt-in and season-scoped. Do not auto-pull every previous season
for every connected league. Start with the current season; then add a "Sync previous seasons" action later.

History to snapshot:

- League season settings: league name, season year, scoring type, roster positions, playoff settings, team count.
- Team history: team names, manager names, divisions, final standings, records, points for/against.
- Provider schedule: weekly matchups and scores from ESPN/Sleeper.
- Player ownership history: player, fantasy team, week, started/benched, lineup slot, points, NFL team at that time.
- Transaction history: trades, waiver claims, adds, drops, and bid amounts when the provider exposes them.
- CSV/manual history: for seasons the public APIs cannot reach, allow user-uploaded season summaries, standings,
  champions, weekly matchups, and notes. Do not use CSV history for All-Stars/MVT player awards unless it
  includes week-by-week player rows with lineup slot, owning team, and league-scored fantasy points.

Schedule sync rule:

**LeagueWeaver's generated schedule stays primary.** Provider schedules should be stored as a reference layer,
then mapped to LeagueWeaver teams. If the provider schedule differs from the generated LeagueWeaver schedule,
show a review state instead of silently replacing anything.

Future sync modes:

| Mode | Meaning | MVP status |
|---|---|---|
| `scores-only` | Pull scores/player stats onto the LeagueWeaver schedule | Ship first |
| `compare-provider-schedule` | Show where ESPN/Sleeper schedule differs | Later |
| `adopt-provider-schedule` | User chooses to replace/import provider schedule | Later, review required |
| `import-history-csv` | Fill older seasons that ESPN/Sleeper APIs cannot reach | Later, review required |

This supports future pages like team history, player history, all-time awards, rivalry records, season archives,
and franchise timelines without forcing those features into the first All-Stars/MVT release.

### 6.4 Pre-work checklist (resolve in the merged PRD before building)
- [ ] **Ratify the player-centric model** (§6.1–6.3) against the Fantasy-Player-Data prototype's own model; pick
      one canonical `PlayerIdentity` key and one storage shape. *(Blocking.)*
- [ ] **Persistence + refresh:** where does `SeasonPlayerDataset` live (Supabase table vs. computed cache), and
      how/when is it synced (cron like scores, or on-demand)? *(Blocking — affects the whole data layer.)*
- [ ] **`LineupTemplate` sync:** confirm ESPN + Sleeper both expose starting-slot settings we can map.
- [ ] **Transactions feed (DEP-3):** is trade/waiver history in scope for the prototype? If not, §7 hides those 2 awards.
- [ ] **History snapshots (DEP-4):** confirm which current-season fields are saved now so future history pages do
      not need a painful backfill.
- [ ] **Schedule sync mode:** start with `scores-only`; defer compare/adopt provider schedule unless explicitly
      pulled into scope.
- [ ] **Disconnect retention:** keep normalized historical snapshots after disconnect, stop future sync, and add
      a later delete-history control.
- [ ] **Conference model:** add a `Conference` entity (teams/divisions → conference) or defer the §4.4 conference
      tier. *(Blocking only for the conference category.)*
- [ ] **Scale validation:** confirm the model + queries hold at 32 teams × 18 weeks × full rosters (perf, payload).

### 6.5 Engine outputs (new modules, mirroring `lib/matchups.ts`/`lib/statistics.ts`)

```ts
// lib/allStars.ts — reads SeasonPlayerDataset + LineupTemplate
computeWeeklyAllStars(dataset, week): AllStarSelection[]        // slots per template; inclusive ties (§3.3)
computeSeasonAllStars(dataset): {
  byWeek: Map<number, AllStarSelection[]>;
  countByTeam: Map<string, number>;     // ownership.fantasyTeamId at the time → standings + MVT achievement
  weeklyTotals: Map<number, number>;    // trend line
}
isAllStar(playerId, week): { slot; rank } | null               // → roster badge

// lib/mvt.ts — reads team-level stats + dataset + transactions + division/conference structure
computeMvt(schedule, stats, dataset, transactions): {
  byTeam: Map<string, MvtBreakdown>;    // {positional, achievement, divLeague, conference?, bonus, total, rank}
  awards: MvtAward[];                    // every sub-award's placements + points, for the detail pages
}
```

Manual-entry leagues (no platform) will never have a `SeasonPlayerDataset` → degraded state (§7), same as the modal.

### 6.6 Collection at scale — reuse the existing sync system (answers the 100k-account question)

**We already have the right architecture; player data is an extension of it, not a new system.** Today
(`app/api/cron/sync-scores/route.ts`, `lib/platform/sync.ts` `computeScheduleScores`):
- Scores are pulled **per connected league**, three ways: **Level 0** manual (`sync_enabled=false`, never
  touched), **Level 1** the in-app Refresh button (on-demand), **Level 2** a Vercel cron that fires ~15 min
  after each NFL slate for every `sync_enabled` link (`vercel.json` has 7 slate-timed schedules).
- The cron is **batched and capped** — `MAX_LINKS_PER_RUN = 100` per invocation, remaining links picked up next
  tick — precisely because "ESPN/Sleeper are unofficial APIs" (their words in the file).
- Results are **cached in Supabase** (`season_scores`, upserted on `schedule_id,game_id`, with an `is_final` flag).

**The key realization that resolves the "apply their own scoring" worry:** both ESPN and Sleeper return
**already-scored fantasy points per player, computed with that league's own scoring settings** (Sleeper
`players_points`, ESPN box-score `appliedTotal`). **We do not need raw NFL stat lines or our own scoring
engine** — the platform applies each league's rules and hands us the points. So there is no need for a global
stats warehouse that re-scores raw data per league (that is the thing that would require a paid stats API).

**Recommended two-tier model:**

| Tier | What | Where | Cadence | Shared? |
|---|---|---|---|---|
| **Global catalog** | Player identity only (name, position, NFL team) — the Sleeper `/players/nfl` catalog (~5 MB) | one app-wide table | **once daily** (one cron) | ✅ every league reads it |
| **Per-league scored stats** | Already-scored per-player weekly points + `startedSlot` + `ownership` | new `season_player_stats` table (mirrors `season_scores`) | the **existing slate-timed cron** + Refresh | ❌ league-specific (points are league-scored) |

**Why per-league (not one giant shared points DB):** fantasy points are league-scoring-specific, so the same
athlete's "points" differ across leagues — they can't be shared. Only *identity* is universal, so only the
catalog is centralized. This keeps us on the proven per-league model.

**Why 100k accounts is not a problem — the load is bounded by design:**
1. **Only connected + `sync_enabled` leagues** are ever pulled (manual leagues cost nothing).
2. **Only during the season, only non-final weeks.** A week's player rows are provisional first, then rechecked
   through the correction window and marked final after lock. Steady-state cost ≈ *new week × active leagues*,
   not *all data × all leagues × every tick*.
3. **Same batching/cap** (`MAX_LINKS_PER_RUN`, staggered across the 7 slate ticks + spillover to next tick)
   already keeps us within unofficial-API tolerances; the player payload is larger per league (starters+bench ×
   N teams) but the same shape and the same throttle. Tune the cap and add simple backoff/queueing if needed.
4. **On-demand as the pressure valve:** the Refresh button pulls a single league immediately for users who want
   it now, so the cron never has to be "fast," just eventually-complete.

**Provider/API reality (no paid API required):** both providers are already in this repo for scores and the
*same* endpoints return player data — ESPN (unofficial, keyless, read-only; **HC scoring is ESPN-only**) and
Sleeper (official, free, documented, generous read limits). DEP-1 = flipping these from team-totals-only
(`espn.ts:79-80`, `sleeper.ts:46`) to also parsing the per-player arrays they already return. If we ever wanted
custom scoring for *manual* leagues, that would need a stats provider — **out of scope**; manual leagues stay
degraded (§7).

> **Open (for the merged data PRD, §13):** exact `season_player_stats` schema + indexes; whether the global
> catalog is a table or a cached blob; catalog refresh cadence; per-tick cap tuning + backoff for the larger
> payload; retention of bench rows.

### 6.7 Live API validation — real ESPN pulls (2026-08-01)

Verified against the read API this environment can reach, using a **public** example league (`42654852`) with
**no auth cookies**. Every core assumption held:

- **Keyless public access works.** `GET .../seasons/2024/segments/0/leagues/42654852?view=mRoster&view=mMatchupScore&view=mTeam&scoringPeriodId=1`
  → **HTTP 200**, no `SWID`/`espn_s2`. **Private leagues are out of scope** (user decision) — they'd need
  cookies we won't handle, so the feature is **public-league-gated** (folds into the §3.2 platform gate).
- **Per-league payload is small and fast:** **~0.5 MB**, ~0.15 s for a full-roster + scores pull of one week.
  This is the per-league tier — trivial on the existing cron.
- **The global player catalog is heavy:** the league-agnostic `/players?view=kona_player_info` returned **~25 MB**
  (2,887 players) and **ignored** a naive `X-Fantasy-Filter` limit. → **Confirms the two-tier split (§6.6):**
  pull the catalog **once daily, centrally**, never per league; craft `X-Fantasy-Filter` carefully if trimming.
- **Every field we need is present per rostered player:**
  - `lineupSlotId` → the **exact slot occupied** — confirmed map: `0 QB · 2 RB · 4 WR · 6 TE · 16 DST · 17 K ·
    23 FLEX · 20 BENCH · 21 IR`. **This directly powers the FLEX-slot rule (§3.3)** — e.g. Isiah Pacheco came
    back as `slot=23 (FLEX)`, distinguishable from RBs started at RB.
  - `playerPoolEntry.appliedStatTotal` = **the league-scored points** (matched each player's weekly actual).
    **Confirms we never build a scoring engine** — ESPN applies the league's rules for us.
  - `player.stats[]` carries both actual (`statSourceId:0`) and projected (`statSourceId:1`), weekly
    (`statSplitTypeId:1`) — projections are available if we ever want them.
  - Started vs. bench is `lineupSlotId` (20/21 = bench/IR) → clean "started only" filter for All-Stars.
- **HC is league-conditional:** the standard example league had **no** HC slot; PVE (which enables head-coach
  scoring) will. Validates the roster-driven "omit the slot if the league doesn't have it" design (§3.2/§7).

**Net:** the ESPN half of DEP-1 is a parsing change on an endpoint we already call — low risk, empirically
confirmed. (Sleeper's `players_points` + `/players/nfl` is the mirror path; not re-tested here but analogous.)

---

## 7. Graceful degradation (no fake data)

| Condition | Behavior |
|---|---|
| `hasPlayerData=false` (manual league / not-yet-synced) | All-Stars page + MVT Positional/Achievement-MVP/All-Star awards show a "Connect a platform to unlock player awards" empty state. **Team-level MVT awards still compute** (Div/League, Total Score, Blowouts, Upsets, most Bonus) so MVT is not blank. Standings ★ column hidden; MVT column shows team-level-only subtotal with an asterisk. |
| `hasTransactionData=false` | Hide **Most Trades** and **Waiver Wire Warrior** rows; MVT totals exclude them (they're ≤1 pt each — low distortion). Note it in the legend. |
| No HC in league | Omit HC slot (All-Stars) and HC positional award. |
| Season in progress | Every value = "through week N"; MVT/All-Star are live-updating like standings. Movement arrows compare to the previous completed week. |

---

## 8. Brand translation (broadcast graphic → LeagueWeaver system)

The graphics are a black/gold "sports broadcast" style with team-color-filled rows, heavy condensed white type,
and gold award chrome. Translate — don't reimplement pixel hexes:

- **Surface:** use the existing dark broadcast tokens `--pk-*` + `.pp-panel` (already used by Playoff Picture /
  Stakes) for the MVT and All-Star boards. This *is* the app's version of the graphic's look.
- **Row fills:** team's `accessibleTeamColor`/`tintColor` with `readableTextColor` for the numerals — same
  mechanism as standings rank pills.
- **Rank strength:** the "by team" and leaderboard use the green→gray `--strength-fg`/`--strength-bg` +
  `--sig-t` scale (never red).
- **Points chips:** the little dark "4 / 2 / 1" award chips → a shared `<PointChip>` on `--pk-*` chrome.
- **Type:** the app's `--text-*` scale + display-number tokens `--num-*`; respect the 11px legibility floor and
  16px mobile inputs (type-scale-floor).
- **Logos / division marks:** `EntityLogo`, `DivisionMark` — never bare names.

**GOLD — the one brand decision (§13.1).** The graphics make gold the *MVT award identity*, but the app reserves
gold for **GOTW** (`globals.css:25`, strength-scale memory). Recommendation: **let gold be the MVT/All-Star
award accent**, since (a) the product *is* an awards trophy surface, (b) MVT/All-Star and the GOTW schedule
context never co-occur on the same screen, and (c) it preserves the user's established brand. Ratify in §13.1
before building the chrome.

---

## 9. Codebase integration map

| Step | File / anchor |
|---|---|
| Add `"all-stars"` and `"mvt"` to `ViewKey` | `SeasonWorkspace.tsx:109` |
| Add two `VIEW_ITEMS` entries (icons: `Star`/`Award` or `Trophy`) | `SeasonWorkspace.tsx:169-177` |
| Add two content-router lines `{view==='all-stars' && …}` / `{view==='mvt' && …}` | `SeasonWorkspace.tsx:2180-2200` |
| New `AllStarsView`, `MvtView` (model on `MatchupRatingsView:578`) | `components/season/AllStarsView.tsx`, `MvtView.tsx` |
| New `<AllStarBadge>`, `<PointChip>` primitives | `components/season/` (beside `GameBadgeChip`) |
| Engines | `lib/allStars.ts`, `lib/mvt.ts` |
| Extend `TeamSeasonStats` + populate | `lib/statistics.ts:14-27,103` |
| Standings columns + legend + team-schedule header chips | `StatsWorkspace.tsx:668`; team-schedule identity block |
| Roster badge consumption | Game Detail Modal `PlayerRow` (modal PRD §5) |

---

## 10. Component architecture

```
<MvtView>                         // wraps a MatchupRatings-style page; internal sub-tabs
  <MvtSubnav Overview|Positional|Achievement|Div/League|Bonus/>
  <MvtOverview leaderboard breakdown movement/>   // table + mobile cards
  <MvtAwardTable award rows 1st/2nd/3rd PointChip/> // Positional/Achievement/Bonus
  <MvtDivLeagueTable rows × divisions PointChip/>
</MvtView>

<AllStarsView>
  <WeekSelector/>
  <AllStarBoard slots[11] player team score AllStarBadge/>   // card list on mobile
  <AllStarsByTeam counts ranked strengthScale/>
  <AllStarTrend weeklyTotals/>          // v1.1
</AllStarsView>

<AllStarBadge slot rank week points/>   // icon (+numeral for RB/WR) — reused in roster rows
```

Data hooks: `useAllStars(schedule, playerData)`, `useMvt(schedule, stats, playerData, transactions)` — memoized
like the existing season selectors.

---

## 11. Build phases

1. **Engines + contract (no UI):** `lib/allStars.ts`, `lib/mvt.ts` against the DEP-1/DEP-3 types, unit-tested
   with a fixture derived from the sheet (the sheet's numbers are the golden test: GREEN tops MVT, Wk1
   all-star total 288.42, etc.). Ships behind the seam even before DEP-1 lands.
2. **Standings integration:** extend `TeamSeasonStats`, add MVT + ★ columns + legend + team-schedule chips.
3. **MVT page:** Overview first (highest value), then the four award-detail sub-tabs.
4. **All-Stars page + roster badge:** board, by-team rail, `AllStarBadge` in modal roster rows.
5. **Brand pass + degradation states:** `--pk-*`/gold chrome, empty states, mobile card parity.
6. **Combined release** with the rating-scale + player-data sessions.

---

## 12. Acceptance criteria

- MVT engine reproduces the sheet's bucket math and totals for the reference season (golden fixture).
- All-Star engine reproduces the 11 weekly slots, per-team counts, and weekly totals from the sheet.
- New tabs appear in the rail, route via `?view=`, and match the `MatchupRatingsView` responsive pattern
  (desktop table + mobile cards).
- Standings shows sortable **MVT** and **★** columns with legend entries; team-schedule header shows the chip pair.
- Roster rows show the All-Star badge, with rank numerals on RB/WR, only for the correct week.
- No fake data anywhere: manual/unsynced leagues hit the degraded states in §7; team-level MVT awards still compute.
- Rating-dependent bonus awards consume `toMatchupScore10`/`getMatchupSignal` (no parallel rating).
- **Roster-driven:** the All-Star slot template is read from the league's `LineupTemplate`, not hardcoded — a
  non-PVE roster shape produces the correct slots automatically.
- **FLEX rule:** a FLEX all-star is a player who was *started in a FLEX slot*, never "best remaining."
- **Inclusive ties:** tied players are co-winners (each badged, each counted); weekly total counts the slot once.
- **Immutable week-scoped ownership:** a mid-season trade credits each week to the owner *at that week*; prior
  weeks never move. Verified with a fixture where a player changes teams.
- **Scale:** correct and performant for 8–32 teams and 1–8 divisions; Div/League category renders one column per
  real division + league; every division name carries its `DivisionMark`.
- **Conference-conditional:** when a `Conference` model exists, the conference award tier + sub-view appear and
  add points; when it doesn't, they're cleanly absent (no placeholder).
- **Collection:** player data flows through the existing sync path (cron + Refresh), caches per final week
  immutably, and never re-fetches finalized weeks; global player catalog refreshes once daily.

---

## 13. Open decisions (product)

1. **Gold usage (blocking the chrome pass).** Ratify gold as the MVT/All-Star award accent (recommended, §8) vs.
   choosing a distinct MVT identity color to keep gold GOTW-exclusive.
2. **v1 scope.** Ship all five MVT sub-views + All-Stars page at once, or v1 = MVT Overview + All-Stars board +
   standings columns, with the four MVT detail pages as v1.1? (Recommend the full set to match the graphics,
   contingent on DEP-1 landing on time.)
3. **Transactions (DEP-3).** Is trade/waiver data in scope for the player-data prototype? If not, Most Trades +
   Waiver Wire Warrior are hidden per §7 for this release.
4. **"Best Record" definition.** The graphic's Best-Record achievement uses the **Match-of-the-Week record**
   (e.g., 3-2). Confirm it's MOTW record (not overall record, which is already the Div/League "Best Overall").
5. **Movement arrows baseline.** MVT/All-Star ▲/▼ vs. *previous completed week* (recommended) vs. vs. *draft*.
6. **Award ties.** When two teams tie an award, split points (sheet shows halves like 2.5) or duplicate the
   placement? Confirm the sheet's convention (appears to **split**).
7. **Manual roster builder?** For leagues with no platform, do we ever add a manual per-week lineup entry step
   in the wizard, or is the feature strictly platform-gated? (Recommend **platform-gated only** — manual entry
   of 11+ slots × N teams × every week is prohibitive; §3.2.)
8. **Conference model (blocking the conference tier).** Add a first-class `Conference` entity now (with
   large-league-expansion) or defer the §4.4 conference award tier to a later release?
9. **Data-layer decisions (from §6.4 / §6.6 — resolve in the merged data PRD):** canonical `PlayerIdentity`
   key; `season_player_stats` schema + persistence (table vs. computed cache); global catalog as table vs.
   blob + refresh cadence; per-tick cap tuning + backoff for the larger player payload; bench-row retention.

---

## 14. Draft story backlog (seed for the merged session — **not** GitHub issues yet)

> Per direction: **do not open GitHub issues yet.** Stories will be finalized and created *from the merged
> All-Stars/MVT + Fantasy-Player-Data PRD*. This is seed material in the repo's story style (Type · Goal ·
> Acceptance · Deps) so the merge starts from a real backlog. `cdforge/leagueweaver-v3` is connected (`gh`
> authed, `repo` scope) → these can be pushed as issues on request once the merge is done.

**Data layer (blocking — build first, jointly with the player-data PRD)**
- **DATA-1 · Player-centric season dataset** — model + persist `PlayerIdentity` / `PlayerWeekStat` /
  `SeasonPlayerDataset` (§6.2). *Acceptance:* week-scoped immutable ownership; dedup by player; year-scoped.
  *Deps:* merged data PRD.
- **DATA-2 · ESPN/Sleeper player pull** — extend `espn.ts`/`sleeper.ts` to parse per-player applied points +
  lineup slot + HC (ESPN). *Acceptance:* real pull from a live league matches the platform UI. *Deps:* DATA-1.
- **DATA-3 · Collection at scale** — new `season_player_stats` cache + global daily catalog; wire into the
  `sync-scores` cron + Refresh; immutable-once-final; cap/backoff (§6.6). *Acceptance:* finalized weeks never
  re-fetched; batch stays within API tolerance. *Deps:* DATA-1/2.
- **DATA-4 · `LineupTemplate` sync** — read starting-slot settings from both providers (§3.2). *Deps:* DATA-2.

**Engines**
- **AS-1 · All-Star engine** (`lib/allStars.ts`) — roster-driven slots, FLEX-slot rule, inclusive ties,
  season counts + weekly totals (§3.3/§6.5). *Acceptance:* reproduces the sheet's weekly teams + counts.
- **MVT-1 · MVT engine** (`lib/mvt.ts`) — all four buckets + scale-aware Div/League + conditional conference
  (§4). *Acceptance:* reproduces the sheet's bucket math + totals (golden fixture).

**Standings**
- **STD-1 · MVT + ★ columns** — extend `TeamSeasonStats`; sortable columns + legend + team-schedule chips (§5).

**Pages & UI**
- **MVT-2 · MVT page** — Overview leaderboard + 4 (or 5 w/ conference) award detail sub-views (§4.6).
- **AS-2 · All-Stars page** — week board + by-team rail + trend (§3.6).
- **AS-3 · All-Star roster badge** — `<AllStarBadge>` (rank numeral on multi-slot) in modal roster rows (§3.5).
- **UI-1 · Brand pass** — `--pk-*`/gold chrome, `<PointChip>`, mobile card parity, degradation empty states (§7/§8).

**Cross-cutting**
- **X-1 · Scale + conference conditionals** — verify 8–32 teams / 1–8 divisions; conference tier appears only
  with the model (§4.4/§12).
```
