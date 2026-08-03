# Decisions

## 2026-07-29

- League Weaver v3 uses Next.js App Router, TypeScript, and Tailwind CSS.
- The current repo folder is the source of truth for this session.
- The original requested handoff docs were missing from this folder, so they were recreated here.
- The app should preserve its current polished commissioner-workspace direction.
- The builder is the primary first-screen experience.
- The app should not become a generic landing page.
- The current UI uses local fonts from `public/fonts/`.
- The current visual system uses green, ink, gold, white, and soft field backgrounds.
- Use localStorage for the current MVP state unless backend work is specifically requested.
- The generated season route appears to be the likely next gap because the builder pushes to `/season/${season.id}` and no matching route was visible during the initial repo scan.

## UX Decisions

- Workspace subpages should use one navigation layer: the green/header navigation only.
- Page-local actions belong in a shared action bar above the compact workspace header.
- Page-local view switching should use section tabs instead of duplicate route tabs under the header.
- Keep UI dense, calm, and practical for commissioners.
- Preserve 8px-or-less radius styling unless an existing component requires otherwise.

## Engineering Decisions

- Prefer existing components and helpers.
- Keep changes small and scoped.
- Do not add dependencies unless necessary.
- Do not inspect generated folders, lockfiles, or SQL migrations unless directly relevant.
- Verify with `npm run build` after code changes.

## 2026-08-03

- The generated season workspace route exists at `app/season/[id]/page.tsx`; old notes saying it may be missing are stale.
- Pickems, Pickums, and PV Pickums are on hold for the MVP release.
- Pickems app routes, APIs, cron routes, components, library code, CSS, and reference images should stay out of the deploy surface.
- Old Pickems URLs should return plain 404 responses.
- The MVP release should present League Weaver as free and avoid visible paid-plan upsells or billing teasers.
- Advanced platform score sync is paused for MVP; manual score entry remains available.
- Do not deploy until the user explicitly says `deploy`.
