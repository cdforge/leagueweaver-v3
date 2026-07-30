import { EngineInput, EngineSchedule, TeamId } from "../domain/types";
import { SINGLE_LEAGUE_KEY } from "../domain/groups";

// Total games (degree) per team across the placed schedule.
export function degreeByTeam(schedule: EngineSchedule): Map<TeamId, number> {
  const deg = new Map<TeamId, number>();
  for (const week of schedule.weeks) {
    for (const g of week.games) {
      deg.set(g.a, (deg.get(g.a) ?? 0) + 1);
      deg.set(g.b, (deg.get(g.b) ?? 0) + 1);
    }
  }
  return deg;
}

// §5 allocation: decide which odd-game-count teams receive the +1 home game.
// Even-G teams have a fixed home count and are never awarded. Returns the set of
// awarded team ids. See docs/V3_ENGINE_SPEC.md §5 for the authoritative rules.
export function allocateExtraHomes(
  input: EngineInput,
  degree: Map<TeamId, number>,
): Set<TeamId> {
  const awarded = new Set<TeamId>();
  const oddTeams = input.teams.filter((t) => (degree.get(t.id) ?? 0) % 2 === 1);
  if (oddTeams.length === 0) return awarded;

  const K = oddTeams.length / 2; // guaranteed integer (handshake parity)

  // group eligible (odd-G) teams by division, sorted best-divisionSeed first
  const byDiv = new Map<string, typeof oddTeams>();
  for (const t of oddTeams) {
    const key = t.divisionId ?? SINGLE_LEAGUE_KEY;
    const list = byDiv.get(key);
    if (list) list.push(t);
    else byDiv.set(key, [t]);
  }
  for (const list of byDiv.values()) {
    list.sort((a, b) => a.divisionSeed - b.divisionSeed || (a.id < b.id ? -1 : 1));
  }

  const extraCount = new Map<string, number>();
  const pointer = new Map<string, number>(); // next un-awarded index per division
  let baseTotal = 0;
  for (const [key, list] of byDiv) {
    const base = Math.floor(list.length / 2);
    for (let i = 0; i < base; i += 1) awarded.add(list[i].id);
    extraCount.set(key, base);
    pointer.set(key, base);
    baseTotal += base;
  }

  let remaining = K - baseTotal;
  while (remaining > 0) {
    // divisions that still have an un-awarded eligible team
    const eligible = [...byDiv.keys()].filter(
      (key) => pointer.get(key)! < byDiv.get(key)!.length,
    );
    if (eligible.length === 0) break; // shouldn't happen given K ≤ oddTeams
    const min = Math.min(...eligible.map((key) => extraCount.get(key)!));
    const atMin = eligible.filter((key) => extraCount.get(key)! === min);
    // tie-break: division whose next-best team has the better (lowest) overallSeed
    atMin.sort((x, y) => {
      const tx = byDiv.get(x)![pointer.get(x)!];
      const ty = byDiv.get(y)![pointer.get(y)!];
      return tx.overallSeed - ty.overallSeed || (tx.id < ty.id ? -1 : 1);
    });
    const chosen = atMin[0];
    const team = byDiv.get(chosen)![pointer.get(chosen)!];
    awarded.add(team.id);
    extraCount.set(chosen, extraCount.get(chosen)! + 1);
    pointer.set(chosen, pointer.get(chosen)! + 1);
    remaining -= 1;
  }

  return awarded;
}

// Target home-game count per team given the §5 allocation.
export function computeTargetHomeCounts(
  input: EngineInput,
  degree: Map<TeamId, number>,
): Map<TeamId, number> {
  const awarded = allocateExtraHomes(input, degree);
  const target = new Map<TeamId, number>();
  for (const t of input.teams) {
    const d = degree.get(t.id) ?? 0;
    if (d % 2 === 0) target.set(t.id, d / 2);
    else target.set(t.id, awarded.has(t.id) ? (d + 1) / 2 : (d - 1) / 2);
  }
  return target;
}

// ---- degree-constrained orientation via max-flow ----
// Each game (edge) must send one unit (the home assignment) to one of its two
// endpoints; each team t absorbs exactly targetHome[t] units. A saturating flow
// (value == #games) yields an orientation realizing every target exactly.

interface FlowEdge {
  to: number;
  cap: number;
  flow: number;
  rev: number; // index of reverse edge in graph[to]
}

class MaxFlow {
  graph: FlowEdge[][];
  constructor(n: number) {
    this.graph = Array.from({ length: n }, () => []);
  }
  addEdge(u: number, v: number, cap: number) {
    this.graph[u].push({ to: v, cap, flow: 0, rev: this.graph[v].length });
    this.graph[v].push({ to: u, cap: 0, flow: 0, rev: this.graph[u].length - 1 });
  }
  // Edmonds-Karp BFS augmenting (small graphs; correctness over speed)
  maxflow(s: number, t: number): number {
    let total = 0;
    for (;;) {
      const parentNode = new Array<number>(this.graph.length).fill(-1);
      const parentEdge = new Array<number>(this.graph.length).fill(-1);
      parentNode[s] = s;
      const queue = [s];
      while (queue.length > 0) {
        const u = queue.shift()!;
        this.graph[u].forEach((e, idx) => {
          if (parentNode[e.to] === -1 && e.cap - e.flow > 0) {
            parentNode[e.to] = u;
            parentEdge[e.to] = idx;
            queue.push(e.to);
          }
        });
        if (parentNode[t] !== -1) break;
      }
      if (parentNode[t] === -1) break;
      // augment by 1 (all caps are 1 along the relevant paths)
      let v = t;
      let bottleneck = Infinity;
      while (v !== s) {
        const u = parentNode[v];
        const e = this.graph[u][parentEdge[v]];
        bottleneck = Math.min(bottleneck, e.cap - e.flow);
        v = u;
      }
      v = t;
      while (v !== s) {
        const u = parentNode[v];
        const e = this.graph[u][parentEdge[v]];
        e.flow += bottleneck;
        this.graph[e.to][e.rev].flow -= bottleneck;
        v = u;
      }
      total += bottleneck;
    }
    return total;
  }
}

