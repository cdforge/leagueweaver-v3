"use client";

import * as React from "react";
import { ArrowLeft, CircleAlert, Share2, Star, X } from "lucide-react";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { Modal } from "@/components/ui/Modal";
import { accessibleAccentColor, accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { buildGameDetailVM, type GameDetailPlayerStat, type GameDetailSideVM, type GameDetailSlotVM } from "@/lib/gameDetail";
import { getNflWeekWindow } from "@/lib/schedule";
import { formatPoints } from "@/lib/statistics";
import { teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, ScheduledGame, Team } from "@/lib/types";

const NFL_TEAM_COLORS: Record<string, string> = {
  ARI: "#97233F", ATL: "#A71930", BAL: "#241773", BUF: "#00338D", CAR: "#0085CA", CHI: "#0B162A", CIN: "#FB4F14",
  CLE: "#311D00", DAL: "#003594", DEN: "#FB4F14", DET: "#0076B6", GB: "#203731", HOU: "#03202F", IND: "#002C5F",
  JAX: "#101820", KC: "#E31837", LV: "#000000", LAC: "#0080C6", LAR: "#003594", MIA: "#008E97", MIN: "#4F2683",
  NE: "#002244", NO: "#D3BC8D", NYG: "#0B2265", NYJ: "#125740", PHI: "#004C54", PIT: "#FFB612", SEA: "#002244",
  SF: "#AA0000", TB: "#D50A0A", TEN: "#0C2340", WAS: "#5A1414", WSH: "#5A1414",
};
const NFL_TEAM_SECONDARY_COLORS: Record<string, string> = {
  ARI: "#000000", ATL: "#000000", BAL: "#000000", BUF: "#C60C30", CAR: "#101820", CHI: "#C83803", CIN: "#000000",
  CLE: "#FF3C00", DAL: "#041E42", DEN: "#002244", DET: "#B0B7BC", GB: "#FFB612", HOU: "#A71930", IND: "#A2AAAD",
  JAX: "#D7A22A", KC: "#FFB81C", LV: "#A5ACAF", LAC: "#FFC20E", LAR: "#FFA300", MIA: "#FC4C02", MIN: "#FFC62F",
  NE: "#C60C30", NO: "#101820", NYG: "#A71930", NYJ: "#000000", PHI: "#A5ACAF", PIT: "#101820", SEA: "#69BE28",
  SF: "#B3995D", TB: "#FF7900", TEN: "#4B92DB", WAS: "#FFB612", WSH: "#FFB612",
};
const ESPN_PRO_TEAM_ABBR: Record<string, string> = {
  "0": "FA", "1": "ATL", "2": "BUF", "3": "CHI", "4": "CIN", "5": "CLE", "6": "DAL", "7": "DEN", "8": "DET",
  "9": "GB", "10": "TEN", "11": "IND", "12": "KC", "13": "LV", "14": "LAR", "15": "MIA", "16": "MIN", "17": "NE",
  "18": "NO", "19": "NYG", "20": "NYJ", "21": "PHI", "22": "ARI", "23": "PIT", "24": "LAC", "25": "SF", "26": "SEA",
  "27": "TB", "28": "WSH", "29": "CAR", "30": "JAX", "33": "BAL", "34": "HOU",
};
const NFL_TEAM_CITY: Record<string, string> = {
  ARI: "Arizona", ATL: "Atlanta", BAL: "Baltimore", BUF: "Buffalo", CAR: "Carolina", CHI: "Chicago", CIN: "Cincinnati",
  CLE: "Cleveland", DAL: "Dallas", DEN: "Denver", DET: "Detroit", GB: "Green Bay", HOU: "Houston", IND: "Indianapolis",
  JAX: "Jacksonville", KC: "Kansas City", LV: "Las Vegas", LAC: "LA Chargers", LAR: "LA Rams", MIA: "Miami", MIN: "Minnesota",
  NE: "New England", NO: "New Orleans", NYG: "NY Giants", NYJ: "NY Jets", PHI: "Philadelphia", PIT: "Pittsburgh", SEA: "Seattle",
  SF: "San Francisco", TB: "Tampa Bay", TEN: "Tennessee", WAS: "Washington", WSH: "Washington",
};
type NflModalGame = {
  awayAbbr: string;
  homeAbbr: string;
  kickoffAt?: string;
  status?: "scheduled" | "in_progress" | "final" | "postponed" | "cancelled";
};
type NflMatchupMeta = {
  matchup: string;
  timing: string;
  compactTiming: string;
  status?: NflModalGame["status"];
};
const SLOT_COLORS: Record<string, string> = {
  QB: "#c9457a",
  RB: "#2f9e73",
  WR: "#3f7cc9",
  FLEX: "#7a5bbf",
  TE: "#d0872e",
  "D/ST": "#6c7a86",
  DST: "#6c7a86",
  K: "#8a6fc0",
  HC: "#9a7b52",
  BE: "#8a97a0",
  IR: "#b42318",
  TAXI: "#b7791f",
  RES: "#5f6f68",
};
const STARTER_PLACEHOLDER_SLOTS = ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "D/ST", "K", "HC"];
const BENCH_PLACEHOLDER_SLOTS = ["BE", "BE", "BE", "BE", "BE", "BE"];

