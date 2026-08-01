"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Route,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import type { GeneratedSchedule, ScheduleWeek, ScheduledGame, Team } from "@/lib/types";
import { getNflWeekWindow, getNflWeeks } from "@/lib/schedule";
import { divisionSeriesGaps, strengthOfSchedule, toughestGauntlet, type Gauntlet, type StrengthPick } from "@/lib/revealStats";
import { accessibleAccentColor, readableTextColor } from "@/lib/colorContrast";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { teamInitials } from "@/lib/teamIdentity";

export type RevealMode = "generate" | "replay";

type Scene = {
  key: string;
  /** Narrative slot; scenes are sorted by this so optional beats land in order. */
  order: number;
  icon: React.ReactNode;
  /** Optional 3D hero render (dark-field JPEG); feathered in CSS so it floats without a visible background. */
  art?: string;
  kicker: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  /** Two team colors for the marquee color wash. */
  wash?: [string, string];
  holdMs: number;
  /** The closing card: it waits for a human instead of auto-advancing. */
  finale?: boolean;
  /** Optional beats beyond the core five. Lower priority shows first in the lean generate reel. */
  priority?: number;
  /** Stat-style beats that only belong in the fuller replay recap, not the first-run reveal. */
  replayOnly?: boolean;
};

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/**
 * A short, celebratory reveal shown after the schedule is solved. It reads real
 * facts off the finished season — no fake progress — and plays them back like a
 * Spotify-Wrapped story: segmented progress up top, tap or arrow to move through
 * the beats, hold to pause, and a finale that waits for the commissioner to open
 * their workspace (or replay). The season is already generated before this mounts,
 * so nothing here blocks real work — it's pure celebration and can be self-paced.
 */
