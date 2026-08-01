# Mobile / preview QA fixes

Running list from the mobile walkthrough of the welcome page + builder wizard.
Grouped by surface. "Done this pass" landed on `feat/large-leagues`; "Backlog"
is captured but not yet built.

## Done this pass

Finished-season preview (`components/welcome/SchedulePreview.tsx`, `app/globals.css`):
- **Week slider squeeze (mobile)** — preview week chips widened to 72px and the
  date range now wraps instead of clipping out of the button.
  (`.welcome-preview .week-selector button` in the ≤560px block.)
- **Weird frame box** — dropped the inset gray fill/box the shared list uses in
  the workspace; preview cards now sit cleanly on the section.
  (`.welcome-preview .matchup-card-list { background: transparent; padding: 0 }`)
- **Expand / collapse** — preview is collapsed by default to a single teaser card
  (the selected week's GOTW) + "Explore every week" CTA; a Preview/Close toggle in
  the topline opens the full week explorer. (`.wp-preview-toggle`, `.wp-teaser*`.)

Builder wizard (`app/globals.css`, `app/build/page.tsx`, `components/builder/LeagueBuilder.tsx`):
- **Sticky footer under Safari bar** — bumped the blueprint bar bottom padding to
  `max(env(safe-area-inset-bottom), 10px)` so the Continue button clears the
  iOS chrome. NOTE: still verify on a real iOS Safari; a structural dvh/sticky
  refactor may be needed if the toolbar still overlaps.
- **iOS input auto-zoom** — root cause was `body { font-size: 14px }` + inputs
  `font: inherit`; the enumerated 16px mobile list missed `.text-input`,
  `.textarea`, `.editor-field input`, `.saved-league-editor-body input`,
  `.ppw-*`. Added them so no text input drops below 16px on phones. (Did NOT add
  `maximum-scale=1` — that kills pinch-zoom / a11y.)
- **Nested scroll boxes** — on ≤720px the division-assignment list and the team
  editor list flow full-height (`max-height: none; overflow: visible`) so the
  page scrolls, not an inner box; assignment grid drops to one column.
- **Footer / proof band collision** — `.build-page .proof-band` and
  `.build-page .site-footer` hidden ≤980px (where the dark sticky bar lives).
- **Thanksgiving marker overflow (step "Frame the season")** — the holiday `<em>`
  pill is now contained (`max-width:100%` + ellipsis) and the mobile week-chip
  grid dropped 4→3 columns so the full "Thanksgiving" label fits.
- **Ranking step rows (step "Set last season's order")** — rows show team name
  only (dropped city / manager / division), the rank dropdown column is widened
  (116–136px) and the 580px min-width was removed so it fits without an inner
  horizontal scroll.
- **Generate CTA contrast** — the primary button on the dark `--ink` bar is now a
  brighter green (`#35b874`) with dark text so it reads against the dark bar.

## Done — round 2

- **Teams/divisions survive a count change** — `resizeTeams` / `resizeDivisions`
  in `LeagueBuilder.tsx` keep existing entries and only add blanks / trim from the
  end (verified: edited team & division names persist across +/- count changes).
- **Division assignment: team name only on mobile** — `.division-assign-row
  .team-city` hidden ≤720px; manager line kept.
- **Playoff Picture: team names on mobile** — `useIsMobile` gates `showCity`.
- **Mobile header profile icon** — the account avatar was hidden by an overly
  broad `.topnav … > span { display:none }`; now excludes `.account-avatar`, so
  the profile image/initials show again on phones.
  - *Open decision:* when a signed-in user has no avatar image, the fallback is
    initials. User asked for a "standard profile icon" instead — decide whether to
    swap initials → `CircleUserRound` (affects desktop too).

## Backlog (captured, not yet built)

### Component reuse
- **Reuse `MatchupCard` on the Matchup Ratings page** (currently its own layout).
- **Reuse `MatchupCard` on the Game of the Week page.**
- **Reuse `MatchupCard` for the playoffs too** — no separate playoff match style;
  the bracket/round matchups should render with the same card as everything else.
  Until the playoffs actually start, the card's score slot should read
  **"Projected"** instead of a score.
  `MatchupCard` lives in `components/season/MatchupPresentation.tsx` and is already
  shared by the home preview + workspace week view — extend it to these pages
  so all matchup/game cards are one component.

### Mobile matchup scroller (auto-scroll showcase)
- **Date overflow** — same week-selector issue as the preview but on this scroller:
  the button/whiff is narrower than the date, so the date projects out of the box.
  Apply the same widen + wrap (or truncate) fix.
- **City name on mobile** — the scroller can't fit the city; drop city, show team
  name only on mobile.
- **Auto-scroll behavior** — dwell on each match ~8s, soft-scroll to the next game,
  and loop back to the top after the last game.

### Export / share controls (season workspace)
- **Recap CSV / ESPN PDF / Share** — shrink Share to an icon-only button; move
  ESPN PDF, CSV, and Recap under a "More" menu; top-right align both controls on
  the card they sit in.

### Live preview week navigation
- **Tap the NFL week to jump** — in the live preview, tapping the week header
  should open a dropdown of all available weeks to switch to (not just the week
  strip). Ties into the preview's `.wp-weekhead`.

### Playoff bracket — projected vs played-out
- **Projected bracket shouldn't "play out" the games** — when the bracket is a
  projection (regular season not final), don't render every round as if it were
  decided. Just show each team's first potential playoff matchup / entry point
  (the seed zones in the corners), not a fully resolved bracket.
  (`components/season/BracketConnectorLayer.tsx` + the playoff bracket in
  `SeasonWorkspace` / the "LIVE PREVIEW" projected bracket.)

### Playoff — consolation games
- **"Consolation games" divider in the league schedule view** — the divider labeled
  "Consolation games" belongs in the league schedule (week) view, listing all
  consolation games for that week alongside the championship games, with the same
  **Projected** treatment until they start. (`components/season/ConsolationBracket.tsx`,
  `SeasonWorkspace` schedule view.)

### Team schedule — projected + actual playoffs
- **Show playoffs on the team schedule** — a team's schedule should include its
  **projected** playoff game. Only the *first* projected playoff game can be shown
  (you can't project where they'd go after that). Then as each playoff week
  completes, reveal more: finished playoff weeks become visible, so the team
  schedule progressively fills in the actual playoff path week by week.
  (`components/season/TeamSchedulePage.tsx`.)

### Playoff picture — mobile team names
- **DONE:** Playoff Picture now uses team names only on phones (`useIsMobile`
  gates `showCity` in `PlayoffPictureModal.tsx`).

### Saved-schedule dropdown — add "New schedule"
- **"New schedule" action in the schedules dropdown** — when the schedule/saved-
  league dropdown is opened to view all schedules, include a button to start a
  new schedule (a "New schedule" / skip-to-fresh action) alongside the saved ones.

### Builder state preservation (teams & divisions)
- **Don't drop existing entries on count change** — increasing or decreasing the
  number of teams must keep the teams already entered (only add blanks / trim from
  the end, never wipe the list). Same for the division count — preexisting
  divisions and their names/colors/logos should survive a count change.
  (`components/builder/LeagueBuilder.tsx` — team-count and division-count handlers.)

### Avatar / monogram states (`EntityLogo`)
- **DONE this pass:** acronym is now centered (flex centering on `.entity-logo`).
  Remaining: audit any other avatar fallbacks (`.division-mark`, `.preview-logo`)
  for the same top-pin at non-default sizes.
- **Acronym not centered** — when a team/division has no logo, the fallback shows
  its acronym/monogram, but the text is not centered vertically + horizontally
  inside the square. Fix the monogram centering in `EntityLogo` (and any
  `.entity-logo` / `.division-mark` / `.preview-logo` fallbacks) across all avatar
  sizes.

### Team schedule table (mobile freeze panel)
- **Lock the team icon only** — on mobile, the frozen/sticky first column should
  keep just the team icon (remove the team name) so more stat columns are visible
  while scrolling horizontally. (`components/season/TeamSchedulePage.tsx`,
  `.team-schedule-table .col-week` / sticky team column.)
