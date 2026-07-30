# TODO

## Highest Priority

- Confirm whether `/season/[id]` is missing.
- If missing, build the generated season workspace route.
- Make sure generated schedules can actually be viewed after clicking `Generate my season`.

## Results Workspace

- Load the saved season by id.
- Show a clear empty/error state if the season is missing.
- Group matchups by week.
- Show team names, managers, divisions, and home/away clearly.
- Add edit/reroll/export actions.
- Keep mobile layout polished and usable.

## Builder Polish

- Verify all five steps on desktop and mobile.
- Check that long team names and league names do not break layout.
- Confirm that step buttons, toggles, segmented controls, and sticky mobile actions feel consistent.
- Replace placeholder import/logo flows only when that feature is requested.

## Engine

- Keep the v3 engine as the primary schedule engine.
- Run `npm run test:engine` after engine changes.
- Do not rewrite the engine unless a real bug or requirement demands it.

## Later

- Scores
- Standings
- Playoffs
- Public sharing
- Saved leagues
- Auth
- Billing
- Supabase persistence
