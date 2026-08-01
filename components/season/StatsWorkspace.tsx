"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CircleX,
  Flame,
  Gauge,
  GripVertical,
  Home,
  LockKeyhole,
  MapPin,
  Medal,
  Minus,
  Plane,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Trash2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { ClinchBadges } from "@/components/season/ClinchBadges";
import { GameBadgeChip } from "@/components/season/MatchupPresentation";
import { DivisionIdentity } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { getTeamClinchTimelines, type TeamClinchTimeline } from "@/lib/clinch";
import { accessibleTeamColor, tintColor } from "@/lib/colorContrast";
import { divisionAcronym, leagueAcronym, resolveInitials } from "@/lib/monograms";
import { calculateSeasonOdds } from "@/lib/simulator";
import { formatDivisionRecord, formatRecord, getLiveRankHistory, resolveStandings } from "@/lib/standings";
import {
  DEFAULT_TIEBREAKERS,
  normalizeTiebreakerSettings,
  TIEBREAKER_RULE_DESCRIPTIONS,
  TIEBREAKER_RULE_LABELS,
  TIEBREAKER_RULES,
} from "@/lib/tiebreakers";
import {
  calculateGameAnalytics,
  calculateTeamSeasonStats,
  formatDifferential,
  formatPoints,
  formatSplitRecord,
  getScheduleGameSignals,
  recordGames,
  recordPercentage,
  type GameAnalytics,
  type TeamSeasonStats,
} from "@/lib/statistics";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { Division, GeneratedSchedule, PlayoffGame, RankedStandingsRow, RankHistorySnapshot, StandingsTieGroup, Team, TiebreakerRule, TiebreakerScope, TiebreakerSettings } from "@/lib/types";

type StatsTab = "standings" | "rank-race" | "team-leaders" | "league-leaders" | "playoffs" | "team-stats";
type TeamSortKey = "team" | "record" | "winPercentage" | "division" | "pointsFor" | "pointsAgainst" | "difference" | "home" | "away" | "featuredWins" | "sov" | "sos" | "currentStreak" | "bestStreak" | "playoff";
type RaceMetric = "rank" | "pointsFor" | "pointDifference" | "winPercentage";
type ActiveRacePoint = { teamId: string; pointIndex: number } | null;
type LeagueLeaderView = "overall" | "gotw" | "closest" | "scoring" | "divisional";
type RaceMilestone = "top-seed" | "division-title" | "playoff-berth" | "eliminated";

const RACE_METRIC_OPTIONS: SelectOption[] = [
  { value: "rank", label: "Live rank", description: "Weekly standings position" },
  { value: "pointsFor", label: "Points scored", description: "Cumulative top-scoring race" },
  { value: "pointDifference", label: "Point differential", description: "Points for minus points against" },
  { value: "winPercentage", label: "Win percentage", description: "Weekly standings pace" },
];

const MEDAL_LABELS = ["Gold", "Silver", "Bronze"] as const;
const RACE_MILESTONE_LABELS: Record<RaceMilestone, string> = {
  "top-seed": "Clinched #1 seed",
  "division-title": "Clinched division title",
  "playoff-berth": "Clinched playoff spot",
  eliminated: "Eliminated",
};

function raceMilestonesAtWeek(timeline: TeamClinchTimeline | undefined, weekNumber: number): RaceMilestone[] {
  if (!timeline) return [];
  const milestones: RaceMilestone[] = [];
  if (timeline.topSeedWeek === weekNumber) milestones.push("top-seed");
  if (timeline.divisionTitleWeek === weekNumber) milestones.push("division-title");
  if (timeline.playoffBerthWeek === weekNumber) milestones.push("playoff-berth");
  if (timeline.eliminatedWeek === weekNumber) milestones.push("eliminated");
  return milestones;
}

function RaceMilestoneMarker({ milestone, division, x, y, index, total }: {
  milestone: RaceMilestone;
  division?: Division;
  x: number;
  y: number;
  index: number;
  total: number;
}) {
  const markerX = x + (index - (total - 1) / 2) * 15;
  const markerY = y - 18;
  const symbol = milestone === "top-seed" ? "1" : milestone === "division-title" ? "★" : milestone === "playoff-berth" ? "✓" : "×";
  return <g className={`race-milestone-marker ${milestone}`} aria-hidden="true">
    <circle cx={markerX} cy={markerY} r="7" style={milestone === "division-title" && division ? { fill: division.color } : undefined} />
    {milestone === "division-title" && division?.logoUrl
      ? <image href={division.logoUrl} x={markerX - 5} y={markerY - 5} width="10" height="10" preserveAspectRatio="xMidYMid meet" />
      : <text x={markerX} y={markerY + 3.1} textAnchor="middle">{symbol}</text>}
  </g>;
}

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
  return <Link className="game-highlight" href={deepLink} aria-label={`Open ${away.name} at ${home.name}, ${MEDAL_LABELS[rank - 1]} in this category`}>
    <div className="game-highlight-head"><span className={`medal-pill medal-${rank}`}><Medal />{MEDAL_LABELS[rank - 1]}</span><span className="game-badge-row">{analytics.badges.map((badge) => <GameBadgeChip badge={badge} key={badge} />)}</span></div>
    <div className="game-highlight-sides">
      <span className="game-highlight-team" style={{ background: tintColor(away.color, .88), color: accessibleTeamColor(away.color) }}><EntityLogo color={away.color} logoUrl={away.logoUrl} monogram={teamInitials(away)} size={34} /><span><small className="team-city">{away.city}</small><strong>{away.name}</strong></span>{awayWon && <em>W</em>}<b>{formatPoints(game.awayScore!)}</b></span>
      <span className="game-highlight-separator">{roundLogoUrl ? <img src={roundLogoUrl} alt="" /> : schedule.setup.playoffs.logoUrl ? <img src={schedule.setup.playoffs.logoUrl} alt="" /> : "@"}</span>
      <span className="game-highlight-team" style={{ background: tintColor(home.color, .88), color: accessibleTeamColor(home.color) }}><EntityLogo color={home.color} logoUrl={home.logoUrl} monogram={teamInitials(home)} size={34} /><span><small className="team-city">{home.city}</small><strong>{home.name}</strong></span>{homeWon && <em>W</em>}<b>{formatPoints(game.homeScore!)}</b></span>
    </div>
    <div className="game-stat-chips"><span>Margin <strong>{formatPoints(analytics.margin)}</strong><small>#{analytics.marginRank}</small></span><span>Total <strong>{formatPoints(analytics.total)}</strong><small>#{analytics.totalRank}</small></span><span>Quality <strong>{analytics.qualityScore}</strong><small>#{analytics.qualityRank}</small></span></div>
    <footer><span><MapPin />{home.logoUrl && <img src={home.logoUrl} alt="" />}<strong>{game.stadium}</strong></span><span>{round || `Week ${game.week}`}{game.specialEvent ? ` · ${game.specialEvent}` : ""}</span><span className="game-highlight-open">Open game</span></footer>
  </Link>;
}

