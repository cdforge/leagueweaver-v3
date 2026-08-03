import {
  EngineInput,
  EngineTeam,
  InventoryPair,
  MatchupInventory,
  MatchKind,
  TeamId,
} from "../domain/types";
import { groupTeams, gamesPerTeamTarget } from "../domain/groups";
import { realizeDegreeGraph } from "./degreeRealization";
import { realizePriorityCrossDivisionGraph } from "./crossPriorityRealization";
import {
  analyzeCrossDivisionPriority,
  solveCrossDivisionPairCounts,
  toCrossDivisionPairKey,
} from "../../crossDivisionPriority";
import { SeededRng } from "../rng";

// Builds the cross-division pairings honoring the same-seed priority order
// (same-seed unique → other unique → same-seed repeat → other repeat). This is
// the legacy allocator the generator harness validates via
// analyzeCrossDivisionPriority, so using it makes the inventory priority-
// compliant by construction. Returns null if the degree sequence can't be fully
// realized (caller retries with a fresh seed).
function addPrioritizedCrossPairs(
  map: Map<string, InventoryPair>,
  input: EngineInput,
  degree: Map<TeamId, number>,
  rng: SeededRng,
  maxPairCount = 2,
): boolean {
  const total = [...degree.values()].reduce((s, v) => s + v, 0);
  if (total === 0) return true;

  const divisionOrder = new Map<string, number>(
    input.divisions.map((d) => [d.id, d.orderIndex]),
  );
  const { pairCounts, remainingGamesByTeam } = solveCrossDivisionPairCounts(
    input.teams,
    degree,
    () => rng.next(),
    { divisionOrder, maxPairCount },
  );

  const leftover = [...remainingGamesByTeam.values()].reduce(
    (s, v) => s + Math.max(0, v),
    0,
  );
  if (leftover > 0) {
    // The greedy priority allocator can't realize this cross-degree sequence —
    // this happens systematically for odd-size divisions (e.g. a 4-3-3 fantasy
    // league). The strict same-seed cross-priority order is usually still
    // *achievable* here (the greedy allocator just can't find it), so hand off to
    // the priority-aware realizer: it starts from a guaranteed transportation
    // realization and runs a degree-preserving local search toward the same-seed
    // priority order. It returns a compliant assignment whenever one exists and a
    // best-effort one (no worse than the raw transportation) otherwise, so a valid
    // schedule always results. Even-division leagues never hit this path.
    const result = realizePriorityCrossDivisionGraph(input.teams, degree, rng, divisionOrder);
    if (!result) return false;
    for (const e of result.edges) {
      if (e.count > maxPairCount) return false;
      addPair(map, e.a, e.b, e.count, "cross");
    }
    return true;
  }

  // Reject non-priority-compliant pairings so the restart loop retries a fresh
  // seed; the cross-division priority order is a hard requirement, not soft.
  if (!analyzeCrossDivisionPriority(input.teams, pairCounts).isPriorityCompliant) {
    return false;
  }

  const idByKey = new Map<string, [TeamId, TeamId]>();
  for (let i = 0; i < input.teams.length; i += 1) {
    for (let j = i + 1; j < input.teams.length; j += 1) {
      const a = input.teams[i].id;
      const b = input.teams[j].id;
      idByKey.set(toCrossDivisionPairKey(a, b), [a, b]);
    }
  }
  for (const [key, count] of pairCounts) {
    if (count <= 0) continue;
    const ids = idByKey.get(key);
    if (!ids) return false;
    addPair(map, ids[0], ids[1], count, "cross");
  }
  return true;
}

