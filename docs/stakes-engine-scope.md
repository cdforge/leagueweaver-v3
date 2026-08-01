# Stakes / “On the Line” — prospective scenario engine scope

Status: **design** (2026-07-31). Owner: —. Feeds the current-week “Stakes” panel
(see mockup artifact linked in session memory `stakes-panel-feature`).

The panel needs, for the current week, the list of outcomes that can be **clinched
or sealed this week** and exactly **what it would take**. This doc scopes the engine
that produces that list. UI is settled; this is the data layer.

---

## 1. What exists today (and why it matters)

- **`lib/clinch.ts`** — `calculateTeamClinchStates(schedule, throughWeek)` returns, for
  each team, booleans `{ divisionTitle, playoffBerth, topSeed, eliminated }` given results
  **through** `throughWeek`. `getTeamClinchTimelines` walks weeks 0..N to find the first
  week each became certain (retrospective — powers the `ClinchBadges`).
- The clinch math is a **points-range model**, not a standings model:
  - `buildTeamRanges` → each team’s `minimumPoints` (guaranteed now) and
    `maximumPoints` (`min + remainingGames*2`). Scoring is **win=2, tie=1** (win=2/ tie=1
    via `wins*2 + ties`), remaining games each worth up to 2.
  - `clinchedWithin(ranges, team, slots)` → `true` iff fewer than `slots` rivals have
    `maxPoints ≥ team.minPoints`. `eliminatedWithin` is the dual (`≥ slots` rivals with
    `minPoints > team.maxPoints`).
  - Per-mode pool/slot logic already encoded for `overall`, `division-leaders`,
    `division-halves`, plus `fieldStatus === "locked"` and regular-season-complete.
- **`lib/standings.ts`** — `resolveStandings` computes the *real* order via a full
  tiebreaker cascade (`head-to-head`, `division-percentage`, `common-opponents`,
  `strength-of-victory/schedule`, `point-differential`, `points-for`), manual overrides,
  and a preseason-seed → division-seed → name fallback. **This is richer than the points
  model and is NOT what clinch.ts uses.**
- **`lib/playoffs.ts`** — `projectPlayoffSeeds` / `resolvePlayoffPlacementMode` give the
  authoritative seeding and placement mode.

### The central decision: which accuracy model? → DECIDED: **exact, tiebreaker-aware**

“X has clinched” is a claim over **all** remaining outcomes (`∀` future results, X finishes
≥ target). With tiebreakers this is co-NP-hard in general. Decision (2026-07-31): build the
**exact** model — a clinch/elimination claim must hold under the real `resolveStandings`
tiebreaker cascade, not just points. Two consequences flow from this and are now **in scope**:

1. **The existing `ClinchBadges` must move onto the same core.** Today `clinch.ts` is the
   *conservative* points model. An exact panel next to conservative badges will visibly
   disagree (panel says “already clinched — no scenario”; badge still says “not yet”). So the
   exact engine becomes the shared source of truth and `calculateTeamClinchStates` is
   re-implemented on top of it. This is the main added cost of choosing exact.
2. **“Exact” cannot mean naive brute force.** At week 8 of 15 there are ~40 remaining games →
   `3^40` completions, infeasible. Exactness is achieved by *targeted adversarial search with
   an exact evaluator and hard pruning*, not enumeration — see §3. Where the relevant search
   space still exceeds a safety cap, we fall back to the conservative points certificate and
   **mark that scenario `approximate: true`** rather than assert an unverified exact result.

Why the points model is still load-bearing: whenever no rival can even *reach* T on points,
tiebreakers are moot and the cheap check is already exact. Points pruning is what makes the
exact search tractable — it eliminates the vast majority of games/ rivals as irrelevant, and
the exact evaluator only runs on the tied boundary.

