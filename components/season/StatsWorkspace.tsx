"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Flame,
  Gauge,
  Home,
  LockKeyhole,
  MapPin,
  Medal,
  Minus,
  Plane,
  ShieldCheck,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";
import { ClinchBadges, ClinchStatusLegend } from "@/components/season/ClinchBadges";
import { GameBadgeChip } from "@/components/season/MatchupPresentation";
import { DivisionIdentity } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { getTeamClinchTimelines } from "@/lib/clinch";
import { accessibleTeamColor, tintColor } from "@/lib/colorContrast";
import { divisionAcronym, leagueAcronym, resolveInitials } from "@/lib/monograms";
import { calculateSeasonOdds } from "@/lib/simulator";
import { formatRecord, getLiveRankHistory } from "@/lib/standings";
import {
  calculateGameAnalytics,
  calculateTeamSeasonStats,
  formatSplitRecord,
  getScheduleGameSignals,
  recordGames,
  recordPercentage,
  type GameAnalytics,
  type TeamSeasonStats,
} from "@/lib/statistics";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, PlayoffGame, RankedStandingsRow, RankHistorySnapshot, Team } from "@/lib/types";

type StatsTab = "standings" | "rank-race" | "team-leaders" | "league-leaders" | "playoffs" | "team-stats";
type TeamSortKey = "team" | "record" | "winPercentage" | "division" | "pointsFor" | "pointsAgainst" | "difference" | "home" | "away" | "featuredWins" | "sov" | "sos" | "streak" | "playoff";
type RaceMetric = "rank" | "pointsFor" | "pointDifference" | "winPercentage";
type ActiveRacePoint = { teamId: string; pointIndex: number } | null;
type LeagueLeaderView = "overall" | "gotw" | "closest" | "scoring" | "divisional";

const RACE_METRIC_OPTIONS: SelectOption[] = [
  { value: "rank", label: "Live rank", description: "Weekly standings position" },
  { value: "pointsFor", label: "Points scored", description: "Cumulative top-scoring race" },
  { value: "pointDifference", label: "Point differential", description: "Points for minus points against" },
  { value: "winPercentage", label: "Win percentage", description: "Weekly standings pace" },
];

const MEDAL_LABELS = ["Gold", "Silver", "Bronze"] as const;

function percentage(value: number) {
  return `${Math.round(value * 100)}%`;
}

function compactProjectedRecord(record: string) {
  return record.split("-").map((value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value;
  }).join("-");
}

function decimal(value: number | null) {
  return value == null ? "—" : value.toFixed(3).replace(/^0/, "");
}

function competitionPodium(rows: TeamSeasonStats[], getValue: (row: TeamSeasonStats) => number | null) {
  const sorted = rows.filter((row) => getValue(row) != null).sort((left, right) => getValue(right)! - getValue(left)! || left.teamId.localeCompare(right.teamId));
  const groups = new Map<number, TeamSeasonStats[]>();
  let prior: number | undefined;
  let rank = 0;
  sorted.forEach((row, index) => {
    const value = getValue(row)!;
    if (prior === undefined || value !== prior) rank = index + 1;
    if (rank <= 3) groups.set(rank, [...(groups.get(rank) ?? []), row]);
    prior = value;
  });
  return [1, 2, 3].map((podiumRank) => ({ rank: podiumRank, rows: groups.get(podiumRank) ?? [] }));
}