export function GenerationReveal({ schedule, onComplete, mode = "generate" }: { schedule: GeneratedSchedule; onComplete: () => void; mode?: RevealMode }) {
  const scenes = useMemo(() => buildScenes(schedule, mode), [schedule, mode]);
  const loomColumns = useMemo(() => weaveColumnsOf(schedule), [schedule]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const last = scenes.length - 1;
  const scene = scenes[Math.min(index, last)] ?? scenes[0];
  const finished = index >= last;
  // A concise, stable screen-reader announcement per beat — the rich visual scene
  // is hidden from AT, so this single live region carries the meaning without
  // reading out every seed/glyph or thrashing on the count-up.
  const captionText = typeof scene.caption === "string" ? scene.caption : "";
  const announce = finished
    ? (mode === "replay" ? "That's the season. Screenshot to share, or replay." : "Your season is ready. Screenshot to share, or open your schedule.")
    : `${scene.kicker}. ${captionText}`.trim();

  const next = useCallback(() => setIndex((current) => Math.min(last, current + 1)), [last]);
  const prev = useCallback(() => setIndex((current) => Math.max(0, current - 1)), []);
  const replay = useCallback(() => { setIndex(0); setPaused(false); }, []);

  // Honor reduced-motion: no auto-advance and no fill animation; the story is
  // driven entirely by the explicit Prev/Next controls and the keyboard instead.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Move focus into the story so arrow keys work without a click first.
  useEffect(() => { stageRef.current?.focus({ preventScroll: true }); }, []);

  // When the finale arrives, move focus to its primary action so keyboard/SR users
  // land on the CTA instead of being stranded on the (now buttonless) stage.
  useEffect(() => { if (finished) ctaRef.current?.focus({ preventScroll: true }); }, [finished]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onComplete(); return; }
      // Trap Tab within the overlay so focus never escapes to the page behind the
      // aria-modal dialog (aria-modal hides siblings from AT but doesn't stop Tab).
      if (event.key === "Tab") {
        const overlay = overlayRef.current;
        if (!overlay) return;
        const focusables = overlay.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])");
        if (!focusables.length) return;
        const first = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!overlay.contains(active)) { event.preventDefault(); first.focus(); }
        else if (event.shiftKey && active === first) { event.preventDefault(); lastEl.focus(); }
        else if (!event.shiftKey && active === lastEl) { event.preventDefault(); first.focus(); }
        return;
      }
      // Let focused controls (the finale CTA / Back / Replay) handle their own
      // Enter/Space instead of the story's global navigation hijacking them.
      if ((event.target as HTMLElement | null)?.closest?.("button, a, input, textarea, select")) return;
      if (event.key === "ArrowRight") { event.preventDefault(); next(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); prev(); }
      else if (event.key === "Enter") { event.preventDefault(); if (finished) onComplete(); else next(); }
      else if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (!finished && !reduced) setPaused((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onComplete, next, prev, finished, reduced]);

  // Press-and-hold anywhere pauses the story (Instagram/Wrapped gesture); a quick
  // tap navigates — left third goes back, the rest goes forward.
  const holdTimer = useRef<number | undefined>(undefined);
  const didHold = useRef(false);
  const clearHold = () => { if (holdTimer.current) window.clearTimeout(holdTimer.current); holdTimer.current = undefined; };
  const onPointerDown = () => {
    didHold.current = false;
    clearHold();
    holdTimer.current = window.setTimeout(() => { didHold.current = true; setPaused(true); }, 220);
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    clearHold();
    if (didHold.current) { didHold.current = false; setPaused(false); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX - rect.left < rect.width * 0.33) prev();
    else next();
  };
  const onPointerCancel = () => { clearHold(); if (didHold.current) { didHold.current = false; setPaused(false); } };

  // Render past any transformed ancestor so the fixed overlay always fills the
  // viewport. GenerationReveal only mounts after a client-side click, so this
  // never runs during SSR, but guard document defensively all the same.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`reveal-overlay${scene.wash ? " washed" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Your season, unveiled"
      style={scene.wash ? ({ "--wash-a": scene.wash[0], "--wash-b": scene.wash[1] } as React.CSSProperties) : undefined}
    >
      {/* One stable live region carries the per-beat announcement (the visual scene
          below is aria-hidden), so AT hears a concise line, not the whole card. */}
      <p className="reveal-sr-live" aria-live="polite">{announce}</p>
      {/* Persistent loom: the real weave, faint, behind every beat. */}
      <LoomBackdrop columns={loomColumns} />
      {/* Full-field colour wash fed by the beat's own teams — the background becomes
          the story's colours where a beat is about specific teams, and stays the
          brand green for the league-level bookends (kickoff, window, finale). */}
      <div className="reveal-wash" aria-hidden="true" />
      <div className="reveal-stage" ref={stageRef} tabIndex={-1}>
        <div className="reveal-segments" aria-hidden="true">
          {scenes.map((item, itemIndex) => {
            const done = itemIndex < index || (itemIndex === index && finished);
            const active = itemIndex === index && !finished && !reduced;
            return (
              <span key={item.key} className={`reveal-seg${done ? " done" : ""}${itemIndex === index ? " current" : ""}`}>
                <i
                  style={active ? { animationDuration: `${item.holdMs}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                  onAnimationEnd={active ? next : undefined}
                />
              </span>
            );
          })}
        </div>

        <div className="reveal-brandline">
          <Sparkles aria-hidden="true" />
          <span>{finished ? "Season woven" : "Weaving your season"}</span>
          {paused && !finished && <em className="reveal-paused">Paused</em>}
        </div>

        <div className="reveal-scene" key={scene.key} aria-hidden="true">
          {scene.art
            ? <img className="reveal-art" src={scene.art} alt="" aria-hidden="true" draggable={false} />
            : <span className="reveal-icon" aria-hidden="true">{scene.icon}</span>}
          <p className="reveal-kicker">{scene.kicker}</p>
          <p className="reveal-value">{scene.value}</p>
          {scene.caption && <p className="reveal-caption">{scene.caption}</p>}
          {index === 0 && !reduced && <p className="reveal-hint" aria-hidden="true">Tap to move · hold to pause</p>}
        </div>

        {finished && (
          <div className="reveal-actions">
            <button ref={ctaRef} type="button" className="reveal-cta" onClick={onComplete}>{mode === "replay" ? "Back to schedule →" : "See my schedule →"}</button>
            <div className="reveal-actions-secondary">
              <button type="button" onClick={prev}><ArrowLeft aria-hidden="true" />Back</button>
              <button type="button" onClick={replay}><RotateCcw aria-hidden="true" />Replay</button>
            </div>
          </div>
        )}

      </div>

      {!finished && !reduced && (
        <div
          className="reveal-tapzone"
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
        />
      )}

      {!finished && (
        <>
          <button type="button" className="reveal-arrow reveal-arrow-left" onClick={prev} disabled={index === 0} aria-label="Previous">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="reveal-arrow reveal-arrow-right" onClick={next} aria-label="Next">
            <ChevronRight aria-hidden="true" />
          </button>
        </>
      )}

      {!finished && (
        <button type="button" className="reveal-skip" onClick={onComplete}>{mode === "replay" ? "Close" : "Skip to my schedule →"}</button>
      )}

      {!finished && !reduced && (
        <button type="button" className="reveal-playpause" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Play" : "Pause"}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </button>
      )}
    </div>,
    document.body,
  );
}

/** Order-independent key for a matchup, so a pair reads the same home or away. */
function pairKey(game: ScheduledGame): string {
  return [game.homeTeamId, game.awayTeamId].sort((left, right) => left.localeCompare(right)).join("~");
}

function buildScenes(schedule: GeneratedSchedule, mode: RevealMode): Scene[] {
  const { setup } = schedule;
  const teamById = (id: string) => setup.teams.find((team) => team.id === id);
  const teamLabel = (id: string) => {
    const team = teamById(id);
    if (!team) return "TBD";
    return setup.display.cityNames && team.city ? `${team.city} ${team.name}` : team.name;
  };
  // Prefer the team's own image (no colour-tinted backing) and fall back to a
  // colour + monogram chip only when a team has no logo.
  const crest = (team: Team, size: number) => (
    <EntityLogo className="reveal-crest" size={size} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} imagePresentation="bare" />
  );
  // Size-flexible team mark: the raw logo image when a team has one (no colour
  // backing), or a small colour + initials chip otherwise. Lets tiny inline spots
  // (list rows, venue) show a real logo below EntityLogo's 32px floor.
  const teamMark = (team: Team, size: number) =>
    team.logoUrl
      ? <img className="reveal-mark" src={team.logoUrl} alt="" width={size} height={size} style={{ width: size, height: size }} draggable={false} />
      : <span className="reveal-mark reveal-mark-mono" style={{ width: size, height: size, background: team.color, color: readableTextColor(team.color), fontSize: Math.round(size * 0.42) }}>{teamInitials(team)}</span>;
  const seed = (team: Team) => <span className="reveal-seed">#{team.overallRank}</span>;
  // Matchups read "away @ home" (the home team hosts), every team carries its
  // overall rank, and the strongest game of a slate is flagged Game of the Week
  // with the host's venue below it.
  // Team names render in the team's own colour — but a dark team colour (navy,
  // black) on the dark field falls below WCAG. Route every name through the
  // adaptive helper (against the card/field ground) so it stays legible; a raw
  // brightness() filter can't lift a near-black, so those filters are dropped too.
  const nameColor = (color: string) => accessibleAccentColor(color, "#0a2418");
  // How strong a team is on a 0..1 scale (the #1 seed ≈ 1). Drives the marquee
  // "Game of the Week" bug's power meter so eliteness is shown, not just labelled.
  const strengthOf = (rank: number) => (setup.teams.length + 1 - rank) / Math.max(1, setup.teams.length);
  const matchup = (game: ScheduledGame, { size = 112, gotw = false, venue = false }: { size?: number; gotw?: boolean; venue?: boolean } = {}) => {
    const home = teamById(game.homeTeamId);
    const away = teamById(game.awayTeamId);
    if (!home || !away) return null;
    return (
      <span className="reveal-matchup-wrap">
        {gotw && <span className="reveal-gotw"><Star aria-hidden="true" />Game of the Week</span>}
        <span className={`reveal-matchup${size <= 76 ? " reveal-matchup-sm" : ""}`}>
          <span className="reveal-team">{crest(away, size)}<b style={{ color: nameColor(away.color) }}>{teamLabel(away.id)}</b>{seed(away)}</span>
          <em>@</em>
          <span className="reveal-team">{crest(home, size)}<b style={{ color: nameColor(home.color) }}>{teamLabel(home.id)}</b>{seed(home)}</span>
        </span>
        {((venue && home.stadium) || game.seriesLength > 1) && (
          <span className="reveal-meta">
            {venue && home.stadium && <span className="reveal-venue">{teamMark(home, 18)}{home.stadium}</span>}
            {game.seriesLength > 1 && <span className="reveal-series">Game {game.seriesGame} of {game.seriesLength}</span>}
          </span>
        )}
      </span>
    );
  };
  const divisionOf = (team: Team) => setup.divisions.find((division) => division.id === team.divisionId);
  // The reusable "Game of the Week" bug (SNF logic): a fixed broadcast frame the
  // two teams drop into — crests facing across a VS, the background split down the
  // seam into each team's colour, and a mini tale-of-the-tape (seed · division ·
  // power) below. The frame is constant; the teams are the variable art.
  const gotwBug = (game: ScheduledGame) => {
    const home = teamById(game.homeTeamId);
    const away = teamById(game.awayTeamId);
    if (!home || !away) return null;
    const awayDivision = divisionOf(away);
    const homeDivision = divisionOf(home);
    return (
      <span className="reveal-bug" style={{ "--away": away.color, "--home": home.color } as React.CSSProperties}>
        <span className="reveal-bug-tab"><Star aria-hidden="true" />Game of the Week</span>
        <span className="reveal-bug-hero">
          <span className="reveal-bug-side">
            {crest(away, 76)}
            <b style={{ color: nameColor(away.color) }}>{away.name}</b>
            <i className="reveal-seed">#{away.overallRank}</i>
          </span>
          <span className="reveal-bug-vs"><em>VS</em></span>
          <span className="reveal-bug-side">
            {crest(home, 76)}
            <b style={{ color: nameColor(home.color) }}>{home.name}</b>
            <i className="reveal-seed">#{home.overallRank}</i>
          </span>
        </span>
        <span className="reveal-bug-tape">
          <span className="reveal-tape-row"><b>#{away.overallRank}</b><span>Seed</span><b>#{home.overallRank}</b></span>
          {awayDivision && homeDivision && (
            awayDivision.id === homeDivision.id
              ? <span className="reveal-tape-row reveal-tape-single"><span>Division</span><b>{awayDivision.name}</b></span>
              : <span className="reveal-tape-row"><b>{awayDivision.name}</b><span>Division</span><b>{homeDivision.name}</b></span>
          )}
        </span>
        <span className="reveal-bug-power">
          <span className="reveal-power" aria-hidden="true">
            <span className="reveal-power-fill reveal-power-a" style={{ width: `${Math.round(strengthOf(away.overallRank) * 46)}%`, background: away.color }} />
            <span className="reveal-power-fill reveal-power-b" style={{ width: `${Math.round(strengthOf(home.overallRank) * 46)}%`, background: home.color }} />
            <em className="reveal-power-at">@</em>
          </span>
          <small>Matchup power</small>
        </span>
        {home.stadium && <span className="reveal-bug-venue">{teamMark(home, 16)}{home.stadium}</span>}
      </span>
    );
  };
  // A compact "away @ home" row (with logos + ranks) for the truncated lineups.
  const gameRow = (game: ScheduledGame) => {
    const home = teamById(game.homeTeamId);
    const away = teamById(game.awayTeamId);
    if (!home || !away) return null;
    return (
      <span className="reveal-slate-game" key={game.id}>
        <span className="reveal-slate-team">{teamMark(away, 24)}<i className="reveal-seed-sm">#{away.overallRank}</i>{away.name}</span>
        <em>@</em>
        <span className="reveal-slate-team">{teamMark(home, 24)}<i className="reveal-seed-sm">#{home.overallRank}</i>{home.name}</span>
      </span>
    );
  };
  // Headliner matchup + a truncated view of the rest of that week's slate.
  const slateValue = (headliner: ScheduledGame, rest: ScheduledGame[], restLimit: number) => {
    const value = matchup(headliner, { size: 64, gotw: true, venue: true });
    if (!value) return null;
    const shown = rest.slice(0, restLimit);
    const more = rest.length - shown.length;
    return (
      <span className="reveal-slate">
        {value}
        {shown.length > 0 && (
          <span className="reveal-slate-rest">
            <span className="reveal-slate-label">Also that week</span>
            {shown.map(gameRow)}
            {more > 0 && <span className="reveal-slate-more">+{more} more</span>}
          </span>
        )}
      </span>
    );
  };
  // Visual "shows" for the recap stat beats: heights and positions carry the fact,
  // so the eye reads difficulty instead of parsing a number in the caption.
  // toughnessOf normalizes an overall rank to 0..1 (the #1 seed = 1, the tallest).
  const teamCount = setup.teams.length;
  const toughnessOf = (rank: number) => (teamCount + 1 - rank) / Math.max(1, teamCount);
  // The gauntlet as a climb: each consecutive opponent is a bar whose height reads
  // its strength, so the brutal middle of the run is visible, not merely listed.
  const gauntletClimb = (subject: Team, run: Gauntlet) => (
    <span className="reveal-climb">
      <span className="reveal-climb-subject">{crest(subject, 52)}<b style={{ color: nameColor(subject.color) }}>{subject.name}</b><span className="reveal-seed">#{subject.overallRank}</span></span>
      <span className="reveal-climb-track">
        {run.opponentIds.map((id, step) => {
          const opponent = teamById(id);
          const rank = run.opponentRanks[step];
          return (
            <span className="reveal-climb-step" key={`${id}-${step}`}>
              <span className="reveal-climb-bar" style={{ height: `${Math.round(28 + toughnessOf(rank) * 78)}px`, background: opponent?.color ?? "#7c8794" }} />
              {opponent && teamMark(opponent, 22)}
              <i className="reveal-seed-sm">#{rank}</i>
              <small className="reveal-climb-wk">Wk {run.startWeek + step}</small>
            </span>
          );
        })}
      </span>
    </span>
  );
  // Strength of schedule as two walls: every opponent a bar, strongest first. The
  // tough team towers; the smooth team stays low — the contrast is the stat.
  const strengthWall = (tag: string, subject: Team, pick: StrengthPick) => (
    <span className="reveal-wall-row" key={tag}>
      <span className="reveal-wall-head">
        <span className="reveal-tag">{tag}</span>
        <span className="reveal-wall-team">{crest(subject, 26)}<b>#{subject.overallRank} {teamLabel(subject.id)}</b></span>
        <span className="reveal-metric">avg #{pick.avgOpponentRank.toFixed(1)}</span>
      </span>
      <span className="reveal-wall-bars">
        {pick.opponents.map((opponent, index) => {
          const team = teamById(opponent.id);
          return <span key={`${opponent.id}-${index}`} className="reveal-wall-bar" style={{ height: `${Math.round(8 + toughnessOf(opponent.rank) * 46)}px`, background: team?.color ?? "#7c8794", "--i": index } as React.CSSProperties} />;
        })}
      </span>
    </span>
  );
  // A rematch as a season ruler: two pins on the weeks track, the gap between them
  // literally drawn. A long wait spans wide; a quick rematch sits adjacent.
  const rematchRuler = (tag: string, a: Team, b: Team, first: number, last: number) => {
    const pct = (week: number) => 6 + ((week - 1) / Math.max(1, setup.weeks - 1)) * 88;
    return (
      <span className="reveal-ruler-row" key={tag}>
        <span className="reveal-ruler-head">
          <span className="reveal-tag">{tag}</span>
          <span className="reveal-ruler-teams">{teamMark(a, 20)}{teamMark(b, 20)}<b>#{a.overallRank} {a.name} &amp; #{b.overallRank} {b.name}</b></span>
        </span>
        <span className="reveal-ruler-track">
          <span className="reveal-ruler-fill" style={{ left: `${pct(first)}%`, width: `${pct(last) - pct(first)}%` }} />
          <span className="reveal-ruler-pin" style={{ left: `${pct(first)}%` }}><em>Wk {first}</em></span>
          <span className="reveal-ruler-pin" style={{ left: `${pct(last)}%` }}><em>Wk {last}</em></span>
        </span>
      </span>
    );
  };

  const totalGames = schedule.weeks.reduce((count, week) => count + week.games.length, 0);
  const milestones = seasonMilestones(setup.seasonYear, setup.weeks);
  const finalWeekNumber = schedule.weeks.reduce((max, week) => Math.max(max, week.weekNumber), 0);

  // Reserve every headlined matchup so no two cards front the same pair.
  const usedPairs = new Set<string>();
  const bestUnusedGame = (week: ScheduleWeek, filter?: (game: ScheduledGame) => boolean): ScheduledGame | undefined => {
    const pool = (filter ? week.games.filter(filter) : week.games).filter((game) => !usedPairs.has(pairKey(game)));
    if (!pool.length) return undefined;
    return pool.find((game) => game.gameNumber === 1)
      ?? [...pool].sort((left, right) => (left.matchupRating ?? Infinity) - (right.matchupRating ?? Infinity))[0];
  };
  const byRating = (games: ScheduledGame[]) => [...games].sort((a, b) => (a.matchupRating ?? Infinity) - (b.matchupRating ?? Infinity));
  const bestGame = (week: ScheduleWeek) => week.games.find((game) => game.gameNumber === 1) ?? byRating(week.games)[0];

  // The weave beat: every real matchup, colored by its two teams, threaded into
  // a weeks × games grid that draws itself in a diagonal sweep. Division games are
  // the rivalries — lit gold in the fabric. Honest replay of the solved season.
  const weaveColumns = weaveColumnsOf(schedule);

  // The season laid out as a drawn timeline: kickoff at the left, the Thanksgiving
  // flame node where it falls, the final week at the right — the shape and length
  // of the season *shown*, not a row of three dates told. weekPct maps a week to
  // its position along the track (inset 6..94% so end labels don't clip).
  const weekPct = (week: number) => 6 + ((week - 1) / Math.max(1, setup.weeks - 1)) * 88;
  const timelineNodes = milestones
    ? [
        { key: "kickoff", pos: "start", label: "Kickoff", flame: false, ...milestones.kickoff },
        ...(milestones.thanksgiving ? [{ key: "tg", pos: "mid", label: "Thanksgiving", flame: true, ...milestones.thanksgiving }] : []),
        { key: "final", pos: "end", label: "Final week", flame: false, ...milestones.finalWeek },
      ]
    : [];

  const core: Scene[] = [
    {
      key: "kickoff", order: 0, holdMs: 1900,
      icon: <Sparkles aria-hidden="true" />, art: "/reveal/reveal-title.jpg",
      kicker: `${setup.seasonYear} season`,
      value: setup.name || "Your league",
      caption: "Every week, weighed and woven into one season…",
    },
    {
      key: "weave", order: 5, holdMs: 2800,
      icon: <Sparkles aria-hidden="true" />,
      kicker: "Every thread at once",
      value: <WeaveGrid columns={weaveColumns} />,
      caption: `${totalGames} matchups threaded through ${setup.weeks} weeks`,
      // An ambient two-tone drawn from the field itself, so the weave glows in the
      // league's own colours rather than sitting on flat green.
      wash: [setup.teams[0]?.color ?? "#117A45", setup.teams[setup.teams.length - 1]?.color ?? "#0a3a22"],
    },
    {
      key: "window", order: 10, holdMs: 3600,
      icon: <CalendarDays aria-hidden="true" />, art: "/reveal/reveal-window.jpg",
      kicker: "Kickoff to closer",
      value: (
        <span className="reveal-window">
          <span className="reveal-window-weeks">{setup.weeks} weeks</span>
          {timelineNodes.length > 0 && (
            <span className="reveal-timeline">
              <span className="reveal-timeline-track">
                <span className="reveal-timeline-line" />
                {timelineNodes.map((node) => (
                  <span
                    key={node.key}
                    className={`reveal-timeline-node reveal-tl-${node.pos}${node.flame ? " reveal-tl-flame" : ""}`}
                    style={{ left: `${weekPct(node.week)}%`, "--tl-at": weekPct(node.week) } as React.CSSProperties}
                  >
                    <i className="reveal-timeline-dot" />
                    <span className="reveal-timeline-label">
                      <em>{node.flame ? <><Flame aria-hidden="true" />{node.label}</> : node.label}</em>
                      <b>{node.date}</b>
                      <small>Week {node.week}</small>
                    </span>
                  </span>
                ))}
              </span>
            </span>
          )}
        </span>
      ),
      caption: `${setup.seasonYear} · kickoff to the final whistle`,
    },
    {
      key: "field", order: 20, holdMs: 3600,
      icon: <Users aria-hidden="true" />,
      kicker: "The field",
      value: (
        <span className="reveal-card reveal-field-card">
          <span className="reveal-field">
          <span className="reveal-field-count"><CountUp end={setup.teams.length} singular="team" plural="teams" /> · <CountUp end={setup.divisions.length} singular="division" plural="divisions" /></span>
          <span className="reveal-field-divs">
            {setup.divisions.map((division) => (
              <span className="reveal-field-div" key={division.id}>
                <span className="reveal-field-div-name" style={{ color: accessibleAccentColor(division.color) }}>{division.name}</span>
                <span className="reveal-field-div-teams">
                  {setup.teams.filter((team) => team.divisionId === division.id).map((team) => (
                    <span className="reveal-field-crest" key={team.id} style={{ "--i": setup.teams.indexOf(team) } as React.CSSProperties}>{crest(team, 34)}</span>
                  ))}
                </span>
              </span>
            ))}
          </span>
          </span>
        </span>
      ),
      caption: "The whole field's in. Now the matchups.",
      wash: [setup.divisions[0]?.color ?? "#117A45", setup.divisions[setup.divisions.length > 1 ? 1 : 0]?.color ?? "#0a3a22"],
    },
  ];

  // Marquee: the single strongest matchup of the season — always shown.
  const marqueeWeek = schedule.weeks.find((week) => week.matchupRank === 1) ?? schedule.weeks[0];
  const marqueeGame = marqueeWeek ? bestUnusedGame(marqueeWeek) : undefined;
  if (marqueeWeek && marqueeGame) {
    const home = teamById(marqueeGame.homeTeamId);
    const away = teamById(marqueeGame.awayTeamId);
    if (home && away) {
      usedPairs.add(pairKey(marqueeGame));
      core.push({
        key: "marquee", order: 40, holdMs: 3400,
        icon: <Swords aria-hidden="true" />,
        kicker: "One to circle",
        value: gotwBug(marqueeGame),
        caption: `Week ${marqueeWeek.weekNumber} · ${marqueeGame.dateLabel ?? marqueeWeek.dateLabel}`,
        wash: [home.color, away.color],
      });
    }
  }

  const extras: Scene[] = [];
  const pushSlate = (key: string, order: number, priority: number, icon: React.ReactNode, kicker: string, week: ScheduleWeek | undefined, headliner: ScheduledGame | undefined, restLimit: number, captionSuffix: string) => {
    if (!week || !headliner) return;
    const rest = byRating(week.games.filter((game) => game.id !== headliner.id));
    const value = slateValue(headliner, rest, restLimit);
    const home = teamById(headliner.homeTeamId);
    const away = teamById(headliner.awayTeamId);
    if (!value || !home || !away) return;
    usedPairs.add(pairKey(headliner));
    extras.push({
      key, order, priority, holdMs: 5200, icon, kicker, value,
      caption: `Week ${week.weekNumber} · ${captionSuffix}`,
      wash: [home.color, away.color],
    });
  };

  // A/B/C — the slate cards: a headliner plus a truncated view of that week's lineup.
  const openingWeek = schedule.weeks.find((week) => week.weekNumber === 1);
  if (openingWeek) {
    pushSlate("opening", 30, setup.fairness.prioritizeOpeningWeek ? 1 : 8, <Flag aria-hidden="true" />, "Opening kickoff", openingWeek, bestGame(openingWeek), 2, "the pick of the openers");
  }
  const thanksgivingNumber = safeThanksgivingWeek(setup.seasonYear, setup.weeks);
  const thanksgivingWeek = thanksgivingNumber ? schedule.weeks.find((week) => week.weekNumber === thanksgivingNumber) : undefined;
  if (thanksgivingWeek) {
    pushSlate("thanksgiving", 55, setup.fairness.prioritizeThanksgiving ? 2 : 9, <Flame aria-hidden="true" />, "Thanksgiving spotlight", thanksgivingWeek, bestUnusedGame(thanksgivingWeek), 3, "the holiday headliner");
  }
  const closerWeek = schedule.weeks.find((week) => week.weekNumber === finalWeekNumber);
  if (closerWeek) {
    pushSlate("closer", 80, setup.fairness.finalWeekDivisional ? 3 : 10, <Trophy aria-hidden="true" />, "The closer", closerWeek, bestUnusedGame(closerWeek), 3, "the pick of the finale");
  }

  // D/E/F — the stat cards (replay recap only, so the first-run reel stays celebratory).
  const gauntlet = toughestGauntlet(schedule, 4);
  const gauntletTeam = gauntlet && teamById(gauntlet.teamId);
  if (gauntlet && gauntletTeam) {
    extras.push({
      key: "gauntlet", order: 60, priority: 5, replayOnly: true, holdMs: 4600,
      icon: <Route aria-hidden="true" />,
      kicker: "The gauntlet",
      value: <span className="reveal-card">{gauntletClimb(gauntletTeam, gauntlet)}</span>,
      caption: `Weeks ${gauntlet.startWeek}–${gauntlet.endWeek} · ${gauntlet.opponentRanks.length} straight against the season's best`,
      wash: [gauntletTeam.color, gauntletTeam.color],
    });
  }

  const sos = strengthOfSchedule(schedule);
  const hardestTeam = sos.hardest && teamById(sos.hardest.teamId);
  const easiestTeam = sos.easiest && teamById(sos.easiest.teamId);
  if (sos.hardest && sos.easiest && hardestTeam && easiestTeam) {
    extras.push({
      key: "sos", order: 65, priority: 6, replayOnly: true, holdMs: 5000,
      icon: <Gauge aria-hidden="true" />,
      kicker: "A tale of two roads",
      value: (
        <span className="reveal-card">
          <span className="reveal-wall">
            {strengthWall("Toughest road", hardestTeam, sos.hardest)}
            {strengthWall("Smoothest ride", easiestTeam, sos.easiest)}
          </span>
        </span>
      ),
      caption: "One schedule climbs. One coasts.",
      wash: [hardestTeam.color, easiestTeam.color],
    });
  }

  const gaps = divisionSeriesGaps(schedule);
  const longA = gaps.longest && teamById(gaps.longest.aId);
  const longB = gaps.longest && teamById(gaps.longest.bId);
  const closeA = gaps.closest && teamById(gaps.closest.aId);
  const closeB = gaps.closest && teamById(gaps.closest.bId);
  if (gaps.longest && gaps.closest && longA && longB && closeA && closeB) {
    extras.push({
      key: "gaps", order: 70, priority: 7, replayOnly: true, holdMs: 5200,
      icon: <ArrowLeftRight aria-hidden="true" />,
      kicker: "Meeting twice",
      value: (
        <span className="reveal-card">
          <span className="reveal-rulers">
            {rematchRuler("Longest wait", longA, longB, gaps.longest.first, gaps.longest.last)}
            {rematchRuler("Quickest rematch", closeA, closeB, gaps.closest.first, gaps.closest.last)}
          </span>
        </span>
      ),
      caption: "From a quick turnaround to a season-long wait",
      wash: [longA.color, closeB.color],
    });
  }

  // In the lean first-run reveal, keep only the two highest-priority celebratory
  // beats (no stat cards). The replay recap shows the full set.
  const chosenExtras = mode === "replay"
    ? extras
    : extras.filter((scene) => !scene.replayOnly).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)).slice(0, 2);

  // The finale share card: a screenshot-ready season recap that carries the brand.
  // Wrapped's real growth loop isn't a slide — it's the card people share out.
  const marqueeHome = marqueeGame ? teamById(marqueeGame.homeTeamId) : undefined;
  const marqueeAway = marqueeGame ? teamById(marqueeGame.awayTeamId) : undefined;
  const seasonShareCard = () => (
    <span className="reveal-share">
      <span className="reveal-share-head">
        <b className="reveal-share-league">{setup.name || "Your league"}</b>
        <span className="reveal-share-year">{setup.seasonYear} season</span>
      </span>
      <span className="reveal-share-stats">
        <span><b>{setup.teams.length}</b><small>teams</small></span>
        <span><b>{setup.divisions.length}</b><small>division{setup.divisions.length === 1 ? "" : "s"}</small></span>
        <span><b>{setup.weeks}</b><small>weeks</small></span>
        <span><b>{totalGames}</b><small>matchups</small></span>
      </span>
      {marqueeWeek && marqueeHome && marqueeAway && (
        <span className="reveal-share-marquee">
          <span className="reveal-share-tag">One to circle</span>
          <span className="reveal-share-vs">
            <span className="reveal-share-team">{teamMark(marqueeAway, 22)}<b style={{ color: nameColor(marqueeAway.color) }}>{marqueeAway.name}</b></span>
            <em>vs</em>
            <span className="reveal-share-team">{teamMark(marqueeHome, 22)}<b style={{ color: nameColor(marqueeHome.color) }}>{marqueeHome.name}</b></span>
          </span>
        </span>
      )}
      {milestones && (
        <span className="reveal-share-window"><span>{milestones.kickoff.date}</span><i>→</i><span>{milestones.finalWeek.date}</span></span>
      )}
      <span className="reveal-share-brand"><Sparkles aria-hidden="true" />Woven with LeagueWeaver</span>
    </span>
  );
  const finale: Scene = {
    key: "ready", order: 100, holdMs: 0, finale: true,
    icon: <Sparkles aria-hidden="true" />,
    kicker: mode === "replay" ? "That's the season" : "Your season is ready",
    value: seasonShareCard(),
    caption: mode === "replay" ? "Screenshot to share it · replay to run it back, or close to explore." : "Screenshot to share — or open your schedule to explore every week.",
  };

  return [...core, ...chosenExtras, finale].sort((left, right) => left.order - right.order);
}

