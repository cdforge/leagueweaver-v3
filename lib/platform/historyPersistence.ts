import "server-only";
import { collectEspnLeagueHistory, type EspnAuthInput } from "@/lib/platform/espn";
import { collectSleeperLeagueHistory } from "@/lib/platform/sleeper";
import type { LeagueHistoryDraft } from "@/lib/platform/history";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ImportDataFound, PlatformProvider } from "@/lib/types";

function seasonKey(providerLeagueId: string, season: number) {
  return `${providerLeagueId}:${season}`;
}

const HISTORY_UPSERT_CHUNK_SIZE = 500;

export type HistoryPersistenceResult = {
  dataFound: ImportDataFound;
  rowsWritten: number;
  warnings: string[];
};

async function upsertChunks<T>(
  table: string,
  rows: T[],
  onConflict: string,
) {
  for (let index = 0; index < rows.length; index += HISTORY_UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(index, index + HISTORY_UPSERT_CHUNK_SIZE);
    const admin = createAdminClient();
    if (!admin) throw new Error("History scanned, but server Supabase admin access is not configured for table population.");
    const { error } = await admin.from(table).upsert(chunk as never[], { onConflict });
    if (error) throw error;
  }
}

export async function persistLeagueHistory(scheduleId: string, draft: LeagueHistoryDraft) {
  const admin = createAdminClient();
  if (!admin) return { rowsWritten: 0, warnings: ["History scanned, but server Supabase admin access is not configured for table population."] };
  if (!draft.leagueSeasons.length) return { rowsWritten: 0, warnings: draft.warnings };
  const warnings = [...draft.warnings];

  const { data: seasonRows, error: seasonError } = await admin
    .from("league_seasons")
    .upsert(draft.leagueSeasons, { onConflict: "schedule_id,provider,provider_league_id,season" })
    .select("id,provider_league_id,season");
  if (seasonError) throw seasonError;
  const idBySeason = new Map((seasonRows ?? []).map((season) => [seasonKey(season.provider_league_id, season.season), season.id]));

  const teamRows = draft.teamHistory.map((row) => {
    const { providerLeagueId, season, ...rest } = row;
    const leagueSeasonId = idBySeason.get(seasonKey(providerLeagueId, season));
    return leagueSeasonId ? { league_season_id: leagueSeasonId, ...rest } : null;
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  const scheduleRows = draft.scheduleHistory.map((row) => {
    const { providerLeagueId, season, ...rest } = row;
    const leagueSeasonId = idBySeason.get(seasonKey(providerLeagueId, season));
    return leagueSeasonId ? { league_season_id: leagueSeasonId, ...rest } : null;
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  const ownershipRows = draft.ownershipHistory.map((row) => {
    const { providerLeagueId, season, ...rest } = row;
    const leagueSeasonId = idBySeason.get(seasonKey(providerLeagueId, season));
    return leagueSeasonId ? { league_season_id: leagueSeasonId, ...rest } : null;
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (teamRows.length) {
    await upsertChunks("league_team_history", teamRows, "league_season_id,league_team_id");
  }
  if (scheduleRows.length) {
    await upsertChunks("league_schedule_history", scheduleRows, "league_season_id,week,provider_matchup_id");
  }
  let ownershipRowsWritten = 0;
  try {
    if (draft.playerCatalog.length) {
      await upsertChunks("player_catalog", draft.playerCatalog, "id");
    }
    if (ownershipRows.length) {
      await upsertChunks("player_ownership_history", ownershipRows, "league_season_id,week,canonical_player_id");
      ownershipRowsWritten = ownershipRows.length;
    }
  } catch (caught) {
    warnings.push(
      caught instanceof Error
        ? `Historical player rows could not be saved yet: ${caught.message}`
        : "Historical player rows could not be saved yet.",
    );
  }
  return {
    rowsWritten: draft.leagueSeasons.length + teamRows.length + scheduleRows.length + ownershipRowsWritten,
    warnings,
  };
}

export function dataFoundFromDraft(draft: LeagueHistoryDraft): ImportDataFound {
  return {
    availableHistoryYears: draft.leagueSeasons.map((season) => season.season).sort((left, right) => right - left),
    blockedHistoryYears: [],
    hasDraftData: true,
    hasRosterData: draft.teamHistory.length > 0,
    hasPlayerData: draft.ownershipHistory.length > 0,
    hasScoreSync: draft.scheduleHistory.length > 0,
  };
}

export async function collectAndPersistConnectionHistory(args: {
  scheduleId: string;
  provider: PlatformProvider;
  providerLeagueId: string;
  seasonYear: number;
  espnAuth?: EspnAuthInput;
}): Promise<HistoryPersistenceResult> {
  if (args.provider === "sleeper") {
    const draft = await collectSleeperLeagueHistory(args.scheduleId, args.providerLeagueId);
    const persisted = await persistLeagueHistory(args.scheduleId, draft);
    return {
      dataFound: dataFoundFromDraft(draft),
      rowsWritten: persisted.rowsWritten,
      warnings: persisted.warnings,
    };
  }

  const draft = await collectEspnLeagueHistory(args.scheduleId, args.providerLeagueId, args.seasonYear, args.espnAuth);
  const persisted = await persistLeagueHistory(args.scheduleId, draft);
  return {
    dataFound: dataFoundFromDraft(draft),
    rowsWritten: persisted.rowsWritten,
    warnings: persisted.warnings,
  };
}
