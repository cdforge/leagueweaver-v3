# LeagueWeaver Playoff Bracket Logic & Preview Legend — Implementation Spec

**Status:** Draft for implementation. Grounded against `lib/playoffs.ts`, `lib/consolation.ts`, `lib/conferences.ts`, `lib/clinchCore.ts`, and `components/builder/LeagueBuilder.tsx`. No files modified during analysis.

**Scope:** (a) conference-halves / 2-division division-halves seeding, qualification, and byes; (b) consolation bracket sizing with lowest-seed cut; (c) the wizard live-preview legend UI; (d) a scenario test matrix; (e) an explicit engine-vs-preview change map; (f) open decisions.

---

## 1. Summary of the rules (commissioner's terms)

The commissioner wants playoff brackets that behave the way real conference/division sports playoffs behave, with four intents:

1. **Two sides.** When the league has two conferences (or exactly two divisions), the bracket splits into two halves — one per conference/division — and the halves only merge at the final ("Conference Championship" → title game). A team never crosses into the other half.

2. **Division leaders are reserved, and the leader title is the primary way in.** Each division winner should be guaranteed a spot in its own half before any at-large ("wildcard") team is seated. A hot non-winner cannot bump a division champion out of the field. In the extreme — more divisions than playoff spots — being a division leader is the *only* way in, and the weakest division champions (by overall record) are the ones cut.

3. **Wildcards fill the leftover spots, ranked by record, within the same half.** After every division leader in a half is reserved, remaining spots in that half go to the best non-leaders *from that half only*, ordered by overall record. A stronger non-leader in the other conference never takes a spot in this conference.

4. **Byes go to the top division leaders.** A non-power-of-two field grants byes; those byes go to the highest-seeded division leaders (one per side, better record first), never to a wildcard while a leader is available.

5. **Consolation is never deeper than the championship.** The consolation/placement bracket runs in the same weeks as the championship, so it can have no more rounds. If more teams miss the championship than a same-depth consolation bracket can hold, the **lowest overall seeds are cut entirely** (no consolation game, no bracket node) rather than overflowing.

6. **The wizard preview must explain what's on screen.** A small legend decodes the bracket swatches: conference marks, division marks, and the neutral wildcard marker — adapting to whichever of the four league shapes is active.

**Where today's engine already matches vs. diverges** (detail in §6): the two-sided split, leaders-float-then-truncate ordering, and same-depth consolation clamp already exist. The three real gaps are: (a) the engine refuses to build halves when the field is smaller than the division count (`S < D`), silently demoting to pure overall standings; (b) there is **no** lowest-seed cut — oversized consolation fields silently drop overflow games; (c) the wizard preview reserves leaders globally rather than per half and has no legend.

---

## 2. Seeding, qualification & bye algorithm

### 2.1 Notation

- `F` = championship field size (even, for conference-halves).
- `D` = division count. `d` = divisions **per half** (`D = 2 → d = 1`; conferences: `D = 4 → d = 2`, `D = 6 → d = 3`, `D = 8 → d = 4`).
- `S` = playoff spots **per half** = `F / 2` when halves are balanced.
- A "half" is a bracket side from `conferenceDivisionGroups(setup)`: two divisions → each division is a half; even ≥4 divisions + 2 balanced conferences → each conference is a half.

### 2.2 Per-half seeding

```
seedHalf(half, S):                       // S = F/2 spots for this half
  leaders    = [ division winner of each division in half ]      // d teams
  leaders    = sort(leaders by OVERALL record, best first)       // tie-break: overall standings order
  nonLeaders = [ every other team in half, by OVERALL record ]   // wildcard pool, THIS half only

  if S == d:                             // exactly one spot per division
      reserved  = leaders
      wildcards = []
  else if S > d:                         // spare spots after every leader reserved
      reserved  = leaders                // ALL d leaders reserved
      wildcards = nonLeaders.slice(0, S - d)     // best (S − d) at-large from THIS half
  else: // S < d                         // fewer spots than divisions
      reserved  = leaders.slice(0, S)    // only the top-S leaders by record qualify
      wildcards = []                     // the lowest-record division winners miss entirely

  return [...reserved, ...wildcards]     // length == S; leaders (by record) ahead of wildcards (by record)
```

### 2.3 Field assembly & byes

```
seedField(F):
  A = seedHalf(halfA, F/2)
  B = seedHalf(halfB, F/2)
  order A,B so record(A[0]) >= record(B[0])   // overall #1 lands on side A

  byeCount    = nextPowerOfTwo(F) - F         // whole-field byes
  byesPerHalf = byeCount / 2                   // even for even F

  // Bye recipients within a half = that half's TOP seeds (leaders first, then wildcards):
  //   byesPerHalf <= reservedCount -> top byesPerHalf leaders (best record)
  //   else                         -> all leaders + top (byesPerHalf - leaders) wildcards
  // Overall #1 bye = side A's top leader; side B's top leader gets the other.

  interleave A,B into standard slots via divisionHalfSeedSlots(F)
```

