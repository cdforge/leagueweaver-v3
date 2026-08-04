"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, MapPin, Star, UsersRound, X } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { MatchupSeriesChip } from "@/components/season/MatchupPresentation";
import { readableTextColor, tintColor } from "@/lib/colorContrast";
import { isGamePlayed } from "@/lib/game";
import { getMatchupSignal } from "@/lib/matchups";
import { formatPoints } from "@/lib/statistics";
import { teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, MatchupRosterPlayer, MatchupRosterSide, ScheduledGame, Team } from "@/lib/types";

const SLOT_COLORS: Record<string, string> = {
  QB: "#3867d6",
  RB: "#117a45",
  WR: "#8a4bd6",
  TE: "#c78914",
  FLEX: "#d9480f",
  "D/ST": "#0f766e",
  K: "#6b7280",
  HC: "#334155",
  BE: "#64748b",
};

const STARTER_SLOTS = ["QB", "RB", "RB", "WR", "WR", "WR", "FLEX", "TE", "D/ST", "K", "HC"];

const ESPN_STAT_LABELS: Record<string, string> = {
  "0": "Pass Att",
  "1": "Comp",
  "3": "Pass Yds",
  "4": "Pass TD",
  "19": "2PT",
  "20": "INT",
  "23": "Rush",
  "24": "Rush Yds",
  "25": "Rush TD",
  "26": "2PT",
  "37": "100-Yd",
  "42": "Rec Yds",
  "43": "Rec TD",
  "44": "2PT",
  "53": "Rec",
  "58": "Tgt",
  "63": "100-Yd",
  "72": "Fum",
  "74": "FG 0-39",
  "75": "FG 40-49",
  "76": "FG 50+",
  "77": "FG",
  "80": "FG Miss",
  "85": "XP Miss",
  "86": "XP",
  "91": "Def TD",
  "95": "Safety",
  "96": "Block Kick",
  "97": "Kick TD",
  "99": "Sack",
  "103": "Pick 6",
  "106": "INT",
  "114": "Pts Allowed",
  "115": "Yds Allowed",
  "122": "Fum Rec",
  "123": "Fum Lost",
  "124": "Pts Allowed",
  "129": "Return TD",
  "130": "Def TD",
  "132": "Pts Allowed",
  "133": "Pts Allowed",
  "158": "Team Pts",
  "159": "Projected",
  "160": "Margin",
  "163": "Win",
  "166": "Win",
  "167": "Win+",
  "168": "Loss",
  "169": "Loss",
  "170": "Margin",
  "171": "Shutout",
  "172": "Loss",
  "198": "Long FG",
  "200": "FG Miss",
};

const NFL_TEAM_COLORS: Record<string, [string, string]> = {
  ARI: ["#97233f", "#000000"],
  ATL: ["#a71930", "#000000"],
  BAL: ["#241773", "#000000"],
  BUF: ["#00338d", "#c60c30"],
  CAR: ["#0085ca", "#101820"],
  CHI: ["#0b162a", "#c83803"],
  CIN: ["#fb4f14", "#000000"],
  CLE: ["#311d00", "#ff3c00"],
  DAL: ["#003594", "#869397"],
  DEN: ["#fb4f14", "#002244"],
  DET: ["#0076b6", "#b0b7bc"],
  GB: ["#203731", "#ffb612"],
  HOU: ["#03202f", "#a71930"],
  IND: ["#002c5f", "#a2aaad"],
  JAX: ["#006778", "#d7a22a"],
  KC: ["#e31837", "#ffb81c"],
  LAC: ["#0080c6", "#ffc20e"],
  LAR: ["#003594", "#ffa300"],
  LV: ["#000000", "#a5acaf"],
  MIA: ["#008e97", "#fc4c02"],
  MIN: ["#4f2683", "#ffc62f"],
  NE: ["#002244", "#c60c30"],
  NO: ["#101820", "#a08a58"],
  NYG: ["#0b2265", "#a71930"],
  NYJ: ["#125740", "#000000"],
  PHI: ["#004c54", "#a5acaf"],
  PIT: ["#101820", "#ffb612"],
  SEA: ["#002244", "#69be28"],
  SF: ["#aa0000", "#b3995d"],
  TB: ["#d50a0a", "#ff7900"],
  TEN: ["#4b92db", "#0c2340"],
  WSH: ["#5a1414", "#ffb612"],
  FA: ["#607069", "#b8c5bf"],
};

