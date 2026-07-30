# Build Plan

## Goal

Build League Weaver v3 into a polished fantasy football schedule and season workspace.

## Phase 1: Builder Foundation

Status: In progress / mostly present.

Current builder includes:

- League name, abbreviation, description, logo placeholder, color
- Import option cards
- Team count and division count controls
- Team editor
- Division editor
- Season length and NFL season controls
- Prior season finish toggle
- Fairness rule controls
- Review and generate step
- Live preview panel

Keep improving this only when a specific issue is found.

## Phase 2: Schedule Results Route

Status: Likely next.

Needed:

- Add `/season/[id]` route if missing
- Load the saved season from localStorage
- Show schedule grouped by week
- Show league summary
- Show validation or fairness summary
- Add page-local action bar above the workspace content

Required actions:

- Edit teams/settings
- Reroll schedule
- Export CSV
- Export PDF

UX notes:

- Results should feel like the actual app workspace, not a marketing page.
- Keep the header simple.
- Use dense but clean schedule rows.
- Make week groups scannable.

## Phase 3: Season Management

Needed later:

- Score entry
- Standings
- Playoff projections
- Import scores
- Saved leagues
- Published schedule links
- Account and billing surfaces

## Phase 4: Backend And Publishing

Needed later:

- Supabase persistence
- Public schedule sharing
- Stripe billing
- Logo upload bucket
- Auth and account state

SQL files already exist under `supabase/sql/`, but do not inspect or edit them unless backend work is requested.

## Verification

After code edits:

1. Run `npm run build`
2. Run `npm run test:engine` only if the schedule engine changed

Do not run broad extra checks unless the changed code requires them.
