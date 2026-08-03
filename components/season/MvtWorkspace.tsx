"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Medal, Minus, Sparkles, Trophy } from "lucide-react";
import { ConferenceMark } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { PointChip } from "@/components/ui/PointChip";
import { buildAllStars } from "@/lib/allStars";
import { type GameDetailPlayerStat } from "@/lib/gameDetail";
import { hasConferences } from "@/lib/conferences";
import { buildMvt, type MvtAwardResult, type MvtBucket, type MvtMovement, type MvtTeamResult } from "@/lib/mvt";
import { type LineupTemplate, type SlotKey } from "@/lib/playerData";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, PastChampion, Team } from "@/lib/types";

type MvtPanelKey = MvtBucket | "conference";

const BUCKETS: Array<{ key: MvtBucket; label: string; short: string }> = [
  { key: "positional", label: "Positional Awards", short: "POS" },
  { key: "achievement", label: "Achievement Awards", short: "ACH" },
  { key: "divisionLeague", label: "Divisional / League", short: "DIV" },
  { key: "bonus", label: "Bonus Awards", short: "BON" },
];

const PLACEHOLDER_AWARDS: Record<MvtPanelKey, string[]> = {
  positional: ["Starter slot average", "Starter slot high score"],
  achievement: ["MVP", "Total score average", "Total score high", "All-Star players", "Game-of-the-week record", "Blowouts", "Upsets", "Trades", "Waiver wire"],
  divisionLeague: ["Best overall record", "Best divisional record", "Best cross-divisional record", "Sweeps", "Longest win streak", "Home record", "Away record"],
  bonus: ["Game of the Week", "Blowout bonus", "Upset bonus"],
  conference: ["Conference record", "Conference points", "Conference finish"],
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
    <PointChip value={row.total} className="mvt-total-chip" />
    <i aria-hidden="true"><span /></i>
  </article>;
}

