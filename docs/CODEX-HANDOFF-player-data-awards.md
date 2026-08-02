# Codex Takeover Brief — Player Data + All-Stars + MVT + Game-Detail Rosters

**You (Codex) own this build.** Ship the 17-story backlog, one story at a time, verified.

## 0. Single source of truth
`docs/AGENT-BACKLOG-player-data-awards.md` — **read it in full before touching code.** It is self-contained:
§B Canon (locked decisions), §C data model + Supabase schema, §D collection rules + exact codebase seams,
§E golden fixtures + numbers, **§E2 visual references (the HTML prototype + PNG mockups to match)**, §F QA
protocol, §G the 17 stories (each with build + acceptance + its own QA), §H dependency graph. Do **not** build
a story from any other doc; the backlog inlines everything.

## 1. Operating loop (per story — §A of the backlog)
1. Pick the next story whose `Blocked by` are all closed/merged. Start order: **TEST-0 → CONF-1 / DATA-1**.
2. Branch `agent/<STORY-ID>` off `feat/player-data-awards` (create that integration branch off `main` if absent).
3. Per this repo's `AGENTS.md`: **state which files you'll change first**, keep edits small and production-minded,
   preserve existing patterns, add no new deps unless the story requires them.
4. Implement to the story's **Build** + the §D insertion points. Smallest change that meets Acceptance. No scope creep.
5. Run the gate: `npm run typecheck && npm run build && npm test`, **plus the story's own QA (§F).**
6. Open a PR into `feat/player-data-awards`, body `Closes #NN`, listing each Acceptance box met and pasting the
   command output that proves the golden numbers. If red and you can't fix it, open a **draft** PR + comment
   exactly what failed. **Never** weaken/skip/delete a test to go green.

## 2. Anti-drift contract (non-negotiable — from §B)
Public ESPN/Sleeper only · platform-scored points only (no scoring engine) · player-centric, week-scoped
immutable ownership · rating = `score10` via `getMatchupSignal`/`toMatchupScore10` · gold = shared accolade ·
Conference is first-class · **no fake data** · **never hardcode PVE's roster/divisions/team count** · **no
player photos** (position + NFL-team-color badge) · **Pro-gating deferred — build everything accessible, no
paywalls** · the
Canon (§C) and Codebase Map (§D) are law — do not invent alternatives.

## 3. Environment & commands
- Node 20+ (no `engines` pin). `npm ci` to install.
- Gate: `npm run typecheck` (`tsc --noEmit`) · `npm run build` (`next build`) · `npm test`
  (the repo's `tsx scripts/*-matrix.ts` suite — **use this convention, not vitest/jest**).
- Fixtures are **public, keyless** API pulls (§E) — capture once to `scripts/fixtures/`, then tests run offline.
- UI smoke: Playwright `scripts/ui-smoke.ts` → `npm run test:ui`, writes `artifacts/screenshots/`.

## 4. Definition of done (§F — objective, not self-assessed)
Green `typecheck + build + test`, **and** the story's specific golden assertion passes with no skips
(288.42 all-star Wk1 · GREEN 55.50 tops MVT · DECOUPES 26.00 = 8+16+0+2 · GREEN 23 / YARDIES 17). Data/parser
stories cross-check parsed totals against the platform's own UI number. UI stories screenshot the new route
(desktop + mobile), confirm a clean console, and compare to the §E2 reference file. **Never declare done on a
typecheck alone.** Re-run engines on a non-PVE + IDP fixture (§E) to prove no hardcoding.

## 4b. Golden-fixture completeness (what the backlog gives you vs what may be missing)
The backlog inlines the **complete award catalog with exact points (§AW)** and the **headline golden numbers**
(288.42 · 55.50 · DECOUPES 26.00 = 8+16+0+2 · GREEN 23 / YARDIES 17). That is enough to gate the engines. For
an **exhaustive** golden test (every team's per-week All-Star team + every team's full MVT bucket breakdown),
the source is the user's **MVT Google Sheet** — if an export of it is committed under `scripts/fixtures/`, TEST-0
should assert against it; if it is not present, assert the headline numbers and **note the gap in the PR**. Do
not invent expected values.

## 5. Cloud-environment constraints — read before starting
- **Supabase migrations (DATA-1 and any table work):** migrations are SQL files under `supabase/sql/`
  (`074_player_awards.sql`). If your runtime has **no DB connection**, write + syntax-check the SQL and add a
  matrix/CI check, but **flag in the PR that live `apply` + the DATA-1 fresh-DB QA must run against a Supabase
  branch DB** (owner/CI step). Do not fabricate a "migrations applied" result.
- **UI visual parity:** if you have no interactive browser, the Playwright smoke (renders + screenshots) is your
  gate; **explicitly mark UI PRs "needs human visual review vs §E2"** — CI can't judge taste.
- **Secrets:** never use cookies / private leagues; public leagues only; never commit secrets; you do **not**
  need `ANTHROPIC_API_KEY`.

## 6. Scaffolding already in the repo
- `.github/workflows/ci.yml` — the **objective PR gate** (typecheck + lint + build + test + UI-screenshot
  artifact). Keep it; it validates your PRs.
- `.github/workflows/agent-build.yml` — a **Claude-path** runner. **Not used by Codex** — leave dormant (or the
  owner may delete it).
- `docs/AGENT-RUNBOOK.md` / `docs/MASTER-PLAYER-DATA-AWARDS-PRD.md` — design provenance only; build from the
  backlog (§0).

## 7. First move
Implement **TEST-0** (test harness + golden fixtures + Playwright smoke). It makes every later story's QA
objective. Then **CONF-1** (Conference entity — cross-cutting, land carefully) and **DATA-1** (types +
`074_player_awards.sql`). Follow §H from there.
