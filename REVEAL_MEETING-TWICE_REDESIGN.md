# Redesign spec — Reveal beat: "Meeting Twice" (rematch spacing)

Status: **BUILT — pivoted to direction C (VERTICAL season timeline).** Weeks now run
top→bottom on a 2-column grid (one column per pair, shared Wk 1→N scale): a long wait is a
tall column, a quick rematch a short one. Carries S2 (gap number stated, e.g. "12 wks apart"),
big 48px crests, and per-pair team colour (gradient-filled tracks + team-coloured pins, dark
colours lifted). Renderer is `rematchColumn(...)` in `GenerationReveal.tsx` (returns [head,
track] into `.reveal-rematch-v`). Verified live desktop + 375px, 0 console errors, TSC clean.
Note: the earlier horizontal build (direction A) is superseded by this. Owner surface: the
generation-reveal cinematic, replay recap only.

## Where it lives

- Renderer: `rematchRuler(...)` — `components/builder/GenerationReveal.tsx:478`
- Scene push (`key: "gaps"`, `kicker: "Meeting twice"`, `replayOnly: true`) — `components/builder/GenerationReveal.tsx:716`
- Styles: `.reveal-rulers` / `.reveal-ruler-*` — `app/globals.css:1031`
- Data: `divisionSeriesGaps()` → `{ longest?, closest? }`, each `SeriesGap { aId, bId, first, last, gap }` — `lib/revealStats.ts:80`. **`gap` (weeks apart) already exists and is currently unused in the UI.**

## Purpose (the lens every idea is judged against)

- **Who:** the commissioner reviewing a freshly generated schedule, in a celebratory Wrapped-style reel. Relaxed, scanning, not studying.
- **The one job:** show the *range* of rematch spacing in the divisional double-plays — one pair waits a whole season between their two meetings; another rematches almost immediately. The single insight is the **contrast**.
- **Context:** mobile-portrait first, auto-advances every 6s, replay-recap only (not the first-run reel).

## What already works (keep it)

- The shared 1→N week axis is the *right* mental model — bar length = literal weeks apart.
- The staggered pin-pop (first pin, then the second ~400ms later) dramatizes "…they meet again." Keep this beat.
- Card framing + tag/crest/rank pattern is consistent with the SoS and gauntlet beats.

## The core problem

The two rulers live in **separate, self-contained rows**, so the shared-axis comparison — the whole point — is lost; they read as two similar bars, not one long span vs one stub. And the **magnitude is never stated** (11 weeks vs 2), even though `gap` is already computed. Composition is also bottom-heavy: a big empty void sits above a card parked in the lower third.

---

## The one decision to make first

**A. Single shared axis, two lanes (recommended).** Both pairs drawn on *one* week axis, stacked. Max contrast — long span vs stub in a single glance. Cost: stacks four different teams (Champs/Mutts *and* Kings/Green) on one graphic, so lane labeling must be crisp or it reads as one four-team thing.

**B. Keep two rows, but lock them to the same visual scale + add the gap numbers (low-risk fallback).** Less dramatic, but still fixes the missing-stat and lost-comparison problems without the four-team labeling hazard.

**C. Vertical season timeline (bold swing).** Weeks flow top→bottom; long wait = a tall drop, quick rematch = a short hop. Fills the portrait void and reads as "the season" descending. Biggest change; only if we want to re-stage the whole beat.

Everything below specs **Option A** as the target, with the pieces that also apply to B called out.

---

## Stories (ranked; do S1+S2 first)

### S1 — One shared week axis, two lanes  ·  High impact / Medium effort
- **Problem:** two isolated rows kill the comparison that is the beat's reason to exist.
- **Where:** `rematchRuler` (479–492) + `.reveal-rulers` container (globals `1031`).
- **Current:** two independent `.reveal-ruler-row`s, each its own `pct()` axis, 30px apart.
- **Target:** one axis component spanning the card width (`min(452px, 88vw)`). Two lanes stacked, `20px` apart, **sharing the same `pct(week)` scale** (`6% + (week-1)/(weeks-1) * 88%`). Lane 1 = Longest wait (top), Lane 2 = Quickest rematch (bottom). Each lane: a 3px track (`rgba(255,255,255,.16)`) with a gold fill (`var(--gold)`) between the two pins. Because both lanes use the same scale, lane-1's fill spans nearly full width and lane-2's is a short stub — the contrast is the graphic.
- **Acceptance:** the two fills are measurably on the same scale — `pct(week)` identical across lanes; longest fill width ≥ 60% of track, quickest ≤ 25%, verified via `getBoundingClientRect()`. No horizontal overflow at 375px.

