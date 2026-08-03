"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CalendarDays, LoaderCircle, Star } from "lucide-react";

type NflTrailGame = {
  id: string;
  kickoffAt: string;
  awayAbbr: string;
  homeAbbr: string;
  status: "scheduled" | "in_progress" | "final" | "postponed" | "cancelled";
  awayScore: number | null;
  homeScore: number | null;
  winnerSide: "away" | "home" | null;
  favoriteSide: "away" | "home" | null;
  spread: number | null;
  awayRecord: { overall: string; division: string };
  homeRecord: { overall: string; division: string };
  awayDivision: string | null;
  homeDivision: string | null;
  divisionalMatchup: boolean;
  lastUpdatedAt: string | null;
};

type NflWeekTrailResponse = {
  games?: NflTrailGame[];
  unavailable?: boolean;
  error?: string;
};

type TeamMeta = {
  city: string;
  shortCity?: string;
  division: string;
  primary: string;
  secondary: string;
};

const NFL_TEAMS: Record<string, TeamMeta> = {
  ARI: { city: "Arizona", division: "NFC West", primary: "#97233F", secondary: "#000000" },
  ATL: { city: "Atlanta", division: "NFC South", primary: "#A71930", secondary: "#000000" },
  BAL: { city: "Baltimore", division: "AFC North", primary: "#241773", secondary: "#000000" },
  BUF: { city: "Buffalo", division: "AFC East", primary: "#00338D", secondary: "#C60C30" },
  CAR: { city: "Carolina", division: "NFC South", primary: "#0085CA", secondary: "#101820" },
  CHI: { city: "Chicago", division: "NFC North", primary: "#0B162A", secondary: "#C83803" },
  CIN: { city: "Cincinnati", division: "AFC North", primary: "#FB4F14", secondary: "#000000" },
  CLE: { city: "Cleveland", division: "AFC North", primary: "#311D00", secondary: "#FF3C00" },
  DAL: { city: "Dallas", division: "NFC East", primary: "#003594", secondary: "#041E42" },
  DEN: { city: "Denver", division: "AFC West", primary: "#FB4F14", secondary: "#002244" },
  DET: { city: "Detroit", division: "NFC North", primary: "#0076B6", secondary: "#B0B7BC" },
  GB: { city: "Green Bay", division: "NFC North", primary: "#203731", secondary: "#FFB612" },
  HOU: { city: "Houston", division: "AFC South", primary: "#03202F", secondary: "#A71930" },
  IND: { city: "Indianapolis", division: "AFC South", primary: "#002C5F", secondary: "#A2AAAD" },
  JAX: { city: "Jacksonville", division: "AFC South", primary: "#101820", secondary: "#D7A22A" },
  KC: { city: "Kansas City", division: "AFC West", primary: "#E31837", secondary: "#FFB81C" },
  LAC: { city: "Los Angeles", shortCity: "LA", division: "AFC West", primary: "#0080C6", secondary: "#FFC20E" },
  LAR: { city: "Los Angeles", shortCity: "LA", division: "NFC West", primary: "#003594", secondary: "#FFA300" },
  LV: { city: "Las Vegas", division: "AFC West", primary: "#000000", secondary: "#A5ACAF" },
  MIA: { city: "Miami", division: "AFC East", primary: "#008E97", secondary: "#FC4C02" },
  MIN: { city: "Minnesota", division: "NFC North", primary: "#4F2683", secondary: "#FFC62F" },
  NE: { city: "New England", division: "AFC East", primary: "#002244", secondary: "#C60C30" },
  NO: { city: "New Orleans", division: "NFC South", primary: "#D3BC8D", secondary: "#101820" },
  NYG: { city: "New York", shortCity: "NY", division: "NFC East", primary: "#0B2265", secondary: "#A71930" },
  NYJ: { city: "New York", shortCity: "NY", division: "AFC East", primary: "#125740", secondary: "#000000" },
  PHI: { city: "Philadelphia", division: "NFC East", primary: "#004C54", secondary: "#A5ACAF" },
  PIT: { city: "Pittsburgh", division: "AFC North", primary: "#FFB612", secondary: "#101820" },
  SEA: { city: "Seattle", division: "NFC West", primary: "#002244", secondary: "#69BE28" },
  SF: { city: "San Francisco", division: "NFC West", primary: "#AA0000", secondary: "#B3995D" },
  TB: { city: "Tampa Bay", division: "NFC South", primary: "#D50A0A", secondary: "#FF7900" },
  TEN: { city: "Tennessee", division: "AFC South", primary: "#0C2340", secondary: "#4B92DB" },
  WSH: { city: "Washington", division: "NFC East", primary: "#5A1414", secondary: "#FFB612" },
};

const DUPLICATE_MARKETS = new Set(["Los Angeles", "New York"]);

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

const compactDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "numeric",
  day: "numeric",
  timeZone: "America/New_York",
});