function teamDisplay(side: GameDetailSideVM, showCity: boolean) {
  return `${showCity && side.team.city ? `${side.team.city} ` : ""}${side.team.name}`;
}

function shortTeamLabel(team: Team) {
  return teamInitials(team);
}

function weekTeamLabel(team: Team) {
  return team.name || shortTeamLabel(team);
}

function scoreValue(side: GameDetailSideVM) {
  if (side.platformTotal != null) return side.platformTotal;
  if (side.starterTotal != null) return side.starterTotal;
  return null;
}

function scoreLabel(side: GameDetailSideVM, status: string) {
  const value = status === "predraft"
    ? null
    : status === "upcoming"
      ? side.projectedTotal ?? scoreValue(side)
      : scoreValue(side);
  return value == null ? "--" : formatPoints(value);
}

function playerScoreLabel(row: GameDetailSlotVM | undefined, status: string) {
  if (!row) return "--";
  if (status === "predraft") return "--";
  if (status === "upcoming" && row.projected != null) return row.projected.toFixed(1);
  return row.points.toFixed(1);
}

function normalizeNflAbbr(value?: string) {
  const raw = value?.toUpperCase();
  if (!raw) return undefined;
  return ESPN_PRO_TEAM_ABBR[raw] ?? raw;
}

function nflAbbr(row: GameDetailSlotVM) {
  return normalizeNflAbbr(row.nflTeam);
}

function playerDisplayName(row: GameDetailSlotVM) {
  const abbr = nflAbbr(row);
  if ((row.position === "D/ST" || row.position === "DST" || row.slot === "D/ST" || row.slot === "DST") && abbr) return `${NFL_TEAM_CITY[abbr] ?? abbr} D/ST`;
  if ((row.position === "HC" || row.slot === "HC") && abbr) return `${NFL_TEAM_CITY[abbr] ?? abbr} HC`;
  return row.name;
}

