import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

const TEAM_ABBR: Record<string, string> = {
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WSH",
};

type ScoreEvent = {
  id?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  completed?: boolean;
  scores?: Array<{ name?: string; score?: string | number }>;
};

const scoreSchema = z.object({
  poolId: z.string().uuid().optional(),
  seasonYear: z.number().int().min(2020).max(2100),
  week: z.number().int().min(1).max(22).optional(),
  daysFrom: z.number().int().min(1).max(3).default(3),
});

function abbrFor(teamName: string) {
  return TEAM_ABBR[teamName] ?? teamName.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase();
}

function numericHeader(headers: Headers, name: string) {
  const value = headers.get(name);
  return value ? Number(value) : null;
}

function scoreFor(event: ScoreEvent, teamName: string) {
  const value = event.scores?.find((score) => score.name === teamName)?.score;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return null;
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service role key is not configured." }, { status: 503 });

  const parsed = scoreSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a score refresh window." }, { status: 400 });
  if (parsed.data.poolId) {
    const { data: pool } = await auth.supabase
      .from("pickem_pools")
      .select("id,user_id")
      .eq("id", parsed.data.poolId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (!pool) return NextResponse.json({ error: "Pick'em pool could not be found." }, { status: 404 });
  }

  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "The Odds API key is not configured yet." }, { status: 503 });

  const url = new URL("https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("daysFrom", String(parsed.data.daysFrom));
  url.searchParams.set("dateFormat", "iso");
  const response = await fetch(url, { next: { revalidate: 0 } });
  const payload = await response.json().catch(() => null) as ScoreEvent[] | { message?: string } | null;
  const requestsUsed = numericHeader(response.headers, "x-requests-used");
  const requestsRemaining = numericHeader(response.headers, "x-requests-remaining");
  const requestCost = numericHeader(response.headers, "x-requests-last");

  if (!response.ok || !Array.isArray(payload)) {
    await admin.from("nfl_data_refreshes").insert({
      refresh_type: "scores",
      season_year: parsed.data.seasonYear,
      week: parsed.data.week ?? null,
      completed_at: new Date().toISOString(),
      request_cost: requestCost,
      requests_used: requestsUsed,
      requests_remaining: requestsRemaining,
      status: "error",
      error_message: Array.isArray(payload) ? "Unexpected score response." : payload?.message ?? "Scores could not be refreshed.",
    });
    return NextResponse.json({ error: "Scores could not be refreshed.", details: payload }, { status: response.status });
  }

  let gamesSaved = 0;
  let scoreSnapshotsSaved = 0;
  let finalsSaved = 0;
  for (const event of payload) {
    if (!event.id || !event.home_team || !event.away_team || !event.commence_time) continue;
    const awayScore = scoreFor(event, event.away_team);
    const homeScore = scoreFor(event, event.home_team);
    const finalWinnerSide = event.completed && awayScore !== null && homeScore !== null && awayScore !== homeScore
      ? awayScore > homeScore ? "away" : "home"
      : null;
    const { data: game, error: gameError } = await admin
      .from("nfl_games")
      .upsert({
        provider: "the-odds-api",
        provider_game_id: event.id,
        season_year: parsed.data.seasonYear,
        week: parsed.data.week ?? null,
        commence_time: event.commence_time,
        away_team_name: event.away_team,
        home_team_name: event.home_team,
        away_abbr: abbrFor(event.away_team),
        home_abbr: abbrFor(event.home_team),
        status: event.completed ? "final" : "scheduled",
        final_away_score: awayScore,
        final_home_score: homeScore,
        final_winner_side: finalWinnerSide,
        last_score_refresh_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider,provider_game_id" })
      .select("id")
      .single();
    if (gameError || !game) continue;
    gamesSaved += 1;
    if (event.completed) finalsSaved += 1;
    if (event.completed) {
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

    const { data: snapshot } = await admin
      .from("nfl_score_snapshots")
      .insert({
        nfl_game_id: game.id,
        provider: "the-odds-api",
        away_score: awayScore,
        home_score: homeScore,
        completed: Boolean(event.completed),
        raw_json: event,
      })
      .select("id")
      .single();
    if (snapshot) scoreSnapshotsSaved += 1;
  }

  await admin.from("nfl_data_refreshes").insert({
    refresh_type: "scores",
    season_year: parsed.data.seasonYear,
    week: parsed.data.week ?? null,
    completed_at: new Date().toISOString(),
    request_cost: requestCost,
    requests_used: requestsUsed,
    requests_remaining: requestsRemaining,
    status: "ok",
  });

  return NextResponse.json({
    ok: true,
    source: "the-odds-api",
    storage: "shared-nfl-data",
    gamesSaved,
    scoreSnapshotsSaved,
    finalsSaved,
    requestCost,
    requestsUsed,
    requestsRemaining,
  });
}
