import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeScheduleScores } from "@/lib/platform/sync";
import type { GeneratedSchedule } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cap per run so one invocation can't fan out into unbounded upstream fetches
// (ESPN/Sleeper are unofficial APIs). Remaining links get picked up next tick.
const MAX_LINKS_PER_RUN = 100;

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
      await admin.from("external_league_links").update({
        last_sync_at: result.syncedAt,
        sync_status: result.warnings.length ? "warning" : "ready",
        sanitized_error: result.warnings[0] ?? null,
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

  return NextResponse.json({ ok: true, considered: links?.length ?? 0, synced, failed, skipped });
}