function compactPlayerDisplayName(row: GameDetailSlotVM) {
  const display = playerDisplayName(row);
  if (display.includes(" D/ST") || display.includes(" HC")) return display;
  const parts = display.trim().split(/\s+/);
  if (parts.length < 2) return display;
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

function nflOpponentLabel(row: GameDetailSlotVM, nflMatchups: Map<string, NflMatchupMeta>) {
  const abbr = nflAbbr(row);
  return abbr ? nflMatchups.get(abbr)?.matchup : undefined;
}

const nflDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const nflCompactDateFormatter = new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric" });
const nflWeekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const nflTimeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const UPCOMING_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_NUMBER: Record<string, string> = {
  Jan: "1", Feb: "2", Mar: "3", Apr: "4", May: "5", Jun: "6", Jul: "7", Aug: "8", Sep: "9", Oct: "10", Nov: "11", Dec: "12",
};

function compactWeekDateLabel(label: string) {
  const trimmed = label.replace(/,?\s*\d{4}/, "").trim();
  const rangeMatch = /^([A-Za-z]{3})\s+(\d{1,2})[–-](?:(\w{3})\s+)?(\d{1,2})$/.exec(trimmed);
  if (rangeMatch) {
    const [, startMonth, startDay, endMonthRaw, endDay] = rangeMatch;
    const startMonthNumber = MONTH_NUMBER[startMonth] ?? startMonth;
    const endMonthNumber = MONTH_NUMBER[endMonthRaw || startMonth] ?? endMonthRaw ?? startMonthNumber;
    return `${startMonthNumber}/${startDay}–${endMonthNumber}/${endDay}`;
  }
  const singleMatch = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(trimmed);
  if (singleMatch) return `${MONTH_NUMBER[singleMatch[1]] ?? singleMatch[1]}/${singleMatch[2]}`;
  return trimmed;
}

function nflTimingLabel(game: NflModalGame) {
  if (game.status === "final") return { full: "Final", compact: "Final" };
  if (game.status === "in_progress") return { full: "Live", compact: "Live" };
  if (game.status === "postponed") return { full: "Postponed", compact: "Postponed" };
  if (game.status === "cancelled") return { full: "Cancelled", compact: "Cancelled" };
  if (!game.kickoffAt) return { full: "", compact: "" };
  const kickoff = new Date(game.kickoffAt);
  if (Number.isNaN(kickoff.getTime())) return { full: "", compact: "" };
  const startsIn = kickoff.getTime() - Date.now();
  const dateLabel = startsIn >= 0 && startsIn <= UPCOMING_WEEK_MS
    ? nflWeekdayFormatter.format(kickoff)
    : nflDateFormatter.format(kickoff);
  const timeLabel = nflTimeFormatter.format(kickoff);
  return {
    full: `${dateLabel} · ${timeLabel}`,
    compact: `${nflCompactDateFormatter.format(kickoff)} · ${timeLabel}`,
  };
}

function playerMetaParts(row: GameDetailSlotVM, nflMatchups: Map<string, NflMatchupMeta>) {
  const abbr = nflAbbr(row);
  const meta = abbr ? nflMatchups.get(abbr) : undefined;
  const matchup = meta?.matchup;
  const timing = meta?.timing;
  const compactTiming = meta?.compactTiming;
  const matchupText = abbr && matchup?.startsWith(abbr)
    ? matchup.slice(abbr.length).trimStart()
    : abbr
      ? `· ${row.position}`
      : row.position;
  if (abbr && matchup?.startsWith(abbr)) return {
    team: abbr,
    matchupText,
    timing,
    compactTiming,
    timingStatus: meta?.status,
    text: [matchupText, timing].filter(Boolean).join(" · "),
    compactText: [matchupText, compactTiming].filter(Boolean).join(" · "),
  };
  return {
    team: abbr ?? "",
    matchupText,
    timing,
    compactTiming,
    timingStatus: meta?.status,
    text: [matchupText, timing].filter(Boolean).join(" · "),
    compactText: [matchupText, compactTiming].filter(Boolean).join(" · "),
  };
}

function playerMetaText(row: GameDetailSlotVM, nflMatchups: Map<string, NflMatchupMeta>) {
  const parts = playerMetaParts(row, nflMatchups);
  return `${parts.team}${parts.text ? ` ${parts.text}` : ""}`.trim();
}

function playerAccent(row?: GameDetailSlotVM) {
  const abbr = row ? nflAbbr(row) : undefined;
  return abbr ? NFL_TEAM_COLORS[abbr] : undefined;
}

function playerSecondaryAccent(row?: GameDetailSlotVM) {
  const abbr = row ? nflAbbr(row) : undefined;
  return abbr ? NFL_TEAM_SECONDARY_COLORS[abbr] : undefined;
}

function playerTokenStyle(row?: GameDetailSlotVM) {
  const primary = playerAccent(row);
  const secondary = playerSecondaryAccent(row);
  if (!primary) return { background: "var(--strength-bg)", color: "var(--muted)" } as React.CSSProperties;
  return {
    background: secondary ? `linear-gradient(135deg, ${primary} 0 50%, ${secondary} 50% 100%)` : primary,
    color: readableTextColor(primary),
  } as React.CSSProperties;
}

function nflTextStyle(row?: GameDetailSlotVM) {
  const primary = playerAccent(row);
  return primary ? {
    "--nfl-meta": accessibleTeamColor(primary),
    "--nfl-meta-dark": accessibleAccentColor(primary, "#0b0f0d"),
  } as React.CSSProperties : undefined;
}

function PlayerMeta({ row, nflMatchups }: { row: GameDetailSlotVM; nflMatchups: Map<string, NflMatchupMeta> }) {
  const parts = playerMetaParts(row, nflMatchups);
  const timingTone = parts.timingStatus === "final" ? "is-final" : parts.timingStatus === "in_progress" ? "is-live" : "";
  const timingIsState = Boolean(timingTone) || parts.timingStatus === "postponed" || parts.timingStatus === "cancelled";
  const renderTiming = (label?: string) => {
    if (!label) return null;
    return timingIsState ? <i className={timingTone}>{label}</i> : <span className="gdm-meta-time">{label}</span>;
  };
  const fullTiming = renderTiming(parts.timing);
  const compactTiming = renderTiming(parts.compactTiming || parts.timing);
  return <small className="gdm-player-meta">
    {parts.team && <b style={nflTextStyle(row)}>{parts.team}</b>}
    {parts.matchupText && <span>
      <span className="gdm-meta-full"><span>{parts.matchupText}</span>{fullTiming}</span>
      <span className="gdm-meta-compact"><span>{parts.matchupText}</span>{compactTiming}</span>
    </span>}
  </small>;
}

function slotColor(slot: string) {
  return SLOT_COLORS[slot.toUpperCase()] ?? "#607069";
}

function slotStyle(slot: string) {
  const color = slotColor(slot);
  return {
    "--slot": color,
    "--slot-ink": readableTextColor(color),
    "--slot-ink-dark": accessibleAccentColor(color, "#0b0f0d"),
  } as React.CSSProperties;
}

function reserveSlotLabel(row?: GameDetailSlotVM) {
  if (!row) return "RES";
  if (row.lineupStatus === "ir") return "IR";
  if (row.lineupStatus === "taxi") return "TAXI";
  return "RES";
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
        <b>
          <EntityLogo color={away.color} logoUrl={away.logoUrl} monogram={teamInitials(away)} size={18} imagePresentation="bare" />
          <strong>{weekTeamLabel(away)}</strong>
          <em className={awayWin ? "is-winner" : ""}>{game.awayScore == null ? "--" : formatPoints(game.awayScore)}</em>
        </b>
        <b>
          <EntityLogo color={home.color} logoUrl={home.logoUrl} monogram={teamInitials(home)} size={18} imagePresentation="bare" />
          <strong>{weekTeamLabel(home)}</strong>
          <em className={homeWin ? "is-winner" : ""}>{game.homeScore == null ? "--" : formatPoints(game.homeScore)}</em>
        </b>
      </button>;
    })}
  </div>;
}

