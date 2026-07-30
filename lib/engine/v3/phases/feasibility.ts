import { EngineInput, FeasibilityVerdict } from "../domain/types";
import { groupTeams, gamesPerTeamTarget } from "../domain/groups";

function ok(): FeasibilityVerdict {
  return { ok: true, reasons: [], suggestions: [] };
}

function fail(reasons: string[], suggestions: string[] = []): FeasibilityVerdict {
  return { ok: false, reasons, suggestions };
}

// Phase 0 — counting proof only. No search. Catches the necessary conditions
// that make a configuration mathematically impossible.
export function checkFeasibility(input: EngineInput): FeasibilityVerdict {
  const { format, teams } = input;
  const n = teams.length;
  if (n < 2) {
    return fail(["A league needs at least 2 teams."], ["Add more teams."]);
  }

  switch (format) {
    case "fantasy_nfl_divisional":
      return checkFantasy(input);
    case "divisional_league":
      return checkDivisional(input);
    case "round_robin_classic":
      return checkRoundRobin(input);
    case "pool_play":
      return checkPoolPlay(input);
    default:
      return fail([`Unknown format: ${format as string}`]);
  }
}

function checkFantasy(input: EngineInput): FeasibilityVerdict {
  const { teams, settings } = input;
  const reasons: string[] = [];
  const suggestions: string[] = [];
  const n = teams.length;
  const weeks = settings.weeks;

  if (weeks !== 13 && weeks !== 14) {
    reasons.push("Fantasy format supports only 13- or 14-week seasons.");
    suggestions.push("Set weeks to 13 or 14.");
  }
  if (settings.byesPerTeam !== 0) {
    reasons.push("Fantasy format does not use bye weeks.");
    suggestions.push("Set byes per team to 0.");
  }
  if (n % 2 !== 0) {
    reasons.push("Fantasy format needs an even number of teams (every team plays every week).");
    suggestions.push("Add or remove a team to make the count even.");
  }

  const groups = groupTeams(teams);

  // Single-division (or "no divisions") fantasy: every team plays `weeks`
  // intra-league games via a round-robin fill (distinct opponents before
  // repeats), with no cross-division games. The double-round-robin capacity and
  // cross-handshake checks below only apply when there are 2+ divisions.
  if (groups.size < 2) {
    return reasons.length ? fail(reasons, suggestions) : ok();
  }

  for (const [divId, members] of groups) {
    const size = members.length;
    const divisionalGames = (size - 1) * 2;
    if (divisionalGames > weeks) {
      reasons.push(
        `Division ${divId} needs ${divisionalGames} divisional games (each opponent twice) but the season is only ${weeks} weeks.`,
      );
      suggestions.push("Use smaller divisions or a longer season.");
      continue;
    }
    // Odd-size division cross-shortage. Fantasy uses no byes, so every week is a
    // perfect matching on all teams (zero bye slack). Intra-division games use an
    // even number of a division's teams, so an ODD-size division must send at
    // least one team cross-division EVERY week — that needs `weeks` cross
    // appearances, but the division only supplies `size * (weeks - divisionalGames)`.
    // The necessary condition `size*(weeks - 2(size-1)) >= weeks` simplifies (for
    // size > 1) to `weeks >= 2*size`. This is a proven necessary condition, so it
    // never rejects a realizable shape (e.g. 7/7/13 fails, 7/7/14 passes). Only
    // reached when capacity above did not already flag the division.
    if (size % 2 === 1 && weeks < 2 * size) {
      const crossTotal = size * (weeks - divisionalGames);
      reasons.push(
        `Division ${divId} has ${size} teams (an odd number), so every week at least one of its teams must play outside the division — that needs ${weeks} cross-division games over the season, but this shape only creates ${crossTotal}. No valid schedule exists.`,
      );
      const minWeeks = 2 * size;
      suggestions.push(
        minWeeks <= 14
          ? `Set the season to ${minWeeks} weeks, or use even-size divisions.`
          : `Use even-size divisions — an odd division of ${size} teams needs at least ${minWeeks} weeks, more than Fantasy supports.`,
      );
    }
  }

  // cross-division degree handshake: sum of cross games per team must be even
  let crossSum = 0;
  let crossNegative = false;
  for (const members of groups.values()) {
    const cross = weeks - (members.length - 1) * 2;
    if (cross < 0) crossNegative = true;
    crossSum += cross * members.length;
  }
  if (!crossNegative && crossSum % 2 !== 0) {
    reasons.push("Cross-division games cannot be paired evenly for this team/division shape.");
    suggestions.push("Adjust division sizes so cross-division games balance.");
  }

  return reasons.length ? fail(reasons, suggestions) : ok();
}

