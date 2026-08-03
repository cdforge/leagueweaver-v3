import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/auth";
import { decryptSecret } from "@/lib/platform/crypto";
import { computeSchedulePlayers } from "@/lib/platform/sync";
import { mergePlayerStatsForSync, type ExistingPlayerStatSyncState } from "@/lib/platform/playerSync";
import { fetchEspnLeague, mapEspnScores, type EspnAuthInput } from "@/lib/platform/espn";
import { mapSleeperScores } from "@/lib/platform/sleeper";
import type { GeneratedSchedule, PlatformSyncResult } from "@/lib/types";

const schema = z.object({
  schedule: z.unknown(),
  week: z.number().int().min(1).max(18).optional(),
});

function cleanError(message: string) {
  return message.replace(/espn_s2=[^;\s]+/gi, "espn_s2=[redacted]").replace(/SWID=[^;\s]+/gi, "SWID=[redacted]").slice(0, 500);
}

async function loadEspnAuth(schedule: GeneratedSchedule): Promise<EspnAuthInput | undefined> {
  if (schedule.setup.platformConnection?.authType !== "private-cookie") return undefined;
  const auth = await getAuthenticatedClient();
  if (!auth) return undefined;
  const { data: link } = await auth.supabase
    .from("external_league_links")
    .select("id")
    .eq("schedule_id", schedule.id)
    .eq("provider", "espn")
    .maybeSingle();
  if (!link) return undefined;
  const { data: credentials } = await auth.supabase
    .from("platform_provider_credentials")
    .select("credential_json")
    .eq("external_league_link_id", link.id)
    .maybeSingle();
  const payload = credentials?.credential_json as { swid?: string; espnS2?: string } | undefined;
  if (!payload?.swid || !payload.espnS2) return undefined;
  return { swid: decryptSecret(payload.swid), espnS2: decryptSecret(payload.espnS2) };
}

async function persistScores(schedule: GeneratedSchedule, result: PlatformSyncResult) {
  const auth = await getAuthenticatedClient();
  if (!auth || !/^[0-9a-f-]{36}$/i.test(schedule.id)) return;
  const rows = result.rows.filter((row) => row.confidence === "high").map((row) => ({
    user_id: auth.userId,
    schedule_id: schedule.id,
    game_id: row.gameId,
    week: row.week,
    home_score: row.homeScore ?? null,
    away_score: row.awayScore ?? null,
    is_final: row.homeScore != null && row.awayScore != null,
  }));
  if (rows.length) await auth.supabase.from("season_scores").upsert(rows, { onConflict: "schedule_id,game_id" });
  const connection = schedule.setup.platformConnection;
  if (connection?.provider && connection.providerLeagueId) {
    await auth.supabase.from("external_league_links").upsert({
      user_id: auth.userId,
      schedule_id: schedule.id,
      provider: connection.provider,
      provider_league_id: connection.providerLeagueId,
      sync_enabled: connection.syncMode !== "manual",
      last_sync_at: result.syncedAt,
      sync_status: result.warnings.length ? "warning" : "ready",
      sanitized_error: result.warnings[0] ?? null,
      metadata_json: {
        seasonYear: connection.seasonYear,
        authType: connection.authType,
      },
    }, { onConflict: "user_id,provider,provider_league_id" });
  }
  await auth.supabase.from("import_runs").insert({
    user_id: auth.userId,
    schedule_id: schedule.id,
    provider: schedule.setup.platformConnection?.provider,
    provider_league_id: schedule.setup.platformConnection?.providerLeagueId,
    status: "confirmed",
    warning_count: result.warnings.length,
    sanitized_error: result.warnings[0] ?? null,
    summary_json: {
      action: "Platform score sync",
      week: result.rows[0]?.week,
      seasonYear: schedule.setup.seasonYear,
      message: result.rows.length ? `${result.rows.length} score rows refreshed.` : "No matching scores were ready.",
    },
    committed_at: result.syncedAt,
  });
}

