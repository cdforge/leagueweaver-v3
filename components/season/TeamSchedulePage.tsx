"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { BarChart3, MapPin, MoreHorizontal, SlidersHorizontal, Star } from "lucide-react";
import { ClinchBadges } from "@/components/season/ClinchBadges";
import { GameBadgeChip, MatchupRatingLegend, MatchupSeriesChip, TeamIdentityBlock } from "@/components/season/MatchupPresentation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DivisionIdentity } from "@/components/ui/DivisionIdentity";
import { FloatingPopover } from "@/components/ui/FloatingPopover";
import { Tooltip } from "@/components/ui/Tooltip";
import { accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { getTeamClinchTimelines, type TeamClinchTimeline } from "@/lib/clinch";
import { calculateMatchupRating, formatGameDateTimeOverride, getMatchupRatingRange, getMatchupSignal } from "@/lib/matchups";
import { getWeekOneRankMap } from "@/lib/rankings";
import { getNflWeekWindow } from "@/lib/schedule";
import { formatRecord, getEnteringWeekRankSnapshot, getWeekRankSnapshot } from "@/lib/standings";
import { calculateTeamSeasonStats, formatSplitRecord, gameOfWeekStatusLabel, getScheduleGameSignals, recordGames, recordPercentage } from "@/lib/statistics";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, RankedStandingsRow, Team } from "@/lib/types";

type DirectorySortKey = "team" | "group" | "home" | "away" | "byes" | "division" | "rating" | "sos";
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

const DIRECTORY_SORT_OPTIONS = [
  { value: "team", label: "Team A–Z", description: "Alphabetical by team name" },
  { value: "group", label: "Division and seed", description: "Division, then preseason seed" },
  { value: "home", label: "Most home games", description: "Highest home-game count first" },
  { value: "away", label: "Most away games", description: "Highest away-game count first" },
  { value: "byes", label: "Most byes", description: "Highest bye-week count first" },
  { value: "division", label: "Most divisional", description: "Highest division-game count first" },
  { value: "rating", label: "Toughest avg rating", description: "Lower matchup rating first" },
  { value: "sos", label: "Hardest SOS", description: "Toughest opponent list first" },
];

const DISPLAY_OPTIONS: Array<{ key: DisplayKey; label: string }> = [
  { key: "cityNames", label: "City names" },
  { key: "venues", label: "Venues" },
  { key: "matchup", label: "Matchup type" },
  { key: "rating", label: "Ratings" },
  { key: "badges", label: "Game badges" },
  { key: "details", label: "Date and notes" },
];

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

