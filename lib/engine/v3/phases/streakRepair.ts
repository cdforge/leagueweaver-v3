import { EngineGame, EngineSchedule, TeamId } from "../domain/types";
import { SeededRng } from "../rng";

// Home/away streak repair for the canonical round-robin path.
//
// The max-flow orientation (phases/orientation) realizes each team's target home
// count exactly AND balances every pairing floor/ceil, but it is blind to
// consecutive home/away runs — so a canonical single-division fantasy schedule
// comes back with `max-home-away-streak` fairness violations for several teams.
// Week order already guarantees coverage-before-repeats and no immediate rematch,
// and the SA reorder is skipped on this path, so orientation is the only remaining
// lever.
//
// Move set — every move must preserve BOTH invariants orientation established:
// per-team home totals AND per-pairing floor/ceil balance. Two families do:
//
//   (A) Intra-pair swap: within one pairing, take a game the low-id team hosts and
//       a game the high-id team hosts and swap their hosts. The pair's per-side
//       home count is unchanged (so balance holds) and each team's season total is
//       unchanged — only WHICH week each side hosts moves, which is exactly the
//       streak lever. This is the only freedom for even pairings (e.g. a 2-game
//       series that is locked 1-1).
//
//   (B) Odd-pair ceil-swap cycle: an odd pairing splits ceil/floor by one, so it
//       has a "majority host". Flipping its majority game moves one home from the
//       majority side to the minority side (ceil↔floor — still balanced) but shifts
//       one game off each team's total. Orient one edge per odd pairing toward its
//       current majority host and reverse a directed cycle: every node loses one
//       majority-holding and gains one, so all season totals are preserved while a
//       set of pairings swap which side carries the extra home.
//
// Together these are the complete set of balance-preserving re-orientations, so a
// short simulated anneal over them drives streak excess down without ever
// reintroducing an all-home/all-away series. A move is represented as the set of
// game indices whose host flips; undo re-flips the same set.

function otherEndpoint(game: { a: TeamId; b: TeamId }, team: TeamId): TeamId {
  return team === game.a ? game.b : game.a;
}

function pairKeyOf(g: { a: TeamId; b: TeamId }): string {
  return g.a < g.b ? `${g.a}|${g.b}` : `${g.b}|${g.a}`;
}

// Propose an intra-pair swap: a low-host game and a high-host game of the same
// pairing. Returns the two game indices to flip, or null if none available.
function proposeIntraPairSwap(
  games: Array<{ a: TeamId; b: TeamId }>,
  home: TeamId[],
  pairIndices: Map<string, number[]>,
  rng: SeededRng,
): number[] | null {
  const keys = [...pairIndices.keys()];
  if (keys.length === 0) return null;
  // Try a few random pairings before giving up.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const key = keys[rng.int(0, keys.length - 1)];
    const indices = pairIndices.get(key)!;
    const lo = key.split("|")[0];
    const loHost: number[] = [];
    const hiHost: number[] = [];
    for (const gi of indices) (home[gi] === lo ? loHost : hiHost).push(gi);
    if (loHost.length === 0 || hiHost.length === 0) continue;
    const x = loHost[rng.int(0, loHost.length - 1)];
    const y = hiHost[rng.int(0, hiHost.length - 1)];
    return [x, y];
  }
  return null;
}

// Propose an odd-pair ceil-swap cycle. Builds one edge per odd pairing directed
// toward its current majority host, walks to a directed cycle, and returns the
// majority game index of each pairing on the cycle (the games to flip). Null if
// no cycle is found.
function proposeCeilSwapCycle(
  games: Array<{ a: TeamId; b: TeamId }>,
  home: TeamId[],
  oddPairKeys: string[],
  pairIndices: Map<string, number[]>,
  rng: SeededRng,
): number[] | null {
  // majorityHost + a majority game index per odd pairing, from current orientation
  const majorityHost = new Map<string, TeamId>();
  const majorityGame = new Map<string, number>();
  const outEdges = new Map<TeamId, string[]>(); // majority host -> odd pair keys
  for (const key of oddPairKeys) {
    const indices = pairIndices.get(key)!;
    const [lo, hi] = key.split("|");
    let loCount = 0;
    let loGame = -1;
    let hiGame = -1;
    for (const gi of indices) {
      if (home[gi] === lo) {
        loCount += 1;
        loGame = gi;
      } else {
        hiGame = gi;
      }
    }
    const hiCount = indices.length - loCount;
    const host = loCount > hiCount ? lo : hi;
    majorityHost.set(key, host);
    majorityGame.set(key, host === lo ? loGame : hiGame);
    const list = outEdges.get(host);
    if (list) list.push(key);
    else outEdges.set(host, [key]);
  }

  const starts = [...outEdges.keys()];
  if (starts.length === 0) return null;
  let cur = starts[rng.int(0, starts.length - 1)];
  const posInPath = new Map<TeamId, number>([[cur, 0]]);
  const edgeSeq: string[] = []; // pair keys along the path
  const maxSteps = oddPairKeys.length + 1;
  for (let step = 0; step < maxSteps; step += 1) {
    const edges = outEdges.get(cur);
    if (!edges || edges.length === 0) return null;
    const key = edges[rng.int(0, edges.length - 1)];
    const head = otherEndpoint(games[majorityGame.get(key)!], majorityHost.get(key)!); // minority side
    const seenAt = posInPath.get(head);
    if (seenAt !== undefined) {
      const cycleKeys = edgeSeq.slice(seenAt);
      cycleKeys.push(key);
      return cycleKeys.map((k) => majorityGame.get(k)!);
    }
    posInPath.set(head, edgeSeq.length + 1);
    edgeSeq.push(key);
    cur = head;
  }
  return null;
}

