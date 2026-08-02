"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Medal, Minus, Sparkles, Trophy } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { buildAllStars } from "@/lib/allStars";
import { type GameDetailPlayerStat } from "@/lib/gameDetail";
import { buildMvt, type MvtAwardResult, type MvtBucket, type MvtMovement, type MvtTeamResult } from "@/lib/mvt";
import { type LineupTemplate, type SlotKey } from "@/lib/playerData";
import { formatPoints } from "@/lib/statistics";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, Team } from "@/lib/types";

const BUCKETS: Array<{ key: MvtBucket; label: string; short: string }> = [
  { key: "positional", label: "Positional Awards", short: "POS" },
  { key: "achievement", label: "Achievement Awards", short: "ACH" },
  { key: "divisionLeague", label: "Divisional / League", short: "DIV" },
  { key: "bonus", label: "Bonus Awards", short: "BON" },
];

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
  return {
    provider: starters[0]?.provider ?? "sleeper",
    season: schedule.setup.seasonYear,
    slots,
  };
}

function MovementIcon({ movement }: { movement: MvtMovement }) {
  if (movement === "up") return <ArrowUp aria-label="Moved up" />;
  if (movement === "down") return <ArrowDown aria-label="Moved down" />;
  return <Minus aria-label="No movement" />;
}

function bucketValue(row: MvtTeamResult, bucket: MvtBucket) {
  if (bucket === "positional") return row.positional;
  if (bucket === "achievement") return row.achievement;
  if (bucket === "divisionLeague") return row.divisionLeague;
  return row.bonus;
}

function TeamLine({ row, team, maxTotal }: { row: MvtTeamResult; team: Team; maxTotal: number }) {
  const ratio = maxTotal > 0 ? row.total / maxTotal : 0;
  return <article className="mvt-team-line" style={{ "--team": team.color, "--mvt-t": ratio } as React.CSSProperties}>
    <b>#{row.rank}</b>
    <EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={46} />
    <span>
      <strong>{teamDisplayName(team)}</strong>
      <small>(Prev --) <MovementIcon movement={row.movement} /></small>
    </span>
    <em>{formatPoints(row.total)}</em>
    <i aria-hidden="true"><span /></i>
  </article>;
}

function WinnerCell({ award, place, teamById }: { award: MvtAwardResult; place: 1 | 2 | 3; teamById: Map<string, Team> }) {
  const winners = award.winners.filter((winner) => winner.place === place);
  if (!winners.length) return <td className="mvt-award-empty">--</td>;
  return <td>{winners.map((winner) => {
    const team = teamById.get(winner.teamId);
    return <span className="mvt-award-winner" key={`${winner.teamId}-${winner.points}`}>
      {team && <EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={24} />}
      <strong>{team ? team.name : winner.teamId}</strong>
      <small>{formatPoints(winner.value)} / +{formatPoints(winner.points)}</small>
    </span>;
  })}</td>;
}

function AwardTable({ title, awards, teamById }: { title: string; awards: MvtAwardResult[]; teamById: Map<string, Team> }) {
  return <section className="mvt-award-panel">
    <header><Medal /><span><strong>{title}</strong><small>{awards.length} scored awards</small></span></header>
    <div className="mvt-award-table-wrap">
      <table className="mvt-award-table">
        <thead><tr><th>Award</th><th>1st</th><th>2nd</th><th>3rd</th></tr></thead>
        <tbody>{awards.map((award) => <tr key={award.id}>
          <th scope="row">{award.label}</th>
          <WinnerCell award={award} place={1} teamById={teamById} />
          <WinnerCell award={award} place={2} teamById={teamById} />
          <WinnerCell award={award} place={3} teamById={teamById} />
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

export function MvtWorkspace({ schedule, playerStats }: { schedule: GeneratedSchedule; playerStats: GameDetailPlayerStat[] }) {
  const [activeBucket, setActiveBucket] = React.useState<MvtBucket>("positional");
  const teamById = React.useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule.setup.teams]);
  const lineupTemplate = React.useMemo(() => inferLineupTemplate(schedule, playerStats), [schedule, playerStats]);
  const allStars = React.useMemo(() => lineupTemplate ? buildAllStars({ lineupTemplate, stats: playerStats }) : null, [lineupTemplate, playerStats]);
  const mvt = React.useMemo(() => lineupTemplate ? buildMvt({ schedule, lineupTemplate, playerStats, allStars: allStars ?? undefined }) : null, [schedule, lineupTemplate, playerStats, allStars]);
  const maxTotal = Math.max(0, ...(mvt?.teams.map((row) => row.total) ?? []));
  const awardsByBucket = React.useMemo(() => new Map(BUCKETS.map((bucket) => [bucket.key, (mvt?.awards ?? []).filter((award) => award.bucket === bucket.key)])), [mvt]);
  const activeBucketLabel = BUCKETS.find((bucket) => bucket.key === activeBucket)?.label ?? "Awards";

  if (!mvt || !mvt.teams.length) {
    return <section className="mvt-workspace mvt-empty">
      <div className="mvt-empty-panel">
        <Sparkles />
        <span><strong>MVT unlocks after player data syncs.</strong><small>League scores still work everywhere else; this page waits for real starter rows so no award data is invented.</small></span>
      </div>
    </section>;
  }

  const leader = mvt.teams[0];
  const leaderTeam = teamById.get(leader.teamId);

  return <div className="mvt-workspace">
    <section className="mvt-hero">
      <div>
        <small>{schedule.setup.abbreviation} / {schedule.setup.seasonYear}</small>
        <h2>Most Valuable Team</h2>
        <p>MVT is the league power ranking, scored from positional, achievement, division/league, and bonus awards.</p>
      </div>
      {leaderTeam && <aside>
        <Trophy />
        <span><small>Current leader</small><strong>{teamDisplayName(leaderTeam)}</strong></span>
        <b>{formatPoints(leader.total)}</b>
      </aside>}
    </section>

    <section className="mvt-overview" aria-label="MVT power ranking">
      <header>
        <span><strong>Power Ranking</strong><small>Shared MVT scale</small></span>
        <em>{mvt.teams.length} teams</em>
      </header>
      <div className="mvt-leaderboard">
        {mvt.teams.map((row) => {
          const team = teamById.get(row.teamId);
          return team ? <TeamLine key={row.teamId} row={row} team={team} maxTotal={maxTotal} /> : null;
        })}
      </div>
    </section>

    <section className="mvt-buckets" aria-label="MVT score buckets">
      {BUCKETS.map((bucket) => <article key={bucket.key}>
        <small>{bucket.short}</small>
        <strong>{formatPoints(mvt.teams.reduce((sum, row) => sum + bucketValue(row, bucket.key), 0))}</strong>
        <span>{bucket.label}</span>
      </article>)}
    </section>

    <div className="mvt-tabs" role="tablist" aria-label="MVT award tables">
      {BUCKETS.map((bucket) => <button
        type="button"
        role="tab"
        aria-selected={activeBucket === bucket.key}
        className={activeBucket === bucket.key ? "active" : ""}
        key={bucket.key}
        onClick={() => setActiveBucket(bucket.key)}
      >{bucket.label}</button>)}
    </div>

    <AwardTable title={activeBucketLabel} awards={awardsByBucket.get(activeBucket) ?? []} teamById={teamById} />
  </div>;
}
