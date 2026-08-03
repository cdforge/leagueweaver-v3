"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { CalendarDays, Database, LoaderCircle } from "lucide-react";

type NflTrailGame = {
  id: string;
  kickoffAt: string;
  awayAbbr: string;
  homeAbbr: string;
  awayName: string;
  homeName: string;
  status: "scheduled" | "in_progress" | "final" | "postponed" | "cancelled";
  awayScore: number | null;
  homeScore: number | null;
  winnerSide: "away" | "home" | null;
  favoriteSide: "away" | "home" | null;
  spread: number | null;
  lastUpdatedAt: string | null;
};

type NflWeekTrailResponse = {
  games?: NflTrailGame[];
  unavailable?: boolean;
  error?: string;
};

const TEAM_COLORS: Record<string, string> = {
  ARI: "#97233F", ATL: "#A71930", BAL: "#241773", BUF: "#00338D",
  CAR: "#0085CA", CHI: "#0B162A", CIN: "#FB4F14", CLE: "#311D00",
  DAL: "#003594", DEN: "#FB4F14", DET: "#0076B6", GB: "#203731",
  HOU: "#03202F", IND: "#002C5F", JAX: "#006778", KC: "#E31837",
  LAC: "#0080C6", LAR: "#003594", LV: "#000000", MIA: "#008E97",
  MIN: "#4F2683", NE: "#002244", NO: "#D3BC8D", NYG: "#0B2265",
  NYJ: "#125740", PHI: "#004C54", PIT: "#FFB612", SEA: "#002244",
  SF: "#AA0000", TB: "#D50A0A", TEN: "#0C2340", WSH: "#5A1414",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const updatedFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function statusLabel(game: NflTrailGame) {
  if (game.status === "final") return "Final";
  if (game.status === "in_progress") return "No result yet";
  if (game.status === "postponed") return "Postponed";
  if (game.status === "cancelled") return "Cancelled";
  return "Upcoming";
}

function favoriteLabel(game: NflTrailGame) {
  if (!game.favoriteSide || typeof game.spread !== "number" || !Number.isFinite(game.spread)) return "No stored line";
  const abbr = game.favoriteSide === "away" ? game.awayAbbr : game.homeAbbr;
  return `Favorite: ${abbr} -${game.spread.toFixed(game.spread % 1 === 0 ? 0 : 1)}`;
}

function resultLabel(game: NflTrailGame) {
  if (game.status === "final") return "Stored result";
  if (game.status === "scheduled") return "Awaiting result";
  return "No result yet";
}

function teamStyle(abbr: string) {
  return { "--nfl-team-color": TEAM_COLORS[abbr] ?? "#117a45" } as CSSProperties;
}

function TeamAbbr({ abbr, name, winner }: { abbr: string; name: string; winner: boolean }) {
  return <span className={`nfl-trail-team ${winner ? "winner" : ""}`} title={name} style={teamStyle(abbr)}>
    <i aria-hidden="true" />
    <strong>{abbr}</strong>
  </span>;
}

function NflTrailCard({ game }: { game: NflTrailGame }) {
  const awayWinner = game.winnerSide === "away";
  const homeWinner = game.winnerSide === "home";
  const hasFinalScore = game.awayScore !== null && game.homeScore !== null;
  return <article className={`nfl-trail-card ${game.status === "final" ? "is-final" : ""}`}>
    <header>
      <span>{dateFormatter.format(new Date(game.kickoffAt))}</span>
      <em>{statusLabel(game)}</em>
    </header>
    <div className="nfl-trail-scoreline">
      <TeamAbbr abbr={game.awayAbbr} name={game.awayName} winner={awayWinner} />
      <b>{hasFinalScore ? game.awayScore : ""}</b>
      <span className="nfl-trail-at">at</span>
      <TeamAbbr abbr={game.homeAbbr} name={game.homeName} winner={homeWinner} />
      <b>{hasFinalScore ? game.homeScore : ""}</b>
    </div>
    <footer>
      <span>{favoriteLabel(game)}</span>
      <span>{resultLabel(game)}</span>
    </footer>
  </article>;
}

export function NflWeekTrail({ seasonYear, week }: { seasonYear: number; week: number }) {
  const [games, setGames] = useState<NflTrailGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/nfl-week?seasonYear=${encodeURIComponent(seasonYear)}&week=${encodeURIComponent(week)}`)
      .then((response) => response.json())
      .then((payload: NflWeekTrailResponse) => {
        if (cancelled) return;
        setGames(payload.games ?? []);
        setUnavailable(Boolean(payload.unavailable || payload.error));
      })
      .catch(() => {
        if (cancelled) return;
        setGames([]);
        setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [seasonYear, week]);

  const lastUpdatedAt = useMemo(() => {
    const latest = games
      .map((game) => game.lastUpdatedAt ? Date.parse(game.lastUpdatedAt) : 0)
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => b - a)[0];
    return latest ? updatedFormatter.format(new Date(latest)) : null;
  }, [games]);

  return <section className="nfl-week-trail" aria-labelledby="nfl-week-trail-title">
    <header className="nfl-week-trail-head">
      <span className="nfl-week-trail-mark"><CalendarDays /></span>
      <div>
        <small>NFL THIS WEEK</small>
        <h2 id="nfl-week-trail-title">Stored NFL Week {week} slate</h2>
        <p>{lastUpdatedAt ? `Last stored update ${lastUpdatedAt}` : "Shared site data. No user refresh needed."}</p>
      </div>
      <span className="nfl-week-trail-source"><Database /> Finals only</span>
    </header>
    {loading ? <div className="nfl-week-trail-empty" role="status"><LoaderCircle className="spin" /><span>Loading stored NFL games...</span></div>
      : games.length ? <div className="nfl-week-trail-grid">{games.map((game) => <NflTrailCard key={game.id} game={game} />)}</div>
        : <div className="nfl-week-trail-empty" role="status">
          <CalendarDays />
          <span>{unavailable ? "Stored NFL data is not available yet." : `No stored NFL Week ${week} games yet.`}</span>
        </div>}
  </section>;
}
