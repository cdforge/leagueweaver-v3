# TODO

Updated August 3, 2026.

## Launch Checklist

- [x] Review the current diff and group it into clear buckets: Pickems removal, verified bug fixes, QA/lint cleanup, copy cleanup, docs cleanup, and deploy-only ignores.
- [x] Confirm no generated or accidental files are included in the final deploy set.
- [x] Remove empty Pickems folders left behind after route deletion.
- [x] Confirm Pickems stays on hold:
  - [x] No `/pickem` app routes in the build output.
  - [x] No `/api/pickem` or Pickems cron routes in the build output.
  - [x] Old Pickems URLs return plain 404 responses.
  - [x] No Pickems/Pickums/PV Pickums copy appears in sampled rendered app pages.
  - [x] No Pickems CSS, components, library files, or reference images are included in deployable app code.
- [x] Remove visible paid-plan tease from MVP launch copy.
- [x] Change platform-score-sync locked copy to paused-MVP copy instead of paid-upgrade copy.
- [x] Update stale handoff docs:
  - [x] Mark `/season/[id]` as present.
  - [x] Update `docs/NEXT_SESSION.md` with current release state.
  - [x] Update `docs/BUILD_PLAN.md` with current release state.
  - [x] Update `logs/DECISIONS.md` with the Pickems-on-hold decision.
- [x] Re-run `npm run lint -- --quiet` and confirm there are zero errors.
- [x] Re-run `npm run build` and keep the route list as final deploy evidence.
- [x] Re-run `npm run test` and confirm engine, playoffs, stats, mapping, clinch, and scenarios all pass.
  - [x] `npm run test:engine` passed after allowing the long matrix to finish.
  - [x] `npm run test:playoffs` passed.
  - [x] `npm run test:stats` passed.
  - [x] `npm run test:mapping` passed.
  - [x] `npm run test:clinch` passed.
  - [x] `npm run test:scenarios` passed.
- [x] Browser-check the main deploy paths on desktop and mobile:
  - `/`
  - `/build`
  - `/fantasy`
  - `/fantasy/leagues`
  - `/fantasy/schedules`
  - `/pricing`
  - `/privacy`
  - `/terms`
- [x] Browser-check blocked Pickems paths:
  - `/pickem`
  - `/pickem/new`
  - `/pickem/join/test`
  - `/api/pickem/pools`
  - `/api/cron/pickem-reminders`
- [x] Check for horizontal overflow and console errors on sampled desktop and mobile pages.
  - Local-only Vercel Analytics and Speed Insights script 404s appear under `next start`; route content and layout checks passed.
- [x] Create the final deploy handoff:
  - What changed.
  - What was removed.
  - What passed.
  - What warnings remain.
  - What exact deploy path to use when the user says `deploy`.
- [x] Do not deploy until the user explicitly says `deploy`.

## Site QA Backlog

- [x] Public share page privacy QA:
  - [x] Manager privacy toggle behavior is sent through `publicDisplay.managers`.
  - [x] City names toggle behavior is sent through `publicDisplay.cityNames`.
  - [x] Venue toggle behavior is sent through `publicDisplay.venues`.
  - [x] Published schedules are sanitized before storage so hidden manager names/emails, city names, and venues are removed from the public payload.
- [x] Season workspace visual QA:
  - [x] This Week.
  - [x] League schedule.
  - [x] Team schedule.
  - [x] Standings.
  - [x] Playoffs.
  - [x] Share/settings.
- [x] Mobile usability QA:
  - [x] 320px and 390px widths.
  - [x] Header and rail controls remain tappable.
  - [x] No horizontal page overflow.
  - [x] Sticky bars do not cover primary actions in sampled views.
- [x] Empty-state QA:
  - [x] Signed-out fantasy dashboard.
  - [x] Empty saved schedules.
  - [x] Empty saved leagues.
  - [x] Missing local season page.
  - [x] Missing public share page.

## Deferred Until Requested

- Advanced platform score sync.
- Billing relaunch.
- Supabase persistence expansion.
- New Pickems/Pickums/PV Pickums work.
