"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Division, ScheduledGame, ScheduleWeek, Team } from "@/lib/types";
import { readableTextColor, tintColor } from "@/lib/colorContrast";
import { formatGameDateTimeOverride } from "@/lib/matchups";
import { getNflWeekWindow } from "@/lib/schedule";
import { getWeekPhase, type WeekPhaseState } from "@/lib/weekPhase";
import { DivisionMark } from "@/components/ui/DivisionIdentity";

/**
 * A live scoreboard strip of the selected week's slate, mounted under the
 * workspace top bar. It reads only data already in memory:
 *  - games arrive pre-ordered by matchup rating (Game of the Week first),
 *  - scores drive the played / winner state (same rule as the standings),
 *  - "live" is derived from the clock via getWeekPhase — no feed, no polling.
 * The whole week shares one phase (pre / live / final); a played game always
 * reads Final regardless, since a recorded score can't be un-recorded.
 *
 * The strip fills the available width and only scrolls once the games would
 * fall below a comfortable minimum cell size. It collapses to a one-line
 * summary (persisted locally), and the Thanksgiving week gets warm styling.
 *
 * Class names are namespaced `sb-*` because `.game`/`.team` are used globally.
 */
export interface WeekScoreBarProps {
  /** The week whose slate is shown. */
  week: ScheduleWeek;
  /** Total regular-season weeks, so prev/next can clamp and the rank can read "of N". */
  weekCount: number;
  /** Season year — enables the clock-derived live phase and holiday detection. */
  seasonYear?: number;
  /** Resolve a team by id (typically `teamById.get`). */
  getTeam: (id: string) => Team | undefined;
  /** Resolve a division by id, for the division mark + chip on division matchups. */
  getDivision?: (id: string) => Division | undefined;
  /** Resolve a team's rank entering this week, shown by each team. */
  getRank?: (teamId: string) => number | undefined;
  /** Game id flagged as Game of the Week; falls back to the top-rated game. */
  gameOfWeekId?: string;
  /** Show `${city} ${name}` rather than just the nickname. */
  displayCityNames?: boolean;
  /** Small label above the week number. */
  railKicker?: string;
  /** Inject a fixed clock (preview / testing). Defaults to the real time. */
  now?: Date;
  /** Force Thanksgiving styling (preview / testing); real weeks auto-detect. */
  thanksgiving?: boolean;
  /** Switch the selected week (kept in sync with the in-view week selector). */
  onSelectWeek: (week: number) => void;
  /** Open a matchup when its card is clicked. */
  onSelectGame?: (gameId: string) => void;
  /** Notified when the collapsed state changes, so the layout can reclaim the strip height. */
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

type TeamState = "win" | "lose" | "up" | "livein" | "livein-win";

function monogram(team: Team): string {
  if (team.initials) return team.initials;
  const source = team.shortName || team.name || team.city || "";
  const letters = source.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || source.slice(0, 2) || "?").toUpperCase();
}

function teamLabel(team: Team, displayCityNames?: boolean): string {
  if (displayCityNames && team.city) return `${team.city} ${team.name}`.trim();
  return team.name || team.shortName || team.city || "Team";
}

function Crest({ team }: { team: Team }) {
  const hasLogo = Boolean(team.logoUrl);
  return (
    <span
      className="sb-crest"
      style={{
        background: hasLogo ? tintColor(team.color) : team.color,
        color: readableTextColor(team.color),
      }}
    >
      {hasLogo ? <img src={team.logoUrl} alt="" /> : monogram(team)}
    </span>
  );
}

function SeriesMeta({ game, division }: { game: ScheduledGame; division?: Division }) {
  const isDivision = game.matchupType === "division";
  const isSeries = game.seriesLength > 1;
  const text = game.dateTimeOverride
    ? formatGameDateTimeOverride(game.dateTimeOverride)
    : isSeries
      ? isDivision
        ? `${game.seriesGame} of ${game.seriesLength}`
        : `Cross-div ${game.seriesGame} of ${game.seriesLength}`
      : isDivision
        ? "Div"
        : "Cross-div";
  return (
    <span className="sb-when">
      {isDivision && division && <DivisionMark division={division} size={13} className="sb-divmark" />}
      {text}
    </span>
  );
}

