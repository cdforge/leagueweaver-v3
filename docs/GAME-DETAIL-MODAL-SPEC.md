# Game Detail Modal — Build Spec

_Turns the mock at `game-modal-mobile-mockup.html` into a real, live feature._

## 1. Goal

Tap a game anywhere in the app → a bottom-sheet modal opens with the full box score:
both rosters, per-player actual + projected points, a per-stat scoring ledger on tap,
NFL opponents, ranks/division, and a matchup rating. We **reshape** provider data into
LeagueWeaver's visual language — we are not cloning ESPN's UI.

Design reference (validated with real 2025 PVE data): `game-modal-mobile-mockup.html`
(4-state switcher: Pre-Draft / Upcoming / Live / Final).

## 2. Provider-agnostic architecture

One normalized shape; two adapters feeding it. The React component never sees ESPN or
Sleeper field names.

```
ESPN API ──┐
           ├──► adapter ──► GameDetail (normalized) ──► <GameDetailSheet/>
Sleeper API┘
```

### Parity: ESPN vs Sleeper

| Data | ESPN | Sleeper | Notes |
|---|---|---|---|
| Rosters, starters/bench | ✅ | ✅ | |
| Per-player actual points | ✅ | ✅ (`players_points`) | |
| **Projections** | ✅ in-band (`statSourceId=1`) | ⚠️ undocumented host | best-effort on Sleeper |
| **Per-stat scoring ledger** | ✅ `appliedStats` (pre-computed) | ⚠️ compute from raw stats × `scoring_settings` | |
| **Head Coach** | ✅ (2025) | ❌ none | feature-flag to ESPN |
| Injury / team / position | ✅ | ✅ | |
| Live scoring | ✅ poll | ✅ poll | |
| Fantasy team logo/avatar | ✅ (`logo`) | ✅ (`avatar` → sleepercdn) | |
| Divisions | ✅ (`divisionId`) | ✅ (metadata) | |
| Ranks / standings | derive | derive | wins/losses/points |
| NFL opponent (vs/@) | ❌ | ❌ | fetch NFL schedule separately (both) |
| Player headshots | available (unused — licensing) | available (unused) | intentionally not used |

## 3. Normalized data model

```ts
type GameStatus = 'predraft' | 'upcoming' | 'live' | 'final';
type PlayerLiveState = 'pending' | 'live' | 'final' | 'bye' | 'empty';

interface StatLine { key: string; label: string; raw: number; points: number; }

interface PlayerSlot {
  slotId: string;            // lineup slot: QB/RB/WR/FLEX/TE/D-ST/K/HC/BE/IR
  slotColor: string;         // from position palette
  player: Player | null;     // null = empty/undrafted slot
}
interface Player {
  id: string; name: string; shortName: string;   // "Derrick Henry" / "D. Henry"
  pos: string; proTeam: string; proColor: string; proColor2: string;
  opponent: { abbr: string; homeAway: 'vs' | '@' } | null;   // null = FA/BYE
  injury?: string;
  points: number; projected: number | null;
  liveState: PlayerLiveState;
  ledger: StatLine[];        // per-stat points; empty until played
}
interface TeamSide {
  teamId: string; city: string; nick: string; logo: string | null; accent: string;
  rank: number | null; division: { name: string; abbr: string; logo: string | null; color: string };
  total: number | null; projectedTotal: number; won: boolean; tie: boolean;
  starters: PlayerSlot[]; bench: PlayerSlot[];
}
interface GameDetail {
  status: GameStatus;
  week: number; dateLabel: string; kickoffLabel: string | null; stadium: string | null;
  home: TeamSide; away: TeamSide;
  matchup: { gameNumber: number; isGotw: boolean; rating: number; label: string; bars: number;
             awayRank: number; homeRank: number } | null;
  provider: 'espn' | 'sleeper';
  isPlayoff?: boolean; playoffLabel?: string;
}
```

## 4. Module A — `lib/espn/boxscore.ts` (data layer)  ← the long pole

