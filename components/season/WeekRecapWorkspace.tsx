"use client";

import * as React from "react";
import { CircleAlert, Crown, Sparkles, Star, Trophy } from "lucide-react";
import { buildAllStars } from "@/lib/allStars";
import { MVT_BLOWOUT_THRESHOLD } from "@/lib/mvt";
import { type LineupTemplate, type SlotKey } from "@/lib/playerData";
import { formatPoints, getScheduleGameSignals } from "@/lib/statistics";
import { formatRecord, getEnteringWeekRankSnapshot } from "@/lib/standings";
import { readableTextColor } from "@/lib/colorContrast";
import { teamInitials } from "@/lib/teamIdentity";
import { GameBadgeChip } from "@/components/season/MatchupPresentation";
import { type GameDetailPlayerStat } from "@/lib/gameDetail";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import type { GeneratedSchedule, ScheduledGame, Team } from "@/lib/types";

type Performer = GameDetailPlayerStat & { isAllStar: boolean };

function teamDisplay(team: Team, showCity: boolean) {
  return `${showCity && team.city ? `${team.city} ` : ""}${team.name}`;
}

function isFinalGame(game: ScheduledGame) {
  return typeof game.homeScore === "number" && typeof game.awayScore === "number";
}

export function getLatestFinalWeek(schedule: GeneratedSchedule) {
  return [...schedule.weeks].reverse().find((week) => week.games.length > 0 && week.games.every(isFinalGame)) ?? null;
}

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

function allStarKeys(schedule: GeneratedSchedule, playerStats: GameDetailPlayerStat[], weekNumber: number) {
  const lineupTemplate = inferLineupTemplate(schedule, playerStats);
  if (!lineupTemplate) return new Set<string>();
  const allStars = buildAllStars({ lineupTemplate, stats: playerStats, completedWeeks: [weekNumber] });
  return new Set(allStars.weeks.flatMap((week) => week.slots.flatMap((slot) => slot.winners.map((winner) => `${winner.teamId}:${winner.week}:${winner.canonicalPlayerId}`))));
}

function eligibleRows(rows: GameDetailPlayerStat[]) {
  return rows.filter((row) => row.lineupStatus === "starter" || row.lineupStatus === "bench" || row.lineupStatus === "unknown");
}

function topPerformers(rows: GameDetailPlayerStat[], allStars: Set<string>, count: number): Performer[] {
  return eligibleRows(rows)
    .sort((left, right) => right.points - left.points || left.providerPlayerId.localeCompare(right.providerPlayerId))
    .slice(0, count)
    .map((row) => ({ ...row, isAllStar: allStars.has(`${row.teamId}:${row.week}:${row.canonicalPlayerId}`) }));
}

function PerformerLine({ performer, mvp = false }: { performer: Performer; mvp?: boolean }) {
  return <li>
    <span className="recap-position-badge">{performer.position || performer.inferredSlot}</span>
    <strong>{performer.displayName || performer.providerPlayerId}</strong>
    <em>{performer.nflTeam || performer.inferredSlot}</em>
    {mvp && <small className="recap-mvp-chip"><Crown />MVP</small>}
    {performer.isAllStar && <small className="recap-allstar-chip"><Star fill="currentColor" />All-Star-of-the-Week</small>}
    <b>{formatPoints(performer.points)}</b>
  </li>;
}

function scoreFor(game: ScheduledGame, teamId: string) {
  return game.homeTeamId === teamId ? game.homeScore! : game.awayScore!;
}

function winnerLoser(game: ScheduledGame) {
  if (game.homeScore! >= game.awayScore!) return { winnerId: game.homeTeamId, loserId: game.awayTeamId, tied: game.homeScore === game.awayScore };
  return { winnerId: game.awayTeamId, loserId: game.homeTeamId, tied: false };
}

