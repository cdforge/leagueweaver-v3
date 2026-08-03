"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { BarChart3, MapPin, MoreHorizontal, Star, UsersRound } from "lucide-react";
import { ClinchBadges } from "@/components/season/ClinchBadges";
import { GameBadgeChip, MatchupCard, MatchupRatingLegend, MatchupSeriesChip, TeamIdentityBlock } from "@/components/season/MatchupPresentation";
import { useRouteBase } from "@/components/season/routeBase";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DivisionIdentity } from "@/components/ui/DivisionIdentity";
import { FloatingPopover } from "@/components/ui/FloatingPopover";
import { Tooltip } from "@/components/ui/Tooltip";
import { buildAllStars } from "@/lib/allStars";
import { accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { getTeamClinchTimelines, type TeamClinchTimeline } from "@/lib/clinch";
import { hasConferences } from "@/lib/conferences";
import { isGamePlayed } from "@/lib/game";
import type { GameDetailPlayerStat } from "@/lib/gameDetail";
import { calculateMatchupRating, formatGameDateTimeOverride, getMatchupRatingRange, getMatchupSignal, toMatchupScore10 } from "@/lib/matchups";
import { buildMvt } from "@/lib/mvt";
import type { LineupTemplate, SlotKey } from "@/lib/playerData";
import { getWeekOneRankMap } from "@/lib/rankings";
import { getNflWeekWindow } from "@/lib/schedule";
import { formatRecord, getEnteringWeekRankSnapshot, getWeekRankSnapshot } from "@/lib/standings";
import { calculateTeamSeasonStats, formatDifferential, formatPoints, formatSplitRecord, gameOfWeekStatusLabel, getScheduleGameSignals, recordGames, recordPercentage } from "@/lib/statistics";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, RankedStandingsRow, Team } from "@/lib/types";

type DisplayKey = "cityNames" | "venues" | "matchup" | "rating" | "badges" | "details";
type PlacementTone = "positive" | "neutral" | "negative";