// crossDivisionVariety === "more_flexible": lower each team's cross-opponent
// variety by concentrating its cross games onto fewer distinct opponents. The
// prioritized allocator always maximizes distinct-before-repeat (max variety),
// and week reordering can't change who plays whom, so variety is a Phase-1
// property — the only place to shape it.
//
// We apply degree-preserving "rectangle" swaps within a division pair: given
// A,D in one division and B,C in another where A plays C once, D plays B once,
// and A–B, D–C already exist once each, rewrite to A–B twice and D–C twice
// (dropping A–C and D–B). Every team's total game count is unchanged, no cross
// pair exceeds count 2 (the same ceiling max-variety already produces), and A's
// and D's distinct-opponent counts each drop by one. Bounded to one swap per
// team so it stays cheap on large leagues.
function reduceCrossVariety(
  map: Map<string, InventoryPair>,
  input: EngineInput,
  rng: SeededRng,
  protectedKeys?: Set<string>,
): void {
  const pk = (a: TeamId, b: TeamId) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const countOf = (a: TeamId, b: TeamId): number => map.get(pk(a, b))?.count ?? 0;
  const dec = (a: TeamId, b: TeamId) => {
    const k = pk(a, b);
    const p = map.get(k);
    if (!p) return;
    p.count -= 1;
    if (p.count <= 0) map.delete(k);
  };
  const inc = (a: TeamId, b: TeamId) => addPair(map, a, b, 1, "cross");

  const byDiv = new Map<string, TeamId[]>();
  for (const t of input.teams) {
    if (!t.divisionId) continue;
    const list = byDiv.get(t.divisionId) ?? [];
    list.push(t.id);
    byDiv.set(t.divisionId, list);
  }
  const divIds = [...byDiv.keys()];
  if (divIds.length < 2) return;

  const maxSwaps = input.teams.length;
  let swaps = 0;
  let progress = true;
  while (progress && swaps < maxSwaps) {
    progress = false;
    for (let di = 0; di < divIds.length && !progress; di += 1) {
      for (let dj = 0; dj < divIds.length && !progress; dj += 1) {
        if (di === dj) continue;
        const left = rng.shuffle([...(byDiv.get(divIds[di]) ?? [])]);
        const right = rng.shuffle([...(byDiv.get(divIds[dj]) ?? [])]);
        for (const A of left) {
          for (const D of left) {
            if (A === D) continue;
            for (const B of right) {
              for (const C of right) {
                if (B === C) continue;
                // Never dissolve a reserved final-week cross pair.
                if (
                  protectedKeys &&
                  (protectedKeys.has(pk(A, C)) || protectedKeys.has(pk(D, B)))
                ) {
                  continue;
                }
                if (
                  countOf(A, C) === 1 &&
                  countOf(D, B) === 1 &&
                  countOf(A, B) === 1 &&
                  countOf(D, C) === 1
                ) {
                  dec(A, C);
                  dec(D, B);
                  inc(A, B);
                  inc(D, C);
                  swaps += 1;
                  progress = true;
                  break;
                }
              }
              if (progress) break;
            }
            if (progress) break;
          }
          if (progress) break;
        }
      }
    }
  }
}

function addPair(
  map: Map<string, InventoryPair>,
  a: TeamId,
  b: TeamId,
  count: number,
  kind: MatchKind,
) {
  const k = a < b ? `${a}|${b}` : `${b}|${a}`;
  const existing = map.get(k);
  if (existing) existing.count += count;
  else map.set(k, { a: a < b ? a : b, b: a < b ? b : a, count, kind });
}

// Each team plays `games` matchups within `teamIds`, distinct opponents before
// repeats: full round-robin cycles plus a partial cycle for the remainder. Used
// for season-length round robin and single-division fantasy. Returns false if a
// partial cycle's degree sequence can't be realized (caller retries a seed).
function fillRoundRobin(
  map: Map<string, InventoryPair>,
  teamIds: TeamId[],
  games: number,
  kind: MatchKind,
  rng: SeededRng,
): boolean {
  const maxDistinct = teamIds.length - 1;
  const fullCycles = Math.floor(games / maxDistinct);
  const remainder = games - fullCycles * maxDistinct;
  if (fullCycles > 0) {
    for (let i = 0; i < teamIds.length; i += 1)
      for (let j = i + 1; j < teamIds.length; j += 1)
        addPair(map, teamIds[i], teamIds[j], fullCycles, kind);
  }
  if (remainder > 0) {
    const rem = new Map<TeamId, number>();
    for (const id of teamIds) rem.set(id, remainder);
    const edges = realizeDegreeGraph({ teamIds, degree: rem, forbidSameGroup: false, rng });
    if (!edges) return false;
    for (const e of edges) addPair(map, e.a, e.b, e.count, kind);
  }
  return true;
}

// Fantasy divisional final-week rule. Fantasy is bye-free, so within a division
// teams pair up in-division and a division of ODD size leaves exactly one team
// that must play cross-division. To keep the final week as divisional as the
// league shape allows AND push the unavoidable cross game(s) onto the weakest
// teams, the leftover from each odd division is that division's lowest-ranked
// member (max divisionSeed). Those bottom teams are paired weakest-with-weakest
// (by overallSeed) across divisions. The returned pairs are reserved into the
// final week by placement. Empty when the rule is off, single-division, or every
// division is even-sized (final week is then 100% divisional).
function computeReservedFinalCrossPairs(
  input: EngineInput,
): Array<{ a: TeamId; b: TeamId }> {
  if (!input.settings.regularSeasonFinalWeekDivisional) return [];
  const groups = groupTeams(input.teams);
  if (groups.size <= 1) return [];

  const leftovers: EngineTeam[] = [];
  for (const members of groups.values()) {
    if (members.length % 2 === 0) continue; // even division pairs fully in-division
    let bottom = members[0];
    for (const t of members) {
      // lowest rank within the division = highest divisionSeed value
      if (t.divisionSeed > bottom.divisionSeed) bottom = t;
    }
    leftovers.push(bottom);
  }
  // The number of odd-sized divisions is even whenever the total team count is
  // even (guaranteed for fantasy), so leftovers always pair up. Bail defensively
  // if a dangling odd leftover ever appears rather than emit a broken reservation.
  if (leftovers.length === 0 || leftovers.length % 2 !== 0) return [];

  // Weakest-with-weakest: the two lowest teams overall meet, then the next two,
  // preserving stronger cross matchups when there are multiple (e.g. 4 divisions).
  leftovers.sort((x, y) => y.overallSeed - x.overallSeed);
  const pairs: Array<{ a: TeamId; b: TeamId }> = [];
  for (let i = 0; i + 1 < leftovers.length; i += 2) {
    pairs.push({ a: leftovers[i].id, b: leftovers[i + 1].id });
  }
  return pairs;
}

