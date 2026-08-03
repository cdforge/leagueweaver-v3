import type { PlatformProvider, Team } from "./types";

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
export type TemplateSlotGroup = LineupStatus;

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
  rank?: number;
  rawSlot?: string | number;
  label?: string;
  group?: TemplateSlotGroup;
  confidence?: SlotConfidence;
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

export interface SleeperMatchupPlayerPayload {
  roster_id: number;
  players?: string[];
  starters?: string[];
  players_points?: Record<string, number>;
}

export interface EspnPlayerEntryPayload {
  lineupSlotId?: number;
  playerId?: number | string;
  playerPoolEntry?: {
    appliedStatTotal?: number;
    player?: {
      id?: number | string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
      defaultPositionId?: number;
      proTeamId?: number;
    };
  };
}

export interface EspnMatchupPayload {
  matchupPeriodId: number;
  home?: { teamId?: number; rosterForCurrentScoringPeriod?: { entries?: EspnPlayerEntryPayload[] } };
  away?: { teamId?: number; rosterForCurrentScoringPeriod?: { entries?: EspnPlayerEntryPayload[] } };
}

export interface SleeperTemplateSource {
  season: number;
  rosterPositions: string[];
  taxiSlots?: number;
}

export interface EspnTemplateSource {
  season: number;
  lineupSlotCounts: Record<string, number>;
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

export function canonicalProviderPlayerId(provider: PlatformProvider, providerPlayerId: string) {
  return `${provider}:${providerPlayerId}`;
}

export function normalizePlayerName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

export function stablePayloadHash(value: unknown) {
  const input = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function providerTeamId(provider: PlatformProvider, providerLeagueId: string, providerRosterId: string | number) {
  return `${provider}-${providerLeagueId}-${providerRosterId}`;
}

function teamIdByProviderRoster(teams: Team[], provider: PlatformProvider, providerLeagueId: string, providerRosterId: string | number) {
  const providerId = providerTeamId(provider, providerLeagueId, providerRosterId);
  return teams.find((team) => team.providerId === providerId || team.providerId === String(providerRosterId))?.id;
}

export function mapSleeperPlayerWeekStats(args: {
  scheduleId: string;
  providerLeagueId: string;
  season: number;
  week: number;
  teams: Team[];
  rosterPositions: string[];
  matchups: SleeperMatchupPlayerPayload[];
  syncedAt?: string;
}): PlayerWeekStat[] {
  const syncedAt = args.syncedAt ?? new Date().toISOString();
  const rows: PlayerWeekStat[] = [];
  for (const matchup of args.matchups) {
    const teamId = teamIdByProviderRoster(args.teams, "sleeper", args.providerLeagueId, matchup.roster_id);
    if (!teamId) continue;
    const starters = matchup.starters ?? [];
    const starterIndexByPlayer = new Map(starters.map((playerId, index) => [playerId, index]));
    const playerIds = new Set([...(matchup.players ?? []), ...starters, ...Object.keys(matchup.players_points ?? {})]);
    for (const providerPlayerId of [...playerIds].sort((a, b) => starterSort(a, b, starterIndexByPlayer))) {
      const starterIndex = starterIndexByPlayer.get(providerPlayerId);
      const isStarter = starterIndex !== undefined;
      const rawSlot = isStarter ? args.rosterPositions[starterIndex] : "BN";
      rows.push({
        scheduleId: args.scheduleId,
        provider: "sleeper",
        providerLeagueId: args.providerLeagueId,
        season: args.season,
        week: args.week,
        teamId,
        providerRosterId: String(matchup.roster_id),
        providerPlayerId,
        canonicalPlayerId: canonicalProviderPlayerId("sleeper", providerPlayerId),
        points: matchup.players_points?.[providerPlayerId] ?? 0,
        lineupStatus: isStarter ? "starter" : "bench",
        starterIndex,
        inferredSlot: isStarter ? sleeperSlotKey(String(rawSlot)) : "BENCH",
        rawSlot,
        slotConfidence: isStarter ? "inferred" : "bench",
        isProvisional: true,
        syncedAt,
        sourcePayloadHash: stablePayloadHash({ roster_id: matchup.roster_id, providerPlayerId, rawSlot, points: matchup.players_points?.[providerPlayerId] ?? 0 }),
      });
    }
  }
  return rows;
}

function starterSort(a: string, b: string, starterIndexByPlayer: Map<string, number>) {
  const aIndex = starterIndexByPlayer.get(a) ?? Number.POSITIVE_INFINITY;
  const bIndex = starterIndexByPlayer.get(b) ?? Number.POSITIVE_INFINITY;
  return aIndex - bIndex || a.localeCompare(b, undefined, { numeric: true });
}

export function mapEspnPlayerWeekStats(args: {
  scheduleId: string;
  providerLeagueId: string;
  season: number;
  teams: Team[];
  schedule: EspnMatchupPayload[];
  weeks?: number[];
  syncedAt?: string;
}): PlayerWeekStat[] {
  const syncedAt = args.syncedAt ?? new Date().toISOString();
  const targetWeeks = new Set(args.weeks);
  const rows: PlayerWeekStat[] = [];
  for (const matchup of args.schedule) {
    if (targetWeeks.size && !targetWeeks.has(matchup.matchupPeriodId)) continue;
    for (const side of [matchup.home, matchup.away]) {
      if (side?.teamId == null) continue;
      const teamId = teamIdByProviderRoster(args.teams, "espn", args.providerLeagueId, side.teamId);
      if (!teamId) continue;
      for (const [entryIndex, entry] of (side.rosterForCurrentScoringPeriod?.entries ?? []).entries()) {
        const providerPlayerId = String(entry.playerId ?? entry.playerPoolEntry?.player?.id ?? "");
        if (!providerPlayerId) continue;
        const rawSlot = entry.lineupSlotId ?? -1;
        const inferredSlot = espnSlotKey(rawSlot);
        const lineupStatus = espnLineupStatus(inferredSlot);
        rows.push({
          scheduleId: args.scheduleId,
          provider: "espn",
          providerLeagueId: args.providerLeagueId,
          season: args.season,
          week: matchup.matchupPeriodId,
          teamId,
          providerRosterId: String(side.teamId),
          providerPlayerId,
          canonicalPlayerId: canonicalProviderPlayerId("espn", providerPlayerId),
          points: entry.playerPoolEntry?.appliedStatTotal ?? 0,
          lineupStatus,
          starterIndex: lineupStatus === "starter" ? entryIndex : undefined,
          inferredSlot,
          rawSlot,
          slotConfidence: "confirmed",
          isProvisional: true,
          syncedAt,
          sourcePayloadHash: stablePayloadHash({ teamId: side.teamId, week: matchup.matchupPeriodId, providerPlayerId, rawSlot, points: entry.playerPoolEntry?.appliedStatTotal ?? 0 }),
        });
      }
    }
  }
  return rows;
}

function espnLineupStatus(slot: SlotKey): LineupStatus {
  if (slot === "BENCH") return "bench";
  if (slot === "IR") return "ir";
  if (slot === "RESERVE") return "reserve";
  if (slot === "TAXI") return "taxi";
  if (slot === "UNKNOWN") return "unknown";
  return "starter";
}

export function deriveSleeperTemplates(source: SleeperTemplateSource): { lineupTemplate: LineupTemplate; rosterTemplate: RosterTemplate } {
  const baseSlots = source.rosterPositions.map((rawSlot, index) => ({
    slot: sleeperSlotKey(rawSlot),
    index,
    rawSlot,
    group: sleeperTemplateGroup(rawSlot),
    confidence: "inferred" as SlotConfidence,
  }));
  const taxiSlots = Array.from({ length: Math.max(0, source.taxiSlots ?? 0) }, (_, index) => ({
    slot: "TAXI" as SlotKey,
    index: baseSlots.length + index,
    rawSlot: "taxi",
    group: "taxi" as TemplateSlotGroup,
    confidence: "inferred" as SlotConfidence,
  }));
  const rosterSlots = rankTemplateSlots([...baseSlots, ...taxiSlots]);
  return {
    lineupTemplate: {
      provider: "sleeper",
      season: source.season,
      slots: rankTemplateSlots(baseSlots.filter((slot) => slot.group === "starter")).map((slot, index) => ({ ...slot, index })),
    },
    rosterTemplate: {
      provider: "sleeper",
      season: source.season,
      slots: rosterSlots,
    },
  };
}

export function deriveEspnTemplates(source: EspnTemplateSource): { lineupTemplate: LineupTemplate; rosterTemplate: RosterTemplate } {
  const rosterSlots: LineupSlotTemplate[] = [];
  for (const [rawSlot, count] of Object.entries(source.lineupSlotCounts).sort(([a], [b]) => Number(a) - Number(b))) {
    const slot = espnSlotKey(Number(rawSlot));
    for (let index = 0; index < count; index += 1) {
      rosterSlots.push({
        slot,
        index: rosterSlots.length,
        rawSlot: Number(rawSlot),
        group: espnLineupStatus(slot),
        confidence: slot === "UNKNOWN" ? "ambiguous" : "confirmed",
      });
    }
  }
  return {
    lineupTemplate: {
      provider: "espn",
      season: source.season,
      slots: rankTemplateSlots(rosterSlots.filter((slot) => slot.group === "starter")).map((slot, index) => ({ ...slot, index })),
    },
    rosterTemplate: {
      provider: "espn",
      season: source.season,
      slots: rankTemplateSlots(rosterSlots),
    },
  };
}

function sleeperTemplateGroup(rawSlot: string): TemplateSlotGroup {
  const slot = sleeperSlotKey(rawSlot);
  if (slot === "BENCH") return "bench";
  if (slot === "IR") return "ir";
  if (slot === "TAXI") return "taxi";
  if (slot === "RESERVE") return "reserve";
  if (slot === "UNKNOWN") return "unknown";
  return "starter";
}

function rankTemplateSlots(slots: LineupSlotTemplate[]): LineupSlotTemplate[] {
  const totals = slots.reduce((map, slot) => map.set(slot.slot, (map.get(slot.slot) ?? 0) + 1), new Map<SlotKey, number>());
  const seen = new Map<SlotKey, number>();
  return slots.map((slot, index) => {
    const rank = (seen.get(slot.slot) ?? 0) + 1;
    seen.set(slot.slot, rank);
    return {
      ...slot,
      index,
      rank,
      label: (totals.get(slot.slot) ?? 0) > 1 ? `${slot.slot}${rank}` : slot.slot,
    };
  });
}