function TeamHeader({ side, align, showCity, status, won }: { side: GameDetailSideVM; align: "away" | "home"; showCity: boolean; status: string; won: boolean }) {
  const score = status === "upcoming" ? side.projectedTotal ?? scoreValue(side) : scoreValue(side);
  const teamInk = accessibleTeamColor(side.team.color);
  const rankColor = accessibleTeamColor(side.team.color);
  const rankInk = readableTextColor(rankColor);
  const divisionColor = side.division?.color ?? side.team.color;
  return <section className={`gdm-team-head ${align}`} style={{ "--team": side.team.color, "--team-ink": teamInk, "--rank-bg": rankColor, "--rank-ink": rankInk } as React.CSSProperties}>
    <EntityLogo className="gdm-team-watermark" color={side.team.color} logoUrl={side.team.logoUrl} monogram={teamInitials(side.team)} size={148} imagePresentation="bare" />
    <EntityLogo color={side.team.color} logoUrl={side.team.logoUrl} monogram={teamInitials(side.team)} size={56} imagePresentation="bare" />
    <span className="gdm-team-title-row">
      <b className="gdm-rank-circle" title={`Rank ${side.rank}`}>#{side.rank}</b>
      <span className="gdm-team-title-copy">
        {showCity && side.team.city && <small className="gdm-team-city"><span className="gdm-label-full">{side.team.city}</span><span className="gdm-label-compact">{shortTeamLabel(side.team)}</span></small>}
        <strong><span className="gdm-label-full">{side.team.name}</span><span className="gdm-label-compact">{shortTeamLabel(side.team)}</span></strong>
      </span>
    </span>
    <span className="gdm-team-record" aria-label={`${teamDisplay(side, showCity)} record entering this matchup`}>
      <b>{side.overallRecord}</b>
      <small style={{ "--division-record": divisionColor, "--division-record-ink": readableTextColor(divisionColor) } as React.CSSProperties}>{side.division && <DivisionMark division={side.division} />}<span>{side.divisionRecord}</span></small>
    </span>
    <span className={`gdm-team-score ${won ? "is-win" : ""} ${status === "upcoming" ? "is-proj" : ""}`}>{scoreLabel(side, status)}</span>
  </section>;
}

function CenterStatus({ stateLabel, rating, gameLabel, compactGameLabel, featured, status }: { stateLabel: string; rating: number; gameLabel: string; compactGameLabel: string; featured: boolean; status: string }) {
  const bars = Math.max(1, Math.min(3, Math.round(rating / 3.4)));
  return <section className="gdm-center-status">
    <b>@</b>
    <strong className={`is-${status}`}>{stateLabel}</strong>
    <span className={featured ? "is-featured" : ""}>{featured ? <><Star fill="currentColor" /> GOTW</> : <><span className="gdm-game-label-full">{gameLabel}</span><span className="gdm-game-label-compact">{compactGameLabel}</span></>}</span>
    <em>{rating.toFixed(1)}</em>
    <i>{[1, 2, 3].map((bar) => <span className={bar <= bars ? "on" : ""} key={bar} />)}</i>
  </section>;
}