// Count of over-cap positions summed across teams (a run of length L>cap
// contributes L−cap). Zero ⇔ no team exceeds the streak cap, matching the
// registry's `max-home-away-streak` fairness check.
function streakExcess(
  teamSequences: Array<{ team: TeamId; games: number[] }>,
  home: TeamId[],
  cap: number,
): number {
  let total = 0;
  for (const { team, games } of teamSequences) {
    let run = 0;
    let prev: boolean | null = null;
    for (const gi of games) {
      const isHome = home[gi] === team;
      if (isHome === prev) run += 1;
      else {
        run = 1;
        prev = isHome;
      }
      if (run > cap) total += 1;
    }
  }
  return total;
}

// Re-orient the schedule's games in place to eliminate home/away streaks beyond
// `cap`, preserving every team's home-game total. No-op when already within cap.
export function repairHomeAwayStreaks(
  schedule: EngineSchedule,
  cap: number,
  rng: SeededRng,
  opts: { maxIterations?: number } = {},
): void {
  const refs: EngineGame[] = [];
  const games: Array<{ a: TeamId; b: TeamId }> = [];
  const weeksInOrder = [...schedule.weeks].sort((x, y) => x.weekNumber - y.weekNumber);
  for (const week of weeksInOrder) {
    for (const g of week.games) {
      refs.push(g);
      games.push({ a: g.a, b: g.b });
    }
  }
  const E = games.length;
  if (E === 0) return;

  // Current home team per game (games are already in week order).
  const home: TeamId[] = refs.map((g, i) => g.homeTeamId ?? games[i].a);

  // Per-team ordered game indices (used for streak counting).
  const seqByTeam = new Map<TeamId, number[]>();
  games.forEach((g, i) => {
    for (const t of [g.a, g.b]) {
      const list = seqByTeam.get(t);
      if (list) list.push(i);
      else seqByTeam.set(t, [i]);
    }
  });
  const teamSequences = [...seqByTeam.entries()].map(([team, gs]) => ({ team, games: gs }));

  // Group game indices by pairing; odd-count pairings are the ceil-swap edges.
  const pairIndices = new Map<string, number[]>();
  games.forEach((g, i) => {
    const key = pairKeyOf(g);
    const list = pairIndices.get(key);
    if (list) list.push(i);
    else pairIndices.set(key, [i]);
  });
  const oddPairKeys = [...pairIndices.entries()]
    .filter(([, idxs]) => idxs.length % 2 === 1)
    .map(([k]) => k);

  let curCost = streakExcess(teamSequences, home, cap);
  if (curCost === 0) return;
  let best = home.slice();
  let bestCost = curCost;

  const maxIterations = opts.maxIterations ?? 6000;
  let temp = 1.0;
  const cooling = 0.999;

  const applyFlip = (idxs: number[]) => {
    for (const gi of idxs) home[gi] = otherEndpoint(games[gi], home[gi]);
  };

  for (let iter = 0; iter < maxIterations && bestCost > 0; iter += 1) {
    // Alternate between the two balance-preserving move families. Ceil-swap
    // cycles need odd pairings; fall back to intra-pair swaps otherwise.
    const useCycle = oddPairKeys.length > 0 && rng.next() < 0.5;
    const move = useCycle
      ? proposeCeilSwapCycle(games, home, oddPairKeys, pairIndices, rng)
      : proposeIntraPairSwap(games, home, pairIndices, rng);
    if (move && move.length > 0) {
      applyFlip(move);
      const newCost = streakExcess(teamSequences, home, cap);
      const delta = newCost - curCost;
      if (delta <= 0 || rng.next() < Math.exp(-delta / Math.max(temp, 1e-6))) {
        curCost = newCost;
        if (newCost < bestCost) {
          bestCost = newCost;
          best = home.slice();
        }
      } else {
        applyFlip(move); // reject: undo (flipping the same set is its own inverse)
      }
    }
    temp *= cooling;
  }

  // Write the best orientation found back onto the schedule.
  refs.forEach((g, i) => {
    const h = best[i];
    g.homeTeamId = h;
    g.awayTeamId = otherEndpoint(games[i], h);
  });
}