function statusLabel(game: NflTrailGame) {
  if (game.status === "final") return "Final";
  if (game.status === "postponed") return "Postponed";
  if (game.status === "cancelled") return "Cancelled";
  return "";
}

function spreadLabel(spread: number) {
  return `-${spread.toFixed(spread % 1 === 0 ? 0 : 1)}`;
}

function favoriteMeta(game: NflTrailGame) {
  if (!game.favoriteSide || typeof game.spread !== "number" || !Number.isFinite(game.spread)) return null;
  const abbr = game.favoriteSide === "away" ? game.awayAbbr : game.homeAbbr;
  return {
    abbr,
    spread: spreadLabel(game.spread),
  };
}

function parseHexColor(color: string) {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return null;
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  if ([red, green, blue].some((value) => Number.isNaN(value))) return null;
  return { red, green, blue };
}

function markTextColor(primary: string) {
  const rgb = parseHexColor(primary);
  if (!rgb) return "#ffffff";
  const luminance = (0.299 * rgb.red + 0.587 * rgb.green + 0.114 * rgb.blue) / 255;
  return luminance > 0.58 ? "#15231c" : "#ffffff";
}

function teamDisplayName(abbr: string) {
  const meta = NFL_TEAMS[abbr];
  if (!meta) return abbr;
  if (DUPLICATE_MARKETS.has(meta.city)) return `${meta.shortCity ?? meta.city} · ${meta.division}`;
  return meta.city;
}

function teamStyle(abbr: string) {
  const meta = NFL_TEAMS[abbr] ?? { primary: "#117a45", secondary: "#e3b940", division: "" };
  return {
    "--nfl-primary": meta.primary,
    "--nfl-secondary": meta.secondary,
    "--nfl-mark-ink": markTextColor(meta.primary),
  } as CSSProperties;
}

function dayParts(label: string) {
  const [weekday = "", rest = ""] = label.split(", ");
  return { weekday, date: rest };
}

function cardDateTimeLabel(kickoff: Date) {
  return `${compactDateFormatter.format(kickoff)} · ${timeFormatter.format(kickoff)} ET`;
}

function TeamMark({ abbr }: { abbr: string }) {
  return <span className="nfl-team-mark" title={`${teamDisplayName(abbr)} ${abbr}`} style={teamStyle(abbr)} aria-hidden="true" />;
}

function TeamLine({ abbr, score, winner, favored, record }: {
  abbr: string;
  score: number | null;
  winner: boolean;
  favored: boolean;
  record: { overall: string; division: string };
}) {
  return <span className={`nfl-team-line ${winner ? "winner" : ""}`}>
    <TeamMark abbr={abbr} />
    <strong className="nfl-team-abbr" title={teamDisplayName(abbr)}>
      {abbr}
      {favored ? <Star className="nfl-favorite-star" aria-label={`${abbr} favored`} /> : null}
    </strong>
    <small className="nfl-team-record">{record.overall} ({record.division})</small>
    <strong className={score === null ? "is-pending" : ""}>{score ?? "--"}</strong>
  </span>;
}

function NflTrailCard({ game }: { game: NflTrailGame }) {
  const awayWinner = game.winnerSide === "away";
  const homeWinner = game.winnerSide === "home";
  const kickoff = new Date(game.kickoffAt);
  const status = statusLabel(game);
  const favorite = favoriteMeta(game);
  return <article className={`nfl-trail-card ${game.status === "final" ? "is-final" : ""}`}>
    <header>
      <span>{cardDateTimeLabel(kickoff)}</span>
      {status ? <em>{status}</em> : null}
    </header>
    <div className="nfl-trail-matchup">
      <TeamLine abbr={game.awayAbbr} score={game.awayScore} winner={awayWinner} favored={game.favoriteSide === "away"} record={game.awayRecord} />
      <TeamLine abbr={game.homeAbbr} score={game.homeScore} winner={homeWinner} favored={game.favoriteSide === "home"} record={game.homeRecord} />
    </div>
    <footer>
      {favorite ? <span
        className="nfl-favorite-chip"
        style={teamStyle(favorite.abbr)}
        aria-label={`Favorite ${favorite.abbr} ${favorite.spread}`}
        title={`Favorite: ${favorite.abbr} ${favorite.spread}`}
      >
        <strong>{favorite.abbr}</strong>
        <b>{favorite.spread}</b>
      </span> : <span className="nfl-favorite-empty">No stored line</span>}
      {game.divisionalMatchup && game.awayDivision ? <span className="nfl-division-chip" title={`${game.awayDivision} divisional matchup`}>
        <b>{game.awayDivision}</b>
      </span> : null}
    </footer>
  </article>;
}

type DayGroup = {
  key: string;
  label: string;
  games: NflTrailGame[];
};

function groupGamesByDay(games: NflTrailGame[]) {
  return games.reduce<DayGroup[]>((groups, game) => {
    const kickoff = new Date(game.kickoffAt);
    const label = dayFormatter.format(kickoff);
    const key = label;
    const current = groups[groups.length - 1];
    if (current?.key === key) {
      current.games.push(game);
    } else {
      groups.push({ key, label, games: [game] });
    }
    return groups;
  }, []);
}

