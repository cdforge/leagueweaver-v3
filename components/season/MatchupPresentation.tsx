import Link from "next/link";
import { CalendarClock, ChevronDown, CircleAlert, Gamepad2, LockKeyhole, MapPin, Medal, SlidersHorizontal, Star, StickyNote, TrendingUp, Zap } from "lucide-react";
import { DivisionIdentity, DivisionMark } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { formatGameDateTimeOverride, getWeeklyMatchupSignal, matchupSeriesLabel, type MatchupSignal } from "@/lib/matchups";
import type { GameBadge } from "@/lib/statistics";
import { teamInitials } from "@/lib/teamIdentity";
import type { Division, ScheduledGame, Team } from "@/lib/types";

export interface TeamRecordDisplay {
  overall: string;
  division?: string;
}

export function TeamIdentityBlock({ team, division, leagueRank, record, showCity = true, showRecord = true, result = "open", compact = false, mirrored = false, href }: {
  team: Team;
  division?: Division;
  leagueRank: number;
  record: TeamRecordDisplay;
  showCity?: boolean;
  showRecord?: boolean;
  result?: "winner" | "loser" | "open";
  compact?: boolean;
  mirrored?: boolean;
  href?: string;
}) {
  const teamText = accessibleTeamColor(team.color);
  const divisionColor = division?.color || team.color;
  const content = <>
    <b className="team-identity-rank" style={{ background: divisionColor, color: readableTextColor(divisionColor) }}>#{leagueRank}</b>
    <span className="team-identity-mark">
      <EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={compact ? 40 : 48} />
    </span>
    <span className="team-identity-name">
      {showCity && team.city && <small className="team-city">{team.city}</small>}
      <strong>{team.name}</strong>
    </span>
    {showRecord && <span className="team-identity-record">
      <strong>{record.overall}</strong>
      {record.division && <span className="team-identity-division-record" style={{ "--division-text": accessibleTeamColor(divisionColor) } as React.CSSProperties} aria-label={`${division?.name ?? "Division"} record ${record.division}`}>
        <b>{record.division}</b>
        {division ? <DivisionIdentity iconOnly division={division} /> : <small>DIV</small>}
      </span>}
    </span>}
  </>;
  const className = `team-identity-block ${compact ? "compact" : ""} ${mirrored ? "mirrored" : ""} ${showRecord ? "" : "without-record"} result-${result}`;
  const style = { "--team-text": teamText } as React.CSSProperties;
  return href ? <Link className={`${className} is-link`} style={style} href={href} aria-label={`Open ${team.city ? `${team.city} ` : ""}${team.name} schedule`}>{content}</Link> : <div className={className} style={style}>{content}</div>;
}

export function MatchupRatingLegend() {
  return <div className="matchup-rating-legend" aria-label="Matchup rating scale. Lower ratings are better.">
    <span className="matchup-scale-title"><SlidersHorizontal aria-hidden="true" /><span><strong>Matchup scale</strong><small>Lower is better</small></span></span>
    <div>
      <span className="legend-competitive"><span className="signal-bars" aria-hidden="true">{[1, 2, 3].map((bar) => <i className="active" key={bar} />)}</span><b>Competitive</b><small>Best third</small></span>
      <span className="legend-neutral"><span className="signal-bars" aria-hidden="true">{[1, 2, 3].map((bar) => <i className={bar <= 2 ? "active" : ""} key={bar} />)}</span><b>Neutral</b><small>Middle third</small></span>
      <span className="legend-lopsided"><span className="signal-bars" aria-hidden="true">{[1, 2, 3].map((bar) => <i className={bar === 1 ? "active" : ""} key={bar} />)}</span><b>Lopsided</b><small>Widest gaps</small></span>
    </div>
  </div>;
}

