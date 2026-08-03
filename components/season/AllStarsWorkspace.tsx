"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, LineChart, Shield, Sparkles, Star } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { PointChip } from "@/components/ui/PointChip";
import { buildAllStars, type AllStarWinner, type WeeklyAllStarSlot } from "@/lib/allStars";
import { isGamePlayed } from "@/lib/game";
import { type GameDetailPlayerStat } from "@/lib/gameDetail";
import { type LineupTemplate, type SlotKey } from "@/lib/playerData";
import { accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, Team } from "@/lib/types";

const NFL_TEAM_COLORS: Record<string, string> = {
  ARI: "#97233f", ATL: "#a71930", BAL: "#241773", BUF: "#00338d", CAR: "#0085ca", CHI: "#0b162a", CIN: "#fb4f14",
  CLE: "#311d00", DAL: "#003594", DEN: "#fb4f14", DET: "#0076b6", GB: "#203731", HOU: "#03202f", IND: "#002c5f",
  JAX: "#006778", KC: "#e31837", LV: "#000000", LAC: "#0080c6", LAR: "#003594", MIA: "#008e97", MIN: "#4f2683",
  NE: "#002244", NO: "#d3bc8d", NYG: "#0b2265", NYJ: "#125740", PHI: "#004c54", PIT: "#ffb612", SEA: "#002244",
  SF: "#aa0000", TB: "#d50a0a", TEN: "#4b92db", WAS: "#5a1414",
};

function inferLineupTemplate(schedule: GeneratedSchedule, rows: GameDetailPlayerStat[]): LineupTemplate | null {
  const starters = rows.filter((row) => row.lineupStatus === "starter" && row.starterIndex != null && row.inferredSlot);
  if (!starters.length) return null;
  const bestByIndex = new Map<number, GameDetailPlayerStat>();
  for (const row of starters) {
    const current = bestByIndex.get(row.starterIndex!);
    if (!current || row.week < current.week) bestByIndex.set(row.starterIndex!, row);
  }
  const counts = new Map<SlotKey, number>();
  const slots = [...bestByIndex.values()].sort((left, right) => left.starterIndex! - right.starterIndex!).map((row) => {
    const slot = row.inferredSlot!;
    const rank = (counts.get(slot) ?? 0) + 1;
    counts.set(slot, rank);
    return {
      index: row.starterIndex!,
      slot,
      label: rank > 1 ? `${slot}${rank}` : slot,
      rawSlot: row.rawSlot,
      group: "starter" as const,
      rank,
      confidence: row.slotConfidence,
    };
  });
  return { provider: starters[0]?.provider ?? "sleeper", season: schedule.setup.seasonYear, slots };
}

function completedWeeks(schedule: GeneratedSchedule) {
  return schedule.weeks
    .filter((week) => week.weekNumber <= schedule.setup.weeks && week.games.length > 0 && week.games.every(isGamePlayed))
    .map((week) => week.weekNumber);
}

function winnerKey(winner: AllStarWinner) {
  return `${winner.week}:${winner.teamId}:${winner.canonicalPlayerId}:${winner.points}`;
}

function winnerRow(winner: AllStarWinner, rows: GameDetailPlayerStat[]) {
  return rows.find((row) => row.week === winner.week && row.teamId === winner.teamId && row.canonicalPlayerId === winner.canonicalPlayerId)
    ?? rows.find((row) => row.week === winner.week && row.teamId === winner.teamId && row.providerPlayerId === winner.providerPlayerId);
}

function PlayerBadge({ row }: { row?: GameDetailPlayerStat }) {
  const nfl = row?.nflTeam?.toUpperCase();
  const knownColor = nfl ? NFL_TEAM_COLORS[nfl] : undefined;
  const color = knownColor ?? "var(--strength-bg)";
  const ink = knownColor ? readableTextColor(knownColor) : "var(--ink)";
  return <span className="allstar-nfl-badge" style={{ background: color, color: ink }}>{nfl || row?.position || "--"}</span>;
}

function WinnerPill({ winner, team, rows }: { winner: AllStarWinner; team?: Team; rows: GameDetailPlayerStat[] }) {
  const row = winnerRow(winner, rows);
  return <span className="allstar-player-pill">
    <PlayerBadge row={row} />
    <span>
      <strong>{row?.displayName ?? winner.providerPlayerId}</strong>
      <small>{row?.position ?? "Player"}{team ? ` / ${team.name}` : ""}</small>
    </span>
  </span>;
}

function SlotRow({ slot, teamById, rows }: { slot: WeeklyAllStarSlot; teamById: Map<string, Team>; rows: GameDetailPlayerStat[] }) {
  const firstTeam = teamById.get(slot.winners[0]?.teamId ?? "");
  const accent = firstTeam ? accessibleTeamColor(firstTeam.color) : "var(--surface)";
  return <article className="allstar-slot-row" style={{ "--team": firstTeam?.color ?? "var(--field)", "--team-ink": accent } as React.CSSProperties}>
    <span className="allstar-slot-badge">{slot.slotLabel}</span>
    {firstTeam && <EntityLogo color={firstTeam.color} logoUrl={firstTeam.logoUrl} monogram={teamInitials(firstTeam)} size={42} />}
    <div>
      {slot.winners.map((winner) => <WinnerPill winner={winner} team={teamById.get(winner.teamId)} rows={rows} key={winnerKey(winner)} />)}
    </div>
    <PointChip value={slot.score} />
  </article>;
}

