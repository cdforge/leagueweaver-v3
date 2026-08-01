"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  Gauge,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  Route,
  Share2,
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
  /** Large, low-opacity background watermarks of the beat's prominent entities.
   *  Only ever the entities' *imported* logo images — teams/leagues without an
   *  uploaded logo simply don't get one. `pos` places it over its colour region. */
  bgLogos?: { url: string; pos: "a" | "b" | "solo" }[];
  holdMs: number;
  /** The closing card: it waits for a human instead of auto-advancing. */
  finale?: boolean;
  /** Optional beats beyond the core five. Lower priority shows first in the lean generate reel. */
  priority?: number;
  /** Stat-style beats that only belong in the fuller replay recap, not the first-run reveal. */
  replayOnly?: boolean;
};

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// Every beat auto-advances on the same 6-second timer, so the story keeps an even,
// predictable cadence; manual navigation switches the auto-play off entirely.
const AUTO_MS = 6000;

/**
 * A short, celebratory reveal shown after the schedule is solved. It reads real
 * facts off the finished season — no fake progress — and plays them back like a
 * Spotify-Wrapped story: segmented progress up top, tap or arrow to move through
 * the beats, hold to pause, and a finale that waits for the commissioner to open
 * their workspace (or replay). The season is already generated before this mounts,
 * so nothing here blocks real work — it's pure celebration and can be self-paced.
 */
export type ShareResult = { url?: string; slug?: string; error?: string };

