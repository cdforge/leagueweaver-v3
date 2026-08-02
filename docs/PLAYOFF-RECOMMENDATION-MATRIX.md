# Playoff Recommendation Matrix — Season Length × Tourney Length

*One combined reference. The whole model rests on a 17-week calendar (`regularWeeks + tourneyWeeks ≤ 17`), single-elimination brackets (`champRounds = ⌈log₂F⌉`), byes to fill non-power-of-two fields (`byes = 2^⌈log₂F⌉ − F`), and a consolation bracket capped at championship depth (`cap = 2^champRounds`).*

---

## 1. Recommendation logic (plain English)

The three knobs chain in one direction — **season length → tourney length → field size** — and you read them in that order:

1. **Season length gates which tourney lengths survive.** The calendar ceiling is 17 weeks. A tourney of `W` weeks is only valid if `regularWeeks + W ≤ 17`. So a **13-week season leaves room for a 3- or 4-week tourney**; a **14-week season leaves room for only a 3-week tourney** (14 + 4 = 18 is over the cap and the builder silently clamps a requested 4 back to 3 via `resolvePlayoffWeeks`).

2. **Tourney length caps the field.** A `W`-week single-elim runs exactly `W` rounds, and each round halves the survivors, so it can resolve at most `2^W` entrants. Byes let a field `F` where `2^(W−1) < F ≤ 2^W` still finish in `W` rounds (the bye seats sit out round 1). Hence **`FIELD_CAP(W) = 2^W`: a 3-week tourney caps at 8, a 4-week tourney caps at 16.**

3. **Field size is the ideal for the league, then clamped to the cap.** `recommendedField = min(idealField(N), 2^W)`, where `idealField(N)` clamps the "40–55 % of the league" band to clean, even sizes {6, 8, 12, 16} (floor of 6, never 2/10/14, smaller clean size wins a tie). The cap only bites at **N ≥ 24**, and only on a 3-week tourney — which is exactly why big leagues want a 4-week window, which in turn forces a 13-week season.

Everything downstream (division-leader auto-bids, wildcards, byes, consolation depth, eliminations) is arithmetic off `N`, `F`, and division count `D`.

---

## 2. Availability — season 13/14 × tourney 3/4

| Season | Tourney | Valid? | Total weeks | Field cap |
|---|---|:---:|:---:|:---:|
| 13 wk | 3 wk | ✅ | 16 | 8 |
| 13 wk | 4 wk | ✅ | 17 | 16 |
| 14 wk | 3 wk | ✅ | 17 | 8 |
| 14 wk | 4 wk | ❌ (clamped to 3) | 18 (over cap) | — |

Three valid combos — **(13,3), (13,4), (14,3)** — one blocked cell — **(14,4)**.

**Consequence:** a 14-week season permanently caps the field at 8. Any league that should reach a 12- or 16-team field (N ≥ 24) can only do so with a 4-week tourney, which today requires dropping to a 13-week season.

**Open decision — unlock 14+4 (an 18-week total)?**
**Recommendation: do not unlock 18 weeks by default; route N ≥ 24 leagues to 13-week + 4-week instead.** The whole app (cron sync windows, `getMaximumPlayoffWeeks`, week-score-bar live windows) assumes a 17-week ceiling; an 18th week breaks that invariant everywhere for a one-week gain, whereas 13+4 buys the full 12/16 bracket without touching the cap. If a commissioner still insists, expose 14+4 only as an explicit advanced opt-in gated to `teamCount ≥ 24` — never the default, never offered to small leagues — with copy that it exceeds the standard 17-week season.

---

## 3. Recommended field size by team count

`3-week field = min(idealField(N), 8)` · `4-week field = min(idealField(N), 16) = idealField(N)` (the 16-cap never bites at N ≤ 32).

