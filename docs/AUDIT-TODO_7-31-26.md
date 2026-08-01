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
| Matchup Ratings | ✅ | ❌ |
| Standings — table | ✅ | ✅ preseason + played |
| — Rank race | ✅ | ✅ preseason |
| — Team leaders / League leaders / Team stats | ✅ | ❌ |
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
**Type:** correctness · **Status:** open
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
**Type:** a11y · **Status:** open
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
**Type:** a11y · **Status:** open
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
**Type:** data-loss · **Status:** open
**Problem:** "Restart Week 1" clears **all** sandbox results including the recorded (real) ones; `materialize` then strips scores from every game not in `results` and nulls `playoffGames`. So Restart-then-Save replaces the real schedule with a blank one — no confirm, no diff, and the banner reads "0 simulated" so it looks empty/safe right before the destructive save.
**Where:** `restartSimulationFromBeginning` `lib/simulator.ts:457-468`; commit `SeasonWorkspace.tsx:1553-1562`; save buttons `SimulatorWorkspace.tsx:300`.
**Current:** silent full wipe possible.
**Target:** Gate `commitSimulation` behind the H1 confirm ("This replaces N real scores"). Additionally, **refuse to commit** a sandbox whose `results` no longer contain the recorded set, or re-seed recorded results on restart so materialize can't erase real data.
**Acceptance:** No path overwrites recorded scores without an explicit, accurate confirm; a restarted-then-committed sandbox can't blank real data.
**Deps:** H1.

## H12 · Playoff bracket correctness + z-order — ⏸ HOLD (gated, unQA'd)
**Type:** correctness · **Status:** parked (playoffs)
**Problem:** `canAccessPlayoffs=false` hides all of this, so it ships unQA'd. (1) `reseedMode` is ignored — `projectPlayoffRounds` always sort-and-pairs (reseeds), so "fixed bracket" leagues show wrong future matchups while the subtitle literally says "Fixed bracket path". (2) A connector draws a confidently-wrong line to game 1 when a next-round lookup returns −1. (3) Section wrappers form stacking contexts, so cards' `z-index:4` can't beat the sibling connector SVG at z3 — lines render *over* card faces, defeating the intended "cards over lines".
**Where:** `lib/playoffs.ts:379-401`; subtitle `SeasonWorkspace.tsx:903`; connector `SeasonWorkspace.tsx:794`; z-order `BracketConnectorLayer.tsx:131` vs `globals.css:2857`.
**Target:** Branch pairing on `settings.reseedMode` (fixed → advance into pre-computed slots; each-round/protected → sort-and-pair). Return `[]` on a −1 lookup instead of `Math.max(0,-1)`. Put cards + SVG in one stacking context (drop z-index on the section wrappers, raise the cards). Run a full 4/6/8/14-seed pass when the flag flips.
**Status:** parked per current direction.

---

# 🟠 MEDIUM

## #18 · Correctness & security cluster
**Type:** correctness/security · **Status:** open
**Problem/Target (5 fixes):**
1. **CSV formula injection** — `lib/csv.ts:4-7` quotes cells but doesn't neutralize a leading `= + - @`; a team/manager named `=HYPERLINK(...)` executes on open in Excel/Sheets. Prefix such cells with a leading apostrophe before quoting.
2. **No score ceiling** — `parseScore` `SeasonWorkspace.tsx:514` clamps ≥0 but has no max; `999999` propagates into standings/odds. Clamp 0–300 (parity with the simulator's `:166`).
3. **Filter hides GOTW** — `SeasonWorkspace.tsx:358` filters the featured GOTW card out when its tier ≠ the selected filter. Always pin the GOTW card regardless of filter.
4. **Silent game drop** — `SeasonWorkspace.tsx:357` drops games whose team id isn't found; an imported week silently shows fewer games. Render an "unavailable matchup" placeholder / data-integrity warning.
5. **Regenerate link** — `SeasonWorkspace.tsx:1036` links to `/` (blank builder) with no season id. Link to an editor seeded with this league's setup.
**Acceptance:** Each of the five behaves as described; CSV opens inert in Excel/Sheets.

## #19 · Preseason standings cleanup ✓LIVE
**Type:** correctness/clarity · **Status:** open
**Problem (verified live):** At preseason (week 0) the standings show **two "PRE RK" columns** and a "FROM PRE" column of meaningless `—`/movement arrows computed against a nonexistent prior week.
**Where:** `StatsWorkspace.tsx:625` header + `:588-594` rank header logic.
**Target:** Relabel the leading column **"SEED"** in preseason mode and **suppress** the FROM-PRE / movement columns when `weekNumber === 0`. Also fold in: DIV record must include ties; RECORD and WIN% must not sort identically (sort RECORD by wins then win%); offer division grouping in the league standings (headers within the table or a two-column layout).
**Acceptance:** No duplicate PRE RK; no movement arrows at preseason; DIV record shows ties; the two sort headers differ.

## #20 · Clarity: ratings, home/away, empty states
**Type:** usability · **Status:** open
**Problem/Target:**
1. **"Matchup rating" unexplained** — users meet a bare "3.7 · #2 vs #1" with the legend buried below the whole list. Add a one-line inline scale ("lower = closer, two stronger teams") next to the first occurrence and move the legend above the list / into the section bar. Explain the preseason-vs-live lens in one sentence.
2. **Home vs away (verified live)** — carried only by a tiny `@`/`vs` glyph on identical-background chips, and the per-team score is always printed `away@home` while the W/L chip is team-perspective. Differentiate H/A visually (fill vs outline, or an explicit "HOME"/"@ Opp" label) and order the per-team score own-first.
3. **Empty states** — rank-race before scores collapses to a single left-edge column (verified); add "Enter Week 1 scores to start the race."
4. **GOTW "why featured"** — add a one-line rationale per featured game.
5. **Team-stats legend** — SOV/SOS/PF/PA/DIFF/GOTW WINS/PLAYOFF% have no key; add a rule strip / header tooltips.
**Acceptance:** A first-time commissioner can explain the rating, tell home from away at a glance, and never sees a blank/degenerate analytics panel without guidance.

## #21 · Share / sync / notify UX
**Type:** usability/trust · **Status:** open
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
**Type:** correctness · **Status:** open
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

## Redesign proposals (component-level quick reference)
1. **Matchup row** — name loudest (`--text-lg`/`--w-black`/`--ink`); record one muted 12px line; kill the 2nd "0-0" (division → tooltip); loser = `--muted` (not 0.52 opacity); score `--num-lg`, winner bold + checkmark. (V2, V10)
2. **Standings movement cell** — merge PRE RK + FROM PRE into `#5 ▲4`, computed in the active scope (fixes H10). (H10, #19)
3. **Chip system** — one `.chip`: `--radius-chip`, `--w-medium`, `--text-2xs`, one semantic color per variant (gold = GOTW only). (V3, V4)
4. **Numbers** — one `formatPoints()` at every PF/PA/DIFF/score/margin site. (#35)
5. **Color + logo contract** — `identityVars` + fixed `readableTextColor` + `--brand` wire-up + logo dims/lazy/ring. (V10)

## Non-issues (ruled out — do not "fix")
- **`teamInitials is not defined` on `/account`** — a **stale Turbopack chunk**; clean on fresh compile; `teamInitials` is correctly imported everywhere.
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
