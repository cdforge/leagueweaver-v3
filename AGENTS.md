# League Weaver v3 Agent Notes

Work in this repo as the source of truth:
`/Users/anthonymorris/Documents/Codex files/LeagueWeaver v3`

## Product

League Weaver v3 is a polished fantasy football commissioner tool. It helps a user build a league setup, generate a fair schedule, and eventually manage the season workspace.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Local React state and localStorage for the current MVP surface
- Vercel Analytics and Speed Insights are already wired in `app/layout.tsx`

## Current UX Direction

Preserve the current visual direction:

- Clean commissioner workspace feel
- White and soft green surfaces
- Brand green `#117a45`
- Dark field ink `#15231c`
- Gold accent `#e3b940`
- Tight 8px radius system
- Dense, professional app UI rather than a marketing landing page
- Barlow Condensed for display/brand moments
- Archivo for body text

UX priorities:

- Keep the builder easy to scan
- Keep forms readable and calm
- Keep mobile controls usable
- Use one clear navigation layer
- Use shared action bars and section tabs for workspace pages
- Avoid duplicate route tabs under the green header

## Current App Shape

- Home route: `app/page.tsx`
- Main builder: `components/builder/LeagueBuilder.tsx`
- Header: `components/AppHeader.tsx`
- Global styling: `app/globals.css`
- Schedule generation facade: `lib/schedule.ts`
- v3 engine: `lib/engine/v3/`
- Persistence helpers: `lib/storage.ts`
- Types: `lib/types.ts`

## Build Rules

- Tell the user what files will change before editing.
- Keep edits small and production-minded.
- Preserve existing UI patterns before adding new ones.
- Do not add new dependencies unless clearly needed.
- Do not scan `node_modules`, `.next`, lockfiles, generated files, or SQL migrations unless the task specifically requires them.
- Run `npm run build` after code changes.
- Run focused tests only when they exist for the changed area.

## Known Missing Handoff Docs

These docs were created because the user asked to establish them in this current folder:

- `docs/NEXT_SESSION.md`
- `docs/BUILD_PLAN.md`
- `logs/TODO.md`
- `logs/DECISIONS.md`
