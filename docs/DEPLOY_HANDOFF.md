# Deploy Handoff

Updated August 3, 2026.

## Current Deploy State

Ready for final review:

- `npm run lint -- --quiet` passed.
- `npm run build` passed.
- `npm run predeploy:guard` must pass after each build before deploy.
- `npm run test` passed.
- Build route list has no `/pickem`, no `/api/pickem`, and no Pickems cron routes.
- Browser QA passed sampled desktop, 390px, and 320px routes with no horizontal page overflow.
- Old Pickems URLs returned plain 404 responses.
- `npm run test:playoffs`, `npm run test:stats`, `npm run test:mapping`, `npm run test:clinch`, and `npm run test:scenarios` passed.
- `npm run test:engine` passed after allowing the long matrix to finish.

## Changed

- Removed Pickems/Pickums deploy surface.
- Added hard 404 protection for old Pickems paths.
- Cleaned visible MVP launch copy so it stays focused on free MVP access.
- Changed locked score-sync copy to paused-MVP language.
- Fixed low-risk lint and accessibility issues.
- Fixed 320px workspace page overflow and small checkbox/legal-link touch targets.
- Updated stale handoff docs so `/season/[id]` is correctly marked as present.

## Do Not Deploy Yet

Wait for the user to say `deploy`.

When the user says `deploy`, use the production deploy path:

```bash
npm run build
npm run predeploy:guard
vercel pull --yes --environment production --scope cdf-orge
vercel build --prod --yes --scope cdf-orge
vercel deploy --prebuilt --prod --yes --scope cdf-orge
```

Confirm the final deployment is `READY` and points to `https://leagueweaver.com`.