### 2.4 Invariants

- Wildcards are **only ever drawn from the same half**; a leader is never displaced by a stronger wildcard from the other conference.
- Whenever `S >= 1`, a half's #1 seed is a leader (leaders sort ahead of wildcards), so the bye lands on a leader until byes exceed the leader count (see Open Decision 3).
- `S < d` truncation keeps the **top-S division winners by overall record**; the lowest-record division winners are fully excluded.

### 2.5 Decision table

Byes total = `nextPowerOfTwo(F) − F`, split evenly `byes/2` per half, filling each half's top seeds (leaders first, then wildcards).

**D = 2 (division-halves, d = 1/side)**

| F | S/half | leaders | wildcards | byes | recipients |
|---|---|---|---|---|---|
| 2 | 1 | 1 | 0 | 0 | — |
| 4 | 2 | 1 | 1 | 0 | — |
| 6 | 3 | 1 | 2 | 2 | each side's leader |
| 8 | 4 | 1 | 3 | 0 | — |
| 10 | 5 | 1 | 4 | 6 | per side: leader + top 2 wildcards |
| 12 | 6 | 1 | 5 | 4 | per side: leader + top 1 wildcard |
| 14 | 7 | 1 | 6 | 2 | each side's leader |
| 16 | 8 | 1 | 7 | 0 | — |

**D = 4 (2 conf × 2 div, d = 2)**

| F | S/half | leaders | wildcards | byes | recipients | case |
|---|---|---|---|---|---|---|
| 2 | 1 | 1 | 0 | 0 | — | S<D (top leader only) |
| 4 | 2 | 2 | 0 | 0 | — | S=D |
| 6 | 3 | 2 | 1 | 2 | top leader each conf | **6-team example** |
| 8 | 4 | 2 | 2 | 0 | — | **8-team example** |
| 10 | 5 | 2 | 3 | 6 | per conf: 2 leaders + 1 wildcard | S>D |
| 12 | 6 | 2 | 4 | 4 | per conf: 2 leaders | S>D |
| 14 | 7 | 2 | 5 | 2 | top leader each conf | S>D |
| 16 | 8 | 2 | 6 | 0 | — | S>D |

**D = 6 (2 conf × 3 div, d = 3)**

| F | S/half | leaders | wildcards | byes | recipients | case |
|---|---|---|---|---|---|---|
| 2 | 1 | 1 | 0 | 0 | — | S<D |
| 4 | 2 | 2 | 0 | 0 | — | S<D |
| 6 | 3 | 3 | 0 | 2 | top leader each conf | S=D |
| 8 | 4 | 3 | 1 | 0 | — | S>D |
| 10 | 5 | 3 | 2 | 6 | per conf: all 3 leaders | S>D |
| 12 | 6 | 3 | 3 | 4 | per conf: top 2 leaders | S>D |
| 14 | 7 | 3 | 4 | 2 | top leader each conf | S>D |
| 16 | 8 | 3 | 5 | 0 | — | S>D |

**D = 8 (2 conf × 4 div, d = 4)**

| F | S/half | leaders | wildcards | byes | recipients | case |
|---|---|---|---|---|---|---|
| 2 | 1 | 1 | 0 | 0 | — | S<D |
| 4 | 2 | 2 | 0 | 0 | — | S<D |
| 6 | 3 | 3 | 0 | 2 | top leader each conf | **S<D "8 div, small field"** |
| 8 | 4 | 4 | 0 | 0 | — | **S=D — every spot a leader** |
| 10 | 5 | 4 | 1 | 6 | per conf: 3 of 4 leaders | S>D |
| 12 | 6 | 4 | 2 | 4 | per conf: top 2 leaders | S>D |
| 14 | 7 | 4 | 3 | 2 | top leader each conf | S>D |
| 16 | 8 | 4 | 4 | 0 | — | S>D |

All three commissioner examples reproduce exactly: 6-team D4 = 2+1 with 1 bye/conf; 8-team D4 = 2+2; 8-team D8 = 4 leaders only.

---

## 3. Consolation sizing & lowest-seed cut

### 3.1 Core invariant

Consolation rounds `Rk` must satisfy `Rk ≤ Rc` (championship rounds). Consolation runs in the *same* calendar weeks as the championship (`weekNumber = weeks + roundIndex + 1`), so there are exactly `Rc` week-slots. Today the bracket is allocated to `roundNames.length` rounds and overflow games are **silently dropped** (`if (!gamesByRound[roundIndex]) return null`). The target replaces "silently drop games" with "cut the lowest overall seeds before the bracket is built."

### 3.2 Algorithm

Inputs: `N` = total teams, `F` = field size, standings order (overall seed `1..N`).

