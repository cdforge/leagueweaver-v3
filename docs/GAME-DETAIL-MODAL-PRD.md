# Game Detail Modal — Implementation PRD (grounded in the current site)

**Visual target:** `game-modal-responsive-mockup.html` (the approved prototype) is the **canonical
visual spec and acceptance artifact**. "Done" = the built feature matches that file for every
state × device × style. This PRD says how to get there using the site as it exists today, and what
must change to reach that exact visual.

---

## 1. The one decision that governs everything

The prototype is **~90% player-level content** (roster rows, per-player points, stat ledger on tap,
kickoff time, NFL opponent, head coach). The current site has **zero player data**:

- `Team` and `ScheduledGame` are team-level only; scores are two numbers `homeScore`/`awayScore`
  (`lib/types.ts:30-44`, `:126-148`). There is **no Player/Roster/BoxScore type anywhere.**
- The ESPN sync fetches only `EspnMatchupTeam { teamId, totalPoints }` and records
  `hasRosterData:false, hasPlayerData:false` (`lib/platform/espn.ts:23,79-80`). Sleeper is the same
  (`lib/platform/sleeper.ts:9,46`). Neither requests `mRoster`/`mBoxscore`.

**Therefore:** the exact visual you approved **cannot be built from current data.** There is exactly
one enabling dependency, and it is unavoidable:

> **DEP-1 — Player boxscore fetch.** Add a read-only ESPN `mBoxscore&mRoster` fetch (the one we
> researched) that returns rosters + per-player actual/projected points + stat lines, reshaped into a
> normalized shape. This is additive and read-only; it changes no existing behavior.

This reframes the two asks:

| Path | New backend | Result |
|---|---|---|
| **A. Strictly no new backend** | none | Team-level modal only (header, scores, win%, rating, GOTW, week strip). **Not** the approved visual — no roster rows. |
| **B. The approved visual** | DEP-1 only | The prototype, 1:1. Everything except the roster body already exists; DEP-1 fills the body. |

**Recommendation: Path B.** You've designed and approved a player-level box score; team-level alone
isn't that product. DEP-1 is the single, contained, read-only addition that makes the exact visual
possible. The rest of this PRD assumes Path B and calls out the Path-A subset where relevant.

---

## 2. What already exists (reuse — do not rebuild)

The site already ships the entire team-level half of the modal (from the codebase map):

