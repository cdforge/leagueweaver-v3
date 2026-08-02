import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { espnSlotKey, normalizePlayerName, sleeperSlotKey } from "@/lib/playerData";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ESPN_PLAYERS_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/players?view=players_wl";
const ESPN_PLAYER_FILTER = JSON.stringify({ players: { limit: 2000 }, filterActive: { value: true } });
const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.PLAYER_CATALOG_SYNC_DISABLED === "1") return NextResponse.json({ ok: true, disabled: true, rowsWritten: 0 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service role key not configured." }, { status: 500 });

  const [espnResponse, sleeperResponse] = await Promise.all([
    fetch(ESPN_PLAYERS_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "LeagueWeaver/3.0 (public fantasy data sync; contact: support@leagueweaver.com)",
        "X-Fantasy-Filter": ESPN_PLAYER_FILTER,
      },
      cache: "no-store",
    }),
    fetch(SLEEPER_PLAYERS_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "LeagueWeaver/3.0 (public fantasy data sync; contact: support@leagueweaver.com)",
      },
      cache: "no-store",
    }),
  ]);
  if (!espnResponse.ok && !sleeperResponse.ok) return NextResponse.json({ error: "Player catalogs could not be loaded." }, { status: 502 });

  const rows = new Map<string, Record<string, string | null>>();
  if (espnResponse.ok) {
    const espnPlayers = await espnResponse.json() as Array<{ id?: number; fullName?: string; defaultPositionId?: number; proTeamId?: number }>;
    for (const player of espnPlayers) {
      if (player.id == null || !player.fullName) continue;
      rows.set(`espn:${player.id}`, {
        id: `espn:${player.id}`,
        canonical_name: player.fullName,
        normalized_name: normalizePlayerName(player.fullName),
        position: espnSlotKey(player.defaultPositionId ?? -1),
        nfl_team: player.proTeamId == null ? null : String(player.proTeamId),
        espn_id: String(player.id),
        sleeper_id: null,
        status: "active",
      });
    }
  }
  if (sleeperResponse.ok) {
    const sleeperPlayers = await sleeperResponse.json() as Record<string, { full_name?: string; first_name?: string; last_name?: string; position?: string; team?: string; status?: string }>;
    for (const [id, player] of Object.entries(sleeperPlayers)) {
      const name = player.full_name || [player.first_name, player.last_name].filter(Boolean).join(" ");
      if (!name) continue;
      rows.set(`sleeper:${id}`, {
        id: `sleeper:${id}`,
        canonical_name: name,
        normalized_name: normalizePlayerName(name),
        position: sleeperSlotKey(player.position ?? "") === "UNKNOWN" ? player.position ?? "UNKNOWN" : sleeperSlotKey(player.position ?? ""),
        nfl_team: player.team ?? null,
        sleeper_id: id,
        espn_id: null,
        status: player.status === "Active" ? "active" : "unknown",
      });
    }
  }

  const payload = [...rows.values()];
  for (let index = 0; index < payload.length; index += 500) {
    await admin.from("player_catalog").upsert(payload.slice(index, index + 500), { onConflict: "id" });
  }
  return NextResponse.json({ ok: true, rowsWritten: payload.length, espnOk: espnResponse.ok, sleeperOk: sleeperResponse.ok });
}