```
Rc  = getPlayoffRoundNames(settings, divisionCount).length    // = log2(nextPowerOfTwo(F)); single source, not re-derived
cap = 2 ** Rc                                                  // max teams a Rc-round single-ranking bracket exactly ranks
nonPlayoff = N - F
C   = min(nonPlayoff, cap)                                     // teams admitted to consolation
cut = nonPlayoff - C  = max(0, nonPlayoff - cap)               // lowest overall seeds eliminated outright
```

- **Consolation entrants** = top `C` non-playoff seeds: overall seeds `F+1 … F+C`.
- **Cut / eliminated** = overall seeds `F+C+1 … N`. They never enter `classify` / `addGame`.
- Depths: championship `Rc`; consolation `Rk = ceil(log2(C))` (with `C = 6 → 3` via `classifySix`, `C ≤ 2 → 1`). Because `C ≤ cap = 2^Rc`, `Rk ≤ Rc` always. Cutting fires only when `nonPlayoff > cap`; the invariant is a ceiling, not a floor.

`Rc` **must** come from `getPlayoffRoundNames(...).length` (it already accounts for byes via `nextPowerOfTwo(F)`, so `F=6` and `F=8` both give `Rc=3`).

### 3.3 Worked examples

| N | F | Rc | cap | non-playoff | C | cut | champ rounds | consol rounds Rk |
|---|---|----|----|----|----|----|----|----|
| 24 | 6 | 3 | 8 | 18 | 8 | **10** | 3 | 3 |
| 24 | 8 | 3 | 8 | 16 | 8 | **8** | 3 | 3 |
| 32 | 8 | 3 | 8 | 24 | 8 | **16** | 3 | 3 |
| 12 | 6 | 3 | 8 | 6 | 6 | 0 | 3 | 3 (`classifySix`) |
| 10 | 4 | 2 | 4 | 6 | 4 | **2** | 2 | 2 |

The 24/6 row is the commissioner's headline scenario: current code renders a 4-round consolation (an 18-team tree overflowing round 3); the fix admits only the top 8 non-qualifiers (clean 3-round bracket) and cuts the bottom 10 seeds. 12/6 confirms the no-cut path.

### 3.4 Three representation tiers

Rendered distinctly in both the wizard live-preview and the app consolation/placement views:

- **Qualifiers** (seeds `1..F`): championship bracket, full color/logo.
- **Consolation** (seeds `F+1..F+C`): consolation bracket nodes with games, placement range `F+1..F+C`, muted relative to championship but active.
- **Cut / eliminated** (seeds `F+C+1..N`): **no games, no bracket node.** A single collapsed tail band — one row/range labeled e.g. `F+C+1 … N — Did not make a bracket`. May be listed in overall-seed order for reference, de-emphasized "eliminated" style. This mirrors the tail band `projectPlacementChart` already emits (`[field + cap + 1, total]`, source `"Outside the bracket"`); the target makes the *bracket generator* honor the same boundary instead of trying to seat everyone.

The cut tier gets its own swatch distinct from the wildcard marker (§4): **at-large = a qualifier that got in without a division title; cut = didn't get into any bracket.** They must not share a color.

---

## 4. Legend UI spec (wizard live-preview)

### 4.1 Grounding