type Milestone = { week: number; date: string };
function seasonMilestones(seasonYear: number, weeks: 13 | 14): { kickoff: Milestone; thanksgiving?: Milestone; finalWeek: Milestone } | undefined {
  try {
    const dateOf = (week: number) => monthDay.format(new Date(getNflWeekWindow(seasonYear, week).startsAt));
    const thanksgivingWeek = getNflWeeks(seasonYear, weeks).find((week) => week.holidays.includes("Thanksgiving"))?.week;
    return {
      kickoff: { week: 1, date: dateOf(1) },
      thanksgiving: thanksgivingWeek ? { week: thanksgivingWeek, date: dateOf(thanksgivingWeek) } : undefined,
      finalWeek: { week: weeks, date: dateOf(weeks) },
    };
  } catch {
    return undefined;
  }
}

function safeThanksgivingWeek(seasonYear: number, weeks: 13 | 14): number | undefined {
  try {
    return getNflWeeks(seasonYear, weeks).find((week) => week.holidays.includes("Thanksgiving"))?.week;
  } catch {
    return undefined;
  }
}

/**
 * The woven-season grid: one column per week, one thread per matchup, each thread
 * split into its two team colors. Threads draw in on a diagonal sweep (delay keyed
 * to column + row), so the whole season appears to weave itself into place. Pure
 * CSS motion, and it collapses to the finished fabric under reduced-motion.
 */