### S2 — State the gap number  ·  High impact / Small effort
- **Problem:** the magnitude (the actual stat) is never shown; user must subtract Wk 12 − Wk 1.
- **Where:** pass `gaps.longest.gap` / `gaps.closest.gap` into `rematchRuler` (currently only `first`/`last` are passed — `722`–`723`).
- **Current:** no number anywhere; only two pin labels "Wk 1 / Wk 12".
- **Target:** a gap chip centered above each lane's fill: **"11 weeks apart" / "2 weeks apart"** — number in Barlow-condensed `var(--text-xl)` `--gold`, unit in Archivo `var(--text-2xs)` uppercase `rgba(255,255,255,.6)`. Mirror the SoS beat's `Δ` chip treatment (`.reveal-wall-delta`). Optionally one headline line replacing the caption: *"The same rematch — 11 weeks apart, or just 2."*
- **Acceptance:** chip text equals `gap` weeks for each pair; `gap === last - first`. Chip stays inside the card at 375px.

### S3 — Crests at the pins, bigger; drop the text-heavy pair line  ·  Med / Small
- **Problem:** 20px logos + "#6 Champs & #3 Mutts" is a text-heavy line that can wrap; identity is weak.
- **Where:** `.reveal-ruler-teams` (globals `1033`) + head markup (`482`–`485`).
- **Current:** `teamMark(a,20) teamMark(b,20)` then bold "#6 Champs & #3 Mutts".
- **Target:** logo-forward like the gauntlet/SoS beats. Put the pair's two crests at **~26px** as the lane's left label with ranks as small superscripts; name text optional and secondary (`var(--text-2xs)`, `.6` ink) or dropped. Pins themselves stay gold dots (they mark *when*, not *who*).
- **Acceptance:** crest ≥ 24px; the pair label never wraps to a second line at 375px.

### S4 — Differentiate long vs quick (form echoes meaning)  ·  Med / Medium  *(bold-ish)*
- **Problem:** "longest" and "quickest" render identically (same gold, same weight); only length differs.
- **Where:** `.reveal-ruler-fill` (globals `1037`) + `revealGrow` timing.
- **Current:** both fills identical gold, same `revealGrow` 640ms.
- **Target:** long wait = thinner, calmer fill that **draws slowly** across its long span (a drawn-out crawl); quick rematch = thicker, bolder fill that **snaps** shut fast. The animation timing itself tells waiting-vs-immediacy. Respect `prefers-reduced-motion` (hold final state, no draw).
- **Acceptance:** with reduced-motion on, both lanes render final state instantly (no animation); with motion, longest-fill animation-duration > quickest-fill.

### S5 — Faint week scale under the axis  ·  Med / Small
- **Problem:** pins float without context; big void above the card.
- **Where:** new baseline element in the shared-axis component.
- **Current:** no scale; only two pin labels per row.
- **Target:** a muted baseline with ticks/labels at **Wk 1** and **Wk {N}** (optionally a mid tick), `var(--text-2xs)`, `rgba(255,255,255,.35)`, drawn once beneath both lanes. Lets the axis breathe upward into the empty space.
- **Acceptance:** endpoints labeled 1 and N; labels don't collide with pin labels on the quickest-rematch lane at 375px.

### S6 — Pin-label collision guard (quickest rematch)  ·  Low / Small
- **Problem:** when the two weeks are close (Wk 2 / Wk 4), the pin labels crowd.
- **Where:** `.reveal-ruler-pin em` (globals `1041`).
- **Target:** with a shared axis, label only the *gap span* (via S2 chip) and/or offset the two pin labels above/below the line so they never overlap.
- **Acceptance:** no label overlap when `gap ≤ 3` weeks, at 375px.

---

## One thing first

**S1 + S2 together.** A shared axis showing "11 weeks / 2 weeks" turns two look-alike bars into *"whoa — same picture, 11 vs 2."* That alone earns the beat. Everything else is polish on top.

## Open tensions / notes

- **Four-team labeling (the A-vs-B decision above).** Resolve before building S1.
- **Replay-only beat.** Polish here shows only in the full recap, not the first-run reel — weight effort accordingly.
- **Away-side mirroring** (done elsewhere this session) does not apply here — this beat has no `@`/`vs` matchup row.

## Verify-the-build checklist (when built)

- Drive the live beat in replay mode against the real league; screenshot desktop + 375px.
- Measure both fills' widths via `getBoundingClientRect()` — confirm same scale, long ≥60% / quick ≤25%.
- `getComputedStyle` the gap-chip font sizes; confirm chip text == `gap`.
- Toggle `prefers-reduced-motion`; confirm no draw animation, final state held.
- Fresh `console.error` counter stays 0 across the beat.