| Prototype element | Backed by (exists today) |
|---|---|
| Win-probability bar | `lib/simulator.ts` `GameWinProbability` → `{away,home}`; `MatchupCard` already renders a win-prob bar (`MatchupPresentation.tsx:183-187`) |
| Matchup rating (0.1–10.0 + bars) | `getMatchupSignal` → `{score10, bars, label}`, `toMatchupScore10` (`lib/matchups.ts:26-40,82-92`). **Use score10 — not the raw 18.2.** |
| GOTW pick + game number | `getGameOfWeekId`, `gameNumber` (1-based rank in week) (`lib/matchups.ts:135-140,189-213`) |
| Team ranks (#) | `getEnteringWeekRankMap(schedule, week)` (`lib/standings.ts:280-283`) |
| Records | `formatRecord` / division record (`lib/standings.ts:363-368`) |
| Division mark | `DivisionMark` / `DivisionIdentity` (`components/ui/DivisionIdentity.tsx`) |
| Team logo / avatar | `EntityLogo` (real `logoUrl`, else colored monogram) (`components/ui/EntityLogo.tsx`) |
| City + stadium/venue | `Team.city`, `Team.stadium` (`types.ts:30-44`) — **real, not the invented "{city} Field"** |
| Modal shell (focus trap, ESC, backdrop, scroll-lock, stacking) | `components/ui/Modal.tsx`; `--z-modal*` tokens |
| Dark broadcast theme | `--pk-*` tokens + `.pp-panel` reference surface (`globals.css:20-22`, `PlayoffPictureModal.tsx`) |
| Week strip / launch point | `WeekScoreBar` (scrolling slate, ranks, scores, GOTW, `G{n}`, `onSelectGame`) — today `onSelectGame` scrolls the schedule; repoint it to open this modal |

**Implication:** the header, week strip, win-prob, rating, GOTW styling, division marks, logos, and
modal behavior are all **data-ready today**. Only the roster body needs DEP-1.

---

## 3. Feature-by-feature: buildable now vs needs DEP-1

| Prototype feature | Data source | Now? |
|---|---|---|
| Team header (city/name, rank, division, logo, score, W/T) | existing team-level | ✅ |
| Win-probability bar | simulator | ✅ |
| Rating + signal bars (as **score10**) | matchups | ✅ |
| GOTW auto dark/broadcast + gold + glows | CSS + `--pk-*`; GOTW id | ✅ |
| Week strip (logos, ranks, scores, ★/G2–G5, tap/swipe) | schedule + ranks | ✅ |
| Collapse-on-scroll header | pure CSS/JS | ✅ |
| Stadium / venue | `Team.stadium` (real) | ✅ (drop the invented placeholder) |
| **Starter/bench roster rows** | — | ❌ DEP-1 |
| **Per-player actual + projected points** | — | ❌ DEP-1 |
| **Per-stat scoring ledger (tap-to-expand)** | — | ❌ DEP-1 |
| **Player NFL opponent (vs/@)** | NFL schedule | ❌ needs NFL schedule feed |
| **Player kickoff day/time** | NFL schedule | ❌ needs NFL schedule feed |
| **Head Coach row** | — | ❌ DEP-1 (ESPN only) |
| **Position/team badges, two-tone pills** | — | ❌ DEP-1 (player team/pos) |
| **Live per-player status (final/live/pending)** | — | ❌ needs live player feed (defer; see §7) |

DEP-2 (secondary): a **weekly NFL schedule fetch** (opponent + kickoff) — small, cacheable, read-only,
shared by both providers. Without it, drop opponent/kickoff from the rows; everything else stands.

---

## 4. How we guarantee the EXACT visual

This is the core of your ask. The mechanism is deliberate, not "reimplement from a screenshot":

1. **The prototype file is the source of truth.** Port its **markup structure and class names
   verbatim** into the React component tree. Same DOM = same layout = verifiable parity.
2. **Port the prototype CSS as the component's stylesheet.** The prototype was already authored on
   the app's real tokens (`--field, --gold, --ink, --muted, --line, --text-* scale, --radius*,
   --pk-*`), so its look already *is* the app's system. Where a literal hex was used
   (position palette, NFL team colors), lift it as a constants module — do not "reinterpret."
3. **Reuse app *primitives*, not app *layouts*.** Use `Modal`, `EntityLogo`, `DivisionMark`, and the
   token variables — these render identically. **Do NOT swap in `MatchupCard` or `WeekScoreBar`
   for the header/strip**: they exist, but they look different from the approved design, so reusing
   them would break "exact visual." Feed those systems' **data** into the ported markup instead.
4. **State/device/style matrix is the contract.** The component must reproduce the prototype for:
   States `{predraft, upcoming, live, final}` × Devices `{mobile full-screen + back, tablet modal,
   desktop 2-col-density modal}` × Style `{standard, GOTW-auto-dark}`. Each cell has a prototype
   reference.
5. **Acceptance = side-by-side parity.** For each matrix cell, the build is compared against the
   prototype file rendered at the same width. Reviewer signs off on visual parity, not just "looks
   close." Ship-blocking if a cell diverges.

**Net:** the visual is preserved by *porting* the prototype (structure + CSS + constants) and only
substituting **live data** and **app primitives** underneath — never by re-deriving the design.

---

## 5. Component architecture (mirrors the prototype 1:1)

```
<GameDetailModal>                     // wraps components/ui/Modal; device chrome (full-screen vs dialog)
  <WeekStrip games rank score onSelect swipe/>   // ports .wkstrip (+ mini variant on mobile)
  <GotwBanner if gotw/>               // ports .gotwband
  <GameHeaderBar collapse>            // ports .eyebrow + .hd + .ctr; collapse-on-scroll
    <TeamHead side rank division logo city nick score/>   // EntityLogo + DivisionMark inside ported markup
    <CenterBlock atc status ratingScore10 bars ranks/>
  </GameHeaderBar>
  <WinProbBar away home glow/>        // ports .wpwrap
  <RosterList>                        // DEP-1 data
    <PlayerRow slot badge name opp kickoff pts proj onTap/>   // ports .row/.pl
    <PlayerLedger stats total/>       // ports .det (tap-to-expand)
  </RosterList>
</GameDetailModal>
```

Data hook: `useGameDetail(leagueId, week, gameId)` → returns the normalized `GameDetail` (below) plus
`{loading, error}`. Team-level fields fill from existing selectors; roster fills from DEP-1.

---

## 6. Data contract (the seam)

One normalized type the component consumes; existing selectors + DEP-1 fill it. Team-level fields map
directly from current data; only `starters/bench/led` require DEP-1.

```ts
interface GameDetailVM {
  status: 'predraft'|'upcoming'|'live'|'final';   // derived from scores + week phase
  week: number; dateLabel: string; stadium?: string;   // stadium = Team.stadium (real)
  matchup: { gameNumber: number; isGotw: boolean; score10: number; bars: 1|2|3; label: string;
             awayRank: number; homeRank: number };      // getMatchupSignal + rank map
  winProb?: { away: number; home: number };             // simulator
  home: SideVM; away: SideVM;
  weekGames: WeekStripItemVM[];                          // schedule + ranks + scores
}
interface SideVM { teamId; city; nick; logoUrl?; color; rank; division; total?; projTotal?; won; tie;
  starters: SlotVM[]; bench: SlotVM[]; }                 // starters/bench ← DEP-1
```

---

## 7. Adjustments forced by the current site (explicit)

- **Rating shows `score10` (0.1–10.0, higher better)**, not the prototype's raw `18.2`. Use
  `getMatchupSignal().score10`. This is a required correction to match the app's convention.
- **Stadium** uses real `Team.stadium`; delete the invented "{city} Field."
- **Win probability** comes from the existing simulator model — remove the prototype's placeholder
  logistic. Same `{away,home}` shape the card already consumes.
- **GOTW / game number** come from `getGameOfWeekId` / `gameNumber` — do not recompute.
- **Live per-player status is deferred.** The site has no live *player* feed (only clock-derived
  team "live" in WeekScoreBar). v1 Live shows team-level live totals + "in progress"; the
  per-player final/live/pending split waits on a live player feed. The prototype's simulated 55%
  and `Q3 4:12` are **demo-only** and must not ship as real.
- **Opponent + kickoff** depend on DEP-2 (NFL schedule). If DEP-2 is cut, the player row drops those
  two fields and the layout still holds (already truncation-safe).
- **Divisions/logos** must use `DivisionMark` + `EntityLogo` (per MEMORY: a division's mark always
  accompanies its name).

---

## 8. Build phases

1. **Frontend shell from the prototype (no backend).** Port markup + CSS + constants into
   `<GameDetailModal>` behind `Modal`, driven by a fixture `GameDetailVM`. Achieves the **exact
   visual immediately** across the full matrix. Reviewer signs off parity here.
2. **Wire team-level data (no new backend).** Replace fixture header/strip/winprob/rating/ranks with
   existing selectors. This is the entire Path-A product.
3. **DEP-1 — boxscore adapter.** `lib/platform/espn-boxscore.ts` fetching `mBoxscore&mRoster`,
   reshaping to `SlotVM[]` (+ Sleeper adapter later; compute Sleeper ledger from `scoring_settings`).
   Fill the roster body.
4. **DEP-2 — NFL schedule feed** for opponent + kickoff (optional but designed-for).
5. **States + a11y + launch.** Loading/skeleton, error, empty-slot, BYE, tie, IR, matchup-unavailable;
   `prefers-reduced-motion` (collapse/pulse/glow); focus/keyboard for the strip; repoint
   `WeekScoreBar onSelectGame` to open the modal.
6. **Roster-agnostic + Head Coach flag + dark standard variant** (see the aspirational spec §11).

Phases 1–2 ship a real, reviewed feature with the exact chrome and no new backend; phase 3 turns on
the roster body and completes the approved visual.

---

## 9. Acceptance criteria

- Visual parity with `game-modal-responsive-mockup.html` for every {state × device × style} cell.
- Rating renders as `score10`; stadium is real; win% is the simulator's; GOTW is `getGameOfWeekId`.
- Header collapses on scroll; mobile is full-screen with a working back-exit; tablet/desktop are
  `Modal` dialogs with close + backdrop.
- `prefers-reduced-motion` disables collapse animation, live pulse, and glows.
- No fabricated data ships (no fake live clock, no invented stadium, no placeholder logistic).

## 10. Open decisions (product)

- **Path A vs B** (§1) — confirm we add DEP-1 to get the approved visual.
- DEP-2 (opponent/kickoff) in v1, or defer.
- Kickoff **timezone** (local vs ET) — only if DEP-2 is in.
- Live player feed: acceptable to ship v1 with team-level Live and add per-player later?
- Private-league auth reuse: does the existing ESPN sync already hold `espn_s2`/`SWID` we can reuse
  for DEP-1, or is a connect step needed? (Confirm against `ConnectScoresModal`.)