| N | idealField | 3-week field | 4-week field | Recommendation |
|---:|:---:|:---:|:---:|---|
| 8 | 6 | **6** | **6** | 3wk (either season); 4wk wastes a week |
| 10 | 6 | **6** | **6** | 3wk (either season) |
| 12 | 6 | **6** | **6** | 3wk (either season) |
| 14 | 6 | **6** | **6** | 3wk (either season) |
| 16 | 8 | **8** | **8** | 3wk (either season) |
| 18 | 8 | **8** | **8** | 3wk (either season) |
| 20 | 8 | **8** | **8** | 3wk (either season) |
| 24 | 12 | **8** ⚠ capped | **12** | **4wk on a 13-wk season** (3wk cuts to 8) |
| 28 | 12 | **8** ⚠ capped | **12** | **4wk on a 13-wk season** |
| 32 | 16 | **8** ⚠ capped | **16** | **4wk on a 13-wk season** |

**Season-length availability of each column:** the **3-week field** is reachable on **both 13- and 14-week seasons**; the **4-week field** is reachable **only on a 13-week season** (14+4 is blocked per §2). For N ≤ 20 the two columns are identical, so a 3-week tourney on either season length is the clean default. For N ≥ 24 the columns diverge and the 4-week / 13-week route is the recommendation.

---

## 4. Full matrix — team count × divisions/conference × tourney

Columns: **F** = recommended field · **Champ R** = `⌈log₂F⌉` · **Div bids** = `D` (all home) · **WC** = wildcards `F−D` (per-conference-half in parens when conferences ON) · **Byes** = `2^⌈log₂F⌉−F` · **Consol C** = `min(N−F, cap)` · **Elim** = `max(0,(N−F)−cap)` · **Consol R** = `⌈log₂C⌉` (special: C=6→3, C≤2→1). Conferences are ON only for even `D ∈ {4,6,8}`.

For **N ≤ 20 the 3-week and 4-week rows are numerically identical** (same F ⇒ same everything), so they share one row labeled `3wk · 4wk*`; the only difference is availability (`*`4wk needs a 13-week season, and for F=6 leaves a 4th week unused — see §5). For **N ≥ 24 the rows split**, because the 3-week cap forces F down to 8.

