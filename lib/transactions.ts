import type { PlatformProvider, Team } from "./types";

export type TransactionKind = "waiver" | "free_agent" | "trade" | "roster" | "unknown";

export interface NormalizedTransaction {
  provider: PlatformProvider;
  providerLeagueId: string;
  week: number;
  teamId: string;
  providerRosterId: string;
  kind: TransactionKind;
  adds: number;
  drops: number;
  rawType: string;
  sourceId: string;
}

export interface TransactionCountSummary {
  teamId: string;
  providerRosterId: string;
  transactions: number;
  adds: number;
  drops: number;
  waivers: number;
  trades: number;
}

export interface SleeperTransactionPayload {
  transaction_id?: string;
  type?: string;
  status?: string;
  roster_ids?: number[];
  adds?: Record<string, number>;
  drops?: Record<string, number>;
}

export interface EspnTransactionPayload {
  id?: string | number;
  type?: string;
  status?: string;
  teamId?: number;
  items?: Array<{ type?: string; fromTeamId?: number; toTeamId?: number; playerId?: number }>;
}

export const ESPN_TRANSACTION_TYPES = [
  "DRAFT",
  "TRADE_ACCEPT",
  "WAIVER",
  "TRADE_VETO",
  "FUTURE_ROSTER",
  "ROSTER",
  "RETRO_ROSTER",
  "TRADE_PROPOSAL",
  "TRADE_UPHOLD",
  "FREEAGENT",
  "TRADE_DECLINE",
  "WAIVER_ERROR",
  "TRADE_ERROR",
] as const;

export function mapSleeperTransactions(args: {
  providerLeagueId: string;
  week: number;
  teams: Team[];
  transactions: SleeperTransactionPayload[];
}): NormalizedTransaction[] {
  const rows: NormalizedTransaction[] = [];
  for (const transaction of args.transactions) {
    if (transaction.status !== "complete") continue;
    const kind = sleeperTransactionKind(transaction.type);
    for (const providerRosterId of transaction.roster_ids ?? []) {
      const teamId = teamIdByProvider(args.teams, "sleeper", args.providerLeagueId, providerRosterId);
      if (!teamId) continue;
      rows.push({
        provider: "sleeper",
        providerLeagueId: args.providerLeagueId,
        week: args.week,
        teamId,
        providerRosterId: String(providerRosterId),
        kind,
        adds: countPlayerMapForRoster(transaction.adds, providerRosterId),
        drops: countPlayerMapForRoster(transaction.drops, providerRosterId),
        rawType: transaction.type ?? "unknown",
        sourceId: transaction.transaction_id ?? `${args.week}:${providerRosterId}:${rows.length}`,
      });
    }
  }
  return rows;
}

export function mapEspnTransactions(args: {
  providerLeagueId: string;
  week: number;
  teams: Team[];
  transactions?: EspnTransactionPayload[];
}): { rows: NormalizedTransaction[]; warnings: string[] } {
  const rows: NormalizedTransaction[] = [];
  const warnings: string[] = [];
  for (const transaction of args.transactions ?? []) {
    const rawType = transaction.type ?? "UNKNOWN";
    if (!ESPN_TRANSACTION_TYPES.includes(rawType as (typeof ESPN_TRANSACTION_TYPES)[number])) {
      warnings.push(`Unknown ESPN transaction type: ${rawType}`);
    }
    const kind = espnTransactionKind(rawType);
    const teamIds = new Set<number>();
    if (transaction.teamId) teamIds.add(transaction.teamId);
    for (const item of transaction.items ?? []) {
      if (item.toTeamId && item.toTeamId > 0) teamIds.add(item.toTeamId);
      if (kind === "trade" && item.fromTeamId && item.fromTeamId > 0) teamIds.add(item.fromTeamId);
    }
    for (const providerRosterId of teamIds) {
      const teamId = teamIdByProvider(args.teams, "espn", args.providerLeagueId, providerRosterId);
      if (!teamId) continue;
      const adds = (transaction.items ?? []).filter((item) => item.toTeamId === providerRosterId).length;
      const drops = (transaction.items ?? []).filter((item) => item.fromTeamId === providerRosterId).length;
      rows.push({
        provider: "espn",
        providerLeagueId: args.providerLeagueId,
        week: args.week,
        teamId,
        providerRosterId: String(providerRosterId),
        kind,
        adds,
        drops,
        rawType,
        sourceId: String(transaction.id ?? `${args.week}:${providerRosterId}:${rows.length}`),
      });
    }
  }
  return { rows, warnings };
}

export function summarizeTransactionCounts(rows: NormalizedTransaction[]): TransactionCountSummary[] {
  const byTeam = new Map<string, TransactionCountSummary>();
  for (const row of rows) {
    const summary = byTeam.get(row.teamId) ?? {
      teamId: row.teamId,
      providerRosterId: row.providerRosterId,
      transactions: 0,
      adds: 0,
      drops: 0,
      waivers: 0,
      trades: 0,
    };
    summary.transactions += 1;
    summary.adds += row.adds;
    summary.drops += row.drops;
    if (row.kind === "waiver" || row.kind === "free_agent") summary.waivers += 1;
    if (row.kind === "trade") summary.trades += 1;
    byTeam.set(row.teamId, summary);
  }
  return [...byTeam.values()].sort((a, b) => Number(a.providerRosterId) - Number(b.providerRosterId));
}

function sleeperTransactionKind(type?: string): TransactionKind {
  if (type === "waiver") return "waiver";
  if (type === "free_agent") return "free_agent";
  if (type === "trade") return "trade";
  return type === "roster" ? "roster" : "unknown";
}

function espnTransactionKind(type: string): TransactionKind {
  if (type === "WAIVER") return "waiver";
  if (type === "FREEAGENT") return "free_agent";
  if (type.startsWith("TRADE_")) return "trade";
  if (type === "ROSTER" || type === "RETRO_ROSTER" || type === "FUTURE_ROSTER") return "roster";
  return "unknown";
}

function countPlayerMapForRoster(map: Record<string, number> | undefined, providerRosterId: number) {
  return Object.values(map ?? {}).filter((value) => value === providerRosterId).length;
}

function teamIdByProvider(teams: Team[], provider: PlatformProvider, providerLeagueId: string, providerRosterId: number) {
  const providerId = `${provider}-${providerLeagueId}-${providerRosterId}`;
  return teams.find((team) => team.providerId === providerId || team.providerId === String(providerRosterId))?.id;
}
