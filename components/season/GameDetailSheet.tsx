"use client";

import * as React from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Share2, Star, X } from "lucide-react";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { Modal } from "@/components/ui/Modal";
import { accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { buildGameDetailVM, type GameDetailPlayerStat, type GameDetailSideVM, type GameDetailSlotVM } from "@/lib/gameDetail";
import { formatPoints } from "@/lib/statistics";
import { teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, ScheduledGame, Team } from "@/lib/types";

const NFL_TEAM_COLORS: Record<string, string> = {
  ARI: "#97233f", ATL: "#a71930", BAL: "#241773", BUF: "#00338d", CAR: "#0085ca", CHI: "#0b162a", CIN: "#fb4f14",
  CLE: "#311d00", DAL: "#003594", DEN: "#fb4f14", DET: "#0076b6", GB: "#203731", HOU: "#03202f", IND: "#002c5f",
  JAX: "#006778", KC: "#e31837", LV: "#000000", LAC: "#0080c6", LAR: "#003594", MIA: "#008e97", MIN: "#4f2683",
  NE: "#002244", NO: "#d3bc8d", NYG: "#0b2265", NYJ: "#125740", PHI: "#004c54", PIT: "#ffb612", SEA: "#002244",
  SF: "#aa0000", TB: "#d50a0a", TEN: "#4b92db", WAS: "#5a1414", WSH: "#5a1414",
};

function teamDisplay(side: GameDetailSideVM, showCity: boolean) {
  return `${showCity && side.team.city ? `${side.team.city} ` : ""}${side.team.name}`;
}

function shortTeamLabel(team: Team) {
  return teamInitials(team);
}

function scoreValue(side: GameDetailSideVM) {
  if (side.starterTotal != null) return side.starterTotal;
  if (side.platformTotal != null) return side.platformTotal;
  return null;
}

function scoreLabel(side: GameDetailSideVM) {
  const value = scoreValue(side);
  return value == null ? "--" : formatPoints(value);
}

function playerScoreLabel(row?: GameDetailSlotVM) {
  if (!row) return "--";
  if (row.lineupStatus === "starter" && row.points === 0 && row.projected != null) return row.projected.toFixed(1);
  return row.points.toFixed(1);
}

function playerMeta(row: GameDetailSlotVM) {
  const parts = [row.nflTeam, row.position].filter(Boolean);
  return parts.length ? parts.join(" · ") : row.slot;
}

function playerAccent(row?: GameDetailSlotVM) {
  return row?.nflTeam ? NFL_TEAM_COLORS[row.nflTeam.toUpperCase()] : undefined;
}

function WeekStrip({
  schedule,
  currentGameId,
  games,
  onSelect,
}: {
  schedule: GeneratedSchedule;
  currentGameId: string;
  games: ScheduledGame[];
  onSelect?: (gameId: string) => void;
}) {
  const teamById = React.useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule.setup.teams]);
  return <div className="gdm-week-strip" aria-label="Games in this slate">
    {games.map((game) => {
      const away = teamById.get(game.awayTeamId);
      const home = teamById.get(game.homeTeamId);
      if (!away || !home) return null;
      const awayWin = game.awayScore != null && game.homeScore != null && game.awayScore > game.homeScore;
      const homeWin = game.awayScore != null && game.homeScore != null && game.homeScore >= game.awayScore;
      return <button
        type="button"
        className={`gdm-week-card ${game.id === currentGameId ? "is-active" : ""} ${game.gameNumber === 1 ? "is-featured" : ""}`}
        key={game.id}
        disabled={!onSelect}
        onClick={() => onSelect?.(game.id)}
      >
        <span>{game.gameNumber === 1 ? "GOTW" : `Game ${game.gameNumber ?? ""}`}</span>
        <b><EntityLogo color={away.color} logoUrl={away.logoUrl} monogram={teamInitials(away)} size={18} />{shortTeamLabel(away)}<em className={awayWin ? "is-winner" : ""}>{game.awayScore == null ? "--" : formatPoints(game.awayScore)}</em></b>
        <b><EntityLogo color={home.color} logoUrl={home.logoUrl} monogram={teamInitials(home)} size={18} />{shortTeamLabel(home)}<em className={homeWin ? "is-winner" : ""}>{game.homeScore == null ? "--" : formatPoints(game.homeScore)}</em></b>
      </button>;
    })}
  </div>;
}

