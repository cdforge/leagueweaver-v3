import {
  EngineGame,
  EngineInput,
  EngineSchedule,
  EngineWeek,
  MatchKind,
  MatchupInventory,
  TeamId,
} from "../domain/types";
import { SeededRng } from "../rng";

// Circle-method rounds for an even number of teams. Returns (n-1) rounds, each a
// perfect matching of all teams; every unordered pair appears exactly once across
// the full set of rounds, and no two consecutive rounds share a pair.
function circleRounds(teamIds: TeamId[]): Array<Array<[TeamId, TeamId]>> {
  const n = teamIds.length;
  const rounds: Array<Array<[TeamId, TeamId]>> = [];
  let list = teamIds.slice();
  for (let r = 0; r < n - 1; r += 1) {
    const round: Array<[TeamId, TeamId]> = [];
    for (let i = 0; i < n / 2; i += 1) {
      round.push([list[i], list[n - 1 - i]]);
    }
    rounds.push(round);
    // rotate everything except the first element one step to the right
    const tail = list.slice(1);
    tail.unshift(tail.pop() as TeamId);
    list = [list[0], ...tail];
  }
  return rounds;
}

function pairKey(a: TeamId, b: TeamId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Builds a canonical round-robin schedule: the first (n-1) weeks cover every
// opponent once, and any weeks beyond that replay whole rounds in order — so
// each team faces all others once before any rematch (balanced coverage), and no
// pair ever lands in back-to-back weeks. The realized-pair multiset is returned
// as the inventory so the matchup-multiset check matches exactly. Even-team only.
export function buildRoundRobinSchedule(
  input: EngineInput,
  teamIds: TeamId[],
  weeks: number,
  kind: MatchKind,
  rng: SeededRng,
): { schedule: EngineSchedule; inventory: MatchupInventory } | null {
  const n = teamIds.length;
  if (n < 2 || n % 2 !== 0 || weeks < 1) return null;

  // Shuffle team → circle-position mapping for per-seed variety.
  const rounds = circleRounds(rng.shuffle(teamIds.slice()));
  const R = rounds.length;

  const counts = new Map<string, number>();
  const weeksOut: EngineWeek[] = [];
  for (let w = 0; w < weeks; w += 1) {
    const round = rounds[w % R];
    const games: EngineGame[] = round.map(([a, b]) => {
      const key = pairKey(a, b);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return {
        a,
        b,
        homeTeamId: null,
        awayTeamId: null,
        kind,
        seriesId: key,
        seriesGameIndex: counts.get(key)!,
        seriesLength: 0, // patched below once totals are known
      };
    });
    weeksOut.push({ weekNumber: w + 1, games, byes: [] });
  }

  // Patch series totals now that every pair's final count is known.
  for (const week of weeksOut) {
    for (const game of week.games) {
      game.seriesLength = counts.get(pairKey(game.a, game.b)) ?? 1;
    }
  }

  const pairs = [...counts.entries()].map(([key, count]) => {
    const [a, b] = key.split("|");
    return { a, b, count, kind };
  });

  return {
    schedule: { format: input.format, weeks: weeksOut },
    inventory: { pairs },
  };
}