- **Endpoint:** `GET .../seasons/{yr}/segments/0/leagues/{id}?view=mBoxscore&view=mRoster&view=mTeam&view=mSettings&scoringPeriodId={wk}`
- **Auth:** public → none. Private → `espn_s2` + `SWID` cookies (per user). Must build the
  connect/store flow; a private league returns 401 until connected. Reuse existing ESPN sync auth if present.
- **Reshape:** distill the ~2 MB payload to the compact `GameDetail` (mock proved ~29 KB).
  Server-side only — never ship 2 MB to the client.
- **Caching:** server cache keyed by `(league, week)`; short TTL while `live`, long TTL when `final`.
- **Stat-ID dictionary:** finalize `lib/espn/statMap.ts` — player stats (mostly known) + the
  coach set (`158`=Team Points, `163`/`166`=Win, `169`/`172`=Loss, `160`/`170`=Margin) + kicker
  distance ids. Flag inferred labels for review.
- **Opponent enrichment:** fetch NFL schedule (`site.api.espn.com/.../nfl/scoreboard?week=`),
  map proTeam → {opp, vs/@}. Cache weekly. Shared by both providers.
- **Errors:** typed results — `not_found`, `unauthorized` (→ connect-cookies CTA), `rate_limited`,
  `network`, `unavailable` (team removed post-schedule).

## 5. Module B — `<GameDetailSheet/>` React component

- **Roster-agnostic:** render whatever slots the data returns (superflex, IDP, no-K, 18–32 team
  leagues). No hardcoded lineup — the mock's fixed slot list must become data-driven.
- **Reuse, don't reinvent:** design tokens from `globals.css`, `DivisionMark`, the strength scale
  (rank/rating colors), the GOTW gold rule. Port the mock's CSS to the app's token system.
- **Structure:** header (rank+division, city/nick, score, W/T), center (at-circle, status,
  game/GOTW chip, rating+bars, ranks), by-slot starter rows, bench, tap-to-expand ledger with
  team-colored background + logo.
- **Theme:** honor light/dark via existing `--pk-*` tokens.
- **Responsive:** bottom sheet on mobile; centered dialog / two-column on tablet+desktop.

## 6. States & edge cases (acceptance checklist)

**Lifecycle (mocked ✅):** Pre-Draft (empty slots, roster size visible) · Upcoming (light
projections) · Live (mixed final/live/pending, red live totals) · Final (winner + W).

**Must add before ship:**
- [ ] **Loading / skeleton** — during fetch (payload is large).
- [ ] **Error / unauthorized** — private league needs cookies → connect CTA, not a blank sheet.
- [ ] **Empty starter slot** — manager left a slot unfilled (distinct from Pre-Draft).
- [ ] **Player on BYE** — rostered, no NFL game (distinct from FA / 0).
- [ ] **Tie (Final)** — no green winner; "T" on both. (Mock currently gives home the tie.)
- [ ] **OUT / inactive starter** — clearer flag than the injury letter alone.
- [ ] **Matchup unavailable** — team removed post-schedule (match `GotwWorkspace`).

**Context-dependent:**
- [ ] **Playoff matchup** — bracket label ("Semifinal"); decide **two-week total** model (changes scoring).
- [ ] **Dark mode** — `--pk-*`.
- [ ] **Desktop/tablet** layout.

**Win probability bar** (in the mock, all states except pre-draft): split bar showing each team's %
chance to win, colored by team accent. Mock uses a placeholder logistic on the point differential
(`P(home)=1/(1+e^-(Δ/scale))`, scale ≈22 pre-game / ≈13 live so it tightens as the game empties out;
final = 100/0). **Needs a real projection model** — proper per-player projection variance + remaining-
game time, not a single logistic. Own it in `lib/matchups/winProbability.ts`; ESPN's is a reference, not a source.

**Later / nice-to-have:** bench-outscored-starter flag · post-game recap (MVP/bust) ·
points-only/median leagues (no single opponent).