function TeamRow({
  team,
  score,
  state,
  rank,
  displayCityNames,
}: {
  team: Team;
  score: number | null;
  state: TeamState;
  rank?: number;
  displayCityNames?: boolean;
}) {
  const rowClass =
    state === "win"
      ? "sb-team win"
      : state === "lose"
        ? "sb-team lose"
        : state === "livein-win"
          ? "sb-team win livein"
          : state === "livein"
            ? "sb-team livein"
            : "sb-team up";
  return (
    <div className={rowClass}>
      <span className="sb-rank">{rank != null ? `#${rank}` : ""}</span>
      <Crest team={team} />
      <span className="sb-name">{teamLabel(team, displayCityNames)}</span>
      <span className="sb-score">{score == null ? "–" : score}</span>
    </div>
  );
}

function GameCard({
  game,
  getTeam,
  getDivision,
  getRank,
  featured,
  phase,
  displayCityNames,
  onSelectGame,
}: {
  game: ScheduledGame;
  getTeam: (id: string) => Team | undefined;
  getDivision?: (id: string) => Division | undefined;
  getRank?: (teamId: string) => number | undefined;
  featured: boolean;
  phase: WeekPhaseState["phase"];
  displayCityNames?: boolean;
  onSelectGame?: (gameId: string) => void;
}) {
  const home = getTeam(game.homeTeamId);
  const away = getTeam(game.awayTeamId);
  if (!home || !away) return null;

  const played = game.homeScore != null && game.awayScore != null;
  const live = !played && phase === "live";
  const hs = game.homeScore ?? null;
  const as = game.awayScore ?? null;
  const homeWin = played && (hs as number) > (as as number);
  const awayWin = played && (as as number) > (hs as number);
  const rowState = (win: boolean): TeamState => (played ? (win ? "win" : "lose") : live ? "livein" : "up");

  const division = game.matchupType === "division" ? getDivision?.(home.divisionId) : undefined;
  const cardClass = `sb-game${featured ? " is-gotw" : ""}${live ? " is-live" : ""}`;
  const label =
    `Game ${game.gameNumber ?? ""}, ${teamLabel(away, displayCityNames)} versus ${teamLabel(home, displayCityNames)}` +
    (played ? `, final ${game.awayScore} to ${game.homeScore}` : "");

  return (
    <button
      type="button"
      className={cardClass}
      aria-label={label}
      onClick={onSelectGame ? () => onSelectGame(game.id) : undefined}
    >
      <div className="sb-status">
        <span className="sb-status-left">
          {featured ? (
            <span className="sb-rankchip gotw"><StarIcon /> GOTW</span>
          ) : game.gameNumber ? (
            <span className="sb-rankchip">G{game.gameNumber}</span>
          ) : null}
          <SeriesMeta game={game} division={division} />
        </span>
        {live && <span className="sb-pill live"><span className="sb-dot" /> Live</span>}
        {played && <span className="sb-pill final">Final</span>}
      </div>
      {/* Away row first, then home — matches the schedule view's away@home reading. */}
      <TeamRow team={away} score={played ? as : null} state={rowState(awayWin)} rank={getRank?.(away.id)} displayCityNames={displayCityNames} />
      <TeamRow team={home} score={played ? hs : null} state={rowState(homeWin)} rank={getRank?.(home.id)} displayCityNames={displayCityNames} />
    </button>
  );
}