> **Subtlety found during build (2026-07-31): score-dependent tiebreakers.** The tiebreaker
> chain includes `point-differential`, `points-for`, `strength-of-victory`, and
> `strength-of-schedule` — all functions of **future scores**, which are unbounded. So the
> boundary layer cannot be decided by enumerating win/loss/tie **outcomes** alone: a rival tied
> on record can be handed an arbitrary margin to win a point-based tiebreaker. Exactness there
> means: a clinch survives only if T is guaranteed the position under **all future outcomes AND
> all future scorelines**. Practically the boundary evaluator must, per candidate rival, resolve
> the tiebreaker chain treating any *still-swingable* score-based rule as **adversarial** (rival
> wins it) and only crediting rules already **decided and unswingable** (e.g. a head-to-head
> series fully played and won). Until that evaluator lands, `isLockedFor` returns the points
> certificate and marks tie-boundary cases `approximate: true` — never a false exact clinch.

---

## 2. Anchor: which week, and what “clinch this week” means

- **Target week `W`** = the **earliest week with unplayed games** (the live/current week),
  the same anchor as the score-entry prompt. The trigger only shows on that week.
  Rationale: “clinch *this* week” is only well-defined when weeks `< W` are fully played
  (baseline certain) and `W` is the deciding slate.
- **Clinch this week** = under the hypothesized results of week `W`, the outcome becomes
  mathematically certain considering **all** remaining games after `W` (i.e. `clinchedWithin`
  is true on the post-`W` ranges). This is exactly what happens today when
  `throughWeek` advances from `W-1` to `W`; we’re just previewing it across the possible
  `W` results.
- **Baseline** = `calculateTeamClinchStates(schedule, W-1)`. A team is a **candidate** for
  achievement `A` only if it has **not** already secured/lost `A` as of `W-1`. (No “clinch
  the division” row for a team that clinched last week.)

---

## 3. Algorithm (per candidate team × achievement)

`slots`/`pool` come from the same per-mode logic clinch.ts uses (extract it — see §5).
Three layers: a **points certificate** (cheap, conservative), an **exact lock test**
(adversarial search + real standings), and **path extraction** (own result + help).

### 3a. `isLockedFor(schedule, T, achievement, afterResults)` — the exact core

Given hypothesized week-`W` results (`afterResults`), decide whether `T`’s achievement is
**guaranteed for every completion of weeks `W+1..N`**. Returns `{ locked, approximate }`.

1. **Points certificate (fast path).** Build post-`W` ranges. If `clinchedWithin` (or
   `eliminatedWithin`) already says yes → `locked: true` exactly (no rival can *reach* T on
   points, so tiebreakers can’t matter). If even T’s *best* case can’t achieve it →
   `locked: false`. Most calls resolve here.
2. **Boundary → exact adversarial search.** Only when the answer hinges on rivals who can
   *tie* T on points:
   - **Reduce to relevant games.** Ignore every future game whose outcome can’t change
     whether a boundary rival reaches/passes T (games between two irrelevant teams, blowout-
     irrelevant, etc.). The relevant set is typically a handful even mid-season.
   - **Search for a counterexample.** DFS over completions of the relevant games where the
     adversary tries to put `slots` rivals ahead of `T` (T assumed to lose all its own
     remaining games — worst case). Account for **rival-vs-rival games** (both can’t win) —
     this is exactly what the points model misses and is the main source of real (not just
     tiebreaker) clinches. Evaluate each leaf order through `resolveStandings`/
     `projectPlayoffSeeds` so **tiebreakers are exact**. Prune with the points bound at every
     node.
   - `locked` = no counterexample exists. If the relevant search space exceeds
     `MAX_SEARCH_NODES`, stop and return the **points certificate with `approximate: true`**
     (never assert an unverified exact result).

### 3b. Path extraction (per candidate team × achievement)

For each **own result** `r ∈ {win, tie, loss}` (best→worst), fix `T`’s week-`W` game to `r`,
leave other week-`W` games open, and call `isLockedFor`:

1. **Clean / “win-and-in”:** `r` alone locks it (other week-`W` games still open) → record the
   minimal `r` (`win-or-tie` when both tie and win lock). `controlsOwnDestiny = true`.