export function WeekMatchupRank({ rank, total, compact = false }: { rank?: number; total: number; compact?: boolean }) {
  if (rank == null || rank < 1 || total < 1) return null;
  const signal = getWeeklyMatchupSignal(rank, total);
  const tier = signal.label.toLowerCase();
  // One monotone strength scale: 1 = strongest slate, 0 = regular. Never "bad".
  const strength = 1 - signal.normalized;
  const label = `Weekly matchup rank ${rank} of ${total}. ${signal.label} slate; lower rank is better.`;
  return <span className={`week-matchup-rank signal-${tier} ${compact ? "compact" : ""}`} style={{ "--sig-t": strength } as React.CSSProperties} aria-label={label} title={label}>
    {!compact && <span className="signal-bars" aria-hidden="true">{[1, 2, 3].map((bar) => <i className={bar <= signal.bars ? "active" : ""} key={bar} />)}</span>}
    {compact
      ? <strong>#{rank}</strong>
      : <span className="week-matchup-rank-copy"><strong>#{rank}</strong><small>of {total}</small></span>}
  </span>;
}

export function MatchupSeriesChip({ game, division }: { game: ScheduledGame; division?: Division }) {
  const isDivision = game.matchupType === "division";
  const label = matchupSeriesLabel(game);
  const style = isDivision && division ? {
    "--division-chip-color": division.color,
    "--division-chip-ink": accessibleTeamColor(division.color),
  } as React.CSSProperties : undefined;
  return <span className={`series-chip ${isDivision ? "division-series-chip" : "cross-series-chip"}`} style={style} aria-label={division && isDivision ? `${division.name} division, game ${game.seriesGame} of ${game.seriesLength}` : label}>
    {isDivision ? <>
      {division && <DivisionMark division={division} />}
      <span>Div {game.seriesGame} of {game.seriesLength}</span>
    </> : <>
      <span>Cross-div {game.seriesGame} of {game.seriesLength}</span>
    </>}
  </span>;
}

export function GameBadgeChip({ badge, title, className = "" }: { badge: GameBadge; title?: string; className?: string }) {
  return <em className={`game-badge badge-${badge.toLowerCase()} ${className}`} title={title}>
    {badge === "GOTW" ? <Star fill="currentColor" aria-hidden="true" /> : badge === "Upset" ? <TrendingUp aria-hidden="true" /> : <Zap aria-hidden="true" />}
    {badge}
  </em>;
}

function SignalBars({ signal, awayRank, homeRank }: { signal: MatchupSignal; awayRank: number; homeRank: number }) {
  const rating = signal.rating.toFixed(1);
  return <span className={`matchup-signal signal-${signal.label.toLowerCase()}`} style={{ "--sig-t": 1 - signal.normalized } as React.CSSProperties} aria-label={`${signal.label} matchup, rating ${rating}; away rank ${awayRank}, home rank ${homeRank}; lower is better`} title={`${signal.label} · rating ${rating} · #${awayRank} vs #${homeRank} (lower is better)`}>
    <span className="matchup-signal-main">
      <span className="signal-bars" aria-hidden="true">{[1, 2, 3].map((bar) => <i className={bar <= signal.bars ? "active" : ""} key={bar} />)}</span>
      <b>{rating}</b>
    </span>
    <small className="matchup-signal-ranks">#{awayRank} vs #{homeRank}</small>
  </span>;
}

function GameDetails({ game }: { game: ScheduledGame }) {
  const metadata = [game.specialEvent, ...(game.notes ?? []), game.tbdReason].filter(Boolean) as string[];
  return <div className="game-detail-items">
    {game.dateTimeOverride && <span><CalendarClock /><strong>{formatGameDateTimeOverride(game.dateTimeOverride)}</strong></span>}
    {game.rescheduleStatus && <span className="game-status-note"><CircleAlert /><strong>{game.rescheduleStatus}</strong></span>}
    {metadata.map((item) => <span key={item}><StickyNote /><strong>{item}</strong></span>)}
  </div>;
}

export function MatchupCard({ game, away, home, awayDivision, homeDivision, awayRank, homeRank, awayRecord, homeRecord, signal, featured, featuredLabel = "GOTW", gameLabel, showCity, showVenue, variant = "standard", teamHrefBase, badges = [], medalRank, medalLabel, highlighted = false, simulationSource, simulationLocked = false, winProbability }: {
  game: ScheduledGame;
  away: Team;
  home: Team;
  awayDivision?: Division;
  homeDivision?: Division;
  awayRank: number;
  homeRank: number;
  awayRecord: TeamRecordDisplay;
  homeRecord: TeamRecordDisplay;
  signal: MatchupSignal;
  featured: boolean;
  featuredLabel?: string;
  gameLabel?: string;
  showCity: boolean;
  showVenue: boolean;
  variant?: "standard" | "gotw";
  teamHrefBase?: string;
  badges?: GameBadge[];
  medalRank?: number;
  medalLabel?: string;
  highlighted?: boolean;
  simulationSource?: "simulated" | "override";
  simulationLocked?: boolean;
  winProbability?: { away: number; home: number };
}) {
  const played = game.awayScore != null && game.homeScore != null;
  const hasAdditionalDetails = Boolean(game.dateTimeOverride || game.rescheduleStatus || game.specialEvent || game.notes?.length || game.tbdReason);
  const awayResult = !played ? "open" : game.awayScore! > game.homeScore! ? "winner" : game.awayScore! < game.homeScore! ? "loser" : "open";
  const homeResult = !played ? "open" : game.homeScore! > game.awayScore! ? "winner" : game.homeScore! < game.awayScore! ? "loser" : "open";
  return <article id={game.id} className={`matchup-card ${featured ? "is-gotw" : ""} ${highlighted ? "is-stat-highlight" : ""} ${simulationSource ? `is-simulated simulation-${simulationSource}` : ""} matchup-card-${variant}`}>
    <div className="matchup-card-badges">
      {featured && <span className="gotw-chip"><Star fill="currentColor" /><strong>{featuredLabel}</strong></span>}
      {gameLabel && <span className="game-order-chip">{gameLabel}</span>}
      <MatchupSeriesChip game={game} division={homeDivision} />
      {medalRank && medalRank <= 3 && <span className={`schedule-medal medal-${medalRank}`} title={medalLabel}><Medal />{medalLabel || medalRank}</span>}
      {simulationSource && <span className={`simulation-chip source-${simulationSource}`}><Gamepad2 />{simulationSource === "override" ? "Commissioner result" : "Simulated"}{simulationLocked && <LockKeyhole />}</span>}
      {badges.filter((badge) => badge !== "GOTW").map((badge) => <GameBadgeChip badge={badge} key={badge} />)}
      {showVenue && <span className="matchup-venue"><MapPin />{home.logoUrl && <img src={home.logoUrl} alt="" />}<strong>{game.stadium}</strong></span>}
      {winProbability && !played && <span className="matchup-probability" aria-label={`${away.name} ${Math.round(winProbability.away * 100)} percent, ${home.name} ${Math.round(winProbability.home * 100)} percent`}>
        <span style={{ "--away-probability": `${winProbability.away * 100}%` } as React.CSSProperties} />
        <small>AWAY {Math.round(winProbability.away * 100)}%</small>
        <small>HOME {Math.round(winProbability.home * 100)}%</small>
      </span>}
      <SignalBars signal={signal} awayRank={awayRank} homeRank={homeRank} />
    </div>
    <div className="matchup-card-main">
      <TeamIdentityBlock team={away} division={awayDivision} leagueRank={awayRank} record={awayRecord} showCity={showCity} result={awayResult} href={teamHrefBase ? `${teamHrefBase}/${away.id}` : undefined} />
      <div className="matchup-score" aria-label={played ? `${away.name} ${game.awayScore}, ${home.name} ${game.homeScore}, final` : `${away.name} at ${home.name}, score not entered`}>
        <strong className={awayResult === "loser" ? "loser" : ""}>{game.awayScore ?? "—"}</strong>
        <span aria-label="at">@</span>
        <strong className={homeResult === "loser" ? "loser" : ""}>{game.homeScore ?? "—"}</strong>
        <small>{played ? "FINAL" : "SCHEDULED"}</small>
      </div>
      <TeamIdentityBlock mirrored team={home} division={homeDivision} leagueRank={homeRank} record={homeRecord} showCity={showCity} result={homeResult} href={teamHrefBase ? `${teamHrefBase}/${home.id}` : undefined} />
    </div>
    {hasAdditionalDetails && <div className="game-details-desktop"><GameDetails game={game} /></div>}
    {hasAdditionalDetails && <details className="game-details-mobile"><summary>More details <ChevronDown /></summary><GameDetails game={game} /></details>}
  </article>;
}
