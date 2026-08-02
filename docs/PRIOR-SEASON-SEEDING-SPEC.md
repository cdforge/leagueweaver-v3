# Prior-Season Seeding + Random Seeding — Spec

Status: Draft (2026-08-01). Owner decisions locked in this doc; not yet built.

## Goal

Let a commissioner seed a new schedule from **last season's finish**, pulled
automatically from a connected **public** ESPN or Sleeper league, instead of
hand-entering the order. Add **Random** as a hidden seeding source whose order
is a surprise until the schedule generates.

Seeding here means the `overallRank` / week-one order that feeds strength-based
scheduling and standings tiebreakers — the same value the builder UI already
labels "last season's finish" ([LeagueBuilder.tsx:1204](../components/builder/LeagueBuilder.tsx)),
except today it is manually entered and only defaults to import array order.

## Seeding sources

Extend `rankingSource` (today `"prior-season" | "draft-day"`, [lib/rankings.ts](../lib/rankings.ts))
with a third value and give `"prior-season"` a real data path:

| Source | Order comes from | Preview visible in builder? |
| --- | --- | --- |
| `prior-season` | Imported last-season finish (see below), editable | Yes |
| `draft-day` | `team.draftPlace` | Yes |
| `random` | Shuffle at generation time | **No — hidden until generate** |

## Which "last season's finish"

Two distinct signals; commissioner picks one when the source is `prior-season`:

- **Regular-season finish** — final standings order (wins/losses, points-for).
  Rewards season-long consistency. The default.
- **Playoff finish** — actual bracket placement (champion seeds #1, etc.).
  Rewards how the season ended.

Provider data:

- **Sleeper** — walk `previous_league_id` one hop back (already done in
  `scanSleeperHistory`, [lib/platform/sleeper.ts](../lib/platform/sleeper.ts), which
  currently keeps only the year count). Add `/league/{prev}/rosters` for
  regular-season finish and `/league/{prev}/winners_bracket` for playoff finish.
  Match managers by owner/roster ID.
- **ESPN** — `scanEspnHistory` ([lib/platform/espn.ts](../lib/platform/espn.ts))
  already fetches the prior season **with the `mStandings` view** and then
  discards it. Read `playoffSeed` / final standing out of the response we already
  have. Match teams by team/member ID. **Public leagues only, no cookies** — per
  [RESEARCH-espn-sleeper-data-collection.md](RESEARCH-espn-sleeper-data-collection.md)
  §3/§6/§10. "Last season" is recent enough to be reliable; older seasons are not
  in scope.

Wire the resulting order into the import routes where `rank: index + 1` is set
today (`app/api/import/espn/route.ts`, `app/api/import/sleeper/route.ts`).

## The newbie rule (locked: automatic + editable)

A "newbie" = a team whose manager has **no match** in last season's data: a
brand-new owner, or a roster slot that changed hands. This is the unavoidable
edge case of importing prior finish — and the house rule already answers it:
**seed newbies last** to ease them in with a chiller opening schedule.

Behavior:

1. On import, any unmatched manager is **auto-seeded last** (after all matched
   teams, in their prior-finish order).
2. Multiple newbies stack at the bottom; order among them is not meaningful —
   leave them in import order.
3. The result is **shown and editable** — the commissioner can drag to adjust
   before generating, in case a match is wrong.

This same "seed last" outcome is the graceful fallback when the whole prior
season is unreachable (league went private, ESPN blocked, no `previous_league_id`):
fall back to manual order, newbies-last where known.

## Random seeding (locked: truly random, no anchoring)

- Selecting `random` **suppresses the seed-order preview** in the builder. No
  reveal until the schedule is generated.
- Random is a **pure shuffle** — the newbie rule does **not** apply. Everyone,
  newbies included, takes their chances. Zero special-casing.

## Fallback chain (single rule)

```
prior-season selected:
  matched manager      -> prior-season finish order (reg-season or playoff)
  unmatched manager    -> seed last (editable)
  season unreachable   -> manual order, newbies-last where known
random selected:
  everyone             -> shuffle, hidden until generate
```

## Edge cases

- **Year one / brand-new league** — no prior season; `prior-season` source
  offers nothing to import, so fall back to manual or `random`.
- **Team count changed** (expansion/contraction between seasons) — seed the
  teams that exist now; extra prior teams are ignored, new teams are newbies.
- **Owner changed but team name kept** — match on owner/roster ID, not name, so
  this correctly reads as a newbie.

## Hook points (from code map)

- `rankingSource` + week-one order: [lib/rankings.ts](../lib/rankings.ts)
- Playoff seed consumer (unaffected, but downstream): `projectPlayoffSeeds` in
  [lib/playoffs.ts](../lib/playoffs.ts)
- History scans that already reach the data: `scanSleeperHistory`
  ([lib/platform/sleeper.ts](../lib/platform/sleeper.ts)), `scanEspnHistory`
  ([lib/platform/espn.ts](../lib/platform/espn.ts))
- Import routes that set `rank`: `app/api/import/espn/route.ts`,
  `app/api/import/sleeper/route.ts`
- Builder seed order + UI label: [LeagueBuilder.tsx](../components/builder/LeagueBuilder.tsx)

## Suggested build order

1. **ESPN-first, regular-season finish** — nearly free; `mStandings` is already
   fetched, just stop discarding it. Ships the whole feature on one provider.
2. **Newbie auto-last + editable** — the fallback logic; small and self-contained.
3. **Random source + hidden preview** — pure UX, no data dependency.
4. **Sleeper rosters + winners_bracket** — adds the second provider and the
   playoff-finish option.