function storyline({ winner, loser, margin, mvp, upset, blowout }: { winner: Team; loser: Team; margin: number; mvp?: Performer; upset: boolean; blowout: boolean }) {
  const mvpPhrase = mvp
    ? mvp.teamId === winner.id
      ? ` behind ${mvp.displayName || mvp.providerPlayerId}'s ${formatPoints(mvp.points)} points`
      : ` despite ${mvp.displayName || mvp.providerPlayerId}'s ${formatPoints(mvp.points)} points`
    : "";
  const base = `${winner.name} beat ${loser.name} by ${formatPoints(margin)}${mvpPhrase}.`;
  if (upset) return `${base} The lower seed turned it into an upset.`;
  if (blowout) return `${base} The margin cleared the ${MVT_BLOWOUT_THRESHOLD}-point blowout line.`;
  return base;
}

function TeamScoreBlock({ team, rank, record, score, showCity }: { team: Team; rank: number; record: string; score: number; showCity: boolean }) {
  return <span className="recap-team-score" style={{ "--team": team.color, "--team-on": readableTextColor(team.color) } as React.CSSProperties}>
    <EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={48} />
    <span><small>#{rank} · {record}</small><strong>{teamDisplay(team, showCity)}</strong></span>
    <b>{formatPoints(score)}</b>
  </span>;
}

