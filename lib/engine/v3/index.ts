import {
  ConstraintContext,
  EngineInput,
  EngineResult,
  EngineSchedule,
  MatchupInventory,
} from "./domain/types";
import { validateSchedule, ValidationOutcome } from "./constraints/registry";
import { buildTeamsById, groupTeams } from "./domain/groups";
import { checkFeasibility } from "./phases/feasibility";
import { buildInventory } from "./phases/inventory";
import { placeSchedule } from "./phases/placement";
import { buildRoundRobinSchedule } from "./phases/roundRobin";
import {
  computeTargetHomeCounts,
  degreeByTeam,
  orientSchedule,
} from "./phases/orientation";
import { optimizeSchedule } from "./phases/optimize";
import { repairHomeAwayStreaks } from "./phases/streakRepair";
import { buildReport } from "./phases/report";
import { createSeededRng } from "./rng";

export class EngineInfeasibleError extends Error {
  reasons: string[];
  suggestions: string[];
  constructor(reasons: string[], suggestions: string[]) {
    super(reasons.join(" "));
    this.name = "EngineInfeasibleError";
    this.reasons = reasons;
    this.suggestions = suggestions;
  }
}

export interface RunOptions {
  seed?: string | number;
  maxAttempts?: number;
  timeBudgetMs?: number; // hard ceiling for the whole run (default 150s, spec: <3min)
}

interface Candidate {
  schedule: EngineSchedule;
  ctx: ConstraintContext;
  fairnessViolations: number;
  softScore: number;
}

// Single-league round-robin shape: every game is intra-league, so the schedule
// is a pure round robin and is generated canonically (see phases/roundRobin) to
// guarantee balanced coverage before repeats and no back-to-back rematches. Two
// configs qualify:
//   • fantasy with only one division (or "no divisions"), and
//   • season-length classic round robin.
// The circle-method builder is even-team-only; both configs are even by the time
// they reach here (fantasy requires an even count; season-length round robin is
// rejected at Phase 0 for odd counts), so the builder always applies. Classic
// cycle-count mode stays on the placement path — it can be odd-team (structural
// byes), which the builder does not handle, and it already meets coverage.
function isSingleDivisionRoundRobin(input: EngineInput): boolean {
  if (
    input.format === "fantasy_nfl_divisional" &&
    groupTeams(input.teams).size <= 1
  ) {
    return true;
  }
  return (
    input.format === "round_robin_classic" &&
    input.settings.classicRoundRobinMode === "season_length"
  );
}

// The canonical builder tags every game with the format's single intra-league
// kind: fantasy games are "div"; classic round-robin games are "round_robin".
function canonicalRoundRobinKind(input: EngineInput): "div" | "round_robin" {
  return input.format === "round_robin_classic" ? "round_robin" : "div";
}

// Weighted mean of the soft scorers (0..1), matching optimize's softObjective.
function softScoreOf(outcome: ValidationOutcome): number {
  let weight = 0;
  let acc = 0;
  for (const s of outcome.softScores) {
    weight += s.weight;
    acc += s.weight * s.score;
  }
  return weight === 0 ? 0.5 : acc / weight;
}

// Full v3 pipeline with seeded restarts. Phases 0–5. Returns the first schedule
// with zero fairness violations, else the best found (surfaced via warnings).
export function runEngine(input: EngineInput, options: RunOptions = {}): EngineResult {
  const verdict = checkFeasibility(input);
  if (!verdict.ok) throw new EngineInfeasibleError(verdict.reasons, verdict.suggestions);

  const seedBase = String(options.seed ?? "v3");
  const maxAttempts = Math.max(1, options.maxAttempts ?? 60);
  const timeBudgetMs = Math.max(1_000, options.timeBudgetMs ?? 150_000);
  const start = Date.now();

  let placedAny = false;
  let best: Candidate | null = null;
  const canonicalRoundRobin = isSingleDivisionRoundRobin(input);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (Date.now() - start > timeBudgetMs) break;
    const rng = createSeededRng(`${seedBase}::${attempt}`);

    let inventory: MatchupInventory | null;
    let placed: EngineSchedule | null;
    if (canonicalRoundRobin) {
      const built = buildRoundRobinSchedule(
        input,
        input.teams.map((t) => t.id),
        input.settings.weeks,
        canonicalRoundRobinKind(input),
        rng,
      );
      inventory = built?.inventory ?? null;
      placed = built?.schedule ?? null;
    } else {
      inventory = buildInventory(input, rng);
      if (!inventory) continue;
      placed = placeSchedule(input, inventory, rng);
    }
    if (!inventory || !placed) continue;
    placedAny = true;

    const degree = degreeByTeam(placed);
    const targetHomeCounts = computeTargetHomeCounts(input, degree);
    if (!orientSchedule(placed, targetHomeCounts)) continue;

    const ctx: ConstraintContext = {
      input,
      teamsById: buildTeamsById(input.teams),
      gamesPerTeam: degree,
      inventory,
      targetHomeCounts,
    };

    let candidate: Candidate;
    if (canonicalRoundRobin) {
      // Canonical order already satisfies coverage-before-repeats and produces no
      // back-to-back rematches; the SA reorder can only jeopardize those, so
      // score the placed order directly instead of optimizing week order. The
      // max-flow orientation hits every home total but ignores home/away runs, so
      // repair streaks first via totals-preserving cycle reversals (see
      // phases/streakRepair) — the only remaining fairness lever on this path.
      const streakCap = input.settings.relaxStreaks
        ? input.settings.maxHomeAwayStreak + 2
        : input.settings.maxHomeAwayStreak;
      repairHomeAwayStreaks(placed, streakCap, rng);
      const outcome = validateSchedule(placed, ctx);
      candidate = {
        schedule: placed,
        ctx,
        fairnessViolations: outcome.fairnessIssues.length,
        softScore: softScoreOf(outcome),
      };
    } else {
      const remaining = timeBudgetMs - (Date.now() - start);
      const perAttemptBudget = Math.max(1_000, Math.min(20_000, remaining));
      const opt = optimizeSchedule(placed, ctx, rng, { timeBudgetMs: perAttemptBudget });
      candidate = {
        schedule: opt.schedule,
        ctx,
        fairnessViolations: opt.fairnessViolations,
        softScore: opt.softScore,
      };
    }
    if (
      !best ||
      candidate.fairnessViolations < best.fairnessViolations ||
      (candidate.fairnessViolations === best.fairnessViolations &&
        candidate.softScore > best.softScore)
    ) {
      best = candidate;
    }
    if (candidate.fairnessViolations === 0) break;
  }

  if (!best) {
    if (!placedAny) {
      throw new EngineInfeasibleError(
        ["The scheduler could not build a valid matchup set for this configuration."],
        ["Try adjusting team counts, divisions, weeks, or byes."],
      );
    }
    throw new EngineInfeasibleError(
      ["The scheduler could not orient home/away games for this configuration."],
      ["Try a different seed or relax home/away balance settings."],
    );
  }

  const report = buildReport(best.schedule, best.ctx);
  return {
    schedule: best.schedule,
    warnings: report.warnings,
    softReport: report.softReport,
    hardPass: report.hardPass,
    seedUsed: seedBase,
    phaseName: best.fairnessViolations === 0 ? "optimized" : "best-effort",
  };
}
