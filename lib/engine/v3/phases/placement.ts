import {
  EngineGame,
  EngineInput,
  EngineSchedule,
  EngineTeam,
  EngineWeek,
  MatchupInventory,
  TeamId,
} from "../domain/types";
import { SeededRng } from "../rng";
import { effectiveWeeks } from "../domain/groups";

interface ExpandedEdge {
  a: TeamId;
  b: TeamId;
  kind: EngineGame["kind"];
  seriesId: string;
  seriesGameIndex: number;
  seriesLength: number;
}

function expandEdges(inventory: MatchupInventory): ExpandedEdge[] {
  const edges: ExpandedEdge[] = [];
  for (const pair of inventory.pairs) {
    const seriesId = `${pair.a}~${pair.b}`;
    for (let i = 0; i < pair.count; i += 1) {
      edges.push({
        a: pair.a,
        b: pair.b,
        kind: pair.kind,
        seriesId,
        seriesGameIndex: i + 1,
        seriesLength: pair.count,
      });
    }
  }
  return edges;
}

// Which weeks each team is PRESENT (i.e. not on bye). `quota` gives each team's
// total bye count (= effectiveWeeks − degree), uniformly covering explicit byes,
// odd-team structural byes, and zero-bye formats. Returns null if a valid bye
// layout can't be found under the window + parity constraints.
function decidePresence(
  input: EngineInput,
  W: number,
  quota: Map<TeamId, number>,
  rng: SeededRng,
): Map<TeamId, Set<number>> | null {
  const n = input.teams.length;
  const present = new Map<TeamId, Set<number>>();
  for (const t of input.teams) {
    present.set(t.id, new Set(Array.from({ length: W }, (_, i) => i + 1)));
  }
  const totalByes = [...quota.values()].reduce((s, v) => s + v, 0);
  if (totalByes === 0) return present;

  // Bye-window preference only applies to divisional_league explicit byes. Other
  // formats have structural byes whose per-week distribution is parity-forced.
  const placement = input.settings.byeWeekPlacement;
  let windowWeeks: number[];
  if (input.format !== "divisional_league" || placement === "anywhere") {
    windowWeeks = Array.from({ length: W }, (_, i) => i + 1);
  } else {
    const lo = Math.floor(W * 0.25) + 1;
    const hi = Math.ceil(W * 0.75);
    windowWeeks = [];
    for (let w = lo; w <= hi; w += 1) windowWeeks.push(w);
    if (placement === "prefer_middle") {
      // allow spill to all weeks if needed, window first (handled by load order)
      const rest = [];
      for (let w = 1; w <= W; w += 1) if (w < lo || w > hi) rest.push(w);
      windowWeeks = [...windowWeeks, ...rest];
    }
  }

  const byeCountPerWeek = new Map<number, number>();
  for (let w = 1; w <= W; w += 1) byeCountPerWeek.set(w, 0);
  const teamByeWeeks = new Map<TeamId, Set<number>>();
  for (const t of input.teams) teamByeWeeks.set(t.id, new Set());

  const teamsOrder = rng.shuffle(input.teams.map((t) => t.id));
  for (const teamId of teamsOrder) {
    const byes = quota.get(teamId) ?? 0;
    if (byes === 0) continue;
    const chosen = teamByeWeeks.get(teamId)!;
    // pick `byes` distinct weeks with lowest current load, preferring window order
    const candidates = windowWeeks.filter((w) => !chosen.has(w));
    candidates.sort((x, y) => (byeCountPerWeek.get(x)! - byeCountPerWeek.get(y)!));
    if (candidates.length < byes) return null;
    for (let i = 0; i < byes; i += 1) {
      const w = candidates[i];
      chosen.add(w);
      byeCountPerWeek.set(w, byeCountPerWeek.get(w)! + 1);
    }
  }

  // parity fix: each week's present count (n - byes_w) must be even
  // i.e. byes_w must have parity == n mod 2
  const needParity = n % 2;
  for (let pass = 0; pass < 200; pass += 1) {
    const badWeek = [...byeCountPerWeek.entries()].find(
      ([, c]) => c % 2 !== needParity,
    );
    if (!badWeek) break;
    const [bw] = badWeek;
    // move one bye from bw to another week with the opposite need, or vice versa
    // find a team byeing in bw that can move to a week with room and opposite parity issue
    let moved = false;
    const movableTeams = input.teams
      .map((t) => t.id)
      .filter((id) => teamByeWeeks.get(id)!.has(bw));
    for (const teamId of rng.shuffle(movableTeams)) {
      const targetWeek = rng
        .shuffle(windowWeeks)
        .find(
          (w) =>
            w !== bw &&
            !teamByeWeeks.get(teamId)!.has(w) &&
            (byeCountPerWeek.get(w)! % 2 !== needParity || true),
        );
      if (targetWeek == null) continue;
      // only beneficial if it fixes bw parity (it always flips bw by 1)
      teamByeWeeks.get(teamId)!.delete(bw);
      teamByeWeeks.get(teamId)!.add(targetWeek);
      byeCountPerWeek.set(bw, byeCountPerWeek.get(bw)! - 1);
      byeCountPerWeek.set(targetWeek, byeCountPerWeek.get(targetWeek)! + 1);
      moved = true;
      break;
    }
    if (!moved) return null;
  }
  // final parity check
  for (const [, c] of byeCountPerWeek) {
    if (c % 2 !== needParity) return null;
  }

  for (const t of input.teams) {
    const byeSet = teamByeWeeks.get(t.id)!;
    const presentSet = present.get(t.id)!;
    for (const w of byeSet) presentSet.delete(w);
  }
  return present;
}