type WeaveColumn = { week: number; threads: { away: string; home: string; rivalry: boolean }[] };

/** Per-week matchup colours for the woven-season grid (and the persistent loom
 *  backdrop), read straight off the solved schedule. Shared so both draw the
 *  same real fabric. */
function weaveColumnsOf(schedule: GeneratedSchedule): WeaveColumn[] {
  const colorById = new Map(schedule.setup.teams.map((team) => [team.id, team.color]));
  // Only mark rivalries when there's more than one division — otherwise every game
  // is intra-division and the whole weave would light gold (signal → noise).
  const multiDivision = schedule.setup.divisions.length > 1;
  return [...schedule.weeks]
    .sort((left, right) => left.weekNumber - right.weekNumber)
    .map((week) => ({
      week: week.weekNumber,
      threads: week.games.map((game) => ({
        away: colorById.get(game.awayTeamId) ?? "#7c8794",
        home: colorById.get(game.homeTeamId) ?? "#7c8794",
        rivalry: multiDivision && game.matchupType === "division",
      })),
    }));
}

/** The persistent loom: the same real weave, faint and full-bleed, sitting behind
 *  every beat so the woven-season motif underlies the whole story rather than
 *  appearing once. A first step toward a fully accumulating loom. */
function LoomBackdrop({ columns }: { columns: WeaveColumn[] }) {
  return (
    <div className="reveal-loom" aria-hidden="true">
      {columns.map((column) => (
        <span className="reveal-loom-col" key={column.week}>
          {column.threads.map((thread, rowIndex) => (
            <i
              key={rowIndex}
              className="reveal-loom-thread"
              style={{ background: `linear-gradient(90deg, ${thread.away} 0 50%, ${thread.home} 50% 100%)` }}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

/** Counts a number up from zero on mount so the field's totals read as derived,
 *  not typed. Honors reduced-motion by snapping straight to the final value. When
 *  a unit is given, it pluralizes off the LIVE value so it never flashes "1 teams". */
function CountUp({ end, duration = 720, singular, plural }: { end: number; duration?: number; singular?: string; plural?: string }) {
  const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Reduced-motion (and SSR) start already at the final value — no animation, and
  // no synchronous setState inside the effect.
  const [value, setValue] = useState(() => (prefersReduced() ? end : 0));
  useEffect(() => {
    if (prefersReduced()) return;
    let raf = 0;
    let startedAt = 0;
    const step = (now: number) => {
      if (!startedAt) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic — decelerates into the total
      setValue(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  const unit = plural ? ` ${value === 1 ? (singular ?? plural) : plural}` : "";
  return <>{value}{unit}</>;
}

function WeaveGrid({ columns }: { columns: { week: number; threads: { away: string; home: string; rivalry: boolean }[] }[] }) {
  return (
    <span className="reveal-weave" aria-hidden="true">
      {columns.map((column, columnIndex) => (
        <span className="reveal-weave-col" key={column.week}>
          {column.threads.map((thread, rowIndex) => (
            <i
              key={rowIndex}
              className={`reveal-weave-thread${thread.rivalry ? " rivalry" : ""}`}
              style={{
                "--i": columnIndex + rowIndex,
                background: `linear-gradient(90deg, ${thread.away} 0 50%, ${thread.home} 50% 100%)`,
              } as React.CSSProperties}
            />
          ))}
        </span>
      ))}
    </span>
  );
}
