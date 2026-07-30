import type { TiebreakerRule, TiebreakerSettings } from "./types";

export const TIEBREAKER_RULES: TiebreakerRule[] = [
  "win-percentage",
  "division-percentage",
  "head-to-head",
  "points-scored",
  "common-opponents",
  "strength-of-victory",
  "strength-of-schedule",
  "point-differential",
];

export const DEFAULT_TIEBREAKERS: TiebreakerRule[] = [
  "win-percentage",
  "division-percentage",
  "head-to-head",
  "points-scored",
  "common-opponents",
  "strength-of-victory",
  "strength-of-schedule",
  "point-differential",
];

export const DEFAULT_DIVISION_TIEBREAKERS = DEFAULT_TIEBREAKERS;
export const DEFAULT_LEAGUE_TIEBREAKERS = DEFAULT_TIEBREAKERS;

export const TIEBREAKER_RULE_LABELS: Record<TiebreakerRule, string> = {
  "win-percentage": "Win percentage",
  "head-to-head": "Head-to-head",
  "division-percentage": "Division win percentage",
  "common-opponents": "Common opponents",
  "strength-of-victory": "Strength of victory",
  "strength-of-schedule": "Strength of schedule",
  "point-differential": "Point differential",
  "points-scored": "Points scored",
};

export const TIEBREAKER_RULE_DESCRIPTIONS: Record<TiebreakerRule, string> = {
  "win-percentage": "Overall record, with a tie counting as half a win.",
  "head-to-head": "Record only in games among the teams that are still tied.",
  "division-percentage": "Record in games against the team's own division.",
  "common-opponents": "Record against opponents every team in the tie has played.",
  "strength-of-victory": "Average win percentage of opponents this team defeated.",
  "strength-of-schedule": "Average win percentage of every opponent this team played.",
  "point-differential": "Points scored minus points allowed.",
  "points-scored": "Total points scored through the selected week.",
};

function normalizeStack(value: unknown, fallback: TiebreakerRule[]) {
  if (!Array.isArray(value)) return [...fallback];
  const seen = new Set<TiebreakerRule>();
  return value.filter((rule): rule is TiebreakerRule => {
    if (!TIEBREAKER_RULES.includes(rule as TiebreakerRule) || seen.has(rule as TiebreakerRule)) return false;
    seen.add(rule as TiebreakerRule);
    return true;
  });
}

export function normalizeTiebreakerSettings(value?: Partial<TiebreakerSettings>): TiebreakerSettings {
  const manualOverrides = value?.manualOverrides && typeof value.manualOverrides === "object"
    ? Object.fromEntries(Object.entries(value.manualOverrides).filter(([signature, teamIds]) => signature.length > 0 && Array.isArray(teamIds) && teamIds.every((teamId) => typeof teamId === "string")))
    : {};
  const rules = normalizeStack(value?.league ?? value?.division, DEFAULT_TIEBREAKERS);
  return {
    division: [...rules],
    league: [...rules],
    manualOverrides,
  };
}