2. **Needs-help:** `r` alone doesn’t lock it. Find external conditions by testing week-`W`
   rival results: a candidate help-set is *sufficient* iff fixing `r` + those rival results
   makes `isLockedFor` return `locked`. Search over week-`W` rival games (small — one slate),
   preferring the **fewest / weakest** conditions (`loss-or-tie` before `loss`). Verified
   exact by the same evaluator, so the displayed help is guaranteed sufficient.
   - If no sufficient help-set exists within week `W` (needs future weeks too) → `T` **cannot
     clinch `A` this week**; drop the achievement.
   - Interchangeable help-sets (“any k of n”) → emit the tightest and set `hasAlternates`;
     full alternate enumeration is Phase 3.

**Elimination** is the dual of clinch throughout (`eliminatedWithin` certificate; adversary
tries to keep `T` *in*; conditions are rival **wins**).

**Pools:** top-seed → `slots = 1`, league pool. Division-title → `slots = 1`, division pool,
gated on `hasDivisions`. Playoff-berth → per placement mode, exactly as clinch.ts branches.

Soundness rests on monotonicity (more points for `T` / fewer for rivals only helps `T`) for
the certificate layer, and on exhaustive counterexample search for the boundary layer.

---

## 4. Output shape (maps 1:1 to the mock)

```ts
interface WeekScenarios {
  week: number;                    // target week W
  scenarios: Scenario[];           // pre-sorted for display
}
interface Scenario {
  teamId: string;
  achievement: "top-seed" | "division-title" | "playoff-berth" | "elimination";
  divisionId?: string;             // set for division-title (drives the division logo/name)
  subjectGameId: string;           // T's week-W game (header matchup)
  controlsOwnDestiny: boolean;     // any clean path exists → drives 🎯 vs ⚠ "needs help"
  paths: ScenarioPath[];           // clean paths first, then needs-help
  approximate?: boolean;           // true iff a search cap forced the conservative fallback (§3a)
}
interface ScenarioPath {
  kind: "clean" | "needs-help";
  own: "win" | "win-or-tie" | "tie" | "loss";   // T's required result
  conditions: Condition[];         // external requirements; empty ⇔ clean
  hasAlternates?: boolean;         // true when interchangeable blockers were collapsed
}
interface Condition {
  teamId: string;
  result: "win" | "loss" | "loss-or-tie" | "win-or-tie";
  gameId: string;                  // that team's week-W game (so UI can show its matchup + link)
}
```

- **Display order:** `top-seed` → `division-title` (one per division, ordered by division
  standings) → `playoff-berth` → `elimination`. Within a scenario, clean path is `paths[0]`.
- Every `gameId` (subject + each condition) lets the UI render the opponent logo/matchup and
  wire the existing `highlightedGame` scroll/flash.

Signature: `getWeekScenarios(schedule: GeneratedSchedule, week?: number): WeekScenarios`
(defaults `week` to the current/live week). Pure, synchronous, no I/O — same as clinch.ts.

---

## 5. Module & refactor plan

- **New `lib/scenarios.ts`** — path extraction + output shape (§3b, §4).
- **New shared core** — `isLockedFor` / `resolveClinchPool` (§3a). Lives in `clinch.ts` or a
  new `lib/clinchCore.ts` both import. Extract the pool/slot resolution currently inlined in
  `calculateTeamClinchStates` (the `overall` / `division-leaders` / `division-halves` /
  `locked` branches).
- **Re-implement `calculateTeamClinchStates` on the exact core** (badge upgrade, now in
  scope). Today it’s the conservative points model; making the panel exact means the badges
  must be exact too or they’ll contradict it. **Guard this with characterization tests first**
  (snapshot current badge output across fixtures) so the upgrade only ever *adds* clinches the
  conservative model missed, never removes a real one. `getTeamClinchTimelines` is unchanged
  above the core.
- **No UI in this scope.** Consumers: the Stakes trigger (visible iff `scenarios.length > 0`)
  and the dark panel.

---

## 6. Edge cases (each needs a test)

1. **Locked field** (`fieldStatus === "locked"`, `week ≥ latestScoredWeek`): playoff berths
   are already decided → **no berth/elimination scenarios**; only #1-seed among locked teams
   can remain live. Mirror clinch.ts’s `lockedFieldApplies` short-circuit.
2. **Regular season complete after W** (`isRegularSeasonComplete`): `W` is the final week →
   scenarios collapse to “win/tie and you’re in, else out.” Verify no phantom rows for teams
   already mathematically done.
