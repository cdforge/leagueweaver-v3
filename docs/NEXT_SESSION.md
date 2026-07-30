# Next Session

Start here. Do not rediscover the plan unless these docs are missing or clearly stale.

## Current State

League Weaver v3 currently has:

- A polished home page in `app/page.tsx`
- A five-step league setup builder in `components/builder/LeagueBuilder.tsx`
- Local font setup and analytics in `app/layout.tsx`
- Global brand and responsive CSS in `app/globals.css`
- A v3 schedule engine under `lib/engine/v3/`
- Storage helpers in `lib/storage.ts`
- Engine test script at `scripts/engine-matrix.ts`

The builder currently routes generated seasons to:

`/season/${season.id}`

At the time these notes were created, no matching `app/season/[id]` route was visible in this folder. That is the most likely next implementation gap.

## Recommended Next Work

1. Confirm the generated season route gap.
2. Build the season results/workspace route if still missing.
3. Keep the UI direction consistent with the existing builder:
   - compact
   - polished
   - commissioner-focused
   - green header only for top-level navigation
4. Add schedule display grouped by week.
5. Add workspace actions:
   - Edit teams/settings
   - Reroll schedule
   - Export CSV
   - Export PDF
6. Run `npm run build`.
7. Run `npm run test:engine` if schedule engine behavior changes.

## UX Guardrails

- Do not turn the results page into a landing page.
- Show the usable season workspace immediately.
- Keep actions clear and close to the schedule.
- Use compact tables/cards that are easy for a commissioner to scan.
- Make mobile usable without horizontal page overflow.
- Keep text short and practical.

## First Files To Read

Read in this order:

1. `AGENTS.md`
2. `docs/NEXT_SESSION.md`
3. `docs/BUILD_PLAN.md`
4. `logs/TODO.md`
5. `logs/DECISIONS.md`

Then inspect only the files needed for the specific task.