| N | D | Conf | Tourney | F | Champ R | Div bids (home) | WC (per-half) | Byes | Consol C | Elim | Consol R |
|---:|---:|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 8 | 1 | off | 3wk · 4wk* | 6 | 3 | 1 | 5 | 2 | 2 | 0 | 1 |
| 8 | 2 | off | 3wk · 4wk* | 6 | 3 | 2 | 4 | 2 | 2 | 0 | 1 |
| 8 | 4 | ON | 3wk · 4wk* | 6 | 3 | 4 | 2 (1) | 2 | 2 | 0 | 1 |
| 8 | 8 | ON | 3wk · 4wk* | 6 | 3 | 6 ⚠ F<D | 0 (0) | 2 | 2 | 0 | 1 |
| 10 | 1 | off | 3wk · 4wk* | 6 | 3 | 1 | 5 | 2 | 4 | 0 | 2 |
| 10 | 2 | off | 3wk · 4wk* | 6 | 3 | 2 | 4 | 2 | 4 | 0 | 2 |
| 12 | 1 | off | 3wk · 4wk* | 6 | 3 | 1 | 5 | 2 | 6 | 0 | 3 (C=6) |
| 12 | 2 | off | 3wk · 4wk* | 6 | 3 | 2 | 4 | 2 | 6 | 0 | 3 (C=6) |
| 12 | 3 | off | 3wk · 4wk* | 6 | 3 | 3 | 3 | 2 | 6 | 0 | 3 (C=6) |
| 12 | 4 | ON | 3wk · 4wk* | 6 | 3 | 4 | 2 (1) | 2 | 6 | 0 | 3 (C=6) |
| 12 | 6 | ON | 3wk · 4wk* | 6 | 3 | 6 (F=D) | 0 (0) | 2 | 6 | 0 | 3 (C=6) |
| 14 | 1 | off | 3wk · 4wk* | 6 | 3 | 1 | 5 | 2 | 8 | 0 | 3 |
| 14 | 2 | off | 3wk · 4wk* | 6 | 3 | 2 | 4 | 2 | 8 | 0 | 3 |
| 16 | 1 | off | 3wk · 4wk* | 8 | 3 | 1 | 7 | 0 | 8 | 0 | 3 |
| 16 | 2 | off | 3wk · 4wk* | 8 | 3 | 2 | 6 | 0 | 8 | 0 | 3 |
| 16 | 4 | ON | 3wk · 4wk* | 8 | 3 | 4 | 4 (2) | 0 | 8 | 0 | 3 |
| 16 | 8 | ON | 3wk · 4wk* | 8 | 3 | 8 (F=D) | 0 (0) | 0 | 8 | 0 | 3 |
| 18 | 1 | off | 3wk · 4wk* | 8 | 3 | 1 | 7 | 0 | 8 | 2 | 3 |
| 18 | 2 | off | 3wk · 4wk* | 8 | 3 | 2 | 6 | 0 | 8 | 2 | 3 |
| 18 | 3 | off | 3wk · 4wk* | 8 | 3 | 3 | 5 | 0 | 8 | 2 | 3 |
| 18 | 6 | ON | 3wk · 4wk* | 8 | 3 | 6 | 2 (1) | 0 | 8 | 2 | 3 |
| 20 | 1 | off | 3wk · 4wk* | 8 | 3 | 1 | 7 | 0 | 8 | 4 | 3 |
| 20 | 2 | off | 3wk · 4wk* | 8 | 3 | 2 | 6 | 0 | 8 | 4 | 3 |
| 20 | 4 | ON | 3wk · 4wk* | 8 | 3 | 4 | 4 (2) | 0 | 8 | 4 | 3 |
| 24 | 1 | off | 3wk ⚠ | 8 | 3 | 1 | 7 | 0 | 8 | **8** | 3 |
| 24 | 1 | off | 4wk | 12 | 4 | 1 | 11 | 4 | 12 | 0 | 4 |
| 24 | 2 | off | 3wk ⚠ | 8 | 3 | 2 | 6 | 0 | 8 | **8** | 3 |
| 24 | 2 | off | 4wk | 12 | 4 | 2 | 10 | 4 | 12 | 0 | 4 |
| 24 | 3 | off | 3wk ⚠ | 8 | 3 | 3 | 5 | 0 | 8 | **8** | 3 |
| 24 | 3 | off | 4wk | 12 | 4 | 3 | 9 | 4 | 12 | 0 | 4 |
| 24 | 4 | ON | 3wk ⚠ | 8 | 3 | 4 | 4 (2) | 0 | 8 | **8** | 3 |
| 24 | 4 | ON | 4wk | 12 | 4 | 4 | 8 (4) | 4 | 12 | 0 | 4 |
| 24 | 6 | ON | 3wk ⚠ | 8 | 3 | 6 | 2 (1) | 0 | 8 | **8** | 3 |
| 24 | 6 | ON | 4wk | 12 | 4 | 6 | 6 (3) | 4 | 12 | 0 | 4 |
| 24 | 8 | ON | 3wk ⚠ | 8 | 3 | 8 (F=D) | 0 (0) | 0 | 8 | **8** | 3 |
| 24 | 8 | ON | 4wk | 12 | 4 | 8 | 4 (2) | 4 | 12 | 0 | 4 |
| 28 | 1 | off | 3wk ⚠ | 8 | 3 | 1 | 7 | 0 | 8 | **12** | 3 |
| 28 | 1 | off | 4wk | 12 | 4 | 1 | 11 | 4 | 16 | 0 | 4 |
| 28 | 2 | off | 3wk ⚠ | 8 | 3 | 2 | 6 | 0 | 8 | **12** | 3 |
| 28 | 2 | off | 4wk | 12 | 4 | 2 | 10 | 4 | 16 | 0 | 4 |
| 28 | 4 | ON | 3wk ⚠ | 8 | 3 | 4 | 4 (2) | 0 | 8 | **12** | 3 |
| 28 | 4 | ON | 4wk | 12 | 4 | 4 | 8 (4) | 4 | 16 | 0 | 4 |
| 32 | 1 | off | 3wk ⚠ | 8 | 3 | 1 | 7 | 0 | 8 | **16** | 3 |
| 32 | 1 | off | 4wk | 16 | 4 | 1 | 15 | 0 | 16 | 0 | 4 |
| 32 | 2 | off | 3wk ⚠ | 8 | 3 | 2 | 6 | 0 | 8 | **16** | 3 |
| 32 | 2 | off | 4wk | 16 | 4 | 2 | 14 | 0 | 16 | 0 | 4 |
| 32 | 4 | ON | 3wk ⚠ | 8 | 3 | 4 | 4 (2) | 0 | 8 | **16** | 3 |
| 32 | 4 | ON | 4wk | 16 | 4 | 4 | 12 (6) | 0 | 16 | 0 | 4 |
| 32 | 8 | ON | 3wk ⚠ | 8 | 3 | 8 (F=D) | 0 (0) | 0 | 8 | **16** | 3 |
| 32 | 8 | ON | 4wk | 16 | 4 | 8 | 8 (4) | 0 | 16 | 0 | 4 |

