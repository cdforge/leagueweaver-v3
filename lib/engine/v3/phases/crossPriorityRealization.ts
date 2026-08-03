import { SeededRng } from "../rng";
import { EngineTeam, TeamId } from "../domain/types";
import type { RealizedEdge } from "./degreeRealization";
import { realizeCrossDivisionGraph } from "./crossRealization";
import {
  analyzeCrossDivisionPriority,
  toCrossDivisionPairKey,
} from "../../crossDivisionPriority";

/**
 * Priority-aware cross-division degree realizer (for uneven divisions).
 *
 * The strict same-seed cross-priority allocator (`solveCrossDivisionPairCounts`)
 * corner-paints on odd-size divisions and leaves games unmatched, which forced
 * `inventory.ts` to fall back to `realizeCrossDivisionGraph` — a guaranteed
 * realizer that *drops the priority order wholesale*. But the priority order is
 * usually NOT mathematically unsatisfiable for uneven shapes: e.g. a 4-3-3
 * fantasy league HAS a fully priority-compliant cross inventory, the greedy
 * allocator just can't find it.
 *
 * This realizer keeps the priority order whenever it is achievable. It starts
 * from the guaranteed transportation realization (correct degrees, cross-only)
 * and runs a deterministic, degree-preserving local search that drives the
 * schedule toward the same-seed priority order measured by
 * `analyzeCrossDivisionPriority`:
 *
 *   tier 1  same-seed unique   — play every same-seed cross opponent once
 *   tier 2  other unique       — cover every cross opponent before any repeat
 *   tier 3  same-seed repeat    — repeat same-seed opponents before other repeats
 *   tier 4  other repeat        — free
 *
 * The only move is a 2-edge rotation ((a,b)+(c,d) → (a,d)+(c,b)), which keeps
 * every team's cross degree exactly fixed, so the result is always a valid
 * realization of the same degree sequence. The search accepts a move only if it
 * does not increase the priority-violation cost, and stops the instant the
 * assignment is fully compliant.
 *
 * Returns the realized edges plus whether they are priority-compliant. When full
 * compliance is unreachable it returns the best-effort assignment found (which is
 * no worse, and usually better, than the raw transportation realization) so the
 * caller still gets a valid schedule. Returns null only when the degree sequence
 * itself is not realizable (a genuine infeasibility surfaced by the base
 * realizer).
 */
