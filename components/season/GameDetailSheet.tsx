"use client";

import * as React from "react";
import { ArrowLeft, CircleAlert, MapPin, Shield, Star, X } from "lucide-react";
import { AllStarBadge } from "@/components/season/AllStarBadge";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { Modal } from "@/components/ui/Modal";
import { buildAllStars } from "@/lib/allStars";
import { accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { buildGameDetailVM, type GameDetailPlayerStat, type GameDetailSideVM, type GameDetailSlotVM } from "@/lib/gameDetail";
import { type LineupTemplate, type SlotKey } from "@/lib/playerData";
import { formatPoints } from "@/lib/statistics";
import { teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule } from "@/lib/types";

const NFL_TEAM_COLORS: Record<string, string> = {
  ARI: "#97233f", ATL: "#a71930", BAL: "#241773", BUF: "#00338d", CAR: "#0085ca", CHI: "#0b162a", CIN: "#fb4f14",
  CLE: "#311d00", DAL: "#003594", DEN: "#fb4f14", DET: "#0076b6", GB: "#203731", HOU: "#03202f", IND: "#002c5f",
  JAX: "#006778", KC: "#e31837", LV: "#000000", LAC: "#0080c6", LAR: "#003594", MIA: "#008e97", MIN: "#4f2683",
  NE: "#002244", NO: "#d3bc8d", NYG: "#0b2265", NYJ: "#125740", PHI: "#004c54", PIT: "#ffb612", SEA: "#002244",
  SF: "#aa0000", TB: "#d50a0a", TEN: "#4b92db", WAS: "#5a1414",
};

function teamDisplay(side: GameDetailSideVM, showCity: boolean) {
  return `${showCity && side.team.city ? `${side.team.city} ` : ""}${side.team.name}`;
}

function scoreLabel(side: GameDetailSideVM) {
  if (side.starterTotal != null) return formatPoints(side.starterTotal);
  if (side.platformTotal != null) return formatPoints(side.platformTotal);
  return "--";
}

type PlayerAllStarBadge = { slot: string; rank?: number; week: number; points: number };

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

function allStarBadgeKey(teamId: string, week: number, canonicalPlayerId: string) {
  return `${teamId}:${week}:${canonicalPlayerId}`;
}

function buildAllStarBadges(schedule: GeneratedSchedule, playerStats: GameDetailPlayerStat[]) {
  const lineupTemplate = inferLineupTemplate(schedule, playerStats);
  if (!lineupTemplate) return new Map<string, PlayerAllStarBadge>();
  const slotCounts = lineupTemplate.slots.reduce((map, slot) => map.set(slot.slot, (map.get(slot.slot) ?? 0) + 1), new Map<SlotKey, number>());
  const allStars = buildAllStars({ lineupTemplate, stats: playerStats });
  const badges = new Map<string, PlayerAllStarBadge>();
  for (const week of allStars.weeks) {
    for (const slot of week.slots) {
      const rank = (slotCounts.get(slot.slot) ?? 0) > 1 ? slot.slotRank : undefined;
      for (const winner of slot.winners) {
        badges.set(allStarBadgeKey(winner.teamId, week.week, winner.canonicalPlayerId), {
          slot: rank ? `${slot.slot}${rank}` : slot.slotLabel,
          rank,
          week: week.week,
          points: winner.points,
        });
      }
    }
  }
  return badges;
}

function PlayerRow({ row, badge }: { row: GameDetailSlotVM; badge?: PlayerAllStarBadge }) {
  const badgeColor = row.nflTeam ? NFL_TEAM_COLORS[row.nflTeam.toUpperCase()] ?? "#eef1f0" : "#eef1f0";
  const badgeInk = row.nflTeam ? readableTextColor(badgeColor) : "var(--ink)";
  return <li className={`gdm-player-row status-${row.lineupStatus}`}>
    <span className="gdm-slot-badge">{row.slot}</span>
    <span className="gdm-player-main">
      <strong>{row.name}</strong>
      <small>{row.position}{row.nflTeam ? ` · ${row.nflTeam}` : ""}</small>
    </span>
    <span className="gdm-nfl-badge" style={{ background: badgeColor, color: badgeInk }}>{row.nflTeam || row.position}</span>
    <span className="gdm-player-points">
      <strong>{formatPoints(row.points)}</strong>
      {row.projected != null && <small>Proj {formatPoints(row.projected)}</small>}
    </span>
    <span className="gdm-allstar-slot" aria-label="All-Star badge slot">{badge && <AllStarBadge {...badge} />}</span>
  </li>;
}

function PlayerSection({ title, rows, empty, allStarBadges }: { title: string; rows: GameDetailSlotVM[]; empty: string; allStarBadges: Map<string, PlayerAllStarBadge> }) {
  return <section className="gdm-roster-section">
    <header><strong>{title}</strong><small>{rows.length}</small></header>
    {rows.length ? <ul>{rows.map((row) => <PlayerRow row={row} badge={allStarBadges.get(allStarBadgeKey(row.teamId, row.week, row.canonicalPlayerId))} key={row.key} />)}</ul> : <p>{empty}</p>}
  </section>;
}

function TeamPanel({ side, showCity, allStarBadges }: { side: GameDetailSideVM; showCity: boolean; allStarBadges: Map<string, PlayerAllStarBadge> }) {
  const accent = accessibleTeamColor(side.team.color);
  return <article className="gdm-team-panel" style={{ "--team": side.team.color, "--team-ink": accent } as React.CSSProperties}>
    <header>
      <EntityLogo color={side.team.color} logoUrl={side.team.logoUrl} monogram={teamInitials(side.team)} size={52} />
      <span>
        <small>#{side.rank}{side.division ? " · " : ""}{side.division && <><DivisionMark division={side.division} /> {side.division.name}</>}</small>
        <strong>{teamDisplay(side, showCity)}</strong>
      </span>
      <b>{scoreLabel(side)}</b>
    </header>
    {side.hasPlayerData ? <>
      <PlayerSection title="Starters" rows={side.starters} empty="No starters synced for this team." allStarBadges={allStarBadges} />
      <PlayerSection title="Bench" rows={side.bench} empty="No bench players synced." allStarBadges={allStarBadges} />
      {side.reserves.length > 0 && <PlayerSection title="IR / Reserve" rows={side.reserves} empty="No reserve players synced." allStarBadges={allStarBadges} />}
    </> : <div className="gdm-team-fallback">
      <CircleAlert aria-hidden="true" />
      <span><strong>Roster not synced yet</strong><small>Showing the team-level score only.</small></span>
    </div>}
  </article>;
}

export function GameDetailSheet({
  schedule,
  gameId,
  playerStats,
  winProbability,
  onClose,
}: {
  schedule: GeneratedSchedule;
  gameId: string;
  playerStats: GameDetailPlayerStat[];
  winProbability?: { away: number; home: number };
  onClose: () => void;
}) {
  const allStarBadges = React.useMemo(() => buildAllStarBadges(schedule, playerStats), [schedule, playerStats]);
  const vm = buildGameDetailVM(schedule, gameId, playerStats);
  if (!vm) return null;
  const showCity = schedule.setup.display?.cityNames !== false;
  const stateLabel = vm.status === "final" ? "Final" : "Upcoming";
  const isBroadcast = vm.featured;

  return <Modal
    className={`game-detail-modal ${isBroadcast ? "is-broadcast" : ""}`}
    backdropClassName="game-detail-modal-backdrop"
    labelledBy="game-detail-title"
    onClose={onClose}
  >
    <header className="gdm-header">
      <button type="button" className="gdm-back" aria-label="Back to schedule" onClick={onClose}><ArrowLeft /></button>
      <div className="gdm-title-lockup">
        <span>{isBroadcast ? <><Star fill="currentColor" /> Game of the Week</> : `Week ${vm.weekNumber}`}</span>
        <h2 id="game-detail-title">{teamDisplay(vm.away, showCity)} at {teamDisplay(vm.home, showCity)}</h2>
        <small><MapPin /> {vm.stadium} · {stateLabel} · Rating {vm.ratingScore10.toFixed(1)}/10</small>
      </div>
      <button type="button" className="gdm-close" aria-label="Close game detail" onClick={onClose}><X /></button>
    </header>
    <div className="gdm-scoreline" style={{ "--away": vm.away.team.color, "--home": vm.home.team.color } as React.CSSProperties}>
      <span><small>Away</small><strong>{scoreLabel(vm.away)}</strong></span>
      <b>@</b>
      <span><small>Home</small><strong>{scoreLabel(vm.home)}</strong></span>
      {winProbability && vm.status !== "final" && <em>{Math.round(winProbability.away * 100)}% / {Math.round(winProbability.home * 100)}%</em>}
    </div>
    {vm.unsynced && <div className="gdm-unsynced" role="status"><Shield /><span><strong>Player data has not synced for this game.</strong><small>The modal falls back to real team-level schedule data until player rows exist.</small></span></div>}
    <div className="gdm-rosters">
      <TeamPanel side={vm.away} showCity={showCity} allStarBadges={allStarBadges} />
      <TeamPanel side={vm.home} showCity={showCity} allStarBadges={allStarBadges} />
    </div>
  </Modal>;
}
