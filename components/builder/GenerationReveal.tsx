"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  Gauge,
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
import { divisionSeriesGaps, strengthOfSchedule, toughestGauntlet } from "@/lib/revealStats";
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
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const last = scenes.length - 1;
  const scene = scenes[Math.min(index, last)] ?? scenes[0];
  const finished = index >= last;

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onComplete(); return; }
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
    <div className="reveal-overlay" role="dialog" aria-modal="true" aria-label="Your season, unveiled">
      <div
        className="reveal-stage"
        ref={stageRef}
        tabIndex={-1}
        style={scene.wash ? ({ "--wash-a": scene.wash[0], "--wash-b": scene.wash[1] } as React.CSSProperties) : undefined}
      >
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

        <div className="reveal-scene" key={scene.key}>
          {scene.art
            ? <img className="reveal-art" src={scene.art} alt="" aria-hidden="true" draggable={false} />
            : <span className="reveal-icon" aria-hidden="true">{scene.icon}</span>}
          <p className="reveal-kicker">{scene.kicker}</p>
          <p className="reveal-value" role="status" aria-live="polite">{scene.value}</p>
          {scene.caption && <p className="reveal-caption">{scene.caption}</p>}
          {index === 0 && !reduced && <p className="reveal-hint" aria-hidden="true">Tap to move · hold to pause</p>}
        </div>

        {finished && (
          <div className="reveal-actions">
            <button type="button" className="reveal-cta" onClick={onComplete}>{mode === "replay" ? "Back to schedule →" : "See my schedule →"}</button>
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
  const matchup = (game: ScheduledGame, { size = 112, gotw = false, venue = false }: { size?: number; gotw?: boolean; venue?: boolean } = {}) => {
    const home = teamById(game.homeTeamId);
    const away = teamById(game.awayTeamId);
    if (!home || !away) return null;
    return (
      <span className="reveal-matchup-wrap">
        {gotw && <span className="reveal-gotw"><Star aria-hidden="true" />Game of the Week</span>}
        <span className={`reveal-matchup${size <= 76 ? " reveal-matchup-sm" : ""}`}>
          <span className="reveal-team">{crest(away, size)}<b style={{ color: away.color }}>{teamLabel(away.id)}</b>{seed(away)}</span>
          <em>@</em>
          <span className="reveal-team">{crest(home, size)}<b style={{ color: home.color }}>{teamLabel(home.id)}</b>{seed(home)}</span>
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
  // A labelled stat line: tag · crest(s) · team(s) · metric.
  const statLine = (tag: string, teams: Team[], name: React.ReactNode, metric: string, key: string) => (
    <span className="reveal-statline" key={key}>
      <span className="reveal-tag">{tag}</span>
      <span className="reveal-statline-teams">{teams.map((team) => <span key={team.id}>{crest(team, 30)}</span>)}</span>
      <b>{name}</b>
      <span className="reveal-metric">{metric}</span>
    </span>
  );

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

  const core: Scene[] = [
    {
      key: "kickoff", order: 0, holdMs: 1900,
      icon: <Sparkles aria-hidden="true" />, art: "/reveal/reveal-title.jpg",
      kicker: `${setup.seasonYear} season`,
      value: setup.name || "Your league",
      caption: "Every week, weighed and woven into one season…",
    },
    {
      key: "window", order: 10, holdMs: 3600,
      icon: <CalendarDays aria-hidden="true" />, art: "/reveal/reveal-window.jpg",
      kicker: "Season window",
      value: (
        <span className="reveal-window">
          <span className="reveal-window-weeks">{setup.weeks} weeks</span>
          {milestones && (
            <span className="reveal-window-range">
              <span className="reveal-window-date">
                <em>Kickoff</em><b>{milestones.kickoff.date}</b><small>Week {milestones.kickoff.week}</small>
              </span>
              {milestones.thanksgiving && (
                <>
                  <ArrowRight className="reveal-window-arrow" aria-hidden="true" />
                  <span className="reveal-window-date reveal-window-date-tg">
                    <em><Flame aria-hidden="true" />Thanksgiving</em><b>{milestones.thanksgiving.date}</b><small>Week {milestones.thanksgiving.week}</small>
                  </span>
                </>
              )}
              <ArrowRight className="reveal-window-arrow" aria-hidden="true" />
              <span className="reveal-window-date">
                <em>Final week</em><b>{milestones.finalWeek.date}</b><small>Week {milestones.finalWeek.week}</small>
              </span>
            </span>
          )}
        </span>
      ),
      caption: `${setup.seasonYear} season · real NFL week windows`,
    },
    {
      key: "field", order: 20, holdMs: 3600,
      icon: <Users aria-hidden="true" />,
      kicker: "The field",
      value: (
        <span className="reveal-field">
          <span className="reveal-field-count">{setup.teams.length} teams · {setup.divisions.length} division{setup.divisions.length === 1 ? "" : "s"}</span>
          <span className="reveal-field-divs">
            {setup.divisions.map((division) => (
              <span className="reveal-field-div" key={division.id}>
                <span className="reveal-field-div-name" style={{ color: accessibleAccentColor(division.color) }}>{division.name}</span>
                <span className="reveal-field-div-teams">
                  {setup.teams.filter((team) => team.divisionId === division.id).map((team) => <span key={team.id}>{crest(team, 34)}</span>)}
                </span>
              </span>
            ))}
          </span>
        </span>
      ),
      caption: `${totalGames} matchups mapped`,
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
        value: matchup(marqueeGame, { size: 112, gotw: true, venue: true }),
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
    pushSlate("opening", 30, setup.fairness.prioritizeOpeningWeek ? 1 : 8, <Flag aria-hidden="true" />, "Opening kickoff", openingWeek, bestGame(openingWeek), 2, "Game of the Week + the openers");
  }
  const thanksgivingNumber = safeThanksgivingWeek(setup.seasonYear, setup.weeks);
  const thanksgivingWeek = thanksgivingNumber ? schedule.weeks.find((week) => week.weekNumber === thanksgivingNumber) : undefined;
  if (thanksgivingWeek) {
    pushSlate("thanksgiving", 55, setup.fairness.prioritizeThanksgiving ? 2 : 9, <Flame aria-hidden="true" />, "Thanksgiving spotlight", thanksgivingWeek, bestUnusedGame(thanksgivingWeek), 3, "Holiday headliner + the slate");
  }
  const closerWeek = schedule.weeks.find((week) => week.weekNumber === finalWeekNumber);
  if (closerWeek) {
    pushSlate("closer", 80, setup.fairness.finalWeekDivisional ? 3 : 10, <Trophy aria-hidden="true" />, "The closer", closerWeek, bestUnusedGame(closerWeek), 3, "Game of the Week + the finale slate");
  }

  // D/E/F — the stat cards (replay recap only, so the first-run reel stays celebratory).
  const gauntlet = toughestGauntlet(schedule, 4);
  const gauntletTeam = gauntlet && teamById(gauntlet.teamId);
  if (gauntlet && gauntletTeam) {
    extras.push({
      key: "gauntlet", order: 60, priority: 5, replayOnly: true, holdMs: 4200,
      icon: <Route aria-hidden="true" />,
      kicker: "The gauntlet",
      value: <span className="reveal-solo">{crest(gauntletTeam, 84)}<b style={{ color: gauntletTeam.color }}>{teamLabel(gauntletTeam.id)}</b><span className="reveal-seed">#{gauntletTeam.overallRank}</span></span>,
      caption: `Weeks ${gauntlet.startWeek}–${gauntlet.endWeek} at ${listify(gauntlet.opponentRanks.map((rank) => `#${rank}`))} — the season's toughest stretch`,
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
      kicker: "Strength of schedule",
      value: (
        <span className="reveal-rows">
          {statLine("Toughest road", [hardestTeam], `#${hardestTeam.overallRank} ${teamLabel(hardestTeam.id)}`, `avg opponent #${sos.hardest.avgOpponentRank.toFixed(1)}`, "hard")}
          {statLine("Smoothest ride", [easiestTeam], `#${easiestTeam.overallRank} ${teamLabel(easiestTeam.id)}`, `avg opponent #${sos.easiest.avgOpponentRank.toFixed(1)}`, "easy")}
        </span>
      ),
      caption: "Based on every opponent's overall ranking",
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
      kicker: "Rematch spacing",
      value: (
        <span className="reveal-rows">
          {statLine("Longest wait", [longA, longB], `#${longA.overallRank} ${longA.name} & #${longB.overallRank} ${longB.name}`, `Wk ${gaps.longest.first} → Wk ${gaps.longest.last}`, "long")}
          {statLine("Quickest rematch", [closeA, closeB], `#${closeA.overallRank} ${closeA.name} & #${closeB.overallRank} ${closeB.name}`, `Wk ${gaps.closest.first} & ${gaps.closest.last}`, "close")}
        </span>
      ),
      caption: "How far apart divisional pairs meet twice",
    });
  }

  // In the lean first-run reveal, keep only the two highest-priority celebratory
  // beats (no stat cards). The replay recap shows the full set.
  const chosenExtras = mode === "replay"
    ? extras
    : extras.filter((scene) => !scene.replayOnly).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)).slice(0, 2);

  const finale: Scene = {
    key: "ready", order: 100, holdMs: 0, finale: true,
    icon: <Sparkles aria-hidden="true" />, art: "/reveal/reveal-finale.jpg",
    kicker: mode === "replay" ? "That's the season" : "Kickoff",
    value: mode === "replay" ? "Your season, in full" : "Your season is ready",
    caption: mode === "replay" ? "Tap Replay to run it back, or close to explore." : "Open your commissioner workspace to explore every week.",
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

function listify(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} & ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`;
}