function GameHighlightPanel({ title, schedule, items, metric, direction, playoff = false }: { title: string; schedule: GeneratedSchedule; items: GameAnalytics[]; metric: "qualityScore" | "margin" | "total"; direction: "asc" | "desc"; playoff?: boolean }) {
  const ranked = categoryRanks(items, metric, direction);
  return <article className="game-leader-panel"><header><Trophy /><strong>{title}</strong></header>{ranked.length ? <div>{ranked.map(({ item, rank }) => {
    const game = item.game as PlayoffGame;
    const query = new URLSearchParams(playoff ? { view: "playoffs" } : { view: "league-schedule", week: String(game.week) });
    query.set("medal", String(rank));
    query.set("medalCategory", title);
    const deepLink = `/season/${schedule.id}?${query.toString()}#${game.id}`;
    return <GameHighlight schedule={schedule} analytics={item} rank={rank} round={playoff ? game.round : undefined} roundLogoUrl={playoff ? game.logoUrl || game.roundLogoUrl : undefined} deepLink={deepLink} key={item.game.id} />;
  })}</div> : <div className="leader-empty">No completed results yet</div>}</article>;
}

function SortHeader({ label, sortKey, active, direction, onSort }: { label: string; sortKey: TeamSortKey; active: TeamSortKey; direction: "asc" | "desc"; onSort: (key: TeamSortKey) => void }) {
  const isActive = active === sortKey;
  const Icon = isActive ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return <th scope="col" aria-sort={isActive ? direction === "asc" ? "ascending" : "descending" : "none"}><button type="button" className={isActive ? "is-sorted" : undefined} onClick={() => onSort(sortKey)}>{label}<Icon /></button></th>;
}

function RankMovement({ row }: { row: RankedStandingsRow }) {
  const direction = row.rankChange > 0 ? "up" : row.rankChange < 0 ? "down" : "even";
  const change = Math.abs(row.rankChange);
  const label = direction === "up" ? `Up ${change}` : direction === "down" ? `Down ${change}` : "No change";
  return <span className="rank-movement"><strong>{row.rank}</strong><small className={direction} aria-label={label}>{direction === "up" ? <ArrowUp /> : direction === "down" ? <ArrowDown /> : <Minus />}{change || ""}</small></span>;
}

function PreseasonMovement({ row }: { row: RankedStandingsRow }) {
  const change = row.preseasonRank - row.rank;
  const direction = change > 0 ? "up" : change < 0 ? "down" : "even";
  const label = change > 0 ? `Up ${change} from preseason` : change < 0 ? `Down ${Math.abs(change)} from preseason` : "Same as preseason";
  return <span className={`preseason-movement ${direction}`} aria-label={label}>{direction === "up" ? <ArrowUp /> : direction === "down" ? <ArrowDown /> : <Minus />}<strong>{change ? Math.abs(change) : "—"}</strong></span>;
}

function moveListItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function TiebreakerEditor({ settings, onChange, disabled = false }: { settings: TiebreakerSettings; onChange: (settings: TiebreakerSettings) => void; disabled?: boolean }) {
  const [draggedRule, setDraggedRule] = useState<TiebreakerRule | null>(null);
  const [addRule, setAddRule] = useState("choose");
  const stack = settings.league;
  const removedRules = TIEBREAKER_RULES.filter((rule) => !stack.includes(rule));
  const updateStack = (next: TiebreakerRule[]) => onChange({ ...settings, division: [...next], league: [...next] });
  const addOptions = [
    { value: "choose", label: removedRules.length ? "Add another rule" : "All rules are active", description: removedRules.length ? `${removedRules.length} available` : "Remove a rule to add it again" },
    ...removedRules.map((rule) => ({ value: rule, label: TIEBREAKER_RULE_LABELS[rule], description: TIEBREAKER_RULE_DESCRIPTIONS[rule] })),
  ];
  const chooseRule = (value: string) => {
    setAddRule("choose");
    if (value === "choose" || !TIEBREAKER_RULES.includes(value as TiebreakerRule)) return;
    updateStack([...stack, value as TiebreakerRule]);
  };
  return <section className="tiebreaker-editor" aria-label="Tiebreaker rule editor">
    <header><span><SlidersHorizontal /><span><strong>Standings tiebreaker rules</strong><small>One rule order applies to league seeds and division ranks. Drag to reorder from top to bottom.</small></span></span></header>
    <div className="tiebreaker-rule-list">{stack.map((rule, index) => <div
      className={`tiebreaker-rule-row ${draggedRule === rule ? "dragging" : ""}`}
      draggable={!disabled}
      onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", rule); setDraggedRule(rule); }}
      onDragEnd={() => setDraggedRule(null)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => {
        if (!draggedRule) return;
        updateStack(moveListItem(stack, stack.indexOf(draggedRule), index));
        setDraggedRule(null);
      }}
      key={rule}
    >
      <GripVertical aria-hidden="true" /><b>{index + 1}</b><span><strong>{TIEBREAKER_RULE_LABELS[rule]}</strong><small>{TIEBREAKER_RULE_DESCRIPTIONS[rule]}</small></span><div><button type="button" title="Move rule up" aria-label={`Move ${TIEBREAKER_RULE_LABELS[rule]} up`} disabled={disabled || index === 0} onClick={() => updateStack(moveListItem(stack, index, index - 1))}><ArrowUp /></button><button type="button" title="Move rule down" aria-label={`Move ${TIEBREAKER_RULE_LABELS[rule]} down`} disabled={disabled || index === stack.length - 1} onClick={() => updateStack(moveListItem(stack, index, index + 1))}><ArrowDown /></button><button type="button" title="Remove rule" aria-label={`Remove ${TIEBREAKER_RULE_LABELS[rule]}`} disabled={disabled} onClick={() => updateStack(stack.filter((item) => item !== rule))}><Trash2 /></button></div>
    </div>)}</div>
    <footer><CustomSelect label="Add tiebreaker rule" value={addRule} onChange={chooseRule} disabled={disabled || removedRules.length === 0} options={addOptions} /><button type="button" disabled={disabled} onClick={() => updateStack([...DEFAULT_TIEBREAKERS])}><RotateCcw />Reset defaults</button></footer>
  </section>;
}

