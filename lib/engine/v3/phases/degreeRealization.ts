import { SeededRng } from "../rng";
import { TeamId } from "../domain/types";

export interface RealizedEdge {
  a: TeamId;
  b: TeamId;
  count: number;
}

function key(a: TeamId, b: TeamId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Realizes a target degree sequence as a (multi)graph. Optionally forbids edges
// between teams in the same group (cross-division). Prefers distinct opponents
// (variety) before allowing repeats. Havel–Hakimi-style: always extend from the
// highest-remaining-degree team. Returns null if the sequence is unrealizable
// under the constraints (caller retries with a new seed or surfaces failure).
export function realizeDegreeGraph(params: {
  teamIds: TeamId[];
  degree: Map<TeamId, number>;
  groupOf?: Map<TeamId, string>; // required iff forbidSameGroup
  forbidSameGroup: boolean;
  rng: SeededRng;
}): RealizedEdge[] | null {
  const { teamIds, forbidSameGroup, groupOf, rng } = params;
  const remaining = new Map<TeamId, number>();
  for (const t of teamIds) remaining.set(t, params.degree.get(t) ?? 0);
  const pairCount = new Map<string, number>();

  const groupKey = (t: TeamId) => (groupOf ? groupOf.get(t) ?? "" : "");

  const allowed = (a: TeamId, b: TeamId) =>
    a !== b && (!forbidSameGroup || groupKey(a) !== groupKey(b));

  // Safety bound on iterations.
  let guard = 0;
  const maxGuard = teamIds.reduce((s, t) => s + (params.degree.get(t) ?? 0), 0) + teamIds.length + 10;

  for (;;) {
    guard += 1;
    if (guard > maxGuard * 4) return null;

    const active = teamIds.filter((t) => (remaining.get(t) ?? 0) > 0);
    if (active.length === 0) break;

    // highest remaining degree; random tiebreak for determinism+variety
    const shuffled = rng.shuffle(active);
    shuffled.sort((x, y) => (remaining.get(y) ?? 0) - (remaining.get(x) ?? 0));
    const t = shuffled[0];
    const need = remaining.get(t) ?? 0;

    // candidate partners
    let candidates = active.filter((p) => p !== t && allowed(t, p) && (remaining.get(p) ?? 0) > 0);
    if (candidates.length === 0) return null;

    // order: prefer never-paired (variety), then highest remaining degree
    candidates = rng.shuffle(candidates);
    candidates.sort((x, y) => {
      const px = pairCount.get(key(t, x)) ?? 0;
      const py = pairCount.get(key(t, y)) ?? 0;
      if (px !== py) return px - py;
      return (remaining.get(y) ?? 0) - (remaining.get(x) ?? 0);
    });

    let assigned = 0;
    for (const p of candidates) {
      if (assigned >= need) break;
      if ((remaining.get(p) ?? 0) <= 0) continue;
      const k = key(t, p);
      pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
      remaining.set(t, (remaining.get(t) ?? 0) - 1);
      remaining.set(p, (remaining.get(p) ?? 0) - 1);
      assigned += 1;
    }

    // if still short, allow repeats over candidates that still have remaining
    while (assigned < need) {
      const repeatPool = active.filter(
        (p) => p !== t && allowed(t, p) && (remaining.get(p) ?? 0) > 0,
      );
      if (repeatPool.length === 0) return null;
      repeatPool.sort((x, y) => {
        const px = pairCount.get(key(t, x)) ?? 0;
        const py = pairCount.get(key(t, y)) ?? 0;
        if (px !== py) return px - py;
        return (remaining.get(y) ?? 0) - (remaining.get(x) ?? 0);
      });
      const p = repeatPool[0];
      const k = key(t, p);
      pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
      remaining.set(t, (remaining.get(t) ?? 0) - 1);
      remaining.set(p, (remaining.get(p) ?? 0) - 1);
      assigned += 1;
    }
  }

  const edges: RealizedEdge[] = [];
  for (const [k, count] of pairCount) {
    const [a, b] = k.split("|");
    edges.push({ a, b, count });
  }
  return edges;
}