function PlayerCell({
  row,
  side,
  expanded,
  onToggle,
  status,
  nflMatchups,
}: {
  row?: GameDetailSlotVM;
  side: "away" | "home";
  expanded: boolean;
  onToggle: () => void;
  status: string;
  nflMatchups: Map<string, NflMatchupMeta>;
}) {
  if (!row) return <div className={`gdm-player-cell ${side} is-empty`}>
    {side === "home" && <span className="gdm-player-points"><strong>--</strong><small>--</small></span>}
    {side === "away" && <span className="gdm-nfl-token is-empty-token" aria-hidden="true" />}
    <span className="gdm-player-text"><strong>Empty</strong><small>---</small></span>
    {side === "away" && <span className="gdm-player-points"><strong>--</strong><small>--</small></span>}
    {side === "home" && <span className="gdm-nfl-token is-empty-token" aria-hidden="true" />}
  </div>;
  return <button type="button" className={`gdm-player-cell ${side} ${expanded ? "is-expanded" : ""}`} onClick={onToggle} aria-expanded={expanded}>
    {side === "away" && <span className="gdm-nfl-token" style={playerTokenStyle(row)} aria-hidden="true" />}
    {side === "home" && <span className="gdm-player-points"><strong>{playerScoreLabel(row, status)}</strong>{row.projected != null && <small>{status === "upcoming" ? "PROJ" : row.projected.toFixed(1)}</small>}</span>}
    <span className="gdm-player-text">
      <strong><span className="gdm-label-full">{playerDisplayName(row)}</span><span className="gdm-label-compact">{compactPlayerDisplayName(row)}</span></strong>
      <PlayerMeta row={row} nflMatchups={nflMatchups} />
    </span>
    {side === "away" && <span className="gdm-player-points"><strong>{playerScoreLabel(row, status)}</strong>{row.projected != null && <small>{status === "upcoming" ? "PROJ" : row.projected.toFixed(1)}</small>}</span>}
    {side === "home" && <span className="gdm-nfl-token" style={playerTokenStyle(row)} aria-hidden="true" />}
  </button>;
}

function PlayerDetail({ row, nflMatchups, status, side }: { row: GameDetailSlotVM; nflMatchups: Map<string, NflMatchupMeta>; status: string; side: "away" | "home" }) {
  const parts = playerMetaParts(row, nflMatchups);
  const abbr = nflAbbr(row);
  const projected = row.projected == null ? "--" : row.projected.toFixed(1);
  const actual = playerScoreLabel(row, status);
  const difference = row.projected == null ? null : row.points - row.projected;
  const differenceLabel = difference == null ? "No projection" : `${difference >= 0 ? "+" : ""}${difference.toFixed(1)} vs proj`;
  const kickoff = parts.compactTiming || parts.timing || "kickoff";
  const metaText = [row.position, abbr].filter(Boolean).join(" · ");
  const upcomingCopy = `Projected ${projected} pts · kickoff ${kickoff}.`;
  return <div className={`gdm-player-detail ${side}`}>
    <header className="gdm-player-detail-head">
      {side === "away" && <span className="gdm-nfl-token" style={playerTokenStyle(row)} aria-hidden="true" />}
      {side === "home" && <span className="gdm-player-detail-score"><b>{actual}</b><small>PTS</small></span>}
      <span>
        <strong><span className="gdm-label-full">{playerDisplayName(row)}</span><span className="gdm-label-compact">{compactPlayerDisplayName(row)}</span></strong>
        <small>{metaText}</small>
      </span>
      {side === "away" && <span className="gdm-player-detail-score"><b>{actual}</b><small>PTS</small></span>}
      {side === "home" && <span className="gdm-nfl-token" style={playerTokenStyle(row)} aria-hidden="true" />}
    </header>
    <div className="gdm-player-detail-metrics">
      <span><small>Actual</small><b>{actual}</b></span>
      <span><small>Projected</small><b>{projected}</b></span>
      <span><small>Difference</small><b className={difference == null ? "" : difference >= 0 ? "is-pos" : "is-neg"}>{differenceLabel}</b></span>
    </div>
    {status === "upcoming" || status === "predraft"
      ? <p>{upcomingCopy}<br />Scoring fills in live once {abbr || "this player"} plays.</p>
      : row.statDetails?.length
        ? <>
          <ul>
            {row.statDetails.slice(0, 8).map((stat) => <li key={`${stat.raw}:${stat.points}`}>
              <span className="gdm-detail-raw">{stat.raw}</span>
              <span className="gdm-detail-label">{stat.label}</span>
              <b className={stat.points >= 0 ? "is-pos" : "is-neg"}>{stat.points >= 0 ? "+" : ""}{stat.points.toFixed(1)}</b>
            </li>)}
          </ul>
          <div className="gdm-player-detail-total"><span>Total</span><b>{row.points.toFixed(1)}</b></div>
        </>
        : <p>No box-score stats — {row.points.toFixed(1)} pts</p>}
  </div>;
}