export function GenerationReveal({ schedule, onComplete, mode = "generate", onShare }: { schedule: GeneratedSchedule; onComplete: () => void; mode?: RevealMode; onShare?: () => Promise<ShareResult> }) {
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
    ? (mode === "replay" ? "That's the season. Share it, or replay." : "Your season is ready. Share it, or open your schedule.")
    : `${scene.kicker}. ${captionText}`.trim();

  const next = useCallback(() => setIndex((current) => Math.min(last, current + 1)), [last]);
  const prev = useCallback(() => setIndex((current) => Math.max(0, current - 1)), []);
  // Manual navigation takes the wheel: once the commissioner steps a beat by hand,
  // auto-play switches off so the story waits for them instead of advancing
  // underneath their taps. (The raw next() above still drives the auto-advance.)
  const manualNext = useCallback(() => { setPaused(true); next(); }, [next]);
  const manualPrev = useCallback(() => { setPaused(true); prev(); }, [prev]);

  // Real share: publish the schedule to a public /share/<slug> link, then hand it to
  // the native share sheet — attaching the rendered season image where the platform
  // supports files, so it shares as a picture, not just a link. Copy-link fallback
  // for browsers without the Web Share API. Nothing is posted until the user acts.
  const [shareStatus, setShareStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [shareMsg, setShareMsg] = useState("");
  const doShare = useCallback(async () => {
    if (!onShare || shareStatus === "busy") return;
    setShareStatus("busy");
    setShareMsg("Creating a public link…");
    try {
      const result = await onShare();
      const url = result?.url;
      if (!url) {
        setShareStatus("error");
        setShareMsg(result?.error || "Couldn't create a share link — try again.");
        return;
      }
      const title = `${schedule.setup.name || "Our league"} — ${schedule.setup.seasonYear} schedule`;
      const text = "Our season schedule, woven with LeagueWeaver.";
      // Fetch the server-rendered season card so it can share as an image file.
      let files: File[] | undefined;
      if (result.slug && typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
        try {
          const imageRes = await fetch(`/api/share-image?slug=${encodeURIComponent(result.slug)}`);
          if (imageRes.ok) {
            const blob = await imageRes.blob();
            const file = new File([blob], `${result.slug}.png`, { type: blob.type || "image/png" });
            if (navigator.canShare({ files: [file] })) files = [file];
          }
        } catch { /* the image is a bonus; sharing the link still works */ }
      }
      const shareData: ShareData = files ? { title, text, url, files } : { title, text, url };
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share(shareData);
          setShareStatus("done");
          setShareMsg("Shared with your league.");
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") { setShareStatus("idle"); setShareMsg(""); return; }
          // Otherwise fall through to the copy-link fallback.
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("done");
        setShareMsg("Link copied — paste it anywhere.");
      } catch {
        setShareStatus("done");
        setShareMsg(url);
      }
    } catch {
      setShareStatus("error");
      setShareMsg("Couldn't create a share link — try again.");
    }
  }, [onShare, shareStatus, schedule]);

  const replay = useCallback(() => { setIndex(0); setPaused(false); setShareStatus("idle"); setShareMsg(""); }, []);

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
      if (event.key === "ArrowRight") { event.preventDefault(); manualNext(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); manualPrev(); }
      else if (event.key === "Enter") { event.preventDefault(); if (finished) onComplete(); else manualNext(); }
      else if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (!finished && !reduced) setPaused((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onComplete, manualNext, manualPrev, finished, reduced]);

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
    if (event.clientX - rect.left < rect.width * 0.33) manualPrev();
    else manualNext();
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
      {/* Large, low-opacity watermarks of the beat's own logos, over their colours.
          Imported logos only — a beat with none simply shows the colour wash. */}
      {scene.bgLogos && scene.bgLogos.length > 0 && (
        <div className="reveal-bg-logos" aria-hidden="true">
          {scene.bgLogos.map((mark, i) => (
            <img key={`${scene.key}-${mark.pos}-${i}`} className={`reveal-bg-logo reveal-bg-logo-${mark.pos}`} src={mark.url} alt="" draggable={false} />
          ))}
        </div>
      )}
      <div className="reveal-stage" ref={stageRef} tabIndex={-1}>
        <div className="reveal-segments" aria-hidden="true">
          {scenes.map((item, itemIndex) => {
            const done = itemIndex < index || (itemIndex === index && finished);
            const active = itemIndex === index && !finished && !reduced;
            return (
              <span key={item.key} className={`reveal-seg${done ? " done" : ""}${itemIndex === index ? " current" : ""}`}>
                <i
                  style={active ? { animationDuration: `${AUTO_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                  onAnimationEnd={active ? next : undefined}
                />
              </span>
            );
          })}
        </div>

        <div className="reveal-brandline">
          <Sparkles aria-hidden="true" />
          <span>{finished ? "Season woven" : "Weaving your season"}</span>
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
            {onShare && (
              <button type="button" className="reveal-share-cta" onClick={doShare} disabled={shareStatus === "busy"}>
                {shareStatus === "busy" ? <LoaderCircle className="reveal-spin" aria-hidden="true" /> : shareStatus === "done" ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
                {shareStatus === "busy" ? "Creating link…" : shareStatus === "done" ? "Shared" : "Share schedule"}
              </button>
            )}
            {onShare && (
              <p className={`reveal-share-status is-${shareStatus}`} role="status" aria-live="polite">
                {shareMsg || "Creates a public link anyone can open."}
              </p>
            )}
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
          <button type="button" className="reveal-arrow reveal-arrow-left" onClick={manualPrev} disabled={index === 0} aria-label="Previous">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="reveal-arrow reveal-arrow-right" onClick={manualNext} aria-label="Next">
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
  const crest = (team: Team, size: number) => {
    const init = teamInitials(team);
    return <EntityLogo className="reveal-crest" size={size} color={team.color} logoUrl={team.logoUrl} monogram={init} imagePresentation="bare" monoFontSize={monoFont(Math.max(32, size), init.length)} />;
  };
  // Size-flexible team mark: the raw logo image when a team has one (no colour
  // backing), or a small colour + initials chip otherwise. Lets tiny inline spots
  // (list rows, venue) show a real logo below EntityLogo's 32px floor.
  // Scale the chip's font to the acronym length (up to 4 chars via custom initials)
  // so 3- and 4-letter marks stay centred inside the box instead of spilling.
  const monoFont = (size: number, chars: number) => Math.round(size * (chars >= 4 ? 0.3 : chars === 3 ? 0.4 : 0.5));
  const teamMark = (team: Team, size: number) => {
    if (team.logoUrl) return <img className="reveal-mark" src={team.logoUrl} alt="" width={size} height={size} style={{ width: size, height: size }} draggable={false} />;
    const init = teamInitials(team);
    return <span className="reveal-mark reveal-mark-mono" style={{ width: size, height: size, background: team.color, color: readableTextColor(team.color), fontSize: monoFont(size, init.length) }}>{init}</span>;
  };
  // Team names render in the team's own colour — but a dark team colour (navy,
  // black) on the dark field falls below WCAG. Route every name through the
  // adaptive helper (against the card/field ground) so it stays legible; a raw
  // brightness() filter can't lift a near-black, so those filters are dropped too.
  const nameColor = (color: string) => accessibleAccentColor(color, "#0a2418");
  // How strong a team is on a 0..1 scale (the #1 seed ≈ 1). Drives the marquee
  // "Game of the Week" bug's power meter so eliteness is shown, not just labelled.
  const strengthOf = (rank: number) => (setup.teams.length + 1 - rank) / Math.max(1, setup.teams.length);
  const divisionOf = (team: Team) => setup.divisions.find((division) => division.id === team.divisionId);
  // The reusable "Game of the Week" bug (SNF logic): a fixed broadcast frame the
  // two teams drop into — crests facing across a VS, the background split down the
  // seam into each team's colour, and a mini tale-of-the-tape (seed · division ·
  // power) below. The frame is constant; the teams are the variable art.
  const gotwBug = (
    game: ScheduledGame,
    { label = "Game of the Week", tape = true, crestSize = 76 }: { label?: string; tape?: boolean; crestSize?: number } = {},
  ) => {
    const home = teamById(game.homeTeamId);
    const away = teamById(game.awayTeamId);
    if (!home || !away) return null;
    const awayDivision = divisionOf(away);
    const homeDivision = divisionOf(home);
    const series = game.seriesLength > 1 ? `Game ${game.seriesGame} of ${game.seriesLength}` : null;
    return (
      <span className={`reveal-bug${tape ? "" : " reveal-bug-mini"}`} style={{ "--away": away.color, "--home": home.color } as React.CSSProperties}>
        <span className="reveal-bug-tab"><Star aria-hidden="true" />{label}</span>
        <span className="reveal-bug-hero">
          <span className="reveal-bug-side">
            {crest(away, crestSize)}
            <b style={{ color: nameColor(away.color) }}>{away.name}</b>
            <i className="reveal-seed">#{away.overallRank}</i>
          </span>
          <span className="reveal-bug-vs"><em>VS</em></span>
          <span className="reveal-bug-side">
            {crest(home, crestSize)}
            <b style={{ color: nameColor(home.color) }}>{home.name}</b>
            <i className="reveal-seed">#{home.overallRank}</i>
          </span>
        </span>
        {tape && (
          <>
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
          </>
        )}
        {(home.stadium || series) && (
          <span className="reveal-bug-venue">
            {home.stadium && <span className="reveal-bug-place">{teamMark(home, 16)}{home.stadium}</span>}
            {series && <span className="reveal-bug-series">{series}</span>}
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
  // The week's headliner as a framed mini-bug (same broadcast frame as the
  // marquee, minus the full tale-of-the-tape so the marquee stays the special
  // one), then a truncated view of the rest of that week's slate.
  const slateValue = (headliner: ScheduledGame, rest: ScheduledGame[], restLimit: number) => {
    const value = gotwBug(headliner, { label: "Headliner", tape: false, crestSize: 56 });
    if (!value) return null;
    const shown = rest.slice(0, restLimit);
    const more = rest.length - shown.length;
    return (
      <span className="reveal-slate">
        {value}
        {shown.length > 0 && (
          <span className="reveal-slate-rest">
            <span className="reveal-slate-label">Also that week</span>
            <span className="reveal-slate-list">{shown.map(gameRow)}</span>
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
  // The gauntlet as an elevation profile: each consecutive opponent is a peak whose
  // height is its strength, connected into a filled ridge you climb — the toughest
  // game flagged as the summit. Reads as a run you feel, not a bar chart.
  const gauntletClimb = (subject: Team, run: Gauntlet) => {
    const peaks = run.opponentIds.map((id, step) => ({
      opp: teamById(id), rank: run.opponentRanks[step], week: run.startWeek + step, t: toughnessOf(run.opponentRanks[step]),
    }));
    const n = peaks.length;
    const base = 40, top = 7;
    const xAt = (i: number) => (n <= 1 ? 50 : 6 + (i / (n - 1)) * 88);
    // Amplify the profile by normalizing heights within the run (they're all tough,
    // so a raw scale reads as a flat plateau). Floor at .5 so no peak looks easy.
    const ts = peaks.map((peak) => peak.t);
    const tMin = Math.min(...ts), tMax = Math.max(...ts);
    const heightOf = (t: number) => 0.5 + 0.5 * (tMax === tMin ? 1 : (t - tMin) / (tMax - tMin));
    const yAt = (t: number) => base - heightOf(t) * (base - top);
    const summit = peaks.reduce((best, peak, i) => (peak.t > peaks[best].t ? i : best), 0);
    const ridge = peaks.map((peak, i) => `${xAt(i).toFixed(1)},${yAt(peak.t).toFixed(1)}`).join(" L");
    return (
      <span className="reveal-climb">
        <span className="reveal-climb-subject">{crest(subject, 48)}<b style={{ color: nameColor(subject.color) }}>{subject.name}</b><span className="reveal-seed">#{subject.overallRank}</span></span>
        <span className="reveal-climb-range">
          <svg className="reveal-climb-ridge" viewBox="0 0 100 46" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="climbFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            <path d={`M${xAt(0).toFixed(1)},${base} L${ridge} L${xAt(n - 1).toFixed(1)},${base} Z`} fill="url(#climbFill)" />
            <path d={`M${ridge}`} fill="none" stroke="var(--gold)" strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="reveal-climb-row">
            {peaks.map((peak, i) => (
              <span className={`reveal-climb-cell${i === summit ? " reveal-climb-summit" : ""}`} key={`${peak.opp?.id}-${i}`}>
                {i === summit && <Flag className="reveal-climb-flag" aria-hidden="true" />}
                {peak.opp && teamMark(peak.opp, 36)}
                <i className="reveal-seed-sm">#{peak.rank}</i>
                <small className="reveal-climb-wk">Wk {peak.week}</small>
              </span>
            ))}
          </span>
        </span>
      </span>
    );
  };
  // Strength of schedule as two walls: every opponent a bar, strongest first. The
  // tough team towers; the smooth team stays low — the contrast is the stat.
  const strengthWall = (tag: string, subject: Team, pick: StrengthPick) => (
    <span className="reveal-wall-row" key={tag}>
      <span className="reveal-wall-head">
        <span className="reveal-tag">{tag}</span>
        <span className="reveal-wall-team">{crest(subject, 26)}<b>#{subject.overallRank} {teamLabel(subject.id)}</b></span>
        <span className="reveal-metric">avg opp #{pick.avgOpponentRank.toFixed(1)}</span>
      </span>
      <span className="reveal-wall-bars">
        {pick.opponents.map((opponent, index) => {
          const team = teamById(opponent.id);
          const h = Math.round(10 + toughnessOf(opponent.rank) * 52);
          return (
            <span key={`${opponent.id}-${index}`} className="reveal-wall-bar" style={{ "--h": h, "--i": index } as React.CSSProperties}>
              <span className="reveal-wall-fill" style={{ background: team?.color ?? "#7c8794" }}>
                {team && (team.logoUrl
                  ? <img className="reveal-wall-img" src={team.logoUrl} alt="" draggable={false} />
                  : <span className="reveal-wall-mono" style={{ color: readableTextColor(team.color) }}>{teamInitials(team)}</span>)}
              </span>
              <i className="reveal-wall-rank">#{opponent.rank}</i>
            </span>
          );
        })}
      </span>
    </span>
  );
  // Both rematch series share one season axis, so their spans compare directly:
  // the long wait stretches nearly the whole width, the quick rematch is a stub.
  // Each lane names its pair (crests + ranks) and states the gap in weeks outright.
  const rematchWeekPct = (week: number) => 6 + ((week - 1) / Math.max(1, setup.weeks - 1)) * 88;
  // Vertical season timeline: weeks run top→bottom, so a long wait is a tall column
  // and a quick rematch a short one — the two compared side by side on one shared
  // scale. Each pair's own colours fill its column and mark its pins (dark colours
  // lifted for legibility); big crests name it. Returns [head, track] so the two
  // columns lay out in a 2-row grid that keeps both tracks on the same scale.
  const rematchColumn = (tag: string, a: Team, b: Team, first: number, last: number, gap: number, variant: "long" | "quick"): [React.ReactNode, React.ReactNode] => {
    const ca = accessibleAccentColor(a.color, "#0d2018");
    const cb = accessibleAccentColor(b.color, "#0d2018");
    const head = (
      <span className={`reveal-vcol-head reveal-vcol-head-${variant}`} key={`${tag}-h`}>
        <span className="reveal-tag">{tag}</span>
        <span className="reveal-vcol-crests">{teamMark(a, 48)}{teamMark(b, 48)}</span>
        <span className="reveal-vcol-pair">#{a.overallRank} {a.name} · #{b.overallRank} {b.name}</span>
        <span className="reveal-vcol-gap"><b>{gap}</b> {gap === 1 ? "wk" : "wks"} apart</span>
      </span>
    );
    const track = (
      <span className={`reveal-vtrack reveal-vtrack-${variant}`} key={`${tag}-t`} style={{ "--ca": ca, "--cb": cb } as React.CSSProperties}>
        <span className="reveal-vfill" style={{ top: `${rematchWeekPct(first)}%`, height: `${rematchWeekPct(last) - rematchWeekPct(first)}%` }} />
        <span className="reveal-vpin reveal-lane-pin-a" style={{ top: `${rematchWeekPct(first)}%` }}><em>Wk {first}</em></span>
        <span className="reveal-vpin reveal-lane-pin-b" style={{ top: `${rematchWeekPct(last)}%` }}><em>Wk {last}</em></span>
      </span>
    );
    return [head, track];
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

  // General, league-level beats (kickoff, weave, window, finale) wash the whole
  // field in the league's own colour; team-specific beats wash it in the prominent
  // teams' colours, set on each scene below.
  const leagueWash: [string, string] = [setup.color || "#117A45", setup.color || "#0a3a22"];
  // Background watermarks: only ever a team's / the league's *imported* logo, never
  // a colour chip. Entities without an uploaded image get no watermark (just colour).
  type BgLogo = { url: string; pos: "a" | "b" | "solo" };
  const bgLogosFor = (marks: [Team | undefined, "a" | "b" | "solo"][]): BgLogo[] | undefined => {
    const logos = marks.filter(([team]) => team?.logoUrl).map(([team, pos]) => ({ url: team!.logoUrl as string, pos }));
    return logos.length ? logos : undefined;
  };
  const leagueBgLogos: BgLogo[] | undefined = setup.logoUrl ? [{ url: setup.logoUrl, pos: "solo" }] : undefined;

  const core: Scene[] = [
    {
      key: "kickoff", order: 0, holdMs: 1900,
      icon: <Sparkles aria-hidden="true" />, art: "/reveal/reveal-title.jpg",
      kicker: `${setup.seasonYear} season`,
      value: setup.name || "Your league",
      caption: "Every week, weighed and woven into one season…",
      wash: leagueWash,
    },
    {
      key: "weave", order: 5, holdMs: 2800,
      icon: <Sparkles aria-hidden="true" />,
      kicker: "Every thread at once",
      value: (
        <span className="reveal-weave-wrap">
          <WeaveGrid columns={weaveColumns} />
          {setup.divisions.length > 1 && (
            <span className="reveal-weave-legend"><i className="reveal-weave-legend-chip" aria-hidden="true" />Gold outline = division rivalry</span>
          )}
        </span>
      ),
      caption: `${totalGames} matchups threaded through ${setup.weeks} weeks`,
      // The whole-season weave is a league beat — wash it in the league's own colour.
      wash: leagueWash, bgLogos: leagueBgLogos,
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
      wash: leagueWash,
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

  const extras: Scene[] = [];
  const pushSlate = (key: string, order: number, priority: number, icon: React.ReactNode, kicker: string, week: ScheduleWeek | undefined, headliner: ScheduledGame | undefined, restLimit: number) => {
    if (!week || !headliner) return;
    const rest = byRating(week.games.filter((game) => game.id !== headliner.id));
    const value = slateValue(headliner, rest, restLimit);
    const home = teamById(headliner.homeTeamId);
    const away = teamById(headliner.awayTeamId);
    if (!value || !home || !away) return;
    usedPairs.add(pairKey(headliner));
    extras.push({
      key, order, priority, holdMs: 5200, icon, kicker, value,
      caption: `Week ${week.weekNumber} · ${headliner.dateLabel ?? week.dateLabel}`,
      wash: [home.color, away.color], bgLogos: bgLogosFor([[home, "a"], [away, "b"]]),
    });
  };

  // A/B/C — the slate cards: a headliner plus a truncated view of that week's lineup.
  const openingWeek = schedule.weeks.find((week) => week.weekNumber === 1);
  if (openingWeek) {
    pushSlate("opening", 30, setup.fairness.prioritizeOpeningWeek ? 1 : 8, <Flag aria-hidden="true" />, "Opening kickoff", openingWeek, bestGame(openingWeek), 3);
  }
  const thanksgivingNumber = safeThanksgivingWeek(setup.seasonYear, setup.weeks);
  const thanksgivingWeek = thanksgivingNumber ? schedule.weeks.find((week) => week.weekNumber === thanksgivingNumber) : undefined;
  if (thanksgivingWeek) {
    pushSlate("thanksgiving", 55, setup.fairness.prioritizeThanksgiving ? 2 : 9, <Flame aria-hidden="true" />, "Thanksgiving spotlight", thanksgivingWeek, bestUnusedGame(thanksgivingWeek), 3);
  }
  const closerWeek = schedule.weeks.find((week) => week.weekNumber === finalWeekNumber);
  if (closerWeek) {
    pushSlate("closer", 80, setup.fairness.finalWeekDivisional ? 3 : 10, <Trophy aria-hidden="true" />, "The closer", closerWeek, bestUnusedGame(closerWeek), 3);
  }

  // Marquee: the single strongest matchup the slates haven't already headlined.
  // Chosen *after* the opener/Thanksgiving/closer reserve their pairs, so "one to
  // circle" is always its own game — never a match we've showcased elsewhere.
  const marqueeGame = byRating(
    schedule.weeks.flatMap((week) => week.games).filter((game) => !usedPairs.has(pairKey(game))),
  )[0];
  const marqueeWeek = marqueeGame
    ? schedule.weeks.find((week) => week.games.some((game) => game.id === marqueeGame.id))
    : undefined;
  if (marqueeGame && marqueeWeek) {
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
        wash: [home.color, away.color], bgLogos: bgLogosFor([[home, "a"], [away, "b"]]),
      });
    }
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
      wash: [gauntletTeam.color, gauntletTeam.color], bgLogos: bgLogosFor([[gauntletTeam, "solo"]]),
    });
  }

  const sos = strengthOfSchedule(schedule);
  const hardestTeam = sos.hardest && teamById(sos.hardest.teamId);
  const easiestTeam = sos.easiest && teamById(sos.easiest.teamId);
  if (sos.hardest && sos.easiest && hardestTeam && easiestTeam) {
    // The gap in average opponent rank between the two extremes — the whole point
    // of the beat (how unevenly the schedule fell), made explicit between the rows.
    // Derive it from the *displayed* rounded averages so 5.9 − 5.1 always reads 0.8.
    const sosGap = (Number(sos.easiest.avgOpponentRank.toFixed(1)) - Number(sos.hardest.avgOpponentRank.toFixed(1))).toFixed(1);
    extras.push({
      key: "sos", order: 65, priority: 6, replayOnly: true, holdMs: 5000,
      icon: <Gauge aria-hidden="true" />,
      kicker: "A tale of two roads",
      value: (
        <span className="reveal-card">
          <span className="reveal-wall">
            {strengthWall("Tougher schedule", hardestTeam, sos.hardest)}
            <span className="reveal-wall-delta"><b>{sosGap}</b><small>avg ranks apart</small></span>
            {strengthWall("Easier schedule", easiestTeam, sos.easiest)}
          </span>
        </span>
      ),
      caption: "The league's toughest schedule, and its easiest.",
      wash: [hardestTeam.color, easiestTeam.color], bgLogos: bgLogosFor([[hardestTeam, "a"], [easiestTeam, "b"]]),
    });
  }

  const gaps = divisionSeriesGaps(schedule);
  const longA = gaps.longest && teamById(gaps.longest.aId);
  const longB = gaps.longest && teamById(gaps.longest.bId);
  const closeA = gaps.closest && teamById(gaps.closest.aId);
  const closeB = gaps.closest && teamById(gaps.closest.bId);
  if (gaps.longest && gaps.closest && longA && longB && closeA && closeB) {
    const [longHead, longTrack] = rematchColumn("Longest wait", longA, longB, gaps.longest.first, gaps.longest.last, gaps.longest.gap, "long");
    const [quickHead, quickTrack] = rematchColumn("Quickest rematch", closeA, closeB, gaps.closest.first, gaps.closest.last, gaps.closest.gap, "quick");
    extras.push({
      key: "gaps", order: 70, priority: 7, replayOnly: true, holdMs: 5200,
      icon: <ArrowLeftRight aria-hidden="true" />,
      kicker: "Meeting twice",
      value: (
        <span className="reveal-card">
          <span className="reveal-rematch-v">
            {longHead}{quickHead}
            {longTrack}{quickTrack}
            <span className="reveal-rematch-vscale" aria-hidden="true"><span>Wk 1</span><span>Wk {setup.weeks}</span></span>
          </span>
        </span>
      ),
      caption: "",
      wash: [longA.color, closeB.color], bgLogos: bgLogosFor([[longA, "a"], [closeB, "b"]]),
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
  const leagueInitials = (setup.initials || setup.abbreviation || setup.name || "LW").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "LW";
  const leagueMark = (size: number) => (
    setup.logoUrl
      ? <img className="reveal-mark" src={setup.logoUrl} alt="" width={size} height={size} style={{ width: size, height: size }} draggable={false} />
      : <span className="reveal-mark reveal-mark-mono" style={{ width: size, height: size, background: setup.color, color: readableTextColor(setup.color), fontSize: monoFont(size, leagueInitials.length) }}>{leagueInitials}</span>
  );
  const seasonShareCard = () => (
    <span className="reveal-share">
      <span className="reveal-share-head">
        <span className="reveal-share-crest">{leagueMark(56)}</span>
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
          <span className="reveal-share-tag">One to circle · Week {marqueeWeek.weekNumber}</span>
          <span className="reveal-share-vs">
            <span className="reveal-share-team">{teamMark(marqueeAway, 22)}<b style={{ color: nameColor(marqueeAway.color) }}>{marqueeAway.name}</b></span>
            <em>vs</em>
            <span className="reveal-share-team">{teamMark(marqueeHome, 22)}<b style={{ color: nameColor(marqueeHome.color) }}>{marqueeHome.name}</b></span>
          </span>
        </span>
      )}
      {milestones && (
        <span className="reveal-share-season">
          <span className="reveal-share-tag">Regular season</span>
          <span className="reveal-share-window">
            <span className="reveal-share-window-end"><b>Wk {milestones.kickoff.week}</b><i>{milestones.kickoff.date}</i></span>
            <span className="reveal-share-window-sep">→</span>
            <span className="reveal-share-window-end"><b>Wk {milestones.finalWeek.week}</b><i>{milestones.finalWeek.date}</i></span>
          </span>
        </span>
      )}
      <span className="reveal-share-brand"><Sparkles aria-hidden="true" />Woven with LeagueWeaver</span>
    </span>
  );
  const finale: Scene = {
    key: "ready", order: 100, holdMs: 0, finale: true,
    icon: <Sparkles aria-hidden="true" />,
    kicker: mode === "replay" ? "That's the season" : "Your season is ready",
    value: seasonShareCard(),
    caption: "",
    wash: leagueWash, bgLogos: leagueBgLogos,
  };

  return [...core, ...chosenExtras, finale].sort((left, right) => left.order - right.order);
}

type Milestone = { week: number; date: string };
function seasonMilestones(seasonYear: number, weeks: 13 | 14): { kickoff: Milestone; thanksgiving?: Milestone; finalWeek: Milestone } | undefined {
  try {
    const dateOf = (week: number) => monthDay.format(new Date(getNflWeekWindow(seasonYear, week).startsAt));
    // The season closes on the final week's *last* day (its window end), not its
    // opening day — so the timeline reads kickoff → final whistle end to end.
    const lastDayOf = (week: number) => monthDay.format(new Date(getNflWeekWindow(seasonYear, week).endsAt));
    const thanksgivingWeek = getNflWeeks(seasonYear, weeks).find((week) => week.holidays.includes("Thanksgiving"))?.week;
    return {
      kickoff: { week: 1, date: dateOf(1) },
      thanksgiving: thanksgivingWeek ? { week: thanksgivingWeek, date: dateOf(thanksgivingWeek) } : undefined,
      finalWeek: { week: weeks, date: lastDayOf(weeks) },
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
type WeaveThread = { away: Team; home: Team; rivalry: boolean };
type WeaveColumn = { week: number; threads: WeaveThread[] };

/** Per-week matchups for the woven-season grid (and the persistent loom backdrop),
 *  read straight off the solved schedule. Carries the two teams so the grid can
 *  fill each cell with real logos; the loom just uses their colours. */
function weaveColumnsOf(schedule: GeneratedSchedule): WeaveColumn[] {
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  // Only mark rivalries when there's more than one division — otherwise every game
  // is intra-division and the whole weave would light gold (signal → noise).
  const multiDivision = schedule.setup.divisions.length > 1;
  return [...schedule.weeks]
    .sort((left, right) => left.weekNumber - right.weekNumber)
    .map((week) => ({
      week: week.weekNumber,
      threads: week.games.flatMap((game) => {
        const away = teamById.get(game.awayTeamId);
        const home = teamById.get(game.homeTeamId);
        return away && home ? [{ away, home, rivalry: multiDivision && game.matchupType === "division" }] : [];
      }),
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
              style={{ background: `linear-gradient(90deg, ${thread.away.color} 0 50%, ${thread.home.color} 50% 100%)` }}
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

/** One team inside a weave cell — its real logo, or a colour + monogram chip. */
function ThreadTeam({ team }: { team: Team }) {
  return team.logoUrl
    ? <img className="reveal-wt-logo" src={team.logoUrl} alt="" draggable={false} />
    : <span className="reveal-wt-mono" style={{ background: team.color, color: readableTextColor(team.color) }}>{teamInitials(team)}</span>;
}

function WeaveGrid({ columns }: { columns: WeaveColumn[] }) {
  return (
    <span className="reveal-weave" aria-hidden="true">
      {columns.map((column, columnIndex) => (
        <span className="reveal-weave-col" key={column.week}>
          {column.threads.map((thread, rowIndex) => (
            <span
              key={rowIndex}
              className={`reveal-weave-cell${thread.rivalry ? " rivalry" : ""}`}
              style={{ "--i": columnIndex + rowIndex } as React.CSSProperties}
            >
              <ThreadTeam team={thread.away} />
              <ThreadTeam team={thread.home} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
