import { SeededRng } from "../rng";
import { EngineTeam, TeamId } from "../domain/types";
import type { RealizedEdge } from "./degreeRealization";

/**
 * Guaranteed cross-division degree realizer.
 *
 * The greedy priority allocator (solveCrossDivisionPairCounts) and the general
 * Havel–Hakimi realizer both corner-paint on odd-size divisions (e.g. a 4-3-3
 * fantasy league): the cross multigraph provably exists, but neither can build
 * it. This constructs it deterministically via three transportation stages that
 * are each individually always feasible when the input is realizable:
 *
 *   1. Division-level multigraph — realize the per-division cross totals as a
 *      multigraph on the (few) divisions (classic "connect the two highest
 *      remaining" construction). Fails only if a division needs more cross games
 *      than all others combined can supply — a genuine infeasibility.
 *   2. Team → other-division split — a balanced transportation per division:
 *      rows = team cross degrees, columns = the div-pair totals from stage 1.
 *   3. Team ↔ team fill per division pair — a balanced bipartite transportation.
 *
 * Trades away the same-seed cross-priority ordering (which is what's
 * unsatisfiable for uneven divisions) for a schedule that actually exists.
 */
export function realizeCrossDivisionGraph(
  teams: EngineTeam[],
  degree: Map<TeamId, number>,
  rng: SeededRng,
  divisionOrder?: Map<string, number>,
): RealizedEdge[] | null {
  // Group teams (with a positive cross degree contributes to totals; all teams
  // in a division are candidates).
  const divTeams = new Map<string, TeamId[]>();
  for (const team of teams) {
    if (!team.divisionId) continue;
    const list = divTeams.get(team.divisionId) ?? [];
    list.push(team.id);
    divTeams.set(team.divisionId, list);
  }
  const divIds = [...divTeams.keys()].sort((a, b) => {
    const oa = divisionOrder?.get(a) ?? 0;
    const ob = divisionOrder?.get(b) ?? 0;
    return oa !== ob ? oa - ob : a.localeCompare(b);
  });
  if (divIds.length < 2) {
    // No cross games possible; only valid if every degree is zero.
    return [...degree.values()].some((d) => d > 0) ? null : [];
  }

  const deg = (id: TeamId) => Math.max(0, degree.get(id) ?? 0);
  const divTotal = new Map<string, number>();
  for (const d of divIds) divTotal.set(d, (divTeams.get(d) ?? []).reduce((s, id) => s + deg(id), 0));

  const grandTotal = [...divTotal.values()].reduce((s, v) => s + v, 0);
  if (grandTotal === 0) return [];
  if (grandTotal % 2 !== 0) return null;

  // Stage 1 — division-level multigraph: pairTotal[i][j] cross games between
  // divisions i and j.
  const idx = new Map(divIds.map((d, i) => [d, i]));
  const rem = divIds.map((d) => divTotal.get(d) ?? 0);
  const pairTotal: number[][] = divIds.map(() => divIds.map(() => 0));
  let guard = grandTotal + divIds.length + 10;
  while (rem.some((r) => r > 0)) {
    if (guard-- <= 0) return null;
    // two divisions with the highest remaining totals
    const order = rem.map((r, i) => [r, i] as [number, number]).sort((x, y) => y[0] - x[0]);
    const [ra, ia] = order[0];
    const [rb, ib] = order[1];
    if (ra <= 0) break;
    if (rb <= 0) return null; // a division needs games but no partner has capacity
    pairTotal[ia][ib] += 1;
    pairTotal[ib][ia] += 1;
    rem[ia] -= 1;
    rem[ib] -= 1;
  }

  // Balanced transportation: given row sums and column sums with equal totals,
  // return a non-negative matrix with those margins, spread as evenly as
  // possible (repeatedly add to the (row,col) with the most remaining need).
  const transport = (rowSums: number[], colSums: number[]): number[][] => {
    const rows = rowSums.length;
    const cols = colSums.length;
    const m = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const r = [...rowSums];
    const c = [...colSums];
    let total = r.reduce((s, v) => s + v, 0);
    while (total > 0) {
      let bi = -1;
      let bMax = 0;
      for (let i = 0; i < rows; i += 1) if (r[i] > bMax) { bMax = r[i]; bi = i; }
      if (bi < 0) break;
      let bj = -1;
      let cMax = 0;
      for (let j = 0; j < cols; j += 1) if (c[j] > cMax) { cMax = c[j]; bj = j; }
      if (bj < 0) break;
      m[bi][bj] += 1;
      r[bi] -= 1;
      c[bj] -= 1;
      total -= 1;
    }
    return m;
  };

  // Stage 2 — for each division, split each team's cross degree across the other
  // divisions to match stage-1 pair totals.
  //   crossTo[teamId] = Map<otherDivId, count>
  const crossTo = new Map<TeamId, Map<string, number>>();
  for (const d of divIds) {
    const members = rng.shuffle([...(divTeams.get(d) ?? [])]);
    const i = idx.get(d)!;
    const otherDivs = divIds.filter((o) => o !== d);
    const rowSums = members.map((id) => deg(id));
    const colSums = otherDivs.map((o) => pairTotal[i][idx.get(o)!]);
    const m = transport(rowSums, colSums);
    members.forEach((id, ri) => {
      const perDiv = new Map<string, number>();
      otherDivs.forEach((o, ci) => perDiv.set(o, m[ri][ci]));
      crossTo.set(id, perDiv);
    });
  }

  // Stage 3 — for each unordered division pair, realize the bipartite multigraph
  // between the two teams sets using their stage-2 allocations toward each other.
  const edges: RealizedEdge[] = [];
  for (let i = 0; i < divIds.length; i += 1) {
    for (let j = i + 1; j < divIds.length; j += 1) {
      const di = divIds[i];
      const dj = divIds[j];
      const teamsI = rng.shuffle([...(divTeams.get(di) ?? [])]);
      const teamsJ = rng.shuffle([...(divTeams.get(dj) ?? [])]);
      const rowSums = teamsI.map((id) => crossTo.get(id)?.get(dj) ?? 0);
      const colSums = teamsJ.map((id) => crossTo.get(id)?.get(di) ?? 0);
      const sumR = rowSums.reduce((s, v) => s + v, 0);
      const sumC = colSums.reduce((s, v) => s + v, 0);
      if (sumR !== sumC) return null; // stage-1/2 inconsistency (shouldn't happen)
      const m = transport(rowSums, colSums);
      teamsI.forEach((a, ri) => {
        teamsJ.forEach((b, cj) => {
          const count = m[ri][cj];
          if (count > 0) edges.push({ a, b, count });
        });
      });
    }
  }

  return edges;
}