function TeamPodiumCard({ title, icon: Icon, rows, teamById, value, label, hrefBase }: {
  title: string;
  icon: LucideIcon;
  rows: TeamSeasonStats[];
  teamById: Map<string, Team>;
  value: (row: TeamSeasonStats) => number | null;
  label: (row: TeamSeasonStats) => string;
  hrefBase: string;
}) {
  const podium = competitionPodium(rows, value);
  const hasResults = podium.some((place) => place.rows.length);
  return <article className="team-podium-card">
    <header><Icon /><strong>{title}</strong></header>
    {hasResults ? <div className="podium-columns">{podium.map((place) => <section className={`podium-place medal-${place.rank}`} key={place.rank}>
      <span className="medal-pill"><Medal />{MEDAL_LABELS[place.rank - 1]}</span>
      <div>{place.rows.length ? place.rows.map((row) => { const team = teamById.get(row.teamId)!; return <Link href={`${hrefBase}/${team.id}`} key={team.id}><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={34} /><span>{team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong><small>{label(row)}</small></span></Link>; }) : <span className="podium-empty">—</span>}</div>
    </section>)}</div> : <div className="leader-empty">No completed results yet</div>}
  </article>;
}

function categoryRanks(items: GameAnalytics[], metric: "qualityScore" | "margin" | "total", direction: "asc" | "desc") {
  const sorted = [...items].sort((left, right) => {
    const difference = left[metric] - right[metric];
    return (direction === "asc" ? difference : -difference) || left.game.id.localeCompare(right.game.id);
  });
  const ranked: Array<{ item: GameAnalytics; rank: number }> = [];
  let prior: number | undefined;
  let rank = 0;
  sorted.forEach((item, index) => {
    const current = item[metric];
    if (prior === undefined || current !== prior) rank = index + 1;
    if (rank <= 3) ranked.push({ item, rank });
    prior = current;
  });
  return ranked;
}

function GameHighlight({ schedule, analytics, rank, round, roundLogoUrl, deepLink }: { schedule: GeneratedSchedule; analytics: GameAnalytics; rank: number; round?: string; roundLogoUrl?: string; deepLink: string }) {
  const game = analytics.game;
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const away = teamById.get(game.awayTeamId)!;
  const home = teamById.get(game.homeTeamId)!;
  const awayWon = game.awayScore! > game.homeScore!;
  const homeWon = game.homeScore! > game.awayScore!;
  return <div className="game-highlight">
    <div className="game-highlight-head"><span className={`medal-pill medal-${rank}`}><Medal />{MEDAL_LABELS[rank - 1]}</span><span className="game-badge-row">{analytics.badges.map((badge) => <GameBadgeChip badge={badge} key={badge} />)}</span></div>
    <div className="game-highlight-sides">
      <span className="game-highlight-team" style={{ background: tintColor(away.color, .88), color: accessibleTeamColor(away.color) }}><EntityLogo color={away.color} logoUrl={away.logoUrl} monogram={teamInitials(away)} size={34} /><span><small className="team-city">{away.city}</small><strong>{away.name}</strong></span>{awayWon && <em>W</em>}<b>{game.awayScore}</b></span>
      <span className="game-highlight-separator">{roundLogoUrl ? <img src={roundLogoUrl} alt="" /> : round ? <EntityLogo color={schedule.setup.playoffs.color} logoUrl={schedule.setup.playoffs.logoUrl} monogram="PO" size={32} /> : "@"}</span>
      <span className="game-highlight-team" style={{ background: tintColor(home.color, .88), color: accessibleTeamColor(home.color) }}><EntityLogo color={home.color} logoUrl={home.logoUrl} monogram={teamInitials(home)} size={34} /><span><small className="team-city">{home.city}</small><strong>{home.name}</strong></span>{homeWon && <em>W</em>}<b>{game.homeScore}</b></span>
    </div>
    <div className="game-stat-chips"><span>Margin <strong>{analytics.margin}</strong><small>#{analytics.marginRank}</small></span><span>Total <strong>{analytics.total}</strong><small>#{analytics.totalRank}</small></span><span>Quality <strong>{analytics.qualityScore}</strong><small>#{analytics.qualityRank}</small></span></div>
    <footer><span><MapPin />{home.logoUrl && <img src={home.logoUrl} alt="" />}<strong>{game.stadium}</strong></span><span>{round || `Week ${game.week}`}{game.specialEvent ? ` · ${game.specialEvent}` : ""}</span><Link href={deepLink}>Open game</Link></footer>
  </div>;
}

function GameHighlightPanel({ title, schedule, items, metric, direction, playoff = false }: { title: string; schedule: GeneratedSchedule; items: GameAnalytics[]; metric: "qualityScore" | "margin" | "total"; direction: "asc" | "desc"; playoff?: boolean }) {
  const ranked = categoryRanks(items, metric, direction);
  return <article className="game-leader-panel"><header><Trophy /><strong>{title}</strong></header>{ranked.length ? <div>{ranked.map(({ item, rank }) => {
    const game = item.game as PlayoffGame;
    const deepLink = playoff ? `/season/${schedule.id}?view=playoffs#${game.id}` : `/season/${schedule.id}?week=${game.week}#${game.id}`;
    return <GameHighlight schedule={schedule} analytics={item} rank={rank} round={playoff ? game.round : undefined} roundLogoUrl={playoff ? game.roundLogoUrl : undefined} deepLink={deepLink} key={item.game.id} />;
  })}</div> : <div className="leader-empty">No completed results yet</div>}</article>;
}

function SortHeader({ label, sortKey, active, direction, onSort }: { label: string; sortKey: TeamSortKey; active: TeamSortKey; direction: "asc" | "desc"; onSort: (key: TeamSortKey) => void }) {
  return <th aria-sort={active === sortKey ? direction === "asc" ? "ascending" : "descending" : "none"}><button type="button" onClick={() => onSort(sortKey)}>{label}<ArrowUpDown /></button></th>;
}

function RankMovement({ row }: { row: RankedStandingsRow }) {
  const direction = row.rankChange > 0 ? "up" : row.rankChange < 0 ? "down" : "even";
  const change = Math.abs(row.rankChange);
  const label = direction === "up" ? `Up ${change}` : direction === "down" ? `Down ${change}` : "No change";
  return <span className="rank-movement"><strong>{row.rank}</strong><small className={direction} aria-label={label}>{direction === "up" ? <ArrowUp /> : direction === "down" ? <ArrowDown /> : <Minus />}{change || ""}</small></span>;
}

function formatRaceValue(metric: RaceMetric, value: number) {
  if (metric === "rank") return `#${Math.round(value)}`;
  if (metric === "winPercentage") return `${Math.round(value * 100)}%`;
  if (metric === "pointDifference") return `${value >= 0 ? "+" : ""}${Math.round(value)}`;
  return Math.round(value).toLocaleString("en-US");
}

function formatRaceMovement(metric: RaceMetric, value: number, previousValue?: number) {
  if (previousValue == null) return metric === "rank" ? "Starting seed" : "Season start";
  const change = metric === "rank" ? previousValue - value : value - previousValue;
  if (Math.abs(change) < .001) return "No change";
  if (metric === "rank") return `${change > 0 ? "Up" : "Down"} ${Math.abs(Math.round(change))} from prior week`;
  if (metric === "winPercentage") return `${change > 0 ? "Up" : "Down"} ${Math.abs(Math.round(change * 100))} points`;
  const formattedChange = Math.abs(Math.round(change)).toLocaleString("en-US");
  return `${change > 0 ? "+" : "-"}${formattedChange} from prior week`;
}

function SeasonRaceChart({ schedule, history, throughWeek, divisionId }: {
  schedule: GeneratedSchedule;
  history: RankHistorySnapshot[];
  throughWeek: number;
  divisionId: string;
}) {
  const [metric, setMetric] = useState<RaceMetric>("rank");
  const [focusedTeamId, setFocusedTeamId] = useState<string | null>(null);
  const [activePoint, setActivePoint] = useState<ActiveRacePoint>(null);
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const division = divisionId === "all" ? undefined : schedule.setup.divisions.find((item) => item.id === divisionId);
  const scopeTeams = schedule.setup.teams.filter((team) => divisionId === "all" || team.divisionId === divisionId);
  const snapshots = history.filter((snapshot) => (
    (snapshot.weekNumber === 0 || snapshot.playedGames > 0)
    && snapshot.weekNumber <= throughWeek
  ));
  const chartSnapshots = snapshots.length ? snapshots : [history[0]];
  const scopedRanks = new Map(chartSnapshots.map((snapshot) => {
    const rows = snapshot.rows.filter((row) => divisionId === "all" || teamById.get(row.teamId)?.divisionId === divisionId);
    return [snapshot.weekNumber, new Map(rows.map((row, index) => [row.teamId, index + 1]))];
  }));
  const series = scopeTeams.map((team) => ({
    team,
    color: accessibleTeamColor(team.color),
    points: chartSnapshots.map((snapshot) => {
      const row = snapshot.rows.find((item) => item.teamId === team.id)!;
      const value = metric === "rank"
        ? divisionId === "all" ? row.rank : scopedRanks.get(snapshot.weekNumber)?.get(team.id) ?? row.rank
        : metric === "pointsFor"
          ? row.pointsFor
          : metric === "pointDifference"
            ? row.pointsFor - row.pointsAgainst
            : row.winPercentage;
      return { snapshot, value };
    }),
  }));
  const orderedSeries = [...series].sort((left, right) => {
    const leftValue = left.points.at(-1)?.value ?? 0;
    const rightValue = right.points.at(-1)?.value ?? 0;
    return (metric === "rank" ? leftValue - rightValue : rightValue - leftValue) || left.team.name.localeCompare(right.team.name);
  });
  const values = series.flatMap((item) => item.points.map((point) => point.value));
  const rankMaximum = Math.max(1, scopeTeams.length);
  const yMinimum = metric === "rank" || metric === "winPercentage" || metric === "pointsFor" ? metric === "rank" ? 1 : 0 : Math.min(0, ...values);
  const yMaximum = metric === "rank" ? rankMaximum : metric === "winPercentage" ? 1 : Math.max(metric === "pointDifference" ? 0 : 1, ...values);
  const yRange = Math.max(1, yMaximum - yMinimum);
  const width = 1000;
  const height = 350;
  const left = 66;
  const right = 34;
  const top = 28;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xFor = (index: number) => left + (chartSnapshots.length === 1 ? 0 : (index / (chartSnapshots.length - 1)) * plotWidth);
  const yFor = (value: number) => metric === "rank"
    ? top + ((value - yMinimum) / yRange) * plotHeight
    : top + ((yMaximum - value) / yRange) * plotHeight;
  const tickCount = metric === "rank" ? Math.min(5, rankMaximum) : 5;
  const yTicks = Array.from({ length: tickCount }, (_, index) => {
    if (tickCount === 1) return yMinimum;
    const raw = yMinimum + (index / (tickCount - 1)) * (yMaximum - yMinimum);
    return metric === "rank" ? Math.round(raw) : raw;
  }).filter((value, index, items) => items.indexOf(value) === index);
  const activeFocusedTeamId = scopeTeams.some((team) => team.id === focusedTeamId) ? focusedTeamId : null;
  const metricLabel = RACE_METRIC_OPTIONS.find((option) => option.value === metric)?.label ?? "Live rank";
  const lastSnapshot = chartSnapshots.at(-1);
  const historyLabel = lastSnapshot?.weekNumber ? `Preseason through Week ${lastSnapshot.weekNumber}` : "Preseason starting point";
  const scopeLabel = division?.name ?? "League";
  const activePointDetails = activePoint ? (() => {
    const item = series.find((candidate) => candidate.team.id === activePoint.teamId);
    const point = item?.points[activePoint.pointIndex];
    return item && point ? { item, point, pointIndex: activePoint.pointIndex } : undefined;
  })() : undefined;

  return <section className="season-race-panel">
    <header>
      <span><TrendingUp /><span><strong>{metricLabel} race</strong><small>{scopeLabel} · {historyLabel}</small></span></span>
      <CustomSelect label="Season race metric" value={metric} onChange={(value) => setMetric(value as RaceMetric)} options={RACE_METRIC_OPTIONS} />
    </header>
    <div className="season-race-legend" aria-label={`${metricLabel} chart teams`}>
      {orderedSeries.map((item) => {
        const currentValue = item.points.at(-1)?.value ?? 0;
        const focused = activeFocusedTeamId === item.team.id;
        return <button type="button" className={focused ? "active" : ""} aria-pressed={focused} onClick={() => setFocusedTeamId((current) => current === item.team.id ? null : item.team.id)} key={item.team.id}>
          <EntityLogo color={item.team.color} logoUrl={item.team.logoUrl} monogram={teamInitials(item.team)} size={28} />
          <span><strong>{item.team.name}</strong><small style={{ color: item.color }}>{formatRaceValue(metric, currentValue)}</small></span>
        </button>;
      })}
    </div>
    <div className="season-race-chart-scroll">
      <div className="season-race-chart-stage">
        <svg className="season-race-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${scopeLabel} ${metricLabel.toLowerCase()} from preseason through Week ${lastSnapshot?.weekNumber ?? 0}`}>
          <title>{scopeLabel} {metricLabel.toLowerCase()} race</title>
          {yTicks.map((tick) => {
            const y = yFor(tick);
            return <g className="race-axis-tick" key={tick}><line x1={left} x2={width - right} y1={y} y2={y} /><text x={left - 10} y={y + 4} textAnchor="end">{formatRaceValue(metric, tick)}</text></g>;
          })}
          {chartSnapshots.map((snapshot, index) => <g className="race-week-tick" key={snapshot.weekNumber}><line x1={xFor(index)} x2={xFor(index)} y1={top} y2={height - bottom} /><text x={xFor(index)} y={height - 14} textAnchor="middle">{snapshot.weekNumber === 0 ? "PRE" : `W${snapshot.weekNumber}`}</text></g>)}
          {series.map((item) => {
            const focused = activeFocusedTeamId === item.team.id;
            const muted = Boolean(activeFocusedTeamId && !focused);
            const points = item.points.map((point, index) => `${xFor(index)},${yFor(point.value)}`).join(" ");
            return <g className={`race-team-line ${focused ? "focused" : ""} ${muted ? "muted" : ""}`} style={{ color: item.color }} key={item.team.id}>
              <polyline points={points} />
              {item.points.map((point, index) => {
                const x = xFor(index);
                const y = yFor(point.value);
                const isEndpoint = metric === "rank" && (index === 0 || index === item.points.length - 1);
                const pointLabel = `${teamDisplayName(item.team)}, ${point.snapshot.weekNumber === 0 ? "Preseason" : `Week ${point.snapshot.weekNumber}`}, ${metricLabel} ${formatRaceValue(metric, point.value)}`;
                return <g
                  className="race-point"
                  aria-describedby={activePoint?.teamId === item.team.id && activePoint.pointIndex === index ? "race-point-tooltip" : undefined}
                  aria-label={pointLabel}
                  key={point.snapshot.weekNumber}
                  onBlur={() => setActivePoint(null)}
                  onClick={() => setActivePoint((current) => current?.teamId === item.team.id && current.pointIndex === index ? null : { teamId: item.team.id, pointIndex: index })}
                  onFocus={() => setActivePoint({ teamId: item.team.id, pointIndex: index })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActivePoint({ teamId: item.team.id, pointIndex: index });
                    }
                  }}
                  onMouseEnter={() => setActivePoint({ teamId: item.team.id, pointIndex: index })}
                  onMouseLeave={() => setActivePoint(null)}
                  role="button"
                  tabIndex={0}
                >
                  <circle className="race-point-dot" cx={x} cy={y} r={isEndpoint ? 4 : 2.8} />
                  {isEndpoint && (item.team.logoUrl
                    ? <image className="race-endpoint-logo" href={item.team.logoUrl} x={x - 12} y={y - 12} width="24" height="24" preserveAspectRatio="xMidYMid meet" />
                    : <g className="race-endpoint-monogram">
                      <rect x={x - 13} y={y - 13} width="26" height="26" rx="4" fill={tintColor(item.team.color, .82)} />
                      <text x={x} y={y + 3.5} textAnchor="middle">{teamInitials(item.team).slice(0, 3)}</text>
                    </g>)}
                  <circle className="race-point-focus-ring" cx={x} cy={y} r={isEndpoint ? 15 : 10} />
                  <circle className="race-point-hit" cx={x} cy={y} r={isEndpoint ? 16 : 11} />
                </g>;
              })}
            </g>;
          })}
        </svg>
        {activePointDetails && (() => {
          const { item, point, pointIndex } = activePointDetails;
          const x = xFor(pointIndex);
          const y = yFor(point.value);
          const weekLabel = point.snapshot.weekNumber === 0 ? "Preseason" : `Week ${point.snapshot.weekNumber}`;
          return <div
            className={`race-point-tooltip ${x > width * .72 ? "align-right" : ""} ${y < 88 ? "below" : ""}`}
            id="race-point-tooltip"
            role="tooltip"
            style={{ left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%`, "--race-color": item.color } as CSSProperties}
          >
            <EntityLogo className="race-point-tooltip-logo" color={item.team.color} logoUrl={item.team.logoUrl} monogram={teamInitials(item.team)} size={36} />
            <span className="race-point-tooltip-identity">
              <small>{weekLabel}</small>
              {item.team.city && <span className="team-city">{item.team.city}</span>}
              <strong>{item.team.name}</strong>
            </span>
            <span className="race-point-tooltip-value"><strong>{formatRaceValue(metric, point.value)}</strong><small>{metricLabel}</small></span>
            <small className="race-point-tooltip-movement">{formatRaceMovement(metric, point.value, item.points[pointIndex - 1]?.value)}</small>
          </div>;
        })()}
      </div>
    </div>
  </section>;
}

function sortableValue(row: TeamSeasonStats, key: TeamSortKey, teamById: Map<string, Team>) {
  if (key === "team") return teamDisplayName(teamById.get(row.teamId)!).toLowerCase();
  if (key === "record" || key === "winPercentage") return row.winPercentage;
  if (key === "division") return (row.divisionWins + row.divisionLosses) ? row.divisionWins / (row.divisionWins + row.divisionLosses) : -1;
  if (key === "pointsFor") return row.pointsFor;
  if (key === "pointsAgainst") return row.pointsAgainst;
  if (key === "difference") return row.pointsFor - row.pointsAgainst;
  if (key === "home") return recordPercentage(row.home);
  if (key === "away") return recordPercentage(row.away);
  if (key === "featuredWins") return row.featuredWins;
  if (key === "sov") return row.strengthOfVictory ?? -1;
  if (key === "sos") return row.strengthOfSchedule ?? -1;
  if (key === "streak") return row.streak === "—" ? 0 : (row.streak.startsWith("W") ? 1 : -1) * Number(row.streak.slice(1));
  return row.playoffOdds;
}

export function StatsWorkspace({ schedule }: { schedule: GeneratedSchedule }) {
  const [tab, setTab] = useState<StatsTab>("standings");
  const [leagueLeaderView, setLeagueLeaderView] = useState<LeagueLeaderView>("overall");
  const [divisionId, setDivisionId] = useState("all");
  const [standingsWeek, setStandingsWeek] = useState("current");
  const [sortKey, setSortKey] = useState<TeamSortKey>("winPercentage");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const odds = useMemo(() => calculateSeasonOdds(schedule, 500), [schedule]);
  const oddsByTeam = useMemo(() => new Map(odds.map((row) => [row.teamId, row.playoffOdds])), [odds]);
  const teamStats = useMemo(() => calculateTeamSeasonStats(schedule, oddsByTeam), [schedule, oddsByTeam]);
  const rankHistory = useMemo(() => getLiveRankHistory(schedule), [schedule]);
  const currentRankSnapshot = [...rankHistory].reverse().find((snapshot) => snapshot.playedGames > 0) ?? rankHistory[0];
  const selectedRankSnapshot = standingsWeek === "current" ? currentRankSnapshot : rankHistory.find((snapshot) => String(snapshot.weekNumber) === standingsWeek) ?? currentRankSnapshot;
  const currentClinches = useMemo(() => new Map(getTeamClinchTimelines(schedule, currentRankSnapshot.weekNumber).map((timeline) => [timeline.teamId, timeline])), [schedule, currentRankSnapshot.weekNumber]);
  const selectedClinches = useMemo(() => new Map(getTeamClinchTimelines(schedule, selectedRankSnapshot.weekNumber).map((timeline) => [timeline.teamId, timeline])), [schedule, selectedRankSnapshot.weekNumber]);
  const regularSignals = useMemo(() => getScheduleGameSignals(schedule), [schedule]);
  const regularGames = useMemo(() => [...regularSignals.byGameId.values()], [regularSignals]);
  const playoffGames = (schedule.playoffGames ?? []).filter((game) => game.bracket === "main" && game.homeScore != null && game.awayScore != null);
  const playoffAnalytics = useMemo(() => calculateGameAnalytics(playoffGames), [playoffGames]);
  const hasPlayoffResults = playoffAnalytics.length > 0;
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const selectedDivision = divisionId === "all" ? undefined : divisionById.get(divisionId);
  const visibleStandings = divisionId === "all" ? selectedRankSnapshot.rows : selectedRankSnapshot.rows.filter((row) => teamById.get(row.teamId)?.divisionId === divisionId);
  const visibleOdds = divisionId === "all" ? odds : odds.filter((row) => teamById.get(row.teamId)?.divisionId === divisionId);
  const filterOptions = [{ value: "all", label: "League standings", description: `${schedule.setup.teams.length} teams`, swatch: schedule.setup.color, logoUrl: schedule.setup.logoUrl, monogram: resolveInitials(schedule.setup.initials, leagueAcronym(schedule.setup.name)) }, ...schedule.setup.divisions.map((division) => ({ value: division.id, label: division.name, description: `${schedule.setup.teams.filter((team) => team.divisionId === division.id).length} teams`, swatch: division.color, logoUrl: division.logoUrl, monogram: resolveInitials(division.initials, divisionAcronym(division.name)) }))];
  const rankHistoryOptions = [
    { value: "current", label: "Current live rank", description: currentRankSnapshot.weekNumber ? `Through Week ${currentRankSnapshot.weekNumber}` : "Preseason order" },
    { value: "0", label: "Preseason rank", description: "Starting seed before Week 1" },
    ...rankHistory.filter((snapshot) => snapshot.weekNumber > 0 && snapshot.playedGames > 0).map((snapshot) => ({ value: String(snapshot.weekNumber), label: snapshot.completed ? `After Week ${snapshot.weekNumber}` : `Week ${snapshot.weekNumber} in progress`, description: `${snapshot.playedGames} of ${schedule.weeks.find((week) => week.weekNumber === snapshot.weekNumber)?.games.length ?? 0} games scored` })),
  ];
  const selectedHistoryLabel = selectedRankSnapshot.weekNumber === 0 ? "Preseason seed" : selectedRankSnapshot.completed ? `Final table after Week ${selectedRankSnapshot.weekNumber}` : `Live table during Week ${selectedRankSnapshot.weekNumber}`;
  const completedTeams = teamStats.filter((row) => row.wins + row.losses + row.ties > 0);
  const divisionsPlayed = (row: TeamSeasonStats) => row.divisionWins + row.divisionLosses > 0;
  const hottest = (row: TeamSeasonStats) => row.streak.startsWith("W") ? Number(row.streak.slice(1)) : null;
  const sortRows = [...teamStats].sort((left, right) => {
    const leftValue = sortableValue(left, sortKey, teamById);
    const rightValue = sortableValue(right, sortKey, teamById);
    const comparison = typeof leftValue === "string" && typeof rightValue === "string" ? leftValue.localeCompare(rightValue) : Number(leftValue) - Number(rightValue);
    return (sortDirection === "asc" ? comparison : -comparison) || teamById.get(left.teamId)!.name.localeCompare(teamById.get(right.teamId)!.name);
  });
  const onSort = (key: TeamSortKey) => { if (key === sortKey) setSortDirection((current) => current === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDirection(key === "team" ? "asc" : "desc"); } };
  const tabs: Array<{ key: StatsTab; label: string; disabled?: boolean }> = [{ key: "standings", label: "Standings" }, { key: "rank-race", label: "Rank race" }, { key: "team-leaders", label: "Team leaders" }, { key: "league-leaders", label: "League leaders" }, { key: "playoffs", label: "Playoff stats", disabled: !hasPlayoffResults }, { key: "team-stats", label: "Team stats" }];
  const leagueLeaderTabs: Array<{ key: LeagueLeaderView; label: string }> = [{ key: "overall", label: "Best games" }, { key: "gotw", label: "GOTW" }, { key: "closest", label: "Close games" }, { key: "scoring", label: "High scoring" }, { key: "divisional", label: "Divisional" }];
  const leagueLeaderPanels = {
    overall: <GameHighlightPanel title="Greatest regular-season games" schedule={schedule} items={regularGames} metric="qualityScore" direction="asc" />,
    gotw: <GameHighlightPanel title="Greatest game-of-the-week games" schedule={schedule} items={regularGames.filter((item) => item.badges.includes("GOTW"))} metric="qualityScore" direction="asc" />,
    closest: <GameHighlightPanel title="Closest games" schedule={schedule} items={regularGames} metric="margin" direction="asc" />,
    scoring: <GameHighlightPanel title="Highest-scoring games" schedule={schedule} items={regularGames} metric="total" direction="desc" />,
    divisional: <GameHighlightPanel title="Best divisional showdowns" schedule={schedule} items={regularGames.filter((item) => item.game.matchupType === "division")} metric="qualityScore" direction="asc" />,
  } satisfies Record<LeagueLeaderView, React.ReactNode>;
  const teamHrefBase = `/season/${schedule.id}/team`;

  return <div className="stats-workspace">
    <div className="stats-tabs" role="tablist" aria-label="Standings and statistics">{tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.key} disabled={item.disabled} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)} key={item.key}>{item.disabled && <LockKeyhole />}{item.label}</button>)}</div>
    {tab === "standings" && <div className="stats-tab-panel">
      <div className="stats-filter-bar"><span>{selectedDivision ? <DivisionIdentity iconOnly division={selectedDivision} /> : <BarChart3 />}<span><strong>{divisionId === "all" ? "League standings" : `${selectedDivision?.name} standings`}</strong><small>{selectedHistoryLabel}</small></span></span><div className="stats-filter-controls"><CustomSelect label="Standings history" value={standingsWeek} onChange={setStandingsWeek} options={rankHistoryOptions} /><CustomSelect label="Standings scope" value={divisionId} onChange={setDivisionId} options={filterOptions} /></div></div>
      <ClinchStatusLegend />
      <div className="stats-standings-layout">
        <div className="data-table-wrap"><table className="data-table standings-table"><thead><tr><th>LIVE RK</th><th>TEAM</th><th>REC</th><th>DIV</th><th>PCT</th><th>PF</th><th>PA</th><th>DIFF</th><th>STRK</th></tr></thead><tbody>{visibleStandings.map((row) => { const team = teamById.get(row.teamId)!; const division = divisionById.get(team.divisionId)!; return <tr key={row.teamId}><td><RankMovement row={row} /></td><td><Link className="standings-team-link" href={`${teamHrefBase}/${team.id}`}><EntityLogo className="team-mark standings-team-logo" color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={50} /><span className="standings-team-copy">{team.city && <small className="standings-team-city team-city">{team.city}</small>}<strong>{team.name}</strong><small className="standings-team-meta">{division.name} · Preseason #{row.preseasonRank}</small><ClinchBadges timeline={selectedClinches.get(team.id)} division={division} /></span><DivisionIdentity iconOnly division={division} /></Link></td><td>{formatRecord(row)}</td><td>{row.divisionWins}-{row.divisionLosses}</td><td>{row.winPercentage.toFixed(3).replace(/^0/, "")}</td><td>{row.pointsFor}</td><td>{row.pointsAgainst}</td><td className={row.pointsFor - row.pointsAgainst >= 0 ? "positive" : "negative"}>{row.pointsFor - row.pointsAgainst >= 0 ? "+" : ""}{row.pointsFor - row.pointsAgainst}</td><td>{row.streak}</td></tr>; })}</tbody></table></div>
        <section className="season-odds-table-panel">
          <header><Gauge /><span><strong>Season odds</strong><small>500 deterministic simulations</small></span></header>
          <div className="data-table-wrap"><table className="data-table season-odds-table"><thead><tr><th>TEAM</th><th>PROJ REC</th><th>PLAYOFF</th><th>DIVISION</th><th>CHAMP</th><th>#1 SEED</th><th>AVG FINISH</th></tr></thead><tbody>{visibleOdds.map((row) => { const team = teamById.get(row.teamId)!; const division = divisionById.get(team.divisionId); return <tr key={team.id}><td><Link className="season-odds-team-link" href={`${teamHrefBase}/${team.id}`}><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={32} /><span><strong>{team.name}</strong><small><span className="team-city">{team.city}</span>{team.city && division ? " · " : ""}{division?.name}</small></span></Link></td><td>{compactProjectedRecord(row.projectedRecord)}</td><td><span className="season-odds-meter"><em>{percentage(row.playoffOdds)}</em><i><b style={{ width: `${Math.max(2, row.playoffOdds * 100)}%`, background: accessibleTeamColor(team.color) }} /></i></span></td><td>{percentage(row.divisionOdds)}</td><td>{percentage(row.championshipOdds)}</td><td>{percentage(row.topSeedOdds)}</td><td>#{row.averageFinish.toFixed(1)}</td></tr>; })}</tbody></table></div>
        </section>
      </div>
      <div className="stats-rule-strip"><ShieldCheck /><span><strong>League seed rules</strong><small>Live rank uses win percentage, then points scored, then preseason rank. Clinches and eliminations appear only when every remaining outcome confirms them. The final live table feeds projected playoff seeds; locked fields preserve their selected order.</small></span></div>
    </div>}
    {tab === "rank-race" && <div className="stats-tab-panel">
      <div className="stats-filter-bar"><span>{selectedDivision ? <DivisionIdentity iconOnly division={selectedDivision} /> : <TrendingUp />}<span><strong>{divisionId === "all" ? "League rank race" : `${selectedDivision?.name} rank race`}</strong><small>{selectedHistoryLabel}</small></span></span><div className="stats-filter-controls"><CustomSelect label="Race history" value={standingsWeek} onChange={setStandingsWeek} options={rankHistoryOptions} /><CustomSelect label="Race scope" value={divisionId} onChange={setDivisionId} options={filterOptions} /></div></div>
      <SeasonRaceChart schedule={schedule} history={rankHistory} throughWeek={selectedRankSnapshot.weekNumber} divisionId={divisionId} />
      <div className="stats-rule-strip"><TrendingUp /><span><strong>Replayable weekly history</strong><small>Every point uses the rank, scoring, record, and point differential frozen after that week. Switch metrics to compare how each race changed through the selected week.</small></span></div>
    </div>}
    {tab === "team-leaders" && <div className="stats-tab-panel"><div className="team-leader-grid"><TeamPodiumCard title="Hottest teams" icon={Flame} rows={completedTeams} teamById={teamById} value={hottest} label={(row) => row.streak} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best home record" icon={Home} rows={completedTeams} teamById={teamById} value={(row) => recordGames(row.home) ? recordPercentage(row.home) : null} label={(row) => formatSplitRecord(row.home)} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best away record" icon={Plane} rows={completedTeams} teamById={teamById} value={(row) => recordGames(row.away) ? recordPercentage(row.away) : null} label={(row) => formatSplitRecord(row.away)} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best division record" icon={ShieldCheck} rows={completedTeams} teamById={teamById} value={(row) => divisionsPlayed(row) ? row.divisionWins / (row.divisionWins + row.divisionLosses) : null} label={(row) => `${row.divisionWins}-${row.divisionLosses}`} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best division point diff" icon={Swords} rows={completedTeams} teamById={teamById} value={(row) => divisionsPlayed(row) ? row.divisionPointsFor - row.divisionPointsAgainst : null} label={(row) => `${row.divisionPointsFor - row.divisionPointsAgainst >= 0 ? "+" : ""}${row.divisionPointsFor - row.divisionPointsAgainst}`} hrefBase={teamHrefBase} /><TeamPodiumCard title="Highest scoring" icon={Zap} rows={completedTeams} teamById={teamById} value={(row) => row.pointsFor} label={(row) => `${row.pointsFor} PF`} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best point differential" icon={Target} rows={completedTeams} teamById={teamById} value={(row) => row.pointsFor - row.pointsAgainst} label={(row) => `${row.pointsFor - row.pointsAgainst >= 0 ? "+" : ""}${row.pointsFor - row.pointsAgainst}`} hrefBase={teamHrefBase} /></div></div>}
    {tab === "league-leaders" && <div className="stats-tab-panel"><div className="stats-rule-strip"><Trophy /><span><strong>Game quality seed</strong><small>Quality equals margin rank plus total-points rank. Lower is better; tied values share medals. Upsets use each team’s frozen rank entering that week.</small></span><span className="badge-legend">{(["GOTW", "Upset", "Shootout"] as const).map((badge) => <GameBadgeChip badge={badge} key={badge} />)}</span></div><div className="league-leader-browser"><div className="leader-category-tabs" role="tablist" aria-label="League leader category">{leagueLeaderTabs.map((item) => <button type="button" role="tab" aria-selected={leagueLeaderView === item.key} className={leagueLeaderView === item.key ? "active" : ""} onClick={() => setLeagueLeaderView(item.key)} key={item.key}>{item.label}</button>)}</div><div className="league-leader-focus">{leagueLeaderPanels[leagueLeaderView]}</div></div></div>}
    {tab === "playoffs" && hasPlayoffResults && <div className="stats-tab-panel"><div className="game-leader-grid playoff-stat-grid"><GameHighlightPanel title="Greatest playoff games" schedule={schedule} items={playoffAnalytics} metric="qualityScore" direction="asc" playoff /><GameHighlightPanel title="Closest playoff games" schedule={schedule} items={playoffAnalytics} metric="margin" direction="asc" playoff /><GameHighlightPanel title="Highest-scoring playoff games" schedule={schedule} items={playoffAnalytics} metric="total" direction="desc" playoff /></div></div>}
    {tab === "team-stats" && <div className="stats-tab-panel"><div className="team-stats-table-wrap"><table className="team-stats-table"><thead><tr><SortHeader label="TEAM" sortKey="team" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="RECORD" sortKey="record" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="WIN %" sortKey="winPercentage" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="DIV" sortKey="division" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="PF" sortKey="pointsFor" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="PA" sortKey="pointsAgainst" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="DIFF" sortKey="difference" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="HOME" sortKey="home" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="AWAY" sortKey="away" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="GOTW WINS" sortKey="featuredWins" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="SOV" sortKey="sov" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="SOS" sortKey="sos" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="STREAK" sortKey="streak" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="PLAYOFF %" sortKey="playoff" active={sortKey} direction={sortDirection} onSort={onSort} /></tr></thead><tbody>{sortRows.map((row) => { const team = teamById.get(row.teamId)!; const division = divisionById.get(team.divisionId)!; return <tr key={row.teamId}><td><Link href={`${teamHrefBase}/${team.id}`}><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={32} /><span><strong>{team.name}</strong><small><span className="team-city">{team.city}</span>{team.city ? " · " : ""}{division.name}</small><ClinchBadges timeline={currentClinches.get(team.id)} division={division} compact /></span><DivisionIdentity iconOnly division={division} /></Link></td><td>{row.record}</td><td>{decimal(row.winPercentage)}</td><td>{row.divisionWins}-{row.divisionLosses}</td><td>{row.pointsFor}</td><td>{row.pointsAgainst}</td><td className={row.pointsFor - row.pointsAgainst >= 0 ? "positive" : "negative"}>{row.pointsFor - row.pointsAgainst >= 0 ? "+" : ""}{row.pointsFor - row.pointsAgainst}</td><td>{formatSplitRecord(row.home)}</td><td>{formatSplitRecord(row.away)}</td><td>{row.featuredWins}</td><td>{decimal(row.strengthOfVictory)}</td><td>{decimal(row.strengthOfSchedule)}</td><td>{row.streak}</td><td>{percentage(row.playoffOdds)}</td></tr>; })}</tbody></table></div></div>}
  </div>;
}