export function WeekRecapWorkspace({ schedule, playerStats, onOpenGame }: { schedule: GeneratedSchedule; playerStats: GameDetailPlayerStat[]; onOpenGame: (gameId: string) => void }) {
  const week = getLatestFinalWeek(schedule);
  const showCity = schedule.setup.display?.cityNames !== false;
  const teamById = React.useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule.setup.teams]);
  const divisionById = React.useMemo(() => new Map(schedule.setup.divisions.map((division) => [division.id, division])), [schedule.setup.divisions]);
  const signals = React.useMemo(() => getScheduleGameSignals(schedule), [schedule]);
  const recapWeekNumber = week?.weekNumber;
  const allStars = recapWeekNumber ? allStarKeys(schedule, playerStats, recapWeekNumber) : new Set<string>();

  if (!week) return <section className="week-recap-empty"><Sparkles /><strong>No final-week recap yet</strong><span>Results appear after every game in a week has a final platform score.</span></section>;
  const finalWeek = week;

  const rankSnapshot = getEnteringWeekRankSnapshot(schedule, finalWeek.weekNumber);
  const rankByTeam = new Map(rankSnapshot.rows.map((row) => [row.teamId, row.rank]));
  const recordByTeam = new Map(rankSnapshot.rows.map((row) => [row.teamId, formatRecord(row)]));
  const gotwGame = signals.gotwByWeek.get(finalWeek.weekNumber)?.game ?? finalWeek.games.find((game) => game.gameNumber === 1) ?? finalWeek.games[0];
  const gotw = gotwGame ? recapGame(gotwGame) : null;

  function rowsFor(teamId: string) {
    return playerStats.filter((row) => row.week === finalWeek.weekNumber && row.teamId === teamId);
  }

  function recapGame(game: ScheduledGame) {
    const away = teamById.get(game.awayTeamId);
    const home = teamById.get(game.homeTeamId);
    if (!away || !home) return null;
    const awayRows = topPerformers(rowsFor(away.id), allStars, 3);
    const homeRows = topPerformers(rowsFor(home.id), allStars, 3);
    const performers = [...awayRows, ...homeRows].sort((left, right) => right.points - left.points);
    const mvp = performers[0];
    const result = winnerLoser(game);
    const winner = teamById.get(result.winnerId) ?? home;
    const loser = teamById.get(result.loserId) ?? away;
    const margin = Math.abs(game.homeScore! - game.awayScore!);
    const analytics = signals.byGameId.get(game.id);
    const upset = Boolean(analytics?.badges.includes("Upset"));
    const blowout = !result.tied && margin >= MVT_BLOWOUT_THRESHOLD;
    return { game, away, home, awayRows, homeRows, mvp, result, winner, loser, margin, upset, blowout };
  }

  return <div className="week-recap-workspace">
    <section className="recap-head">
      <span><Trophy />Week {finalWeek.weekNumber} Final</span>
      <h2>Weekly Results Recap</h2>
      <p>{finalWeek.dateLabel}</p>
    </section>
    {gotw && <section className="recap-hero" role="button" tabIndex={0} onClick={() => onOpenGame(gotw.game.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpenGame(gotw.game.id); } }}>
      <header>
        <span><Star fill="currentColor" /> Match of the Week Result</span>
        <strong>{gotw.result.tied ? "Final tie" : `${teamDisplay(gotw.winner, showCity)} wins`}</strong>
      </header>
      <div className="recap-hero-scoreline">
        <TeamScoreBlock team={gotw.away} rank={rankByTeam.get(gotw.away.id) ?? gotw.away.overallRank} record={recordByTeam.get(gotw.away.id) ?? "0-0"} score={gotw.game.awayScore!} showCity={showCity} />
        <b>@</b>
        <TeamScoreBlock team={gotw.home} rank={rankByTeam.get(gotw.home.id) ?? gotw.home.overallRank} record={recordByTeam.get(gotw.home.id) ?? "0-0"} score={gotw.game.homeScore!} showCity={showCity} />
      </div>
      <div className="recap-performer-panels">
        <ul>{gotw.awayRows.map((performer) => <PerformerLine performer={performer} mvp={gotw.result.winnerId === gotw.away.id && performer.canonicalPlayerId === gotw.awayRows[0]?.canonicalPlayerId} key={performer.providerPlayerId} />)}</ul>
        <ul>{gotw.homeRows.map((performer) => <PerformerLine performer={performer} mvp={gotw.result.winnerId === gotw.home.id && performer.canonicalPlayerId === gotw.homeRows[0]?.canonicalPlayerId} key={performer.providerPlayerId} />)}</ul>
      </div>
    </section>}
    <section className="recap-matchup-list">
      {finalWeek.games.map((game) => {
        const recap = recapGame(game);
        if (!recap) return null;
        const badges = [
          ...(recap.upset ? ["Upset" as const] : []),
          ...(recap.blowout ? ["Blowout" as const] : []),
        ];
        return <article className="recap-card" role="button" tabIndex={0} onClick={() => onOpenGame(game.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpenGame(game.id); } }} key={game.id}>
          <header>
            <span><strong>Game {game.gameNumber}</strong><small>{divisionById.get(recap.home.divisionId) && <><DivisionMark division={divisionById.get(recap.home.divisionId)!} /> {divisionById.get(recap.home.divisionId)!.name}</>}</small></span>
            <span className="recap-card-badges">{badges.map((badge) => badge === "Upset" ? <GameBadgeChip badge="Upset" key={badge} /> : <em key={badge}>BLOWOUT</em>)}</span>
          </header>
          <div className="recap-card-score">
            <span className={recap.result.winnerId === recap.away.id ? "winner" : ""}>#{rankByTeam.get(recap.away.id) ?? recap.away.overallRank} {teamDisplay(recap.away, showCity)} <b>{formatPoints(scoreFor(game, recap.away.id))}</b></span>
            <span className={recap.result.winnerId === recap.home.id ? "winner" : ""}>#{rankByTeam.get(recap.home.id) ?? recap.home.overallRank} {teamDisplay(recap.home, showCity)} <b>{formatPoints(scoreFor(game, recap.home.id))}</b></span>
          </div>
          {recap.mvp ? <ul className="recap-card-mvp"><PerformerLine performer={recap.mvp} mvp /></ul> : <p className="recap-no-data"><CircleAlert />Roster data not synced for this game.</p>}
          <p>{storyline({ winner: recap.winner, loser: recap.loser, margin: recap.margin, mvp: recap.mvp, upset: recap.upset, blowout: recap.blowout })}</p>
        </article>;
      })}
    </section>
  </div>;
}