function gameStatus(game: ScheduledGame, detail?: NonNullable<GeneratedSchedule["matchupRosterDetails"]>[string]) {
  if (detail?.status) return detail.status;
  return isGamePlayed(game) ? "final" : "upcoming";
}

function playerName(player: MatchupRosterPlayer) {
  return player.fullName || player.name;
}

function playerHeadshot(player: MatchupRosterPlayer) {
  if (player.headshotUrl) return player.headshotUrl;
  if (player.providerPlayerId && /^-?\d+$/.test(player.providerPlayerId)) {
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${player.providerPlayerId}.png`;
  }
  return "";
}

function statLabel(raw: string, fallback: string, position: string) {
  if (ESPN_STAT_LABELS[raw]) return ESPN_STAT_LABELS[raw];
  if (fallback && !/^Stat\s+\d+$/i.test(fallback)) return fallback;
  if (position === "K") return "Kick";
  if (position === "HC") return "Coach";
  return fallback || "Scoring";
}

function ProTeamBadge({ player }: { player: MatchupRosterPlayer }) {
  const code = player.proTeam || "FA";
  const [primary, secondary] = NFL_TEAM_COLORS[code] || NFL_TEAM_COLORS.FA;
  return (
    <span
      className="mr-pro-badge"
      style={{ background: `linear-gradient(135deg, ${primary} 0 50%, ${secondary} 50% 100%)` }}
      aria-label={code}
    >
      {code}
    </span>
  );
}

function teamLabel(team: Team, showCity: boolean) {
  return showCity && team.city ? `${team.city} ${team.name}`.trim() : team.name;
}

function EmptyPlayerCell({ side }: { side: "away" | "home" }) {
  return (
    <div className={`mr-player-cell empty ${side}`}>
      <span className="mr-avatar empty-avatar"><UsersRound aria-hidden="true" /></span>
      <span className="mr-player-main">
        <strong>Player data pending</strong>
        <small>Roster sync not connected yet</small>
      </span>
    </div>
  );
}

function PlayerCell({ player, side }: { player?: MatchupRosterPlayer; side: "away" | "home" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  if (!player) return <EmptyPlayerCell side={side} />;
  const headshot = playerHeadshot(player);
  const scored = player.points != null;
  const projected = player.projectedPoints != null;
  const hasLedger = Boolean(player.statDetails?.length);
  return (
    <button
      type="button"
      className={`mr-player-cell ${side}${expanded ? " is-expanded" : ""}`}
      onClick={() => setExpanded((current) => !current)}
      aria-expanded={expanded}
    >
      <span className="mr-player-line">
        <ProTeamBadge player={player} />
        <span className="mr-player-main">
          <strong>
            {playerName(player)}
            {player.injuryStatus && player.injuryStatus !== "ACTIVE" && <em>{player.injuryStatus.slice(0, 1)}</em>}
          </strong>
          <small>{[player.position, player.proTeam].filter(Boolean).join(" · ") || player.slot}</small>
          {player.statLine && <span>{player.statLine}</span>}
        </span>
        <span className="mr-player-score">
          <strong className={scored && projected ? player.points! >= player.projectedPoints! ? "beat" : "miss" : ""}>
            {scored ? formatPoints(player.points!) : projected ? formatPoints(player.projectedPoints!) : "-"}
          </strong>
          {projected && <small>proj {formatPoints(player.projectedPoints!)}</small>}
        </span>
      </span>
      {expanded && (
        <span className="mr-ledger">
          {headshot && !imageFailed && (
            <span className="mr-ledger-player">
              <img src={headshot} alt="" onError={() => setImageFailed(true)} />
              <b>{playerName(player)}</b>
              <em>{[player.position, player.proTeam].filter(Boolean).join(" · ")}</em>
            </span>
          )}
          {hasLedger
            ? player.statDetails!.slice(0, 8).map((detail) => (
                <span key={`${player.id}-${detail.raw}`}>
                  <b>{statLabel(detail.raw, detail.label, player.position)}</b>
                  <em>{formatPoints(detail.points)}</em>
                </span>
              ))
            : <span><b>Scoring breakdown</b><em>Not available from this provider yet</em></span>}
        </span>
      )}
    </button>
  );
}

function RosterRow({
  away,
  home,
  slot,
  empty,
}: {
  away?: MatchupRosterPlayer;
  home?: MatchupRosterPlayer;
  slot: string;
  empty: boolean;
}) {
  const color = SLOT_COLORS[slot] || "#64748b";
  return (
    <div className={`mr-roster-row${empty ? " is-empty" : ""}`}>
      <PlayerCell player={away} side="away" />
      <span
        className="mr-slot"
        style={{ backgroundColor: tintColor(color, 0.14), color }}
      >
        {slot}
      </span>
      <PlayerCell player={home} side="home" />
    </div>
  );
}

function sideTotal(side: MatchupRosterSide | undefined, gameScore: number | undefined) {
  return side?.total ?? gameScore;
}

function gameTeamScore(game: ScheduledGame, detail: GeneratedSchedule["matchupRosterDetails"] | undefined, side: "away" | "home") {
  const gameDetail = detail?.[game.id];
  if (side === "away") return sideTotal(gameDetail?.away, game.awayScore);
  return sideTotal(gameDetail?.home, game.homeScore);
}

function probability(status: ReturnType<typeof gameStatus>, awayScore?: number, homeScore?: number, awayProjected?: number, homeProjected?: number) {
  if (status === "final" && awayScore != null && homeScore != null) {
    if (awayScore === homeScore) return { away: 50, home: 50, label: "Final tie" };
    return awayScore > homeScore ? { away: 100, home: 0, label: "Final" } : { away: 0, home: 100, label: "Final" };
  }
  const awayValue = awayScore ?? awayProjected ?? 0;
  const homeValue = homeScore ?? homeProjected ?? 0;
  const homePct = Math.round((1 / (1 + Math.exp(-((homeValue - awayValue) / (status === "live" ? 13 : 22))))) * 100);
  return { away: 100 - homePct, home: homePct, label: status === "live" ? "Live win probability" : "Projected win probability" };
}

export function MatchupRosterModal({
  schedule,
  gameId,
  onClose,
  onSelectGame,
}: {
  schedule: GeneratedSchedule;
  gameId: string | null;
  onClose: () => void;
  onSelectGame: (gameId: string) => void;
}) {
  const touchStart = useRef<number | null>(null);
  const games = useMemo(() => schedule.weeks.flatMap((week) => week.games.map((game) => ({ game, week }))), [schedule.weeks]);
  const index = gameId ? games.findIndex((item) => item.game.id === gameId) : -1;
  const item = index >= 0 ? games[index] : undefined;
  const game = item?.game;
  const detail = game ? schedule.matchupRosterDetails?.[game.id] : undefined;
  const detailProviderLabel = detail?.provider
    ? detail.provider.toUpperCase()
    : "PLAYER";
  const teamById = useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule.setup.teams]);
  const divisionById = useMemo(() => new Map(schedule.setup.divisions.map((division) => [division.id, division])), [schedule.setup.divisions]);
  const showCity = schedule.setup.display?.cityNames !== false;

  useEffect(() => {
    if (!game) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && index > 0) onSelectGame(games[index - 1].game.id);
      if (event.key === "ArrowRight" && index < games.length - 1) onSelectGame(games[index + 1].game.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, games, index, onClose, onSelectGame]);

  if (!game || !item) return null;

  const away = teamById.get(game.awayTeamId);
  const home = teamById.get(game.homeTeamId);
  if (!away || !home) return null;
  const awayDivision = divisionById.get(away.divisionId);
  const homeDivision = divisionById.get(home.divisionId);
  const status = gameStatus(game, detail);
  const signal = getMatchupSignal(game, undefined, undefined, schedule.setup.teams.length);
  const awayScore = sideTotal(detail?.away, game.awayScore);
  const homeScore = sideTotal(detail?.home, game.homeScore);
  const awayResult = awayScore == null || homeScore == null || awayScore === homeScore ? "open" : awayScore > homeScore ? "win" : "loss";
  const homeResult = awayScore == null || homeScore == null || homeScore === awayScore ? "open" : homeScore > awayScore ? "win" : "loss";
  const winProbability = probability(status, awayScore, homeScore, detail?.away.projectedTotal, detail?.home.projectedTotal);
  const hasPlayers = Boolean(detail && (detail.away.starters.length || detail.home.starters.length || detail.away.bench.length || detail.home.bench.length));
  const starterCount = hasPlayers
    ? Math.max(detail?.away.starters.length ?? 0, detail?.home.starters.length ?? 0)
    : STARTER_SLOTS.length;
  const benchCount = hasPlayers
    ? Math.max(detail?.away.bench.length ?? 0, detail?.home.bench.length ?? 0)
    : 5;
  const prev = index > 0 ? games[index - 1].game.id : null;
  const next = index < games.length - 1 ? games[index + 1].game.id : null;
  const modalAccent = home.color || "#117a45";

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (touchStart.current == null) return;
    const delta = event.clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) < 70) return;
    if (delta > 0 && prev) onSelectGame(prev);
    if (delta < 0 && next) onSelectGame(next);
  };

  return (
    <div className="matchup-roster-overlay" role="dialog" aria-modal="true" aria-label={`${teamLabel(away, showCity)} at ${teamLabel(home, showCity)} roster detail`}>
      <button type="button" className="matchup-roster-backdrop" aria-label="Close matchup roster" onClick={onClose} />
      <div
        className={`matchup-roster-panel st-${status}${game.gameNumber === 1 ? " is-gotw" : ""}`}
        style={{ "--mr-accent": modalAccent, "--mr-accent-ink": readableTextColor(modalAccent) } as React.CSSProperties}
        onPointerDown={(event) => { touchStart.current = event.clientX; }}
        onPointerUp={onPointerUp}
      >
        <header className="mr-appbar">
          <button type="button" className="mr-icon-button" onClick={onClose} aria-label="Close matchup roster"><X /></button>
          <span><strong>Matchup</strong><small>Week {item.week.weekNumber}</small></span>
          <div className="mr-nav-buttons">
            <button type="button" className="mr-icon-button" disabled={!prev} onClick={() => prev && onSelectGame(prev)} aria-label="Previous matchup"><ChevronLeft /></button>
            <button type="button" className="mr-icon-button" disabled={!next} onClick={() => next && onSelectGame(next)} aria-label="Next matchup"><ChevronRight /></button>
          </div>
        </header>

        <div className="mr-week-strip" aria-label="Matchup position">
          {games.map(({ game: stripGame }, stripIndex) => {
            const stripAway = teamById.get(stripGame.awayTeamId);
            const stripHome = teamById.get(stripGame.homeTeamId);
            const stripAwayScore = gameTeamScore(stripGame, schedule.matchupRosterDetails, "away");
            const stripHomeScore = gameTeamScore(stripGame, schedule.matchupRosterDetails, "home");
            const awayWon = stripAwayScore != null && stripHomeScore != null && stripAwayScore > stripHomeScore;
            const homeWon = stripAwayScore != null && stripHomeScore != null && stripHomeScore >= stripAwayScore;
            return (
            <button
              type="button"
              key={stripGame.id}
              className={stripGame.id === game.id ? "active" : ""}
              onClick={() => onSelectGame(stripGame.id)}
              aria-label={`Open game ${stripIndex + 1}`}
            >
              <span className="mr-strip-top">{stripGame.gameNumber === 1 ? "★ GOTW" : `Game ${stripGame.gameNumber ?? stripIndex + 1}`}</span>
              <span className="mr-strip-team">
                <EntityLogo color={stripAway?.color ?? "#117a45"} logoUrl={stripAway?.logoUrl} monogram={stripAway ? teamInitials(stripAway) : "A"} size={18} />
                <b>{stripAway?.shortName || stripAway?.name || "Away"}</b>
                <strong className={awayWon ? "winner" : ""}>{stripAwayScore == null ? "-" : formatPoints(stripAwayScore)}</strong>
              </span>
              <span className="mr-strip-team">
                <EntityLogo color={stripHome?.color ?? "#117a45"} logoUrl={stripHome?.logoUrl} monogram={stripHome ? teamInitials(stripHome) : "H"} size={18} />
                <b>{stripHome?.shortName || stripHome?.name || "Home"}</b>
                <strong className={homeWon ? "winner" : ""}>{stripHomeScore == null ? "-" : formatPoints(stripHomeScore)}</strong>
              </span>
            </button>
          );})}
        </div>

        {game.gameNumber === 1 && <div className="mr-gotw-band"><Star fill="currentColor" /> Game of the Week <Star fill="currentColor" /></div>}

        <div className="mr-eyebrow">
          <span>Wk {item.week.weekNumber}</span>
          <i aria-hidden="true" />
          <span>{item.week.dateLabel.replace(/,?\s*\d{4}$/, "")}</span>
          <i aria-hidden="true" />
          <MapPin aria-hidden="true" />
          <span>{game.stadium}</span>
        </div>

        <section className="mr-score-head">
          <TeamHeader team={away} side="away" rank={away.overallRank} score={awayScore} result={awayResult} showCity={showCity} />
          <div className="mr-center">
            <span>at</span>
            <strong className={`mr-status status-${status}`}>{status === "predraft" ? "Pre-draft" : status === "upcoming" ? "Upcoming" : status === "live" ? "Live" : "Final"}</strong>
            <em>{status === "final" ? "Complete" : "Roster detail"}</em>
            <div className={`mr-signal signal-${signal.label.toLowerCase()}`}>
              <b>{signal.score10.toFixed(1)}</b>
              <span>{Array.from({ length: 3 }, (_, bar) => <i className={bar < signal.bars ? "on" : ""} key={bar} />)}</span>
              <small>#{away.overallRank} vs #{home.overallRank}</small>
            </div>
          </div>
          <TeamHeader team={home} side="home" rank={home.overallRank} score={homeScore} result={homeResult} showCity={showCity} />
        </section>

        <div className="mr-series-row">
          <MatchupSeriesChip game={game} awayDivision={awayDivision} homeDivision={homeDivision} setup={schedule.setup} />
          <span>{detail ? `${detailProviderLabel} ${detail.sourceSeasonYear ?? schedule.setup.seasonYear}` : "Player sync pending"}</span>
        </div>

        <div className="mr-probability" aria-label={`${winProbability.label}: ${teamLabel(away, showCity)} ${winProbability.away} percent, ${teamLabel(home, showCity)} ${winProbability.home} percent`}>
          <span>{winProbability.away}%</span>
          <div><i style={{ width: `${winProbability.away}%`, background: away.color }} /><i style={{ width: `${winProbability.home}%`, background: home.color }} /></div>
          <span>{winProbability.home}%</span>
          <small>{winProbability.label}</small>
        </div>

        <section className="mr-roster-body">
          <div className="mr-section-label">Starters</div>
          <div className="mr-rosters">
            {Array.from({ length: starterCount }, (_, rowIndex) => {
              const awayPlayer = detail?.away.starters[rowIndex];
              const homePlayer = detail?.home.starters[rowIndex];
              const slot = awayPlayer?.slot || homePlayer?.slot || STARTER_SLOTS[rowIndex] || "FLEX";
              return <RosterRow away={awayPlayer} home={homePlayer} slot={slot} empty={!hasPlayers} key={`starter-${rowIndex}`} />;
            })}
          </div>
          <div className="mr-section-label">Bench</div>
          <div className="mr-rosters mr-bench">
            {Array.from({ length: benchCount }, (_, rowIndex) => (
              <RosterRow
                away={detail?.away.bench[rowIndex]}
                home={detail?.home.bench[rowIndex]}
                slot="BE"
                empty={!hasPlayers}
                key={`bench-${rowIndex}`}
              />
            ))}
          </div>
          <footer className="mr-foot">
            {hasPlayers
              ? status === "final"
                ? "Tap any player row to inspect the scoring breakdown."
                : status === "live"
                  ? "Live scoring updates as the platform sync refreshes."
                  : "Set your lineup. Projections remain visible until kickoff."
              : status === "predraft"
                ? "Draft not held yet. Roster slots are reserved."
                : "ESPN/Sleeper player rows will populate here after roster sync."}
          </footer>
        </section>
      </div>
    </div>
  );
}

function TeamHeader({
  team,
  side,
  rank,
  score,
  result,
  showCity,
}: {
  team: Team;
  side: "away" | "home";
  rank: number;
  score?: number;
  result: "win" | "loss" | "open";
  showCity: boolean;
}) {
  return (
    <div className={`mr-team-head ${side}`} style={{ "--team-accent": team.color } as React.CSSProperties}>
      <span className="mr-team-rank">#{rank}</span>
      <EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={52} />
      {showCity && team.city && <small>{team.city}</small>}
      <strong>{team.name}</strong>
      <b className={`mr-team-score score-${result}`}>{score == null ? "-" : formatPoints(score)}</b>
    </div>
  );
}
