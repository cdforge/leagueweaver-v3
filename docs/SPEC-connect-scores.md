# Spec — Connect-for-Scores + Team Mapping

_Status: draft • Owner: Anthony • Last updated: 2026-08-01_

Let a commissioner point a **manually-built** LeagueWeaver league at a **public**
ESPN or Sleeper fantasy league so weekly scores auto-fill instead of being typed
by hand. The connector is an *auto-filler of the existing manual score field* —
not a new source of truth.

---

## 1. Principle

- **Manual entry stays the source of truth and the fallback.** ESPN/Sleeper write
  into the same `ScheduledGame.homeScore` / `awayScore` a commissioner could type
  (`ScoresView`, `components/season/SeasonWorkspace.tsx:515`). Auto-filled scores
  remain editable; if the connection breaks, nothing else does.
- **One-line contract:** the flow writes a valid `providerId`
  (`sleeper-{leagueId}-{rosterId}` / `espn-{leagueId}-{teamId}`) onto each `Team`
  and sets `setup.platformConnection`. Everything downstream already keys on
  `Team.providerId` (`mapSleeperScores` `lib/platform/sleeper.ts:60`,
  `mapEspnScores` `lib/platform/espn.ts:97`) — no downstream change required.

## 2. Scope

**In:** a public-league connect step + a team-mapping UI, surfaced in the wizard
(conditionally) and in Settings.

**Out / explicitly avoided:**
- **Private ESPN leagues.** Public-league reads only — no `SWID`/`espn_s2`
  cookies, no credential entry, ever. A private league degrades gracefully to
  manual entry (§7). Existing cookie plumbing (`EspnAuthInput`,
  `platform_provider_credentials`) is left dormant, not extended.
- Player/roster/draft ingestion. Scores only.

**Platform matrix (final):** Sleeper (public, league ID or username) · ESPN
(public leagues only). **No auth anywhere. `PlatformConnection.authType` stays
`"public"`.**

## 3. Who sees the mapping step

Only the **unmapped** path. Teams imported from ESPN/Sleeper already carry a real
`providerId` (Path A) and skip mapping entirely. This flow is for **manual / CSV /
screenshot** leagues, whose teams have `manual-N` / `screenshot-N` ids that no
sync can join.

## 4. Data flow — reuse, don't refetch

The `/api/import/{provider}` route already returns `ImportTeam[]`, **each with a
real `providerId`**. The mapping modal calls that same endpoint and uses
`preview.teams` as the candidate pool — no new server route, no importing of
teams. The server keeps the `server-only` fetch; the client consumes the shaped
result and runs the matcher locally.

> Refactor worth doing first: extract the identifier + season + "read-only /
> must be public" input block from `ImportLeagueModal`
> (`components/imports/ImportLeagueModal.tsx:385`) into a shared
> `<PlatformConnectFields>` so both modals stay identical and fixes land once.

## 5. The matcher — `lib/platform/matchTeams.ts` ✅ built

Pure, **not** `server-only` (runs client-side; `espn.ts`/`sleeper.ts` are
server-only). Covered by `scripts/team-mapping-matrix.ts` (`npm run test:mapping`).

```ts
export function autoMatchTeams(
  teams: { id: string; name: string; city?: string; manager?: string }[],
  candidates: MappingCandidate[],   // { providerId, name, city?, manager?, division?, logoUrl? }
): TeamMatch[];                      // { leagueTeamId, providerId | null, confidence, score }
```

- **Normalize** — lowercase, `&`→`and`, strip punctuation, drop short filler
  (`the`, `fc`, …) but never to empty.
- **Score each pair 0–1** — weighted mean of the signals present: **manager
  weighted highest** (0.9; the owner is the stable join), name (0.5), city
  (0.25). Name similarity = max(token-set Dice, character-bigram Dice) so
  reordered words *and* spelling drift both survive. An **exact owner match**
  floors the score at 0.9 (all but definitive within one league).
- **Greedy one-to-one assignment** — highest scores first; each roster maps to at
  most one team, mirroring sync. Deterministic for identical input.
- **Tiers** (`MATCH_THRESHOLDS`): `high ≥ 0.82` (pre-selected, confident),
  `review 0.50–0.82` (pre-selected, "check this"), `none < 0.50`
  (`providerId: null`, left blank). Reuses the existing `high`/`review` sync
  vocabulary. **Pre-select only above threshold** — a silent wrong match feeds
  wrong standings, which is worse than a blank row.

**Open tuning question:** manager is weighted highest. Correct for fantasy, but if
leagues often leave manager blank, name should lead — confirm against real data.

## 6. Modal — `components/platform/ConnectScoresModal.tsx`

Built on the shared `Modal` shell (`components/ui/Modal.tsx`), mirroring
`ImportLeagueModal`'s two phases.