function TrendChart({ weeks }: { weeks: Array<{ week: number; total: number }> }) {
  if (!weeks.length) return null;
  const width = 640;
  const height = 150;
  const padding = 18;
  const min = Math.min(...weeks.map((week) => week.total));
  const max = Math.max(...weeks.map((week) => week.total));
  const spread = Math.max(1, max - min);
  const xFor = (index: number) => padding + (weeks.length === 1 ? 0.5 : index / (weeks.length - 1)) * (width - padding * 2);
  const yFor = (total: number) => height - padding - ((total - min) / spread) * (height - padding * 2);
  const points = weeks.map((week, index) => `${xFor(index)},${yFor(week.total)}`).join(" ");
  return <section className="allstar-trend">
    <header>
      <LineChart />
      <span><strong>Weekly Total Trend</strong><small>Range markers use the shared strength scale. Prior-year comparison unlocks with history.</small></span>
    </header>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="All-Star weekly total trend">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
      <polyline points={points} />
      <polyline className="prior" points={`${padding},${height / 2} ${width - padding},${height / 2}`} />
      {weeks.map((week, index) => {
        const tone = week.total === max ? "max" : week.total === min ? "min" : "";
        return <g className={tone} key={week.week}>
          <circle cx={xFor(index)} cy={yFor(week.total)} r="5" />
          <text x={xFor(index)} y={height - 4} textAnchor="middle">W{week.week}</text>
        </g>;
      })}
    </svg>
  </section>;
}

export function AllStarsWorkspace({ schedule, playerStats }: { schedule: GeneratedSchedule; playerStats: GameDetailPlayerStat[] }) {
  const teamById = React.useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule.setup.teams]);
  const lineupTemplate = React.useMemo(() => inferLineupTemplate(schedule, playerStats), [schedule, playerStats]);
  const completed = React.useMemo(() => completedWeeks(schedule), [schedule]);
  const allStars = React.useMemo(() => lineupTemplate ? buildAllStars({ lineupTemplate, stats: playerStats, completedWeeks: completed.length ? completed : undefined }) : null, [lineupTemplate, playerStats, completed]);
  const weeks = React.useMemo(() => allStars?.weeks ?? [], [allStars]);
  const [selectedWeek, setSelectedWeek] = React.useState<number | null>(null);
  const activeWeek = weeks.find((week) => week.week === selectedWeek) ?? weeks.at(-1) ?? null;

  if (!allStars || !activeWeek) {
    return <section className="allstars-workspace allstars-empty">
      <div className="allstars-empty-panel">
        <Shield />
        <span><strong>Connect a public ESPN/Sleeper league to unlock All-Stars.</strong><small>The board waits for a completed week with real platform-scored starter rows so weekly awards are never filled with fake data.</small></span>
      </div>
    </section>;
  }

  const activeIndex = weeks.findIndex((week) => week.week === activeWeek.week);
  const countRows = [...allStars.seasonCountByTeam.entries()]
    .map(([teamId, count]) => ({ team: teamById.get(teamId), count }))
    .filter((row): row is { team: Team; count: number } => Boolean(row.team))
    .sort((left, right) => right.count - left.count || teamDisplayName(left.team).localeCompare(teamDisplayName(right.team)));
  const trendWeeks = weeks.map((week) => ({ week: week.week, total: week.total }));

  return <div className="allstars-workspace">
    <section className="allstars-hero">
      <div>
        <small>{schedule.setup.abbreviation} / {schedule.setup.seasonYear}</small>
        <h2>All-Star Team of the Week</h2>
        <p>Every slot is awarded from real platform-scored starters for the selected completed week.</p>
      </div>
      <div className="allstars-week-switcher" aria-label="All-Star week selector">
        <button type="button" aria-label="Previous All-Star week" disabled={activeIndex <= 0} onClick={() => setSelectedWeek(weeks[Math.max(0, activeIndex - 1)]?.week ?? activeWeek.week)}><ChevronLeft /></button>
        <span><small>Week</small><strong>{activeWeek.week}</strong></span>
        <button type="button" aria-label="Next All-Star week" disabled={activeIndex >= weeks.length - 1} onClick={() => setSelectedWeek(weeks[Math.min(weeks.length - 1, activeIndex + 1)]?.week ?? activeWeek.week)}><ChevronRight /></button>
      </div>
    </section>

    <section className="allstars-summary">
      <span><Star fill="currentColor" /><small>Weekly total</small><PointChip value={activeWeek.total} /></span>
      <span><Sparkles /><small>Slots awarded</small><strong>{activeWeek.slots.length}</strong></span>
      <span><LineChart /><small>Weeks tracked</small><strong>{weeks.length}</strong></span>
    </section>

    <div className="allstars-grid">
      <section className="allstars-board" aria-label={`Week ${activeWeek.week} All-Star board`}>
        <header><strong>Week {activeWeek.week} Board</strong><small>{activeWeek.slots.length} lineup slots</small></header>
        <div>{activeWeek.slots.map((slot) => <SlotRow slot={slot} teamById={teamById} rows={playerStats} key={`${slot.week}:${slot.slotIndex}`} />)}</div>
      </section>
      <aside className="allstars-rail" aria-label="All-Stars by team">
        <header><strong>All-Stars by Team</strong><small>Season count</small></header>
        {countRows.map((row, index) => <article style={{ "--team": row.team.color } as React.CSSProperties} key={row.team.id}>
          <b>#{index + 1}</b>
          <EntityLogo color={row.team.color} logoUrl={row.team.logoUrl} monogram={teamInitials(row.team)} size={34} />
          <span><strong>{teamDisplayName(row.team)}</strong><small>{row.count} selection{row.count === 1 ? "" : "s"}</small></span>
          <em>{row.count}</em>
        </article>)}
      </aside>
    </div>

    <TrendChart weeks={trendWeeks} />
  </div>;
}
