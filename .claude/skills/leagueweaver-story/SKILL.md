---
name: leagueweaver-story
description: >-
  Implement a story from the LeagueWeaver v3 audit backlog (docs/AUDIT-TODO_*.md)
  and verify it live in the app. Use this whenever the user asks to pick up,
  implement, or work an audit/backlog item in this repo — by id (H1, V1, V10,
  H10, R2…), by area ("the token foundation", "the color system", "division
  standings movement"), or by pointing at the AUDIT-TODO file. It layers the
  LeagueWeaver-specific facts — where the backlog lives, the design-token
  vocabulary, the adaptive-color helpers, how to reach played states, and what's
  parked — on top of the general ship-story method. Reach for it for any
  post-generation schedule-workspace change that should be checked against a
  story's acceptance criteria.
---

# LeagueWeaver Story Work

This is the project-specific layer. **Follow the general `ship-story` skill for
the method** (Frame → Plan → Implement → Verify → Close, one story at a time,
measure the rendered DOM, don't declare done on a typecheck). This file supplies
the LeagueWeaver facts that make that loop concrete here.

## Where the work is

- **Backlog / source of truth:** `docs/AUDIT-TODO_7-31-26.md`. Every story is
  self-contained: Problem, Where (`file:line`), Current vs Target (visual stories
  carry an explicit spec), Acceptance, Deps. Read the whole story, not just the
  anchor.
- The app is a Next.js fantasy-football **schedule generator**. Everything the
  backlog covers is *post-generation*: the Season Workspace
  (`components/season/SeasonWorkspace.tsx` and its views), the Simulator, the
  public share page, the generation reveal.

## What's parked — do not work these

Playoffs are on hold. **Skip `H12` entirely**, and skip the bracket-specific
parts of `#38` (the ones marked ⏸ HOLD — playoff score editors, bracket AT
summary, `.playoff-week-heading`, missing-seed "#0"). Do the non-playoff parts of
`#38` (clinch-badge pileup, legend mismatch, milestone clipping, tie indicator,
sticky headers). `canAccessPlayoffs` is hardcoded `false`, so playoff UI can't be
exercised live anyway.

## The design system (read before any visual story)

Story **V1** defines the token foundation the other visual stories build on —
an ~8-step type ramp (`--text-2xs:11px` … `--text-3xl:32px`), a `--num-*` display
ramp, a 4px spacing scale (`--space-1..6`), and radius tokens
(`--radius-chip/-sm/-/-lg/-pill`). Do V1 first; after it exists, build every
visual story to those tokens, not to hardcoded px. Nothing meaningful should
render below `--text-2xs` (11px).

Color/identity lives in **V10** and the helpers are in `lib/colorContrast.ts`:
- `accessibleTeamColor(hex)` — iterates toward ink until ≥4.5:1 on white. This is
  the *good* one; use it for brand text on light.
- `readableTextColor(hex)` — currently falls back to a bare `#000` unverified
  (V10 fixes it to iterate). Don't add new callers of the broken behavior.
- `tintColor`, `mixColor`, `luminance` — surface washes and derivations.
- Three colors have distinct jobs: **team = identity**, **division = grouping**,
  **league (`setup.color`) = brand/chrome** (today under-used; V10 wires
  `--brand`). At most one solid brand fill per component.

Known-good facts (don't "fix" them): the app is intentionally **light-only** (no
dark mode); **mobile is responsive** (rail collapses to a bottom tab bar, no
document-level horizontal overflow); team-*name* contrast is already guaranteed
via `accessibleTeamColor`.

## Verifying live

Verification is non-negotiable for anything the browser renders. Use the
browser-preview tooling, not a manual ask:

1. Start the dev server from `.claude/launch.json` (config `leagueweaver-dev`,
   port 3000) via the preview tool — **never** run `next dev` from a shell.
2. Open a season workspace at `/season/<id>` (client-side view switching keeps
   the URL, or use `?view=<key>`; `view` keys map to the rail items and
   `standings` = the StatsWorkspace tabs).
3. Drive the states the story touches; read computed size/contrast/spacing and
   DOM semantics from the rendered page; prove interactions with **real** pointer
   clicks and keypresses (dispatched events are often `isTrusted:false` and
   ignored); install a fresh `console.error` counter and confirm it stays 0.
4. If a computed value disagrees with the source you just edited, suspect a
   **stale Turbopack chunk/CSS** (the dev overlay marks stale builds) — hard
   reload / touch the file before concluding there's a real bug. A stale-chunk
   error is not a defect.

### Reaching played states (for standings, clinch, movement, leaders, winners/losers)

Most bugs (`H10`, `#35`, `#19`, `#36`, `#37`, clinch parts of `#38`) only appear
once games are scored. A fresh generation is preseason (0 scores), so:

- Prefer an existing scored season if present. A test league
  **"Prodigies vs. Esteemed FFL (Real)"** was scored for weeks 1–12; its scores
  are **synthetic** — never treat them as real user results.
- If none exists, generate a league (or load a saved-league setup via
  `/?savedLeague=<id>`, click through the builder's Continue steps to Step 9,
  "Generate my season"), then inject scores into
  `localStorage["leagueweaver:v3:seasons"][<id>].schedule.weeks[].games[]`
  (`homeScore`/`awayScore`), leaving a couple of late weeks unplayed to exercise
  both played and upcoming states, and reload. Clean up any throwaway season
  afterward so the account list stays tidy.

## Reaching "done"

Walk the story's Acceptance list explicitly, then run:

```bash
npm run lint
npm run build
```

Tests (`npm test`) cover the engine/playoffs/stats matrices — run them for
correctness stories in those areas. Mark the story done in the tracker and record
any discoveries as *new* stories in the backlog rather than folding them into the
current diff. Don't commit unless asked.