## 7. Placeholders needing a real source (product decisions)

- **Stadium / "home field"** — invented `{city} Field` in the mock. Decide: per-owner custom home-field name? drop it? derive?
- **Division logos** — acronym fallback shown; wire real `DivisionMark` when it exists.
- **Kickoff time / draft date** — from NFL schedule + league draft settings.
- **Live clock & partial points** — simulated in mock; real values from polling the feed during games.
- **Coach/kicker stat labels** — some inferred; confirm against a live payload.

## 8. Sleeper adapter (phase 2)

- `lib/sleeper/boxscore.ts` → same `GameDetail`. No auth, documented, ~1000 req/min.
- Matchups: `/v1/league/{id}/matchups/{wk}` (`starters`, `players_points`).
- Players dump `/v1/players/nfl` (cache daily) — also the cross-provider ID bridge (`espn_id`).
- Projections: undocumented `api.sleeper.com/projections/...` — degrade gracefully if it fails.
- Ledger: compute `raw stat × scoring_settings` (no `appliedStats`).
- Feature-flag: **no Head Coach**; hide that slot for Sleeper leagues.

## 9. Build sequence

1. **Data layer (ESPN):** `boxscore.ts` reshape + `statMap.ts` + opponent enrichment + cache. _(largest)_
2. **Private-league auth:** cookie connect/store flow + `unauthorized` handling.
3. **Component:** port mock → roster-agnostic `<GameDetailSheet/>` on app tokens; wire to data layer.
4. **Edge-case states:** the must-add checklist (§6).
5. **Dark mode + desktop/tablet.**
6. **Sleeper adapter** (phase 2).
7. **Playoffs** integration (align with the playoff work already in flight).

## 11. Roster slot reference (auto-build from connected league)

The roster **auto-builds** from the league's settings — ESPN `mSettings.rosterSettings.lineupSlotCounts`,
Sleeper `/v1/league/{id}.roster_positions`. Never hardcode a lineup. Render whatever slots the league defines.