- Preview island: `<aside className="playoff-wizard-preview">` — dark broadcast island, `background: var(--pk)` (#171d1a) (`LeagueBuilder.tsx:1262`, CSS `globals.css:5297`).
- Header: `<div className="ppw-preview-head">` — already `flex; align-items:center; justify-content:space-between` holding only `<span className="ppw-preview-eyebrow">Live preview</span>` (`LB:1263`). **The right half of that flex row is the legend's home.**
- Swatch parity — reuse the bracket's own markup so the key decodes exactly what's drawn:
  - division **logo** → `.ppw-slogo` (17×17, `globals.css:5363`).
  - division **color** → `.ppw-dchip` (16×16, `background:{division.color}`, initials via `divInitials`, CSS `5343`).
  - neutral / at-large fallback color already `#586761` (`renderSlot` fallback `LB:1133`; `--slot-c` default).
  - half accents already in system: `.ppw-half-0 {#3fbf7f}` / `.ppw-half-1 {#6ea2ff}` (`5311`).
- In-scope flags: `conferencesActive` (`LB:965`), `divisions` (`957`), `divisionCount` (`857`), `previewHalves` (`973`), `p.placementMode`, `p.fieldSize`, `byeCount` (`890`), `setup.conferences`, `halfDivisionIds` (`969-971`).

**Do not use `<EntityLogo>`** for legend swatches — it hard-clamps `enforcedSize = Math.max(32, size)`, far too big for a ~15px key. Reuse `.ppw-slogo` / `.ppw-dchip`.

### 4.2 Legend entries + color/logo mapping

| Row type | Swatch | Logo | Name | Fallback |
|---|---|---|---|---|
| **Conference** (`.is-conf`) | `conference.color` → `.ppw-dchip` bg | `conference.logoUrl` → `.ppw-slogo` | `conference.name` (tinted `accessibleAccentColor(conference.color, "#171d1a")`) | initials `resolveInitials(conference.initials, name.slice(0,3).toUpperCase())` |
| **Division** (`.is-div`) | `division.color` → `.ppw-dchip` bg | `division.logoUrl` → `.ppw-slogo` | `division.name` (`--pk-ink`) | `divInitials(division)` |
| **Wild card** (`.is-wild`) | fixed neutral `#586761` → `.ppw-dchip` bg | never a logo | `"Wild card"` (`--pk-mut`) | glyph `#` inside chip (same glyph the bracket prints for a no-division slot) |

Rules:
- **Logo wins when present, else the color tile** — identical branch to `renderSlot` (`LB:1136`), giving 1:1 parity with slots.
- Wildcard is intentionally **neutral** (`#586761`, never gold — gold is reserved for GOTW/champion per the strength-scale rule).

**Consistency flag (surface, don't invent):** today the wizard tints a wildcard slot by the team's **division** color, so the neutral wildcard color does not yet appear in the bracket body — the legend's wildcard row is currently *explanatory only*. Recommended follow-up (Open Decision 8): mark at-large slots in the bracket with a neutral `#586761` left-accent or a "WC" tag so the legend swatch has an on-screen referent.

### 4.3 Adaptation — one legend, four shapes

```
conferencesActive = hasConferences(setup)         // LB:965
hasWildcards      = p.fieldSize > divisionCount    // at least one at-large seat
```

| Condition | legendMode | Rows |
|---|---|---|
| `conferencesActive && previewHalves` | **`halves-conf`** | 2 Conference rows, each with its Division rows grouped/indented beneath; Wild card row iff `hasWildcards` |
| `previewHalves && !conferencesActive` (2 divisions) **or** `placementMode === "division-leaders"` | **`divisions`** | one Division row per division (no conference rows); Wild card row iff `hasWildcards` |
| `placementMode === "overall" && divisionCount >= 2` | **`colorkey`** | Division rows only, as a plain color key — no conference row, no wildcard row |
| `divisionCount <= 1` | **`hidden`** | legend not rendered |

Notes:
- In `halves-conf`, divisions group under their conference (via `halfDivisionIds`) so the two sides read as two clusters — the case that most needs the legend.
- The wildcard row appears **once** globally (not per conference) to keep the corner compact.
- `colorkey` mode drops the wildcard and reads as a pure division color reference (in overall mode every seat is earned by overall seed; there is no leader/wildcard reservation to explain).

### 4.4 Placement, responsive, class names

**Placement:** second child of `.ppw-preview-head`, landing top-right across from the "Live preview" eyebrow — the existing `justify-content:space-between` positions it, no markup restructure.

**Responsive:** header gains `flex-wrap: wrap` + `align-items: flex-start` so the legend drops to its own full-width line under the eyebrow when it can't share the line. At `≤880px` (where `.playoff-wizard-layout` collapses to one column) and `≤560px`, it becomes a full-width wrapping row of chips — in DOM order, never `overflow-x` hidden. Names use `--text-2xs` (≥11px floor); marks stay 15px.

**Classes to add:**

| Class | Role |
|---|---|
| `.ppw-legend` | container; `display:flex; flex-wrap:wrap; gap; justify-content:flex-end; max-width:62%` |
| `.ppw-legend-title` | optional tiny "Key" eyebrow (`--pk-mut`, uppercase) |
| `.ppw-legend-group` | one conference cluster; only in `halves-conf` |
| `.ppw-legend-item` | swatch+name unit; modifiers `.is-conf` / `.is-div` / `.is-wild` |
| `.ppw-legend-name` | label text |
| reused `.ppw-slogo`, `.ppw-dchip` | swatches (no new CSS) |

```css
.ppw-legend { display:flex; flex-wrap:wrap; align-items:center; gap:6px 12px; justify-content:flex-end; max-width:62%; }
.ppw-legend-title { font-size:9px; font-weight:var(--w-black); letter-spacing:.08em; text-transform:uppercase; color:var(--pk-mut); }
.ppw-legend-group { display:flex; flex-wrap:wrap; align-items:center; gap:6px 10px; padding-left:9px; border-left:1px solid var(--pk-line); }
.ppw-legend-item { display:inline-flex; align-items:center; gap:5px; min-width:0; }
.ppw-legend-item .ppw-slogo, .ppw-legend-item .ppw-dchip { width:15px; height:15px; min-width:15px; }
.ppw-legend-name { font-size:var(--text-2xs); font-weight:var(--w-bold); color:var(--pk-ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
.ppw-legend-item.is-conf .ppw-legend-name { font-weight:var(--w-black); letter-spacing:.01em; } /* accent color inline */
.ppw-legend-item.is-wild .ppw-legend-name { color:var(--pk-mut); }
.ppw-preview-head { align-items:flex-start; flex-wrap:wrap; }
@media (max-width:880px){ .ppw-legend { max-width:100%; justify-content:flex-start; } }
```

### 4.5 JSX sketch (drop-in for the header at `LB:1263`)

```tsx
const hasWildcards = p.fieldSize > divisionCount;
const legendMode: "halves-conf" | "divisions" | "colorkey" | "hidden" =
  divisionCount <= 1 ? "hidden"
  : conferencesActive && previewHalves ? "halves-conf"
  : previewHalves || p.placementMode === "division-leaders" ? "divisions"
  : p.placementMode === "overall" ? "colorkey"
  : "hidden";

const WILD = "#586761";
const mark = (color: string, logoUrl: string | undefined, initials: string) =>
  logoUrl
    ? <img className="ppw-slogo" src={logoUrl} alt="" />
    : <b className="ppw-dchip" style={{ background: color, color: readableTextColor(color) }}>{initials}</b>;

const divItem = (d: Division) => (
  <span key={d.id} className="ppw-legend-item is-div">
    {mark(d.color, d.logoUrl, divInitials(d))}
    <span className="ppw-legend-name">{d.name}</span>
  </span>
);
const wildItem = (
  <span className="ppw-legend-item is-wild">
    <b className="ppw-dchip" style={{ background: WILD, color: readableTextColor(WILD) }}>#</b>
    <span className="ppw-legend-name">Wild card</span>
  </span>
);

<div className="ppw-preview-head">
  <span className="ppw-preview-eyebrow">Live preview</span>
  {legendMode !== "hidden" && (
    <div className="ppw-legend" aria-label="Bracket legend">
      {legendMode === "halves-conf" && setup.conferences!.map((conf, hi) => (
        <div key={conf.id} className="ppw-legend-group">
          <span className="ppw-legend-item is-conf">
            {mark(conf.color, conf.logoUrl, resolveInitials(conf.initials, conf.name.slice(0, 3).toUpperCase()))}
            <span className="ppw-legend-name" style={{ color: accessibleAccentColor(conf.color, "#171d1a") }}>{conf.name}</span>
          </span>
          {divisions.filter((d) => halfDivisionIds[hi].has(d.id)).map(divItem)}
        </div>
      ))}
      {(legendMode === "divisions" || legendMode === "colorkey") && divisions.map(divItem)}
      {(legendMode === "halves-conf" || legendMode === "divisions") && hasWildcards && wildItem}
    </div>
  )}
</div>
```

Behavior by shape: 2 conf × 2 div / 8-team → two clusters + one Wild card chip (matches 2 leaders + 2 wildcards per conf); 2 conf × 4 div / small leaders-only field → two clusters, all 8 divisions, **no** Wild card chip (correctly signals "division leader is the only way in"); 2 divisions → two division rows + wildcard; ≥3 divisions `division-leaders` → flat division rows + wildcard; overall multi-division → flat color key; single division → nothing.

---

## 5. Scenario test matrix

Assertions for the matrix harness (`scripts/playoff-matrix.ts`). Formulas: champ rounds `= ceil(log2(F))`; `pow2(F) = nextPowerOfTwo(F)`; consolation seated `= min(N−F, pow2(F))`; **cut `= max(0, (N−F) − pow2(F))`**; consol rounds `= ceil(log2(seated))`. Per side: `S==d` → all leaders no wildcards; `S>d` → d leaders + (S−d) wildcards; `S<d` → top S leaders only.

| # | N / conf / D / F | Mode (target) | Sides | Per-side reserved + WC | Byes | Champ R | Consol seated/cut/R | Flags |
|---|---|---|---|---|---|---|---|---|
| 1 | 8 / on / 4 (2·2) / 8 | division-halves | A, B | 2 lead + 2 WC | 0 | 3 | off (0 non-qual) | Whole league qualifies → consolation off. |
| 2 | 12 / on / 4 (2·2) / 6 | division-halves | A, B | 2 lead + 1 WC | 2 → seeds 1&2 (one/side) | 3 | 6 / 0 / 3 | "6-team" example. Bye-count semantics (OD 3). |
| 3 | 16 / on / 4 (2·2) / 8 | division-halves | A, B | 2 lead + 2 WC | 0 | 3 | 8 / 0 / 3 | "8-team, 4-div" example. Exact match. |
| 4 | 16 / on / 8 (4·4) / 8 | division-halves | A, B | 4 lead + 0 WC (S=d) | 0 | 3 | 8 / 0 / 3 | "8 div, leader is only way in." |
| 5 | 16 / on / 8 (4·4) / 6 | **conf-halves, S<d** | A, B | top 3 leaders/conf; 1 div/conf misses | 2 → top 2 leaders | 3 | 10 → cut 2 → 8 / 3 | Requires DIFF-1 gate relax + cut. Both unimplemented today. |
| 6 | 10 / off / 2 / 4 | division-halves | Div1, Div2 | 1 lead + 1 WC | 0 | 2 | 6 → cut 2 → 4 / 2 | Cut unimplemented today. |
| 7 | 12 / off / 6 / 6 | division-leaders | none (single) | all 6 leaders, 0 WC (S=d) | 2 → top 2 leaders | 3 | 6 / 0 / 3 | No conferences → no two-sided split; legend shows 6 division swatches, no at-large. |
| 8 | 12 / off / 3 / 8 | division-leaders | none | 3 leaders + 5 WC | 0 | 3 | 4 / 0 / 2 | Odd D can't split; assumes even/conference structure. |
| 9 | 24 / on / 4 (2·2) / 8 | division-halves | A, B | 2 lead + 2 WC | 0 | 3 | 16 → cut 8 → 8 / 3 | **Headline consolation example.** Cut unimplemented today. |
| 10 | 32 / on / 8 (4·4) / 16 | division-halves | A, B | 4 lead + 4 WC | 0 | 4 | 16 / 0 / 4 | Needs 4 playoff weeks; consol depth == champ depth. |
| 11 | 32 / on / 8 (4·4) / 8 | division-halves | A, B | 4 lead + 0 WC (S=d) | 0 | 3 | 24 → cut 16 → 8 / 3 | Half the league eliminated pre-consolation; verify UI communicates 16 cut. |
| 12 | 32 / on / 4 (2·2) / 16 | division-halves | A, B | 2 lead + 6 WC | 0 | 4 | 16 / 0 / 4 | WC ordering = 3rd..8th best of each conf by record. |

**Coverage:** N ∈ {8,10,12,16,24,32}; D ∈ {2,3,4,6,8}; conferences on & off; S>D (2,3,10,12), S=D (4,7,11), S<D (5); byes 0 & 2; consolation off (1), even (3,4,7,10,12), cut 2/8/16 (5,6,9,11).

**Bye sub-assertions:** overall #1 = the division leader with the best record across the field; that seed's conference is Side A. Byes land on **division leaders, not wildcards** (add an explicit assertion — the engine's current `bye = seed ≤ byeCount` is equivalent only when top seeds are top leaders, which holds for scenarios 2 & 5 as drawn but is not guaranteed in general).

---

## 6. Engine vs. preview — exactly what changes

There are **two independent implementations**: the runtime **engine** (`lib/playoffs.ts` + `lib/consolation.ts`, consumed by `SeasonWorkspace`, `ConsolationBracket`, clinch/picture) and the **wizard preview** (`components/builder/LeagueBuilder.tsx` `PlayoffsStep`, which re-derives structure and only calls the engine for the consolation-slot list and placement chart). **Both must be changed for parts 2 and 3; part 4 is preview-only.** Scope decision below is explicit per part.

### 6.1 Part 2 — Seeding / qualification / byes → **ENGINE change required + preview in lockstep**

**Engine (`lib/playoffs.ts`):**

- **DIFF 1 (the important one) — relax the `S < D` gate.** `isPlayoffPlacementUsable("division-halves", …)` requires `fieldSize >= divisionCount` (`:147`); when the field is smaller, `resolvePlayoffPlacementMode` (`:157–166`) falls through to **`"overall"`** (`:301–303`), which reserves nothing — a hot 3rd-place team makes it and a cold division winner is out, the opposite of intent. **Fix:** for `division-halves`, drop the `fieldSize >= divisionCount` constraint; keep `fieldSize % 2 === 0`, `divisionCount % 2 === 0`, and the balanced-conference check (`isConferenceAssignmentBalanced`).
- **DIFF 2 — add explicit `S < d` truncation to `seedHalf`.** The existing branch `[...groupLeaders, ...nonLeaders].slice(0, fieldSize/2)` (`:317`) already reserves leaders-first then wildcards, and `groupLeaders` are pre-sorted by overall record (`:267–270`), so for `S ≥ d` it already matches the target; for `S < d` the slice *would* keep the top-S leaders — but that path is currently unreachable (gated out by DIFF 1). Once DIFF 1 is fixed, `:312–318` is essentially the target; add explicit `S < d` handling per §2.2.
- **DIFF 3 — bye policy when byes-per-half exceed leaders-per-half.** `divisionHalfSeedSlots` (`:246–259`) gives byes to the numerically top seeds, alternating into each half. For small-bye fields (F=6,14) this already puts the bye on each half's top leader. For F=10 (6 byes) and F=12 (4 byes) in D2/D4/D8 halves, byes-per-half exceed the leader count, so byes necessarily fall on wildcards. The code does this silently; make the policy explicit (Open Decision 3): **all leaders get byes first, remaining byes go to the best wildcards by record.**
- **DIFF 4 — state the symmetry assumption.** `:317` hardcodes `fieldSize/2` per half. Fine today because `conferenceDivisionGroups` + `isConferenceAssignmentBalanced` enforce equal division counts and even fieldSize; unequal conferences are unsupported (Open Decision 6).
- **DIFF 6 — round names.** `singleEliminationRoundNames` (`:178–182`, "Conference Championship") keys off `isPlayoffPlacementUsable(... division-halves ...)`, which after DIFF 1 returns true for `S<D` fields. Confirm the "Conference/Divisional Championship" naming still reads correctly when only leaders qualify (no code change expected).
- **Also update `lib/clinchCore.ts:92–96`** (`divisionGroups()` wraps `conferenceDivisionGroups`) so clinch math stays consistent with the relaxed gate.

**Preview (`LeagueBuilder.tsx`) — DIFF 5, in lockstep:** the wizard treats the first `divisions.length` seeds of the *whole field* as protected leaders (`wildStart = divisions.length + 1`, `:1091`; labels `:1088–1102`) and re-implements the half split inline (`:965–972`) with an even `per = ceil(n/2)` split (`:1048`). For conference halves the reserved count is **per half = d**, reserved *within* each half. The preview's global model is only coincidentally correct for balanced `S>D` and breaks for `S<D` (would show wildcard slots that shouldn't exist) and for asymmetric byes. Update `buildSeedBracket`/`previewHalves` to mirror `seedHalf` per side.

**Scope verdict:** real seeding engine **must** change. The preview must change in lockstep (halves are computed twice, §6.4).

### 6.2 Part 3 — Consolation sizing / cut → **ENGINE change required + preview in lockstep**

**Engine (`lib/consolation.ts`):**

- Compute `Rc`/`cap`/`C`/`cut` first (§3.2). `Rc` from `getPlayoffRoundNames(...).length` (existing single source, `:91/:344`) — do **not** re-derive.
- Change `:200–213` to slice `nonPlayoffEntrants` to the first `C` after ordering by seed; hand the tail (`F+C+1..N`) to a new "eliminated" band rather than to `classify` at `:236`.
- Result: `classify` receives only the top `C` entrants; no games are dropped by the round guards (`:106/:139/:158`) because the field is pre-sized to fit `Rc` rounds — the guards become dead-safe backstops rather than the sizing mechanism.
- `projectFinalPlacements` (`:261`) and `projectPlacementChart` (`:339`) already order all `N` teams and already model a tail range (`:362`, source `"Outside the bracket"`), so final-placement output is largely consistent. `projectFinalPlacements` derives events only from consolation games that exist (`:306–312`); with cut teams there are simply no events for `F+C+1..N` — the desired "projected, unresolved, eliminated" state.
- `isDivisionHalvesConsolationUsable` (`:71–78`, requires exactly 4 non-playoff teams) never overflows `cap`, so no cut ever applies there — no change.

**Preview (`LeagueBuilder.tsx`) — in lockstep:** the wizard draws consolation via its own `buildPool("consolation")` (`:988,:1114`) which seed-orders missed teams `n+1…total` and splits leftovers below `per`; the slot list comes from the engine `projectConsolationBracket` (`:922`). The preview must apply the same `cap`/`C`/`cut` boundary and render the three tiers (§3.4), including the collapsed eliminated band.

**Scope verdict:** engine **must** change; preview must change in lockstep (consolation is drawn twice, §6.4).

### 6.3 Part 4 — Legend → **PREVIEW-ONLY change**

Pure `LeagueBuilder.tsx` + `globals.css` addition (§4). No engine change. Uses flags already in scope. **Scope verdict:** wizard preview only.

### 6.4 Standing divergence risks (change both places)

| Concern | Engine | Preview | Must edit both? |
|---|---|---|---|
| Half definition | `conferenceDivisionGroups` (`playoffs.ts:311`) | inline `conferencesActive`/`halfIdentities`/`halfDivisionIds` (`LB:965–972`) | **Yes** — duplicated, not shared |
| Seed→side slotting | `divisionHalfSeedSlots` (`:246`) | inline permutation + `per = ceil(n/2)` (`LB:1003–1013,1048`) | **Yes** — different algorithms |
| Leader reservation | `[...leaders, ...nonLeaders].slice` (`:306,317`) | structural labels, first `divisions.length` seeds (`LB:1088–1102`) | **Yes** — global vs per-half |
| Consolation bracket | `projectConsolationBracket` (clamped) | `buildPool("consolation")` (`LB:988,1114`) | **Yes** — drawn twice |
| Round names | `getPlayoffRoundNames` | shared source + hardcoded fallbacks (`LB:1066,1071`) | Shared; verify fallbacks |
| Placement resolution | `resolvePlayoffPlacementMode` (halves→leaders→overall) | `previewHalves` boolean (`LB:973`) + mount effect (`:882–888`) | Verify edge parity |

**Recommendation:** as part of this work, extract the half-split and per-half seeding into shared helpers consumed by both the engine and the preview, to eliminate the duplicated-logic divergence risk. (Optional but strongly advised; not required for correctness if both sites are edited identically.)

**Adjacent / out of scope:** the consolation depth-cut is the mechanism in §5.2 above; it does **not** change championship-field qualification beyond §2. The `auto` placement mode is legacy — `normalizePlayoffSettings` still accepts it (`:104`), resolved away on wizard mount and in Quick Create; all three sites agree on halves→leaders→overall precedence.

---

## 7. Open decisions for the commissioner

Each has a recommended default; where the rules are silent, behavior is deferred here rather than invented.

1. **"6-team" vs literal "16-team" field (scenario 2).** The 6-team reading (2 conf × 3 spots = 2 leaders + 1 wildcard, top leader gets the bye) reproduces exactly with D=4, F=6. A literal 16-team field would not match "3 spots per conference." **Recommended default: 6-team.** Confirm.

2. **`S < D` — which division winners get cut, and is exclusion acceptable?** Target keeps the **top-S division leaders by overall record**; the lowest-record division winners miss the playoffs entirely (e.g. D8/F6: one division champ per conference is out). Commissioner said "some divisions miss out," which supports this. **Recommended default: cut by overall record; a division winner can be fully excluded; tie-break by overall standings order (`standingsPosition`).** Confirm.

3. **Byes when byes-per-half exceed leaders-per-half (F=10, F=12, D2 halves).** The "bye → top division leader" rule cleanly covers only byes ≤ leaders. **Recommended default: all leaders get byes first, remaining byes go to the best wildcards by record** (matches current slot logic). Alternatives: cap byes at leader count, or forbid field sizes that force wildcard byes. Confirm.

4. **"Better-record leader gets the bye" — singular vs per-conference.** In every bye-bearing even field the bye count is ≥ 2. **Recommended default: one bye per conference, each to that conference's top leader (overall #1 = better conference's leader on side A)** — not "only the single best leader league-wide." Confirm.

