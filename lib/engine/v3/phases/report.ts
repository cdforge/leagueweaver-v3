import { ConstraintContext, EngineSchedule, SoftReportEntry } from "../domain/types";
import { validateSchedule } from "../constraints/registry";

export interface ScheduleReport {
  hardPass: boolean;
  warnings: string[];
  softReport: SoftReportEntry[];
}

// Phase 5 — re-validate (defense in depth) and emit the soft-preference report.
// Hard Tier-1 failures should never occur post-pipeline; if they do they are
// surfaced as warnings so the caller can decide. Remaining fairness issues
// (unbeatable by reordering, or relaxed-mode overflow) also become warnings.
export function buildReport(schedule: EngineSchedule, ctx: ConstraintContext): ScheduleReport {
  const { hardIssues, fairnessIssues, softScores } = validateSchedule(schedule, ctx);
  const warnings: string[] = [];
  for (const i of hardIssues) warnings.push(`[hard] ${i.message}`);
  for (const i of fairnessIssues) warnings.push(`[fairness] ${i.message}`);
  return {
    hardPass: hardIssues.length === 0,
    warnings,
    softReport: softScores,
  };
}
