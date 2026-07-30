import { ConstraintContext, EngineSchedule, EngineWeek } from "../domain/types";
import { constraintsFor } from "../constraints/registry";
import { SeededRng } from "../rng";
import { repairHomeAwayStreaks } from "./streakRepair";

// Phase 4 cost: fairness violations dominate (they are hard, surfaced as
// warnings only if unbeatable), then the weighted soft objective. Week ORDER is
// the only lever here — it is feasibility-preserving for every Tier-1 constraint
// (counts, multiset, byes, home/away totals are all order-invariant), while
// streaks, immediate-rematch, bye-window, and the soft scorers all depend on it.
const FAIRNESS_PENALTY = 10_000;

function softObjective(schedule: EngineSchedule, ctx: ConstraintContext): number {
  const soft = constraintsFor(ctx.input.format, "soft");
  let weight = 0;
  let acc = 0;
  for (const c of soft) {
    if (!c.score) continue;
    weight += c.weight;
    acc += c.weight * c.score(schedule, ctx);
  }
  return weight === 0 ? 0.5 : acc / weight; // higher is better, 0..1
}

function fairnessViolations(schedule: EngineSchedule, ctx: ConstraintContext): number {
  let count = 0;
  for (const c of constraintsFor(ctx.input.format, "fairness")) {
    if (c.check) count += c.check(schedule, ctx).length;
  }
  return count;
}

// Lower is better.
function cost(schedule: EngineSchedule, ctx: ConstraintContext): number {
  return fairnessViolations(schedule, ctx) * FAIRNESS_PENALTY + (1 - softObjective(schedule, ctx));
}

// Renumber weeks to their array position (1-based) so weekNumber-dependent
// constraints (final/opening/Thanksgiving/bye-window) read the new order.
function renumber(weeks: EngineWeek[]): EngineWeek[] {
  return weeks.map((w, i) => ({ ...w, weekNumber: i + 1 }));
}

export interface OptimizeResult {
  schedule: EngineSchedule;
  fairnessViolations: number;
  softScore: number;
}

// Deep-copy weeks (and their games) so optimize owns its game objects and the
// balance-preserving streak repair can re-orient them in place without leaking
// mutations back to the caller's schedule or corrupting a saved snapshot.
function cloneWeeks(weeks: EngineWeek[]): EngineWeek[] {
  return weeks.map((w) => ({ ...w, games: w.games.map((g) => ({ ...g })), byes: [...w.byes] }));
}

// One simulated-annealing pass over week ORDER (orientation held fixed). Returns
// the best-ordered clone found. Order is feasibility-preserving for every Tier-1
// constraint; streaks, immediate-rematch, bye-window and the soft scorers depend
// on it.
function reorderPass(
  schedule: EngineSchedule,
  weeks: EngineWeek[],
  ctx: ConstraintContext,
  rng: SeededRng,
  maxIterations: number,
  deadline: number,
): { weeks: EngineWeek[]; cost: number } {
  let current = renumber(weeks);
  let currentCost = cost({ ...schedule, weeks: current }, ctx);
  let best = current;
  let bestCost = currentCost;
  const W = current.length;
  if (W < 2) return { weeks: current, cost: currentCost };

  let temp = 1.0;
  const cooling = 0.9995;
  for (let iter = 0; iter < maxIterations; iter += 1) {
    if (bestCost === 0) break;
    if ((iter & 63) === 0 && Date.now() > deadline) break;

    const candidate = current.slice();
    if (rng.next() < 0.5) {
      const i = rng.int(0, W - 1);
      let j = rng.int(0, W - 1);
      if (i === j) j = (j + 1) % W;
      const tmp = candidate[i];
      candidate[i] = candidate[j];
      candidate[j] = tmp;
    } else {
      let lo = rng.int(0, W - 1);
      let hi = rng.int(0, W - 1);
      if (lo > hi) [lo, hi] = [hi, lo];
      while (lo < hi) {
        const tmp = candidate[lo];
        candidate[lo] = candidate[hi];
        candidate[hi] = tmp;
        lo += 1;
        hi -= 1;
      }
    }
    const renumbered = renumber(candidate);
    const candCost = cost({ ...schedule, weeks: renumbered }, ctx);
    const delta = candCost - currentCost;
    if (delta <= 0 || rng.next() < Math.exp(-delta / Math.max(temp, 1e-6))) {
      current = renumbered;
      currentCost = candCost;
      if (candCost < bestCost) {
        best = renumbered;
        bestCost = candCost;
      }
    }
    temp *= cooling;
  }
  return { weeks: best, cost: bestCost };
}