### ESPN `lineupSlotId` (where a player is slotted)
`0` QB · `1` TQB · `2` RB · `3` RB/WR · `4` WR · `5` WR/TE · `6` TE · `7` OP (superflex) ·
`8` DT · `9` DE · `10` LB · `11` DL · `12` CB · `13` S · `14` DB · `15` DP · `16` D/ST ·
`17` K · `18` P · **`19` HC (Head Coach)** · **`20` Bench** · **`21` IR** · `23` FLEX (RB/WR/TE) · `24` Edge.
(Player *eligibility* is a separate space: `defaultPositionId`, where **HC = 14** ≠ HC slot 19. Don't conflate.)

### Sleeper `roster_positions` tokens
`QB RB WR TE K DEF FLEX WRRB_FLEX REC_FLEX SUPER_FLEX IDP_FLEX DL LB DB DE DT CB S` ·
**`BN` (bench)** · **`IR`** · **`TAXI`** (dynasty). No Head Coach.

### Normalized cross-provider slot enum
`QB RB WR TE K DST FLEX FLEX_WR_RB FLEX_WR_TE SUPERFLEX IDP_DL IDP_LB IDP_DB IDP_FLEX P
HEAD_COACH(ESPN-only) BENCH IR TAXI(Sleeper-only)`
Map ESPN by lineupSlotId (7→SUPERFLEX, 23→FLEX, 3→FLEX_WR_RB, 5→FLEX_WR_TE, 16→DST, 19→HEAD_COACH,
20→BENCH, 21→IR, 8–15→IDP_*); Sleeper by token (SUPER_FLEX→SUPERFLEX, WRRB_FLEX→FLEX_WR_RB,
REC_FLEX→FLEX_WR_TE, DEF→DST, BN→BENCH).

### Points accuracy per position
- **ESPN:** trust `appliedStats` / `appliedTotal` (statSourceId 0). It's pre-computed by ESPN and works
  uniformly for offense, **IDP**, D/ST, K, and HC — one code path. HC uses coach stat ids 155–174
  (win/loss/tie/points/margin); K uses FG-by-distance ids; D/ST uses points/yards-allowed buckets.
- **Sleeper:** NOT pre-computed — compute `sum(scoring_settings[key] × raw_stat[key])` from
  `/v1/stats/nfl/...`; unmapped keys score 0. IDP scoring keys exist (`idp_tkl`, `idp_sack`, …).
- **IR / Bench / Taxi are rostered but excluded from the matchup total.** Count a player's points toward
  the score only when his slot is a *starting* slot (not 20/21/TAXI). ESPN's team `appliedTotal` already
  excludes bench/IR — mirror that.

### UI handling
- **HEAD_COACH** — render only for ESPN leagues that roster it (feature-flag; Sleeper never has it).
- **TAXI** — Sleeper-only; show as a stash section, never in the active lineup.
- **IR** — its own labeled section under Bench; greyed, not counted in the total.
- **IDP-heavy leagues** — the by-slot layout already scales; just more/different slot rows.

_Sources: espn-api `constant.py`, Sleeper API docs + roster-position support articles, ESPN roster-slot help._

## 12. Responsive / device layouts (mocked in `game-modal-responsive-mockup.html`)

- **Mobile** — **full-screen** page (not a bottom sheet), with a top app bar: **back arrow = exit to
  schedule**, title, share. This is the required exit point.
- **Tablet** — centered modal dialog over a dimmed schedule, single-column roster, close ✕.
- **Desktop** — wider centered modal, **two-column** roster (half the slots per column → less scrolling),
  close ✕.
- All three share one content core; only the chrome (full-screen vs dialog) and column count change.

## 12b. Pre-implementation checklist (post-prototype)

The prototype (`game-modal-responsive-mockup.html`) now covers: 4 lifecycle states, 3 device
layouts, the multi-game week strip (tap + swipe), auto-GOTW dark/broadcast styling with team-color
glows, win-probability bar, per-player NFL opponent + kickoff day/time, and a collapse-on-scroll
header. Before wiring to the live site:

**Must handle (blocks ship):**
- [ ] Private-league auth (`espn_s2`/`SWID`) connect flow + unauthorized state. Biggest gap.
- [ ] Loading/skeleton + error states (2 MB fetch, can fail).
- [ ] **Live is simulated** — real polling feed, real partial points, real per-player game status
      (played/playing/pending), real game clock + cadence. Hardest real-data piece.
- [ ] Win-probability real model (`lib/matchups/winProbability.ts`) — replace placeholder logistic.
- [ ] Matchup rating → **0.1–10.0 score** (`toMatchupScore10`); GOTW pick from the engine, not recomputed.
- [ ] Roster-agnostic rendering (superflex/IDP/no-K/18–32 team; Head Coach ESPN-only flag).
- [ ] Edge states: empty starter slot, BYE, **tie** (mock gives home the win), OUT/inactive, IR, matchup-unavailable.
- [ ] Multi-game **lazy-load** (fetch visible game, prefetch neighbors — not five 2 MB boxscores at once).

**Product decisions:** stadium/home-field concept · kickoff **timezone** (local vs ET) · team accent
color source (owner-picked/derived) · playoffs (bracket labels + two-week total) · FLEX/bench position on mobile.

**Accessibility (not in mock):** modal focus trap + ESC + return focus · keyboard nav for the game
strip · screen-reader labels · **`prefers-reduced-motion`** to disable collapse animation, live pulse, glows.

**Also:** dark-mode variant of the *standard* (non-GOTW) view via `--pk-*` · real division logos
(DivisionMark) · finalized coach/kicker/DST/IDP stat-ID dictionary · NFL schedule feed (opponent + kickoff) per week.

## 10. Open decisions (need product input)

- Stadium/home-field concept (§7).
- Playoff two-week total model.
- Tie-break display rules.
- Private-league onboarding UX (where/when we ask for the ESPN cookie connect).
- Live polling cadence + whether we poll client- or server-side.
