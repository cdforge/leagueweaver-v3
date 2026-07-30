# Figma Make Prompt

Use this prompt when connecting Figma Make to the `cdforge/leagueweaver-v3` GitHub repo.

```text
You are updating the visual UI styling for League Weaver v3, a polished fantasy football commissioner workspace.

Scope:
- Focus on visual styling, layout polish, spacing, hierarchy, typography, button styling, form clarity, responsive behavior, and interaction states.
- Prioritize the builder flow and season workspace screens.
- Keep the product dense, practical, calm, and commissioner-focused.

Brand direction:
- Preserve the current brand system.
- Use brand green #117a45, dark field ink #15231c, gold accent #e3b940, white, and soft green surfaces.
- Keep the tight 8px-or-less radius system.
- Preserve Barlow Condensed for display/brand moments and Archivo for body text.
- The app should feel like a professional product workspace, not a marketing landing page.

Important guardrails:
- Do not change schedule-generation logic.
- Do not change routing behavior.
- Do not change localStorage or database behavior.
- Do not change API routes, auth, billing, Stripe, Supabase, or notification code.
- Do not add new dependencies.
- Do not rewrite components from scratch unless required for a visual fix.
- Do not remove existing user workflows.
- Keep mobile tap targets usable and keep text readable on small screens.

Preferred files to touch:
- app/page.tsx
- app/globals.css
- components/AppHeader.tsx
- components/builder/LeagueBuilder.tsx
- components/season/SeasonWorkspace.tsx
- components/ui/*

Output:
- Create a new branch.
- Make small, reviewable UI changes.
- Open a pull request instead of pushing directly to main.
- In the pull request, explain what changed visually and which screens were affected.
```