function buildTeamScheduleSummaries(schedule: GeneratedSchedule): TeamScheduleSummary[] {
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
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
  const [sortKey, setSortKey] = useState<DirectorySortKey>("team");
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const showCity = schedule.setup.display?.cityNames !== false;
  const sortedSummaries = useMemo(() => [...summaries].sort((left, right) => {
    if (sortKey === "team") return teamDisplayName(left.team, showCity).localeCompare(teamDisplayName(right.team, showCity));
    if (sortKey === "group") {
      const divisionDifference = (divisionById.get(left.team.divisionId)?.name ?? "").localeCompare(divisionById.get(right.team.divisionId)?.name ?? "");
      return divisionDifference || left.divisionSeed - right.divisionSeed;
    }
    if (sortKey === "home") return right.homeGames - left.homeGames || left.team.name.localeCompare(right.team.name);
    if (sortKey === "away") return right.awayGames - left.awayGames || left.team.name.localeCompare(right.team.name);
    if (sortKey === "byes") return right.byes - left.byes || left.team.name.localeCompare(right.team.name);
    if (sortKey === "division") return right.divisionGames - left.divisionGames || left.team.name.localeCompare(right.team.name);
    if (sortKey === "rating") return left.averageRating - right.averageRating || left.team.name.localeCompare(right.team.name);
    return left.sosRank - right.sosRank || left.team.name.localeCompare(right.team.name);
  }), [divisionById, showCity, sortKey, summaries]);

  return (
    <div className="team-schedule-directory">
      <section className="team-directory-toolbar">
        <span>
          <strong>All team schedules</strong>
          <small>Compare schedule shape, opponent strength, and current results before opening a team.</small>
        </span>
        <CustomSelect
          label="Sort team schedules"
          value={sortKey}
          onChange={(value) => setSortKey(value as DirectorySortKey)}
          options={DIRECTORY_SORT_OPTIONS}
        />
      </section>

      <div className="team-directory-grid">
        {sortedSummaries.map((summary) => {
          const division = divisionById.get(summary.team.divisionId);
          return (
            <button
              type="button"
              className="team-directory-card"
              style={teamBrandStyle(summary.team.color)}
              onClick={() => onSelectTeam(summary.team.id)}
              aria-label={`Open ${teamDisplayName(summary.team, showCity)} schedule`}
              key={summary.team.id}
            >
              <TeamIdentityBlock
                team={summary.team}
                division={division}
                leagueRank={summary.liveRank}
                record={summary.record}
                showCity={showCity}
              />
              <span className="team-directory-group">
                {division ? <DivisionIdentity division={division} detail={`Division seed #${summary.divisionSeed}`} /> : <strong>Independent</strong>}
                <small>League rank #{summary.liveRank}</small>
                <ClinchBadges timeline={clinches.get(summary.team.id)} division={division} compact />
              </span>
              <dl className="team-directory-stats">
                <div><dt>Home</dt><dd>{summary.homeGames}</dd></div>
                <div><dt>Away</dt><dd>{summary.awayGames}</dd></div>
                <div><dt>Byes</dt><dd>{summary.byes}</dd></div>
                <div><dt>Divisional</dt><dd>{summary.divisionGames}</dd></div>
                <div><dt>Avg rating</dt><dd>{summary.averageRating.toFixed(1)}</dd></div>
                <div><dt>SOS</dt><dd>{ordinal(summary.sosRank)} hardest</dd></div>
              </dl>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TeamScheduleView({ schedule, teamId, onSelectTeam, onSelectWeek, simulationResults = {} }: {
  schedule: GeneratedSchedule;
  teamId: string;
  onSelectTeam: (teamId: string) => void;
  onSelectWeek: (week: number) => void;
  simulationResults?: Record<string, {
    source: "simulated" | "override";
    locked: boolean;
  }>;
}) {
  const scheduleSignals = useMemo(() => getScheduleGameSignals(schedule), [schedule]);
  const summaries = useMemo(() => buildTeamScheduleSummaries(schedule), [schedule]);
  const seasonStatsByTeam = useMemo(() => new Map(calculateTeamSeasonStats(schedule).map((row) => [row.teamId, row])), [schedule]);
  const currentClinches = useMemo(() => new Map(getTeamClinchTimelines(schedule).map((timeline) => [timeline.teamId, timeline])), [schedule]);
  const [display, setDisplay] = useState<Record<DisplayKey, boolean>>({
    cityNames: schedule.setup.display?.cityNames !== false,
    venues: schedule.setup.display?.venues !== false,
    matchup: true,
    rating: true,
    badges: true,
    details: false,
  });
  const team = schedule.setup.teams.find((item) => item.id === teamId);
  if (!team) return <TeamScheduleDirectory schedule={schedule} summaries={summaries} clinches={currentClinches} onSelectTeam={onSelectTeam} />;

  const teamById = new Map(schedule.setup.teams.map((item) => [item.id, item]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const planningRatingRange = getMatchupRatingRange(schedule.weeks.flatMap((week) => week.games));
  const currentSnapshot = getWeekRankSnapshot(schedule, schedule.setup.weeks);
  const currentStandingsByTeam = new Map(currentSnapshot.rows.map((row) => [row.teamId, row]));
  const recordFor = (recordTeamId: string) => {
    const row = currentStandingsByTeam.get(recordTeamId);
    return { overall: row ? formatRecord(row) : "0-0", division: row ? `${row.divisionWins}-${row.divisionLosses}` : "0-0" };
  };
  const division = divisionById.get(team.divisionId);
  const divisionTeamCount = division ? schedule.setup.teams.filter((item) => item.divisionId === division.id).length : 0;
  const summary = summaries.find((item) => item.team.id === team.id)!;
  const teamStats = seasonStatsByTeam.get(team.id)!;
  const showCity = display.cityNames;
  const toggleDisplay = (key: DisplayKey) => setDisplay((current) => ({ ...current, [key]: !current[key] }));
  const renderWeekLink = (weekNumber: number, dateLabel: string, holidays: string[]) => (
    <button type="button" className="team-week-link" onClick={() => onSelectWeek(weekNumber)} aria-label={`Open the full league schedule for Week ${weekNumber}`}>
      <strong>W{weekNumber}</strong>
      <small>{dateLabel}</small>
      {holidays.map((holiday) => <em key={holiday}>{holiday}</em>)}
    </button>
  );
  const pointDifference = teamStats.pointsFor - teamStats.pointsAgainst;
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
    { label: "Win %", value: statDecimal(teamStats.winPercentage), placement: placement((id) => statRowsByTeam.get(id)?.winPercentage ?? null) },
    { label: "Points for", value: String(teamStats.pointsFor), placement: placement((id) => statRowsByTeam.get(id)?.pointsFor ?? null) },
    { label: "Points against", value: String(teamStats.pointsAgainst), placement: placement((id) => statRowsByTeam.get(id)?.pointsAgainst ?? null, "asc") },
    { label: "Point differential", value: `${pointDifference >= 0 ? "+" : ""}${pointDifference}`, tone: pointDifference >= 0 ? "positive" : "negative", placement: placement((id) => {
      const row = statRowsByTeam.get(id);
      return row ? row.pointsFor - row.pointsAgainst : null;
    }) },
    { label: "Strength of victory", value: statDecimal(teamStats.strengthOfVictory), placement: placement((id) => statRowsByTeam.get(id)?.strengthOfVictory ?? null) },
    { label: "Strength of schedule", value: statDecimal(teamStats.strengthOfSchedule), placement: placement((id) => statRowsByTeam.get(id)?.strengthOfSchedule ?? null, "desc", "best-bad") },
    { label: "Streak", value: teamStats.streak, placement: placement((id) => streakValue(statRowsByTeam.get(id)?.streak ?? "—")) },
    { label: "GOTW wins", value: String(teamStats.featuredWins), placement: placement((id) => statRowsByTeam.get(id)?.featuredWins ?? null) },
    { label: "Byes", value: String(summary.byes), placement: placement((id) => summariesByTeam.get(id)?.byes ?? null, "desc", "neutral") },
    { label: "Average rating", value: summary.averageRating.toFixed(1), placement: placement((id) => summariesByTeam.get(id)?.averageRating ?? null, "asc", "best-bad") },
  ];

  return (
    <div className="team-schedule-view team-branded-schedule" style={teamBrandStyle(team.color)}>
      <section className="team-schedule-hero">
        <div className="team-schedule-overview">
          <TeamIdentityBlock
            team={team}
            division={division}
            leagueRank={summary.liveRank}
            record={recordFor(team.id)}
            showCity={showCity}
          />
          <span className="team-schedule-facts">
            {division
              ? <DivisionIdentity division={division} detail={`${divisionTeamCount} teams · preseason seed #${summary.divisionSeed}`} />
              : <strong>Independent</strong>}
            <ClinchBadges timeline={currentClinches.get(team.id)} division={division} />
            <small>{[
              schedule.setup.display?.managers !== false ? team.manager || "No manager" : "",
              schedule.setup.display?.venues !== false ? team.stadium : "",
            ].filter(Boolean).join(" · ")}</small>
          </span>
        </div>
        <div className="team-schedule-controls">
          <CustomSelect
            label="Choose team schedule"
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
          />
          <FloatingPopover className="team-display-menu" label="Choose schedule fields" trigger={<><SlidersHorizontal />Display</>} closeOnSelect={false} menuClassName="team-display-menu-panel">
              {DISPLAY_OPTIONS.map((option) => (
                <label key={option.key}>
                  <input type="checkbox" checked={display[option.key]} onChange={() => toggleDisplay(option.key)} />
                  <span>{option.label}</span>
                </label>
              ))}
          </FloatingPopover>
        </div>
      </section>

      <div className="team-schedule-table-wrap">
        <table className="team-schedule-table">
          <thead>
            <tr>
              <th className="col-week">WK</th>
              <th className="col-location">H/A</th>
              <th className="col-opponent">OPPONENT</th>
              <th className="col-gotw"><span className="schedule-gotw-header"><Star aria-hidden="true" /><b>GOTW</b></span></th>
              <th className="col-result">W/L</th>
              <th className="col-score">SCORE</th>
              {display.venues && <th className="col-venue">VENUE</th>}
              {display.matchup && <th className="col-matchup">MATCHUP</th>}
              {display.rating && <th className="col-rating">RATING</th>}
              {display.badges && <th className="col-badges">BADGES</th>}
              {display.details && <th className="col-details">DATE · NOTES</th>}
              <th className="col-actions"><span className="sr-only">Actions</span></th>
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
              const opponent = teamById.get(isHome ? game.awayTeamId : game.homeTeamId)!;
              const opponentDivision = divisionById.get(opponent.divisionId);
              const home = teamById.get(game.homeTeamId)!;
              const away = teamById.get(game.awayTeamId)!;
              const displayedSnapshot = getEnteringWeekRankSnapshot(schedule, week.weekNumber);
              const displayedStandingsByTeam = new Map(displayedSnapshot.rows.map((row) => [row.teamId, row]));
              const opponentStanding = displayedStandingsByTeam.get(opponent.id);
              const awayStanding = displayedStandingsByTeam.get(away.id);
              const homeStanding = displayedStandingsByTeam.get(home.id);
              const awayRank = awayStanding?.rank ?? away.overallRank;
              const homeRank = homeStanding?.rank ?? home.overallRank;
              const teamRank = isHome ? homeRank : awayRank;
              const opponentRank = isHome ? awayRank : homeRank;
              const played = game.homeScore != null && game.awayScore != null;
              const ownScore = isHome ? game.homeScore : game.awayScore;
              const opponentScore = isHome ? game.awayScore : game.homeScore;
              const result = !played ? "—" : ownScore === opponentScore ? "T" : ownScore! > opponentScore! ? "W" : "L";
              const isTied = played && game.awayScore === game.homeScore;
              const awayScoreClass = isTied ? "score-tied" : game.awayScore! > game.homeScore! ? "score-winner" : "score-loser";
              const homeScoreClass = isTied ? "score-tied" : game.homeScore! > game.awayScore! ? "score-winner" : "score-loser";
              const gotwEntry = scheduleSignals.gotwByWeek.get(week.weekNumber);
              const signal = getMatchupSignal(game, undefined, planningRatingRange);
              const simulationResult = simulationResults[game.id];
              const simulationLabel = simulationResult
                ? `${simulationResult.source === "override" ? "Commissioner result" : "Simulated"}${simulationResult.locked ? " · Locked" : ""}`
                : undefined;
              const metadata = [simulationLabel, game.rescheduleStatus, game.specialEvent, ...(game.notes ?? []), game.tbdReason].filter(Boolean).join(" · ");
              const isGameOfWeek = gotwEntry?.game.id === game.id;
              const gotwLabel = gotwEntry ? gameOfWeekStatusLabel(gotwEntry.status) : "GOTW";
              const badges = (scheduleSignals.byGameId.get(game.id)?.badges ?? []).filter((badge) => badge !== "GOTW");

              return (
                <tr className={[isGameOfWeek ? "is-gotw" : "", simulationResult ? `is-simulated simulation-${simulationResult.source}` : ""].filter(Boolean).join(" ")} key={week.weekNumber}>
                  <td className="col-week">{renderWeekLink(week.weekNumber, week.dateLabel, holidays)}</td>
                  <td className="col-location"><span className="location-chip">{isHome ? "vs" : "@"}</span></td>
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
                        href={`/season/${schedule.id}/team/${opponent.id}`}
                      />
                    </div>
                  </td>
                  <td className="col-gotw">{isGameOfWeek ? <GameBadgeChip badge="GOTW" title={gotwLabel} /> : <span aria-hidden="true">—</span>}</td>
                  <td className="col-result"><span className={`result-chip result-${result.toLowerCase()}`}>{result}</span></td>
                  <td className="col-score table-score" aria-label={played ? `${away.name} ${game.awayScore} at ${home.name} ${game.homeScore}` : "Score not entered"}>
                    {played ? <><strong className={awayScoreClass}>{game.awayScore}</strong><i aria-hidden="true">@</i><strong className={homeScoreClass}>{game.homeScore}</strong></> : "—"}
                  </td>
                  {display.venues && <td className="col-venue"><span className="table-venue"><MapPin />{home.logoUrl && <img src={home.logoUrl} alt="" />}<strong>{game.stadium}</strong></span></td>}
                  {display.matchup && <td className="col-matchup"><MatchupSeriesChip game={game} division={opponentDivision} /></td>}
                  {display.rating && <td className="col-rating"><span className="table-rating-cell"><span className={`table-signal signal-${signal.label.toLowerCase()}`} aria-label={`${signal.label} matchup, rating ${signal.rating.toFixed(1)}; lower is better`} title={`${signal.label} · rating ${signal.rating.toFixed(1)}; lower is better`}>{Array.from({ length: 3 }, (_, index) => <i className={index < signal.bars ? "active" : ""} key={index} />)}<strong>{signal.rating.toFixed(1)}</strong></span><small className="table-rating-ranks" aria-label={`${team.name} entered Week ${week.weekNumber} ranked ${teamRank}; opponent ranked ${opponentRank}. Away rank ${awayRank} versus home rank ${homeRank}.`}>{!isHome ? <Tooltip label={`${team.name}'s Week ${week.weekNumber} rank`}><span className="is-schedule-team-rank">#{awayRank}</span></Tooltip> : <span>#{awayRank}</span>}<em aria-hidden="true">vs</em>{isHome ? <Tooltip label={`${team.name}'s Week ${week.weekNumber} rank`}><span className="is-schedule-team-rank">#{homeRank}</span></Tooltip> : <span>#{homeRank}</span>}</small></span></td>}
                  {display.badges && <td className="col-badges">{badges.length ? <span className="game-badge-row">{badges.map((badge) => <GameBadgeChip badge={badge} key={badge} />)}</span> : "—"}</td>}
                  {display.details && <td className="col-details"><span className="team-game-details">{game.dateTimeOverride && <strong>{formatGameDateTimeOverride(game.dateTimeOverride)}</strong>}{metadata && <small>{metadata}</small>}{!game.dateTimeOverride && !metadata && "—"}</span></td>}
                  <td className="col-actions">
                    <FloatingPopover className="table-actions" label={`Actions for Week ${week.weekNumber}`} trigger={<MoreHorizontal />} menuClassName="table-actions-menu">
                        <Link href={`/season/${schedule.id}?view=scores&week=${week.weekNumber}`}>Set score</Link>
                        <Link href={`/season/${schedule.id}?week=${week.weekNumber}#${game.id}`}>Game details</Link>
                        <Link href={`/season/${schedule.id}/team/${opponent.id}`}>Opponent schedule</Link>
                    </FloatingPopover>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="team-performance-panel" aria-label={`${teamDisplayName(team, showCity)} team statistics`}>
        <header><BarChart3 /><span><strong>Team performance</strong><small>Results through Week {currentSnapshot.weekNumber || 0}</small></span></header>
        <dl className="team-performance-grid">
          {performanceStats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd className={stat.tone}><strong className="team-stat-value">{stat.value}</strong><small className={`team-stat-placement placement-${stat.placement.tone}`}>{stat.placement.label}</small></dd></div>)}
        </dl>
      </section>

      <MatchupRatingLegend />
    </div>
  );
}