// Backtracking matching decomposition: assign each game-edge to a week so that
// each team plays at most once per week and only when present. Capacity per week
// is present/2, and total edges == sum capacities, so a full assignment yields a
// perfect matching every week (Tier-1 valid). Week ORDER is irrelevant here;
// Phase 4 reorders to satisfy hard Tier-2 + soft preferences.
export function placeSchedule(
  input: EngineInput,
  inventory: MatchupInventory,
  rng: SeededRng,
  nodeBudget = 200_000,
): EngineSchedule | null {
  const W = effectiveWeeks(input);
  const edges = expandEdges(inventory);

  // degree per team (for static ordering + bye quota)
  const degree = new Map<TeamId, number>();
  for (const t of input.teams) degree.set(t.id, 0);
  for (const e of edges) {
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
  }

  // per-team bye quota = effectiveWeeks − degree (uniformly handles explicit
  // byes, odd-team structural byes, and zero-bye formats)
  const byeQuota = new Map<TeamId, number>();
  for (const t of input.teams) {
    const q = W - (degree.get(t.id) ?? 0);
    if (q < 0) return null;
    byeQuota.set(t.id, q);
  }

  const presence = decidePresence(input, W, byeQuota, rng);
  if (!presence) return null;

  // present-by-week and capacity
  const presentByWeek: Array<Set<TeamId>> = [];
  const cap: number[] = [];
  for (let w = 1; w <= W; w += 1) {
    const set = new Set<TeamId>();
    for (const t of input.teams) if (presence.get(t.id)!.has(w)) set.add(t.id);
    presentByWeek.push(set);
    cap.push(set.size / 2);
  }

  const ordered = rng.shuffle(edges.slice());
  const occupied: Array<Set<TeamId>> = Array.from({ length: W }, () => new Set());
  const gamesInWeek: number[] = Array(W).fill(0);
  const assignment: number[] = Array(ordered.length).fill(-1);
  const assigned: boolean[] = Array(ordered.length).fill(false);
  let assignedCount = 0;
  let nodes = 0;

  // ---- Fantasy final-week divisional reservation --------------------------
  // Pre-build the closing slate so the general decomposition runs around it: the
  // final week is all-divisional except for the reserved bottom-vs-bottom cross
  // game(s), and each cross team gets a divisional game in the penultimate week
  // (the season-ending "ripple" rule). Week ORDER is arbitrary here — the
  // fantasy-final-week fairness constraints move these slates into place during
  // Phase-4 reorder. Applied best-effort: if the reservation or the solve around
  // it can't be realized we roll it back and place normally (never fail hard).
  const reservedIdx: number[] = [];
  const undoReservation = () => {
    for (const idx of reservedIdx) {
      if (!assigned[idx]) continue;
      const w = assignment[idx];
      occupied[w].delete(ordered[idx].a);
      occupied[w].delete(ordered[idx].b);
      gamesInWeek[w] -= 1;
      assignment[idx] = -1;
      assigned[idx] = false;
      assignedCount -= 1;
    }
    reservedIdx.length = 0;
  };
  // Returns true if a (possibly empty) reservation was fully applied; false if it
  // hit an internal wall, in which case the caller rolls back the partial state.
  const applyFinalWeekReservation = (): boolean => {
    if (
      input.format !== "fantasy_nfl_divisional" ||
      !input.settings.regularSeasonFinalWeekDivisional ||
      W < 2
    ) {
      return true;
    }
    const byDivision = new Map<string, EngineTeam[]>();
    for (const t of input.teams) {
      if (!t.divisionId) continue;
      const list = byDivision.get(t.divisionId) ?? [];
      list.push(t);
      byDivision.set(t.divisionId, list);
    }
    if (byDivision.size <= 1) return true; // single-division fantasy: no cross games

    // Index unassigned edges by unordered-pair + kind so we can claim specific
    // pairings for the reserved slates.
    const edgeKey = (a: TeamId, b: TeamId, kind: EngineGame["kind"]) =>
      `${a < b ? a : b}|${a < b ? b : a}|${kind}`;
    const edgeIndex = new Map<string, number[]>();
    ordered.forEach((e, i) => {
      const key = edgeKey(e.a, e.b, e.kind);
      const arr = edgeIndex.get(key);
      if (arr) arr.push(i);
      else edgeIndex.set(key, [i]);
    });
    const reserveEdge = (a: TeamId, b: TeamId, kind: EngineGame["kind"], w: number): boolean => {
      const idx = edgeIndex.get(edgeKey(a, b, kind))?.find((i) => !assigned[i]);
      if (idx === undefined) return false;
      if (gamesInWeek[w] >= cap[w]) return false;
      if (occupied[w].has(a) || occupied[w].has(b)) return false;
      occupied[w].add(a);
      occupied[w].add(b);
      gamesInWeek[w] += 1;
      assignment[idx] = w;
      assigned[idx] = true;
      assignedCount += 1;
      reservedIdx.push(idx);
      return true;
    };

    const reserved = inventory.reservedFinalCrossPairs ?? [];
    const wF = W - 1; // closing slate (0-indexed)
    const wP = W - 2; // penultimate slate
    const leftoverIds = new Set<TeamId>();
    for (const { a, b } of reserved) {
      leftoverIds.add(a);
      leftoverIds.add(b);
    }

    // Closing slate: reserved cross games first, then a divisional perfect
    // matching of every non-leftover team (dropping each odd division's bottom
    // seed leaves all divisions even, so a full matching exists).
    for (const { a, b } of reserved) {
      if (!reserveEdge(a, b, "cross", wF)) return false;
    }
    for (const members of byDivision.values()) {
      const eligible = members
        .filter((t) => !leftoverIds.has(t.id))
        .sort((x, y) => x.divisionSeed - y.divisionSeed);
      for (let i = 0; i + 1 < eligible.length; i += 2) {
        if (!reserveEdge(eligible[i].id, eligible[i + 1].id, "div", wF)) return false;
      }
    }
    // Penultimate slate: each cross team gets an in-division game (vs its top
    // seed) so it still finishes on a divisional matchup. Cross teams come from
    // distinct divisions, so these games never collide within the week.
    const teamById = new Map(input.teams.map((t) => [t.id, t]));
    for (const teamId of leftoverIds) {
      const team = teamById.get(teamId);
      const opponent = team?.divisionId
        ? (byDivision.get(team.divisionId) ?? [])
            .filter((t) => t.id !== teamId)
            .sort((x, y) => x.divisionSeed - y.divisionSeed)[0]
        : undefined;
      if (!opponent || !reserveEdge(teamId, opponent.id, "div", wP)) return false;
    }
    return true;
  };

  const validWeeksFor = (e: ExpandedEdge): number[] => {
    const out: number[] = [];
    for (let w = 0; w < W; w += 1) {
      if (gamesInWeek[w] >= cap[w]) continue;
      if (!presentByWeek[w].has(e.a) || !presentByWeek[w].has(e.b)) continue;
      if (occupied[w].has(e.a) || occupied[w].has(e.b)) continue;
      out.push(w);
    }
    return out;
  };

  // Dynamic MRV: each step assign the most-constrained remaining edge (fewest
  // valid weeks). This prunes the exact-fill decomposition far harder than a
  // static order and is what makes dense regular instances (e.g. 16t/4div)
  // solvable within budget. LCV week order (pack fuller weeks) for values.
  const solve = (): boolean => {
    if (assignedCount === ordered.length) return true;
    nodes += 1;
    if (nodes > nodeBudget) return false;

    let bestEdge = -1;
    let bestWeeks: number[] | null = null;
    for (let i = 0; i < ordered.length; i += 1) {
      if (assigned[i]) continue;
      const weeks = validWeeksFor(ordered[i]);
      if (weeks.length === 0) return false; // dead end: prune immediately
      if (bestWeeks === null || weeks.length < bestWeeks.length) {
        bestEdge = i;
        bestWeeks = weeks;
        if (weeks.length === 1) break; // forced move, take it now
      }
    }
    if (bestEdge === -1 || bestWeeks === null) return false;

    const e = ordered[bestEdge];
    const weeks = rng.shuffle(bestWeeks);
    weeks.sort((a, b) => (cap[a] - gamesInWeek[a]) - (cap[b] - gamesInWeek[b]));
    for (const w of weeks) {
      occupied[w].add(e.a);
      occupied[w].add(e.b);
      gamesInWeek[w] += 1;
      assignment[bestEdge] = w;
      assigned[bestEdge] = true;
      assignedCount += 1;
      if (solve()) return true;
      occupied[w].delete(e.a);
      occupied[w].delete(e.b);
      gamesInWeek[w] -= 1;
      assignment[bestEdge] = -1;
      assigned[bestEdge] = false;
      assignedCount -= 1;
      if (nodes > nodeBudget) return false;
    }
    return false;
  };

  // Try to place with the reserved final-week slates first; if that (or the
  // decomposition around it) is infeasible, roll the reservation back and place
  // normally so a valid schedule is still returned (best-effort).
  if (!applyFinalWeekReservation()) undoReservation();
  if (!solve()) {
    if (reservedIdx.length > 0) {
      undoReservation();
      nodes = 0; // fresh search budget for the unreserved fallback
      if (!solve()) return null;
    } else {
      return null;
    }
  }

  // build schedule
  const weekGames: EngineGame[][] = Array.from({ length: W }, () => []);
  ordered.forEach((e, i) => {
    const w = assignment[i];
    weekGames[w].push({
      a: e.a,
      b: e.b,
      homeTeamId: null,
      awayTeamId: null,
      kind: e.kind,
      seriesId: e.seriesId,
      seriesGameIndex: e.seriesGameIndex,
      seriesLength: e.seriesLength,
    });
  });

  const weeks: EngineWeek[] = [];
  for (let w = 0; w < W; w += 1) {
    const byes = input.teams.map((t) => t.id).filter((id) => !presentByWeek[w].has(id));
    weeks.push({ weekNumber: w + 1, games: weekGames[w], byes });
  }

  // Series numbers describe chronological meetings, not inventory order.
  const seriesOccurrences = new Map<string, number>();
  for (const week of weeks) {
    for (const game of week.games) {
      const occurrence = (seriesOccurrences.get(game.seriesId) ?? 0) + 1;
      seriesOccurrences.set(game.seriesId, occurrence);
      game.seriesGameIndex = occurrence;
    }
  }

  return { format: input.format, weeks };
}
