import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeSchedulePlayers, computeScheduleScores } from "@/lib/platform/sync";
import { DEFAULT_PLAYER_SYNC_BUDGET, mergePlayerStatsForSync, type ExistingPlayerStatSyncState } from "@/lib/platform/playerSync";
import type { GeneratedSchedule } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// vercel.json fires this once ~15 min after each NFL slate ends — each schedule
// lists two UTC hours so it lands at the right ET time in both EDT and EST:
//   Fri 04:30/05:30  → Thursday Night Football
//   Sun 20:45/21:45  → Sunday 1pm ET early slate
//   Mon 00:00/01:00  → Sunday 4pm ET afternoon slate
//   Mon 04:30/05:30  → Sunday Night Football
//   Tue 04:30/05:30  → Monday Night Football
//   Tue 08:00/09:00  → Tuesday 4am ET end-of-week catch-all (after stat corrections)
//   Sun 03:30/04:30  → late-season Saturday evening games
// Cap per run so one invocation can't fan out into unbounded upstream fetches
// (ESPN/Sleeper are unofficial APIs). Remaining links get picked up next tick.
const MAX_LINKS_PER_RUN = 100;
const PLAYER_SYNC_KILL_SWITCH = "PLAYER_SYNC_DISABLED";

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set
// in the project env. No secret configured → refuse, so the endpoint is never
// open to the public internet.
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function sanitize(message: string) {
  return message.replace(/espn_s2=[^;\s]+/gi, "espn_s2=[redacted]").replace(/SWID=[^;\s]+/gi, "SWID=[redacted]").slice(0, 300);
}

async function persistPlayerRows(admin: NonNullable<ReturnType<typeof createAdminClient>>, link: { user_id: string; schedule_id: string; provider: string }, schedule: GeneratedSchedule) {
  if (process.env[PLAYER_SYNC_KILL_SWITCH] === "1") return { rowsWritten: 0, skippedFinal: 0, disabled: true };
  const startedAt = new Date().toISOString();
  const { data: run } = await admin.from("platform_sync_runs").insert({
    provider: link.provider,
    schedule_id: link.schedule_id,
    status: "running",
    warnings: [],
    started_at: startedAt,
  }).select("id").maybeSingle();
  try {
    const players = await computeSchedulePlayers(schedule);
    const limitedPlayers = players.slice(0, DEFAULT_PLAYER_SYNC_BUDGET.maxRequests * 64);
    const { data: existingRows } = await admin
      .from("season_player_stats")
      .select("schedule_id, season, week, league_team_id, provider_player_id, is_provisional, final_lock_at, synced_at, source_payload_hash")
      .eq("schedule_id", link.schedule_id);
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
    const merged = mergePlayerStatsForSync(limitedPlayers, existing);
    if (merged.rows.length) {
      const catalogRows = new Map(merged.rows.map((row) => [row.canonicalPlayerId, {
        id: row.canonicalPlayerId,
        canonical_name: row.providerPlayerId,
        normalized_name: row.providerPlayerId,
        position: row.inferredSlot,
        sleeper_id: row.provider === "sleeper" ? row.providerPlayerId : null,
        espn_id: row.provider === "espn" ? row.providerPlayerId : null,
        status: "unknown",
      }]));
      await admin.from("player_catalog").upsert([...catalogRows.values()], { onConflict: "id" });
      await admin.from("season_player_stats").upsert(merged.rows.map((row) => ({
        schedule_id: link.schedule_id,
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
    }
    if (run?.id) await admin.from("platform_sync_runs").update({ status: "ready", rows_written: merged.rows.length, finished_at: new Date().toISOString() }).eq("id", run.id);
    return { rowsWritten: merged.rows.length, skippedFinal: merged.skippedFinal };
  } catch (caught) {
    const warning = sanitize(caught instanceof Error ? caught.message : "Player sync failed.");
    if (run?.id) await admin.from("platform_sync_runs").update({ status: "warning", warnings: [warning], finished_at: new Date().toISOString() }).eq("id", run.id);
    return { rowsWritten: 0, skippedFinal: 0, warning };
  }
}

// Scheduled background sync (Level 2). Runs the same public-only score pull the
// Refresh button uses, but for EVERY auto-enabled connection, via the service
// role client — so scores update without anyone opening the app. Manual (Level 0)
// connections have sync_enabled=false and are left untouched.
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service role key not configured." }, { status: 500 });

  const { data: links, error } = await admin
    .from("external_league_links")
    .select("id, user_id, schedule_id, provider")
    .eq("sync_enabled", true)
    .neq("sync_status", "failed")
    .limit(MAX_LINKS_PER_RUN);
  if (error) return NextResponse.json({ error: "Connections could not be loaded." }, { status: 500 });

  let synced = 0;
  let failed = 0;
  let skipped = 0;
  let playerRowsWritten = 0;

  for (const link of links ?? []) {
    try {
      const { data: scheduleRow } = await admin.from("schedules").select("current_revision_id").eq("id", link.schedule_id).maybeSingle();
      if (!scheduleRow?.current_revision_id) { skipped += 1; continue; }
      const { data: revision } = await admin.from("schedule_revisions").select("schedule_json").eq("id", scheduleRow.current_revision_id).maybeSingle();
      const schedule = revision?.schedule_json as GeneratedSchedule | undefined;
      if (!schedule?.setup?.platformConnection?.providerLeagueId) { skipped += 1; continue; }

      const result = await computeScheduleScores(schedule);
      const rows = result.rows
        .filter((row) => row.confidence === "high")
        .map((row) => ({
          user_id: link.user_id,
          schedule_id: link.schedule_id,
          game_id: row.gameId,
          week: row.week,
          home_score: row.homeScore ?? null,
          away_score: row.awayScore ?? null,
          is_final: row.homeScore != null && row.awayScore != null,
        }));
      if (rows.length) await admin.from("season_scores").upsert(rows, { onConflict: "schedule_id,game_id" });
      const playerSync = await persistPlayerRows(admin, link, schedule);
      playerRowsWritten += playerSync.rowsWritten;
      await admin.from("external_league_links").update({
        last_sync_at: result.syncedAt,
        sync_status: result.warnings.length || "warning" in playerSync ? "warning" : "ready",
        sanitized_error: result.warnings[0] ?? ("warning" in playerSync ? playerSync.warning : null),
      }).eq("id", link.id);
      synced += 1;
    } catch (caught) {
      failed += 1;
      // One bad connection (deleted league, API blip) must not fail the batch.
      await admin.from("external_league_links")
        .update({ sync_status: "warning", sanitized_error: sanitize(caught instanceof Error ? caught.message : "Scheduled sync failed.") })
        .eq("id", link.id);
    }
  }

  return NextResponse.json({ ok: true, considered: links?.length ?? 0, synced, failed, skipped, playerRowsWritten });
}
