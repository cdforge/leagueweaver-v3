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
  status: "scheduled" | "in_progress" | "final" | "postponed" | "cancelled";
  final_away_score: number | null;
  final_home_score: number | null;
  final_winner_side: "away" | "home" | null;
  last_score_refresh_at: string | null;
  updated_at: string | null;
};

type NflRecord = {
  wins: number;
  losses: number;
  ties: number;
  divisionWins: number;
  divisionLosses: number;
  divisionTies: number;
};

type OddsSnapshotRow = {
  nfl_game_id: string;
  favorite_side: "away" | "home" | null;
  spread: number | string | null;
  snapshot_at: string;
};

type EspnScoreboardEvent = {
  id?: string;
  date?: string;
  status?: { type?: { name?: string } };
  competitions?: Array<{
    competitors?: Array<{
      homeAway?: "home" | "away";
      score?: string;
      team?: { abbreviation?: string };
    }>;
  }>;
};

const NFL_DIVISIONS: Record<string, string> = {
  BUF: "AFC East", MIA: "AFC East", NE: "AFC East", NYJ: "AFC East",
  BAL: "AFC North", CIN: "AFC North", CLE: "AFC North", PIT: "AFC North",
  HOU: "AFC South", IND: "AFC South", JAX: "AFC South", TEN: "AFC South",
  DEN: "AFC West", KC: "AFC West", LV: "AFC West", LAC: "AFC West",
  DAL: "NFC East", NYG: "NFC East", PHI: "NFC East", WSH: "NFC East",
  CHI: "NFC North", DET: "NFC North", GB: "NFC North", MIN: "NFC North",
  ATL: "NFC South", CAR: "NFC South", NO: "NFC South", TB: "NFC South",
  ARI: "NFC West", LAR: "NFC West", SF: "NFC West", SEA: "NFC West",
};

function emptyRecord(): NflRecord {
  return { wins: 0, losses: 0, ties: 0, divisionWins: 0, divisionLosses: 0, divisionTies: 0 };
}

function formatRecord(record: Pick<NflRecord, "wins" | "losses" | "ties">) {
  return record.ties ? `${record.wins}-${record.losses}-${record.ties}` : `${record.wins}-${record.losses}`;
}

function formatDivisionRecord(record: NflRecord) {
  return record.divisionTies ? `${record.divisionWins}-${record.divisionLosses}-${record.divisionTies}` : `${record.divisionWins}-${record.divisionLosses}`;
}

function recordFor(records: Map<string, NflRecord>, abbr: string) {
  const record = records.get(abbr) ?? emptyRecord();
  return {
    overall: formatRecord(record),
    division: formatDivisionRecord(record),
  };
}

function normalizeEspnStatus(status?: string): NflGameRow["status"] {
  if (status === "STATUS_FINAL" || status === "STATUS_FINAL_OVERTIME") return "final";
  if (status === "STATUS_IN_PROGRESS" || status === "STATUS_HALFTIME" || status === "STATUS_END_PERIOD") return "in_progress";
  if (status === "STATUS_POSTPONED") return "postponed";
  if (status === "STATUS_CANCELED" || status === "STATUS_CANCELLED") return "cancelled";
  return "scheduled";
}

function scoreNumber(score?: string) {
  if (score === undefined || score === "") return null;
  const value = Number(score);
  return Number.isFinite(value) ? value : null;
}