function checkDivisional(input: EngineInput): FeasibilityVerdict {
  const { teams, settings } = input;
  const reasons: string[] = [];
  const suggestions: string[] = [];
  const n = teams.length;
  const G = gamesPerTeamTarget(input);

  if (G < 1) {
    reasons.push("Each team must play at least one game; weeks minus byes is too low.");
    suggestions.push("Increase weeks or reduce byes.");
  }

  // total games integer (handshake)
  if ((n * G) % 2 !== 0) {
    reasons.push(`A league of ${n} teams playing ${G} games each yields a non-integer game total.`);
    suggestions.push("Adjust weeks, byes, or team count so total games are even.");
  }

  const groups = groupTeams(teams);
  const dgpo = settings.divisionalGamesPerOpponent;
  for (const [divId, members] of groups) {
    const guaranteed = (members.length - 1) * dgpo;
    if (guaranteed > G) {
      reasons.push(
        `Division ${divId} needs ${guaranteed} guaranteed divisional games but each team only plays ${G}.`,
      );
      suggestions.push("Lower divisional games per opponent, add weeks, or reduce byes.");
    }
  }

  // bye parity: each week the number of playing teams must be even
  // total byes spread across weeks; necessary condition: n*byes distributable
  const totalByes = n * settings.byesPerTeam;
  const totalPlayingSlots = n * settings.weeks - totalByes;
  if (totalPlayingSlots % 2 !== 0) {
    reasons.push("Bye distribution cannot keep every week's playing-team count even.");
    suggestions.push("Adjust byes per team or the team count.");
  }

  return reasons.length ? fail(reasons, suggestions) : ok();
}

function checkRoundRobin(input: EngineInput): FeasibilityVerdict {
  const { teams, settings } = input;
  const reasons: string[] = [];
  const suggestions: string[] = [];
  const n = teams.length;

  if (settings.classicRoundRobinMode === "cycle_count") {
    if (settings.classicRoundRobinCycleCount < 1) {
      reasons.push("Round robin needs at least one full cycle.");
      suggestions.push("Set cycle count to 1 or more.");
    }
  } else {
    // season_length: weeks must be reachable from an in-order RR build
    if (settings.weeks < 1) {
      reasons.push("Season length must be at least one week.");
      suggestions.push("Increase the season length.");
    }
    // Odd team counts force one bye per week, so a fixed season length yields
    // unequal per-team game counts. That requires the uneven-degree builder,
    // which season-length mode does not implement; cycle count handles it.
    if (n % 2 !== 0) {
      reasons.push("Season-length round robin needs an even number of teams.");
      suggestions.push("Add or remove a team, or switch to cycle-count mode for odd leagues.");
    }
    const maxUniqueRounds = n % 2 === 0 ? n - 1 : n;
    if (settings.weeks > maxUniqueRounds * 50) {
      reasons.push("Season length is unreasonably long for this team count.");
    }
  }

  return reasons.length ? fail(reasons, suggestions) : ok();
}

function checkPoolPlay(input: EngineInput): FeasibilityVerdict {
  const { teams, settings } = input;
  const reasons: string[] = [];
  const suggestions: string[] = [];

  const groups = groupTeams(teams);
  if (groups.size < 2) {
    reasons.push("Pool Play needs at least 2 pools.");
    suggestions.push("Create 2 or more pools.");
  }
  for (const [poolId, members] of groups) {
    if (members.length < 2) {
      reasons.push(`Pool ${poolId} needs at least 2 teams.`);
      suggestions.push("Add teams to small pools or merge pools.");
    }
  }
  if (settings.poolOpponentRepeatCount < 1) {
    reasons.push("Pool opponent repeat count must be at least 1.");
    suggestions.push("Set repeat count to 1 or more.");
  }

  return reasons.length ? fail(reasons, suggestions) : ok();
}