function TeamHeader({ side, align, showCity }: { side: GameDetailSideVM; align: "away" | "home"; showCity: boolean }) {
  const score = scoreValue(side);
  const teamInk = accessibleTeamColor(side.team.color);
  const won = score != null && side.platformTotal != null && side.starterTotal != null ? score >= side.starterTotal : false;
  return <section className={`gdm-team-head ${align}`} style={{ "--team": side.team.color, "--team-ink": teamInk } as React.CSSProperties}>
    <span className="gdm-rank-row">
      <b>#{side.rank}</b>
      {side.division && <><DivisionMark division={side.division} /> <small>{side.division.name}</small></>}
    </span>
    <EntityLogo color={side.team.color} logoUrl={side.team.logoUrl} monogram={teamInitials(side.team)} size={56} />
    {showCity && side.team.city && <small className="gdm-team-city">{side.team.city}</small>}
    <strong>{side.team.name}</strong>
    <span className={`gdm-team-score ${won ? "is-win" : ""}`}>{scoreLabel(side)}</span>
  </section>;
}

function CenterStatus({ stateLabel, rating, featured }: { stateLabel: string; rating: number; featured: boolean }) {
  const bars = Math.max(1, Math.min(3, Math.round(rating / 3.4)));
  return <section className="gdm-center-status">
    <b>@</b>
    <strong>{stateLabel}</strong>
    <span className={featured ? "is-featured" : ""}>{featured ? <><Star fill="currentColor" /> GOTW</> : "Matchup"}</span>
    <em>{rating.toFixed(1)}</em>
    <i>{[1, 2, 3].map((bar) => <span className={bar <= bars ? "on" : ""} key={bar} />)}</i>
  </section>;
}

function PlayerCell({
  row,
  side,
  expanded,
  onToggle,
}: {
  row?: GameDetailSlotVM;
  side: "away" | "home";
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!row) return <div className={`gdm-player-cell ${side} is-empty`}><span className="gdm-player-text"><strong>Empty</strong><small>--</small></span><b>--</b></div>;
  const accent = playerAccent(row);
  const ink = accent ? readableTextColor(accent) : "var(--ink)";
  return <button type="button" className={`gdm-player-cell ${side} ${expanded ? "is-expanded" : ""}`} onClick={onToggle} aria-expanded={expanded}>
    {side === "home" && <span className="gdm-player-points"><strong>{playerScoreLabel(row)}</strong>{row.projected != null && <small>{row.projected.toFixed(1)}</small>}</span>}
    {side === "home" && <span className="gdm-nfl-token" style={{ background: accent ?? "var(--strength-bg)", color: accent ? ink : "var(--muted)" }}>{row.nflTeam || row.position}</span>}
    <span className="gdm-player-text">
      <strong>{row.name}</strong>
      <small>{playerMeta(row)}</small>
      {row.statLine && <em>{row.statLine}</em>}
    </span>
    {side === "away" && <span className="gdm-nfl-token" style={{ background: accent ?? "var(--strength-bg)", color: accent ? ink : "var(--muted)" }}>{row.nflTeam || row.position}</span>}
    {side === "away" && <span className="gdm-player-points"><strong>{playerScoreLabel(row)}</strong>{row.projected != null && <small>{row.projected.toFixed(1)}</small>}</span>}
  </button>;
}

function PlayerDetail({ row }: { row: GameDetailSlotVM }) {
  return <div className="gdm-player-detail">
    <strong>{row.name}</strong>
    {row.statDetails?.length ? <ul>
      {row.statDetails.slice(0, 8).map((stat) => <li key={`${stat.raw}:${stat.points}`}><span>{stat.label}</span><b>{stat.points >= 0 ? "+" : ""}{stat.points.toFixed(1)}</b></li>)}
    </ul> : <p>{row.statLine || `${row.position}${row.nflTeam ? ` · ${row.nflTeam}` : ""}`}</p>}
  </div>;
}

function RosterPairRows({ away, home, type }: { away: GameDetailSlotVM[]; home: GameDetailSlotVM[]; type: "starters" | "bench" }) {
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const rows = Array.from({ length: Math.max(away.length, home.length) }, (_, index) => ({ away: away[index], home: home[index], index }));
  return <div className={`gdm-roster-pairs ${type === "bench" ? "is-bench" : ""}`}>
    {rows.map(({ away: awayRow, home: homeRow, index }) => {
      const slot = type === "bench" ? "BE" : awayRow?.slot || homeRow?.slot || "--";
      const awayOpen = openKey === awayRow?.key;
      const homeOpen = openKey === homeRow?.key;
      return <React.Fragment key={`${type}:${index}`}>
        <div className="gdm-pair-row">
          <PlayerCell row={awayRow} side="away" expanded={awayOpen} onToggle={() => awayRow && setOpenKey(awayOpen ? null : awayRow.key)} />
          <span className="gdm-slot-center">{slot}</span>
          <PlayerCell row={homeRow} side="home" expanded={homeOpen} onToggle={() => homeRow && setOpenKey(homeOpen ? null : homeRow.key)} />
        </div>
        {awayOpen && awayRow && <PlayerDetail row={awayRow} />}
        {homeOpen && homeRow && <PlayerDetail row={homeRow} />}
      </React.Fragment>;
    })}
  </div>;
}