interface TeamScheduleSummary {
  team: Team;
  standing?: RankedStandingsRow;
  divisionSeed: number;
  liveRank: number;
  record: {
    overall: string;
    division: string;
  };
  homeGames: number;
  awayGames: number;
  byes: number;
  divisionGames: number;
  averageRating: number;
  averageOpponentSeed: number;
  sosRank: number;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function ordinal(value: number) {
  const tens = value % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : value % 10 === 1 ? "st" : value % 10 === 2 ? "nd" : value % 10 === 3 ? "rd" : "th";
  return `${value}${suffix}`;
}

function statDecimal(value: number | null) {
  return value == null ? "—" : value.toFixed(3).replace(/^0/, "");
}

function streakValue(streak: string) {
  if (streak.startsWith("W")) return Number(streak.slice(1)) || 0;
  if (streak.startsWith("L")) return -(Number(streak.slice(1)) || 0);
  return 0;
}

function rankValues(values: Map<string, number>) {
  const sorted = [...values.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const ranks = new Map<string, number>();
  let previous: number | undefined;
  let rank = 0;
  sorted.forEach(([teamId, value], index) => {
    if (previous === undefined || value !== previous) rank = index + 1;
    previous = value;
    ranks.set(teamId, rank);
  });
  return ranks;
}

function hasReadyAwardStats(rows: GameDetailPlayerStat[]) {
  return rows.some((row) => row.lineupStatus === "starter" && Number.isFinite(row.points) && row.points !== 0);
}

function inferLineupTemplate(schedule: GeneratedSchedule, rows: GameDetailPlayerStat[]): LineupTemplate | null {
  const starters = rows.filter((row) => row.lineupStatus === "starter" && typeof row.starterIndex === "number");
  if (!starters.length) return null;
  const byIndex = new Map<number, GameDetailPlayerStat>();
  for (const row of starters) {
    if (!byIndex.has(row.starterIndex!)) byIndex.set(row.starterIndex!, row);
  }
  const counts = new Map<SlotKey, number>();
  return {
    provider: rows[0]?.provider ?? "sleeper",
    season: schedule.setup.seasonYear,
    slots: [...byIndex.entries()].sort(([left], [right]) => left - right).map(([index, row]) => {
      const slot = row.inferredSlot as SlotKey;
      const rank = (counts.get(slot) ?? 0) + 1;
      counts.set(slot, rank);
      return { slot, index, rank, label: rank > 1 ? `${slot}${rank}` : slot, rawSlot: row.rawSlot, group: "starter", confidence: row.slotConfidence };
    }),
  };
}

function statPlacement(teamId: string, values: Array<{ teamId: string; value: number | null }>, direction: "asc" | "desc", toneMode: "best-good" | "best-bad" | "neutral" = "best-good") {
  const total = values.length;
  const sorted = values
    .filter((item) => item.value != null && Number.isFinite(item.value))
    .sort((left, right) => {
      const difference = left.value! - right.value!;
      return (direction === "asc" ? difference : -difference) || left.teamId.localeCompare(right.teamId);
    });
  const target = sorted.find((item) => item.teamId === teamId);
  if (!target) return { label: `No rank of ${total}`, tone: "neutral" satisfies PlacementTone };

  const rank = sorted.findIndex((item) => item.value === target.value) + 1;
  const tied = sorted.filter((item) => item.value === target.value).length > 1;
  const percentile = total <= 1 ? 0.5 : (rank - 1) / (total - 1);
  const placementTone: PlacementTone = toneMode === "neutral"
    ? "neutral"
    : percentile <= 0.33
      ? toneMode === "best-good" ? "positive" : "negative"
      : percentile >= 0.67
        ? toneMode === "best-good" ? "negative" : "positive"
        : "neutral";

  return {
    label: `${tied ? "Tied for " : ""}${ordinal(rank)} of ${total}`,
    tone: placementTone,
  };
}

function teamBrandStyle(color: string) {
  return {
    "--team-brand": color,
    "--team-brand-ink": accessibleTeamColor(color),
    "--team-brand-on": readableTextColor(color),
  } as CSSProperties;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a, button, input, select, textarea, summary"));
}

function buildTeamScheduleSummaries(schedule: GeneratedSchedule): TeamScheduleSummary[] {
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const teamCount = schedule.setup.teams.length;
  const preseasonRanks = getWeekOneRankMap(schedule.setup);
  const currentSnapshot = getWeekRankSnapshot(schedule, schedule.setup.weeks);
  const currentByTeam = new Map(currentSnapshot.rows.map((row) => [row.teamId, row]));
  const divisionSeeds = new Map<string, number>();
  for (const division of schedule.setup.divisions) {
    schedule.setup.teams
      .filter((team) => team.divisionId === division.id)
      .sort((left, right) => left.overallRank - right.overallRank || left.id.localeCompare(right.id))
      .forEach((team, index) => divisionSeeds.set(team.id, index + 1));
  }

  const summaries = schedule.setup.teams.map((team) => {
    const games = schedule.weeks.flatMap((week) => week.games.filter((game) => game.homeTeamId === team.id || game.awayTeamId === team.id));
    const opponents = games.map((game) => teamById.get(game.homeTeamId === team.id ? game.awayTeamId : game.homeTeamId)).filter(Boolean) as Team[];
    const standing = currentByTeam.get(team.id);
    return {
      team,
      standing,
      divisionSeed: divisionSeeds.get(team.id) ?? team.overallRank,
      liveRank: standing?.rank ?? preseasonRanks.get(team.id) ?? team.overallRank,
      record: {
        overall: standing ? formatRecord(standing) : "0-0",
        division: standing ? `${standing.divisionWins}-${standing.divisionLosses}` : "0-0",
      },
      homeGames: games.filter((game) => game.homeTeamId === team.id).length,
      awayGames: games.filter((game) => game.awayTeamId === team.id).length,
      byes: schedule.weeks.filter((week) => !week.games.some((game) => game.homeTeamId === team.id || game.awayTeamId === team.id)).length,
      divisionGames: opponents.filter((opponent) => opponent.divisionId === team.divisionId).length,
      averageRating: average(games.map((game) => game.matchupRating ?? calculateMatchupRating(game, preseasonRanks))),
      averageOpponentSeed: average(opponents.map((opponent) => preseasonRanks.get(opponent.id) ?? opponent.overallRank)),
      sosRank: 0,
    };
  });

  [...summaries]
    .sort((left, right) => left.averageOpponentSeed - right.averageOpponentSeed || left.team.id.localeCompare(right.team.id))
    .forEach((summary, index) => { summary.sosRank = index + 1; });

  return summaries;
}

function TeamScheduleDirectory({ schedule, summaries, clinches, onSelectTeam }: {
  schedule: GeneratedSchedule;
  summaries: TeamScheduleSummary[];
  clinches: Map<string, TeamClinchTimeline>;
  onSelectTeam: (teamId: string) => void;
}) {
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const showCity = schedule.setup.display?.cityNames !== false;
  const sortedSummaries = useMemo(() => [...summaries].sort((left, right) =>
    teamDisplayName(left.team, showCity).localeCompare(teamDisplayName(right.team, showCity)),
  ), [showCity, summaries]);

  const renderCard = (summary: TeamScheduleSummary) => {
    const division = divisionById.get(summary.team.divisionId);
    return (
      <div className="team-directory-card" style={teamBrandStyle(summary.team.color)} key={summary.team.id}>
        {/* H6 — the click is a stretched empty button (no flow content inside a
            button); the name + stats stay in the DOM and are read by AT. */}
        <button
          type="button"
          className="team-directory-open"
          onClick={() => onSelectTeam(summary.team.id)}
          aria-label={`Open ${teamDisplayName(summary.team, showCity)} schedule`}
        />
        <TeamIdentityBlock
          team={summary.team}
          division={division}
          leagueRank={summary.liveRank}
          record={summary.record}
          showCity={showCity}
        />
        {/* Dedicated badge row — playoff / division-title / #1-seed / eliminated.
            Collapses to nothing (CSS :empty) when the team has no clinch status. */}
        <div className="team-directory-badges">
          <ClinchBadges timeline={clinches.get(summary.team.id)} division={division} compact />
        </div>
        <dl className="team-directory-stats">
          <div><dt>H/A</dt><dd>{summary.homeGames}-{summary.awayGames}</dd></div>
          <div><dt>Div</dt><dd>{summary.divisionGames}</dd></div>
          <div><dt>SOS</dt><dd>{ordinal(summary.sosRank)}</dd></div>
        </dl>
      </div>
    );
  };

  // Group by division. For 4/6/8-division leagues that carry a conference assignment, the
  // division sections nest under two conference headers (each conference is one half of the
  // playoff bracket); otherwise divisions render flat. `hasConferences` is the same gate the
  // playoff seeding and clinch engine use, so the grouping here can't diverge from the bracket.
  const showDivisionGroups = schedule.setup.divisions.length > 1;
  const conferencesActive = hasConferences(schedule.setup);
  const divisionGroups = schedule.setup.divisions
    .map((division) => ({
      division,
      teams: summaries
        .filter((summary) => summary.team.divisionId === division.id)
        .sort((left, right) => left.liveRank - right.liveRank),
    }))
    .filter((group) => group.teams.length > 0);
  const orphanTeams = summaries
    .filter((summary) => !divisionById.has(summary.team.divisionId))
    .sort((left, right) => left.liveRank - right.liveRank);

  const renderDivisionGroup = (group: (typeof divisionGroups)[number]) => (
    <section className="team-directory-division-group" key={group.division.id}>
      <header className="team-directory-division-head">
        <DivisionIdentity division={group.division} detail={`${group.teams.length} team${group.teams.length === 1 ? "" : "s"}`} />
      </header>
      <div className="team-directory-grid">{group.teams.map(renderCard)}</div>
    </section>
  );

  return (
    <div className="team-schedule-directory">
      {showDivisionGroups ? (
        <>
          {conferencesActive
            ? schedule.setup.conferences!.map((conference) => {
                const confGroups = divisionGroups.filter((group) => group.division.conferenceId === conference.id);
                if (confGroups.length === 0) return null;
                return (
                  <section className="team-directory-conference-group" key={conference.id}>
                    <header className="team-directory-conference-head">
                      <DivisionIdentity division={conference} detail={`${confGroups.length} division${confGroups.length === 1 ? "" : "s"}`} />
                    </header>
                    {confGroups.map(renderDivisionGroup)}
                  </section>
                );
              })
            : divisionGroups.map(renderDivisionGroup)}
          {orphanTeams.length > 0 && (
            <section className="team-directory-division-group">
              <header className="team-directory-division-head"><strong>Independent</strong></header>
              <div className="team-directory-grid">{orphanTeams.map(renderCard)}</div>
            </section>
          )}
        </>
      ) : (
        <div className="team-directory-grid">{sortedSummaries.map(renderCard)}</div>
      )}
    </div>
  );
}

export function TeamScheduleView({ schedule, teamId, playerStats = [], onSelectTeam, onSelectWeek, onOpenGame, simulationResults = {}, teamHrefFor, leagueWeekHrefFor, readOnlyHistory = false }: {
  schedule: GeneratedSchedule;
  teamId: string;
  playerStats?: GameDetailPlayerStat[];
  onSelectTeam: (teamId: string) => void;
  onSelectWeek: (week: number) => void;
  onOpenGame?: (gameId: string) => void;
  simulationResults?: Record<string, {
    source: "simulated" | "override";
    locked: boolean;
  }>;
  teamHrefFor?: (teamId: string) => string;
  leagueWeekHrefFor?: (week: number) => string;
  readOnlyHistory?: boolean;
}) {
  const routeBase = useRouteBase(`/season/${schedule.id}`);
  const scheduleSignals = useMemo(() => getScheduleGameSignals(schedule), [schedule]);
  const summaries = useMemo(() => buildTeamScheduleSummaries(schedule), [schedule]);
  const completedAwardWeeks = useMemo(() => new Set(schedule.weeks.filter((week) => week.games.some(isGamePlayed)).map((week) => week.weekNumber)), [schedule]);
  const awardPlayerStats = useMemo(() => playerStats.filter((row) => completedAwardWeeks.has(row.week)), [playerStats, completedAwardWeeks]);
  const hasAwardData = useMemo(() => hasReadyAwardStats(awardPlayerStats), [awardPlayerStats]);
  const awardsLineup = useMemo(() => hasAwardData ? inferLineupTemplate(schedule, awardPlayerStats) : null, [schedule, awardPlayerStats, hasAwardData]);
  const allStars = useMemo(() => awardsLineup ? buildAllStars({ lineupTemplate: awardsLineup, stats: awardPlayerStats, completedWeeks: completedAwardWeeks }) : null, [awardsLineup, awardPlayerStats, completedAwardWeeks]);
  const mvt = useMemo(() => awardsLineup ? buildMvt({ schedule, lineupTemplate: awardsLineup, playerStats: awardPlayerStats, allStars: allStars ?? undefined }) : null, [schedule, awardsLineup, awardPlayerStats, allStars]);
  const mvtByTeam = useMemo(() => new Map((mvt?.teams ?? []).map((row) => [row.teamId, row])), [mvt]);
  const allStarCountByTeam = useMemo(() => allStars?.seasonCountByTeam ?? new Map<string, number>(), [allStars]);
  const allStarRankByTeam = useMemo(() => rankValues(allStarCountByTeam), [allStarCountByTeam]);
  const seasonStatsByTeam = useMemo(() => new Map(calculateTeamSeasonStats(schedule).map((row) => [row.teamId, {
    ...row,
    mvtScore: mvtByTeam.get(row.teamId)?.total ?? 0,
    mvtRank: mvtByTeam.get(row.teamId)?.rank ?? 0,
    allStarCount: allStarCountByTeam.get(row.teamId) ?? 0,
    allStarRank: allStarRankByTeam.get(row.teamId) ?? 0,
  }])), [schedule, mvtByTeam, allStarCountByTeam, allStarRankByTeam]);
  const currentClinches = useMemo(() => new Map(getTeamClinchTimelines(schedule).map((timeline) => [timeline.teamId, timeline])), [schedule]);
  // Field visibility is fixed to the league's display settings (the per-view
  // "Display" toggle button was removed by request).
  const display: Record<DisplayKey, boolean> = {
    cityNames: schedule.setup.display?.cityNames !== false,
    venues: schedule.setup.display?.venues !== false,
    matchup: true,
    rating: true,
    badges: true,
    details: false,
  };
  const team = schedule.setup.teams.find((item) => item.id === teamId);
  if (!team) return <TeamScheduleDirectory schedule={schedule} summaries={summaries} clinches={currentClinches} onSelectTeam={onSelectTeam} />;

  const teamById = new Map(schedule.setup.teams.map((item) => [item.id, item]));
  const teamCount = schedule.setup.teams.length;
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const teamHrefBase = `${routeBase}/team`;
  const planningRatingRange = getMatchupRatingRange(schedule.weeks.flatMap((week) => week.games));
  const currentSnapshot = getWeekRankSnapshot(schedule, schedule.setup.weeks);
  const currentStandingsByTeam = new Map(currentSnapshot.rows.map((row) => [row.teamId, row]));
  const recordFor = (recordTeamId: string) => {
    const row = currentStandingsByTeam.get(recordTeamId);
    if (!row) return { overall: "0-0", division: "0-0" };
    // A slate still sitting at 0-0 counts every game as a tie, so formatRecord
    // renders a confusing "0-0-14" headline. With no decisive games yet, show a
    // clean "0-0" instead of surfacing the tie count as the hero's big number.
    const overall = row.wins === 0 && row.losses === 0 ? "0-0" : formatRecord(row);
    return { overall, division: `${row.divisionWins}-${row.divisionLosses}` };
  };
  const division = divisionById.get(team.divisionId);
  const divisionTeamCount = division ? schedule.setup.teams.filter((item) => item.divisionId === division.id).length : 0;
  const summary = summaries.find((item) => item.team.id === team.id)!;
  const teamStats = seasonStatsByTeam.get(team.id)!;
  const showCity = display.cityNames;
  const renderWeekLink = (weekNumber: number, dateLabel: string, holidays: string[]) => (
    <button type="button" className="team-week-link" onClick={() => onSelectWeek(weekNumber)} aria-label={`Open the full league schedule for Week ${weekNumber}`}>
      <strong>W{weekNumber}</strong>
      <small>{dateLabel}</small>
      {holidays.map((holiday) => <em key={holiday}>{holiday}</em>)}
    </button>
  );
  const pointDifference = teamStats.pointsFor - teamStats.pointsAgainst;
  const pointDiff = formatDifferential(pointDifference);
  const teamHasPlayed = teamStats.wins + teamStats.losses + teamStats.ties > 0;
  const allTeamStats = Array.from(seasonStatsByTeam.values());
  const statRowsByTeam = new Map(allTeamStats.map((row) => [row.teamId, row]));
  const summariesByTeam = new Map(summaries.map((item) => [item.team.id, item]));
  const placement = (
    value: (teamId: string) => number | null,
    direction: "asc" | "desc" = "desc",
    toneMode: "best-good" | "best-bad" | "neutral" = "best-good",
  ) => statPlacement(team.id, schedule.setup.teams.map((item) => ({ teamId: item.id, value: value(item.id) })), direction, toneMode);
  const performanceStats = [
    { label: "Live rank", value: `#${summary.liveRank}`, placement: placement((id) => summariesByTeam.get(id)?.liveRank ?? null, "asc") },
    { label: "Record", value: teamStats.record, placement: placement((id) => statRowsByTeam.get(id)?.winPercentage ?? null) },
    { label: "Division", value: `${teamStats.divisionWins}-${teamStats.divisionLosses}`, placement: placement((id) => {
      const row = statRowsByTeam.get(id);
      const games = row ? row.divisionWins + row.divisionLosses + row.divisionTies : 0;
      return row && games ? (row.divisionWins + row.divisionTies * 0.5) / games : 0;
    }) },
    { label: "Home", value: formatSplitRecord(teamStats.home), placement: placement((id) => {
      const record = statRowsByTeam.get(id)?.home;
      return record && recordGames(record) ? recordPercentage(record) : 0;
    }) },
    { label: "Away", value: formatSplitRecord(teamStats.away), placement: placement((id) => {
      const record = statRowsByTeam.get(id)?.away;
      return record && recordGames(record) ? recordPercentage(record) : 0;
    }) },
    { label: "Win %", value: teamHasPlayed ? statDecimal(teamStats.winPercentage) : "—", placement: placement((id) => statRowsByTeam.get(id)?.winPercentage ?? null) },
    { label: "Points for", value: formatPoints(teamStats.pointsFor), placement: placement((id) => statRowsByTeam.get(id)?.pointsFor ?? null) },
    { label: "Points against", value: formatPoints(teamStats.pointsAgainst), placement: placement((id) => statRowsByTeam.get(id)?.pointsAgainst ?? null, "asc") },
    { label: "Point differential", value: pointDiff.text, tone: pointDiff.tone, placement: placement((id) => {
      const row = statRowsByTeam.get(id);
      return row ? row.pointsFor - row.pointsAgainst : null;
    }) },
    { label: "Strength of victory", value: statDecimal(teamStats.strengthOfVictory), placement: placement((id) => statRowsByTeam.get(id)?.strengthOfVictory ?? null) },
    { label: "Strength of schedule", value: statDecimal(teamStats.strengthOfSchedule), placement: placement((id) => statRowsByTeam.get(id)?.strengthOfSchedule ?? null, "desc", "best-bad") },
    { label: "Streak", value: teamStats.streak, placement: placement((id) => streakValue(statRowsByTeam.get(id)?.streak ?? "—")) },
    { label: "GOTW wins", value: String(teamStats.featuredWins), placement: placement((id) => statRowsByTeam.get(id)?.featuredWins ?? null) },
    { label: "Byes", value: String(summary.byes), placement: placement((id) => summariesByTeam.get(id)?.byes ?? null, "desc", "neutral") },
    { label: "Average rating", value: `${toMatchupScore10(summary.averageRating, teamCount).toFixed(1)}/10`, placement: placement((id) => summariesByTeam.get(id)?.averageRating ?? null, "asc", "best-bad") },
  ];

  return (
    <div className="team-schedule-view team-branded-schedule" style={teamBrandStyle(team.color)}>
      <section className="team-schedule-hero">
        <div className="team-schedule-overview">
          <CustomSelect
            label="Switch team"
            value={team.id}
            onChange={(value) => onSelectTeam(value === "all" ? "" : value)}
            options={[
              { value: "all", label: "All team schedules", description: "Sortable league directory" },
              ...schedule.setup.teams.map((item) => ({
                value: item.id,
                label: teamDisplayName(item, showCity),
                description: divisionById.get(item.divisionId)?.name,
                swatch: item.color,
                logoUrl: item.logoUrl,
                monogram: teamInitials(item),
              })),
            ]}
            triggerContent={
              <TeamIdentityBlock
                team={team}
                division={division}
                leagueRank={summary.liveRank}
                record={recordFor(team.id)}
                showCity={showCity}
              />
            }
          />
          <span className="team-schedule-facts">
            {division
              ? <DivisionIdentity division={division} detail={`${divisionTeamCount}-team division`} />
              : <strong>Independent</strong>}
            <small className="team-schedule-rankline">Live rank <b>#{summary.liveRank}</b> · Preseason seed #{summary.divisionSeed}</small>
            <span className="team-award-chips" aria-label="Team awards summary">
              <span className="award-chip"><strong>MVT {formatPoints(teamStats.mvtScore)}</strong>{teamStats.mvtRank ? <small>#{teamStats.mvtRank}</small> : <small>—</small>}</span>
              <span className="award-chip"><strong>All-Star {teamStats.allStarCount}</strong>{teamStats.allStarRank ? <small>#{teamStats.allStarRank}</small> : <small>—</small>}</span>
            </span>
            <ClinchBadges timeline={currentClinches.get(team.id)} division={division} />
            <small>{[
              schedule.setup.display?.managers !== false ? team.manager || "No manager" : "",
              schedule.setup.display?.venues !== false ? team.stadium : "",
            ].filter(Boolean).join(" · ")}</small>
          </span>
        </div>
      </section>

      <div className="team-schedule-table-wrap">
        <table className="team-schedule-table">
          <caption className="sr-only">{teamDisplayName(team, showCity)} full-season schedule</caption>
          <thead>
            <tr>
              <th scope="col" className="col-week">WK</th>
              <th scope="col" className="col-location">H/A</th>
              <th scope="col" className="col-opponent">OPPONENT</th>
              <th scope="col" className="col-gotw"><span className="schedule-gotw-header"><Star aria-hidden="true" /><b>GOTW</b></span></th>
              <th scope="col" className="col-result">W/L</th>
              <th scope="col" className="col-score">SCORE</th>
              {display.venues && <th scope="col" className="col-venue">VENUE</th>}
              {display.matchup && <th scope="col" className="col-matchup">MATCHUP</th>}
              {display.rating && <th scope="col" className="col-rating">RATING</th>}
              {display.badges && <th scope="col" className="col-badges">BADGES</th>}
              {display.details && <th scope="col" className="col-details">DATE · NOTES</th>}
              <th scope="col" className="col-actions"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {schedule.weeks.map((week) => {
              const game = week.games.find((item) => item.homeTeamId === team.id || item.awayTeamId === team.id);
              const holidays = getNflWeekWindow(schedule.setup.seasonYear, week.weekNumber).holidays;
              if (!game) {
                return (
                  <tr className="team-bye-row" key={week.weekNumber}>
                    <td className="col-week">{renderWeekLink(week.weekNumber, week.dateLabel, holidays)}</td>
                    <td className="col-location">—</td>
                    <td className="col-opponent"><strong>Bye week</strong></td>
                    <td className="col-gotw">—</td>
                    <td className="col-result"><span className="result-chip bye">BYE</span></td>
                    <td className="col-score">—</td>
                    {display.venues && <td className="col-venue">—</td>}
                    {display.matchup && <td className="col-matchup">—</td>}
                    {display.rating && <td className="col-rating">—</td>}
                    {display.badges && <td className="col-badges">—</td>}
                    {display.details && <td className="col-details">Team bye</td>}
                    <td className="col-actions">—</td>
                  </tr>
                );
              }

              const isHome = game.homeTeamId === team.id;
              const opponent = teamById.get(isHome ? game.awayTeamId : game.homeTeamId);
              const home = teamById.get(game.homeTeamId);
              const away = teamById.get(game.awayTeamId);
              if (!opponent || !home || !away) {
                const spannedColumns = 4 + [display.venues, display.matchup, display.rating, display.badges, display.details].filter(Boolean).length;
                return (
                  <tr className="team-bye-row" key={week.weekNumber}>
                    <td className="col-week">{renderWeekLink(week.weekNumber, week.dateLabel, holidays)}</td>
                    <td className="col-location">—</td>
                    <td className="col-opponent"><strong>Opponent unavailable</strong></td>
                    <td colSpan={spannedColumns}>This matchup references a team that is no longer in the league.</td>
                  </tr>
                );
              }
              const opponentDivision = divisionById.get(opponent.divisionId);
              const displayedSnapshot = getEnteringWeekRankSnapshot(schedule, week.weekNumber);
              const displayedStandingsByTeam = new Map(displayedSnapshot.rows.map((row) => [row.teamId, row]));
              const opponentStanding = displayedStandingsByTeam.get(opponent.id);
              const awayStanding = displayedStandingsByTeam.get(away.id);
              const homeStanding = displayedStandingsByTeam.get(home.id);
              const awayRank = awayStanding?.rank ?? away.overallRank;
              const homeRank = homeStanding?.rank ?? home.overallRank;
              const teamRank = isHome ? homeRank : awayRank;
              const opponentRank = isHome ? awayRank : homeRank;
              const played = isGamePlayed(game);
              const ownScore = isHome ? game.homeScore : game.awayScore;
              const opponentScore = isHome ? game.awayScore : game.homeScore;
              const result = !played ? "—" : ownScore === opponentScore ? "T" : ownScore! > opponentScore! ? "W" : "L";
              const isTied = played && game.awayScore === game.homeScore;
              const awayScoreClass = isTied ? "score-tied" : game.awayScore! > game.homeScore! ? "score-winner" : "score-loser";
              const homeScoreClass = isTied ? "score-tied" : game.homeScore! > game.awayScore! ? "score-winner" : "score-loser";
              const gotwEntry = scheduleSignals.gotwByWeek.get(week.weekNumber);
              const signal = getMatchupSignal(game, undefined, planningRatingRange, teamCount);
              const simulationResult = simulationResults[game.id];
              const simulationLabel = simulationResult
                ? `${simulationResult.source === "override" ? "Commissioner result" : "Simulated"}${simulationResult.locked ? " · Locked" : ""}`
                : undefined;
              const metadata = [simulationLabel, game.rescheduleStatus, game.specialEvent, ...(game.notes ?? []), game.tbdReason].filter(Boolean).join(" · ");
              const isGameOfWeek = gotwEntry?.game.id === game.id;
              const gotwLabel = gotwEntry ? gameOfWeekStatusLabel(gotwEntry.status) : "GOTW";
              const badges = (scheduleSignals.byGameId.get(game.id)?.badges ?? []).filter((badge) => badge !== "GOTW");

              return (
                <tr
                  className={[onOpenGame ? "is-openable" : "", isGameOfWeek ? "is-gotw" : "", simulationResult ? `is-simulated simulation-${simulationResult.source}` : ""].filter(Boolean).join(" ")}
                  key={week.weekNumber}
                  role={onOpenGame ? "button" : undefined}
                  tabIndex={onOpenGame ? 0 : undefined}
                  aria-label={onOpenGame ? `Open game details for Week ${week.weekNumber}, ${away.name} at ${home.name}` : undefined}
                  onClick={(event) => { if (onOpenGame && !isInteractiveTarget(event.target)) onOpenGame(game.id); }}
                  onKeyDown={(event) => {
                    if (!onOpenGame || isInteractiveTarget(event.target)) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenGame(game.id);
                    }
                  }}
                >
                  <td className="col-week">{renderWeekLink(week.weekNumber, week.dateLabel, holidays)}</td>
                  <td className="col-location"><span className="location-chip"><span aria-hidden="true">{isHome ? "vs" : "@"}</span><span className="sr-only">{isHome ? "Home versus" : "Away at"}</span></span></td>
                  <td className="col-opponent">
                    <div className="team-table-opponent">
                      <TeamIdentityBlock
                        compact
                        showRecord={false}
                        team={opponent}
                        division={opponentDivision}
                        leagueRank={opponentStanding?.rank ?? opponent.overallRank}
                        record={{ overall: "0-0" }}
                        showCity={showCity}
                        href={teamHrefFor ? teamHrefFor(opponent.id) : `${teamHrefBase}/${opponent.id}`}
                      />
                    </div>
                  </td>
                  <td className="col-gotw">{isGameOfWeek ? <GameBadgeChip badge="GOTW" title={gotwLabel} /> : <span aria-hidden="true">—</span>}</td>
                  <td className="col-result"><span className={`result-chip result-${result.toLowerCase()}`}>{result}</span></td>
                  <td className="col-score table-score" aria-label={played ? `${away.name} ${game.awayScore} at ${home.name} ${game.homeScore}` : "Score not entered"}>
                    {played ? <><strong className={awayScoreClass}>{game.awayScore}</strong><i aria-hidden="true">@</i><strong className={homeScoreClass}>{game.homeScore}</strong></> : "—"}
                  </td>
                  {display.venues && <td className="col-venue"><span className="table-venue"><MapPin />{home.logoUrl && <img src={home.logoUrl} alt="" />}<strong>{game.stadium}</strong></span></td>}
                  {display.matchup && <td className="col-matchup"><MatchupSeriesChip game={game} awayDivision={divisionById.get(away.divisionId)} homeDivision={divisionById.get(home.divisionId)} setup={schedule.setup} /></td>}
                  {display.rating && <td className="col-rating"><span className="table-rating-cell"><span className={`table-signal signal-${signal.label.toLowerCase()}`} aria-label={`${signal.label} matchup, rated ${signal.score10.toFixed(1)} out of 10; higher is better`} title={`${signal.label} · ${signal.score10.toFixed(1)}/10; higher is better`}>{Array.from({ length: 3 }, (_, index) => <i className={index < signal.bars ? "active" : ""} key={index} />)}<strong>{signal.score10.toFixed(1)}</strong></span><small className="table-rating-ranks" aria-label={`${team.name} entered Week ${week.weekNumber} ranked ${teamRank}; opponent ranked ${opponentRank}. Away rank ${awayRank} versus home rank ${homeRank}.`}>{!isHome ? <Tooltip label={`${team.name}'s Week ${week.weekNumber} rank`}><span className="is-schedule-team-rank">#{awayRank}</span></Tooltip> : <span>#{awayRank}</span>}<em aria-hidden="true">vs</em>{isHome ? <Tooltip label={`${team.name}'s Week ${week.weekNumber} rank`}><span className="is-schedule-team-rank">#{homeRank}</span></Tooltip> : <span>#{homeRank}</span>}</small></span></td>}
                  {display.badges && <td className="col-badges">{badges.length ? <span className="game-badge-row">{badges.map((badge) => <GameBadgeChip badge={badge} key={badge} />)}</span> : "—"}</td>}
                  {display.details && <td className="col-details"><span className="team-game-details">{game.dateTimeOverride && <strong>{formatGameDateTimeOverride(game.dateTimeOverride)}</strong>}{metadata && <small>{metadata}</small>}{!game.dateTimeOverride && !metadata && "—"}</span></td>}
                  <td className="col-actions">
                    <FloatingPopover className="table-actions" label={`Actions for Week ${week.weekNumber}`} trigger={<MoreHorizontal />} menuClassName="table-actions-menu">
                        {!readOnlyHistory && <Link href={`/season/${schedule.id}?view=scores&week=${week.weekNumber}`}>Set score</Link>}
                        <Link href={`${leagueWeekHrefFor ? leagueWeekHrefFor(week.weekNumber) : `/season/${schedule.id}?week=${week.weekNumber}`}#${game.id}`}>Game details</Link>
                        <Link href={teamHrefFor ? teamHrefFor(opponent.id) : `${teamHrefBase}/${opponent.id}`}>Opponent schedule</Link>
                    </FloatingPopover>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile-only card view of the same per-week data. The wide table can't
          show opponent + result together on a phone, so ≤560px swaps to cards
          (CSS toggles which of the two is visible; desktop table is untouched). */}
      {/* Card view (≤560px) renders the SAME shared <MatchupCard> the League
          Schedule uses, so the team schedule's match cards match it exactly. The
          week is carried on the card's own label slots (chip + date). */}
      <div className="team-schedule-cards" aria-label={`${teamDisplayName(team, showCity)} schedule, card view`}>
        {schedule.weeks.map((week) => {
          const game = week.games.find((item) => item.homeTeamId === team.id || item.awayTeamId === team.id);
          if (!game) {
            return (
              <article className="matchup-card matchup-card-standard team-week-bye-card" key={week.weekNumber}>
                <div className="matchup-card-badges"><div className="matchup-card-chips"><span className="game-order-chip">Week {week.weekNumber}</span></div><div className="matchup-card-meta"><span className="result-chip bye">BYE</span></div></div>
                <div className="matchup-card-main team-week-bye-main"><strong>Bye week</strong><small>{week.dateLabel}</small></div>
              </article>
            );
          }
          const away = teamById.get(game.awayTeamId);
          const home = teamById.get(game.homeTeamId);
          if (!away || !home) return null;
          // Record + rank are shown "through this game" — the state AFTER that week's
          // result (a finished Week 1 win shows 1-0 in Week 1), like a running game log.
          // Unplayed future weeks resolve to the current record (no games beyond the last
          // played week count), so the tally freezes at "now" and doesn't pre-fill ahead.
          const throughSnapshot = getWeekRankSnapshot(schedule, week.weekNumber);
          const rowById = new Map(throughSnapshot.rows.map((row) => [row.teamId, row]));
          const rankFor = (id: string, fallback: number) => rowById.get(id)?.rank ?? fallback;
          const recordThroughWeek = (id: string) => {
            const row = rowById.get(id);
            if (!row) return { overall: "0-0", division: "0-0" };
            return { overall: row.wins === 0 && row.losses === 0 ? "0-0" : formatRecord(row), division: `${row.divisionWins}-${row.divisionLosses}` };
          };
          const gotwEntry = scheduleSignals.gotwByWeek.get(week.weekNumber);
          const isGameOfWeek = gotwEntry?.game.id === game.id;
          return (
            <MatchupCard
              key={week.weekNumber}
              game={game}
              away={away}
              home={home}
              awayDivision={divisionById.get(away.divisionId)}
              homeDivision={divisionById.get(home.divisionId)}
              setup={schedule.setup}
              awayRank={rankFor(away.id, away.overallRank)}
              homeRank={rankFor(home.id, home.overallRank)}
              awayRecord={recordThroughWeek(away.id)}
              homeRecord={recordThroughWeek(home.id)}
              signal={getMatchupSignal(game, undefined, planningRatingRange, teamCount)}
              featured={isGameOfWeek}
              featuredLabel={gotwEntry ? gameOfWeekStatusLabel(gotwEntry.status) : "GOTW"}
              gameLabel={`Week ${week.weekNumber}`}
              dateLabel={week.dateLabel}
              showCity={showCity}
              showVenue={schedule.setup.display?.venues !== false}
              badges={scheduleSignals.byGameId.get(game.id)?.badges ?? []}
              teamHrefBase={teamHrefBase}
              teamHrefFor={teamHrefFor}
              onOpenGame={onOpenGame}
            />
          );
        })}
      </div>

      <section className="team-performance-panel" aria-label={`${teamDisplayName(team, showCity)} team statistics`}>
        <header><BarChart3 /><span><strong>Team performance</strong><small>{currentSnapshot.weekNumber ? `Results through Week ${currentSnapshot.weekNumber}` : "No results entered yet"}</small></span></header>
        <dl className="team-performance-grid">
          {performanceStats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd className={stat.tone}><strong className="team-stat-value">{stat.value}</strong><small className={`team-stat-placement placement-${stat.placement.tone}`}>{stat.placement.label}</small></dd></div>)}
        </dl>
      </section>

      <section className="team-player-soon public-soon" aria-label={`${teamDisplayName(team, showCity)} player data`}>
        <span className="public-soon-mark"><UsersRound /></span>
        <strong>Roster / Players</strong>
        <p>Player rosters, weekly player points, All-Star selections, and MVT breakdowns will appear here once player-level data is connected for this league.</p>
        <span className="public-soon-chip">Coming soon</span>
      </section>

      <MatchupRatingLegend />
    </div>
  );
}
