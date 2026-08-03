import {
  Constraint,
  ConstraintContext,
  EngineGame,
  EngineSchedule,
  EngineWeek,
  FormatKey,
  Issue,
  TeamId,
} from "../domain/types";
import {
  analyzeCrossDivisionPriority,
  toCrossDivisionPairKey,
} from "../../crossDivisionPriority";
import { effectiveWeeks, groupSizes, hasMultipleDivisions } from "../domain/groups";

// ---- helpers ----

function pairKey(a: TeamId, b: TeamId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Ordered sequence of a team's games across weeks (bye weeks omitted).
function teamGameSequence(
  schedule: EngineSchedule,
  teamId: TeamId,
): Array<{ week: number; game: EngineGame }> {
  const out: Array<{ week: number; game: EngineGame }> = [];
  for (const week of schedule.weeks) {
    for (const game of week.games) {
      if (game.a === teamId || game.b === teamId) {
        out.push({ week: week.weekNumber, game });
      }
    }
  }
  return out;
}

function isHomeFor(game: EngineGame, teamId: TeamId): boolean | null {
  if (game.homeTeamId == null) return null;
  return game.homeTeamId === teamId;
}

// ---- Tier 1: hard structural ----

const oneGamePerWeek: Constraint = {
  id: "one-game-per-week",
  tier: "hard",
  weight: 0,
  appliesTo: () => true,
  check(schedule) {
    const issues: Issue[] = [];
    for (const week of schedule.weeks) {
      const seen = new Set<TeamId>();
      for (const game of week.games) {
        for (const t of [game.a, game.b]) {
          if (seen.has(t)) {
            issues.push({
              code: "ONE_GAME_PER_WEEK",
              message: `Team ${t} appears in more than one game in week ${week.weekNumber}.`,
              teamId: t,
              week: week.weekNumber,
            });
          }
          seen.add(t);
        }
      }
    }
    return issues;
  },
};

const noSelfMatch: Constraint = {
  id: "no-self-match",
  tier: "hard",
  weight: 0,
  appliesTo: () => true,
  check(schedule) {
    const issues: Issue[] = [];
    for (const week of schedule.weeks) {
      for (const game of week.games) {
        if (game.a === game.b) {
          issues.push({
            code: "NO_SELF_MATCH",
            message: `Team ${game.a} is scheduled against itself in week ${week.weekNumber}.`,
            teamId: game.a,
            week: week.weekNumber,
          });
        }
      }
    }
    return issues;
  },
};

const matchupMultiset: Constraint = {
  id: "matchup-multiset",
  tier: "hard",
  weight: 0,
  appliesTo: () => true,
  check(schedule, ctx) {
    const issues: Issue[] = [];
    const target = new Map<string, number>();
    for (const pair of ctx.inventory.pairs) {
      target.set(pairKey(pair.a, pair.b), pair.count);
    }
    const realized = new Map<string, number>();
    for (const week of schedule.weeks) {
      for (const game of week.games) {
        const k = pairKey(game.a, game.b);
        realized.set(k, (realized.get(k) ?? 0) + 1);
      }
    }
    for (const [k, count] of target) {
      const got = realized.get(k) ?? 0;
      if (got !== count) {
        issues.push({
          code: "MATCHUP_MULTISET",
          message: `Pairing ${k} should occur ${count}× but occurs ${got}×.`,
        });
      }
    }
    for (const [k, got] of realized) {
      if (!target.has(k)) {
        issues.push({
          code: "MATCHUP_MULTISET_EXTRA",
          message: `Pairing ${k} occurs ${got}× but is not in the required inventory.`,
        });
      }
    }
    return issues;
  },
};

// Each team is present or on bye every week, so its byes must equal
// effectiveWeeks − games. This structural quota covers all three bye sources
// uniformly: explicit user byes (divisional, where effectiveWeeks − degree
// resolves to settings.byesPerTeam by construction), odd-participant structural
// byes (round robin / pool play, where settings.byesPerTeam is 0 but a team
// still sits out parity-forced weeks), and zero-bye formats. Grading against the
// flat settings.byesPerTeam instead used to raise false hard failures on every
// odd-team round-robin and odd-size-pool schedule.
const byeCount: Constraint = {
  id: "bye-count",
  tier: "hard",
  weight: 0,
  appliesTo: () => true,
  check(schedule, ctx) {
    const issues: Issue[] = [];
    const W = effectiveWeeks(ctx.input);
    const byes = new Map<TeamId, number>();
    for (const t of ctx.input.teams) byes.set(t.id, 0);
    for (const week of schedule.weeks) {
      for (const t of week.byes) byes.set(t, (byes.get(t) ?? 0) + 1);
    }
    for (const [teamId, got] of byes) {
      const want = W - (ctx.gamesPerTeam.get(teamId) ?? 0);
      if (got !== want) {
        issues.push({
          code: "BYE_COUNT",
          message: `Team ${teamId} has ${got} byes but should have ${want} (weeks ${W} − games).`,
          teamId,
        });
      }
    }
    return issues;
  },
};

const homeAwayTotals: Constraint = {
  id: "home-away-totals",
  tier: "hard",
  weight: 0,
  appliesTo: () => true,
  check(schedule, ctx) {
    const issues: Issue[] = [];
    const homeCount = new Map<TeamId, number>();
    for (const t of ctx.input.teams) homeCount.set(t.id, 0);
    for (const week of schedule.weeks) {
      for (const game of week.games) {
        if (game.homeTeamId != null) {
          homeCount.set(game.homeTeamId, (homeCount.get(game.homeTeamId) ?? 0) + 1);
        }
      }
    }
    for (const [teamId, target] of ctx.targetHomeCounts) {
      const got = homeCount.get(teamId) ?? 0;
      if (got !== target) {
        issues.push({
          code: "HOME_AWAY_TOTALS",
          message: `Team ${teamId} has ${got} home games but the allocation requires ${target}.`,
          teamId,
        });
      }
    }
    return issues;
  },
};

// Per-pairing home/away balance. A pair meeting n times must split its home
// games floor(n/2) / ceil(n/2): even n → exactly equal, odd n → differ by one,
// NEVER all on one side (a 3-game series is 2-1 or 1-2, never 3-0). The §5
// allocation and `home-away-totals` only govern each team's SEASON total, so
// without this a series can legally land all-home for one side while totals still
// balance — the defect this constraint pins. Orientation (phases/orientation)
// enforces it structurally; this validator is the audit-grade guarantee.
const homeAwaySeriesBalance: Constraint = {
  id: "home-away-series-balance",
  tier: "hard",
  weight: 0,
  appliesTo: () => true,
  check(schedule) {
    const issues: Issue[] = [];
    // pairKey -> { total, home: Map<teamId, count> }
    const series = new Map<string, { total: number; home: Map<TeamId, number> }>();
    for (const week of schedule.weeks) {
      for (const game of week.games) {
        const k = pairKey(game.a, game.b);
        let rec = series.get(k);
        if (!rec) {
          rec = { total: 0, home: new Map() };
          series.set(k, rec);
        }
        rec.total += 1;
        if (game.homeTeamId != null) {
          rec.home.set(game.homeTeamId, (rec.home.get(game.homeTeamId) ?? 0) + 1);
        }
      }
    }
    for (const [k, rec] of series) {
      if (rec.total < 2) continue; // a single meeting is trivially balanced
      const counts = [...rec.home.values()];
      const hi = counts.length ? Math.max(...counts) : rec.total;
      const lo = counts.length ? Math.min(...counts) : 0;
      // both sides must appear; spread may exceed 1 only when total is odd? no —
      // odd allows spread exactly 1, even requires spread 0. Ideal spread = n%2.
      const spread = rec.home.size < 2 ? rec.total : hi - lo;
      if (spread > rec.total % 2) {
        const [a, b] = k.split("|");
        issues.push({
          code: "HOME_AWAY_SERIES_BALANCE",
          message: `Pairing ${a}/${b} meets ${rec.total}× but its home split (${rec.home.get(a) ?? 0}-${rec.home.get(b) ?? 0}) is not balanced floor/ceil.`,
        });
      }
    }
    return issues;
  },
};

// ---- Tier 2: fairness (hard by default; relaxed mode raises caps) ----

function effectiveStreakCap(base: number, relax: boolean): number {
  return relax ? base + 2 : base;
}

const maxHomeAwayStreak: Constraint = {
  id: "max-home-away-streak",
  tier: "fairness",
  weight: 0,
  appliesTo: () => true,
  check(schedule, ctx) {
    const issues: Issue[] = [];
    const cap = effectiveStreakCap(
      ctx.input.settings.maxHomeAwayStreak,
      ctx.input.settings.relaxStreaks,
    );
    for (const team of ctx.input.teams) {
      const seq = teamGameSequence(schedule, team.id);
      let run = 0;
      let prev: boolean | null = null;
      for (const { game } of seq) {
        const home = isHomeFor(game, team.id);
        if (home == null) continue;
        if (home === prev) run += 1;
        else {
          run = 1;
          prev = home;
        }
        if (run > cap) {
          issues.push({
            code: "MAX_HOME_AWAY_STREAK",
            message: `Team ${team.id} exceeds the ${cap}-game ${home ? "home" : "away"} streak cap.`,
            teamId: team.id,
          });
          break;
        }
      }
    }
    return issues;
  },
};

const maxDivisionalStreak: Constraint = {
  id: "max-divisional-streak",
  tier: "fairness",
  weight: 0,
  appliesTo: (fmt) => fmt === "fantasy_nfl_divisional" || fmt === "divisional_league",
  check(schedule, ctx) {
    const issues: Issue[] = [];
    // Single-division leagues have only divisional games, so the streak cap is
    // structurally unsatisfiable and meaningless — skip it.
    if (!hasMultipleDivisions(ctx.input.teams)) return issues;
    const cap = effectiveStreakCap(
      ctx.input.settings.maxDivisionalStreak,
      ctx.input.settings.relaxStreaks,
    );
    for (const team of ctx.input.teams) {
      const seq = teamGameSequence(schedule, team.id);
      let run = 0;
      for (const { game } of seq) {
        if (game.kind === "div") run += 1;
        else run = 0;
        if (run > cap) {
          issues.push({
            code: "MAX_DIVISIONAL_STREAK",
            message: `Team ${team.id} exceeds the ${cap}-game divisional streak cap.`,
            teamId: team.id,
          });
          break;
        }
      }
    }
    return issues;
  },
};

const preventImmediateRematch: Constraint = {
  id: "prevent-immediate-rematch",
  tier: "fairness",
  weight: 0,
  appliesTo: () => true,
  check(schedule, ctx) {
    if (!ctx.input.settings.preventImmediateRematches) return [];
    const issues: Issue[] = [];
    const weeks = [...schedule.weeks].sort((x, y) => x.weekNumber - y.weekNumber);
    // opponent map per week
    const oppByWeek = new Map<number, Map<TeamId, TeamId>>();
    for (const week of weeks) {
      const m = new Map<TeamId, TeamId>();
      for (const game of week.games) {
        m.set(game.a, game.b);
        m.set(game.b, game.a);
      }
      oppByWeek.set(week.weekNumber, m);
    }
    for (let i = 0; i < weeks.length - 1; i += 1) {
      const cur = oppByWeek.get(weeks[i].weekNumber)!;
      const nxt = oppByWeek.get(weeks[i + 1].weekNumber)!;
      for (const [team, opp] of cur) {
        if (nxt.get(team) === opp) {
          issues.push({
            code: "IMMEDIATE_REMATCH",
            message: `Team ${team} faces ${opp} in back-to-back weeks ${weeks[i].weekNumber}-${weeks[i + 1].weekNumber}.`,
            teamId: team,
            week: weeks[i + 1].weekNumber,
          });
        }
      }
    }
    return issues;
  },
};

const byeWindow: Constraint = {
  id: "bye-window",
  tier: "fairness",
  weight: 0,
  appliesTo: () => true,
  check(schedule, ctx) {
    const placement = ctx.input.settings.byeWeekPlacement;
    if (placement !== "middle_only") return []; // prefer_middle/anywhere are soft
    const issues: Issue[] = [];
    const total = ctx.input.settings.weeks;
    const lo = Math.floor(total * 0.25) + 1;
    const hi = Math.ceil(total * 0.75);
    for (const week of schedule.weeks) {
      if (week.byes.length === 0) continue;
      if (week.weekNumber < lo || week.weekNumber > hi) {
        for (const t of week.byes) {
          issues.push({
            code: "BYE_WINDOW",
            message: `Team ${t} byes in week ${week.weekNumber}, outside the middle-only window ${lo}-${hi}.`,
            teamId: t,
            week: week.weekNumber,
          });
        }
      }
    }
    return issues;
  },
};

// Balanced coverage for single-league round robins: a team must face every other
// team once before any rematch (and twice before any third meeting, etc.). Week
// ORDER is the lever, so it is a fairness violation. Mirrors the generator
// harness's assertCoverageBeforeRepeats.
const coverageBeforeRepeats: Constraint = {
  id: "coverage-before-repeats",
  tier: "fairness",
  weight: 0,
  appliesTo: (fmt) => fmt === "fantasy_nfl_divisional" || fmt === "round_robin_classic",
  check(schedule, ctx) {
    // Only single-league schedules are pure round robins; multi-division fantasy
    // mixes divisional + cross games and has no such ordering property.
    if (
      ctx.input.format === "fantasy_nfl_divisional" &&
      hasMultipleDivisions(ctx.input.teams)
    ) {
      return [];
    }
    const issues: Issue[] = [];
    const teamIds = ctx.input.teams.map((t) => t.id);
    const counts = new Map<TeamId, Map<TeamId, number>>();
    for (const id of teamIds) counts.set(id, new Map());
    const weeks = [...schedule.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    for (const week of weeks) {
      for (const game of week.games) {
        for (const [team, opp] of [
          [game.a, game.b],
          [game.b, game.a],
        ] as const) {
          const teamCounts = counts.get(team)!;
          teamCounts.set(opp, (teamCounts.get(opp) ?? 0) + 1);
          let minOthers = Infinity;
          for (const other of teamIds) {
            if (other === team || other === opp) continue;
            minOthers = Math.min(minOthers, teamCounts.get(other) ?? 0);
          }
          if (minOthers === Infinity) minOthers = 0;
          if ((teamCounts.get(opp) ?? 0) - minOthers > 1) {
            issues.push({
              code: "COVERAGE_BEFORE_REPEATS",
              message: `Team ${team} faces ${opp} again before covering the rest of the league.`,
              teamId: team,
              week: week.weekNumber,
            });
          }
        }
      }
    }
    return issues;
  },
};

const crossDivisionPriority: Constraint = {
  id: "cross-division-priority",
  tier: "fairness",
  weight: 0,
  appliesTo: (fmt) => fmt === "fantasy_nfl_divisional" || fmt === "divisional_league",
  check(schedule, ctx) {
    // "more_flexible" cross variety intentionally trades away the strict
    // same-seed / distinct-before-repeat priority order for fewer, more
    // concentrated cross opponents — so priority breaks are expected, not faults.
    if (ctx.input.settings.crossDivisionVariety === "more_flexible") return [];
    const pairCounts = new Map<string, number>();
    for (const week of schedule.weeks) {
      for (const game of week.games) {
        if (game.kind !== "cross") continue;
        const key = toCrossDivisionPairKey(game.a, game.b);
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
    // The fantasy final-week rule deliberately pairs the two divisions' bottom
    // seeds cross-division, which can break same-seed priority when the odd
    // divisions differ in size. That is an intentional exception (bottom-vs-
    // bottom final-week cross > same-seed priority), so subtract the reserved
    // games from the accounting before judging priority compliance.
    for (const { a, b } of ctx.inventory.reservedFinalCrossPairs ?? []) {
      const key = toCrossDivisionPairKey(a, b);
      const cur = pairCounts.get(key);
      if (cur == null) continue;
      if (cur <= 1) pairCounts.delete(key);
      else pairCounts.set(key, cur - 1);
    }
    const analysis = analyzeCrossDivisionPriority(ctx.input.teams, pairCounts);
    const issues: Issue[] = [];
    for (const summary of analysis.teamSummaries) {
      if (summary.isPriorityCompliant) continue;
      issues.push({
        code: "CROSS_DIVISION_PRIORITY",
        message: `Team ${summary.teamId} breaks cross-division priority order.`,
        teamId: summary.teamId,
      });
    }
    return issues;
  },
};

// ---- End-of-season divisional concentration ("SEC football" closing block) ----
// Drives a divisional-only FINAL WEEK, in two cases that both want it:
//   • divisionalPlacement === "end" — a contiguous run of divisional-only weeks
//     closes the season (college-conference / SEC-style closing rivalry weeks).
//   • regularSeasonFinalWeekDivisional — an otherwise-regular ending whose last
//     regular-season week is divisional-heavy.
// Both reduce to "the last week must be divisional-only". Enforcing it at the
// fairness tier (not soft) is what makes it effective: soft scorers only break
// ties within a single attempt and can't add divisional games a placement never
// clustered, whereas a fairness violation steers the seeded-restart selection
// toward an attempt whose placement CAN end on an all-divisional week, then the
// Phase-4 reorderer moves that week last.
const closingDivisionalBlock: Constraint = {
  id: "closing-divisional-block",
  tier: "fairness",
  weight: 0,
  // divisional_league only: fantasy uses its own divisional-heavy closing rule
  // with a carve-out for odd division sizes (where an all-divisional final week
  // is structurally impossible), so a hard block here would be unsatisfiable.
  appliesTo: (fmt) => fmt === "divisional_league",
  check(schedule, ctx) {
    if (
      ctx.input.settings.divisionalPlacement !== "end" &&
      !ctx.input.settings.regularSeasonFinalWeekDivisional
    ) {
      return [];
    }
    const weeks = [...schedule.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    const isDivisionalWeek = (w: EngineWeek) =>
      w.games.length > 0 && w.games.every((g) => g.kind === "div");
    // The final week must be divisional-only; any non-divisional game after the
    // closing block has begun is a violation.
    const last = weeks[weeks.length - 1];
    if (!last || !isDivisionalWeek(last)) {
      return [
        {
          code: "CLOSING_DIVISIONAL_BLOCK",
          message: "Season does not end with a divisional-only week.",
          week: last?.weekNumber,
        },
      ];
    }
    return [];
  },
};

// ---- Fantasy final-week divisional rule -------------------------------------
// Fantasy is bye-free, so within a division teams pair up in-division and every
// odd-sized division leaves one team that must play cross. These two fairness
// constraints make the FINAL week as divisional as the league shape allows and
// push the unavoidable cross game(s) onto the weakest teams:
//   1. the last week has exactly L/2 cross games (L = # odd divisions), and each
//      is one of the reserved bottom-vs-bottom pairings (Phase-1 inventory);
//   2. every team in a final-week cross game plays a divisional game the week
//      before, so it still gets a season-ending divisional matchup.
// Fairness tier (not soft) so a miss steers seeded-restart selection toward an
// attempt whose placement CAN end this way, then Phase-4 reorder lands the
// reserved slates last. Best-effort: an unreachable shape simply degrades to a
// warning (placement already falls back to an unreserved schedule).
function sortedWeeks(schedule: EngineSchedule): EngineWeek[] {
  return [...schedule.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
}

const fantasyFinalWeekDivisional: Constraint = {
  id: "fantasy-final-week-divisional",
  tier: "fairness",
  weight: 0,
  appliesTo: (fmt) => fmt === "fantasy_nfl_divisional",
  check(schedule, ctx) {
    if (!ctx.input.settings.regularSeasonFinalWeekDivisional) return [];
    if (!hasMultipleDivisions(ctx.input.teams)) return [];
    const weeks = sortedWeeks(schedule);
    const last = weeks[weeks.length - 1];
    if (!last || last.games.length === 0) return [];
    const oddDivisions = groupSizes(ctx.input.teams).filter((n) => n % 2 === 1).length;
    const expectedCross = Math.floor(oddDivisions / 2);
    const crossGames = last.games.filter((g) => g.kind === "cross");
    const issues: Issue[] = [];
    if (crossGames.length !== expectedCross) {
      issues.push({
        code: "FINAL_WEEK_NOT_MAX_DIVISIONAL",
        message: `Final week has ${crossGames.length} cross-division game(s); the league shape allows only ${expectedCross}.`,
        week: last.weekNumber,
      });
    }
    const reservedKeys = new Set(
      (ctx.inventory.reservedFinalCrossPairs ?? []).map(({ a, b }) => pairKey(a, b)),
    );
    for (const g of crossGames) {
      if (!reservedKeys.has(pairKey(g.a, g.b))) {
        issues.push({
          code: "FINAL_WEEK_CROSS_NOT_BOTTOM_SEED",
          message:
            "Final-week cross game is not between the two divisions' lowest-ranked teams.",
          week: last.weekNumber,
        });
      }
    }
    return issues;
  },
};

const fantasyFinalCrossRipple: Constraint = {
  id: "fantasy-final-cross-ripple",
  tier: "fairness",
  weight: 0,
  appliesTo: (fmt) => fmt === "fantasy_nfl_divisional",
  check(schedule, ctx) {
    if (!ctx.input.settings.regularSeasonFinalWeekDivisional) return [];
    if (!hasMultipleDivisions(ctx.input.teams)) return [];
    const weeks = sortedWeeks(schedule);
    const last = weeks[weeks.length - 1];
    const penult = weeks[weeks.length - 2];
    if (!last || !penult) return [];
    const crossTeams = new Set<TeamId>();
    for (const g of last.games) {
      if (g.kind === "cross") {
        crossTeams.add(g.a);
        crossTeams.add(g.b);
      }
    }
    const issues: Issue[] = [];
    for (const teamId of crossTeams) {
      const game = penult.games.find((g) => g.a === teamId || g.b === teamId);
      if (!game || game.kind !== "div") {
        issues.push({
          code: "FINAL_CROSS_RIPPLE_MISSING",
          message: `Team ${teamId} plays a final-week cross game but not a divisional game the week before.`,
          teamId,
          week: penult.weekNumber,
        });
      }
    }
    return issues;
  },
};

// ---- Tier 3: soft (scored 0..1, never block) ----

function matchupSeed(ctx: ConstraintContext, teamId: TeamId, useOpeningWeekSeed = false): number {
  const team = ctx.teamsById.get(teamId);
  if (!team) return 999;
  return useOpeningWeekSeed ? team.openingWeekSeed ?? team.overallSeed : team.overallSeed;
}

function engineMatchupRating(ctx: ConstraintContext, teamA: TeamId, teamB: TeamId, useOpeningWeekSeed = false) {
  const rankA = matchupSeed(ctx, teamA, useOpeningWeekSeed);
  const rankB = matchupSeed(ctx, teamB, useOpeningWeekSeed);
  return Math.round(((rankA + rankB) / 2 + 2.2 * Math.abs(rankA - rankB)) * 10) / 10;
}

// The optimizer uses the same lower-is-better matchup formula as the workspace.
// A week's best game is normalized against the candidate schedule's full rating
// range, so genuine top-vs-top games pull opening, final, and Thanksgiving weeks.
function weekMarqueeScore(schedule: EngineSchedule, ctx: ConstraintContext, weekNumber: number, useOpeningWeekSeed = false): number {
  const week = schedule.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week || week.games.length === 0) return 0;
  const scheduleRatings = schedule.weeks.flatMap((candidateWeek) => candidateWeek.games.map((game) => engineMatchupRating(ctx, game.a, game.b, useOpeningWeekSeed)));
  const min = Math.min(...scheduleRatings);
  const max = Math.max(...scheduleRatings);
  if (max === min) return 0.5;
  const bestWeekRating = Math.min(...week.games.map((game) => engineMatchupRating(ctx, game.a, game.b, useOpeningWeekSeed)));
  return 1 - (bestWeekRating - min) / (max - min);
}

const finalWeekMarquee: Constraint = {
  id: "final-week-marquee",
  tier: "soft",
  weight: 1,
  appliesTo: () => true,
  score(schedule, ctx) {
    if (!ctx.input.settings.prioritizeFinalWeekTopFive) return 0.5;
    const last = Math.max(...schedule.weeks.map((w) => w.weekNumber));
    return weekMarqueeScore(schedule, ctx, last);
  },
};

const openingWeekMarquee: Constraint = {
  id: "opening-week-marquee",
  tier: "soft",
  weight: 1,
  appliesTo: () => true,
  score(schedule, ctx) {
    if (!ctx.input.settings.prioritizeOpeningWeekTopFive) return 0.5;
    return weekMarqueeScore(schedule, ctx, 1, true);
  },
};

const thanksgivingStrength: Constraint = {
  id: "thanksgiving-window-strength",
  tier: "soft",
  weight: 1,
  appliesTo: (fmt) => fmt === "fantasy_nfl_divisional",
  score(schedule, ctx) {
    if (!ctx.input.settings.prioritizeThanksgivingWindow) return 0.5;
    // With a locked season year the wizard resolves the EXACT Thanksgiving week
    // (4th Thursday of November → its NFL week), so reward a marquee slate in that
    // single week. Without a season year (thanksgivingWeek null) fall back to the
    // legacy fixed 12–13 window.
    const tgWeek = ctx.input.settings.thanksgivingWeek;
    if (tgWeek != null) return weekMarqueeScore(schedule, ctx, tgWeek);
    return (weekMarqueeScore(schedule, ctx, 12) + weekMarqueeScore(schedule, ctx, 13)) / 2;
  },
};

const finalWeekDivisional: Constraint = {
  id: "final-week-divisional",
  tier: "soft",
  weight: 1.5,
  appliesTo: (fmt) => fmt === "fantasy_nfl_divisional" || fmt === "divisional_league",
  score(schedule, ctx) {
    // Gated on the toggle: only pull divisional games into the final week when
    // the user asked for a divisional-heavy regular-season finish. Otherwise the
    // scorer is neutral so week order is free for the other soft preferences.
    if (!ctx.input.settings.regularSeasonFinalWeekDivisional) return 0.5;
    const last = Math.max(...schedule.weeks.map((w) => w.weekNumber));
    const week = schedule.weeks.find((w) => w.weekNumber === last);
    if (!week || week.games.length === 0) return 0;
    const div = week.games.filter((g) => g.kind === "div").length;
    return div / week.games.length;
  },
};

const divisionalFinishStrength: Constraint = {
  id: "divisional-finish-strength",
  tier: "soft",
  weight: 1,
  appliesTo: (fmt) => fmt === "divisional_league",
  score(schedule, ctx) {
    const strength = ctx.input.settings.divisionalFinishStrength;
    if (strength === "spread_out") return 0.5;
    // reward divisional games landing in the final third
    const last = Math.max(...schedule.weeks.map((w) => w.weekNumber));
    const cut = Math.ceil(last * (2 / 3));
    let divTotal = 0;
    let divLate = 0;
    for (const week of schedule.weeks) {
      for (const game of week.games) {
        if (game.kind === "div") {
          divTotal += 1;
          if (week.weekNumber > cut) divLate += 1;
        }
      }
    }
    return divTotal === 0 ? 0.5 : divLate / divTotal;
  },
};

// How "grouped" each team's divisional-vs-cross games are across the season:
// per team, 1 − (kind transitions / max transitions) over its game sequence in
// week order (1 = one contiguous run of each kind, 0 = alternating every week).
// Averaged over teams that play both kinds. Week ORDER is the lever, so this is a
// gradient the Phase-4 reorderer can climb in either direction.
function divisionalGroupingScore(schedule: EngineSchedule): number {
  const weeks = [...schedule.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const teams = new Set<TeamId>();
  for (const w of weeks) for (const g of w.games) { teams.add(g.a); teams.add(g.b); }
  let acc = 0;
  let counted = 0;
  for (const team of teams) {
    const kinds: string[] = [];
    for (const w of weeks) {
      const g = w.games.find((x) => x.a === team || x.b === team);
      if (g) kinds.push(g.kind === "div" ? "d" : "x");
    }
    if (kinds.length < 2) continue;
    let transitions = 0;
    for (let i = 1; i < kinds.length; i += 1) if (kinds[i] !== kinds[i - 1]) transitions += 1;
    acc += 1 - transitions / (kinds.length - 1);
    counted += 1;
  }
  return counted === 0 ? 0.5 : acc / counted;
}

// seasonFlowStyle: shape how clustered a team's divisional vs cross games are
// across the season. "more_grouped" rewards long same-kind runs, "more_mixed"
// rewards alternation, "balanced" is neutral (leaves week order to the other
// preferences). Weight 2 so it outranks the single competing divisional-finish
// scorer when the user has expressed a flow preference.
const seasonFlow: Constraint = {
  id: "season-flow-style",
  tier: "soft",
  weight: 2,
  appliesTo: (fmt) => fmt === "fantasy_nfl_divisional" || fmt === "divisional_league",
  score(schedule, ctx) {
    const style = ctx.input.settings.seasonFlowStyle;
    if (style === "balanced") return 0.5;
    const grouping = divisionalGroupingScore(schedule);
    return style === "more_grouped" ? grouping : 1 - grouping;
  },
};

export const CONSTRAINTS: Constraint[] = [
  // hard
  oneGamePerWeek,
  noSelfMatch,
  matchupMultiset,
  byeCount,
  homeAwayTotals,
  homeAwaySeriesBalance,
  // fairness
  maxHomeAwayStreak,
  maxDivisionalStreak,
  preventImmediateRematch,
  byeWindow,
  coverageBeforeRepeats,
  crossDivisionPriority,
  closingDivisionalBlock,
  fantasyFinalWeekDivisional,
  fantasyFinalCrossRipple,
  // soft
  finalWeekMarquee,
  openingWeekMarquee,
  thanksgivingStrength,
  finalWeekDivisional,
  divisionalFinishStrength,
  seasonFlow,
];

export function constraintsFor(fmt: FormatKey, tier?: "hard" | "fairness" | "soft") {
  return CONSTRAINTS.filter(
    (c) => c.appliesTo(fmt) && (tier ? c.tier === tier : true),
  );
}

export interface ValidationOutcome {
  hardIssues: Issue[];
  fairnessIssues: Issue[];
  softScores: Array<{ id: string; weight: number; score: number }>;
}

export function validateSchedule(
  schedule: EngineSchedule,
  ctx: ConstraintContext,
): ValidationOutcome {
  const fmt = ctx.input.format;
  const hardIssues: Issue[] = [];
  const fairnessIssues: Issue[] = [];
  const softScores: Array<{ id: string; weight: number; score: number }> = [];

  for (const c of CONSTRAINTS) {
    if (!c.appliesTo(fmt)) continue;
    if (c.tier === "hard" && c.check) {
      hardIssues.push(...c.check(schedule, ctx));
    } else if (c.tier === "fairness" && c.check) {
      fairnessIssues.push(...c.check(schedule, ctx));
    } else if (c.tier === "soft" && c.score) {
      softScores.push({ id: c.id, weight: c.weight, score: c.score(schedule, ctx) });
    }
  }

  return { hardIssues, fairnessIssues, softScores };
}