function DayGroups({ groups, clone = false }: { groups: DayGroup[]; clone?: boolean }) {
  return <div className={`nfl-week-trail-loop-set ${clone ? "is-clone" : ""}`} aria-hidden={clone || undefined}>
    {groups.map((group) => {
      const parts = dayParts(group.label);
      return <section className="nfl-day-group" key={`${clone ? "clone-" : ""}${group.key}`} aria-label={clone ? undefined : group.label}>
        <div className="nfl-day-label">
          <strong>{parts.weekday}</strong>
          <span>{parts.date}</span>
        </div>
        <div className="nfl-day-games">
          {group.games.map((game) => <NflTrailCard key={`${clone ? "clone-" : ""}${game.id}`} game={game} />)}
        </div>
      </section>;
    })}
  </div>;
}

export function NflWeekTrail({ seasonYear, week }: { seasonYear: number; week: number }) {
  const [games, setGames] = useState<NflTrailGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

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

  const dayGroups = useMemo(() => groupGamesByDay(games), [games]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || autoScrollPaused || games.length < 4) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let alignTimer = 0;
    let stepTimer = 0;
    let resetTimer = 0;

    const targetLeft = (element: HTMLElement) => {
      const styles = window.getComputedStyle(scroller);
      const horizontalPadding = Number.parseFloat(styles.paddingLeft) || 0;
      const stripRect = scroller.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      return Math.max(0, scroller.scrollLeft + elementRect.left - stripRect.left - horizontalPadding - 2);
    };
    const scrollTargetForCard = (card: HTMLElement) => {
      const gameList = card.parentElement;
      const isFirstGameOfDay = gameList?.firstElementChild === card;
      return isFirstGameOfDay ? card.closest<HTMLElement>(".nfl-day-group") ?? card : card;
    };
    const originalCards = () => Array.from(scroller.querySelectorAll<HTMLElement>(".nfl-week-trail-loop-set:not(.is-clone) .nfl-trail-card"));
    const cardPositions = () => originalCards().map((card) => targetLeft(scrollTargetForCard(card)));
    const cloneFirstCard = () => scroller.querySelector<HTMLElement>(".nfl-week-trail-loop-set.is-clone .nfl-trail-card");

    const scrollToPosition = (left: number, behavior: ScrollBehavior = "smooth") => {
      scroller.scrollTo({ left, behavior });
    };

    const alignToFirstGame = () => {
      const firstPosition = cardPositions()[0];
      if (typeof firstPosition === "number" && scroller.scrollLeft < firstPosition - 2) {
        scrollToPosition(firstPosition, "auto");
      }
    };

    const stepToNextGame = () => {
      const positions = cardPositions();
      if (positions.length < 2 || scroller.scrollWidth <= scroller.clientWidth) return;
      const current = scroller.scrollLeft;
      const nextPosition = positions.find((position) => position > current + 8);
      if (typeof nextPosition === "number") {
        scrollToPosition(nextPosition);
        return;
      }
      const cloneCard = cloneFirstCard();
      if (!cloneCard) {
        scrollToPosition(positions[0] ?? 0);
        return;
      }
      scrollToPosition(targetLeft(scrollTargetForCard(cloneCard)));
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => scrollToPosition(positions[0] ?? 0, "auto"), 1600);
    };

    alignTimer = window.setTimeout(alignToFirstGame, 300);
    stepTimer = window.setInterval(stepToNextGame, 5600);
    return () => {
      window.clearTimeout(alignTimer);
      window.clearTimeout(resetTimer);
      window.clearInterval(stepTimer);
    };
  }, [autoScrollPaused, games.length]);

  return <section className="nfl-week-trail" aria-labelledby="nfl-week-trail-title">
    <h2 id="nfl-week-trail-title" className="sr-only">Stored NFL Week {week} slate</h2>
    {loading ? <div className="nfl-week-trail-empty" role="status"><LoaderCircle className="spin" /><span>Loading stored NFL games...</span></div>
      : games.length ? <div
        ref={scrollerRef}
        className="nfl-week-trail-strip"
        aria-label={`Stored NFL Week ${week} game ticker`}
        tabIndex={0}
        onFocus={() => setAutoScrollPaused(true)}
        onBlur={() => setAutoScrollPaused(false)}
        onPointerDown={() => setAutoScrollPaused(true)}
        onPointerUp={() => setAutoScrollPaused(false)}
        onPointerCancel={() => setAutoScrollPaused(false)}
      >
        <DayGroups groups={dayGroups} />
        <DayGroups groups={dayGroups} clone />
      </div>
        : <div className="nfl-week-trail-empty" role="status">
          <CalendarDays />
          <span>{unavailable ? "Stored NFL data is not available yet." : `No stored NFL Week ${week} games yet.`}</span>
        </div>}
  </section>;
}
