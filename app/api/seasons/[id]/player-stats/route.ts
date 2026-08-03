import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

function readWeek(url: string) {
  const value = new URL(url).searchParams.get("week");
  if (!value) return null;
  const week = Number(value);
  return Number.isInteger(week) && week >= 1 && week <= 18 ? week : null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in to view player stats." }, { status: 401 });

  const { id } = await context.params;
  const week = readWeek(request.url);
  let query = auth.supabase
    .from("season_player_stats")
    .select("schedule_id, provider, provider_league_id, season, week, league_team_id, provider_roster_id, provider_player_id, canonical_player_id, fantasy_points, projected_points, lineup_status, starter_index, inferred_slot, raw_slot, slot_confidence, is_provisional, final_lock_at, synced_at, source_payload_hash")
    .eq("schedule_id", id)
    .order("week", { ascending: true })
    .order("league_team_id", { ascending: true })
    .order("starter_index", { ascending: true, nullsFirst: false });

  if (week) query = query.eq("week", week);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const canonicalIds = Array.from(new Set((data ?? []).map((row) => row.canonical_player_id).filter(Boolean)));
  const catalog = new Map<string, { canonical_name?: string; position?: string; nfl_team?: string }>();
  if (canonicalIds.length) {
    const { data: catalogRows } = await auth.supabase
      .from("player_catalog")
      .select("id, canonical_name, position, nfl_team")
      .in("id", canonicalIds);
    for (const row of catalogRows ?? []) catalog.set(row.id, row);
  }

  return NextResponse.json({
    rows: (data ?? []).map((row) => {
      const identity = catalog.get(row.canonical_player_id);
      return {
        scheduleId: row.schedule_id,
        provider: row.provider,
        providerLeagueId: row.provider_league_id,
        season: row.season,
        week: row.week,
        teamId: row.league_team_id,
        providerRosterId: row.provider_roster_id,
        providerPlayerId: row.provider_player_id,
        canonicalPlayerId: row.canonical_player_id,
        displayName: identity?.canonical_name,
        position: identity?.position,
        nflTeam: identity?.nfl_team,
        points: row.fantasy_points,
        projected: row.projected_points ?? undefined,
        lineupStatus: row.lineup_status,
        starterIndex: row.starter_index ?? undefined,
        inferredSlot: row.inferred_slot,
        rawSlot: row.raw_slot ?? undefined,
        slotConfidence: row.slot_confidence,
        isProvisional: row.is_provisional,
        finalLockAt: row.final_lock_at ?? undefined,
        syncedAt: row.synced_at,
        sourcePayloadHash: row.source_payload_hash,
      };
    }),
  });
}
