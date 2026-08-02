# LeagueWeaver v3 — Post-Generation Schedule Audit & Backlog

**Date:** 2026-07-31
**Scope:** Every page reachable *after* a schedule is generated — the Season Workspace and all its views/tabs, the Simulator, the public share page, and the generation reveal.
**League used:** `Prodigies vs. Esteemed FFL (Real)` (10 teams, 2 divisions, 14 weeks, ESPN-imported). Played states were verified by generating this league and scoring weeks 1–12.
**Method:** Three parallel-subagent passes over the source + live browser verification (contrast, computed sizes, DOM semantics, real keypresses, console). Pass 1 = a11y/correctness; Pass 2 = visual/design-system; Pass 3 = played states + Simulator + Playoffs on the real league.

### How to read a story
Every story is self-contained — an engineer or designer should be able to pick it up with **no prior context**. Each has:
- **Problem** — what's wrong and why it matters.
- **Where** — `file:line` anchors.
- **Current** — what it does today.
- **Target** — the desired outcome. For visual stories this is an explicit spec (sizes, weights, colors, spacing, states) describing *what it should look like*.
- **Acceptance** — a testable definition of done.
- **Deps / Evidence / Status** — dependencies, live-verification notes, hold flags.

**Design tokens** referenced throughout are defined once in **V1** — read that first; the visual stories build on it.

---

## Coverage matrix

100% code/design coverage of all 6 rail pages and every tab; live-verification on the highest-traffic surfaces.