function RosterPairRows({
  away,
  home,
  type,
  status,
  nflMatchups,
  placeholderSlots,
}: {
  away: GameDetailSlotVM[];
  home: GameDetailSlotVM[];
  type: "starters" | "bench" | "reserve";
  status: string;
  nflMatchups: Map<string, NflMatchupMeta>;
  placeholderSlots?: string[];
}) {
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const rows = Array.from({ length: Math.max(away.length, home.length, placeholderSlots?.length ?? 0) }, (_, index) => ({ away: away[index], home: home[index], index }));
  return <div className={`gdm-roster-pairs ${type === "bench" ? "is-bench" : ""} ${type === "reserve" ? "is-reserve" : ""}`}>
    {rows.map(({ away: awayRow, home: homeRow, index }) => {
      const slot = type === "bench" ? "BE" : type === "reserve" ? reserveSlotLabel(awayRow ?? homeRow) : awayRow?.slot || homeRow?.slot || placeholderSlots?.[index] || "--";
      const awayOpen = openKey === awayRow?.key;
      const homeOpen = openKey === homeRow?.key;
      return <React.Fragment key={`${type}:${index}`}>
        <div className="gdm-pair-row">
          <PlayerCell row={awayRow} side="away" expanded={awayOpen} status={status} nflMatchups={nflMatchups} onToggle={() => awayRow && setOpenKey(awayOpen ? null : awayRow.key)} />
          <span className="gdm-slot-center" style={slotStyle(slot)} aria-label={`Roster slot ${slot}`}>{slot}</span>
          <PlayerCell row={homeRow} side="home" expanded={homeOpen} status={status} nflMatchups={nflMatchups} onToggle={() => homeRow && setOpenKey(homeOpen ? null : homeRow.key)} />
        </div>
        {awayOpen && awayRow && <PlayerDetail row={awayRow} nflMatchups={nflMatchups} status={status} side="away" />}
        {homeOpen && homeRow && <PlayerDetail row={homeRow} nflMatchups={nflMatchups} status={status} side="home" />}
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
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [nflGames, setNflGames] = React.useState<NflModalGame[]>([]);

  React.useEffect(() => {
    setIsCollapsed(false);
  }, [gameId]);

  React.useEffect(() => {
    if (!vm) {
      setNflGames([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/nfl-week?seasonYear=${vm.season}&week=${vm.weekNumber}`)
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { games?: NflModalGame[] } | null) => {
        if (!cancelled) setNflGames(Array.isArray(payload?.games) ? payload.games : []);
      })
      .catch(() => {
        if (!cancelled) setNflGames([]);
      });
    return () => { cancelled = true; };
  }, [vm?.season, vm?.weekNumber]);
  const nflMatchups = React.useMemo(() => {
    const map = new Map<string, NflMatchupMeta>();
    for (const game of nflGames) {
      if (game.awayAbbr && game.homeAbbr) {
        const away = game.awayAbbr.toUpperCase();
        const home = game.homeAbbr.toUpperCase();
        const timing = nflTimingLabel(game);
        map.set(away, { matchup: `${away} @ ${home}`, timing: timing.full, compactTiming: timing.compact, status: game.status });
        map.set(home, { matchup: `${home} vs ${away}`, timing: timing.full, compactTiming: timing.compact, status: game.status });
      }
    }
    return map;
  }, [nflGames]);
  const reserveFutureRoster = React.useMemo(() => {
    if (!vm || vm.isPlayoff) return false;
    const weekWindow = getNflWeekWindow(vm.season, vm.weekNumber);
    const weekStart = Date.parse(weekWindow.startsAt);
    const weekStartsLater = Number.isFinite(weekStart) && Date.now() < weekStart;
    const nflHasStarted = nflGames.some((game) => game.status === "in_progress" || game.status === "final");
    const nflHasScheduledGames = nflGames.some((game) => game.status === "scheduled");
    return !nflHasStarted && (weekStartsLater || nflHasScheduledGames);
  }, [nflGames, vm?.isPlayoff, vm?.season, vm?.weekNumber]);

  if (!vm) return null;
  const displayStatus = reserveFutureRoster ? "predraft" : vm.status;
  const showCity = schedule.setup.display?.cityNames !== false;
  const stateLabel = displayStatus === "final" ? "Final" : displayStatus === "live" ? "Live" : displayStatus === "predraft" ? "Pre-Draft" : "Upcoming";
  const contextLabel = vm.isPlayoff ? vm.playoffLabel || "Playoffs" : `Week ${vm.weekNumber}`;
  const compactContextLabel = vm.isPlayoff ? vm.playoffLabel || "Playoffs" : `WK ${vm.weekNumber}`;
  const compactDateLabel = compactWeekDateLabel(vm.dateLabel);
  const isBroadcast = vm.featured;
  const gameLabel = isBroadcast ? "Game of the Week" : vm.game.gameNumber ? `Game ${vm.game.gameNumber}` : "Matchup";
  const compactGameLabel = isBroadcast ? "GOTW" : vm.game.gameNumber ? `G${vm.game.gameNumber}` : "Game";
  const slateGames = navigation?.games ?? schedule.weeks.find((week) => week.weekNumber === vm.weekNumber)?.games ?? [vm.game];
  const awayScore = scoreValue(vm.away);
  const homeScore = scoreValue(vm.home);
  const awayWon = displayStatus === "final" && awayScore != null && homeScore != null && awayScore > homeScore;
  const homeWon = displayStatus === "final" && awayScore != null && homeScore != null && homeScore > awayScore;
  const displayedWinProbability = reserveFutureRoster ? undefined : winProbability
    ? winProbability
    : displayStatus === "final" && awayScore != null && homeScore != null && awayScore !== homeScore
      ? { away: awayWon ? 1 : 0, home: homeWon ? 1 : 0 }
      : undefined;
  const awayProbability = displayedWinProbability ? Math.round(displayedWinProbability.away * 100) : 0;
  const homeProbability = displayedWinProbability ? Math.round(displayedWinProbability.home * 100) : 0;
  const probabilityMarker = awayProbability === homeProbability
    ? { color: schedule.setup.color, logoUrl: schedule.setup.logoUrl, monogram: schedule.setup.abbreviation || schedule.setup.initials || "LW", label: "Even probability marker" }
    : awayProbability > homeProbability
      ? { color: vm.away.team.color, logoUrl: vm.away.team.logoUrl, monogram: teamInitials(vm.away.team), label: `${teamDisplay(vm.away, showCity)} probability marker` }
      : { color: vm.home.team.color, logoUrl: vm.home.team.logoUrl, monogram: teamInitials(vm.home.team), label: `${teamDisplay(vm.home, showCity)} probability marker` };
  const winProbabilityLabel = displayStatus === "final"
    ? "Final"
    : displayStatus === "live"
      ? "Live Win Probability"
      : "Projected Win Probability";
  const starterRows = reserveFutureRoster ? { away: [], home: [] } : { away: vm.away.starters, home: vm.home.starters };
  const benchRows = reserveFutureRoster ? { away: [], home: [] } : { away: vm.away.bench, home: vm.home.bench };
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
  const handleBodyScroll = (event: React.UIEvent<HTMLElement>) => {
    const nextCollapsed = event.currentTarget.scrollTop > 18;
    setIsCollapsed((current) => current === nextCollapsed ? current : nextCollapsed);
  };

  return <Modal
    className={`game-detail-modal st-${displayStatus} ${isBroadcast ? "is-broadcast" : ""}`}
    backdropClassName="game-detail-modal-backdrop"
    labelledBy="game-detail-title"
    onClose={onClose}
  >
    <div
      className={`gdm-content ${isCollapsed ? "is-collapsed" : ""}`}
      onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={handleTouchEnd}
    >
      <header className="gdm-appbar">
        <button type="button" className="gdm-icon-button" aria-label="Back to schedule" onClick={onClose}><ArrowLeft /></button>
        <strong id="game-detail-title">Matchup</strong>
        <button type="button" className="gdm-icon-button" aria-label="Share matchup"><Share2 /></button>
        <button type="button" className="gdm-close" aria-label="Close game detail" onClick={onClose}><X /></button>
      </header>
      <div className="gdm-beta-strip" role="note" aria-label="Beta feature notice">
        <CircleAlert />
        <span><strong>Beta</strong> Game details are still being improved, especially player-level and historical context.</span>
      </div>
      <WeekStrip schedule={schedule} currentGameId={gameId} games={slateGames} onSelect={navigation?.onSelect} />
      {isBroadcast && <div className="gdm-gotw-band"><Star fill="currentColor" /> Game of the Week <Star fill="currentColor" /></div>}
      <div className="gdm-eyebrow">
        <span className="gdm-eyebrow-context"><span className="gdm-eyebrow-full">{contextLabel}</span><span className="gdm-eyebrow-compact">{compactContextLabel}</span></span><span>·</span>
        <span className="gdm-eyebrow-date"><span className="gdm-eyebrow-full">{vm.dateLabel}</span><span className="gdm-eyebrow-compact">{compactDateLabel}</span></span><span>·</span>
        <EntityLogo className="gdm-venue-logo" color={vm.home.team.color} logoUrl={vm.home.team.logoUrl} monogram={teamInitials(vm.home.team)} size={24} imagePresentation="bare" />
        {vm.stadium}
      </div>
      <div className="gdm-matchup-head">
        <TeamHeader side={vm.away} align="away" showCity={showCity} status={displayStatus} won={awayWon} />
        <CenterStatus stateLabel={stateLabel} rating={vm.ratingScore10} gameLabel={gameLabel} compactGameLabel={compactGameLabel} featured={isBroadcast} status={displayStatus} />
        <TeamHeader side={vm.home} align="home" showCity={showCity} status={displayStatus} won={homeWon} />
      </div>
      {displayedWinProbability && <div
        className="gdm-winbar"
        aria-label={`${winProbabilityLabel}: ${teamDisplay(vm.away, showCity)} ${awayProbability} percent, ${teamDisplay(vm.home, showCity)} ${homeProbability} percent.`}
      >
        <b className="is-away" style={{ "--pct-bg": accessibleTeamColor(vm.away.team.color), "--pct-ink": readableTextColor(accessibleTeamColor(vm.away.team.color)) } as React.CSSProperties}>{awayProbability}%</b>
        <span style={{ "--away-pct": `${awayProbability}%`, "--home-pct": `${homeProbability}%`, "--away": vm.away.team.color, "--home": vm.home.team.color, "--marker": `${awayProbability}%` } as React.CSSProperties}>
          <i className="gdm-winbar-away" />
          <i className="gdm-winbar-home" />
          <span className="gdm-winbar-marker" title={probabilityMarker.label}>
            <EntityLogo color={probabilityMarker.color} logoUrl={probabilityMarker.logoUrl} monogram={probabilityMarker.monogram} size={28} imagePresentation="bare" />
          </span>
        </span>
        <b className="is-home" style={{ "--pct-bg": accessibleTeamColor(vm.home.team.color), "--pct-ink": readableTextColor(accessibleTeamColor(vm.home.team.color)) } as React.CSSProperties}>{homeProbability}%</b>
        <small>{winProbabilityLabel}</small>
      </div>}
      {vm.unsynced && <div className="gdm-unsynced" role="status">Roster details appear after ESPN or Sleeper player data syncs.</div>}
      <main className="gdm-body" onScroll={handleBodyScroll}>
        <h3>Starters</h3>
        <RosterPairRows away={starterRows.away} home={starterRows.home} type="starters" status={displayStatus} nflMatchups={nflMatchups} placeholderSlots={reserveFutureRoster ? STARTER_PLACEHOLDER_SLOTS : undefined} />
        <h3>Bench</h3>
        <RosterPairRows away={benchRows.away} home={benchRows.home} type="bench" status={displayStatus} nflMatchups={nflMatchups} placeholderSlots={reserveFutureRoster ? BENCH_PLACEHOLDER_SLOTS : undefined} />
        {!reserveFutureRoster && (vm.away.reserves.length > 0 || vm.home.reserves.length > 0) && <>
          <h3>IR / Reserve</h3>
          <RosterPairRows away={vm.away.reserves} home={vm.home.reserves} type="reserve" status={displayStatus} nflMatchups={nflMatchups} />
        </>}
        <footer>{displayStatus === "final" ? "Tap any player to see how their points were scored" : displayStatus === "predraft" ? "Draft not held yet · roster slots reserved" : displayStatus === "live" ? "Live scoring · tap a player for scoring detail" : "Projected roster view until this matchup is final"}</footer>
      </main>
    </div>
  </Modal>;
}
