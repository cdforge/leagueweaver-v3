import type { PlayerWeekStat } from "@/lib/playerData";

const DAY_MS = 24 * 60 * 60 * 1000;
const FINALITY_WINDOW_MS = 7 * DAY_MS;

export interface ExistingPlayerStatSyncState {
  scheduleId: string;
  season: number;
  week: number;
  teamId: string;
  providerPlayerId: string;
  isProvisional: boolean;
  finalLockAt?: string | null;
  syncedAt?: string | null;
  sourcePayloadHash?: string | null;
}

export interface PlayerSyncBudget {
  maxRequests: number;
  maxBytes: number;
  maxSeconds: number;
}

export const DEFAULT_PLAYER_SYNC_BUDGET: PlayerSyncBudget = {
  maxRequests: 40,
  maxBytes: 5_000_000,
  maxSeconds: 45,
};

export function playerStatSyncKey(row: Pick<PlayerWeekStat, "scheduleId" | "season" | "week" | "teamId" | "providerPlayerId">) {
  return `${row.scheduleId}:${row.season}:${row.week}:${row.teamId}:${row.providerPlayerId}`;
}

export function shouldBackoffStatus(status: number) {
  return status === 429 || status === 403 || status >= 500;
}

export function providerBackoffDelayMs(status: number, attempt: number) {
  if (!shouldBackoffStatus(status)) return 0;
  return Math.min(30_000, 1_000 * (2 ** Math.max(0, attempt - 1)));
}

export function shouldRefreshPlayerStat(state: Pick<ExistingPlayerStatSyncState, "isProvisional" | "finalLockAt" | "syncedAt">, now = new Date()) {
  if (!state.isProvisional || state.finalLockAt) return false;
  if (!state.syncedAt) return true;
  const syncedAt = new Date(state.syncedAt);
  if (Number.isNaN(syncedAt.getTime())) return true;
  if (now.getTime() - syncedAt.getTime() >= FINALITY_WINDOW_MS) return true;
  const day = now.getUTCDay();
  const isTueOrThu = day === 2 || day === 4;
  return isTueOrThu && now.getTime() - syncedAt.getTime() >= 12 * 60 * 60 * 1000;
}

export function mergePlayerStatsForSync(
  incoming: PlayerWeekStat[],
  existing: ExistingPlayerStatSyncState[],
  now = new Date(),
) {
  const existingByKey = new Map(existing.map((row) => [playerStatSyncKey(row), row]));
  const rows: PlayerWeekStat[] = [];
  let skippedFinal = 0;
  for (const row of incoming) {
    const prior = existingByKey.get(playerStatSyncKey(row));
    if (prior?.finalLockAt || prior?.isProvisional === false) {
      skippedFinal += 1;
      continue;
    }
    const priorSyncedAt = prior?.syncedAt ? new Date(prior.syncedAt) : null;
    const shouldLock = Boolean(priorSyncedAt && !Number.isNaN(priorSyncedAt.getTime()) && now.getTime() - priorSyncedAt.getTime() >= FINALITY_WINDOW_MS);
    rows.push({
      ...row,
      isProvisional: !shouldLock,
      finalLockAt: shouldLock ? now.toISOString() : row.finalLockAt,
      syncedAt: now.toISOString(),
    });
  }
  return { rows, skippedFinal };
}