async function persistPlayers(schedule: GeneratedSchedule, weeks?: number[]) {
  const auth = await getAuthenticatedClient();
  if (!auth || !/^[0-9a-f-]{36}$/i.test(schedule.id)) return { rowsWritten: 0, skippedFinal: 0 };
  const players = await computeSchedulePlayers(schedule, { weeks });
  if (!players.length) return { rowsWritten: 0, skippedFinal: 0 };
  const { data: existingRows } = await auth.supabase
    .from("season_player_stats")
    .select("schedule_id, season, week, league_team_id, provider_player_id, is_provisional, final_lock_at, synced_at, source_payload_hash")
    .eq("schedule_id", schedule.id);
  const existing = (existingRows ?? []).map((row) => ({
    scheduleId: row.schedule_id,
    season: row.season,
    week: row.week,
    teamId: row.league_team_id,
    providerPlayerId: row.provider_player_id,
    isProvisional: row.is_provisional,
    finalLockAt: row.final_lock_at,
    syncedAt: row.synced_at,
    sourcePayloadHash: row.source_payload_hash,
  })) satisfies ExistingPlayerStatSyncState[];
  const merged = mergePlayerStatsForSync(players, existing);
  if (!merged.rows.length) return { rowsWritten: 0, skippedFinal: merged.skippedFinal };
  const catalogRows = new Map(merged.rows.map((row) => [row.canonicalPlayerId, {
    id: row.canonicalPlayerId,
    canonical_name: row.providerPlayerId,
    normalized_name: row.providerPlayerId,
    position: row.inferredSlot,
    sleeper_id: row.provider === "sleeper" ? row.providerPlayerId : null,
    espn_id: row.provider === "espn" ? row.providerPlayerId : null,
    status: "unknown",
  }]));
  await auth.supabase.from("player_catalog").upsert([...catalogRows.values()], { onConflict: "id" });
  await auth.supabase.from("season_player_stats").upsert(merged.rows.map((row) => ({
    schedule_id: schedule.id,
    provider: row.provider,
    provider_league_id: row.providerLeagueId,
    season: row.season,
    week: row.week,
    league_team_id: row.teamId,
    provider_roster_id: row.providerRosterId,
    provider_player_id: row.providerPlayerId,
    canonical_player_id: row.canonicalPlayerId,
    fantasy_points: row.points,
    projected_points: row.projected ?? null,
    lineup_status: row.lineupStatus,
    starter_index: row.starterIndex ?? null,
    inferred_slot: row.inferredSlot,
    raw_slot: row.rawSlot == null ? null : String(row.rawSlot),
    slot_confidence: row.slotConfidence,
    is_provisional: row.isProvisional,
    final_lock_at: row.finalLockAt ?? null,
    synced_at: row.syncedAt,
    source_payload_hash: row.sourcePayloadHash,
  })), { onConflict: "schedule_id,season,week,league_team_id,provider_player_id" });
  return { rowsWritten: merged.rows.length, skippedFinal: merged.skippedFinal };
}

async function persistFailedSync(schedule: GeneratedSchedule, message: string) {
  const auth = await getAuthenticatedClient();
  if (!auth || !/^[0-9a-f-]{36}$/i.test(schedule.id)) return;
  await auth.supabase.from("import_runs").insert({
    user_id: auth.userId,
    schedule_id: schedule.id,
    provider: schedule.setup.platformConnection?.provider,
    provider_league_id: schedule.setup.platformConnection?.providerLeagueId,
    status: "failed",
    warning_count: 1,
    sanitized_error: message,
    summary_json: {
      action: "Platform score sync",
      seasonYear: schedule.setup.seasonYear,
      message,
    },
  });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a season to sync." }, { status: 400 });
  const schedule = parsed.data.schedule as GeneratedSchedule;
  const connection = schedule?.setup?.platformConnection;
  if (!connection?.provider || !connection.providerLeagueId) return NextResponse.json({ error: "This season is not connected to ESPN or Sleeper." }, { status: 400 });
  try {
    const result = connection.provider === "espn"
      ? mapEspnScores(schedule, await fetchEspnLeague(connection.providerLeagueId, connection.seasonYear, ["mMatchup", "mScoreboard"], await loadEspnAuth(schedule)))
      : await mapSleeperScores(schedule, parsed.data.week ?? 1);
    await persistScores(schedule, result);
    try {
      const playerSync = await persistPlayers(schedule, parsed.data.week ? [parsed.data.week] : undefined);
      return NextResponse.json({ ...result, playerSync });
    } catch (caught) {
      return NextResponse.json({
        ...result,
        warnings: [...result.warnings, cleanError(caught instanceof Error ? caught.message : "Player sync failed after scores were saved.")],
        playerSync: { rowsWritten: 0, failed: true },
      });
    }
  } catch (caught) {
    const message = cleanError(caught instanceof Error ? caught.message : "Platform scores could not be refreshed.");
    await persistFailedSync(schedule, message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
