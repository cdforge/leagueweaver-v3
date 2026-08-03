import "server-only";
import { scanEspnHistory, type EspnAuthInput } from "@/lib/platform/espn";
import { collectSleeperLeagueHistory } from "@/lib/platform/sleeper";
import type { LeagueHistoryDraft } from "@/lib/platform/history";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ImportDataFound, PlatformProvider } from "@/lib/types";

function seasonKey(providerLeagueId: string, season: number) {
  return `${providerLeagueId}:${season}`;
}

export type HistoryPersistenceResult = {
  dataFound: ImportDataFound;
  rowsWritten: number;
  warnings: string[];
};

export async function persistLeagueHistory(scheduleId: string, draft: LeagueHistoryDraft) {
  const admin = createAdminClient();
  if (!admin) return { rowsWritten: 0, warnings: ["History scanned, but server Supabase admin access is not configured for table population."] };
  if (!draft.leagueSeasons.length) return { rowsWritten: 0, warnings: draft.warnings };

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

  if (draft.playerCatalog.length) {
    const { error } = await admin.from("player_catalog").upsert(draft.playerCatalog, { onConflict: "id" });
    if (error) throw error;
  }
  if (teamRows.length) {
    const { error } = await admin.from("league_team_history").upsert(teamRows, { onConflict: "league_season_id,league_team_id" });
    if (error) throw error;
  }
  if (scheduleRows.length) {
    const { error } = await admin.from("league_schedule_history").upsert(scheduleRows, { onConflict: "league_season_id,week,provider_matchup_id" });
    if (error) throw error;
  }
  if (ownershipRows.length) {
    const { error } = await admin.from("player_ownership_history").upsert(ownershipRows, { onConflict: "league_season_id,week,canonical_player_id" });
    if (error) throw error;
  }
  return {
    rowsWritten: draft.leagueSeasons.length + teamRows.length + scheduleRows.length + ownershipRows.length,
    warnings: draft.warnings,
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

  const dataFound = await scanEspnHistory(args.providerLeagueId, args.seasonYear, args.espnAuth);
  return {
    dataFound,
    rowsWritten: 0,
    warnings: ["ESPN history was scanned. Full ESPN row capture is not available yet, so no historical schedule/player rows were saved."],
  };
}