export function WeekScoreBar({
  week,
  weekCount,
  seasonYear,
  getTeam,
  getDivision,
  getRank,
  gameOfWeekId,
  displayCityNames,
  railKicker = "NFL Week",
  now: nowProp,
  thanksgiving,
  onSelectWeek,
  onSelectGame,
  onCollapsedChange,
  className = "",
}: WeekScoreBarProps) {
  // Clock is read client-side to avoid a hydration mismatch: the first render
  // (server + client) uses a deterministic, score-based fallback, then `now`
  // fills in and re-derives on a cheap minute interval.
  const [now, setNow] = useState<Date | null>(nowProp ?? null);
  useEffect(() => {
    if (nowProp) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [nowProp]);
  const effectiveNow = nowProp ?? now;

  const games = week.games;
  const allPlayed = games.length > 0 && games.every((g) => g.homeScore != null && g.awayScore != null);
  const window_ = useMemo(
    () => (seasonYear ? getNflWeekWindow(seasonYear, week.weekNumber) : null),
    [seasonYear, week.weekNumber],
  );
  const firstOverride = useMemo(
    () => games.map((g) => g.dateTimeOverride).filter((value): value is string => Boolean(value)).sort()[0],
    [games],
  );
  const phaseState: WeekPhaseState =
    effectiveNow && window_
      ? getWeekPhase(effectiveNow, window_, firstOverride)
      : { phase: allPlayed ? "final" : "pre", window: null, label: allPlayed ? "Final" : "Upcoming" };

  const isThanksgiving = Boolean(thanksgiving) || Boolean(window_?.holidays?.includes("Thanksgiving"));
  const gotwId = gameOfWeekId ?? games.find((g) => g.gameNumber === 1)?.id;
  const n = week.weekNumber;
  const hasPrev = n > 1;
  const hasNext = n < weekCount;
  const dateShort = week.dateLabel.split(",")[0];
  const phaseWord = phaseState.phase === "live" ? "Live" : phaseState.phase === "final" ? "Final" : "Upcoming";
  const showBadge = phaseState.phase !== "pre";

  // Collapsed preference persists locally, matching how the app stores other UI state.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(window.localStorage.getItem("lw:scorebar:collapsed") === "1"); } catch { /* ignore */ }
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((current) => {
      const next = !current;
      try { window.localStorage.setItem("lw:scorebar:collapsed", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  // Let the surrounding layout know the strip's height changed so the sidebar can move up.
  useEffect(() => { onCollapsedChange?.(collapsed); }, [collapsed, onCollapsedChange]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const scRef = useRef<HTMLDivElement>(null);

  // Auto-scroll (overflow-only, ping-pong) plus standard scroll affordances:
  // wheel -> horizontal, drag-to-pan, keyboard, edge fades, pause on interaction,
  // and full respect for prefers-reduced-motion. No-ops when the slate fits.
  useEffect(() => {
    const wrap = wrapRef.current;
    const sc = scRef.current;
    if (!wrap || !sc) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let paused = false;
    let idle: number | undefined;
    let dir = 1;
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let moved = 0;
    let raf = 0;

    const maxScroll = () => sc.scrollWidth - sc.clientWidth;
    const fades = () => {
      const ms = maxScroll();
      wrap.classList.toggle("can-left", sc.scrollLeft > 1);
      wrap.classList.toggle("can-right", sc.scrollLeft < ms - 1);
    };
    const pause = (ms = 2600) => {
      paused = true;
      sc.classList.remove("autoscrolling");
      if (idle) window.clearTimeout(idle);
      idle = window.setTimeout(() => { paused = false; }, ms);
    };
    const tick = () => {
      if (!reduce && !paused && !dragging) {
        const ms = maxScroll();
        if (ms > 4) {
          sc.classList.add("autoscrolling");
          sc.scrollLeft += dir * 0.45;
          if (sc.scrollLeft >= ms - 0.5) { dir = -1; pause(1500); }
          else if (sc.scrollLeft <= 0.5) { dir = 1; pause(1500); }
        } else {
          sc.classList.remove("autoscrolling");
        }
        fades();
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        sc.scrollLeft += event.deltaY;
        event.preventDefault();
      }
      pause();
      fades();
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = event.clientX;
      startLeft = sc.scrollLeft;
      sc.classList.add("dragging");
      try { sc.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      moved += Math.abs(dx);
      sc.scrollLeft = startLeft - dx;
      fades();
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      sc.classList.remove("dragging");
      pause(2000);
    };
    const onClickCapture = (event: MouseEvent) => {
      if (moved > 6) { event.preventDefault(); event.stopPropagation(); }
    };
    const onKey = (event: KeyboardEvent) => {
      const card = sc.querySelector<HTMLElement>(".sb-game");
      const step = card ? card.offsetWidth + 1 : 180;
      if (event.key === "ArrowRight") { sc.scrollBy({ left: step, behavior: "smooth" }); pause(); event.preventDefault(); }
      else if (event.key === "ArrowLeft") { sc.scrollBy({ left: -step, behavior: "smooth" }); pause(); event.preventDefault(); }
      else if (event.key === "Home") { sc.scrollTo({ left: 0, behavior: "smooth" }); pause(); event.preventDefault(); }
      else if (event.key === "End") { sc.scrollTo({ left: maxScroll(), behavior: "smooth" }); pause(); event.preventDefault(); }
    };
    const enter = () => pause(60_000);
    const leave = () => pause(500);

    sc.addEventListener("wheel", onWheel, { passive: false });
    sc.addEventListener("pointerdown", onDown);
    sc.addEventListener("pointermove", onMove);
    sc.addEventListener("pointerup", endDrag);
    sc.addEventListener("pointercancel", endDrag);
    sc.addEventListener("click", onClickCapture, true);
    sc.addEventListener("keydown", onKey);
    sc.addEventListener("pointerenter", enter);
    sc.addEventListener("pointerleave", leave);
    sc.addEventListener("focusin", enter);
    sc.addEventListener("focusout", leave);
    sc.addEventListener("scroll", fades, { passive: true });
    window.addEventListener("resize", fades);
    fades();

    return () => {
      window.cancelAnimationFrame(raf);
      if (idle) window.clearTimeout(idle);
      sc.removeEventListener("wheel", onWheel);
      sc.removeEventListener("pointerdown", onDown);
      sc.removeEventListener("pointermove", onMove);
      sc.removeEventListener("pointerup", endDrag);
      sc.removeEventListener("pointercancel", endDrag);
      sc.removeEventListener("click", onClickCapture, true);
      sc.removeEventListener("keydown", onKey);
      sc.removeEventListener("pointerenter", enter);
      sc.removeEventListener("pointerleave", leave);
      sc.removeEventListener("focusin", enter);
      sc.removeEventListener("focusout", leave);
      window.removeEventListener("resize", fades);
    };
  }, [games.length, collapsed]);

  const badge = showBadge ? (
    <span className="sb-badge">
      <span className="sb-dot" aria-hidden="true" />
      <b>{phaseWord}</b>
      {phaseState.phase === "live" && <small>{phaseState.label}</small>}
      {phaseState.phase === "final" && <small>Week complete</small>}
    </span>
  ) : null;

  const rootClass = `sb sb-phase-${phaseState.phase}${isThanksgiving ? " is-thanksgiving" : ""}`;

  if (collapsed) {
    return (
      <div className={`${rootClass} sb-collapsed ${className}`.trim()} role="region" aria-label={`Week ${n} scoreboard, collapsed`}>
        <div className="sb-collapsed-main">
          {isThanksgiving && <span className="sb-turkey" aria-hidden="true">🦃</span>}
          <span className="sb-collapsed-title">Week {n}</span>
          {badge}
          {week.matchupRank != null && <span className="sb-collapsed-rank">Slate <b>#{week.matchupRank}</b></span>}
          <span className="sb-collapsed-hint">{games.length} {games.length === 1 ? "matchup" : "matchups"}</span>
        </div>
        <button type="button" className="sb-toggle" aria-expanded={false} onClick={toggleCollapsed} title="Show matchups">
          <Caret dir="down" />
        </button>
      </div>
    );
  }

  return (
    <div className={`${rootClass} ${className}`.trim()} role="region" aria-label={`Week ${n} scoreboard`}>
      <div className="sb-rail">
        <div className="sb-nav">
          <button type="button" aria-label="Previous week" disabled={!hasPrev} onClick={() => hasPrev && onSelectWeek(n - 1)}>
            <ChevronIcon dir="left" />
          </button>
        </div>
        <div className="sb-meta">
          <span className="sb-kick">{isThanksgiving ? "Thanksgiving Week" : railKicker}</span>
          <span className="sb-num">{isThanksgiving && <span className="sb-turkey" aria-hidden="true">🦃</span>}Week {n}</span>
          <span className="sb-dates">{dateShort}</span>
        </div>
        <div className="sb-state">
          {week.matchupRank != null && (
            <span className="sb-slate" title={`This week's slate ranks ${week.matchupRank} of ${weekCount} by matchup rating`}>
              <span className="sb-slate-num">#{week.matchupRank}</span>
              <span className="sb-slate-label"><b>Slate rank</b><span>of {weekCount}</span></span>
            </span>
          )}
          {badge}
        </div>
        <div className="sb-nav">
          <button type="button" aria-label="Next week" disabled={!hasNext} onClick={() => hasNext && onSelectWeek(n + 1)}>
            <ChevronIcon dir="right" />
          </button>
        </div>
      </div>

      <div className="sb-games-wrap" id="sb-strip" ref={wrapRef}>
        <div
          className="sb-games"
          ref={scRef}
          tabIndex={0}
          aria-label="Matchups ordered by rating. Use left and right arrow keys to scroll."
        >
          {games.length === 0 ? (
            <div className="sb-empty">No matchups this week yet.</div>
          ) : (
            games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                getTeam={getTeam}
                getDivision={getDivision}
                getRank={getRank}
                featured={game.id === gotwId}
                phase={phaseState.phase}
                displayCityNames={displayCityNames}
                onSelectGame={onSelectGame}
              />
            ))
          )}
        </div>
      </div>

      <button type="button" className="sb-toggle" aria-expanded aria-controls="sb-strip" onClick={toggleCollapsed} title="Hide matchups">
        <Caret dir="up" />
      </button>
    </div>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Caret({ dir }: { dir: "up" | "down" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
    </svg>
  );
}