function pairKey(a: TeamId, b: TeamId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Assign homeTeamId/awayTeamId on every game so that BOTH invariants hold:
//   (1) per-team season home total == targetHome[t] (the §5 allocation), and
//   (2) per-pairing balance — a pair meeting n times splits home floor(n/2) /
//       ceil(n/2), so it is never all-home for one side (e.g. a 3-game series is
//       2-1 or 1-2, never 3-0).
//
// Decomposition: within each pairing, pre-assign the even portion balanced
// (floor(n/2) home to each side); this alone realizes invariant (2). What is left
// is exactly ONE undecided "swing" game per ODD-count pairing (count-1 pairs are
// pure swing) — flipping a swing moves the pair's extra home from one side to the
// other while keeping it floor/ceil. Only the swing games carry orientation
// freedom, so the per-team targets are hit by a degree-constrained max-flow over
// the swing games alone (each team must win targetHome[t] − preAssignedHome[t] of
// its swings). Because degree = 2·Σfloor + (#odd pairs), that residual is always a
// valid count in [0, #odd-pairs-incident]; a non-saturating flow means this
// placement's swing graph can't realize the §5 split, so we return false and the
// caller retries with a fresh placement — same contract as before.
//
// Mutates the schedule's games in place. Returns false if no balanced orientation
// realizes the targets.
export function orientSchedule(
  schedule: EngineSchedule,
  targetHome: Map<TeamId, number>,
): boolean {
  interface GameRef {
    a: TeamId;
    b: TeamId;
    set: (home: TeamId, away: TeamId) => void;
  }
  const games: GameRef[] = [];
  const byPair = new Map<string, number[]>(); // pairKey -> game indices (week order)
  for (const week of schedule.weeks) {
    for (const g of week.games) {
      const idx = games.length;
      games.push({
        a: g.a,
        b: g.b,
        set: (home, away) => {
          g.homeTeamId = home;
          g.awayTeamId = away;
        },
      });
      const key = pairKey(g.a, g.b);
      const list = byPair.get(key);
      if (list) list.push(idx);
      else byPair.set(key, [idx]);
    }
  }

  const preHome = new Map<TeamId, number>();
  for (const id of targetHome.keys()) preHome.set(id, 0);
  const bump = (id: TeamId, n = 1) => preHome.set(id, (preHome.get(id) ?? 0) + n);

  // Pre-assign the balanced (even) portion of every pairing; collect the leftover
  // swing game index (one per odd-count pairing) for the flow.
  const swingIdx: number[] = [];
  const assignHome = new Array<TeamId | null>(games.length).fill(null);
  for (const indices of byPair.values()) {
    const first = games[indices[0]];
    const lo = first.a < first.b ? first.a : first.b;
    const hi = first.a < first.b ? first.b : first.a;
    const base = Math.floor(indices.length / 2);
    for (let i = 0; i < base; i += 1) assignHome[indices[i]] = lo;
    for (let i = base; i < 2 * base; i += 1) assignHome[indices[i]] = hi;
    bump(lo, base);
    bump(hi, base);
    if (indices.length % 2 === 1) swingIdx.push(indices[2 * base]);
  }

  // Residual swing target per team; must be a non-negative integer.
  const teamIds = [...targetHome.keys()];
  const teamIndex = new Map<TeamId, number>();
  teamIds.forEach((id, i) => teamIndex.set(id, i));
  const swingTarget = new Map<TeamId, number>();
  for (const id of teamIds) {
    const residual = (targetHome.get(id) ?? 0) - (preHome.get(id) ?? 0);
    if (residual < 0) return false; // §5 split unrealizable under balance here
    swingTarget.set(id, residual);
  }

  // Degree-constrained max-flow over swing games only.
  const K = swingIdx.length;
  const N = teamIds.length;
  const S = 0;
  const edgeBase = 1; // swing-edge nodes: edgeBase .. edgeBase+K-1
  const teamBase = edgeBase + K;
  const T = teamBase + N;
  const flow = new MaxFlow(T + 1);

  swingIdx.forEach((gi, i) => {
    const g = games[gi];
    const eNode = edgeBase + i;
    flow.addEdge(S, eNode, 1);
    flow.addEdge(eNode, teamBase + teamIndex.get(g.a)!, 1);
    flow.addEdge(eNode, teamBase + teamIndex.get(g.b)!, 1);
  });
  teamIds.forEach((id, i) => {
    flow.addEdge(teamBase + i, T, swingTarget.get(id) ?? 0);
  });

  if (flow.maxflow(S, T) !== K) return false;

  // Read swing orientation: the team-edge carrying flow is HOME.
  swingIdx.forEach((gi, i) => {
    const g = games[gi];
    const eNode = edgeBase + i;
    let home: TeamId | null = null;
    for (const fe of flow.graph[eNode]) {
      if (fe.to >= teamBase && fe.to < T && fe.flow > 0) {
        home = teamIds[fe.to - teamBase];
        break;
      }
    }
    assignHome[gi] = home ?? g.a; // defensive; saturating flow guarantees one
  });

  // Commit every game (pre-assigned + swing).
  games.forEach((g, i) => {
    const home = assignHome[i] ?? g.a;
    const away = home === g.a ? g.b : g.a;
    g.set(home, away);
  });

  return true;
}
