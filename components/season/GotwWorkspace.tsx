"use client";

import { useMemo } from "react";
import { CircleAlert, ShieldCheck, Sparkles } from "lucide-react";
import { MatchupCard } from "@/components/season/MatchupPresentation";
import { getMatchupRatingRange, getMatchupSignal } from "@/lib/matchups";
import { formatRecord, getEnteringWeekRankSnapshot } from "@/lib/standings";
import { gameOfWeekStatusLabel, getScheduleGameSignals } from "@/lib/statistics";
import type { GeneratedSchedule } from "@/lib/types";

export function GotwWorkspace({ schedule, simulationResults = {}, simulationProbabilities = {} }: {
  schedule: GeneratedSchedule;
  simulationResults?: Record<string, { source: "simulated" | "override"; locked: boolean }>;
  simulationProbabilities?: Record<string, { away: number; home: number }>;
}) {
  const signals = useMemo(() => getScheduleGameSignals(schedule), [schedule]);
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const showCity = schedule.setup.display?.cityNames !== false;
  const showVenue = schedule.setup.display?.venues !== false;
  const counts = signals.gotwTimeline.reduce((result, entry) => ({ ...result, [entry.status]: result[entry.status] + 1 }), { previous: 0, current: 0, projected: 0 });
  const selectedCount = counts.previous + counts.current;

  return <div className="gotw-view">
    <div className="gotw-summary two-status" aria-label="Game of the Week season status">
      <span><ShieldCheck /><strong>{selectedCount}</strong><small>GOTW</small></span>
      <span><Sparkles /><strong>{counts.projected}</strong><small>Projected</small></span>
    </div>
    {signals.gotwTimeline.length === 0 ? (
      <div className="gotw-empty" role="status">
        <Sparkles aria-hidden="true" />
        <strong>No Game of the Week selected yet</strong>
        <small>Check back after Week 1.</small>
      </div>
    ) : (
    <div className="gotw-timeline">
      {signals.gotwTimeline.map((entry) => {
        const away = teamById.get(entry.game.awayTeamId);
        const home = teamById.get(entry.game.homeTeamId);
        if (!away || !home) {
          return <section className="gotw-timeline-item status-unavailable" key={entry.weekNumber}>
            <header><span className="gotw-week-copy"><strong>Week {entry.weekNumber}</strong><small>{entry.dateLabel}</small></span></header>
            <div className="gotw-unavailable"><CircleAlert aria-hidden="true" /><span><strong>Matchup unavailable</strong><small>A team in this game was removed after the schedule was generated.</small></span></div>
          </section>;
        }
        const rankSnapshot = getEnteringWeekRankSnapshot(schedule, entry.weekNumber);
        const standingsByTeam = new Map(rankSnapshot.rows.map((row) => [row.teamId, row]));
        const recordFor = (teamId: string) => {
          const row = standingsByTeam.get(teamId);
          return { overall: row ? formatRecord(row) : "0-0", division: row ? `${row.divisionWins}-${row.divisionLosses}` : "0-0" };
        };
        const ratingRange = getMatchupRatingRange(schedule.weeks.flatMap((week) => week.games), entry.ranks);
        const statusLabel = gameOfWeekStatusLabel(entry.status);
        const simulationResult = simulationResults[entry.game.id];
        return <section className={`gotw-timeline-item status-${entry.status}`} key={entry.weekNumber}>
          <MatchupCard
            dateLabel={`Week ${entry.weekNumber} · ${entry.dateLabel}`}
            game={entry.game}
            away={away}
            home={home}
            awayDivision={divisionById.get(away.divisionId)}
            homeDivision={divisionById.get(home.divisionId)}
            setup={schedule.setup}
            awayRank={entry.ranks.get(away.id) ?? away.overallRank}
            homeRank={entry.ranks.get(home.id) ?? home.overallRank}
            awayRecord={recordFor(away.id)}
            homeRecord={recordFor(home.id)}
            signal={getMatchupSignal(entry.game, entry.ranks, ratingRange, schedule.setup.teams.length)}
            featured
            featuredLabel={statusLabel}
            badges={signals.byGameId.get(entry.game.id)?.badges}
            showCity={showCity}
            showVenue={showVenue}
            variant="gotw"
            simulationSource={simulationResult?.source}
            simulationLocked={simulationResult?.locked}
            winProbability={simulationProbabilities[entry.game.id]}
            teamHrefBase={`/season/${schedule.id}/team`}
          />
        </section>;
      })}
    </div>
    )}
  </div>;
}