async function loadEspnFallbackGames(seasonYear: number, week: number) {
  const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${seasonYear}&seasontype=2&week=${week}`, {
    next: { revalidate: 60 * 60 },
  });
  if (!response.ok) return [];
  const payload = await response.json() as { events?: EspnScoreboardEvent[] };
  return (payload.events ?? []).flatMap((event): NflGameRow[] => {
    const competitors = event.competitions?.[0]?.competitors ?? [];
    const away = competitors.find((competitor) => competitor.homeAway === "away");
    const home = competitors.find((competitor) => competitor.homeAway === "home");
    const awayAbbr = away?.team?.abbreviation?.toUpperCase();
    const homeAbbr = home?.team?.abbreviation?.toUpperCase();
    if (!event.id || !event.date || !awayAbbr || !homeAbbr) return [];
    const awayScore = scoreNumber(away?.score);
    const homeScore = scoreNumber(home?.score);
    const winner = awayScore !== null && homeScore !== null && awayScore !== homeScore
      ? awayScore > homeScore ? "away" : "home"
      : null;
    return [{
      id: `espn-${event.id}`,
      commence_time: event.date,
      away_abbr: awayAbbr,
      home_abbr: homeAbbr,
      status: normalizeEspnStatus(event.status?.type?.name),
      final_away_score: awayScore,
      final_home_score: homeScore,
      final_winner_side: winner,
      last_score_refresh_at: null,
      updated_at: null,
    }];
  });
}

async function loadGames(seasonYear: number, week: number) {
  const admin = createAdminClient();
  if (!admin) return { games: await loadEspnFallbackGames(seasonYear, week), unavailable: false };

  const byWeek = await admin
    .from("nfl_games")
    .select("id,commence_time,away_abbr,home_abbr,status,final_away_score,final_home_score,final_winner_side,last_score_refresh_at,updated_at")
    .eq("season_year", seasonYear)
    .eq("week", week)
    .order("commence_time", { ascending: true });

  if (byWeek.error) return { games: [], unavailable: true };
  if (byWeek.data?.length) return { games: byWeek.data as NflGameRow[], unavailable: false };

  const window = getNflWeekWindow(seasonYear, week);
  const byDate = await admin
    .from("nfl_games")
    .select("id,commence_time,away_abbr,home_abbr,status,final_away_score,final_home_score,final_winner_side,last_score_refresh_at,updated_at")
    .eq("season_year", seasonYear)
    .gte("commence_time", window.startsAt)
    .lt("commence_time", window.endsAt)
    .order("commence_time", { ascending: true });

  if (byDate.error) return { games: await loadEspnFallbackGames(seasonYear, week), unavailable: false };
  const games = (byDate.data ?? []) as NflGameRow[];
  return { games: games.length ? games : await loadEspnFallbackGames(seasonYear, week), unavailable: false };
}

async function loadRecords(seasonYear: number, week: number) {
  const records = new Map<string, NflRecord>();
  const admin = createAdminClient();
  if (!admin) return records;

  const { data, error } = await admin
    .from("nfl_games")
    .select("away_abbr,home_abbr,final_away_score,final_home_score,final_winner_side")
    .eq("season_year", seasonYear)
    .lte("week", week)
    .eq("status", "final");

  if (error) return records;

  for (const game of (data ?? []) as Array<Pick<NflGameRow, "away_abbr" | "home_abbr" | "final_away_score" | "final_home_score" | "final_winner_side">>) {
    const away = records.get(game.away_abbr) ?? emptyRecord();
    const home = records.get(game.home_abbr) ?? emptyRecord();
    const isDivisionGame = NFL_DIVISIONS[game.away_abbr] && NFL_DIVISIONS[game.away_abbr] === NFL_DIVISIONS[game.home_abbr];

    if (game.final_winner_side === "away") {
      away.wins += 1;
      home.losses += 1;
      if (isDivisionGame) {
        away.divisionWins += 1;
        home.divisionLosses += 1;
      }
    } else if (game.final_winner_side === "home") {
      home.wins += 1;
      away.losses += 1;
      if (isDivisionGame) {
        home.divisionWins += 1;
        away.divisionLosses += 1;
      }
    } else if (game.final_away_score !== null && game.final_home_score !== null && game.final_away_score === game.final_home_score) {
      away.ties += 1;
      home.ties += 1;
      if (isDivisionGame) {
        away.divisionTies += 1;
        home.divisionTies += 1;
      }
    }

    records.set(game.away_abbr, away);
    records.set(game.home_abbr, home);
  }

  return records;
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
  const records = await loadRecords(seasonYear, week);
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
      const awayDivision = NFL_DIVISIONS[game.away_abbr] ?? null;
      const homeDivision = NFL_DIVISIONS[game.home_abbr] ?? null;
      return {
        id: game.id,
        kickoffAt: game.commence_time,
        awayAbbr: game.away_abbr,
        homeAbbr: game.home_abbr,
        status: game.status,
        awayScore: game.final_away_score,
        homeScore: game.final_home_score,
        winnerSide: game.final_winner_side,
        favoriteSide: odds?.favorite_side ?? null,
        spread: odds?.spread === null || odds?.spread === undefined ? null : Number(odds.spread),
        awayRecord: recordFor(records, game.away_abbr),
        homeRecord: recordFor(records, game.home_abbr),
        awayDivision,
        homeDivision,
        divisionalMatchup: Boolean(awayDivision && awayDivision === homeDivision),
        lastUpdatedAt: game.last_score_refresh_at ?? game.updated_at,
      };
    }),
  });
}