5. **Wildcard pool boundary.** A wildcard is eligible only for its own conference's spare spots, never floated across conferences even with a better record than the other conference's wildcard (NFL-style isolation). **Recommended default: yes, isolate per conference** even when it seats a weaker team over a stronger one in the other half. Confirm.

6. **Even fields / balanced conferences only.** Target assumes `fieldSize` even and equal divisions per conference. **Recommended default: odd field sizes and unequal conference splits remain disallowed for conference-halves** (fall back to another mode) rather than adding an asymmetric-spots algorithm. Confirm. (Covers scenario 8's odd D=3 and 3+-conference cases — both currently undefined.)

7. **Resolver precedence after relaxing the `S<D` gate.** **Recommended default: halves → leaders → overall stays intact**, i.e. a conference setup with `S<D` resolves to **conference-halves (leaders-only)**, not to unified `division-leaders` (which ignores conference boundaries for byes). Confirm.

8. **Wildcard color has no bracket referent yet.** The neutral `#586761` wildcard marker is currently explanatory; the bracket still tints at-large slots by division color. **Recommended follow-up (out of this scope): render at-large slots neutral or add a "WC" tag** so the legend swatch points at something on the tree. Confirm whether to include now.

9. **Consolation: awkward `C` sizes.** `cap = 2^Rc` is a power of two, but `C = min(nonPlayoff, cap)` equals a clean size only when `nonPlayoff ≥ cap`. For `C ∈ {5,7,9–15}` the current `classify` produces a shallow single "Placement Pool" round (partial ranking), not a full tree. **Recommended default: accept the partial-ranking pool for odd `C`** (commissioner's examples all land on clean 8/6/4). Alternative: additionally cut down to the nearest fully-rankable size (power of two, or 6) so every consolation team gets an exact place. Confirm.

10. **Consolation cut under division-halves seeding.** "Lowest **overall** seeds" cut strictly by record can leave the two halves unbalanced (e.g. 5 vs 3), which a symmetric bracket can't draw. **Recommended default: cut purely by overall record** and let the consolation bracket size to the resulting count. Alternative: cut to keep halves equal. Confirm.

11. **Single-elimination interaction.** In `single-elimination` mode, losers of each championship round also feed placement (`consolation.ts:186–197`), consuming consolation slots alongside the non-playoff pool. The `cap = 2^Rc` math is derived for the standalone non-playoff bracket. **Recommended default: apply the cut only to the non-playoff pool** (championship-loser placement is inherently ≤ Rc and needs no separate accounting). Confirm.

12. **Ordering of cut teams.** **Recommended default: display cut teams in regular-season seed order, no games, `place` range `F+C+1..N`** (not an unordered group). Confirm.

13. **Conference name tint in legend.** Default tints the conference name with its own brand color (`accessibleAccentColor`). **Alternative: echo the green/blue side-A/side-B half-accent pair** (`#3fbf7f` / `#6ea2ff`) and add a matching `border-left` per cluster. Confirm which cue is intended.

14. **`.ppw-preview-head` gains `flex-wrap`/`align-items:flex-start`.** Minor change to a shared class; verify it doesn't shift the lone-eyebrow case (it won't — a single child stays top-left). Noted for awareness.

15. **Legend "some divisions miss out" copy under `S < D`.** The `hasWildcards = fieldSize > divisionCount` heuristic correctly shows/hides the wildcard row but does not encode the per-conference `S < D` "some divisions miss out" case. **Recommended: add a copy line** to the legend when `S < D` per conference. Confirm whether to build now (flag, not built in this spec).