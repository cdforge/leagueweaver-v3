import type { PlatformProvider } from "./types";

export const SLOT_KEYS = [
  "QB",
  "TQB",
  "RB",
  "RB_WR_FLEX",
  "WR",
  "WR_TE_FLEX",
  "TE",
  "SUPERFLEX",
  "DT",
  "DE",
  "DL",
  "LB",
  "CB",
  "S",
  "DB",
  "DP",
  "DST",
  "K",
  "P",
  "HC",
  "FLEX",
  "IDP",
  "IDP_FLEX",
  "BENCH",
  "IR",
  "TAXI",
  "RESERVE",
  "UNKNOWN",
] as const;

export type SlotKey = typeof SLOT_KEYS[number];
export type SlotConfidence = "confirmed" | "inferred" | "ambiguous" | "bench";
export type LineupStatus = "starter" | "bench" | "ir" | "taxi" | "reserve" | "unknown";

export interface PlayerIdentity {
  /** Internal canonical id, also stored as player_catalog.id. */
  id: string;
  canonicalName: string;
  normalizedName: string;
  position: SlotKey | string;
  nflTeam?: string;
  gsisId?: string;
  sleeperId?: string;
  espnId?: string;
  pfrId?: string;
  yahooId?: string;
  status?: "active" | "inactive" | "unknown";
  updatedAt?: string;
}

export interface LineupSlotTemplate {
  slot: SlotKey;
  index: number;
  rawSlot?: string | number;
  label?: string;
}

export interface LineupTemplate {
  provider: PlatformProvider;
  season: number;
  slots: LineupSlotTemplate[];
}

export interface RosterTemplate {
  provider: PlatformProvider;
  season: number;
  slots: LineupSlotTemplate[];
}

export interface PlayerWeekStat {
  scheduleId: string;
  provider: PlatformProvider;
  providerLeagueId: string;
  season: number;
  week: number;
  /** LeagueWeaver Team.id that owned this player for this exact week. */
  teamId: string;
  providerRosterId: string;
  providerPlayerId: string;
  canonicalPlayerId: PlayerIdentity["id"];
  points: number;
  projected?: number;
  lineupStatus: LineupStatus;
  starterIndex?: number;
  inferredSlot: SlotKey;
  rawSlot?: string | number;
  slotConfidence: SlotConfidence;
  isProvisional: boolean;
  finalLockAt?: string;
  syncedAt: string;
  sourcePayloadHash: string;
}

export interface SeasonPlayerDataset {
  scheduleId: string;
  provider: PlatformProvider;
  providerLeagueId: string;
  season: number;
  lineupTemplate: LineupTemplate;
  rosterTemplate: RosterTemplate;
  players: PlayerIdentity[];
  weeks: PlayerWeekStat[];
}

export const ESPN_LINEUP_SLOT_ID_TO_SLOT_KEY: Readonly<Record<number, SlotKey>> = {
  0: "QB",
  1: "TQB",
  2: "RB",
  3: "RB_WR_FLEX",
  4: "WR",
  5: "WR_TE_FLEX",
  6: "TE",
  7: "SUPERFLEX",
  8: "DT",
  9: "DE",
  10: "LB",
  11: "DL",
  12: "CB",
  13: "S",
  14: "DB",
  15: "DP",
  16: "DST",
  17: "K",
  18: "P",
  19: "HC",
  20: "BENCH",
  21: "IR",
  23: "FLEX",
};

export const SLEEPER_ROSTER_POSITION_TO_SLOT_KEY: Readonly<Record<string, SlotKey>> = {
  QB: "QB",
  RB: "RB",
  WR: "WR",
  TE: "TE",
  K: "K",
  FLEX: "FLEX",
  WRRB_FLEX: "RB_WR_FLEX",
  REC_FLEX: "WR_TE_FLEX",
  SUPER_FLEX: "SUPERFLEX",
  DL: "DL",
  LB: "LB",
  DB: "DB",
  IDP_FLEX: "IDP_FLEX",
  DEF: "DST",
  BN: "BENCH",
  IR: "IR",
  TAXI: "TAXI",
};

export function espnSlotKey(lineupSlotId: number): SlotKey {
  return ESPN_LINEUP_SLOT_ID_TO_SLOT_KEY[lineupSlotId] ?? "UNKNOWN";
}

export function sleeperSlotKey(rosterPosition: string): SlotKey {
  return SLEEPER_ROSTER_POSITION_TO_SLOT_KEY[rosterPosition] ?? "UNKNOWN";
}

export function playerWeekStatKey(stat: Pick<PlayerWeekStat, "scheduleId" | "season" | "week" | "teamId" | "providerPlayerId">) {
  return `${stat.scheduleId}:${stat.season}:${stat.week}:${stat.teamId}:${stat.providerPlayerId}`;
}
