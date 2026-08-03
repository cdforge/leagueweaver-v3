# Next Session

Start here. This file reflects the current MVP release state as of August 3, 2026.

## Current State

League Weaver v3 currently has:

- A polished home page in `app/page.tsx`
- A 6-step grouped league setup builder in `components/builder/LeagueBuilder.tsx`
- Generated season workspace routes at `app/season/[id]/page.tsx` and `app/season/[id]/team/[teamId]/page.tsx`
- Saved schedule and saved league views under `/fantasy`
- Public schedule sharing at `app/share/[slug]/page.tsx`
- Pricing, privacy, terms, account, unsubscribe, and legal pages
- Local font setup, analytics, and speed insights in `app/layout.tsx`
- A v3 schedule engine under `lib/engine/v3/`
- Local MVP persistence helpers in `lib/storage.ts`

The old `/season/[id]` gap is closed. Do not spend another session rediscovering or rebuilding that route.

## Release Guardrails

- Pickems, Pickums, and PV Pickums are on hold.
- Do not add Pickems routes, APIs, copy, CSS, components, libraries, or reference images back into the deploy surface.
- The normal MVP release path should stay free. Avoid visible paid-plan upsells or billing teasers.
- Keep the UI dense, polished, commissioner-focused, and aligned with the current green/white workspace design.
- Do not deploy until the user explicitly says `deploy`.

## Recommended Next Work

1. Review `logs/TODO.md` for the latest launch checklist.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run `npm run test`.
5. Browser-check the listed main routes on desktop and mobile.
6. Confirm old Pickems URLs return 404.
7. Prepare the final deploy handoff, then wait for the user to say `deploy`.

## First Files To Read

Read in this order:

1. `AGENTS.md`
2. `docs/NEXT_SESSION.md`
3. `docs/BUILD_PLAN.md`
4. `logs/TODO.md`
5. `logs/DECISIONS.md`

Then inspect only the files needed for the specific task.
