import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function numericHeader(headers: Headers, name: string) {
  const value = headers.get(name);
  return value ? Number(value) : null;
}

function scoreFor(event: { scores?: Array<{ name?: string; score?: string | number }> }, teamName: string) {
  const value = event.scores?.find((score) => score.name === teamName)?.score;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return null;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service role key not configured." }, { status: 500 });
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "The Odds API key is not configured yet." }, { status: 503 });

  const dueCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const refreshStaleCutoff = new Date(Date.now() - 90 * 60 * 1000).toISOString();
  const { data: dueGames, error } = await admin
    .from("nfl_games")
    .select("season_year")
    .neq("status", "final")
    .lte("commence_time", dueCutoff)
    .or(`last_score_refresh_at.is.null,last_score_refresh_at.lt.${refreshStaleCutoff}`)
    .limit(100);
  if (error) return NextResponse.json({ error: "Due NFL games could not be loaded." }, { status: 503 });
  const seasons = [...new Set((dueGames ?? []).map((game) => Number(game.season_year)).filter(Boolean))];
  if (!seasons.length) return NextResponse.json({ ok: true, refreshed: 0, reason: "No due NFL score windows." });

  let refreshed = 0;
  let finalsSaved = 0;
  const quota: Array<{ seasonYear: number; requestCost: number | null; requestsRemaining: number | null }> = [];
  for (const seasonYear of seasons) {
    const url = new URL("https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores");
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("daysFrom", "3");
    url.searchParams.set("dateFormat", "iso");
    const response = await fetch(url, { next: { revalidate: 0 } });
    const payload = await response.json().catch(() => null) as Array<{ id?: string; home_team?: string; away_team?: string; completed?: boolean; scores?: Array<{ name?: string; score?: string | number }> }> | { message?: string } | null;
    const requestCost = numericHeader(response.headers, "x-requests-last");
    const requestsUsed = numericHeader(response.headers, "x-requests-used");
    const requestsRemaining = numericHeader(response.headers, "x-requests-remaining");
    quota.push({ seasonYear, requestCost, requestsRemaining });
    if (!response.ok || !Array.isArray(payload)) {
      await admin.from("nfl_data_refreshes").insert({
        refresh_type: "scores",
        season_year: seasonYear,
        completed_at: new Date().toISOString(),
        request_cost: requestCost,
        requests_used: requestsUsed,
        requests_remaining: requestsRemaining,
        status: "error",
        error_message: Array.isArray(payload) ? "Unexpected score response." : payload?.message ?? "Scores could not be refreshed.",
      });
      continue;
    }
    for (const event of payload) {
      if (!event.id || !event.home_team || !event.away_team) continue;
      const awayScore = scoreFor(event, event.away_team);
      const homeScore = scoreFor(event, event.home_team);
      const finalWinnerSide = event.completed && awayScore !== null && homeScore !== null && awayScore !== homeScore
        ? awayScore > homeScore ? "away" : "home"
        : null;
      const { data: game } = await admin
        .from("nfl_games")
        .update({
          status: event.completed ? "final" : "in_progress",
          final_away_score: awayScore,
          final_home_score: homeScore,
          final_winner_side: finalWinnerSide,
          last_score_refresh_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("provider", "the-odds-api")
        .eq("provider_game_id", event.id)
        .select("id")
        .maybeSingle();
      if (!game) continue;
      refreshed += 1;
      if (event.completed) {
        finalsSaved += 1;
        await admin
          .from("pickem_games")
          .update({
            status: "final",
            final_away_score: awayScore,
            final_home_score: homeScore,
            final_winner_side: finalWinnerSide,
          })
          .eq("nfl_game_id", game.id);
      }
      await admin.from("nfl_score_snapshots").insert({
        nfl_game_id: game.id,
        provider: "the-odds-api",
        away_score: awayScore,
        home_score: homeScore,
        completed: Boolean(event.completed),
        raw_json: event,
      });
    }
    await admin.from("nfl_data_refreshes").insert({
      refresh_type: "scores",
      season_year: seasonYear,
      completed_at: new Date().toISOString(),
      request_cost: requestCost,
      requests_used: requestsUsed,
      requests_remaining: requestsRemaining,
      status: "ok",
    });
  }

  return NextResponse.json({ ok: true, refreshed, finalsSaved, quota });
}
