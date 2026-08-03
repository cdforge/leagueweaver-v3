# Build Plan

## Goal

Build League Weaver v3 into a polished fantasy football schedule and season workspace.

## Phase 1: Builder Foundation

Status: Present.

Current builder includes:

- League identity and display controls
- Import option cards
- Team, division, conference, and season controls
- Prior-season and draft-day ranking flows
- Fairness rule controls
- Playoff setup and preview controls
- Review and generate step
- Live preview panel

Keep improving this only when a specific issue is found.

## Phase 2: Season Workspace

Status: Present.

Current workspace includes:

- `/season/[id]` saved-season loading
- Clear missing-season state
- This Week, league schedule, team schedule, standings, playoffs, and share/settings views
- Local and cloud season loading paths
- Score entry and regular-season management surfaces
- CSV, PDF, and sharing actions where available

Keep QA focused on mobile usability, empty states, export behavior, and public-share privacy toggles.

## Phase 3: MVP Release Hardening

Status: In progress.

Needed before deploy:

- Confirm Pickems/Pickums/PV Pickums stays removed from routes, APIs, copy, CSS, components, libraries, and reference images
- Run `npm run predeploy:guard` after `npm run build` so stale 10-step builder code, missing required routes, or Pickems routes block deploy
- Confirm visible product copy stays focused on free MVP access
- Run lint, build, and tests
- Browser-check the main public and app routes on desktop and mobile
- Confirm blocked Pickems URLs return 404
- Prepare a deploy handoff

## Phase 4: Later Product Work

Deferred until requested:

- Backend persistence expansion
- Advanced platform score sync
- Billing relaunch
- Additional account automation

SQL files already exist under `supabase/sql/`, but do not inspect or edit them unless backend work is requested.

## Verification

After code edits:

1. Run `npm run build`
2. Run tests only if tests exist for the changed area

Do not deploy until the user explicitly says `deploy`.
