import { FormatKey } from "./types";

export interface FormatCapabilities {
  key: FormatKey;
  usesDivisions: boolean;
  usesPools: boolean;
  usesOverallRanking: boolean;
  usesDivisionalRules: boolean;
  supportsByes: boolean;
  // matchup model used by Phase 1 (inventory) and Phase 0 (feasibility)
  inventoryModel:
    | "fantasy_div_twice_plus_cross"
    | "divisional_guaranteed_plus_cross"
    | "round_robin_cycles"
    | "intra_pool_repeat";
}

export const FORMAT_CAPABILITIES: Record<FormatKey, FormatCapabilities> = {
  fantasy_nfl_divisional: {
    key: "fantasy_nfl_divisional",
    usesDivisions: true,
    usesPools: false,
    usesOverallRanking: true,
    usesDivisionalRules: true,
    supportsByes: false,
    inventoryModel: "fantasy_div_twice_plus_cross",
  },
  divisional_league: {
    key: "divisional_league",
    usesDivisions: true,
    usesPools: false,
    usesOverallRanking: true,
    usesDivisionalRules: true,
    supportsByes: true,
    inventoryModel: "divisional_guaranteed_plus_cross",
  },
  round_robin_classic: {
    key: "round_robin_classic",
    usesDivisions: false,
    usesPools: false,
    usesOverallRanking: false,
    usesDivisionalRules: false,
    supportsByes: false,
    inventoryModel: "round_robin_cycles",
  },
  pool_play: {
    key: "pool_play",
    usesDivisions: false,
    usesPools: true,
    usesOverallRanking: true,
    usesDivisionalRules: false,
    supportsByes: false,
    inventoryModel: "intra_pool_repeat",
  },
};

const ALIAS_TO_KEY: Record<string, FormatKey> = {
  // canonical internal labels
  "fantasy football": "fantasy_nfl_divisional",
  "fantasy football divisional": "fantasy_nfl_divisional",
  "fantasy divisional": "fantasy_nfl_divisional",
  "round-robin - randomized": "divisional_league",
  "round robin randomized": "divisional_league",
  "round-robin randomized": "divisional_league",
  "divisional league": "divisional_league",
  "custom divisional": "divisional_league",
  "divisional round robin": "divisional_league",
  "round-robin - standard": "round_robin_classic",
  "round robin standard": "round_robin_classic",
  "round robin": "round_robin_classic",
  "standard round robin": "round_robin_classic",
  "round-robin standard": "round_robin_classic",
  "pool play": "pool_play",
  pool: "pool_play",
  // raw keys
  fantasy_nfl_divisional: "fantasy_nfl_divisional",
  divisional_league: "divisional_league",
  round_robin_classic: "round_robin_classic",
  pool_play: "pool_play",
};

// Strict resolver: returns null for unknown/empty rather than silently
// defaulting to Fantasy (the legacy toLeagueFormat bug). Callers decide how to
// surface a null.
export function resolveFormatKey(raw?: string): FormatKey | null {
  if (!raw) return null;
  const normalized = raw.trim().replace(/\s+/g, " ").toLowerCase();
  return ALIAS_TO_KEY[normalized] ?? null;
}

export function getFormatCapabilities(key: FormatKey): FormatCapabilities {
  return FORMAT_CAPABILITIES[key];
}