export function realizePriorityCrossDivisionGraph(
  teams: EngineTeam[],
  degree: Map<TeamId, number>,
  rng: SeededRng,
  divisionOrder?: Map<string, number>,
  opts: { restarts?: number; iters?: number } = {},
): { edges: RealizedEdge[]; compliant: boolean } | null {
  const restarts = opts.restarts ?? 6;
  const iters = opts.iters ?? 4000;
  const meta = buildTeamMeta(teams);

  let best: { pairCounts: Map<string, number>; cost: number } | null = null;

  for (let r = 0; r < restarts; r += 1) {
    const edges = realizeCrossDivisionGraph(teams, degree, rng.fork(`cp-init${r}`), divisionOrder);
    if (!edges) return null;

    const pairCounts = edgesToPairCounts(edges);
    const adj = buildAdjacency(teams, pairCounts);
    let cost = totalCost(teams, adj, meta);
    const search = rng.fork(`cp-search${r}`);

    for (let it = 0; it < iters && cost > 0; it += 1) {
      const e1 = pickRandomEdge(teams, adj, search);
      const e2 = pickRandomEdge(teams, adj, search);
      if (!e1 || !e2) break;
      const [a, b] = e1;
      const [c, d] = e2;
      if (new Set([a, b, c, d]).size !== 4) continue;

      // Two rotation orientations; pick one. The kept endpoints of each edge must
      // land in different divisions (stay cross) — original edges are cross, so
      // this just re-pairs the four teams across the two division sides.
      let n1a: string, n1b: string, n2a: string, n2b: string;
      if (search.bool()) {
        n1a = a; n1b = d; n2a = c; n2b = b;
      } else {
        n1a = a; n1b = c; n2a = b; n2b = d;
      }
      if (meta.divisionOf.get(n1a) === meta.divisionOf.get(n1b)) continue;
      if (meta.divisionOf.get(n2a) === meta.divisionOf.get(n2b)) continue;

      const affected = [a, b, c, d];
      const before = affected.reduce((s, t) => s + teamCost(t, adj, meta), 0);

      applyDelta(pairCounts, adj, a, b, -1);
      applyDelta(pairCounts, adj, c, d, -1);
      applyDelta(pairCounts, adj, n1a, n1b, +1);
      applyDelta(pairCounts, adj, n2a, n2b, +1);

      const after = affected.reduce((s, t) => s + teamCost(t, adj, meta), 0);
      const delta = after - before;
      if (delta <= 0) {
        cost += delta;
      } else {
        applyDelta(pairCounts, adj, n1a, n1b, -1);
        applyDelta(pairCounts, adj, n2a, n2b, -1);
        applyDelta(pairCounts, adj, a, b, +1);
        applyDelta(pairCounts, adj, c, d, +1);
      }
    }

    if (!best || cost < best.cost) best = { pairCounts: new Map(pairCounts), cost };
    if (cost === 0) break;
  }

  if (!best) return null;
  const compliant = analyzeCrossDivisionPriority(teams, best.pairCounts).isPriorityCompliant;
  const edges: RealizedEdge[] = [];
  for (const [key, count] of best.pairCounts) {
    if (count <= 0) continue;
    const [a, b] = key.split("::");
    edges.push({ a, b, count });
  }
  return { edges, compliant };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

interface TeamMeta {
  divisionOf: Map<TeamId, string>;
  crossOpponents: Map<TeamId, TeamId[]>;
  sameSeedOpponents: Map<TeamId, Set<TeamId>>;
  sameConferenceSameSeedOpponents: Map<TeamId, Set<TeamId>>;
}

function buildTeamMeta(teams: EngineTeam[]): TeamMeta {
  const divisionOf = new Map<TeamId, string>();
  for (const t of teams) if (t.divisionId) divisionOf.set(t.id, t.divisionId);
  const crossOpponents = new Map<TeamId, TeamId[]>();
  const sameSeedOpponents = new Map<TeamId, Set<TeamId>>();
  const sameConferenceSameSeedOpponents = new Map<TeamId, Set<TeamId>>();
  for (const t of teams) {
    const opps: TeamId[] = [];
    const same = new Set<TeamId>();
    const sameConferenceSame = new Set<TeamId>();
    if (t.divisionId) {
      for (const u of teams) {
        if (u.id === t.id || !u.divisionId || u.divisionId === t.divisionId) continue;
        opps.push(u.id);
        if (u.divisionSeed === t.divisionSeed) {
          same.add(u.id);
          if (t.conferenceId && u.conferenceId && t.conferenceId === u.conferenceId) {
            sameConferenceSame.add(u.id);
          }
        }
      }
    }
    crossOpponents.set(t.id, opps);
    sameSeedOpponents.set(t.id, same);
    sameConferenceSameSeedOpponents.set(t.id, sameConferenceSame);
  }
  return { divisionOf, crossOpponents, sameSeedOpponents, sameConferenceSameSeedOpponents };
}

function edgesToPairCounts(edges: RealizedEdge[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of edges) {
    if (e.count <= 0) continue;
    const k = toCrossDivisionPairKey(e.a, e.b);
    m.set(k, (m.get(k) ?? 0) + e.count);
  }
  return m;
}

function buildAdjacency(teams: EngineTeam[], pairCounts: Map<string, number>) {
  const adj = new Map<TeamId, Map<TeamId, number>>();
  for (const t of teams) adj.set(t.id, new Map());
  for (const [k, count] of pairCounts) {
    if (count <= 0) continue;
    const [x, y] = k.split("::");
    adj.get(x)?.set(y, count);
    adj.get(y)?.set(x, count);
  }
  return adj;
}

function applyDelta(
  pairCounts: Map<string, number>,
  adj: Map<TeamId, Map<TeamId, number>>,
  x: TeamId,
  y: TeamId,
  delta: number,
) {
  const key = toCrossDivisionPairKey(x, y);
  const nc = (pairCounts.get(key) ?? 0) + delta;
  if (nc <= 0) pairCounts.delete(key);
  else pairCounts.set(key, nc);
  const ax = adj.get(x)!;
  const ay = adj.get(y)!;
  const cx = (ax.get(y) ?? 0) + delta;
  if (cx <= 0) ax.delete(y);
  else ax.set(y, cx);
  const cy = (ay.get(x) ?? 0) + delta;
  if (cy <= 0) ay.delete(x);
  else ay.set(x, cy);
}

function pickRandomEdge(
  teams: EngineTeam[],
  adj: Map<TeamId, Map<TeamId, number>>,
  rng: SeededRng,
): [TeamId, TeamId] | null {
  for (let tries = 0; tries < 8; tries += 1) {
    const t = teams[rng.int(0, teams.length - 1)].id;
    const opps = adj.get(t);
    if (!opps || opps.size === 0) continue;
    const keys = [...opps.keys()];
    return [t, keys[rng.int(0, keys.length - 1)]];
  }
  return null;
}

// Per-team priority-violation cost. Zero for every team ⟺ the assignment is
// priority-compliant per analyzeCrossDivisionPriority (this is a strictly
// tighter surrogate that gives the local search a gradient to descend).
function teamCost(teamId: TeamId, adj: Map<TeamId, Map<TeamId, number>>, meta: TeamMeta): number {
  const counts = adj.get(teamId)!;
  const opponents = meta.crossOpponents.get(teamId)!;
  const sameSeed = meta.sameSeedOpponents.get(teamId)!;
  const sameConferenceSameSeed = meta.sameConferenceSameSeedOpponents.get(teamId)!;
  let missingSameConferenceSameSeed = 0;
  let missingSameSeed = 0;
  let unplayed = 0;
  let hasRepeat = false;
  let otherRepeats = 0;
  let sameSeedAtOne = 0;
  for (const o of opponents) {
    const c = counts.get(o) ?? 0;
    const isSameSeed = sameSeed.has(o);
    if (c === 0) {
      unplayed += 1;
      if (isSameSeed) missingSameSeed += 1;
      if (sameConferenceSameSeed.has(o)) missingSameConferenceSameSeed += 1;
    } else if (c >= 2) {
      hasRepeat = true;
      if (!isSameSeed) otherRepeats += 1;
    }
    if (isSameSeed && c === 1) sameSeedAtOne += 1;
  }
  let cost = 0;
  cost += 200 * missingSameConferenceSameSeed; // tier 1a: cover in-conference same-seed opponents first
  cost += 100 * missingSameSeed; // tier 1b: then cover every same-seed opponent
  if (hasRepeat) cost += 10 * unplayed; // tier 2: cover before repeating
  if (otherRepeats > 0) cost += sameSeedAtOne; // tier 3: same-seed repeat first
  return cost;
}

function totalCost(teams: EngineTeam[], adj: Map<TeamId, Map<TeamId, number>>, meta: TeamMeta): number {
  let c = 0;
  for (const t of teams) c += teamCost(t.id, adj, meta);
  return c;
}
