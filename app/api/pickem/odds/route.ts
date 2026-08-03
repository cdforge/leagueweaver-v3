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

type OddsOutcome = { name?: string; point?: number };
type OddsMarket = { key?: string; outcomes?: OddsOutcome[] };
type OddsBookmaker = { key?: string; title?: string; markets?: OddsMarket[] };
type OddsEvent = {
  id?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  bookmakers?: OddsBookmaker[];
};

const oddsSchema = z.object({
  poolId: z.string().uuid(),
  weekId: z.string().uuid().optional(),
  seasonYear: z.number().int().min(2020).max(2100).optional(),
  week: z.number().int().min(1).max(22).optional(),
  snapshotType: z.enum(["tuesday", "manual", "publish"]).default("manual"),
});

function abbrFor(teamName: string) {
  return TEAM_ABBR[teamName] ?? teamName.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase();
}

function numericHeader(headers: Headers, name: string) {
  const value = headers.get(name);
  return value ? Number(value) : null;
}

function chooseSpread(event: OddsEvent) {
  for (const bookmaker of event.bookmakers ?? []) {
    const market = bookmaker.markets?.find((item) => item.key === "spreads");
    const away = market?.outcomes?.find((outcome) => outcome.name === event.away_team);
    const home = market?.outcomes?.find((outcome) => outcome.name === event.home_team);
    if (typeof away?.point === "number" && typeof home?.point === "number") {
      const favoriteSide = away.point < home.point ? "away" : "home";
      return {
        bookmakerKey: bookmaker.key ?? null,
        bookmakerTitle: bookmaker.title ?? null,
        awaySpread: away.point,
        homeSpread: home.point,
        favoriteSide,
        spread: Math.abs(favoriteSide === "away" ? away.point : home.point),
        raw: { bookmaker, market },
      };
    }
  }
  return null;
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service role key is not configured." }, { status: 503 });

  const parsed = oddsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a Pick'em pool." }, { status: 400 });
  const { data: pool } = await auth.supabase
    .from("pickem_pools")
    .select("id,user_id,season_year")
    .eq("id", parsed.data.poolId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!pool) return NextResponse.json({ error: "Pick'em pool could not be found." }, { status: 404 });

  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "The Odds API key is not configured yet." }, { status: 503 });

  const url = new URL("https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "spreads");
  url.searchParams.set("oddsFormat", "american");
  const response = await fetch(url, { next: { revalidate: 0 } });
  const payload = await response.json().catch(() => null) as OddsEvent[] | { message?: string } | null;
  const requestsUsed = numericHeader(response.headers, "x-requests-used");
  const requestsRemaining = numericHeader(response.headers, "x-requests-remaining");
  const requestCost = numericHeader(response.headers, "x-requests-last");
  const seasonYear = parsed.data.seasonYear ?? Number(pool.season_year);
  const weekNumber = parsed.data.week ?? 1;
  const { data: weekRow } = await admin
    .from("pickem_weeks")
    .upsert({
      pool_id: pool.id,
      week: weekNumber,
      status: "open",
      snapshot_at: new Date().toISOString(),
      source: "the-odds-api",
    }, { onConflict: "pool_id,week" })
    .select("id")
    .single();

  if (!response.ok || !Array.isArray(payload)) {
    await admin.from("nfl_data_refreshes").insert({
      refresh_type: "odds",
      season_year: seasonYear,
      week: parsed.data.week ?? null,
      completed_at: new Date().toISOString(),
      request_cost: requestCost,
      requests_used: requestsUsed,
      requests_remaining: requestsRemaining,
      status: "error",
      error_message: Array.isArray(payload) ? "Unexpected odds response." : payload?.message ?? "Odds could not be refreshed.",
    });
    return NextResponse.json({ error: "Odds could not be refreshed.", details: payload }, { status: response.status });
  }

  let gamesSaved = 0;
  let snapshotsSaved = 0;
  let pickemGamesSaved = 0;
  for (const event of payload) {
    if (!event.id || !event.home_team || !event.away_team || !event.commence_time) continue;
    const spread = chooseSpread(event);
    const { data: game, error: gameError } = await admin
      .from("nfl_games")
      .upsert({
        provider: "the-odds-api",
        provider_game_id: event.id,
        season_year: seasonYear,
        week: parsed.data.week ?? null,
        commence_time: event.commence_time,
        away_team_name: event.away_team,
        home_team_name: event.home_team,
        away_abbr: abbrFor(event.away_team),
        home_abbr: abbrFor(event.home_team),
        status: "scheduled",
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider,provider_game_id" })
      .select("id,away_abbr,home_abbr")
      .single();
    if (gameError || !game) continue;
    gamesSaved += 1;

    if (spread) {
      const { data: snapshot } = await admin
        .from("nfl_odds_snapshots")
        .insert({
          nfl_game_id: game.id,
          provider: "the-odds-api",
          bookmaker_key: spread.bookmakerKey,
          bookmaker_title: spread.bookmakerTitle,
          snapshot_type: parsed.data.snapshotType,
          away_spread: spread.awaySpread,
          home_spread: spread.homeSpread,
          favorite_side: spread.favoriteSide,
          spread: spread.spread,
          raw_json: spread.raw,
        })
        .select("id")
        .single();
      if (snapshot) {
        snapshotsSaved += 1;
        const weekId = parsed.data.weekId ?? weekRow?.id;
        if (weekId) {
          const { error: pickemGameError } = await admin
            .from("pickem_games")
            .upsert({
              week_id: weekId,
              provider_game_id: event.id,
              nfl_game_id: game.id,
              odds_snapshot_id: snapshot.id,
              kickoff_at: event.commence_time,
              away_abbr: game.away_abbr,
              home_abbr: game.home_abbr,
              favorite_side: spread.favoriteSide,
              spread: spread.spread,
              status: new Date(event.commence_time).getTime() <= Date.now() ? "locked" : "open",
            }, { onConflict: "week_id,provider_game_id" });
          if (!pickemGameError) pickemGamesSaved += 1;
        }
      }
    }
  }

  await admin.from("nfl_data_refreshes").insert({
    refresh_type: "odds",
    season_year: seasonYear,
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
    snapshotsSaved,
    pickemGamesSaved,
    requestCost,
    requestsUsed,
    requestsRemaining,
  });
}