**Division sizes skipped** (D must divide N evenly): N=8 → 3,6 · N=10 → 3,4,6,8 · N=12 → 8 · N=14 → 3,4,6,8 · N=16 → 3,6 · N=18 → 4,8 · N=20 → 3,6,8 · N=24 → none · N=28 → 3,6,8 · N=32 → 3,6.

---

## 5. Notes, awkward combos, and open decisions

**Arithmetic invariants (verified in every row):**
- `F` is always even (6, 8, 12, 16).
- `byes = 2^⌈log₂F⌉ − F` → 2 at F=6, 4 at F=12, 0 at the exact powers F=8 and F=16.
- `eliminated = max(0, (N−F) − 2^champRounds)` → nonzero only when the non-playoff pool exceeds the consolation cap: the N=18 (Elim 2) and N=20 (Elim 4) rows at every tourney length, and every N ≥ 24 **3-week** row (Elim 8/12/16). All N ≥ 24 **4-week** rows have `N−F ≤ 16 = cap`, so Elim 0.
- `consolR ≤ champR` in every row (the ceiling the whole design protects), because `C ≤ cap = 2^champRounds` always.

**Invalid / awkward combos:**
- **(14-week, 4-week) is invalid** — 18 total weeks over the 17-week cap; the builder clamps the request back to a 3-week tourney (§2).
- **4-week tourney on a small league (N ≤ 14, F=6)** is valid but wasteful: a 6-team field resolves in 3 rounds, so the 4th playoff week goes unused. Steer these leagues to a 3-week tourney (works on either season length).
- **3-week tourney on a big league (N ≥ 24)** is the real cost cell: the 8-team cap cuts **8 teams at N=24, 12 at N=28, 16 at N=32** with no consolation node at all. This is the concrete argument for routing N ≥ 24 to a **13-week + 4-week** configuration (§3), where the 12/16 field is reached and nobody is eliminated outright.

**"Division leaders protected" reconciliation:**
- `autoBids = D` (every division leader gets a home seed) and `wildcards = F − D` hold only while `F ≥ D`.
- **F < D collapse** (only N=8, D=8, where ideal F=6 < 8 one-team divisions): auto-bids truncate to the **top 6 division leaders by overall record**, `wildcards = 0`, and byes land on the top 2 of those leaders. **F = D** rows (N=12/D=6, N=16/D=8, N=24/D=8) similarly yield `wildcards = 0` with every leader seeded.
- **Byes go to division leaders first**, then spill to the best remaining wildcards when a conference half runs out of leaders (the F=12 rows with D=1/2/3: 2 byes per half, leaders filling first). With conferences ON, byes split evenly per half (1 per half at F=6, 2 per half at F=12).

**Open decisions:**
1. **Unlock 14+4 (18-week season)?** — Recommend **no** by default; if ever, an advanced opt-in gated to `teamCount ≥ 24` only (§2).
2. **Bye overflow placement** — top division leaders first, then best wildcards; even split per conference half. Confirm this ordering matches the seeding spec's Open Decision 3.
3. **Small-league 4-week handling** — decide whether the builder should even *offer* a 4-week tourney below N=16 (it only wastes a week); recommend hiding it or nudging to 3-week.