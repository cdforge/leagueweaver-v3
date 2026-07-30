// v3 internal model. Deliberately leaner than the legacy `Schedule` output shape.
// Adapters convert legacy ScheduleInput -> EngineInput (in) and EngineResult ->
// legacy Schedule (out). The engine core never touches venue/calendar concerns.

// Matches lib/leagueFormats LEAGUE_FORMAT_KEYS exactly.
export type FormatKey =
  | "fantasy_nfl_divisional"
  | "divisional_league"
  | "round_robin_classic"
  | "pool_play";

export type Tier = "hard" | "fairness" | "soft";

export type MatchKind = "div" | "cross" | "pool" | "round_robin";

export type TeamId = string;

export interface EngineTeam {
  id: TeamId;
  divisionId: string | null; // null only for single-league round robin
  divisionSeed: number; // 1 = best within division (or league for RR)
  overallSeed: number; // 1 = best overall; ties broken by id for determinism
  openingWeekSeed?: number; // Optional draft-day rank used only by the Week 1 marquee scorer
}

export interface EngineDivision {
  id: string;
  orderIndex: number;
}

// Tunable caps + Tier-3 toggles, normalized from legacy settings.
export interface EngineSettings {
  weeks: number;
  byesPerTeam: number;
  divisionalGamesPerOpponent: number; // custom divisional / pool repeat
  poolOpponentRepeatCount: number;
  classicRoundRobinMode: "cycle_count" | "season_length";
  classicRoundRobinCycleCount: number;

  // Tier-2 caps
  maxHomeAwayStreak: number;
  maxDivisionalStreak: number;
  preventImmediateRematches: boolean;
  byeWeekPlacement: "middle_only" | "prefer_middle" | "anywhere";
  relaxStreaks: boolean;

  // Tier-3 toggles (soft only)
  prioritizeOpeningWeekTopFive: boolean;
  prioritizeFinalWeekTopFive: boolean;
  prioritizeThanksgivingWindow: boolean;
  // The exact week number Thanksgiving falls in, derived from the season year via
  // the NFL calendar (fantasy only). When set, the Thanksgiving soft preference
  // targets THIS single week instead of the legacy fixed weeks 12–13. null when
  // no season year is known (falls back to the 12–13 window).
  thanksgivingWeek: number | null;
  regularSeasonFinalWeekDivisional: boolean;
  divisionalPlacement: "randomized" | "end";
  seasonFlowStyle: "more_mixed" | "balanced" | "more_grouped";
  crossDivisionVariety: "max_variety" | "balanced" | "more_flexible";
  divisionalFinishStrength: "spread_out" | "balanced_finish" | "strong_finish";
}

export interface EngineInput {
  format: FormatKey;
  teams: EngineTeam[];
  divisions: EngineDivision[];
  settings: EngineSettings;
}

// Phase 1 output: who plays whom, how many times — independent of weeks.
export interface InventoryPair {
  a: TeamId;
  b: TeamId;
  count: number;
  kind: MatchKind;
}

export interface MatchupInventory {
  pairs: InventoryPair[];
  // Fantasy divisional final-week rule: the bottom-vs-bottom cross-division
  // pairings that MUST occupy the final week (one per pair of odd-sized
  // divisions). Placement reserves them into the closing slate and the
  // fantasy-final-week fairness constraints validate against this list. Empty /
  // undefined when the rule is off or the league needs no final-week cross game.
  reservedFinalCrossPairs?: Array<{ a: TeamId; b: TeamId }>;
}

// A single realized game before/after orientation. During placement, home/away
// may be undecided (orientation phase fixes it).
export interface EngineGame {
  a: TeamId; // unordered pair endpoints during placement
  b: TeamId;
  homeTeamId: TeamId | null; // null until Phase 3
  awayTeamId: TeamId | null;
  kind: MatchKind;
  seriesId: string; // groups repeats of the same pair
  seriesGameIndex: number; // 1-based within the series
  seriesLength: number;
}

export interface EngineWeek {
  weekNumber: number;
  games: EngineGame[];
  byes: TeamId[];
}

export interface EngineSchedule {
  format: FormatKey;
  weeks: EngineWeek[];
}

// ---- Constraints ----

export interface Issue {
  code: string;
  message: string;
  teamId?: TeamId;
  week?: number;
}

export interface ConstraintContext {
  input: EngineInput;
  teamsById: Map<TeamId, EngineTeam>;
  gamesPerTeam: Map<TeamId, number>;
  inventory: MatchupInventory; // target matchup multiset (Phase 1 output)
  targetHomeCounts: Map<TeamId, number>; // §5 allocation target per team
}

export interface Constraint {
  id: string;
  tier: Tier;
  weight: number; // soft scorer weight; ignored for hard/fairness
  appliesTo: (fmt: FormatKey) => boolean;
  check?: (s: EngineSchedule, ctx: ConstraintContext) => Issue[]; // hard/fairness
  score?: (s: EngineSchedule, ctx: ConstraintContext) => number; // soft, 0..1
}

export interface FeasibilityVerdict {
  ok: boolean;
  reasons: string[];
  suggestions: string[];
}

export interface SoftReportEntry {
  id: string;
  weight: number;
  score: number; // 0..1
}

export interface EngineResult {
  schedule: EngineSchedule;
  warnings: string[];
  softReport: SoftReportEntry[];
  hardPass: boolean;
  seedUsed: string;
  phaseName: string;
}
