import { EngineInput, EngineTeam, TeamId } from "./types";

// Groups teams by divisionId/poolId. Round robin (null divisionId) collapses to
// a single group keyed "__league__".
export const SINGLE_LEAGUE_KEY = "__league__";

export function groupTeams(teams: EngineTeam[]): Map<string, EngineTeam[]> {
  const groups = new Map<string, EngineTeam[]>();
  for (const team of teams) {
    const key = team.divisionId ?? SINGLE_LEAGUE_KEY;
    const list = groups.get(key);
    if (list) list.push(team);
    else groups.set(key, [team]);
  }
  // deterministic intra-group order: by divisionSeed then id
  for (const list of groups.values()) {
    list.sort((a, b) => a.divisionSeed - b.divisionSeed || (a.id < b.id ? -1 : 1));
  }
  return groups;
}

export function groupSizes(teams: EngineTeam[]): number[] {
  return [...groupTeams(teams).values()].map((g) => g.length);
}

// True if teams span 2+ distinct divisions/pools. Allocation- and sort-free with
// early exit — cheap enough to call inside the optimizer's per-iteration
// constraint checks (unlike groupTeams, which builds and sorts a Map).
export function hasMultipleDivisions(teams: EngineTeam[]): boolean {
  let first: string | undefined;
  for (const team of teams) {
    const key = team.divisionId ?? SINGLE_LEAGUE_KEY;
    if (first === undefined) first = key;
    else if (key !== first) return true;
  }
  return false;
}

// Per-team total game count G implied by the season shape.
export function gamesPerTeamTarget(input: EngineInput): number {
  return input.settings.weeks - input.settings.byesPerTeam;
}

// Number of scheduled weeks for a format. Fantasy/divisional use the user's
// week count; round robin cycle mode and pool play derive it from structure.
export function effectiveWeeks(input: EngineInput): number {
  const n = input.teams.length;
  switch (input.format) {
    case "fantasy_nfl_divisional":
    case "divisional_league":
      return input.settings.weeks;
    case "round_robin_classic": {
      if (input.settings.classicRoundRobinMode === "cycle_count") {
        const roundsPerCycle = n % 2 === 0 ? n - 1 : n;
        return roundsPerCycle * input.settings.classicRoundRobinCycleCount;
      }
      return input.settings.weeks;
    }
    case "pool_play": {
      const repeat = input.settings.poolOpponentRepeatCount;
      let maxRounds = 0;
      for (const members of groupTeams(input.teams).values()) {
        const p = members.length;
        const rounds = (p % 2 === 0 ? p - 1 : p) * repeat;
        if (rounds > maxRounds) maxRounds = rounds;
      }
      return maxRounds;
    }
    default:
      return input.settings.weeks;
  }
}

export function sortedByOverallSeed(teams: EngineTeam[]): EngineTeam[] {
  return [...teams].sort(
    (a, b) => a.overallSeed - b.overallSeed || (a.id < b.id ? -1 : 1),
  );
}

export function buildTeamsById(teams: EngineTeam[]): Map<TeamId, EngineTeam> {
  return new Map(teams.map((t) => [t.id, t]));
}
