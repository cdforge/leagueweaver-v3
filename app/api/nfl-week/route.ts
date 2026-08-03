import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNflWeekWindow } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  seasonYear: z.coerce.number().int().min(2020).max(2100),
  week: z.coerce.number().int().min(1).max(22),
});

type NflGameRow = {
  id: string;
  commence_time: string;
  away_abbr: string;
  home_abbr: string;
  away_team_name: string;
  home_team_name: string;
  status: "scheduled" | "in_progress" | "final" | "postponed" | "cancelled";
  final_away_score: number | null;
  final_home_score: number | null;
  final_winner_side: "away" | "home" | null;
  last_score_refresh_at: string | null;
  updated_at: string | null;
};

type OddsSnapshotRow = {
  nfl_game_id: string;
  favorite_side: "away" | "home" | null;
  spread: number | string | null;
  snapshot_at: string;
};

async function loadGames(seasonYear: number, week: number) {
  const admin = createAdminClient();
  if (!admin) return { games: [], unavailable: true };

  const byWeek = await admin
    .from("nfl_games")
    .select("id,commence_time,away_abbr,home_abbr,away_team_name,home_team_name,status,final_away_score,final_home_score,final_winner_side,last_score_refresh_at,updated_at")
    .eq("season_year", seasonYear)
    .eq("week", week)
    .order("commence_time", { ascending: true });

  if (byWeek.error) return { games: [], unavailable: true };
  if (byWeek.data?.length) return { games: byWeek.data as NflGameRow[], unavailable: false };

  const window = getNflWeekWindow(seasonYear, week);
  const byDate = await admin
    .from("nfl_games")
    .select("id,commence_time,away_abbr,home_abbr,away_team_name,home_team_name,status,final_away_score,final_home_score,final_winner_side,last_score_refresh_at,updated_at")
    .eq("season_year", seasonYear)
    .gte("commence_time", window.startsAt)
    .lt("commence_time", window.endsAt)
    .order("commence_time", { ascending: true });

  if (byDate.error) return { games: [], unavailable: true };
  return { games: (byDate.data ?? []) as NflGameRow[], unavailable: false };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({
    seasonYear: url.searchParams.get("seasonYear"),
    week: url.searchParams.get("week"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Choose an NFL season and week." }, { status: 400 });

  const { seasonYear, week } = parsed.data;
  const { games, unavailable } = await loadGames(seasonYear, week);
  if (unavailable) {
    return NextResponse.json({
      seasonYear,
      week,
      games: [],
      source: "stored-shared-nfl-data",
      unavailable: true,
    });
  }

  const admin = createAdminClient();
  const oddsByGame = new Map<string, OddsSnapshotRow>();
  const gameIds = games.map((game) => game.id);
  if (admin && gameIds.length) {
    const { data } = await admin
      .from("nfl_odds_snapshots")
      .select("nfl_game_id,favorite_side,spread,snapshot_at")
      .in("nfl_game_id", gameIds)
      .order("snapshot_at", { ascending: false });
    for (const row of (data ?? []) as OddsSnapshotRow[]) {
      if (!oddsByGame.has(row.nfl_game_id)) oddsByGame.set(row.nfl_game_id, row);
    }
  }

  return NextResponse.json({
    seasonYear,
    week,
    source: "stored-shared-nfl-data",
    games: games.map((game) => {
      const odds = oddsByGame.get(game.id);
      return {
        id: game.id,
        kickoffAt: game.commence_time,
        awayAbbr: game.away_abbr,
        homeAbbr: game.home_abbr,
        awayName: game.away_team_name,
        homeName: game.home_team_name,
        status: game.status,
        awayScore: game.final_away_score,
        homeScore: game.final_home_score,
        winnerSide: game.final_winner_side,
        favoriteSide: odds?.favorite_side ?? null,
        spread: odds?.spread === null || odds?.spread === undefined ? null : Number(odds.spread),
        lastUpdatedAt: game.last_score_refresh_at ?? game.updated_at,
      };
    }),
  });
}