function PendingTeamLine({ team, rank }: { team: Team; rank: number }) {
  return <article className="mvt-team-line is-pending" style={{ "--team": team.color, "--mvt-t": 0 } as React.CSSProperties}>
    <b>#{rank}</b>
    <EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={46} />
    <span>
      <strong>{teamDisplayName(team)}</strong>
      <small>Awaiting platform-scored starter rows</small>
    </span>
    <PointChip value={0} className="mvt-total-chip" />
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
      <PointChip value={winner.value} detail={`+${winner.points.toFixed(2)}`} />
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

function PlaceholderAwardTable({ title, awards }: { title: string; awards: string[] }) {
  return <section className="mvt-award-panel is-pending">
    <header><Medal /><span><strong>{title}</strong><small>Categories are ready; winners appear after scored starter rows sync.</small></span></header>
    <div className="mvt-award-table-wrap">
      <table className="mvt-award-table">
        <thead><tr><th>Award</th><th>1st</th><th>2nd</th><th>3rd</th></tr></thead>
        <tbody>{awards.map((award) => <tr key={award}>
          <th scope="row">{award}</th>
          <td className="mvt-award-empty">Waiting for data</td>
          <td className="mvt-award-empty">--</td>
          <td className="mvt-award-empty">--</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

function groupKind(id: string) {
  if (id.includes(":conference:")) return "conference";
  if (id.includes(":division:")) return "division";
  return "league";
}

function DivisionLeagueAwards({ awards, teamById, schedule }: { awards: MvtAwardResult[]; teamById: Map<string, Team>; schedule: GeneratedSchedule }) {
  const conferenceLive = hasConferences(schedule.setup);
  const leagueAwards = awards.filter((award) => groupKind(award.id) === "league");
  const conferenceAwards = awards.filter((award) => groupKind(award.id) === "conference");
  const divisionAwards = awards.filter((award) => groupKind(award.id) === "division");
  return <div className="mvt-award-groups">
    <AwardTable title="League Awards" awards={leagueAwards} teamById={teamById} />
    {conferenceLive && <section className="mvt-award-panel conference-award-group">
      <header><Medal /><span><strong>Conference Awards</strong><small>{conferenceAwards.length} scored awards at +1.50 each</small></span><span className="mvt-conference-marks">{schedule.setup.conferences?.map((conference) => <em key={conference.id}><ConferenceMark conference={conference} size={16} />{conference.name}</em>)}</span></header>
      <div className="mvt-award-table-wrap">
        <table className="mvt-award-table">
          <thead><tr><th>Award</th><th>1st</th><th>2nd</th><th>3rd</th></tr></thead>
          <tbody>{conferenceAwards.map((award) => <tr key={award.id}>
            <th scope="row">{award.label}</th>
            <WinnerCell award={award} place={1} teamById={teamById} />
            <WinnerCell award={award} place={2} teamById={teamById} />
            <WinnerCell award={award} place={3} teamById={teamById} />
          </tr>)}</tbody>
        </table>
      </div>
    </section>}
    <AwardTable title="Division Awards" awards={divisionAwards} teamById={teamById} />
  </div>;
}

function PastChampionsStrip({ champions }: { champions: PastChampion[] }) {
  if (!champions.length) return null;
  return <section className="past-champions-strip" aria-label="Past champions">
    <header><Trophy /><span><strong>Past Champions</strong><small>Saved league history</small></span></header>
    <div>{champions.slice(0, 5).map((champion) => <article key={`${champion.provider}:${champion.providerLeagueId}:${champion.season}`}>
      <small>{champion.season}</small>
      <strong>{champion.teamName}</strong>
      <span>{champion.managerName || champion.leagueName}</span>
      {champion.wins != null && champion.losses != null && <em>{champion.wins}-{champion.losses}{champion.ties ? `-${champion.ties}` : ""}</em>}
    </article>)}</div>
  </section>;
}

export function MvtWorkspace({ schedule, playerStats, pastChampions = [] }: { schedule: GeneratedSchedule; playerStats: GameDetailPlayerStat[]; pastChampions?: PastChampion[] }) {
  const [activeBucket, setActiveBucket] = React.useState<MvtPanelKey>("positional");
  const teamById = React.useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule.setup.teams]);
  const conferenceLive = hasConferences(schedule.setup);
  const lineupTemplate = React.useMemo(() => inferLineupTemplate(schedule, playerStats), [schedule, playerStats]);
  const allStars = React.useMemo(() => lineupTemplate ? buildAllStars({ lineupTemplate, stats: playerStats }) : null, [lineupTemplate, playerStats]);
  const mvt = React.useMemo(() => lineupTemplate ? buildMvt({ schedule, lineupTemplate, playerStats, allStars: allStars ?? undefined }) : null, [schedule, lineupTemplate, playerStats, allStars]);
  const maxTotal = Math.max(0, ...(mvt?.teams.map((row) => row.total) ?? []));
  const awardsByBucket = React.useMemo(() => new Map(BUCKETS.map((bucket) => [bucket.key, (mvt?.awards ?? []).filter((award) => award.bucket === bucket.key)])), [mvt]);
  const activeBucketLabel = activeBucket === "conference" ? "Conference Awards" : BUCKETS.find((bucket) => bucket.key === activeBucket)?.label ?? "Awards";
  const hasMvtData = Boolean(mvt?.teams.length);
  const orderedTeams = React.useMemo(() => [...schedule.setup.teams].sort((left, right) => left.overallRank - right.overallRank || teamDisplayName(left).localeCompare(teamDisplayName(right))), [schedule.setup.teams]);

  const leader = mvt?.teams[0];
  const leaderTeam = leader ? teamById.get(leader.teamId) : undefined;

  return <div className="mvt-workspace">
    <section className="mvt-hero">
      <div>
        <small>{schedule.setup.abbreviation} / {schedule.setup.seasonYear}</small>
        <h2>Most Valuable Team</h2>
        <p>MVT is the league power ranking, scored from positional, achievement, division/league, and bonus awards.</p>
      </div>
      {leaderTeam && leader ? <aside>
        <Trophy />
        <span><small>Current leader</small><strong>{teamDisplayName(leaderTeam)}</strong></span>
        <PointChip value={leader.total} className="mvt-leader-chip" />
      </aside> : <aside className="mvt-pending-leader">
        <Sparkles />
        <span><small>Current leader</small><strong>Waiting for data</strong></span>
        <PointChip value={0} className="mvt-leader-chip" />
      </aside>}
    </section>
    <PastChampionsStrip champions={pastChampions} />
    {!hasMvtData && <section className="mvt-status-panel" role="status">
      <Sparkles />
      <span><strong>MVT categories are ready.</strong><small>This season has no platform-scored starter rows yet. Once ESPN or Sleeper player scores sync, these blanks become real totals without inventing data.</small></span>
    </section>}

    <section className="mvt-overview" aria-label="MVT power ranking">
      <header>
        <span><strong>Overall MVT Score</strong><small>Standings-style total across all award tabs</small></span>
        <em>{hasMvtData ? mvt!.teams.length : orderedTeams.length} teams</em>
      </header>
      <div className="mvt-leaderboard">
        {hasMvtData ? mvt!.teams.map((row) => {
          const team = teamById.get(row.teamId);
          return team ? <TeamLine key={row.teamId} row={row} team={team} maxTotal={maxTotal} /> : null;
        }) : orderedTeams.map((team, index) => <PendingTeamLine key={team.id} team={team} rank={index + 1} />)}
      </div>
    </section>

    <section className="mvt-buckets" aria-label="MVT score buckets">
      {BUCKETS.map((bucket) => <article key={bucket.key}>
        <small>{bucket.short}</small>
        <PointChip value={hasMvtData ? mvt!.teams.reduce((sum, row) => sum + bucketValue(row, bucket.key), 0) : 0} label={bucket.short} />
        <span>{bucket.label}</span>
      </article>)}
    </section>

    <div className="mvt-tabs" role="tablist" aria-label="MVT award tables">
      {[...BUCKETS, ...(conferenceLive ? [{ key: "conference" as const, label: "Conference Awards", short: "CONF" }] : [])].map((bucket) => <button
        type="button"
        role="tab"
        aria-selected={activeBucket === bucket.key}
        className={activeBucket === bucket.key ? "active" : ""}
        key={bucket.key}
        onClick={() => setActiveBucket(bucket.key)}
      >{bucket.label}</button>)}
    </div>

    {!hasMvtData ? <PlaceholderAwardTable title={activeBucketLabel} awards={PLACEHOLDER_AWARDS[activeBucket]} />
      : activeBucket === "divisionLeague"
      ? <DivisionLeagueAwards awards={awardsByBucket.get("divisionLeague") ?? []} teamById={teamById} schedule={schedule} />
      : activeBucket === "conference"
        ? <AwardTable title={activeBucketLabel} awards={(awardsByBucket.get("divisionLeague") ?? []).filter((award) => groupKind(award.id) === "conference")} teamById={teamById} />
        : <AwardTable title={activeBucketLabel} awards={awardsByBucket.get(activeBucket) ?? []} teamById={teamById} />}
  </div>;
}