3. **Ties** (win=2/tie=1): a tie shifts `minPoints` by 1, not 2 → `win-or-tie` clean paths
   and `loss-or-tie` conditions must appear where the half-point matters. Explicit tie tests.
4. **Byes / uneven remaining games**: a candidate with no week-`W` game can still *clinch via
   others’ results* — its own result is “—”, all paths are needs-help. A blocker on a bye
   this week can’t be knocked out this week.
5. **Placement modes**: one fixture per `overall`, `division-leaders`, `division-halves`
   (2- and 4-division), plus the `divisionGroups` split, matching clinch.ts pools exactly.
6. **Divisionless / single division**: no division-title scenarios (`hasDivisions` false).
7. **Simulator / sandbox**: engine takes whatever `schedule` it’s handed → pass the active
   sandbox schedule and scenarios update live on reroll. Just don’t hardcode the saved one.
8. **“Any k of n” help**: assert the collapsed conjunction is *sufficient* and `hasAlternates`
   is set; document that exhaustive alternates are Phase 2.
9. **No scenarios**: early season / everything already clinched → `scenarios: []` → trigger
   hidden. (Not an error state.)

10. **Exact vs points certificate**: fixtures where the two *disagree* — (a) rival-vs-rival
    games let one steal points so a “not clinched” (points) is actually clinched (exact);
    (b) an unbreakable head-to-head tiebreaker locks a berth at equal points. These are the
    reason exact was chosen; each needs a test proving the exact engine catches it and the
    points model didn’t.
11. **Search cap**: a deep-remaining-season fixture that trips `MAX_SEARCH_NODES` → assert the
    result comes back `approximate: true` with the conservative certificate, never a wrong
    exact claim.

**Consistency invariant (property test):** for every scenario, if its clean path’s own result
is applied to week `W` and the schedule advanced, `calculateTeamClinchStates(schedule, W)`
must report that achievement as secured. Because both now sit on the same exact core, this
must hold for *every* reachable outcome — the single most important test.

**Brute-force oracle test:** on small fixtures (few teams, ≤ ~12 remaining games) where full
`3^g` enumeration through `resolveStandings` *is* feasible, assert `isLockedFor` matches the
oracle exactly. This is what validates the targeted search against real enumeration.

---

## 7. Decisions & remaining sub-decision

- **Accuracy model — DECIDED: exact, tiebreaker-aware** (§1). Badges move onto the same core.
- **Remaining sub-decision — the search-cap fallback.** When the exact search would exceed
  `MAX_SEARCH_NODES`, what should happen? Recommendation: **return the conservative certificate
  and mark `approximate: true`** (the panel can show a subtle “provisional” hint on those rare
  rows). The alternative — hard-gating the whole feature to late season where the search is
  always small — is simpler but drops legitimate mid-season scenarios. Recommendation stands
  unless product wants the hard gate.

## 8. Phasing

- **P0 — done.** Characterization test (`scripts/clinch-matrix.ts`) snapshotting `ClinchBadges`
  / `calculateTeamClinchStates` behavior on a completed season; wired into `npm test`.
- **P1 — in progress.** `lib/clinchCore.ts` created: extracted the points primitives +
  `resolveClinchPool` (top-seed / division-title / playoff-berth `overall`; division-placement
  modes return `null`, deferred). `isLockedFor` / `isEliminatedFor` implemented at the
  **points-certificate** layer with a principled `approximate` flag; validated against a
  brute-force oracle (enumerate completions through real `resolveStandings`/
  `projectPlayoffSeeds`). `clinch.ts` refactored to consume the core (full suite green — no
  badge regression). **Remaining P1:** the tie-boundary adversarial search + score-adversarial
  tiebreaker evaluator (turns today's `approximate: true` cases into exact verdicts), then
  re-point `calculateTeamClinchStates` at the exact core.
- **P2** — `getWeekScenarios` path extraction for top-seed + playoff-berth + elimination
  (`overall` mode); output shape (§4); consistency property test.
- **P3** — division-title + `division-leaders` / `division-halves`; ties; locked/final edges;
  `hasAlternates`.
- **P4** — wire the trigger + dark panel to the output (separate UI story).