- **Phase A — Connect** (`!candidates`): `<PlatformConnectFields>` — provider
  mark, kicker `League scores`, league-ID/username input, season `CustomSelect`,
  `RefreshCw` read-only hint + ESPN `ShieldCheck` public-only note. Footer:
  `button-secondary visible` Cancel · `button-primary` "Find teams".
- **Phase B — Map** (candidates loaded): the mapping list (§7 UI). Footer:
  `button-secondary` Back · `button-primary` (`Check`) **"Connect scores"**,
  disabled until every team is resolved or explicitly left manual.

Inherited free from `Modal`: portal, focus trap, scroll lock, Escape, backdrop
dismiss, focus restore. Add the same **discard-guard** as import — a
`ConfirmDialog tone="danger"` kicker `UNSAVED MAPPING` when backing out after
edits (`ImportLeagueModal.tsx:499` is the template).

## 7. Mapping list — `components/platform/TeamMap.tsx`

One row per LeagueWeaver team, reusing the `import-review-table` grid.

```
[ LW team swatch + name ]  →  [ external-team CustomSelect ]  [ confidence chip ]
```

- **Left:** `import-review-swatch` (color + logo/abbreviation) + name/manager subtext.
- **Right:** `CustomSelect` of candidates, pre-filled from `autoMatchTeams`;
  option label = `name (manager)` to disambiguate.
- **Confidence chip:** reuse `import-status` — `ready`/`Check` "Matched";
  `review` amber "Check this"; `blocked`/`AlertCircle` "Choose".
- **Single-assignment guard:** a candidate maps to one team; picking an already-used
  one auto-clears the other row and surfaces it (never silently double-assign).
- **"N to confirm" jump:** same affordance as `jumpToProblems`
  (`ImportLeagueModal.tsx:256`).
- **Count-mismatch banner** (`import-warning`): extra/missing teams (byes,
  mid-season adds) explained; unmatched teams keep manual entry — no hard block.

## 8. Mount points (one component, two homes)

- **Settings** — the Platform Sync panel already prompts to connect when
  `!platformConnection` (`SeasonWorkspace.tsx:969`); that button opens this modal.
  Ship here first.
- **Wizard** — an *optional, conditional* prompt on Teams/Review, shown only when
  no team has a real `providerId`. Not a forced 10th step (mind the "Step X of 9"
  off-by-one at `LeagueBuilder.tsx:57`).

## 9. On confirm

```ts
teams.map(t => ({ ...t, providerId: matchOf(t)?.providerId ?? t.providerId }))
setup.platformConnection = { provider, providerLeagueId, seasonYear,
                             syncMode, authType: "public", status, hasScoreSync }
```
Autosave persists via the existing `setSchedule` effect
(`SeasonWorkspace.tsx:1365`); signed-in users also upsert `external_league_links`.
Optionally fire the first `onRefreshPlatformScores` so scores land immediately.

## 10. Edge cases

| Case | Handling |
|---|---|
| Partial pre-mapped (some real `providerId`) | Lock those rows confirmed; matcher fills only the rest (modal-level; matcher stays pure) |
| ESPN **private** league | Catch the fetch error → "This ESPN league is private — make it viewable to public, or enter scores manually." Degrades to manual |
| Re-map later | Settings reopens the modal pre-loaded from current `providerId`s |
| Disconnect | Existing `disconnectPlatform` (`SeasonWorkspace.tsx:1559`) clears the connection |
| Count mismatch / byes | Banner; unmatched teams stay manual |
| Ties in scoring | Deterministic index tiebreak; tied rows fall to `review`, never silent |

## 11. Standard-modal-styling checklist

Reuse verbatim: `Modal` / `ConfirmDialog` shells · `import-modal-head` / `-body`
/ `-actions` · `step-kicker` · `import-provider-mark {espn|sleeper}` with
`/providers/*.png` · `button-primary` / `button-secondary visible` /
`icon-button` · `CustomSelect` · `import-review-table` grid +
`import-review-swatch` · `import-status ready|blocked` chips · `import-warning` /
`import-hint` · discard `ConfirmDialog tone="danger"`. New CSS is layout-only
inside `.connect-scores-modal`. **No new colors, no new button styles.**

## 12. Build order

1. **`lib/platform/matchTeams.ts` — pure matcher + `test:mapping`.** ✅ Done.
2. Extract `<PlatformConnectFields>` from `ImportLeagueModal`.
3. `TeamMap.tsx` — the mapping list.
4. `ConnectScoresModal.tsx` — two-phase shell wiring 1–3.
5. Mount in the Settings Platform Sync panel; then the conditional wizard prompt.
6. Private-ESPN failure copy (§10) + public-only messaging carried into
   `<PlatformConnectFields>`.