// Intra-group complete graph, each pair `times`.
function intraGroupPairs(
  map: Map<string, InventoryPair>,
  groups: Map<string, TeamId[]>,
  times: number,
  kind: MatchKind,
) {
  for (const members of groups.values()) {
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        addPair(map, members[i], members[j], times, kind);
      }
    }
  }
}

export function buildInventory(
  input: EngineInput,
  rng: SeededRng,
): MatchupInventory | null {
  const map = new Map<string, InventoryPair>();
  let reservedFinalCrossPairs: Array<{ a: TeamId; b: TeamId }> = [];
  const groups = groupTeams(input.teams);
  const groupsIds = new Map<string, TeamId[]>(
    [...groups.entries()].map(([k, v]) => [k, v.map((t) => t.id)]),
  );
  const groupOf = new Map<TeamId, string>();
  for (const [gid, members] of groupsIds) for (const id of members) groupOf.set(id, gid);
  const teamIds = input.teams.map((t) => t.id);

  switch (input.format) {
    case "fantasy_nfl_divisional": {
      const weeks = input.settings.weeks;
      // Single-division ("no divisions") fantasy: fill `weeks` intra-league
      // games via round-robin; no cross-division games exist.
      if (groupsIds.size === 1) {
        const members = [...groupsIds.values()][0];
        if (!fillRoundRobin(map, members, weeks, "div", rng)) return null;
        break;
      }
      intraGroupPairs(map, groupsIds, 2, "div");

      // Build the cross-division pairs into a scratch map so a failed attempt rolls
      // back cleanly. The final-week divisional reservation removes specific
      // bottom-vs-bottom cross games up front and hands the priority allocator only
      // the residual cross degree; for some odd-division shapes (e.g. four 7-team
      // divisions) that residual sequence is one the allocator can't realize. When
      // that happens, fall back to building cross WITHOUT the reservation — uniform
      // degrees that always realize; the closing week just isn't forced divisional.
      // This mirrors the best-effort rollback placement already does for the same
      // reservation, so a valid schedule is produced instead of a hard failure.
      const buildCrossBand = (
        degree: Map<TeamId, number>,
        useReservation: boolean,
        maxPairCount: number,
      ): { crossMap: Map<string, InventoryPair>; reserved: Array<{ a: TeamId; b: TeamId }> } | null => {
        const crossMap = new Map<string, InventoryPair>();
        const adjustedDegree = new Map(degree);
        const reserved = useReservation ? computeReservedFinalCrossPairs(input) : [];
        for (const { a, b } of reserved) {
          addPair(crossMap, a, b, 1, "cross");
          adjustedDegree.set(a, (adjustedDegree.get(a) ?? 0) - 1);
          adjustedDegree.set(b, (adjustedDegree.get(b) ?? 0) - 1);
        }
        if ([...adjustedDegree.values()].some((value) => value < 0)) {
          return null;
        }

        const completeCrossRounds = [...groupsIds.values()].every((members) => {
          const crossOpponentCount = teamIds.length - members.length;
          const cross = adjustedDegree.get(members[0]) ?? 0;
          return crossOpponentCount > 0 && cross > 0 && cross % crossOpponentCount === 0;
        });
        const completeCrossCount = completeCrossRounds
          ? Math.max(
              0,
              ...[...groupsIds.values()].map((members) => {
                const crossOpponentCount = teamIds.length - members.length;
                return Math.floor((adjustedDegree.get(members[0]) ?? 0) / crossOpponentCount);
              }),
            )
          : 0;
        const canUseCompleteCross =
          completeCrossRounds &&
          completeCrossCount > 0 &&
          completeCrossCount <= maxPairCount &&
          [...groupsIds.values()].every((members) => {
            const crossOpponentCount = teamIds.length - members.length;
            return (adjustedDegree.get(members[0]) ?? 0) === completeCrossCount * crossOpponentCount;
          });

        if (canUseCompleteCross) {
          for (let i = 0; i < teamIds.length; i += 1) {
            for (let j = i + 1; j < teamIds.length; j += 1) {
              const a = teamIds[i];
              const b = teamIds[j];
              if (groupOf.get(a) === groupOf.get(b)) continue;
              const key = a < b ? `${a}|${b}` : `${b}|${a}`;
              const existing = crossMap.get(key)?.count ?? 0;
              const remainingCount = completeCrossCount - existing;
              if (remainingCount > 0) addPair(crossMap, a, b, remainingCount, "cross");
            }
          }
        } else if (!addPrioritizedCrossPairs(crossMap, input, adjustedDegree, rng, maxPairCount)) {
          return null;
        }

        return { crossMap, reserved };
      };

      const remainingGamesByTeam = new Map<TeamId, number>();
      for (const [, members] of groupsIds) {
        const baseDivisionalGames = 2 * (members.length - 1);
        const remaining = weeks - baseDivisionalGames;
        if (remaining < 0) return null;
        for (const id of members) remainingGamesByTeam.set(id, remaining);
      }

      let useReservation = true;
      for (let band = 0; [...remainingGamesByTeam.values()].some((value) => value > 0); band += 1) {
        if (band > weeks + teamIds.length) return null;

        const crossDegree = new Map<TeamId, number>();
        for (const [, members] of groupsIds) {
          const crossOpponentCount = teamIds.length - members.length;
          for (const id of members) {
            crossDegree.set(id, Math.min(remainingGamesByTeam.get(id) ?? 0, 2 * crossOpponentCount));
          }
        }
        if ([...crossDegree.values()].some((value) => value > 0)) {
          const crossResult = buildCrossBand(crossDegree, useReservation, 2) ??
            buildCrossBand(crossDegree, false, 2);
          if (!crossResult) return null;
          for (const pair of crossResult.crossMap.values()) {
            addPair(map, pair.a, pair.b, pair.count, pair.kind);
            remainingGamesByTeam.set(pair.a, (remainingGamesByTeam.get(pair.a) ?? 0) - pair.count);
            remainingGamesByTeam.set(pair.b, (remainingGamesByTeam.get(pair.b) ?? 0) - pair.count);
          }
          reservedFinalCrossPairs = crossResult.reserved;
          useReservation = false;
        }

        const extraDivisionalGamesByGroup = new Map<string, number>();
        for (const [groupId, members] of groupsIds) {
          const extraGames = Math.min(
            ...members.map((id) => Math.max(0, remainingGamesByTeam.get(id) ?? 0)),
            2 * (members.length - 1),
          );
          extraDivisionalGamesByGroup.set(groupId, extraGames);
        }
        for (const [groupId, extraGames] of extraDivisionalGamesByGroup) {
          if (extraGames <= 0) continue;
          const members = groupsIds.get(groupId) ?? [];
          if (!fillRoundRobin(map, members, extraGames, "div", rng)) return null;
          for (const id of members) remainingGamesByTeam.set(id, (remainingGamesByTeam.get(id) ?? 0) - extraGames);
        }
      }
      break;
    }
    case "divisional_league": {
      const dgpo = input.settings.divisionalGamesPerOpponent;
      intraGroupPairs(map, groupsIds, dgpo, "div");
      const G = gamesPerTeamTarget(input);
      const degree = new Map<TeamId, number>();
      for (const [, members] of groupsIds) {
        const cross = G - dgpo * (members.length - 1);
        for (const id of members) degree.set(id, cross);
      }
      // single-division divisional league => no cross games
      const anyCross = [...degree.values()].some((d) => d > 0);
      if (anyCross) {
        if (!addPrioritizedCrossPairs(map, input, degree, rng)) return null;
      }
      break;
    }
    case "round_robin_classic": {
      if (input.settings.classicRoundRobinMode === "cycle_count") {
        // exact full cycles: every pair `cycles` times
        const cycles = input.settings.classicRoundRobinCycleCount;
        for (let i = 0; i < teamIds.length; i += 1)
          for (let j = i + 1; j < teamIds.length; j += 1)
            addPair(map, teamIds[i], teamIds[j], cycles, "round_robin");
        break;
      }
      // season_length: each team plays `weeks` games, distinct before repeats
      if (!fillRoundRobin(map, teamIds, input.settings.weeks, "round_robin", rng)) {
        return null;
      }
      break;
    }
    case "pool_play": {
      const repeat = input.settings.poolOpponentRepeatCount;
      intraGroupPairs(map, groupsIds, repeat, "pool");
      break;
    }
    default:
      return null;
  }

  if (input.settings.crossDivisionVariety === "more_flexible") {
    const protectedKeys = new Set(
      reservedFinalCrossPairs.map(({ a, b }) => (a < b ? `${a}|${b}` : `${b}|${a}`)),
    );
    reduceCrossVariety(map, input, rng, protectedKeys);
  }

  return { pairs: [...map.values()], reservedFinalCrossPairs };
}
