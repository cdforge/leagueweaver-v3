import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/auth";
import { decryptSecret } from "@/lib/platform/crypto";
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
  await auth.supabase.from("external_league_links")
    .update({ last_sync_at: result.syncedAt, sync_status: result.warnings.length ? "warning" : "ready", sanitized_error: result.warnings[0] ?? null })
    .eq("schedule_id", schedule.id)
    .eq("provider", schedule.setup.platformConnection?.provider);
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
      ? mapEspnScores(schedule, await fetchEspnLeague(connection.providerLeagueId, connection.seasonYear, ["mScoreboard"], await loadEspnAuth(schedule)))
      : await mapSleeperScores(schedule, parsed.data.week ?? 1);
    await persistScores(schedule, result);
    return NextResponse.json(result);
  } catch (caught) {
    const message = cleanError(caught instanceof Error ? caught.message : "Platform scores could not be refreshed.");
    await persistFailedSync(schedule, message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