| Page / tab | Code | Live |
|---|---|---|
| League Schedule | ✅ | ✅ preseason + played |
| Team Schedule — directory / single team | ✅ | ✅ / ✅ |
| Game of the Week | ✅ | ⚠️ badge only |
| Matchup Ratings | ✅ | ✅ played (2026-08-01 — see MR cluster) |
| Standings — table | ✅ | ✅ preseason + played |
| — Rank race | ✅ | ✅ preseason |
| — Team leaders / League leaders / Team stats | ✅ | ⚠️ code-read (#39–#41) + 📱 live @375px (#42) |
| — Playoff stats | ✅ | 🔒 gated |
| — Season odds | ✅ | ✅ played |
| Settings | ✅ | ❌ |
| Score modal · Simulator · Public share | ✅ | ❌ |
| GenerationReveal | ✅ | ✅ |
| Playoffs / brackets | ✅ | 🔒 gated |

---

# 🔴 HIGH — correctness, data-loss, blocking a11y

## H1 · Confirm-gate the 3 destructive actions
**Type:** correctness/trust · **Status:** ✅ DONE (2026-07-31, worktree) — All three now route through `ConfirmDialog` (danger tone, `role="alertdialog"`, Cancel auto-focused as the safe default, focus-trap + focus-return via `Modal`). A `confirmAction` state gates them: Share button, both Save-run-back paths (`commitSimulation` button + `SimulatorWorkspace onSave`), and Regenerate (converted from a `<Link href="/">` to a button + new `onRegenerate` prop on `SettingsView`). Copy per spec — Share: "publishes your full schedule **and manager names**…"; Save-back: "replaces **N real game scores**…" (N from recorded-score count); Regenerate: "builds a new matchup slate and **clears any entered scores and standings.**" **Verified live** (worktree): Share + Regenerate open with correct copy/tone/Cancel-focus; Escape and Cancel abort with nothing changed; confirming Regenerate navigates to the builder; 0 console errors; `tsc`/`build` green. Commit variant verified by parity (identical dialog path; live drive needs the full simulator launch). *(Worktree branch `worktree-h10-division-movement`.)*
**Problem:** Three irreversible actions fire on a single click with no confirmation, undercutting the product's core "your real season is safe / your data is private" promise. A reflexive click can publish private data, overwrite real scores, or wipe a schedule.
**Where:** Share `SeasonWorkspace.tsx:1683`; Save-run-back `commitSimulation` `SeasonWorkspace.tsx:1553`; Regenerate `SeasonWorkspace.tsx:1036`.
**Current:** Each executes immediately.
**Target:** Route each through the existing `ConfirmDialog` (`components/ui/Modal.tsx`), danger tone, safe default focus on Cancel. Copy states exactly what happens and the count affected:
- Share → "This publishes your full schedule **and manager names** to a public web page anyone can open." + preview link. (See H2 for the panel it opens into.)
- Save-run-back → "This replaces **N real game scores** with your simulated results."
- Regenerate → "This builds a new matchup slate and **clears any entered scores and standings.**"
**Acceptance:** Each action shows a dialog first; Escape/Cancel aborts with nothing changed; confirming performs the action; dialog is focus-trapped and returns focus on close.
**Deps:** none (reuses ConfirmDialog).

## H2 · Publish lifecycle: unpublish + persistent URL
**Type:** correctness/trust · **Status:** open
**Problem:** Publishing is one-way. The public URL is shown only in a toast that auto-clears after ~5s, and there is no way to take a published schedule down — even though a working DELETE endpoint exists but is never called.
**Where:** `share()` `SeasonWorkspace.tsx:1683-1702`; toast `:1698`; unused DELETE `app/api/publish/route.ts:44`.
**Current:** Publish → transient toast → URL lost; no unpublish.
**Target (visual):** After publishing, replace the toast with a **persistent "Public page is live" panel** in the workspace (near the Share button). Layout: a small card with a green "Live" status dot, the public URL in a read-only field, and three buttons — **Copy link** (primary), **Open** (secondary, new tab), **Unpublish** (danger, wires the existing DELETE). When unpublished, the panel collapses to a muted "Not published" state with a single **Publish** action. Persist published status on the schedule so the panel survives reloads.
**Acceptance:** URL retrievable any time after publishing; Unpublish calls DELETE and flips the panel to "Not published"; status survives reload.
**Deps:** H1 (Share confirm feeds into this panel).

## H3 · Fix or relabel the simulator "Confidence"
**Type:** correctness/trust · **Status:** open
**Problem:** The odds table's "Confidence" is a function of trial count only, so it is **identical for every team and always reads "High"** — the "Medium"/"Developing" label branches are unreachable. It looks per-team and informative but says nothing.
**Where:** `monteCarloConfidence` `lib/simulator.ts:947-954`; rendered `SimulatorWorkspace.tsx:341`.
**Current:** `~0.956` for 500 trials, applied to all rows → every bar ~96% full, every label "High".
**Target:** Either (a) compute a genuine per-team margin of error from that team's event rate `p`: `1.96·√(p(1-p)/trials)`, so the bar and label actually vary; or (b) drop the per-row column and show **one run-level chip** in the control band labeled "Margin of error ±X% (N sims)". Pick (a) if the column stays.
**Acceptance:** Values differ across teams (option a) or the misleading per-row column is gone (option b); no dead label branches.

## H4 · GOTW crash guard + empty state
**Type:** correctness · **Status:** ✅ DONE (2026-08-01, branch `feat/audit-followups-7-31`) — Dropped the non-null assertions in `GotwWorkspace.tsx`: each timeline entry now resolves `away`/`home` safely and renders a **"Matchup unavailable — a team was removed"** fallback card (mirrors the TeamSchedule pattern) instead of throwing `undefined.divisionId`. When `gotwTimeline` is empty, the view renders a centered empty state ("No Game of the Week selected yet — check back after Week 1", `role="status"`). New `.gotw-empty` / `.gotw-unavailable` CSS. `tsc` green.
**Problem:** The Game of the Week view throws and blanks entirely if a featured game references a team that was deleted after generation (non-null assertions, no guard). It also renders nothing (no message) when there are no featured games.
**Where:** `GotwWorkspace.tsx:32-33` (`teamById.get(...)!`); empty case `:30-74`.
**Current:** `undefined.divisionId` → throw → white view.
**Target:** Filter out or render a fallback card for entries whose teams don't resolve (mirror `TeamSchedulePage.tsx:424` "Opponent unavailable"). When `gotwTimeline` is empty, render an empty state: centered icon + "No Game of the Week selected yet — check back after Week 1."
**Acceptance:** Deleting a team never blanks the view; empty timeline shows the message.

## H5 · Announce workspace notices (aria-live)
**Type:** a11y · **Status:** ✅ DONE (2026-07-31, worktree) — `.workspace-notice` is now always rendered with `role="status" aria-live="polite"` (was conditionally mounted only when a notice existed, so SR users heard nothing). The `<Cloud/>` icon + text render only when `notice` is set. To avoid an empty gold bar, the visual chrome (min-height/background/border) moved to `.workspace-notice:not(:empty)`, so the empty live region stays in the DOM + a11y tree with **0px height**. **Verified live** (worktree): region present, `role=status`, `aria-live=polite`, empty height 0; 0 console errors; `tsc`/`build` green. *(Worktree branch `worktree-h10-division-movement`.)*
**Problem:** Every async outcome routed through `setNotice` (link copied, "Cloud revision N saved", publish failure, sync results) is visual-only — silent to screen readers. The public page's subscribe notice already does this correctly, so it's an inconsistency.
**Where:** `SeasonWorkspace.tsx:1774` (`.workspace-notice`).
**Current:** `<div className="workspace-notice">…</div>` with no role.
**Target:** Render the notice container **always present** (even when empty) with `role="status" aria-live="polite"`, so the region exists before text arrives and updates are announced.
**Acceptance:** With a screen reader, copying the share link / saving / a sync result is announced without moving focus.

## H6 · Team-directory cards: fix a11y markup ✓LIVE
**Type:** a11y · **Status:** ✅ DONE (2026-08-01, branch `feat/audit-followups-7-31`) — The directory card is now a plain `<div>` (was a `<button>` wrapping `<div>/<dl>` — invalid, and its `aria-label` masked all the stats). The click is a **stretched empty `<button className="team-directory-open">`** (absolute inset:0, z-index 1) carrying `aria-label="Open <team> schedule"` and the focus ring; the `TeamIdentityBlock` + `<dl>` stats now sit outside any button and are exposed to AT normally. Hover/focus moved to `:has(.team-directory-open:hover)` / `.team-directory-open:focus-visible`. Card stays fully clickable. `tsc` green.
**Problem:** On the Team Schedule directory, each team card is a `<button aria-label="Open X schedule">`. The `aria-label` overrides the whole subtree, so a screen-reader user hears only "Open Bandera Decoupes schedule" — the live rank, record, byes, avg rating, SOS, and clinch badges (the entire reason for the directory) are silent. The button also nests invalid flow content (`<div>/<dl>/<dt>/<dd>`), a spec violation.
**Where:** `TeamSchedulePage.tsx:205-234`; `TeamIdentityBlock` `MatchupPresentation.tsx:49`.
**Current (verified live):** accessible name = just the aria-label; visible text (all stats) not exposed.
**Target:** Restructure so the interactive element wraps only phrasing content. Preferred: card is a plain container; a single titled link (team name) is the focusable control; the `<dl>` stats sit outside the link and are exposed to AT normally. Drop the blanket `aria-label`.
**Acceptance:** AT reads team name + stats; no `<button>` contains `<div>/<dl>`; card still fully clickable via the link.

## H7 · Rank-race chart accessibility
**Type:** a11y · **Status:** open
**Problem:** The rank-race SVG is `role="img"` (atomic) yet contains ~200 focusable `role="button"` points (teams × weeks) — contradictory: either the point labels are swallowed or they create 200+ tab stops with no skip. There's no data-table alternative, and lines are distinguished by color only, while `accessibleTeamColor` collapses similar hues toward the same near-black.
**Where:** SVG `StatsWorkspace.tsx:440`; points `:464-481`; color `:367`.
**Current:** color-only spaghetti; no keyboard-sane path.
**Target:** Drop `role="img"` from the interactive SVG. Add a visually-hidden `<table>` of week×team ranks as the AT path. Gate point `tabIndex` behind an explicit "explore data points" toggle (default off). Add redundant series encoding (see V8) and dedupe colliding colors via `accessibleLineColor` (V10).
**Acceptance:** ≤ a handful of tab stops by default; a hidden data table conveys the values; series distinguishable without color.
**Deps:** V8, V10.

## H8 · Make the 6 stats tabs a real tablist ✓LIVE
**Type:** a11y · **Status:** ✅ DONE (2026-08-01, branch `feat/audit-followups-7-31`) — The Standings sub-tab strip now implements the APG tabs pattern: roving `tabIndex` (0 on selected, −1 on rest via `statsTabRefs`), an `onKeyDown` handler for **ArrowLeft/Right/Home/End** (automatic activation, wraps), each tab `aria-controls` its panel, and every panel got `role="tabpanel" id="stats-panel-…" aria-labelledby="stats-tab-…" tabIndex={0}`. Playoff-stats is now `aria-disabled` (was `disabled`) so it **stays focusable/discoverable** with an explanatory `aria-label` ("available once playoff games have final scores"); its lock icon is `aria-hidden`. **Verified live**: real ArrowRight moved Standings→Rank race (selection + focus + panel all followed). *Note:* the nested `.leader-category-tabs` (league-leaders) still needs the same pattern — small follow-up.
**Problem:** The Standings sub-tab strip announces `role="tablist"` but doesn't behave like one — arrow keys do nothing (verified with a real ArrowRight: focus and selection stayed put), all tabs are `tabindex=0`, there are no `aria-controls`, and there are **zero `tabpanel`s**. The disabled "Playoff stats" tab drops out of focus order and its lock icon has no text alternative.
**Where:** `StatsWorkspace.tsx:619` (also league-leader tabs `:640`).
**Current (verified live):** 6 tabs, all `tabindex=0`, `aria-controls: null`, 0 tabpanels, arrows dead.
**Target:** Implement the APG tabs pattern — roving `tabindex` (0 on selected, −1 on rest), Left/Right/Home/End handler, each panel `role="tabpanel"` with `id` + `aria-labelledby`, each tab `aria-controls` its panel. Make Playoff-stats `aria-disabled="true"` (keep it focusable) with an explanatory label ("available once playoff games have final scores"); mark the lock `aria-hidden`.
**Acceptance:** Arrow keys move selection; each panel is associated; the disabled tab is discoverable with a reason.

## H9 · Score-image import: mount or delete
**Type:** correctness · **Status:** open
**Problem:** `ScoreImageImport` (upload a scoreboard screenshot → OCR → review/edit → apply) is fully built but **mounted nowhere** — the feature doesn't ship. Its supporting state (`scoreImportPending`, `scoreDiscardConfirmOpen`) and a nested discard-confirm are consequently dead too.
**Where:** component `SeasonWorkspace.tsx:540`; handler `applyImportedScores :1436`; modal body renders only `ScoresView` `:1765`.
**Current:** unreachable.
**Target:** Decide product intent. If keeping: render `<ScoreImageImport onApply={applyImportedScores} onPendingChange={setScoreImportPending} />` in the score-modal body, and fix the latent nested discard-confirm (`:1766`) to be its own real `Modal`/`ConfirmDialog` so it gets its own focus trap (it currently isn't isolated). If cutting: delete the component + orphaned state.
**Acceptance:** Feature is either reachable and working (with a trapped nested confirm) or removed with no dead references.

## H10 · Division-scope movement uses league seed ✓LIVE
**Type:** correctness · **Status:** ✅ DONE (2026-07-31) — In division scope, `preseasonRankByTeam` (always the league-wide seed) was compared against a row's within-division `rank`, producing nonsense PRE RK + FROM-PRE. Fix (`StatsWorkspace.tsx`): build a `scopedPreseasonRankByTeam` that re-ranks the division's teams by their league preseason seed (1..k) when `divisionId !== "all"`; feed it to both the PRE RK cell and `PreseasonMovement`. League scope unchanged. **Verified live** (worktree, played league `c04a2cf2`, Prodigy division): PRE RK now `#3/#5/#4/#2/#1` (division-relative, was league seeds `#6/#10/#7/#4/#2`); last-place team shows **↓4** not a false ↑; 0 console errors; `tsc` + isolated `next build` green. *(Implemented in worktree branch `worktree-h10-division-movement`; awaiting consolidation with main — see session note.)*
**Problem:** In the standings, when scope = a division, the "PRE RK" and "FROM PRE" columns compare a **league** preseason seed to a **division** live rank — so movement is nonsense. Verified live: McDonough Kings, last in its division and **ELIMINATED (W12)**, displays a green **"↑4"** (`#9 league seed − division rank 5 = +4`).
**Where:** `StatsWorkspace.tsx:573,578,588-594`; `PreseasonMovement :224-229`. `preseasonRankByTeam` is always league-wide (`getLiveRankHistory` only runs `scope:"league"`) while `row.rank` is division rank when `divisionId !== "all"`.
**Current (verified live):** eliminated last-place team shows "↑4".
**Target:** When scope is a division, build a **division-scoped preseason seed map** (rank teams within the division by preseason seed) and use it for both the PRE RK cell and the FROM-PRE delta. League scope unchanged.
**Acceptance:** In division scope, a team's PRE RK is its division preseason seed and movement is division-relative; the eliminated bottom team no longer shows a positive arrow.

## H11 · Simulator Restart + Save can wipe the real season
**Type:** data-loss · **Status:** ✓ fixed (engine + regression test; live UI blocked — see R-sim)
**Problem:** "Restart Week 1" clears **all** sandbox results including the recorded (real) ones; `materialize` then strips scores from every game not in `results` and nulls `playoffGames`. So Restart-then-Save replaces the real schedule with a blank one — no confirm, no diff, and the banner reads "0 simulated" so it looks empty/safe right before the destructive save.
**Where:** `restartSimulationFromBeginning` `lib/simulator.ts:457-468`; commit `SeasonWorkspace.tsx:1553-1562`; save buttons `SimulatorWorkspace.tsx:300`.
**Current:** silent full wipe possible.
**Target:** Gate `commitSimulation` behind the H1 confirm ("This replaces N real scores"). Additionally, **refuse to commit** a sandbox whose `results` no longer contain the recorded set, or re-seed recorded results on restart so materialize can't erase real data.
**Acceptance:** No path overwrites recorded scores without an explicit, accurate confirm; a restarted-then-committed sandbox can't blank real data.
**Deps:** H1.
**Fix (2026-08-01):** `restartSimulationFromBeginning` now re-seeds `recordedResults` instead of `{}` (`lib/simulator.ts:457`), so materialize can never strip real scores; `commitSimulation` also refuses to commit a schedule carrying fewer real scores than the season already has (`SeasonWorkspace.tsx`). The H1 commit confirm already counts real scores accurately. Covered by `scripts/simulator-matrix.ts` (rewrote the completed-restart check that had codified the bug; added a partial-season regression). Engine-verified; **could not** be driven live — see R-sim.

## R-sim · Simulator has no reachable entry (orphaned, like PlayoffsView)
**Type:** navigation/dead-code · **Status:** open (discovered while doing H11)
**Problem:** The only `setView("simulator")` lives inside the simulation banner (`SeasonWorkspace.tsx:1933`), which renders only when a `simulation` already exists — and nothing starts one. `SimulatorLaunch` (the "Play Simulator" screen) renders only when `view === "simulator"`, and the URL guard (`:1354`) rejects `?view=simulator` (not in `VIEW_ITEMS`). So the whole Simulator (`SimulatorWorkspace`, launch, banner) is unreachable through the UI. Verified live: `?view=simulator` lands on League Schedule with no simulator affordance anywhere.
**Where:** entry gap around `SeasonWorkspace.tsx:1933/1945`, guard `:1347-1354`.
**Target:** Wire a real entry (a rail/toolbar "Simulator" action or accept `?view=simulator`), then live-verify H11's restart→save path once reachable.

## H12 · Playoff bracket correctness + z-order — ⏸ HOLD (gated, unQA'd)
**Type:** correctness · **Status:** parked (playoffs)
**Problem:** `canAccessPlayoffs=false` hides all of this, so it ships unQA'd. (1) `reseedMode` is ignored — `projectPlayoffRounds` always sort-and-pairs (reseeds), so "fixed bracket" leagues show wrong future matchups while the subtitle literally says "Fixed bracket path". (2) A connector draws a confidently-wrong line to game 1 when a next-round lookup returns −1. (3) Section wrappers form stacking contexts, so cards' `z-index:4` can't beat the sibling connector SVG at z3 — lines render *over* card faces, defeating the intended "cards over lines".
**Where:** `lib/playoffs.ts:379-401`; subtitle `SeasonWorkspace.tsx:903`; connector `SeasonWorkspace.tsx:794`; z-order `BracketConnectorLayer.tsx:131` vs `globals.css:2857`.
**Target:** Branch pairing on `settings.reseedMode` (fixed → advance into pre-computed slots; each-round/protected → sort-and-pair). Return `[]` on a −1 lookup instead of `Math.max(0,-1)`. Put cards + SVG in one stacking context (drop z-index on the section wrappers, raise the cards). Run a full 4/6/8/14-seed pass when the flag flips.
**Status:** parked per current direction.

---

# 🟠 MEDIUM

## #18 · Correctness & security cluster
**Type:** correctness/security · **Status:** ✅ DONE (2026-08-01, branch `feat/audit-followups-7-31`) — (1) `lib/csv.ts` `cell()` now prefixes any cell starting with `= + - @` / tab / CR with an apostrophe → CSV opens inert in Excel/Sheets. (2) `parseScore` clamps **0–300** (`Math.min(300, Math.max(0, …))`). (3) *Moot* — the rating-tier filter that hid the GOTW no longer exists (`visibleGames = orderedGames`, no tier drop). (4) Silent game-drop: a `droppedGameCount` is computed and the week renders a `role="alert"` **data-integrity warning** ("N matchups can't be shown — a team was removed") instead of just showing fewer games. (5) Regenerate now `saveSetup(activeSchedule.setup)` before `router.push("/build")`, so the builder opens **seeded with this league** (was a blank `/build`). `tsc` green.
**Problem/Target (5 fixes):**
1. **CSV formula injection** — `lib/csv.ts:4-7` quotes cells but doesn't neutralize a leading `= + - @`; a team/manager named `=HYPERLINK(...)` executes on open in Excel/Sheets. Prefix such cells with a leading apostrophe before quoting.
2. **No score ceiling** — `parseScore` `SeasonWorkspace.tsx:514` clamps ≥0 but has no max; `999999` propagates into standings/odds. Clamp 0–300 (parity with the simulator's `:166`).
3. **Filter hides GOTW** — `SeasonWorkspace.tsx:358` filters the featured GOTW card out when its tier ≠ the selected filter. Always pin the GOTW card regardless of filter.
4. **Silent game drop** — `SeasonWorkspace.tsx:357` drops games whose team id isn't found; an imported week silently shows fewer games. Render an "unavailable matchup" placeholder / data-integrity warning.
5. **Regenerate link** — `SeasonWorkspace.tsx:1036` links to `/` (blank builder) with no season id. Link to an editor seeded with this league's setup.
**Acceptance:** Each of the five behaves as described; CSV opens inert in Excel/Sheets.

## #19 · Preseason standings cleanup ✓LIVE
**Type:** correctness/clarity · **Status:** ✅ DONE (2026-08-01, branch `feat/audit-followups-7-31`) — At preseason (`isPreseason = selectedRankSnapshot.weekNumber === 0`): the leading column relabels **"PRE RK" → "SEED"**, and the redundant **PRE RK + FROM PRE** columns (header `<th>` and body `<td>`) are suppressed, killing the duplicate-seed / meaningless-movement-arrow columns. DIV REC already renders ties (`W-L-T`). RECORD now sorts by `wins + winPercentage` (wins first, win% breaks ties) so the RECORD and WIN% headers no longer sort identically. **Deferred:** division-grouping in the league table is the larger layout change tracked under **R3** (per-page restructure), not folded here.
**Problem (verified live):** At preseason (week 0) the standings show **two "PRE RK" columns** and a "FROM PRE" column of meaningless `—`/movement arrows computed against a nonexistent prior week.
**Where:** `StatsWorkspace.tsx:625` header + `:588-594` rank header logic.
**Target:** Relabel the leading column **"SEED"** in preseason mode and **suppress** the FROM-PRE / movement columns when `weekNumber === 0`. Also fold in: DIV record must include ties; RECORD and WIN% must not sort identically (sort RECORD by wins then win%); offer division grouping in the league standings (headers within the table or a two-column layout).
**Acceptance:** No duplicate PRE RK; no movement arrows at preseason; DIV record shows ties; the two sort headers differ.

## #20 · Clarity: ratings, home/away, empty states
**Type:** usability · **Status:** 🟡 PARTIAL (2026-08-01, branch `feat/audit-followups-7-31`) — Parts 3/4/5 done + verified live on PVE season. (3) Rank-race now guards on `rankHistory.some(s => s.playedGames > 0)` — a genuinely preseason league shows a `.stats-empty-state` "Enter Week 1 scores to start the race." card instead of a degenerate single-column chart (`StatsWorkspace.tsx:680`). (4) GOTW page: each timeline item carries a `.gotw-why` rationale line — "Featured because it earned the week's highest matchup rating (X.X)[ and swings the playoff race][ — a <holiday> spotlight]." (`GotwWorkspace.tsx:62`), verified all 14 items render with gold accent. (5) Team-stats tab now leads with a `.stats-abbr-legend` key (PF/PA, DIFF, GOTW WINS, SOV, SOS, PLAYOFF %) above the table (`StatsWorkspace.tsx:688`). `tsc` green. **Deferred:** part 1 (rating inline-scale explainer + legend placement) and part 2 (home/away visual differentiation + own-first score order) fold into the V-series visual work (V2 hierarchy / V10 color) since they restyle the shared MatchupCard — tracked there rather than duplicated here.
**Problem/Target:**
1. **"Matchup rating" unexplained** — users meet a bare "3.7 · #2 vs #1" with the legend buried below the whole list. Add a one-line inline scale ("lower = closer, two stronger teams") next to the first occurrence and move the legend above the list / into the section bar. Explain the preseason-vs-live lens in one sentence.
2. **Home vs away (verified live)** — carried only by a tiny `@`/`vs` glyph on identical-background chips, and the per-team score is always printed `away@home` while the W/L chip is team-perspective. Differentiate H/A visually (fill vs outline, or an explicit "HOME"/"@ Opp" label) and order the per-team score own-first.
3. **Empty states** — rank-race before scores collapses to a single left-edge column (verified); add "Enter Week 1 scores to start the race."
4. **GOTW "why featured"** — add a one-line rationale per featured game.
5. **Team-stats legend** — SOV/SOS/PF/PA/DIFF/GOTW WINS/PLAYOFF% have no key; add a rule strip / header tooltips.
**Acceptance:** A first-time commissioner can explain the rating, tell home from away at a glance, and never sees a blank/degenerate analytics panel without guidance.

## #21 · Share / sync / notify UX
**Type:** usability/trust · **Status:** ✅ DONE (2026-08-01, branch `feat/audit-followups-7-31`) — (1) Public subscribe form now carries a `.public-subscribe-consent` line ("only get emails when the commissioner publishes a change · unsubscribe from the link in every email · Privacy Policy" linking `/privacy`) below the CTA (`PublicScheduleView.tsx`). (4) ESPN PDF export now tracks a `pdfBusy` state: the button disables + shows a spinner + "Building…", sets `aria-busy`, guards against concurrent builds, and surfaces a notice on failure (`SeasonWorkspace.tsx` toolbar). (5) Platform Sync card is now gated on the `canAccessPlatformSync` entitlement — non-Pro users get a locked, informational `.platform-sync-card.is-locked` state (LockKeyhole, "manual entry always available") instead of the Connect flow; the card was already reworked to a real two-mode Manual/Automatic select with a details panel, so the "single-option select / phantom credential fields" premise was already stale. (2)+(3) already resolved by prior refactors: SeasonWorkspace no longer has the bare-bell `window.confirm` send-update or the misleading guest-Share "Saved on this device" path (Share routes through a busy-gated ConfirmDialog). **Verified live** on PVE: toolbar renders with ESPN PDF `aria-busy` wired, Settings platform card renders, 0 console errors; `tsc` green. *(Public consent line + locked platform state are display-only/entitlement-gated; verified by code + typecheck since the fixture is Pro/published.)*
**Problem/Target:**
1. **Public subscribe form** `PublicScheduleView.tsx:53` collects email with no consent/privacy/unsubscribe line — add a short consent sentence linking to the privacy policy; ensure sent emails carry an unsubscribe link.
2. **Guest Share** `SeasonWorkspace.tsx:1688` fails with a misleading "Saved on this device…" message that never mentions publishing needs an account. Detect not-signed-in up front and prompt sign-in with share-specific copy.
3. **"Send schedule update"** `SeasonWorkspace.tsx:1703` is a bare bell icon firing an unstyled `window.confirm` that emails **every** subscriber. Replace with a labeled control + styled `ConfirmDialog` stating the recipient count.
4. **ESPN PDF** `SeasonWorkspace.tsx:1773` has no loading/disabled state during the async logo-fetch+build; track a generating state, disable + spinner, guard against concurrent builds.
5. **Platform Sync card** `SeasonWorkspace.tsx:963` has a single-option "Manual" select, credential fields that never render (always posts empty), and ignores the `canAccessPlatformSync` entitlement. Gate the card on the entitlement; drop the dead select + phantom fields (or wire real modes/inputs).
**Acceptance:** Each of the five behaves as described; no `window.confirm`; exports/publish give feedback and gate correctly.

## #35 · Number formatting (float artifacts) ✓LIVE
**Type:** correctness/polish · **Status:** ✅ DONE (2026-07-31) — Added `formatPoints()` + `formatDifferential()` to `lib/statistics.ts` (round to 1 decimal, group thousands; zero-diff → neutral tone plain "0"). Applied at every PF/PA/DIFF/score/margin/total site: StatsWorkspace standings (625), team-stats (642), team-leaders podium (639), league-leaders game-highlight (194 margin/total + scores 190/192); TeamSchedulePage ribbon (314–316) + Win%. Unplayed PCT (`wins+losses+ties===0`) → `—` at all three PCT sites. Added `.neutral` CSS. **Verified live** on the played audit league `c04a2cf2` (60 games, 59 decimal): PF `1,239.2`, PA `1,209.6`, DIFF `+155.3`/`-152.6` correct tones, 0 float artifacts across standings/team-stats/team-leaders/league-leaders/team-page; edge cases on preseason league: PCT `—`, diff `0` neutral. `tsc`+`build` green; lint delta 0.
**Problem (verified live):** With decimal scores the standings print raw floats — `PF 1217.3999999999999`, `DIFF +77.79999999999995`, `-258.60000000000036`. Fantasy scores are commonly decimals, so this is visible to anyone.
**Where:** `pointsFor/pointsAgainst` accumulate raw floats `lib/standings.ts:63-66`; printed unformatted `StatsWorkspace.tsx:625,642`, margins `lib/statistics.ts:240-241`.
**Target:** One `formatPoints(n)` helper (e.g. `n.toLocaleString(undefined,{maximumFractionDigits:1})`) applied at **every** PF/PA/DIFF/score/margin/total render site. Also: `+0` currently renders in the green `.positive` style — special-case `0` to a neutral class showing plain `0`; `.000` PCT shows for unplayed teams identical to 0-2 — show `—` when `wins+losses+ties === 0`.
**Acceptance:** No float artifacts anywhere; numbers are tabular-aligned; `0` diff is neutral; unplayed PCT is `—`.

## #36 · Division win% + head-to-head tie correctness
**Type:** correctness · **Status:** ✅ DONE (2026-08-01, branch `feat/audit-followups-7-31`) — (1) Division win% now counts a tie as half a win — `(W + T*0.5)/(W+L+T)` — at the team-stats DIV sort (`StatsWorkspace.tsx:532`), the "Best division record" podium (`:654`), and `divisionsPlayed` (`:611`, now includes ties); podium label shows the tie count. A `3-0-2` team no longer scores `1.000` over `4-1-0`. (2) Head-to-head (`lib/standings.ts`) now only decides a tie group when **every** tied team has played **every** other tied team (`h2hFullyPlayed`); otherwise the rule is skipped uniformly instead of nulling — and sinking — the team that hadn't met the others. `tsc` green.
**Problem:** (1) Division win% ranking drops ties — `StatsWorkspace.tsx:530,596,639` use `W/(W+L)`, so a `3-0-2` team scores `1.000` and outranks `4-1-0`; contradicts `lib/standings.ts:195` which counts a tie as half a win. (2) The head-to-head tiebreaker fires on partial results — in a 3+ way tie, a team that never played the others gets `null` and is shoved to the bottom (`lib/standings.ts:194`, `recordAgainst :118-132`).
**Target:** Use `(W + T*0.5)/(W+L+T)` (or the existing `recordPercentage`) everywhere division records are ranked. Only apply head-to-head when every tied team has played every other tied team; otherwise skip to the next rule.
**Acceptance:** Division records including ties rank consistently across Standings and Team-stats; H2H only decides a fully-round-robined tie group.

## #37 · Simulator UX/visual cluster
**Type:** usability/visual/a11y · **Status:** open
**Problem/Target:**
1. **Roll doesn't lock the UI** — mid-roll the tabs (`SimulatorWorkspace.tsx:243`), game selector (`:262`), command bar and commissioner panel stay live. Derive one `busy` flag → `disabled`/`aria-disabled` on all controls + `aria-busy` on the workspace + dim the whole surface (not just the game-day card).
2. **Finish-distribution sparkline near-invisible** — bars are `Math.max(2, p*100)%` **absolute** (not normalized to the row's max), so the tallest is ~6–8px and the rest sit at the 2px floor → looks flat; fill is raw team color on white; the aria-label carries no data. **Target look:** normalize each row to its own max (tallest bar ≈ full 28px height), use a guaranteed-contrast fill (or outline), add a value label ("Most likely: 4th, 22%") and a "1st → last" caption on the column.
3. **Odds meter contrast** — `background: team.color` (`:334`) puts default-ink `%` text over a dark bar for dark teams. Use a fixed light track with the value on a chip, or luminance-based text (see V10).
4. **520ms fake delay** — `runAnimated :158-165` waits 520ms then runs the compute **synchronously**, freezing the dice. Offload heavy actions to the worker; tie the animation to real completion; drop the delay for cheap single-week actions.
5. **Hardcoded nudge scores** — winner-nudge writes `128-117` for every game (`:289`). Derive from win-probability/strength.
6. **SimulatorLaunch** silently discards a paused run on "Start from real season" (`:1139-1152`). Relabel "Resume paused run" / "Discard & start fresh" + confirm before discarding.
7. **Tablist incomplete** (no tabpanel/aria-controls/arrow keys) — same fix pattern as H8.
8. Sub-44px targets; score input snaps to 0 while editing (`:166` — keep the raw string, clamp on blur); recap "Seed #" mislabels preseason rank (`:314` → "Preseason #N").
**Acceptance:** The surface visibly locks during a roll; the sparkline reads as a distribution; odds text is legible on every team color; no artificial lag on cheap actions; nudge scores look plausible; paused runs aren't lost silently.

## #38 · Clinch-badge pileup + editors a11y  *(bracket-specific parts ⏸ HOLD)*
**Type:** a11y/visual · **Status:** partly open, partly parked
**Problem/Target (active parts):**
1. **Clinch badge pileup** — a top team renders `#1 SEED` + `DIV CHAMP` + `PLAYOFF` stacked (`ClinchBadges.tsx:34-38`), redundant and amplifying gold overload; and the "Clinched … after Week N" explanation lives only in a `title` (inaccessible). **Target:** collapse to the single highest-order badge earned (a #1 seed implies berth + division); move the clinch-week text into visible/`aria` content, not `title`.
2. **Clinch legend mismatch** — the legend's DIV CHAMP swatch uses a generic green Trophy, but real badges render the division's `DivisionMark` in the division color (`:41-49`). Make the legend show the division-colored treatment.
3. Rank-race milestone markers clip the SVG top / collide (`StatsWorkspace.tsx:103-104` — clamp `markerY`, reduce spacing near edges); tie games show no TIE indicator (`MatchupPresentation.tsx:148` — add a "TIE" caption when played & equal); sticky odds/table headers never stick (no `max-height` on the wrap).
**Parked (playoffs):** bracket-flow AT summary; the two duplicated playoff score editors (`SeasonWorkspace.tsx:682`, `ConsolationBracket.tsx:56` — extract one `<PlayoffScoreEditor>` + one `ordinal` util, add `role="alert"`/autofocus/Escape/`aria-controls`); `.playoff-week-heading` responsive (`globals.css:1053`); missing-seed "#0" (`SeasonWorkspace.tsx:209`).
**Acceptance (active):** one clinch badge per team with accessible clinch text; legend matches real badges; no marker clipping; ties are labeled; sticky headers pin.

---

## #39 · Standings tabs: scope + week filters silently apply to only 2 of 6 tabs
**Type:** usability/correctness-of-presentation · **Status:** open · **Added:** 2026-07-31 (standings-tab addendum)
**Problem:** The Standings page's control band — the **scope select** (`League` vs each division) and the **history select** (`Current` / `Preseason` / each past week) — renders **only** on the *Standings* and *Rank race* tabs. The `divisionId` and `standingsWeek` state persists when you switch tabs, but *Team leaders*, *League leaders*, and *Team stats* never read it: they always compute league-wide and season-to-date, with no control to change scope and no label saying so. So a commissioner who filters to one division on Standings, then clicks *Team stats*, silently sees all teams again; if they pick "After Week 5" then open *Team leaders*, they still get full-season podiums. The selection looks sticky (the other selects remember it) but is a no-op on 4 of 6 tabs. **Second defect, same family — a within-tab temporal mismatch:** on the *Standings* tab itself, choosing a past week rewinds the table, tie groups, and clinch badges (`selectedClinches` `:566`), but the **Season odds** panel below it (`odds` `:556`, `visibleOdds` `:595`) is always the present-day projection with no "as of now" label — so one tab shows Week-5 standings stacked directly on top of live playoff odds.
**Where:** filter bar only in `StatsWorkspace.tsx:636` (standings) + `:650` (rank-race); absent from `:654` (team-leaders), `:655` (league-leaders), `:657` (team-stats). Those blocks use `completedTeams`/`regularGames`/`sortRows` — none reference `divisionId` or `selectedRankSnapshot`. Odds temporal mismatch: `:642-645`.
**Current (code-read, this pass):** scope/week affect 2 tabs; the other 3 ignore both silently; Season odds panel ignores the selected historical week.
**Target:** Decide the scope contract and make it visible. Preferred: **hoist the filter bar so it persists across all applicable tabs**, and actually apply it — Team stats and Team leaders filter to the selected division and (where meaningful) compute through the selected week; League leaders filter its game set to the division. Where a filter genuinely can't apply to a tab, still render the bar but **disable that control with a reason** ("Team leaders are season-to-date") rather than dropping it. For the Season odds panel, add an explicit "live projection — as of now" caption whenever `standingsWeek` is a past week, so the two time frames don't read as one.
**Acceptance:** the scope/week you pick either applies on every tab or is shown disabled-with-reason; no tab silently discards a selection; on a historical week the odds panel is labelled as present-day, not implied to match the rewound table.
**Deps:** relates to R1 (if the tabs become pages, each page owns its own scope control) and H8 (tab semantics).

## #40 · Team-stats tab: forced desktop scroll + DIV-record display drift
**Type:** visual/responsive + correctness/consistency · **Status:** open · **Added:** 2026-07-31 (standings-tab addendum)
**Problem:** (1) The Team-stats table is `min-width:1360px` (`globals.css:2472`) inside the ~1180px workspace shell, so its 15-column grid is **permanently horizontally scrolling on desktop** — a sticky first column plus an always-live scrollbar, before any narrow viewport. This is a *different, wider* table than the one V5 addresses (`team-schedule-table`, 1280px), so V5 does not cover it. (2) The **DIV** column prints `W-L` with **no ties** (`StatsWorkspace.tsx:657`: `{row.divisionWins}-{row.divisionLosses}`), while the Standings tab's **DIV REC** column of the same data includes them (`:640`: `…{row.divisionTies ? \`-${divisionTies}\` : ""}`) — so a `3-1-1` division record reads `3-1` here and `3-1-1` one tab over. (Row rhythm / near-black header / no-hover on this table are already logged under **V9**; the gold sort-active indicator is folded into **V4** below.)
**Where:** width `globals.css:2472`; DIV cell `StatsWorkspace.tsx:657` vs standings `:640`.
**Current (code-read):** 1360px table always side-scrolls at desktop widths; DIV column silently drops ties.
**Target:** Trim the table to fit a normal laptop without horizontal scroll — tighten per-column mins and/or make the lowest-value columns (SOV/SOS/GOTW WINS/BEST STREAK) opt-in via a "Display" toggle, or widen the shell when this tab is active; under ~720px stack to cards (mirror V5). Print DIV as `W-L(-T)` exactly as the Standings table does, from one shared record-formatter.
**Acceptance:** the Team-stats table fits a 1280px viewport with no horizontal scroll; DIV records render identically (ties included) in both the Standings and Team-stats tables.
**Deps:** V5 (responsive pattern), V9 (table craft), #36 (division-record ties in ranking).

## #42 · Standings tabs: mobile (≤375px) — off-screen tabs, crushed podium, peephole tables ✓LIVE
**Type:** visual/responsive + a11y · **Status:** open · **Added:** 2026-07-31 (standings-tab mobile addendum) · **Verified live @375px** on a generated 10-team/2-division league scored through Week 12.
**Problem (all measured live at viewport 375px):**
1. **Sub-tab strip hides 3 of 6 tabs with no affordance and no active-into-view.** `.stats-tabs` is `overflow-x:auto` with 6 × 128px min buttons: clientWidth **349px**, scrollWidth **768px** → **419px (55%) off-screen**. "Team stats" lives at left **653–781px** — entirely past the 375px edge. Selecting it leaves `strip.scrollLeft = 0`, so **the active tab is fully off-screen while its panel shows below** — the visible strip shows *no* active indicator at all (screenshotted). There's no edge fade / arrow to signal more tabs exist. Same defect the schedule week-tabs have under #22; `.stats-tabs` + `.leader-category-tabs` were not included there.
2. **Team-leaders podium stays 3-up inside a full-width card → every name clips.** At ≤720px `.team-leader-grid` correctly collapses 2-up→1-up, but `.podium-columns` stays `repeat(3, …)`: three **116px** columns inside a 351px card. Team `strong` names (14px) overflow — measured `scrollWidth > clientWidth` on "Huddle House" and "End Zone Office"; on screen they render "Hudd…", "Blitz…", "End Z…", "Goal…", "Fourt…". Affects all 7 podium cards.
3. **Three data tables become frozen-column peepholes.** Sticky identity columns eat the majority of the viewport, leaving a sliver to scroll the real data:
   - **Standings** — table content 1271px; rank col **55px** *plus* team col **234px** both sticky = **289px = 77% of 375px**, leaving a **~60px** window for 11 data columns.
   - **Season odds** (same tab) — `min-width:820px`, 216px sticky first col — same peephole.
   - **Team stats** — 1360px, 15 columns, sticky first col **224px = 60%**, leaving a **125px** data window.
   *Good news (credited):* document-level horizontal overflow measured **0px** on every tab — the scroll is properly contained in the table wraps (matches the existing "Non-issues" note). The problem is the intra-table peephole + no card fallback, not page overflow.
**Where:** `globals.css:2285` (`.stats-tabs`), `:2440` (`.leader-category-tabs`), `:2421` (`.podium-columns`, mobile only touches min-height at `:3954`), `:2163-2165` (standings dual sticky cols), `:2398-2399` (odds sticky), `:2472,:2497` (team-stats 1360px + 224px sticky). No `scrollIntoView` on tab select in `StatsWorkspace.tsx:634`.
**Current (measured):** 3 tabs unreachable-looking with the active one off-screen; podium names truncated; standings usable through a 60px slot, team-stats through 125px.
**Target:**
- **Tab strips:** on select *and* on mount, `activeTab.scrollIntoView({inline:"center", block:"nearest"})` for `.stats-tabs` and `.leader-category-tabs`; add a right-edge fade/gradient (or a subtle chevron) whenever `scrollWidth > clientWidth` so off-screen tabs are discoverable. (Roll this into #22's scroll-into-view fix rather than duplicating it.)
- **Podium:** below ~560px collapse `.podium-columns` to a **single column** — stack Gold→Silver→Bronze as full-width rows (medal pill + logo + full, unclipped name + value). Never clip the team name.
- **Tables:** below ~720px, **stack Standings / Season odds / Team stats into per-team cards** (a header row of team identity, then label:value pairs) instead of a horizontal peephole — mirror the card-stack V5 prescribes for the team-schedule table. Minimum bar if cards are deferred: drop the *second* sticky column on Standings and shrink the sticky team column so the data window is ≥ ~55% of the viewport.
**Acceptance (re-measure @375px):** all 6 stats tabs reachable with the **active tab visible** after selection; an edge affordance appears when tabs overflow; **no podium name clips** (`scrollWidth ≤ clientWidth`); no standings/odds/team-stats table presents its data through a window narrower than ~55% of the viewport (either card-stacked or with materially reduced sticky width); document horizontal overflow stays 0.
**Deps:** #22 (shared tab scroll-into-view), #40 (team-stats width), V5 (table→card responsive pattern), V9 (table craft).

---

# 🟡 LOW

## #22 · Polish bucket (~15 items)
**Type:** polish · **Status:** open
Each is small and independent:
- Selected week tab isn't scrolled into view on deep-link/selection → `scrollIntoView({inline:"center"})` the active button (`SeasonWorkspace.tsx:373`).
- `"Game undefined"` when `gameNumber` unset — add `?? "—"` fallback (`SeasonWorkspace.tsx:411`).
- Truncated team/stadium names have no hover tooltip for sighted users — add `title={name}` on ellipsized elements (`globals.css:1216,1142`).
- Raw generation seed shown as `<code>` to commissioners — hide behind an "advanced" disclosure (`SeasonWorkspace.tsx:1045`).
- Sim command buttons don't disable during the roll (covered by #37 but tracked here too).
- Score inputs < 44px touch target (`globals.css:1426`).
- Division-less leagues still show a `DIV 0-0` chip and "Cross-div" labels — gate on `divisions.length > 1` (`MatchupPresentation.tsx:41,87`).
- `CustomSelect` has no type-ahead (`components/ui/CustomSelect.tsx`).
- Rank-race x-axis spaces skipped weeks evenly (`StatsWorkspace.tsx:399`).
- Sort buttons lack descriptive `aria-label`s (`StatsWorkspace.tsx:211`).
- `scope="col"` missing on ratings-table headers (`SeasonWorkspace.tsx:473`).
- Week-tab `aria-label` omits the slate strength sighted users see (`SeasonWorkspace.tsx:374`).
- Score-entry week selector lacks the schedule rail's `aria-current`/`aria-label` (`SeasonWorkspace.tsx:520`).
- **Standings tabs, no/1-division leagues** — division-scoped views are permanently empty and unhideable: League leaders' "Divisional" category filters `matchupType === "division"` (`StatsWorkspace.tsx:629`) → always "No completed results yet"; Team leaders' "Best division record" + "Best division point diff" cards (`:654`) can never populate (`divisionsPlayed` never true). Gate all three on `schedule.setup.divisions.length > 1` — hide the Divisional sub-tab and the two division podium cards when the league has one/zero divisions (parity with #22's division-chip gating).
**Acceptance:** each ticked off independently.

---

# 🎨 VISUAL / DESIGN SYSTEM

## V1 · Design-token foundation (keystone) ✓LIVE
**Type:** design-system · **Status:** ✅ DONE (2026-07-31) — token set defined in `:root` (8-step type ramp + `--num-*` + 4 weights + 4px spacing + 5 radii); legacy `--text-*` kept as aliases; mobile step-up + 16px input floor preserved. All 844 font-size / 300 weight / 306 radius literals migrated to tokens. Same-context font-size duplicates: 18 → 0. **Measured final:** 9 distinct fixed font-sizes (11/12/13/14/16/20/26/28/32) + fluid `clamp()` heros; 4 rendered weights (400/550/700/850); 5 radii (chip 4 / sm 5 / base 6 / lg 10 / pill 999, `--radius` 8→6). Verified live (schedule/standings/matchup-ratings/gotw/account): 0 sub-11 meaningful text, 0 console errors. `tsc` + `next build` green.
**Problem (measured):** `globals.css` has **29 font-sizes** (7→44px), **10 font-weights**, **17 radii**, **~60 shadows**, **224 hex literals** — a small token core (38 `:root` vars) buried under per-surface one-offs. `font-size` is declared 3–4× per element across a ~90-line "legibility floor" override block (`:3473`) that fights the component rules, leaving dead literals; e.g. `.team-identity-name strong` is set 12px@1232 / 10px@3123 / 14px@3504 (only 3504 wins).
**Target (the token set every other visual story references):**
```
/* Type ramp — 8 steps; 11px is the floor for anything meaningful */
--text-2xs: 11px;  /* micro/eyebrow/table micro-label */
--text-xs:  12px;  /* meta, chip labels */
--text-sm:  13px;  /* secondary body */
--text-md:  14px;  /* body / team-name base */
--text-lg:  16px;
--text-xl:  20px;
--text-2xl: 26px;  /* page title */
--text-3xl: 32px;
/* Display numbers */
--num-sm: 16px; --num-md: 20px; --num-lg: 28px;
/* Weights — cap at 4 */
--w-normal: 400; --w-medium: 550; --w-bold: 700; --w-black: 850;
/* Spacing — 4px scale */
--space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px;
/* Radius */
--radius-chip: 4px; --radius-sm: 5px; --radius: 6px; --radius-lg: 10px; --radius-pill: 999px;
```
Migrate hardcoded px to these; collapse the multi-layer font-size overrides into **one** token-driven declaration per element; delete superseded/dead rules. Nothing meaningful renders below `--text-2xs` (11px).
**Acceptance:** distinct font-sizes ≤ ~10, weights ≤ 4, radii ≤ 5; no element sets `font-size` in more than one place; grep shows no `<11px` on meaningful text.
**Deps:** none — unblocks V2–V10.

## V2 · Fix inverted hierarchy (name must win) ✓LIVE
**Type:** visual/hierarchy · **Status:** open
**Problem (verified live):** Secondary metadata outweighs the team identity everywhere. Record `strong` = 17px vs name 14px (`globals.css:1234` / `:3504`); hero name 18px vs record 24px (`:1953`/`:1955`); directory stat `dd` 18px vs name 14px (`:2021`); "FINAL/SCHEDULED" inflated to 12px/850 (`:3499`). Squint test lands on the digits, not who's playing.
**Target (what it should look like):**
- **Team name** = the loudest identity element: `--text-md`→`--text-lg` (14–16px), `--w-black` (850), full `--ink`.
- **Record** = one line, `--text-xs` (12px), `--w-medium`, `--muted`. (See V3 for killing the second "0-0".)
- **Status label (FINAL/SCHEDULED)** = `--text-2xs` (11px), `--w-bold`, `--muted` — an eyebrow, not a headline.
- **Score** = `--num-lg` (28px); winner `--w-black` + `--ink`, loser `--w-medium` + `--muted` (no opacity — see V10).
- **Directory stat `dd`** = `--text-sm`–`--text-md` (13–14px) so the name still wins the card.
**Acceptance:** on every matchup card, hero, and directory card, the team name is the largest/heaviest text; blurring the card, the eye lands on the two teams.
**Deps:** V1.

## V3 · Unify the chip/badge family
**Type:** visual/consistency · **Status:** open
**Problem:** Chips read as several systems — radii scatter 3/4/5/6/11px (medal 11px pill @1749 but 4px rect @1784; week-rank 5px @1181 / 3px @1192), and two weight families (label chips Archivo 650 vs `.location-chip`/`.result-chip` weight 900, `:1318-1319`), with ad-hoc padding.
**Target (one `.chip` spec):**
- radius `--radius-chip` (4px), height 24px single-line, padding `0 var(--space-2)` (8px), font `--text-2xs`/`--w-medium` (11px/550), uppercase optional with `.04em` tracking.
- Variant by `data-variant`, each mapped to **one** semantic token pair (bg tint + ink): `gotw` (gold), `upset` (orange), `series`/`div` (neutral/division), `sim` (one desaturated accent). No weight-900 utility chips.
- Medal/rank/gotw/series/location/result all render through this one primitive and read as a family.
**Acceptance:** one chip class; ≤1 radius and ≤1 weight across all chips; a badge looks identical in the podium and on a card.
**Deps:** V1, V4.

## V4 · Palette discipline (gold + accent overload)
**Type:** visual/color · **Status:** open
**Problem:** Gold means three things — GOTW chip (`:1144`), tie result (`:1322`), holiday marker (`:1127`) — so users can't learn the code. Sim/override add teal `#155d69` (`:1147`) + blue `#3e4f7e` (`:1148`) + teal/blue inset bars (`:1220-1222`), so one card edge can show **5 accent hues**. Played state adds an orange "Upset" chip too.
**Target (semantic color map — each color = one meaning):**
- **Gold** → GOTW / marquee **only**.
- **Ties** → neutral gray chip. **Holidays** → their own distinct hue (e.g. a warm neutral), not gold.
- **Upset** → the single orange accent (tokenized).
- **Sim/override** → one desaturated accent (fold teal+blue together).
- **Green (`--field`/`--brand`)** → brand/primary.
- Rule: **at most one solid brand-accent edge/fill per card.**
- **Also fold in:** the Team-stats table's sort-active header uses `var(--gold)` for both text and arrow (`globals.css:2479-2480`) — another "gold means many things" instance. Retarget the sorted-column indicator to `--brand`/`--ink`, reserving gold for GOTW/marquee.
**Acceptance:** grepping the palette, gold appears only for GOTW; a single card never shows more than one accent edge; each accent maps to one documented meaning.
**Deps:** V1.

## V5 · Structural responsive + badge-row layout ✓LIVE
**Type:** visual/responsive · **Status:** open
**Problem (verified live):** `.team-schedule-table` `min-width:1280px` (`:1281`) inside a 1180px shell (`:1945`) → the sticky-column horizontal scroll is *permanently* engaged, even on desktop. And the matchup badge row mixes single-line chips with a 2-line `SignalBars` block, so its height/baseline wobble (`:1142` vs `:1158`).
**Target:**
- Cut the table `min-width` to ~980–1040px (tighten venue `:1309`/badges `:1312`/details `:1313` mins, or make low-value columns opt-in via the existing "Display" toggles), or widen the shell when the table is shown — so it fits without scroll on a normal laptop.
- **Badge row look:** keep it a single row of 24px chips only. Move the 2-line signal (rating + "#3 vs #8") and the win-probability meter into a **dedicated right-rail cluster** of the matchup card, vertically centered, so the badge strip stays one clean line.
- Under ~720px, stack the schedule table into cards.
**Acceptance:** the team table fits a 1280px viewport with no horizontal scroll; the badge row is a single consistent-height line; mobile stacks instead of side-scrolling the whole grid.
**Deps:** V1, V3.

## V6 · Consolidate button / tab / panel primitives
**Type:** visual/consistency · **Status:** open
**Problem:** A canonical `.button-primary/secondary/danger` exists (`:342`, 44px/13px/700/radius6) and only `ConfirmDialog` uses it; toolbar/simulator/cloud-retry/import buttons each ship bespoke height/radius/weight/color (`:876,:899,:2082,:2099,:2127,:910,:2233`). Tab bars differ across `.simulator-tabs`/`.playoff-view-tabs`/`.schedule-view-tabs`/`.stats-tabs`; a real `.segmented` primitive (`:436`) is unused. Panels mix square (radius 0) and 6px within one view.
**Target:**
- **Buttons:** all interactive buttons render through `.button-*` (+ size modifiers). One height (44px, 40px compact), one radius (`--radius`), one weight (700), consistent disabled treatment.
- **Tabs:** one tab component, one active-indicator convention (a 3px `--brand` underline). Reserve `.segmented` for true toggles (trials 500/1K/2K).
- **Panels:** every top-level surface container uses `--radius` (6px) — no square/rounded mix within a view.
- Set `--radius` to the real 6px; add `--radius-sm:5px`.
**Acceptance:** no bespoke button/tab CSS blocks remain; one active-indicator style; all panels share one radius.
**Deps:** V1.

## V7 · Public share page legibility
**Type:** visual/typography · **Status:** open
**Problem:** The legibility-floor override (`:3473`) is scoped to `.workspace-page`/`.team-schedule-page-shell` only, so `.public-page` (`PublicScheduleView.tsx:46`) keeps raw sizes on the one page league members actually see: matchup index 8px (`:2691`), team small 10px (`:2697`), venue 10px (`:2698`), subscribe label 9px (`:2704`), footer 9px (`:2709`).
**Target:** Bring `.public-page` into the type-floor scope (or apply `--text-*` directly): body ≥ `--text-xs` (12px), meta ≥ `--text-2xs` (11px). Match the workspace treatment so the public page looks like the same product.
**Acceptance:** no text < 11px on the public page; it visually matches the workspace type scale.
**Deps:** V1.

## V8 · Rank-race data-viz fidelity ✓LIVE
**Type:** visual/data-viz · **Status:** open
**Problem (verified live):** The milestone legend doesn't match the chart. "Division title" legend chip is pale gold + a Trophy icon, but the on-chart marker is a green circle with a star (`globals.css:1648-1651` vs `:1675-1680`); the legend uses lucide icons while markers use typographic glyphs; the two milestone golds (#1 seed vs Division title) are indistinguishable; the empty (no-scores) state collapses all logos into the left gutter.
**Target (what it should look like):**
- **Legend mirrors markers exactly:** each legend swatch uses the *same fill color and same glyph* as the plotted marker. Four clearly distinct families: #1 seed = gold, Division title = **green** (recolor the marker or the chip so they agree), Playoff berth = ink, Eliminated = red.
- **Series legibility:** add a **line-color swatch** to each legend row; hovering/focusing a legend row emphasizes that line and dims the rest to ~0.18 (wire to the existing `focused/muted` machinery `:1681`); default-dim non-focused lines. Endpoint logos on the **right end only** (not both).
- **Empty state:** when only the preseason snapshot exists, center the single column and show "Season hasn't started — check back after Week 1" instead of a left-gutter stack.
**Acceptance:** legend swatches visually equal the plotted markers; a team's line is followable by hover; the pre-scores state reads as intentional, not broken.
**Deps:** V1, V4, V10.

## V9 · Unify data-table craft
**Type:** visual/consistency · **Status:** open
**Problem:** Standings/odds tables have light-gray tracked-uppercase headers (`:1483`) while team-stats has a near-black untracked header (`:1812`) — two products. Row rhythm differs (standings 72px/12px `:1497`, team-stats 58px/9px `:1820`, odds 58px/12px). Team-stats (widest) has no hover; standings' `#fafcfb` hover is near-invisible.
**Target (one table spec):**
- Header: light `var(--canvas)` background, `--muted` uppercase, `.04em` tracking, `--text-2xs` (11px) — applied to all three tables.
- Rows: one height (~64px) and one side padding (`--space-3`, 12px); numeric columns right-aligned with `tabular-nums`.
- Hover: a visible `--field-soft`/`#f4f7f5` row highlight on all three.
- Collapse the 228px STATUS column (`:1528`) to ~120px (or hide) when no clinch badges are active in the visible rows.
**Acceptance:** the three tables share header style, row height, padding, and a visible hover; STATUS doesn't reserve dead width.
**Deps:** V1.

## V10 · Unified team/division/league color + logo identity system
**Type:** design-system · **Status:** 🟡 PARTIAL DONE (2026-07-31) — (1) `readableTextColor` (`lib/colorContrast.ts`) rewritten to use symmetric contrast + escalate to the max-contrast pure extreme; **never returns unverified bare `#000`** — verified across an 11-color spread, min contrast **4.76:1** (old code returned sub-AA `#000` on mid-grays). (2) Wired `--brand`/`--brand-on` (= `setup.color` + its `readableTextColor`) on the `.workspace-page` root; retargeted **active rail item** + **`.button-primary`** from `var(--field)` → `var(--brand, var(--field))` (green stays the default via fallback). Verified live: league color `#15A041` drives rail at 4.76:1; temp `#6D28D9` → rail purple, `--brand-on` white at 7.10:1, 0 console errors; sub-tab indicator + tiebreakers strip correctly stay green (scoped). **Remaining (full V10, still open):** `identityVars(hex,prefix)`, `--x-*` token contract, `accessibleLineColor`, EntityLogo ring/dims/lazy, topbar/GOTW brand extension. **NOTE:** shared `tsc`/`build` is currently red from a *concurrent session's* in-flight `WorkspaceSwitcher` edit in `SeasonWorkspace.tsx` + a `scorebar-preview` type error — neither is V10; V10's own code is type-clean in isolation.
**Problem — color:** The good helper `accessibleTeamColor` (iterates mix-toward-ink until ≥4.5 on white) coexists with `readableTextColor` (falls back to bare `#000` **unverified** → sub-AA rank pills) and **raw `team.color` used as a fill with text on top** (odds meter `SimulatorWorkspace.tsx:334` dark-on-dark; finish-distribution `:340`; loser 0.52 opacity = **2.51:1 measured**). Three ad-hoc token conventions coexist (`--team-brand/-ink/-on` `TeamSchedulePage.tsx:114`; `--division-chip-color/-ink` `MatchupPresentation.tsx:80`; loose `--team-text/--division-text/--entrant-color/--consolation-accent/--playoff-week-color`). The **league color `setup.color` is nearly unused** — chrome is hardwired to `--field` green.
**Target — one color contract.** A single `identityVars(hex, prefix)` in `lib/colorContrast.ts` returns a role set emitted as CSS vars; components consume tokens, never raw hex:

| Token | Derivation | Used for |
|---|---|---|
| `--x-base` | raw hex | logo tile, pip, meter fill **with no text on it** |
| `--x-ink` | `accessibleTeamColor(hex)` | brand text on light (names) — guaranteed ≥4.5 |
| `--x-on` | *fixed* `readableTextColor` that **iterates** (never bare `#000`) | text/logo **on** the brand fill |
| `--x-surface` | `tintColor(hex, .90)` | pale row/card wash |
| `--x-border` | `mixColor(hex, ink, .15)` | hairline — fixes pale-hero borderless + vanishing mark |
| `--x-line` | hue-deduped brand | chart series |

**Three colors, three jobs:** **team = identity** (logo tile, name ink, own surfaces/line); **division = grouping** (chip/badge, division-title milestone, division seed — never the team name); **league = brand/chrome** — wire `--brand: setup.color` at the workspace root and change chrome accents from `var(--field)` to `var(--brand, var(--field))`, so the league color the user picks actually drives the active rail item, topbar accent, primary buttons, and GOTW theme (green stays the default). **Precedence:** at most one solid brand fill per component; the GOTW/featured card is the single allowed league-brand fill. Add `accessibleLineColor(hex, avoidList)` to rotate colliding chart hues onto a categorical fallback.

**Problem — logo:** `EntityLogo` (`components/ui/EntityLogo.tsx`) is the single primitive and falls back to a monogram on `onError` (good), but: (1) the monogram tile is `background: raw color` + `readableTextColor` ink + **no border**, so on a same-color surface the mark **vanishes** and the ink can be sub-AA; (2) `<img alt="">` always + **no `width/height`** → CLS, and **no `loading="lazy"`/`decoding="async"`** → a stats table/rank-race eagerly fetches 10–24 remote imgur logos; (3) `enforcedSize = Math.max(32, size)` silently clamps every `size<32` to 32, so the `size={16/19/28/30}` call sites are dead intentions; (4) 17 distinct logo sizes; (5) logo-only contexts (`LeagueMarks`, bracket entrants) have no accessible name; (6) remote imgur logos leak referrer/IP + aren't cached.
**Target — logo:** monogram tile uses `--x-base` fill + fixed `--x-on` ink + `--x-border` ring (never vanishes, always legible). `<img>` gets intrinsic `width`/`height` (= size) + `loading="lazy"` + `decoding="async"`. Honor small sizes or delete the `<32` call sites; snap the 17 sizes to a token scale (e.g. 24/32/40/56/112). Pass `alt`/`aria-label` = team name in logo-only contexts. Route remote logos through the existing image proxy. Three levels consistent: team mark / division badge / league crest, all via `EntityLogo` + the same fallback + ring.
**Acceptance:** no raw-hex text-on-fill anywhere (odds meter, finish-distribution, loser all pass ≥4.5); `readableTextColor` never returns bare `#000`; the picked league color visibly drives the chrome; logo marks stay visible + legible on any surface with no layout shift and lazy loading.
**Deps:** V1.

---

## V11 · Mobile site-footer: tap targets + centering polish
**Type:** a11y + visual · **Status:** ✅ DONE (verified 2026-08-01, branch `feat/audit-followups-7-31`) — the spec is already in place (`.footer-row nav a` = inline-flex, `min-height:44px`, underline at rest, color-on-hover; mobile `padding:0 10px` + `nav margin-left:-10px`). **Verified live @375px:** Privacy 59×44, Terms 53×44 (both ≥44×44 ≫ the 24×24 floor), underlined at rest, first link's text flush with the copyright line. No change required.
**Scope note:** on the landing (`/`) and build-intro (`/build`) pages — outside the original post-generation audit scope, captured here by request.
**Problem (measured live @375px):** The two legal links are the most touch-hostile control on the page. Measured on the running app, each renders **~36×18px with `padding:0`** — far below the WCAG **2.5.8 (24×24 min)** and **2.5.5 (44×44)** target-size thresholds. They also carry **no underline at rest** (underline is hover-only, and touch has no hover), so on mobile "Privacy"/"Terms" read as color-only links — a WCAG **1.4.1 (use of color)** smell. Contrast is fine (copyright 5.23:1, links 5.39:1) and type steps up to 12px on mobile, so those are *not* the issue. Vertical centering is also already correct — measured 11px above / 11px below — so a literal "center it" edit is a no-op; the win is to spend that dead vertical space on bigger hit areas.
**Where:** markup `app/page.tsx:109-117` + `app/build/page.tsx:29-37`; base rules `app/globals.css:1196-1199`; mobile override `app/globals.css:3859` (`@media (max-width:720px)`).
**Current:** `.footer-row nav a { color:var(--field); transition:color … }` with underline only on `:hover`; mobile `.footer-row { …; gap:10px }` and no per-link padding, so hit areas equal the text box.
**Target (explicit spec):**
- Base `.footer-row nav a` → `display:inline-flex; align-items:center; min-height:44px; text-decoration:underline; text-underline-offset:3px;` and move the color change to `:hover` only (drop the hover-only underline). 44px fits inside the 68px desktop row with no layout shift.
- Mobile `@media (max-width:720px)`: `.footer-row { gap:6px; padding:14px 0; }` · `.footer-row nav { gap:2px; margin-left:-10px; }` · `.footer-row nav a { padding:0 10px; }`. This grows each link to ~44px tall / ~48px wide while the `nav` `margin-left:-10px` cancels the first link's `10px` left pad so **"Privacy" stays flush with the "© 2026 League Weaver" line** (no negative-margin overhang), and text-to-text spacing stays ~22px.
**Acceptance:** on a ≤720px viewport each legal link's hit box measures ≥44×44 (verify with `getBoundingClientRect`), and never below 24×24; links are underlined at rest (not color-only); "Privacy" left edge aligns with the copyright line; computed contrast unchanged (≥4.5); no desktop regression — links still sit on one line with ~22px gap inside the 68px row.
**Deferred (not in this story — from the footer brainstorm, captured so they aren't lost):** (a) add a Support/Contact link (footer currently offers nowhere to get help); (b) a soft end-of-scroll secondary action (Contact or a repeat "Start building") for warm leads who read to the bottom; (c) surface a slim legal+support footer *inside* the app/workspaces, which are currently `display:none` for the footer ≤980px (`globals.css:1342`).
**Evidence:** live probe on `leagueweaver-dev` @375px — links `{h:18,w:39/33, pad:"0px"}`, footer row 68px with content centered 11/11.

---

# 🧭 STRUCTURE / NAVIGATION (IA)

## R1 · Promote analytics tabs to top-level pages
**Type:** IA · **Status:** open (proposal)
**Problem:** "Standings" (rail) hides **6 sub-views** behind a tablist (which is itself broken — see H8): Standings / Rank race / Team leaders / League leaders / Playoff stats / Team stats. The analytics are effectively undiscoverable three levels down.
**Target (what the rail should look like) — grouped rail:**
```
SCHEDULE            INSIGHTS         POSTSEASON      MANAGE
· League Schedule   · Standings      · Playoffs*     · Simulator
· Team Schedule ▸   · Rank Race                      · Settings
· Game of the Week  · Stats
· Matchup Ratings
                    (*Playoffs when live)
```
Promotion logic: **Standings** table stays its own page (add division grouping, move Season odds out); **Rank Race** becomes its own top-level page; **Team leaders + League leaders + Team stats** merge into one **"Stats"** page with light internal tabs; **Playoff stats** nests under Playoffs (seasonal). Quiet section headers keep the rail scannable.
**Implementation:** update `VIEW_ITEMS`, the `ViewKey` union, and `?view` routing; give each promoted page a deep-linkable route.
**Acceptance:** Standings/Rank Race/Stats are each reachable in one click and deep-linkable; the rail is grouped and not overcrowded.
**Deps:** H8 (tabs), R3 (Standings restructure).

## R2 · Expanding Team Schedule nav (division→team tree)
**Type:** IA · **Status:** open (proposal)
**Problem:** Switching teams is clunky — you go to the directory grid, then into a team. There's no fast switch from the rail, and no persistent indicator of which team you're viewing.
**Target (what it should look like + behave):** The rail "Team Schedule" item gets a chevron and becomes an expandable disclosure.
```
Team Schedule ▾
  › All teams                 → directory grid
  PRODIGIES                   (division header, muted)
    ◐ Decoupes                (logo pip + name; ◐ = team color)
    ◐ Popeyes  …
  ESTEEMED
    ◐ Yardies
    ◐ Mutts  …
```
- Expand on hover (desktop) / chevron tap (mobile). Selecting a team routes to `/season/[id]/team/[teamId]` (route already exists), **collapses** the tree, and **relabels the rail item to "Team Schedule · ◐ Decoupes"** with the team's pip — so the current team is always visible. `aria-current` marks the active team.
- To switch: expand again, pick another. The directory grid remains the "All teams" overview.
- a11y: `aria-expanded` on the parent, tree/list semantics, full keyboard (Arrow traverse / Enter open / Esc collapse), sensible focus return. On mobile the tree opens as a sheet.
**Acceptance:** you can jump to any team's schedule from the rail in one expand+click; the rail shows who you're viewing; fully keyboard-operable.
**Deps:** V10 (logo pips), R3 (team-page hero switcher pairs with this).

## R3 · Per-page restructure (team schedule, GOTW, ratings, standings)
**Type:** IA/layout · **Status:** open (proposal)
**Problem/Target per page:**
- **Individual team schedule** — today: brand hero → a 1280px 12-col table → a 15-row/64px performance ribbon that dwarfs the schedule. **Target:** hero with a **compact stat strip** (record · seed · clinch) and the team switcher (ties to R2); the **schedule is the primary content**; deep stats collapsed or in a "Season at a glance" right rail; narrow the table (V5).
- **Game of the Week** — today: a flat season-long timeline, no "why", no empty state. **Target:** a **marquee** — a large hero presentation of the current/next GOTW **with a why-featured rationale**, then past/future GOTWs as a timeline strip below; proper empty state.
- **Matchup Ratings** — today: a ranked table with the legend buried below. **Target:** lead with the **explainer/legend at the top** (what the rating means, "lower = closer & stronger"), then the ranked list; consider a "Best games of the season" highlight above the full sortable table; cross-link with GOTW (both answer "which games matter").
- **Standings** — today: one 13-col table + tie groups + Season odds stacked. **Target:** **division-grouped by default** with a league toggle; move Season odds / projections to Rank Race or a "Playoff Picture" area; collapse the 228px STATUS column when empty (V9); keep the core table focused.
**Acceptance:** each page leads with its primary job; the team page's schedule (not its stat ribbon) dominates; GOTW reads as a marquee; the rating is explained before it's shown; standings default to division groups.
**Deps:** R1, R2, V5, V9.

---

# 🔬 MATCHUP RATINGS — live audit (2026-08-01)

**What/why:** The Matchup Ratings page (`MatchupRatingsView`, `SeasonWorkspace.tsx:569`) was the one row in the coverage matrix never exercised live. This pass drove it in the browser on a real played league (`ff4f2ab3…`, 12 teams / 3 divisions / 14 weeks, **72 of 84 games scored** — so played, pending, and GOTW rows were all on screen) and measured the rendered DOM. **0 console errors.** What's already solid (don't touch): loser score contrast **8.19:1**; rank pills **5.39–6.57:1** (AA pass via `accessibleTeamColor`/`readableTextColor`); pending games render `— NOT PLAYED` and still compute a rating from ranks; controls stack cleanly at 375px; the legend + "Lower is better" controls label are present. The findings below are the gaps. IDs are `MR#` to avoid colliding with the H/#/V/R numbering.

## MR1 · Home team names clip to ~42px in the ratings table 🔴 HIGH
**Type:** visual/correctness · **Status:** open
**Problem (measured live):** Every **home** team name in the table is truncated to the logo-width track — "Sunday Architects" → **"Sun…"**, "Chicago…" → "Chi…", "Nashville…" → "Nash…". Measured: in equal-width **265px** cells, the away name span is **140px** (full: "Goal Line Guild") but the home name span is **42px** and clips (`scrollWidth 114 > clientWidth 42`). Half the teams in the marquee analytics table are unreadable.
**Root cause:** The `.mirrored` grid-*placement* rules (`app/globals.css:1871-1873`: name→col2, mark→col3, rank→col4) are written for the **4-column with-record** template. The ratings table uses `<TeamIdentityBlock mirrored compact showRecord={false}>` (`SeasonWorkspace.tsx:635`) → classes `compact mirrored without-record`; the compact/without-record templates (`:1877/:1879`) fight those placements, so the name lands in the **42px logo track**. Measured computed template on the home block: `22px 42px 112px 22px` (a phantom 4th column). The **away** block (`:633`, not mirrored) is correct: `22px 42px 140px`.
**Where:** usage `SeasonWorkspace.tsx:633` (away) / `:635` (home); CSS conflict `app/globals.css:1871-1873` (mirrored placement) vs `:1877` (`.compact.mirrored`) / `:1879` (`.compact.without-record`).
**Target:** Add an explicit rule for the mirrored + compact + without-record combination so the **name occupies the `1fr` track** and the rank/logo sit in the fixed side tracks — e.g. `.team-identity-block.compact.mirrored.without-record { grid-template-columns: auto 42px minmax(0,1fr); }` with matching placement (name→col3 right-aligned, mark→col2, rank→col1), or more robustly give `.mirrored.without-record` its own 3-col template+placement. Verify the home name span width ≈ the away name span width in the same row.
**Acceptance:** In the ratings table, a home team name renders as much text as the away name of equal cell width (no `scrollWidth > clientWidth` on the home name at desktop widths); "Sunday Architects" shows in full or truncates identically to how an away name of the same length would.
**Evidence:** live probe `ff4f2ab3…?view=matchup-ratings` — away name `{w:140, overflow:false}`, home name `{w:42, overflow:true, scrollW:114}`; home block computed grid `22px 42px 112px 22px`.

## MR2 · Ratings table side-scrolls on desktop (permanent) 🟠 MEDIUM
**Type:** visual/responsive · **Status:** open
**Problem (measured live):** `.matchup-ratings-table` sets `min-width: 1110px` (`app/globals.css:2067`) inside a wrap that is **1030px** on a normal desktop shell → `scrollWidth 1110 > clientWidth 1030`, so the horizontal scrollbar is **engaged at rest** on desktop (same failure class as **V5**'s team-schedule table). At 375px the wrap contains its own side-scroll (349 → 1110) — no document overflow, but the table never stacks to cards, so mobile users see ~2 columns at a time and must side-scroll a 7-column grid.
**Where:** `app/globals.css:2067` (`min-width: 1110px`); the redundant rank sub-label (MR4) and the Result column both add avoidable width.
**Target:** Bring the table under the shell width (~980–1000px) — tighten/drop the Rating sub-label (MR4 removes ~90px), let low-value columns (Game #, Matchup series) collapse at narrow widths, or widen the shell when this view is shown. Under ~720px, stack each game into a card (mirror the schedule-table treatment R3/V5 proposes) instead of side-scrolling the whole grid.
**Acceptance:** the table fits a ~1280px viewport with no horizontal scroll (`scrollWidth ≤ clientWidth`); on mobile it stacks or the primary columns (teams + rating) are visible without scroll.
**Evidence:** desktop wrap `client 1030 / scroll 1110 → horizScroll true`; mobile wrap `client 349 / scroll 1110`.
**Deps:** V5 (same pattern), MR4.

## MR3 · Team-name links swallow the rank for screen readers 🟠 MEDIUM (a11y)
**Type:** a11y · **Status:** open
**Problem (verified live):** Both team blocks are `<a aria-label="Open <Team> schedule">` (`MatchupPresentation.tsx:52`). The blanket `aria-label` overrides the subtree, so the **rank pill (#1/#2)** — a core datum of a *ranking* table — is not announced; a SR user hears only "Open Brooklyn Sunday Architects schedule". With 84 rows × 2 links there are **168 near-identical "Open … schedule"** links to wade through. This is the same root cause as **H6** (team-directory cards), now confirmed on this page too.
**Where:** `MatchupPresentation.tsx:33-52` (`TeamIdentityBlock`, `aria-label` at `:52`), as consumed by the ratings table `SeasonWorkspace.tsx:633,635`.
**Target:** Resolve with **H6** — make the team name the focusable link (its own accessible name) and expose the rank pill as normal text (or fold the rank into the link's accessible name, e.g. "Brooklyn Sunday Architects, rank 1"). Don't blanket-label the whole block.
**Acceptance:** AT announces the team's rank alongside its name in each Away/Home cell; the link list isn't 168 identical strings.
**Deps:** H6 (shared fix).

## MR4 · Rating cell repeats the rank pills already in the row 🟡 LOW
**Type:** clarity/visual · **Status:** open
**Problem (verified live):** The Rating cell renders `3.7` **plus** a sub-label `W1 ranks · #2 vs #1` (`SeasonWorkspace.tsx:637`). The `#2 vs #1` is an exact duplicate of the rank pills already shown in the **Away** and **Home** columns of the same row, and the "W{n} ranks" prefix restates the Wk column. It's redundant ink that also widens an already-overflowing table (MR2).
**Where:** `SeasonWorkspace.tsx:637` (`.table-rating-ranks` sub-label).
**Target:** Drop the `#a vs #b` duplication; keep at most the bars + number. If a per-lens note is wanted, surface it once (e.g. a column header tooltip "ranks entering each week"), not per row.
**Acceptance:** the Rating cell no longer restates the row's own rank pills; table min-width drops accordingly.
**Deps:** feeds MR2.

## MR5 · Tier labels claim "thirds" but bucketing is value-normalized 🟡 LOW
**Type:** correctness/clarity · **Status:** open
**Problem (measured live):** The tier filter options read "Competitive — **Strongest third**", "Neutral — **Middle third**", "Lopsided — **Widest ranking gaps**" (`SeasonWorkspace.tsx:596-601`), implying equal-count terciles. But `getMatchupSignal` (`lib/matchups.ts:47-54`) buckets by the rating's **normalized position in the min–max range** (`≤1/3`, `≤2/3`, else), not by count. Measured distribution on the real league: **29 / 38 / 17** — not ~28/28/28. On a schedule with clustered ratings a tier could hold almost everything or almost nothing, contradicting the "third" copy.
**Where:** labels `SeasonWorkspace.tsx:596-601`; bucketing `lib/matchups.ts:47-54`.
**Target:** Either bucket by actual terciles (rank the ratings and split by count) so "third" is true, or change the copy to describe the real behavior ("strongest end of the range", "middle of the range", "widest gaps"). Keep the option descriptions and the legend (`MatchupRatingLegend`) consistent with whichever is chosen.
**Acceptance:** the tier copy matches the bucketing method; a first-time user reading "Middle third" gets roughly what the words say.

## MR6 · No empty state when a filter yields zero rows 🟡 LOW
**Type:** usability · **Status:** open
**Problem:** The `<tbody>` maps `visibleGames` with no fallback (`SeasonWorkspace.tsx:621-639`); confirmed no empty-state markup exists in the view. If a lens/tier combination (or a very small league) yields 0 games, the table renders the 7 headers over a **blank body** with no message. The per-week ratings list already does this right with `.rating-filter-empty` (`SeasonWorkspace.tsx:561`) — this view is the inconsistent one.
**Where:** `SeasonWorkspace.tsx:621-639`.
**Target:** When `visibleGames.length === 0`, render a centered empty state in the table body ("No games match this filter — try 'All tiers'.").
**Acceptance:** a zero-result filter shows guidance, never a headers-only blank table.

## MR7 · Ratings-table headers lack `scope`, aren't sortable 🟡 LOW
**Type:** a11y/usability · **Status:** open
**Problem (verified live):** All 7 `<th>` (Wk / Game / Away / Result / Home / Matchup / Rating) have `scope: null` (`SeasonWorkspace.tsx:620`) — no column association for AT. Separately, sorting lives only in a `CustomSelect` dropdown; the column headers are inert, so clicking "Rating" or "Wk" does nothing, defying the data-table convention. (Note: **#22** tracks missing `scope` on a *different* ratings table at `:473`; this is the `MatchupRatingsView` table.)
**Where:** `SeasonWorkspace.tsx:620` (headers), `:614` (sort select).
**Target:** Add `scope="col"` to each `<th>`. Optional enhancement: make Wk / Rating headers clickable sort toggles with `aria-sort`, keeping the dropdown as the explicit control.
**Acceptance:** every header carries `scope="col"`; if sortable headers are added they expose `aria-sort` and move selection.

## MR8 · GOTW gold floods the top of the table when sorted best-first 🟡 LOW
**Type:** visual/color · **Status:** open
**Problem (verified live):** 14 of 84 rows are GOTW and get a gold row tint (`.matchup-ratings-table tbody tr.is-gotw`, `app/globals.css:2071`) **plus** a gold "★ GOTW" chip in the Game column. Because GOTWs are the strongest games, the default **Best-first** sort clusters all 14 near the top — the entire first screen is a wall of gold, so the marker stops signaling "special." Reinforces the gold-overload theme in **V4**.
**Where:** row tint `app/globals.css:2071-2072`; GOTW chip `SeasonWorkspace.tsx:632`.
**Target:** Pick one gold cue per row (chip **or** a subtle left-border accent), not a full-row wash **and** a chip; lighten the tint so stacked GOTW rows don't merge into one gold block. Align with the V4 "gold = GOTW only, one accent per row" rule.
**Acceptance:** a run of consecutive GOTW rows still reads as distinct rows; GOTW is marked once per row, not twice.
**Deps:** V4.

## MR9 · "Strongest week" summary tile mixes metrics 🟡 LOW
**Type:** clarity · **Status:** open
**Problem:** The summary strip shows "Rating range 3.7–30.7" and "Games shown 84" (both per-**game** rating metrics, matching the table) beside "**Strongest week** — Week 1 #1", which is the per-**week** slate rank (`week.matchupRank`, `SeasonWorkspace.tsx:606`) — a different metric that isn't otherwise on this page. Sitting between two rating stats, it invites reading "#1" as a rating.
**Where:** `SeasonWorkspace.tsx:602,606`.
**Target:** Either relabel to make the metric explicit ("Strongest slate — Week 1") and visually distinguish it from the rating stats, or replace it with a rating-native stat (e.g. "Best game — W1 3.7") so all three tiles speak the same language.
**Acceptance:** the three summary tiles read as the same kind of number, or the odd one is clearly labeled as a slate/week metric.

---

# 👥 TEAM SCHEDULE — directory + single-team page (2026-08-01, by request)

**Scope note:** Audit of the "Team Schedule" rail view — the **all-teams directory** (`TeamScheduleDirectory`) and the **single-team page** (`TeamScheduleView`, `components/season/TeamSchedulePage.tsx`). Grounded live at **1280px and 375px** on an injected 10-team / 2-division league scored through Week 12. Much of this surface was already logged (H6 directory a11y — DONE; V5 table width; R3 restructure; #20.2 home/away; V10 color) — this pass adds fresh measurements and two new small items.

**What's already solid (verified live — spend energy elsewhere):**
- **Responsive is done right.** The single-team table correctly swaps to a card list on mobile (`.team-schedule-table` → `display:none`, `.team-schedule-cards` → 14-card `grid` @375) with **0px document horizontal overflow**; the directory grid collapses 2-col → 1-col cleanly (stat grid 3→2 columns, no value clipping). This surface is markedly healthier than the Standings tabs (#42) — no card-stack work needed.
- **Hero contrast passes** — team name computes white on `#B91C1C` = **6.47:1** (AA). The team switcher is a real listbox trigger (`aria-haspopup="listbox"`).

**Confirmed here, owned by existing stories (fresh numbers):**
- **Single-team table side-scrolls on desktop** — `min-width:1280px` renders **1366px** inside a **1030px** wrap = **336px permanent overflow** @1280. Reinforces **V5** (update its evidence with these measured values).
- **Mobile 15-stat performance panel = a 1022px single-column wall** below the 14 game cards. At desktop that same panel is **572px vs the table's 962px**, so **R3**'s "the performance ribbon *dwarfs* the schedule" is **overstated at desktop** — the schedule table dominates; the depth-of-stats concern is real only on mobile. Feeds **R3** (correct the "dwarfs" wording; the mobile wall is the real target).

**Ruled out — do NOT log as a bug (tooling artifact):** a `WeekScoreBar` runtime overlay — *"Cannot read properties of undefined (reading 'length')"* — appeared on the `/season/[id]/team/[teamId]` route. But the Next overlay was flagged **`(stale)`**, the identical `WeekScoreBar` renders fine on the directory route with identical props (`activeSchedule.weeks`), and **touching `WeekScoreBar.tsx` to force a fresh Turbopack compile cleared it completely**. Stale dev chunk — same class as the `teamInitials` non-issue. (Added to Non-issues.)

## TS1 · Directory "Avg rating" is unexplained and the "Toughest" sort mislabels it 🟡 LOW
**Type:** clarity · **Status:** open
**Problem (verified live):** The single-team page renders `<MatchupRatingLegend />` (`TeamSchedulePage.tsx:594`), but the **directory has no legend**, so its per-team **AVG RATING** stat (`:235`) shows a bare **"18.0" / "13.0"** with no scale and no "lower is better." The value is the matchup-rating formula `((awayRank+homeRank)/2 + 2.2·|rankGap|)` (`lib/matchups.ts:35`) — roughly 3–30 for a 10-team league — which nobody can infer from "18.0". Worse, the sort option is labelled **"Toughest avg rating · Lower matchup rating first"** (`:51`), but a *low* rating means *close, high-quality* games, **not** a hard schedule — schedule hardness is what the separate **SOS** stat/sort already measures (`averageOpponentSeed`, `:52,:151`). So "Toughest" conflates *competitiveness* with *strength-of-schedule*, and both rating figures sit on the card with no key.
**Where:** legend only at `TeamSchedulePage.tsx:594`; directory AVG RATING cell `:235`; sort label `:51`; SOS sort/stat `:52,:151`.
**Target:** Add a one-line rating key to the directory toolbar (or a tooltip on the "Avg rating" stat): *"matchup rating — lower = closer, higher-quality games."* Relabel the sort to **"Most competitive (lowest avg rating)"** and keep **"Hardest SOS"** as the distinct strength-of-schedule sort so the two stop overlapping in meaning. Optionally surface `MatchupRatingLegend` on the directory too.
**Acceptance:** a first-time commissioner can tell what "Avg rating 18.0" means and that lower is better; the rating sort no longer reads as a strength-of-schedule sort.
**Deps:** same class as **#20**.1 (matchup rating unexplained) — this is the directory instance.

## TS2 · Directory card: the stat number outweighs the team name (both in identical brand ink) 🟡 LOW
**Type:** visual/hierarchy · **Status:** open (directory instance of V2/V10)
**Problem (measured live @1280):** On a directory card the stat **value** (`.team-directory-stats dd`) computes **16px / weight 850**, while the **team name** computes **14px / weight 700** — the number is bigger *and* heavier than the identity it describes. Both also render in the **identical team-brand ink** (measured `rgb(67,56,202)` for the indigo team), so the name can't win on color either; the squint test lands on "7 / 18.0", not on who the team is. (Contrast itself is fine — dd vs card background = 7.90:1; this is hierarchy, not legibility.)
**Where:** dd markup `TeamSchedulePage.tsx:235`; `.team-directory-stats dd` (16px/850) vs the identity name (14px/700) in `globals.css`; brand ink from `teamBrandStyle :112` (`--team-brand-ink`).
**Target:** This is the directory instance of **V2** (name must win) + **V10** (color discipline). Team name → `--text-lg`/`--w-black`/full ink (or brand ink); stat values → `--text-sm`–`--text-md`, `--w-medium`, **neutral** `--ink`/`--muted` — *not* the team brand color — so the identity dominates and the numbers recede. (Also updates V2's now-stale "directory stat dd 18px" to the V1-migrated **16px**.)
**Acceptance:** on every directory card the team name is the largest/heaviest element and the stat values are not painted in the team brand color; blurring the card, the eye lands on the team, not its numbers.
**Deps:** V2, V10.

## TS3 · Mobile directory card: shrink it — stats ≤20%, drop low-value stats, fix name/logo alignment, remove the sort filter 🟠 MEDIUM
**Type:** visual/IA/mobile · **Status:** ✅ DONE (2026-08-01, verified live @375px) — Directory card rebuilt (`TeamSchedulePage.tsx` + `globals.css`): sort toolbar removed; the 6-item `<dl>` replaced by a compact single-row **H/A `7-7` · Div · SOS** (Byes + Avg rating dropped) in neutral `--ink` (not brand); the city + name are vertically centered as **one block** against the avatar (matching the record column). **Root cause of the persistent "text sits high" look (TS6):** a shared responsive rule shrinks `.team-identity-mark` to 40px at narrow widths while the `EntityLogo` inside keeps its 48px size prop — so the avatar overflowed its box by 8px and the grid centered text on the 40px box, not the 48px avatar. Fixed by pinning the directory mark + logo to the same 48px, then a +4px optical nudge on the name/record columns to counter line-leading. **Measured @375px:** mark == logo == 48px (aligned); city+name space **7px above / 8px below** the avatar (1px imbalance) — consistent across all cards and matched to the record column; **11px horizontal gap** between avatar and text (pinning the logo to 48px had pushed it into the responsively-narrowed 40px grid column and touched the name → fixed by giving the directory identity block a 48px mark column + 11px column-gap); card height **341 → ~195px**; stat block **≤20%**; 0 console errors; 0 document overflow. **Owner directive (2026-08-01)** — captured from live review at 375px.
**Problem (measured live @375px):** The all-teams directory card is **too tall and stat-heavy** on mobile. Measured on the Atlanta card: **card height 341px**, of which the `<dl>` stat block is **186px = 55% of the card** — the stats dominate the very thing the card is for (picking a team to open). Three specific issues:
1. **Stat block is oversized and carries low-value stats.** Six stats in a 2-col grid — **Home · Away · Byes · Divisional · Avg rating · SOS** (`TeamSchedulePage.tsx:230-237`). **Byes is always `0`** in an even-team league (dead stat); Home/Away are usually a balanced `7 / 7` (low differentiation).
2. **Name/city not aligned to the logo.** The identity block centers the *two-line* city+name column against the logo, so the **bold team name renders 7px below the logo's vertical center** (measured: logo center Y 517 vs name-strong center Y 524) — the 13px city label stacked above the 15px name pushes the name you actually read downward, so it looks off. (`TeamIdentityBlock`, `MatchupPresentation.tsx`, `.team-identity-name` column.)
3. **The "All team schedules" sort control is unwanted** on mobile — the `CustomSelect` ("Team A–Z", `TeamSchedulePage.tsx:193-198`) plus its toolbar copy eats a full block above the cards before any team is visible.
**Where:** card + stats `TeamSchedulePage.tsx:205-237`; identity alignment `MatchupPresentation.tsx` (`.team-identity-name`); sort toolbar `TeamSchedulePage.tsx:188-199`; card CSS `globals.css` `.team-directory-card` / `.team-directory-stats`.
**Current (measured):** 341px card, 186px (55%) stats, name 7px below logo center, sort control present.
**Target (owner spec):**
- **Cut card vertical height** materially; the **stat block must be ≤20% of the card** (~≤68px at today's height). Replace the 6-item 2-col `<dl>` with a **single compact inline row of ~3 high-signal stats**. **Drop Byes** (always 0). Drop or merge Home/Away (schedule shape) — *stat selection is an open decision (see below)*.
- **Align name + city to the logo** — the primary bold name should sit on the logo's vertical center (city as a small eyebrow that doesn't shove the name off-center), so logo, name, and city read as one aligned unit.
- **Remove the "All team schedules" sort control** (and trim/absorb the toolbar copy) so cards start higher.
- Pairs with **TS2** (name must outweigh the stats; stat values in neutral ink, not brand color).
**Stats chosen (owner, 2026-08-01):** **Home/Away · Divisional · SOS.** Home/Away collapses to a single schedule-shape stat (e.g. `7-7`). Byes and Avg rating are **removed** from the card — which also means the card no longer needs the TS1 rating legend.
**Acceptance (re-measure @375px):** directory card is materially shorter; the stat row measures ≤20% of card height; Byes is gone; the bold team name is centered to the logo (|name-center − logo-center| ≤ 2px); the sort control is absent; no value clipping.
**Deps:** TS1 (rating legend if Avg rating stays), TS2/V2/V10 (hierarchy + neutral stat ink).

## TS4 · Cloud save-conflict prompt is a tall in-content banner on every view (worst on mobile) 🟠 MEDIUM
**Type:** IA/mobile · **Status:** open · **Surfaced 2026-08-01** during the team-schedule mobile pass (workspace-wide, not team-schedule-specific).
**Problem:** The **save-conflict guard** — "SAVED SEASON FOUND · Update this season or make a copy?" with **Later / Create copy / Overwrite** — renders as a full-width banner *in the content flow of every workspace view* (`.workspace-conflict-notice`, `SeasonWorkspace.tsx:2140-2152`). It fires when a save/claim hits an existing cloud season (`openSaveConflict`, `code === "SEASON_EXISTS"`, `:1465`). The *guard is correct and must stay* — it prevents silently overwriting or duplicating a saved season — but as a persistent in-content banner it pushes the actual page down on **every** view (Team Schedule, Standings, …), and **on mobile @375px it consumes ~45% of the viewport above the content**. It also can't move "to the generate state" (a common instinct) because the conflict is only detectable at **save/claim** time, not at generation.
**Where:** banner `SeasonWorkspace.tsx:2140-2152`; trigger `openSaveConflict :1465-1471`; resolvers `resolveSaveConflict`/`dismissSaveConflict :1917-1947`.
**Current:** tall in-flow `<section>` re-rendered on each view; ~45% of a 375px viewport.
**Target:** Keep the guard, change the delivery — surface it **once as a focus-trapped `Modal`/`ConfirmDialog` at the moment the conflict is detected** (the blocked save/claim), or as a **slim top-bar chip** ("Saved season exists — resolve") that opens that modal. Do **not** render it as a content-flow banner repeated on every view. Preserve the three actions (Overwrite / Create copy / Later) and the existing `blockedCloudSnapshot` gating.
**Acceptance:** resolving/ dismissing behaves identically; the prompt no longer occupies workspace content height on any view; on a 375px viewport the page's primary content is visible without scrolling past a save-conflict banner.
**Note:** its prominence during this audit was amplified by the injected test fixture colliding with the real "Sunday Night League" cloud season; normal users hit it only on a genuine local-vs-cloud fork.

## TS5 · Directory: dedicated clinch-badge row + division grouping 🟢 DONE
**Type:** IA/visual · **Status:** ✅ DONE (2026-08-01, owner directive, verified live desktop + @375px) — Two directory changes in `TeamSchedulePage.tsx` (`TeamScheduleDirectory`) + `globals.css`:
1. **Dedicated badge row.** Clinch badges (PLAYOFF / DIV CHAMP / #1 SEED / ELIMINATED) moved out of the old `.team-directory-group` into their own `.team-directory-badges` row between the identity block and the stat row. It **collapses to zero height** (`:empty`) when a team has no clinch status, so cards without badges don't reserve space. Verified: 10 cards, 3 badge rows visible, 7 collapsed; 0 console errors.
2. **Division grouping.** The flat card grid is now grouped into `.team-directory-division-group` sections, each with a `.team-directory-division-head` (division mark + name + team count), teams sorted by **live rank** within the division. **Conferences:** there is **no conference entity in the model** (`Division` has no `conferenceId`; `LeagueBuilder.tsx:298` confirms), so **no conference dividers are shown** — matching the owner's "if there are no conferences, don't divide by conference." The code is structured so conference wrappers nest above the division sections once a `conferences` grouping is added to the setup. Grouping only engages when `divisions.length > 1` (single/zero-division leagues fall back to the flat A–Z grid). The card was also converted from a 2-col grid to a single-column flex stack (identity → badges → stats), and the redundant `.team-directory-group` (division identity + "League rank #N", both now conveyed by the section header + rank pill) was removed.
**Follow-up (not done):** true **conference** support needs a data-model addition — a `Conference` entity (or `conferenceId` on `Division`) + builder UI + `setup.conferences` grouping. Until then the directory groups by division only. Logged as a separate need if the owner wants conferences as a first-class concept.
**Where:** `TeamSchedulePage.tsx` `TeamScheduleDirectory` (renderCard + division grouping); `globals.css` `.team-directory-division-group` / `.team-directory-division-head` / `.team-directory-badges` / `.team-directory-card` (flex).

## TS7 · Team schedule card view reuses the League Schedule's `MatchupCard` 🟢 DONE
**Type:** consistency · **Status:** ✅ DONE (2026-08-01, owner directive, verified live @375px on the real SNL season) — The individual team schedule's mobile card view rendered a bespoke `.team-week-card` (week link + single opponent + result chip), which looked nothing like the League Schedule's rich `MatchupCard`. Replaced it with the **shared `MatchupCard`** (`components/season/MatchupPresentation.tsx`) so the two are pixel-identical: badges row (GOTW / series / medals / game badges), both team identity blocks with records, center score + FINAL/SCHEDULED, venue, and signal bars. The week is carried on the card's own slots (`gameLabel="Week N"` + `dateLabel`), and the container now uses `.matchup-list.matchup-card-list` (same canvas panel). Byes render a small matchup-card-shaped placeholder. Removed the dead `.team-week-card` / `.twc-*` CSS (~19 rules). **Verified:** 14 cards, 5 GOTW variants, 0 byes on this team; `tsc` clean; 0 fresh console errors across all cards.
**Scope:** the **≤560px card view** only — the **desktop table** (`.team-schedule-table`, with its Display-fields toggle + per-row actions) is intentionally unchanged, so at desktop the team schedule is still a dense table while the League Schedule is cards. **Open option:** if full parity is wanted, replace the desktop table with the same `MatchupCard` list (loses the table's Display toggle + row actions) — owner to decide.
**Where:** `TeamSchedulePage.tsx` `TeamScheduleView` card list (`.team-schedule-cards`); `globals.css` `.team-schedule-cards` / `.team-week-bye-card`.
**Follow-ups (2026-08-01, owner, done + verified live):** (a) **Removed the card-list container frame** — dropped the `.matchup-list.matchup-card-list` classes so `.team-schedule-cards` is a plain transparent grid (no gray canvas bg, no 1px border); each `.matchup-card` keeps its own border. (b) **Division-mark acronym centering** — the monogram (`DivisionMark`, `components/ui/DivisionIdentity.tsx`) rendered its acronym at a fixed `--text-2xs`, so a 3-char code ("NFC") filled an 18px box edge-to-edge (0.5px margin → read as cramped/off-center). Now the `<b>` font-size is **proportional to the box** (`max(7, round(size·0.5))px`, `line-height:1`), giving ~2.7px margin each side and a clean center at every size (card chip, hero, score bar, clinch badges). Verified @375px: acronym 9px in the 18px chip mark, 2.7px each side, 0/0 centered; 0 console errors; `tsc` clean.

## TS8 · Team-schedule header: switcher trigger reuses the match-card team-row layout 🟢 DONE
**Type:** consistency/visual · **Status:** ✅ DONE (2026-08-01, owner directive, verified live desktop + @375px). Several header changes on the **branded (team-color) hero** — the color/banner and the existing team-switcher *dropdown functionality* are unchanged:
1. **Removed the "Display" fields button** (`.team-schedule-controls` FloatingPopover) — field visibility is now fixed to the league's display settings (`display` is a const). Cleaned up `DISPLAY_OPTIONS`, `toggleDisplay`, and the `useState`/`SlidersHorizontal` imports.
2. **No-logo avatars are a lighter shade** — `EntityLogo` monogram tiles now use `tintColor(color)` bg + `accessibleTeamColor(color)` initials (a soft tint of the team color) instead of a solid slab, everywhere the primitive renders.
3. **Switcher trigger reorganized to match the match-card team row** — the hero's `TeamIdentityBlock` (inside the `CustomSelect` trigger) now uses the exact `.matchup-card-main` grid: rank · 54px crest · city/name over a parenthesised division record (`5-7 (3-4) SFC`), same sizes/fonts (name `--text-md`, record `--text-sm`). Text stays **white/`--team-brand-on`** for accessibility on the team color, and the **division mark by the record is forced to the readable-on-brand ink** (it was the division color on text → invisible red-on-blue at **1.02** contrast; a filled tile couldn't fix it since division ≈ team luminance, so recoloring the text was the real fix).
**Owner course-correction captured:** an earlier attempt de-branded the hero into a light card — reverted; the owner wanted the team color kept and only the *component's layout + accessible text* changed.
**Where:** `TeamSchedulePage.tsx` (`TeamScheduleView` hero, `display` const, removed controls); `components/ui/EntityLogo.tsx` (monogram tint); `globals.css` `.team-schedule-hero .team-identity-*` (match-card layout + white division mark).

## TS9 · Team-schedule cards: per-week record + rank ("through this game"), not the final record 🟢 DONE
**Type:** correctness · **Status:** ✅ DONE (2026-08-01, verified live). The team-schedule cards showed each team's **final full-season record on every week** (reused the League Schedule's current-record helper `recordFor`, which reads the last-week snapshot), so Week 1 claimed a team was already "5-7". Ranks used the *entering-week* snapshot (off-by-one). Fixed: each card now derives record **and** rank from `getWeekRankSnapshot(schedule, week.weekNumber)` — the state **through/after that week's game** — so a finished Week 1 win shows **1-0** in Week 1 and the record/rank tick up week by week; unplayed future weeks resolve to the current record (the tally freezes at "now"). The hero header still shows the team's current overall record (correct for a header). **Verified live** (Austin): W1 `0-1` #10 → W3 `1-2` → W7 `4-3` #4 → W12 `5-7` (final) → W13–14 frozen at `5-7`; opponent Brooklyn W1 `1-0` #3; division records also per-week (`(0-0)` on the cross-div Week 1). 0 console errors; `tsc` clean.
**Where:** `TeamSchedulePage.tsx` `TeamScheduleView` card loop (`throughSnapshot`/`recordThroughWeek`/`rankFor`).

---

# 🧱 BUILDER / ONBOARDING — pre-generation flow (2026-08-01, by request)

**Scope note:** These three live *before* a schedule is generated — the entry screen and the 10-step setup wizard (`components/builder/LeagueBuilder.tsx`), outside the original post-generation audit but captured here by request. Grounded on the source (server was down for a fresh live capture this pass); markup quoted is from `LeagueBuilder.tsx` at the lines cited. **Today's flow:** `SourceStep` (Step 1: manual / ESPN / Sleeper / CSV) → `LeagueStep` (Step 2, where saved-league *resume* is buried) → Teams → Divisions → Season → Seeding → Week 1 → Rules → Playoffs → Review, a fixed **10 steps** (`STEPS` `:66-77`). Import (`applyImport :1340`) and saved-league resume (`applySavedLeaguePreset :1213`) both drop you at **Step 1 (League)** and then make you walk all remaining steps — there is no fast path.

## B1 · Promote "saved league" to a first-class entry source (right of Manual, opens a modal)
**Type:** IA/onboarding · **Status:** ✅ DONE (2026-08-01) — Step 1 (`SourceStep`) now shows **Start manually** + **Continue a saved league** as peer primary options (`.start-primary-row`, gated on `presets.length > 0`); the saved tile opens a focus-trapped `Modal` (`.saved-league-modal`) listing every saved league via `SavedLeagueRow` ("Last used" pinned first). Step 2's `SavedLeagueShortcut` was trimmed to only the loaded-confirm bar. **Verified live** (signed-in PVE account, 3 saved leagues): entry row renders 2-up on desktop / stacks 1-col at 375px with no overflow; modal is `role="dialog"`, focus-trapped on the close button, lists all 3; picking a connected preset routes through the existing "Use connected league data?" prompt. One bug found + fixed live — the modal panel had no background (base `Modal` supplies none) so the header floated over the dim. **Follow-up (2026-08-01):** picker refactored into `SavedLeaguePicker`, restyled to reuse the **import (Connect ESPN) modal chrome** (`.import-modal` head/body/footer grid, icon tile + `step-kicker` + condensed title + `icon-button` close) and given **pagination** (`SAVED_PAGE_SIZE = 5`; Previous / "Page X of Y · N leagues" / Next in the footer, shown only when it overflows one page) so a large account stays manageable. All added copy is em-dash-free per direction. Verified live: chrome matches the import modal; pager pages correctly (page 2 shows the tail league, Previous/Next disable at the ends). 0 console errors; `tsc` + `next build` green.
**Problem:** A saved league is conceptually a *data source* — peer to ESPN/Sleeper/CSV — but it isn't on the entry screen. `SourceStep` (`:210-254`) offers only Manual (main) + the import row; the saved-league picker (`SavedLeagueShortcut :178-207`) is rendered one step later inside `LeagueStep` (`:264`), so returning commissioners (the highest-intent users) don't see "continue where you left off" until after they've already committed to a path. The inline list also doesn't scale — with many saved leagues (a real case given large-league/multi-league use) it becomes a long stack with only a "show more" disclosure (`:202`).
**Where:** entry `LeagueBuilder.tsx:210-254`; current picker `:178-207`; rows `SavedLeagueRow :158`; data = `savedLeagues` (account-scoped, `/api/saved-leagues`).
**Target (what it should look like):**
- Restructure `start-grid` into a **2-up primary row**: **Start manually** (left) and **Continue a saved league** (right, same visual weight), with the ESPN/Sleeper/CSV import row beneath — so the entry screen reads "fresh · resume · import."
- The saved-league tile opens a **modal picker** (reuse `Modal`/focus-trap): a scrollable, searchable list of `SavedLeagueRow`s (Last-used pinned first, "Updated · date", connected-platform badge), each row = Load. Scales past ~5 leagues where the inline list doesn't.
- **Gating:** show the tile only when `savedLeagues.length > 0`; for signed-out users show it as a sign-in invite ("Sign in to pick up a saved league") rather than hiding the concept.
- Step 2 keeps only the **"loaded — eyeball your roster for churn"** confirm bar (`saved-league-loaded` `:183-192`) — the *selection* moves to the entry modal, the *review* stays inline (matches the existing "no silent jump" intent `:1229-1231`).
**Acceptance:** From the first builder screen a returning user can open a modal, pick a saved league, and land on the loaded-confirm — without the picker competing with the form; the modal is focus-trapped, Escape-closable, and scrolls for N leagues; the option is absent (or a sign-in nudge) when there are none.
**Deps:** pairs with B2 (the modal's "Load" can hand off straight into the Quick/Full fork).

## B2 · "Quick create" vs "Full experience" fork after teams resolve
**Type:** onboarding/conversion · **Status:** ✅ DONE (2026-08-01) — `BuildForkCard` renders at the top of the League step once a roster is loaded (`quickStartAvailable`, set by `applyImport` + `applySavedLeaguePreset`). Per direction, **Customize everything is the emphasized primary** (green, "Recommended", → dismisses the card and continues the wizard); **Quick create is secondary**, showing a live settings preview + the note *"These lock in when you generate. To change them later you'll regenerate the schedule."* Defaults are the real **PVE (Prodigies vs. Esteemed) house settings** pulled from the account (`QUICK_CREATE_DEFAULTS` + `applyQuickCreateDefaults`): 14-week season, 6-team gold single-elim playoff (fixed reseed, 3rd-place game, placement auto-resolved halves→leaders→overall, field clamped to team count), prior-season seeding, PVE fairness — applied over the entered roster (teams/divisions untouched). The roster line uses a **conference-aware `rosterGroupingNoun`** (reads "Teams and Divisions" today; upgrades to "…, Divisions and Conferences" if a conference entity is ever added — there is none now). **Verified live**: fork renders correctly; Customize dismisses to the populated form; Quick create applied the defaults and generated a valid season — confirmed the saved schedule = 14 weeks / 6-team / gold / division-halves / fixed reseed / prior-season / streak 3; 0 console errors. `tsc` + `next build` green. *(Note: a test season "Prodigies vs Esteemed FFL" was generated during live QA — safe to delete.)*
**Problem:** Every path — manual roster, ESPN, Sleeper, CSV, saved league — funnels into the same 8 remaining steps. A commissioner who just wants "same as last year, regenerated" still clicks through Divisions, Season, Seeding, Week 1, Rules, and Playoffs. There's no way to accept smart defaults and go.
**Where:** both entry points land on Step 1 then walk linearly (`applyImport :1401`, `applySavedLeaguePreset :1231`, `next :1234`). Defaults already exist to lean on: `createDefaultSetup` (`lib/defaults`), the auto-recommended playoff placement (`:601-607`), `getMaximumPlayoffFieldSize`, `normalizePlayoffSettings`.
**Target — the fork:** Once teams are populated (post-import / post-saved-load / after the manual Teams step), present a **fork card**:
- **Quick create (recommended)** — apply defaults to every remaining decision and jump to a single **confirmation summary**, then Generate.
- **Customize everything** — the current step-by-step wizard (or the merged one from B3).
**Target — where defaults come from (two tiers):**
1. **Personalized — "same as last time"** (preferred when available): seed every hidden decision from the user's **last generated schedule / the loaded saved league** (its week count, division structure, seeding source, fairness preset, playoff format). This is the strongest version of the feature and the natural payoff of B1's saved-league path.
2. **Population defaults — "most common"** (fallback for first-timers): baked constants representing the most-chosen values.

| Hidden step | Population default | Personalized (last schedule / import) |
|---|---|---|
| Divisions | imported division names, else auto-balanced 2 (`divisionSizesFor`) | last league's division count + names |
| Season length/year | standard reg-season on current NFL windows | last schedule's week count + `seasonYear` (import provides year) |
| Seeding (prior order) | off, unless import carries `overallRank`/`hasPriorSeasonRanks` | last schedule's seeding source |
| Week 1 ranking | derive from seeding/`overallRank` | last schedule's ranking source |
| Schedule rules (fairness) | balanced preset | last schedule's fairness settings |
| Playoffs | auto-recommended placement (division-halves→leaders→overall `:604`), common field size, gold theme, consolation off | last schedule's full playoff format |

**Target — the process (Quick path):**
1. Source resolved → teams in hand.
2. **Fork card**: Quick (recommended) vs Customize.
3. Quick → a compact **"Here's what we'll build" summary** — one line per defaulted decision ("12 teams · 3 divisions · 14 weeks · 6-team playoff, division-halves · gold"), each with an inline **Change** that deep-links into just that (merged) step; plus, for imports, a **roster-churn glance** so a changed roster isn't silently accepted.
4. **Only truly-required fields block Generate** — league name (`:1187`) and team-count parity (`:1188-1193`); everything else is defaulted. Respect the existing guest-generate warning (`:1406`).
5. Big **Generate** → straight to `runGenerate`/reveal.
**Acceptance:** A returning commissioner can go source → Quick → Generate in ≤2 screens with last season's settings pre-applied and visible; a first-timer gets sensible population defaults; every default is shown and one-click-editable before generating; no required validation is bypassed.
**Deps:** B1 (saved-league path feeds the personalized tier); composes with B3 (Change links target merged steps).
**Open question:** where the personalized defaults are read from — the saved-league preset (`identityFromSetup`) carries identity but confirm it also carries season/rules/playoff settings, or read them from the last `saveSeason` record. Decide the source of "last time."

## B3 · Collapse the 10-step tracker into ~6 grouped steps (the Playoffs sub-tab pattern)
**Type:** IA/visual · **Status:** ✅ DONE (2026-08-01, PR #14, branch `feat/wizard-b3-steps`) — `STEPS` is now **6** grouped pills: `Start · League · [Teams & Divisions] · [Season & Rules] · Playoffs · Review`. The two collapsed steps reuse the Playoffs "one pill, internal tablist" pattern via a shared `WizardSubnav` (CSS generalized from `.playoff-wizard-subnav` → `.wizard-subnav`, horizontal-scroll on mobile). Teams+Divisions and Season+Seeding+Week1+Rules merge into sub-tabs (Seeding/Week 1/Rules flagged *Optional*). Sub-tab state (`teamsTab`/`seasonTab`) is **lifted to the parent** so validation switches to the tab owning a failing field before highlighting it; `validationError` refactored to return `{ error, teamsTab?, seasonTab? }` and `skipDraftRankForNow` re-keyed to `step === 3 && seasonTab === "week1"`. **Bonus — conferences:** a **Conferences** sub-tab now lives inside Teams & Divisions, shown only when `conferencesApply(divisionCount)` (4/6/8), with the editor extracted out of `DivisionsStep` into `ConferencesStep`; conference persistence fixed across saved presets (`identityFromSetup` writes `conferences`, `normalizeDivision` keeps `conferenceId`, `applySavedLeaguePreset` restores it); and the team-schedule directory wraps its division sections under conference headers (`hasConferences`). **Verified live** (localhost build of the merged commit + smoke-tested on leagueweaver.com): 6 pills / "Step X of 6"; conference tab appears at 4 divisions and vanishes at 3; validation routes to the correct sub-tab and highlights the field; generated a 4-division/2-conference season; conference dividers render in the team directory. `tsc` + `next build` green, 0 console errors. **Follow-up (not done):** the Playoffs preview still labels the two bracket sides by division name ("North champ") even when conferences are active, while the round header correctly reads "Conference Championship" — pre-existing, cosmetic.
**Type:** IA/visual · **Status (original proposal):** open
**Problem:** The tracker renders all **10** `STEPS` as an equal-weight pill rail (`:1482-1484`) with a "Step X of 10 · N% complete" bar (`:1477-1480`). Ten pills reads as a long, menacing commitment on the very first screen — even though several steps are short or optional (Seeding is explicitly optional `:489`; Week 1 Ranking `:512` and Schedule Rules `:551` are advanced tuning).
**Precedent (reuse it):** The **Playoffs** step already solved this — rather than four top-level steps for Format / Rules / Branding / Logos, it is **one** tracker pill with an internal sub-tab bar (`playoff-wizard-subnav`, `role="tablist"`, `:844-855`; `subPage` state `:575`). Apply the same "one pill, internal sub-tabs" collapse to the sibling steps.
**Target (proposed grouping — 10 → 6):**
```
Start · League · [Teams & Divisions] · [Season & Rules] · Playoffs · Review
```
- **Teams & Divisions** — merge Teams (`:364`) + Divisions (`:414`) into one step with sub-tabs (they're tightly coupled: you place teams into divisions).
- **Season & Rules** — merge Season (`:440`) + Seeding (`:477`) + Week 1 Ranking (`:512`) + Schedule Rules (`:551`) into one step; sub-tabs "Season / Seeding / Week 1 / Rules", the last three flagged Optional (mirror the playoff "Optional" tag `:909`). 4→1.
- Keep Start, League, Playoffs, Review as-is.
- Net: **6 pills**, "Step X of 6", a fuller-feeling progress bar per click, and the advanced knobs still reachable as sub-tabs (nothing removed).
**Also:** validation currently keys off numeric `step` indices (`:1187-1206`, `skipDraftRankForNow :1267`) — merging steps means moving those checks to fire on the merged step's Next / sub-tab, and the logo-save `nextStep` math (`:1258`) must follow the new indices.
**Acceptance:** the tracker shows ~6 grouped pills, no capability is lost (every current field reachable via a sub-tab), per-step validation still fires before advancing, and the progress bar advances in larger, less-daunting increments.
**Deps:** none required; strong synergy with B2 (Quick create defaults the "Season & Rules" group; its Change links open the relevant sub-tab).
**Tension to decide:** B2 (skip via defaults) and B3 (fewer, grouped steps) both cut the wizard burden but differently — B2 is a bypass, B3 restructures the path. They **compose** (6 grouped steps *and* a quick-create fast-path); just don't ship B2 as a reason to skip B3 — the "Customize everything" branch still wants the shorter rail.

---

## Redesign proposals (component-level quick reference)
1. **Matchup row** — name loudest (`--text-lg`/`--w-black`/`--ink`); record one muted 12px line; kill the 2nd "0-0" (division → tooltip); loser = `--muted` (not 0.52 opacity); score `--num-lg`, winner bold + checkmark. (V2, V10)
2. **Standings movement cell** — merge PRE RK + FROM PRE into `#5 ▲4`, computed in the active scope (fixes H10). (H10, #19)
3. **Chip system** — one `.chip`: `--radius-chip`, `--w-medium`, `--text-2xs`, one semantic color per variant (gold = GOTW only). (V3, V4)
4. **Numbers** — one `formatPoints()` at every PF/PA/DIFF/score/margin site. (#35)
5. **Color + logo contract** — `identityVars` + fixed `readableTextColor` + `--brand` wire-up + logo dims/lazy/ring. (V10)

## Non-issues (ruled out — do not "fix")
- **`teamInitials is not defined` on `/account`** — a **stale Turbopack chunk**; clean on fresh compile; `teamInitials` is correctly imported everywhere.
- **`WeekScoreBar` "Cannot read properties of undefined (reading 'length')" on `/season/[id]/team/[teamId]`** (seen 2026-08-01) — another **stale Turbopack chunk**: overlay was flagged `(stale)`, the same component renders fine on the directory route with identical props, and touching `WeekScoreBar.tsx` to force a recompile cleared it. Not a real null-deref.
- **Win probability on decided games** — correctly hidden (`MatchupPresentation.tsx:159` gates on `!played`).
- **Team-name contrast** — genuinely guaranteed via `accessibleTeamColor`.
- **Dark mode** — intentionally light-only; not a bug.
- **Mobile** — responsive: rail → bottom tab bar, no document-level horizontal overflow, wide tables in contained scroll wrappers.

## Housekeeping
- The synthetic audit clone was removed.
- The generated **"Prodigies vs. Esteemed FFL (Real)"** season carries synthetic scores (weeks 1–12) in the account — delete it or clear the scores when convenient.

## Suggested sequencing
1. **V1** (token foundation) — low-risk, unblocks V2–V10.
2. Small verified wins: `formatPoints()` (#35), `readableTextColor` fix + `--brand` wire-up (V10), **H10** movement fix.
3. **H1** (destructive-action confirms) + **H5** (aria-live).
4. Remaining High → Medium → V/R design work.

*(Playoffs — H12 and the bracket-specific parts of #38 — parked.)*