// Phase 4/5 optimizer. Two levers drive fairness + soft quality: week ORDER (SA
// reorder) and home/away ORIENTATION (balance-preserving streak repair). They are
// coupled — the streak-clean orientation depends on the order and vice versa — so
// a single reorder-then-repair leaves residual home/away runs in dense configs
// (few cross games to break up long divisional blocks).
//
// Strategy: one FULL-STRENGTH reorder pass first (all the iteration budget), so
// the soft objective — which depends only on week order, not orientation — is
// optimized exactly as strongly as before; the balance-preserving streak repair
// then re-orients without touching soft. ONLY if fairness (streak) violations
// remain do we spend extra reorder⇄repair rounds so the two co-adapt — this is
// the lever that clears dense configs, and gating it on residual violations keeps
// the soft-preference optimization at full power for the common (streak-clean)
// case. Cannot fail: returns the best (order, orientation) found.
export function optimizeSchedule(
  schedule: EngineSchedule,
  ctx: ConstraintContext,
  rng: SeededRng,
  opts: { maxIterations?: number; timeBudgetMs?: number } = {},
): OptimizeResult {
  const maxIterations = opts.maxIterations ?? 6000;
  const timeBudgetMs = opts.timeBudgetMs ?? 20_000;
  const deadline = Date.now() + timeBudgetMs;

  const streakCap = ctx.input.settings.relaxStreaks
    ? ctx.input.settings.maxHomeAwayStreak + 2
    : ctx.input.settings.maxHomeAwayStreak;

  // optimize owns its game objects from here on.
  let work = cloneWeeks(schedule.weeks);

  // (0) Full-strength reorder, then a balance-preserving streak repair.
  work = reorderPass(schedule, work, ctx, rng, maxIterations, deadline).weeks;
  repairHomeAwayStreaks({ ...schedule, weeks: work }, streakCap, rng, { maxIterations: 8_000 });
  let bestWeeks = cloneWeeks(work);
  let bestCost = cost({ ...schedule, weeks: renumber(bestWeeks) }, ctx);

  // (1) Extra co-adaptation rounds ONLY while streak violations survive: reorder
  // against the repaired orientation, then repair again. Each round gets half the
  // budget; caps and deadline bound total effort.
  const EXTRA_ROUNDS = 4;
  for (
    let round = 0;
    round < EXTRA_ROUNDS &&
    fairnessViolations({ ...schedule, weeks: renumber(work) }, ctx) > 0 &&
    Date.now() < deadline;
    round += 1
  ) {
    work = reorderPass(schedule, work, ctx, rng, Math.max(1, maxIterations >> 1), deadline).weeks;
    repairHomeAwayStreaks({ ...schedule, weeks: work }, streakCap, rng, { maxIterations: 6_000 });
    const roundCost = cost({ ...schedule, weeks: renumber(work) }, ctx);
    if (roundCost < bestCost) {
      bestCost = roundCost;
      bestWeeks = cloneWeeks(work);
    }
  }

  const result: EngineSchedule = { ...schedule, weeks: renumber(bestWeeks) };
  return {
    schedule: result,
    fairnessViolations: fairnessViolations(result, ctx),
    softScore: softObjective(result, ctx),
  };
}