function TieResolutionModal({ tie, schedule, onClose, onSave }: { tie: StandingsTieGroup; schedule: GeneratedSchedule; onClose: () => void; onSave: (orderedTeamIds: string[]) => void }) {
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const [teamIds, setTeamIds] = useState(tie.orderedTeamIds);
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = teamIds.length !== tie.orderedTeamIds.length || teamIds.some((id, index) => id !== tie.orderedTeamIds[index]);
  const requestClose = () => {
    if (dirty) { setConfirmDiscard(true); return; }
    onClose();
  };
  return <Modal onClose={requestClose} className="tie-resolution-modal" labelledBy="tie-resolution-title" describedBy="tie-resolution-desc">
    <header><span><strong id="tie-resolution-title">Resolve tied teams</strong><small id="tie-resolution-desc">This order applies only while this exact {tie.scope} tie remains unchanged.</small></span><button type="button" aria-label="Close tie resolution" onClick={requestClose}><X /></button></header>
    <div className="tie-resolution-list">{teamIds.map((teamId, index) => { const team = teamById.get(teamId)!; return <div draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", teamId); setDraggedTeamId(teamId); }} onDragEnd={() => setDraggedTeamId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedTeamId) setTeamIds(moveListItem(teamIds, teamIds.indexOf(draggedTeamId), index)); }} key={teamId}><GripVertical /><b>{index + 1}</b><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={38} /><span>{team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong></span><button type="button" aria-label={`Move ${teamDisplayName(team)} up`} disabled={index === 0} onClick={() => setTeamIds(moveListItem(teamIds, index, index - 1))}><ArrowUp /></button><button type="button" aria-label={`Move ${teamDisplayName(team)} down`} disabled={index === teamIds.length - 1} onClick={() => setTeamIds(moveListItem(teamIds, index, index + 1))}><ArrowDown /></button></div>; })}</div>
    <footer><button type="button" onClick={requestClose}>Cancel</button><button type="button" className="button-primary" onClick={() => onSave(teamIds)}>Save tie order</button></footer>
    {confirmDiscard && <ConfirmDialog
      role="alertdialog"
      tone="danger"
      icon={<Trash2 />}
      kicker="UNSAVED ORDER"
      title="Discard this tie order?"
      closeLabel="Keep editing"
      onClose={() => setConfirmDiscard(false)}
      actions={[
        { label: "Keep editing", onClick: () => setConfirmDiscard(false), variant: "secondary", autoFocus: true },
        { label: "Discard order", onClick: onClose, variant: "danger", icon: <Trash2 /> },
      ]}
    >
      <p>Your changes won’t be saved.</p>
    </ConfirmDialog>}
  </Modal>;
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

function spreadRaceEndpointYs(entries: Array<{ teamId: string; y: number }>, minimum: number, maximum: number) {
  const ordered = [...entries].sort((left, right) => left.y - right.y || left.teamId.localeCompare(right.teamId));
  if (ordered.length < 2) return new Map(ordered.map((entry) => [entry.teamId, entry.y]));
  const gap = Math.min(27, (maximum - minimum) / (ordered.length - 1));
  const positions = ordered.map((entry) => Math.max(minimum, Math.min(maximum, entry.y)));

  for (let index = 1; index < positions.length; index += 1) {
    positions[index] = Math.max(positions[index], positions[index - 1] + gap);
  }
  if (positions.at(-1)! > maximum) {
    positions[positions.length - 1] = maximum;
    for (let index = positions.length - 2; index >= 0; index -= 1) {
      positions[index] = Math.min(positions[index], positions[index + 1] - gap);
    }
  }

  return new Map(ordered.map((entry, index) => [entry.teamId, positions[index]]));
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
  const divisionById = new Map(schedule.setup.divisions.map((item) => [item.id, item]));
  const milestoneByTeam = useMemo(() => new Map(getTeamClinchTimelines(schedule, throughWeek).map((timeline) => [timeline.teamId, timeline])), [schedule, throughWeek]);
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
  const firstEndpointYs = spreadRaceEndpointYs(series.map((item) => ({ teamId: item.team.id, y: yFor(item.points[0]?.value ?? 0) })), top + 14, height - bottom - 14);
  const lastEndpointYs = spreadRaceEndpointYs(series.map((item) => ({ teamId: item.team.id, y: yFor(item.points.at(-1)?.value ?? 0) })), top + 14, height - bottom - 14);
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
    {metric === "rank" && <div className="race-milestone-legend" aria-label="Rank race milestone legend"><strong>Milestones</strong><span className="top-seed"><Medal />#1 seed</span><span className="division-title"><Trophy />Division title</span><span className="playoff-berth"><ShieldCheck />Playoff spot</span><span className="eliminated"><CircleX />Eliminated</span><small>Each marker sits on the first week the result became mathematically certain.</small></div>}
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
                const isEndpoint = index === 0 || index === item.points.length - 1;
                const isFirstEndpoint = index === 0;
                const endpointY = isEndpoint ? (isFirstEndpoint ? firstEndpointYs : lastEndpointYs).get(item.team.id) ?? y : y;
                const endpointWasMoved = Math.abs(endpointY - y) > 1;
                const endpointX = endpointWasMoved ? x + (isFirstEndpoint ? 18 : -18) : x;
                const milestones = metric === "rank" ? raceMilestonesAtWeek(milestoneByTeam.get(item.team.id), point.snapshot.weekNumber) : [];
                const milestoneLabel = milestones.length ? `, ${milestones.map((milestone) => RACE_MILESTONE_LABELS[milestone]).join(", ")}` : "";
                const pointLabel = `${teamDisplayName(item.team)}, ${point.snapshot.weekNumber === 0 ? "Preseason" : `Week ${point.snapshot.weekNumber}`}, ${metricLabel} ${formatRaceValue(metric, point.value)}${milestoneLabel}`;
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
                  {isEndpoint && endpointWasMoved && <line className="race-endpoint-leader" x1={x} x2={endpointX} y1={y} y2={endpointY} />}
                  {isEndpoint && (item.team.logoUrl
                    ? <image className="race-endpoint-logo" href={item.team.logoUrl} x={endpointX - 12} y={endpointY - 12} width="24" height="24" preserveAspectRatio="xMidYMid meet" />
                    : <g className="race-endpoint-monogram">
                      <rect x={endpointX - 13} y={endpointY - 13} width="26" height="26" rx="4" fill={tintColor(item.team.color, .82)} />
                      <text x={endpointX} y={endpointY + 3.5} textAnchor="middle">{teamInitials(item.team).slice(0, 3)}</text>
                    </g>)}
                  {milestones.map((milestone, milestoneIndex) => <RaceMilestoneMarker milestone={milestone} division={divisionById.get(item.team.divisionId)} x={x} y={y} index={milestoneIndex} total={milestones.length} key={milestone} />)}
                  <circle className="race-point-focus-ring" cx={isEndpoint ? endpointX : x} cy={isEndpoint ? endpointY : y} r={isEndpoint ? 15 : 10} />
                  <circle className="race-point-hit" cx={isEndpoint ? endpointX : x} cy={isEndpoint ? endpointY : y} r={isEndpoint ? 16 : 11} />
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
          const milestones = metric === "rank" ? raceMilestonesAtWeek(milestoneByTeam.get(item.team.id), point.snapshot.weekNumber) : [];
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
            {milestones.length > 0 && <span className="race-point-tooltip-milestones">{milestones.map((milestone) => <span className={milestone} key={milestone}>{milestone === "top-seed" ? <Medal /> : milestone === "division-title" ? <Trophy /> : milestone === "playoff-berth" ? <ShieldCheck /> : <CircleX />}{RACE_MILESTONE_LABELS[milestone]}</span>)}</span>}
          </div>;
        })()}
      </div>
    </div>
  </section>;
}

function sortableValue(row: TeamSeasonStats, key: TeamSortKey, teamById: Map<string, Team>) {
  if (key === "team") return teamDisplayName(teamById.get(row.teamId)!).toLowerCase();
  if (key === "winPercentage") return row.winPercentage;
  if (key === "record") return row.wins + row.winPercentage; // #19.3 — wins first, win% breaks ties (so RECORD ≠ WIN% sort)
  if (key === "division") { const g = row.divisionWins + row.divisionLosses + row.divisionTies; return g ? (row.divisionWins + row.divisionTies * 0.5) / g : -1; } // #36.1 — count ties as half a win
  if (key === "pointsFor") return row.pointsFor;
  if (key === "pointsAgainst") return row.pointsAgainst;
  if (key === "difference") return row.pointsFor - row.pointsAgainst;
  if (key === "home") return recordPercentage(row.home);
  if (key === "away") return recordPercentage(row.away);
  if (key === "featuredWins") return row.featuredWins;
  if (key === "sov") return row.strengthOfVictory ?? -1;
  if (key === "sos") return row.strengthOfSchedule ?? -1;
  if (key === "currentStreak") return row.streak === "—" || row.streak.startsWith("T") ? 0 : (row.streak.startsWith("W") ? 1 : -1) * Number(row.streak.slice(1));
  if (key === "bestStreak") return row.bestStreak === "—" ? 0 : Number(row.bestStreak.slice(1));
  return row.playoffOdds;
}

export function StatsWorkspace({ schedule, onUpdateTiebreakers, readOnly = false }: { schedule: GeneratedSchedule; onUpdateTiebreakers?: (settings: TiebreakerSettings) => void; readOnly?: boolean }) {
  const [tab, setTab] = useState<StatsTab>("standings");
  const statsTabRefs = useRef<(HTMLButtonElement | null)[]>([]); // H8 — roving tabindex focus targets
  const [leagueLeaderView, setLeagueLeaderView] = useState<LeagueLeaderView>("overall");
  const [divisionId, setDivisionId] = useState("all");
  const [standingsWeek, setStandingsWeek] = useState("current");
  const [sortKey, setSortKey] = useState<TeamSortKey>("winPercentage");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [activeTieSignature, setActiveTieSignature] = useState<string | null>(null);
  const tiebreakerSettings = useMemo(() => normalizeTiebreakerSettings(schedule.setup.tiebreakers), [schedule.setup.tiebreakers]);
  const odds = useMemo(() => calculateSeasonOdds(schedule, 500), [schedule]);
  const oddsByTeam = useMemo(() => new Map(odds.map((row) => [row.teamId, row.playoffOdds])), [odds]);
  const teamStats = useMemo(() => calculateTeamSeasonStats(schedule, oddsByTeam), [schedule, oddsByTeam]);
  const rankHistory = useMemo(() => getLiveRankHistory(schedule), [schedule]);
  const currentRankSnapshot = [...rankHistory].reverse().find((snapshot) => snapshot.playedGames > 0) ?? rankHistory[0];
  const selectedRankSnapshot = standingsWeek === "current" ? currentRankSnapshot : rankHistory.find((snapshot) => String(snapshot.weekNumber) === standingsWeek) ?? currentRankSnapshot;
  const selectedScope: TiebreakerScope = divisionId === "all" ? "league" : "division";
  const selectedResolution = useMemo(() => resolveStandings(schedule, { throughWeek: selectedRankSnapshot.weekNumber, scope: selectedScope, divisionId: divisionId === "all" ? undefined : divisionId }), [schedule, selectedRankSnapshot.weekNumber, selectedScope, divisionId]);
  const previousResolution = useMemo(() => resolveStandings(schedule, { throughWeek: Math.max(0, selectedRankSnapshot.weekNumber - 1), scope: selectedScope, divisionId: divisionId === "all" ? undefined : divisionId }), [schedule, selectedRankSnapshot.weekNumber, selectedScope, divisionId]);
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
  const preseasonRankByTeam = new Map(selectedRankSnapshot.rows.map((row) => [row.teamId, row.preseasonRank]));
  // `preseasonRankByTeam` is always the league-wide seed (rank history only runs
  // league scope). In a division view a row's live `rank` is its within-division
  // rank, so comparing it to a league seed makes the PRE RK cell and FROM-PRE
  // movement nonsense (an eliminated last-place team could show a green ↑). Re-rank
  // the division's teams by their league preseason seed so both are division-relative. (H10)
  const scopedPreseasonRankByTeam = divisionId === "all"
    ? preseasonRankByTeam
    : new Map(
        selectedResolution.rows
          .map((row) => ({ teamId: row.teamId, seed: preseasonRankByTeam.get(row.teamId) ?? Number.POSITIVE_INFINITY }))
          .sort((left, right) => left.seed - right.seed)
          .map((entry, index) => [entry.teamId, index + 1] as [string, number]),
      );
  const previousRankByTeam = new Map(previousResolution.rows.map((row, index) => [row.teamId, index + 1]));
  const visibleStandings: RankedStandingsRow[] = selectedResolution.rows.map((row, index) => {
    const rank = index + 1;
    const previousRank = previousRankByTeam.get(row.teamId) ?? rank;
    return { ...row, rank, previousRank, rankChange: previousRank - rank, preseasonRank: scopedPreseasonRankByTeam.get(row.teamId) ?? rank, tiebreaker: selectedResolution.explanationsByTeam[row.teamId] };
  });
  const visibleOdds = divisionId === "all" ? odds : odds.filter((row) => teamById.get(row.teamId)?.divisionId === divisionId);
  const filterOptions = [{ value: "all", label: "League standings", description: `${schedule.setup.teams.length} teams`, swatch: schedule.setup.color, logoUrl: schedule.setup.logoUrl, monogram: resolveInitials(schedule.setup.initials, leagueAcronym(schedule.setup.name)) }, ...schedule.setup.divisions.map((division) => ({ value: division.id, label: division.name, description: `${schedule.setup.teams.filter((team) => team.divisionId === division.id).length} teams`, swatch: division.color, logoUrl: division.logoUrl, monogram: resolveInitials(division.initials, divisionAcronym(division.name)) }))];
  const rankHistoryOptions = [
    { value: "current", label: "Current live rank", description: currentRankSnapshot.weekNumber ? `Through Week ${currentRankSnapshot.weekNumber}` : "Preseason order" },
    { value: "0", label: "Preseason rank", description: "Starting seed before Week 1" },
    ...rankHistory.filter((snapshot) => snapshot.weekNumber > 0 && snapshot.playedGames > 0).map((snapshot) => ({ value: String(snapshot.weekNumber), label: snapshot.completed ? `After Week ${snapshot.weekNumber}` : `Week ${snapshot.weekNumber} in progress`, description: `${snapshot.playedGames} of ${schedule.weeks.find((week) => week.weekNumber === snapshot.weekNumber)?.games.length ?? 0} games scored` })),
  ];
  const selectedHistoryLabel = selectedRankSnapshot.weekNumber === 0 ? "Preseason seed" : selectedRankSnapshot.completed ? `Final table after Week ${selectedRankSnapshot.weekNumber}` : `Live table during Week ${selectedRankSnapshot.weekNumber}`;
  const isPreseason = selectedRankSnapshot.weekNumber === 0; // #19.1
  const rankHeader = divisionId !== "all"
    ? "DIV RK"
    : isPreseason
    ? "SEED"
    : selectedRankSnapshot.weekNumber === schedule.setup.weeks && selectedRankSnapshot.completed
      ? "FINAL RK"
      : "LIVE RK";
  const completedTeams = teamStats.filter((row) => row.wins + row.losses + row.ties > 0);
  const divisionsPlayed = (row: TeamSeasonStats) => row.divisionWins + row.divisionLosses + row.divisionTies > 0;
  const hottest = (row: TeamSeasonStats) => row.streak.startsWith("W") ? Number(row.streak.slice(1)) : null;
  const sortRows = [...teamStats].sort((left, right) => {
    const leftValue = sortableValue(left, sortKey, teamById);
    const rightValue = sortableValue(right, sortKey, teamById);
    const comparison = typeof leftValue === "string" && typeof rightValue === "string" ? leftValue.localeCompare(rightValue) : Number(leftValue) - Number(rightValue);
    return (sortDirection === "asc" ? comparison : -comparison) || teamById.get(left.teamId)!.name.localeCompare(teamById.get(right.teamId)!.name);
  });
  const onSort = (key: TeamSortKey) => { if (key === sortKey) setSortDirection((current) => current === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDirection(key === "team" ? "asc" : "desc"); } };
  const updateTiebreakers = (settings: TiebreakerSettings) => onUpdateTiebreakers?.(settings);
  const activeTie = selectedResolution.tieGroups.find((tie) => tie.signature === activeTieSignature);
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
    <div className="stats-tabs" role="tablist" aria-label="Standings and statistics">{tabs.map((item, index) => <button
      type="button"
      role="tab"
      id={`stats-tab-${item.key}`}
      aria-controls={`stats-panel-${item.key}`}
      aria-selected={tab === item.key}
      aria-disabled={item.disabled || undefined}
      aria-label={item.disabled ? `${item.label} — available once playoff games have final scores` : undefined}
      tabIndex={tab === item.key ? 0 : -1}
      ref={(el) => { statsTabRefs.current[index] = el; }}
      className={tab === item.key ? "active" : ""}
      onClick={() => { if (!item.disabled) setTab(item.key); }}
      onKeyDown={(event) => {
        // H8 — APG roving tabindex + arrow/Home/End (automatic activation; the
        // disabled Playoff tab is still focusable so it's discoverable, just not selected).
        let next: number | null = null;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        statsTabRefs.current[next]?.focus();
        if (!tabs[next].disabled) setTab(tabs[next].key);
      }}
      key={item.key}
    >{item.disabled && <LockKeyhole aria-hidden="true" />}{item.label}</button>)}</div>
    {tab === "standings" && <div className="stats-tab-panel" role="tabpanel" id="stats-panel-standings" aria-labelledby="stats-tab-standings" tabIndex={0}>
      <div className="stats-filter-bar controls-only"><div className="stats-filter-controls"><CustomSelect label="Standings history" value={standingsWeek} onChange={setStandingsWeek} options={rankHistoryOptions} /><CustomSelect label="Standings scope" value={divisionId} onChange={setDivisionId} options={filterOptions} /></div></div>
      <div className="stats-standings-layout">
        <div className="data-table-wrap"><table className="data-table standings-table"><thead><tr><th>{rankHeader}</th><th>TEAM</th><th>DIVISION</th>{!isPreseason && <><th>PRE RK</th><th>FROM PRE</th></>}<th>STATUS</th><th>REC</th><th>DIV REC</th><th>PCT</th><th>PF</th><th>PA</th><th>DIFF</th><th>STRK</th></tr></thead><tbody>{visibleStandings.map((row) => { const team = teamById.get(row.teamId)!; const division = divisionById.get(team.divisionId)!; const clinch = selectedClinches.get(team.id); const diff = formatDifferential(row.pointsFor - row.pointsAgainst); const played = row.wins + row.losses + row.ties > 0; const rankReason = row.tiebreaker?.rule ? TIEBREAKER_RULE_LABELS[row.tiebreaker.rule] : row.tiebreaker?.resolution === "manual" ? "Manual tie order" : row.tiebreaker?.resolution === "fallback" ? "Fallback order" : ""; return <tr className={clinch?.eliminated ? "is-eliminated" : undefined} key={row.teamId}><td className="standings-rank-cell" title={row.tiebreaker?.label}><RankMovement row={row} />{rankReason && <small className="standings-rank-reason">{rankReason}</small>}</td><td><Link className="standings-team-link" href={`${teamHrefBase}/${team.id}`}><EntityLogo className="team-mark standings-team-logo" color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={50} /><span className="standings-team-copy">{team.city && <small className="standings-team-city team-city">{team.city}</small>}<strong>{team.name}</strong></span></Link></td><td className="standings-division-cell"><DivisionIdentity division={division} /></td>{!isPreseason && <><td className="standings-preseason-cell"><strong>#{row.preseasonRank}</strong></td><td className="standings-preseason-change"><PreseasonMovement row={row} /></td></>}<td className="standings-status-cell"><ClinchBadges timeline={clinch} division={division} compact /><span className="standings-no-status">—</span></td><td>{formatRecord(row)}</td><td>{formatDivisionRecord(row)}</td><td>{played ? row.winPercentage.toFixed(3).replace(/^0/, "") : "—"}</td><td>{formatPoints(row.pointsFor)}</td><td>{formatPoints(row.pointsAgainst)}</td><td className={diff.tone}>{diff.text}</td><td>{row.streak}</td></tr>; })}</tbody></table></div>
        {selectedResolution.tieGroups.length > 0 && <section className="standings-tie-groups" aria-label="Standings tie groups"><header><Swords /><span><strong>{selectedResolution.tieGroups.length} tied group{selectedResolution.tieGroups.length === 1 ? "" : "s"}</strong><small>These teams reached the end of the configured field rules.</small></span></header>{selectedResolution.tieGroups.map((tie) => <article key={tie.signature}><div className="tie-group-teams">{tie.orderedTeamIds.map((teamId, index) => { const team = teamById.get(teamId)!; return <span key={teamId}><b>{index + 1}</b><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={32} /><strong>{teamDisplayName(team)}</strong></span>; })}</div><span><strong>{tie.resolution === "manual" ? "Manual order applied" : "Deterministic fallback applied"}</strong><small>{tie.explanation}</small><em>{tie.appliedRules.map((rule) => TIEBREAKER_RULE_LABELS[rule]).join(" → ") || "No configured rules"}</em></span><button type="button" disabled={readOnly || !onUpdateTiebreakers} onClick={() => setActiveTieSignature(tie.signature)}>{tie.resolution === "manual" ? "Edit order" : "Resolve tie"}</button></article>)}</section>}
        <section className="season-odds-table-panel">
          <header><Gauge /><span><strong>Season odds</strong><small>500 deterministic simulations</small></span></header>
          <div className="data-table-wrap"><table className="data-table season-odds-table"><thead><tr><th>TEAM</th><th>PROJ REC</th><th>PLAYOFF</th><th>DIVISION</th><th>CHAMP</th><th>#1 SEED</th><th>AVG FINISH</th></tr></thead><tbody>{visibleOdds.map((row) => { const team = teamById.get(row.teamId)!; const division = divisionById.get(team.divisionId); return <tr key={team.id}><td><Link className="season-odds-team-link" href={`${teamHrefBase}/${team.id}`}><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={32} /><span><strong>{team.name}</strong><small><span className="team-city">{team.city}</span>{team.city && division ? " · " : ""}{division?.name}</small></span></Link></td><td>{compactProjectedRecord(row.projectedRecord)}</td><td><span className="season-odds-meter"><em>{percentage(row.playoffOdds)}</em><i><b style={{ width: `${Math.max(2, row.playoffOdds * 100)}%`, background: accessibleTeamColor(team.color) }} /></i></span></td><td>{percentage(row.divisionOdds)}</td><td>{percentage(row.championshipOdds)}</td><td>{percentage(row.topSeedOdds)}</td><td>#{row.averageFinish.toFixed(1)}</td></tr>; })}</tbody></table></div>
        </section>
      </div>
      <div className="stats-rule-strip"><ShieldCheck /><span><strong>Standings rules</strong><small>League seeds and division ranks follow the same configured order above. Head-to-head and common opponents are recalculated inside each tied group, and unavailable values fall last. Clinches and eliminations appear only when every remaining outcome confirms them, and the final league order feeds playoff seeding.</small></span></div>
    </div>}
    {tab === "rank-race" && <div className="stats-tab-panel" role="tabpanel" id="stats-panel-rank-race" aria-labelledby="stats-tab-rank-race" tabIndex={0}>
      <div className="stats-filter-bar controls-only"><div className="stats-filter-controls"><CustomSelect label="Race history" value={standingsWeek} onChange={setStandingsWeek} options={rankHistoryOptions} /><CustomSelect label="Race scope" value={divisionId} onChange={setDivisionId} options={filterOptions} /></div></div>
      {rankHistory.some((snapshot) => snapshot.playedGames > 0)
        ? <SeasonRaceChart schedule={schedule} history={rankHistory} throughWeek={selectedRankSnapshot.weekNumber} divisionId={divisionId} />
        : <div className="stats-empty-state" role="status"><TrendingUp aria-hidden /><strong>The race hasn&apos;t started yet</strong><span>Enter Week 1 scores to start the race — each week you score adds a new point to every team&apos;s line.</span></div>}
      <div className="stats-rule-strip"><TrendingUp /><span><strong>Replayable weekly history</strong><small>Every point uses the rank, scoring, record, and point differential frozen after that week. Switch metrics to compare how each race changed through the selected week.</small></span></div>
    </div>}
    {tab === "team-leaders" && <div className="stats-tab-panel" role="tabpanel" id="stats-panel-team-leaders" aria-labelledby="stats-tab-team-leaders" tabIndex={0}><div className="team-leader-grid"><TeamPodiumCard title="Hottest teams" icon={Flame} rows={completedTeams} teamById={teamById} value={hottest} label={(row) => row.streak} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best home record" icon={Home} rows={completedTeams} teamById={teamById} value={(row) => recordGames(row.home) ? recordPercentage(row.home) : null} label={(row) => formatSplitRecord(row.home)} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best away record" icon={Plane} rows={completedTeams} teamById={teamById} value={(row) => recordGames(row.away) ? recordPercentage(row.away) : null} label={(row) => formatSplitRecord(row.away)} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best division record" icon={ShieldCheck} rows={completedTeams} teamById={teamById} value={(row) => { const g = row.divisionWins + row.divisionLosses + row.divisionTies; return g ? (row.divisionWins + row.divisionTies * 0.5) / g : null; }} label={(row) => `${row.divisionWins}-${row.divisionLosses}${row.divisionTies ? `-${row.divisionTies}` : ""}`} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best division point diff" icon={Swords} rows={completedTeams} teamById={teamById} value={(row) => divisionsPlayed(row) ? row.divisionPointsFor - row.divisionPointsAgainst : null} label={(row) => formatDifferential(row.divisionPointsFor - row.divisionPointsAgainst).text} hrefBase={teamHrefBase} /><TeamPodiumCard title="Highest scoring" icon={Zap} rows={completedTeams} teamById={teamById} value={(row) => row.pointsFor} label={(row) => `${formatPoints(row.pointsFor)} PF`} hrefBase={teamHrefBase} /><TeamPodiumCard title="Best point differential" icon={Target} rows={completedTeams} teamById={teamById} value={(row) => row.pointsFor - row.pointsAgainst} label={(row) => formatDifferential(row.pointsFor - row.pointsAgainst).text} hrefBase={teamHrefBase} /></div></div>}
    {tab === "league-leaders" && <div className="stats-tab-panel" role="tabpanel" id="stats-panel-league-leaders" aria-labelledby="stats-tab-league-leaders" tabIndex={0}><div className="stats-rule-strip"><Trophy /><span><strong>Game quality seed</strong><small>Quality equals margin rank plus total-points rank. Lower is better; tied values share medals. Upsets use each team’s frozen rank entering that week.</small></span><span className="badge-legend">{(["GOTW", "Upset", "Shootout"] as const).map((badge) => <GameBadgeChip badge={badge} key={badge} />)}</span></div><div className="league-leader-browser"><div className="leader-category-tabs" role="tablist" aria-label="League leader category">{leagueLeaderTabs.map((item) => <button type="button" role="tab" aria-selected={leagueLeaderView === item.key} className={leagueLeaderView === item.key ? "active" : ""} onClick={() => setLeagueLeaderView(item.key)} key={item.key}>{item.label}</button>)}</div><div className="league-leader-focus">{leagueLeaderPanels[leagueLeaderView]}</div></div></div>}
    {tab === "playoffs" && hasPlayoffResults && <div className="stats-tab-panel" role="tabpanel" id="stats-panel-playoffs" aria-labelledby="stats-tab-playoffs" tabIndex={0}><div className="game-leader-grid playoff-stat-grid"><GameHighlightPanel title="Greatest playoff games" schedule={schedule} items={playoffAnalytics} metric="qualityScore" direction="asc" playoff /><GameHighlightPanel title="Closest playoff games" schedule={schedule} items={playoffAnalytics} metric="margin" direction="asc" playoff /><GameHighlightPanel title="Highest-scoring playoff games" schedule={schedule} items={playoffAnalytics} metric="total" direction="desc" playoff /></div></div>}
    {tab === "team-stats" && <div className="stats-tab-panel" role="tabpanel" id="stats-panel-team-stats" aria-labelledby="stats-tab-team-stats" tabIndex={0}><div className="team-stats-table-wrap"><table className="team-stats-table"><thead><tr><SortHeader label="TEAM" sortKey="team" active={sortKey} direction={sortDirection} onSort={onSort} /><th scope="col" className="team-stats-division-head">DIVISION</th><SortHeader label="RECORD" sortKey="record" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="WIN %" sortKey="winPercentage" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="DIV" sortKey="division" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="PF" sortKey="pointsFor" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="PA" sortKey="pointsAgainst" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="DIFF" sortKey="difference" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="HOME" sortKey="home" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="AWAY" sortKey="away" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="GOTW" sortKey="featuredWins" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="SOV" sortKey="sov" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="SOS" sortKey="sos" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="STREAK" sortKey="currentStreak" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="BEST" sortKey="bestStreak" active={sortKey} direction={sortDirection} onSort={onSort} /><SortHeader label="PO %" sortKey="playoff" active={sortKey} direction={sortDirection} onSort={onSort} /></tr></thead><tbody>{sortRows.map((row) => { const team = teamById.get(row.teamId)!; const division = divisionById.get(team.divisionId)!; return <tr key={row.teamId}><td><Link href={`${teamHrefBase}/${team.id}`}><EntityLogo className="team-stats-team-logo" color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={28} /><span>{team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong><ClinchBadges timeline={currentClinches.get(team.id)} division={division} compact /></span></Link></td><td className="team-stats-division-cell"><DivisionIdentity division={division} /></td><td>{row.record}</td><td>{row.wins + row.losses + row.ties === 0 ? "—" : decimal(row.winPercentage)}</td><td>{formatDivisionRecord(row)}</td><td>{formatPoints(row.pointsFor)}</td><td>{formatPoints(row.pointsAgainst)}</td>{(() => { const diff = formatDifferential(row.pointsFor - row.pointsAgainst); return <td className={diff.tone}>{diff.text}</td>; })()}<td>{formatSplitRecord(row.home)}</td><td>{formatSplitRecord(row.away)}</td><td>{row.featuredWins}</td><td>{decimal(row.strengthOfVictory)}</td><td>{decimal(row.strengthOfSchedule)}</td><td>{row.streak}</td><td>{row.bestStreak}</td><td>{percentage(row.playoffOdds)}</td></tr>; })}</tbody></table></div><dl className="stats-abbr-legend" aria-label="Column key"><div><dt>PF / PA</dt><dd>Points for / against</dd></div><div><dt>DIFF</dt><dd>Point differential</dd></div><div><dt>GOTW</dt><dd>Game-of-the-week wins</dd></div><div><dt>SOV</dt><dd>Strength of victory</dd></div><div><dt>SOS</dt><dd>Strength of schedule</dd></div><div><dt>STREAK</dt><dd>Current / best win streak</dd></div><div><dt>PO %</dt><dd>Projected playoff odds</dd></div></dl></div>}
    {activeTie && <TieResolutionModal tie={activeTie} schedule={schedule} onClose={() => setActiveTieSignature(null)} onSave={(orderedTeamIds) => { updateTiebreakers({ ...tiebreakerSettings, manualOverrides: { ...tiebreakerSettings.manualOverrides, [activeTie.signature]: orderedTeamIds } }); setActiveTieSignature(null); }} />}
  </div>;
}