export function GameDetailSheet({
  schedule,
  gameId,
  playerStats,
  winProbability,
  navigation,
  onClose,
}: {
  schedule: GeneratedSchedule;
  gameId: string;
  playerStats: GameDetailPlayerStat[];
  winProbability?: { away: number; home: number };
  navigation?: {
    previous?: { id: string; label: string };
    next?: { id: string; label: string };
    games?: ScheduledGame[];
    onSelect: (gameId: string) => void;
  };
  onClose: () => void;
}) {
  const vm = buildGameDetailVM(schedule, gameId, playerStats);
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  if (!vm) return null;
  const showCity = schedule.setup.display?.cityNames !== false;
  const stateLabel = vm.status === "final" ? "Final" : "Upcoming";
  const contextLabel = vm.isPlayoff ? vm.playoffLabel || "Playoffs" : `Week ${vm.weekNumber}`;
  const isBroadcast = vm.featured;
  const slateGames = navigation?.games ?? schedule.weeks.find((week) => week.weekNumber === vm.weekNumber)?.games ?? [vm.game];
  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !navigation) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const target = dx < 0 ? navigation.next : navigation.previous;
    if (target) navigation.onSelect(target.id);
  };

  return <Modal
    className={`game-detail-modal ${isBroadcast ? "is-broadcast" : ""}`}
    backdropClassName="game-detail-modal-backdrop"
    labelledBy="game-detail-title"
    onClose={onClose}
  >
    <div
      className="gdm-content"
      onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={handleTouchEnd}
    >
      <header className="gdm-appbar">
        <button type="button" className="gdm-icon-button" aria-label="Back to schedule" onClick={onClose}><ArrowLeft /></button>
        <strong>Matchup</strong>
        <button type="button" className="gdm-icon-button" aria-label="Share matchup"><Share2 /></button>
        <button type="button" className="gdm-close" aria-label="Close game detail" onClick={onClose}><X /></button>
      </header>
      <WeekStrip schedule={schedule} currentGameId={gameId} games={slateGames} onSelect={navigation?.onSelect} />
      {isBroadcast && <div className="gdm-gotw-band"><Star fill="currentColor" /> Game of the Week <Star fill="currentColor" /></div>}
      <div className="gdm-eyebrow">
        {contextLabel}<span>·</span>{vm.dateLabel}<span>·</span><MapPin />{vm.stadium}
      </div>
      <div className="gdm-matchup-head">
        <TeamHeader side={vm.away} align="away" showCity={showCity} />
        <CenterStatus stateLabel={stateLabel} rating={vm.ratingScore10} featured={isBroadcast} />
        <TeamHeader side={vm.home} align="home" showCity={showCity} />
      </div>
      {winProbability && vm.status !== "final" && <div className="gdm-winbar">
        <b style={{ color: vm.away.team.color }}>{Math.round(winProbability.away * 100)}%</b>
        <span><i style={{ width: `${Math.round(winProbability.away * 100)}%`, background: vm.away.team.color }} /><i style={{ width: `${Math.round(winProbability.home * 100)}%`, background: vm.home.team.color }} /></span>
        <b style={{ color: vm.home.team.color }}>{Math.round(winProbability.home * 100)}%</b>
        <small>Projected Win Probability</small>
      </div>}
      {vm.unsynced && <div className="gdm-unsynced" role="status">Roster details appear after ESPN or Sleeper player data syncs.</div>}
      <main className="gdm-body">
        <h3>Starters</h3>
        <RosterPairRows away={vm.away.starters} home={vm.home.starters} type="starters" />
        <h3>Bench</h3>
        <RosterPairRows away={vm.away.bench} home={vm.home.bench} type="bench" />
        <footer>{vm.status === "final" ? "Tap any player to see how their points were scored" : "Projected roster view until this matchup is final"}</footer>
      </main>
    </div>
  </Modal>;
}
