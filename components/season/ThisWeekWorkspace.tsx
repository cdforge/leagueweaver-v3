"use client";

import * as React from "react";
import { BarChart3, ChevronDown, MapPin, Sparkles, Star, UsersRound } from "lucide-react";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { MatchupCard, WeekMatchupRank } from "@/components/season/MatchupPresentation";
import { readableTextColor } from "@/lib/colorContrast";
import { buildGameDetailVM, type GameDetailPlayerStat, type GameDetailSideVM } from "@/lib/gameDetail";
import { getMatchupRatingRange, getMatchupSignal, weekSlateScore10 } from "@/lib/matchups";
import { getCurrentSlateWeek, getNflWeekWindow } from "@/lib/schedule";
import { formatPoints, gameOfWeekStatusLabel, getScheduleGameSignals } from "@/lib/statistics";
import { formatRecord, getEnteringWeekRankSnapshot } from "@/lib/standings";
import { teamInitials } from "@/lib/teamIdentity";
import { getWeekPhase } from "@/lib/weekPhase";
import type { GeneratedSchedule, ScheduledGame, Team } from "@/lib/types";

type LayoutMode = "featured" | "grid";

function useStoredMode(scheduleId: string): [LayoutMode, (mode: LayoutMode) => void] {
  const key = `leagueweaver:v3:this-week-mode:${scheduleId}`;
  const [mode, setModeState] = React.useState<LayoutMode>(() => {
    try {
      if (typeof window === "undefined") return "featured";
      const stored = window.localStorage.getItem(key);
      return stored === "grid" || stored === "featured" ? stored : "featured";
    } catch {
      return "featured";
    }
  });
  const setMode = (next: LayoutMode) => {
    setModeState(next);
    try { window.localStorage.setItem(key, next); } catch { /* ignore quota */ }
  };
  return [mode, setMode];
}

function teamDisplay(team: Team, showCity: boolean) {
  return `${showCity && team.city ? `${team.city} ` : ""}${team.name}`;
}

function scoredGames(schedule: GeneratedSchedule, teamId: string, beforeWeek: number) {
  return schedule.weeks.flatMap((week) => week.weekNumber < beforeWeek ? week.games : [])
    .filter((game) => (game.homeTeamId === teamId || game.awayTeamId === teamId) && game.homeScore != null && game.awayScore != null);
}

function avgPoints(schedule: GeneratedSchedule, teamId: string, beforeWeek: number) {
  const games = scoredGames(schedule, teamId, beforeWeek);
  if (!games.length) return null;
  const total = games.reduce((sum, game) => sum + (game.homeTeamId === teamId ? game.homeScore ?? 0 : game.awayScore ?? 0), 0);
  return total / games.length;
}

function lastResult(schedule: GeneratedSchedule, teamId: string, beforeWeek: number) {
  const game = scoredGames(schedule, teamId, beforeWeek).at(-1);
  if (!game) return "L1 --";
  const own = game.homeTeamId === teamId ? game.homeScore! : game.awayScore!;
  const opp = game.homeTeamId === teamId ? game.awayScore! : game.homeScore!;
  if (own === opp) return `L1 T ${formatPoints(own)}`;
  return `L1 ${own > opp ? "W" : "L"} ${formatPoints(own)}-${formatPoints(opp)}`;
}

function topPlayers(side: GameDetailSideVM) {
  const rows = [...side.starters, ...side.bench].sort((left, right) => right.points - left.points).slice(0, 3);
  return rows;
}

function TeamHero({ side, schedule, weekNumber, showCity }: { side: GameDetailSideVM; schedule: GeneratedSchedule; weekNumber: number; showCity: boolean }) {
  const average = avgPoints(schedule, side.team.id, weekNumber);
  return <div className="tw-hero-team" style={{ "--team": side.team.color, "--team-on": readableTextColor(side.team.color) } as React.CSSProperties}>
    <EntityLogo color={side.team.color} logoUrl={side.team.logoUrl} monogram={teamInitials(side.team)} size={58} />
    <span>
      <small>#{side.rank}{side.division ? " · " : ""}{side.division && <><DivisionMark division={side.division} /> {side.division.name}</>}</small>
      <strong>{teamDisplay(side.team, showCity)}</strong>
      <em>{lastResult(schedule, side.team.id, weekNumber)} · Avg {average == null ? "--" : formatPoints(average)}</em>
    </span>
    <b>{side.starterTotal != null ? formatPoints(side.starterTotal) : side.platformTotal != null ? formatPoints(side.platformTotal) : "--"}</b>
  </div>;
}

function PlayerGlimpse({ side }: { side: GameDetailSideVM }) {
  const players = topPlayers(side);
  if (!players.length) return <p className="tw-player-empty">Roster data not synced yet.</p>;
  return <ul className="tw-player-glimpse">
    {players.map((player) => <li key={player.key}>
      <span>{player.position}</span>
      <strong>{player.name}</strong>
      <em>{player.nflTeam || player.slot}</em>
      <b>{formatPoints(player.points)}</b>
    </li>)}
  </ul>;
}

function storyLine(away: Team, home: Team, rating: number, showCity: boolean) {
  return `${teamDisplay(away, showCity)} and ${teamDisplay(home, showCity)} headline this week's slate with a ${rating.toFixed(1)}/10 matchup rating.`;
}

export function ThisWeekWorkspace({
  schedule,
  playerStats,
  simulationProbabilities = {},
  onOpenGame,
}: {
  schedule: GeneratedSchedule;
  playerStats: GameDetailPlayerStat[];
  simulationProbabilities?: Record<string, { away: number; home: number }>;
  onOpenGame: (gameId: string) => void;
}) {
  const [mode, setMode] = useStoredMode(schedule.id);
  const showCity = schedule.setup.display?.cityNames !== false;
  const now = React.useMemo(() => new Date(), []);
  const weekNumber = getCurrentSlateWeek(now, schedule.setup.seasonYear, schedule.weeks.length);
  const week = schedule.weeks.find((item) => item.weekNumber === weekNumber) ?? schedule.weeks[0] ?? null;
  const teamById = React.useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule.setup.teams]);
  const divisionById = React.useMemo(() => new Map(schedule.setup.divisions.map((division) => [division.id, division])), [schedule.setup.divisions]);
  const signals = React.useMemo(() => getScheduleGameSignals(schedule), [schedule]);

  if (!week) return <section className="this-week-empty"><Sparkles /><strong>No weekly slate yet</strong><span>Generate a regular-season schedule to unlock This Week.</span></section>;

  const bounds = getNflWeekWindow(schedule.setup.seasonYear, week.weekNumber);
  const phase = getWeekPhase(now, bounds, week.games.map((game) => game.dateTimeOverride).filter(Boolean).sort()[0]);
  const rankSnapshot = getEnteringWeekRankSnapshot(schedule, week.weekNumber);
  const rankByTeam = new Map(rankSnapshot.rows.map((row) => [row.teamId, row.rank]));
  const recordByTeam = new Map(rankSnapshot.rows.map((row) => [row.teamId, formatRecord(row)]));
  const range = getMatchupRatingRange(week.games, rankByTeam);
  const gotwGame = week.games.find((game) => game.gameNumber === 1) ?? week.games[0];
  const gotwVm = gotwGame ? buildGameDetailVM(schedule, gotwGame.id, playerStats) : null;
  const otherGames = week.games.filter((game) => game.id !== gotwGame?.id);
  const allCards = mode === "grid" ? week.games : otherGames;

  const cardFor = (game: ScheduledGame) => {
    const away = teamById.get(game.awayTeamId);
    const home = teamById.get(game.homeTeamId);
    if (!away || !home) return null;
    const signal = getMatchupSignal(game, rankByTeam, range, schedule.setup.teams.length);
    const featured = game.id === gotwGame?.id;
    return <MatchupCard
      key={game.id}
      game={game}
      away={away}
      home={home}
      awayDivision={divisionById.get(away.divisionId)}
      homeDivision={divisionById.get(home.divisionId)}
      awayRank={rankByTeam.get(away.id) ?? away.overallRank}
      homeRank={rankByTeam.get(home.id) ?? home.overallRank}
      awayRecord={{ overall: recordByTeam.get(away.id) ?? "0-0" }}
      homeRecord={{ overall: recordByTeam.get(home.id) ?? "0-0" }}
      signal={signal}
      featured={featured}
      featuredLabel={featured && signals.byGameId.get(game.id) ? gameOfWeekStatusLabel("current") : "GOTW"}
      gameLabel={featured ? undefined : `Game ${game.gameNumber}`}
      dateLabel={`Week ${week.weekNumber}`}
      showCity={showCity}
      showVenue
      badges={signals.byGameId.get(game.id)?.badges}
      winProbability={simulationProbabilities[game.id]}
      teamHrefBase={`/season/${schedule.id}/team`}
      onOpenGame={onOpenGame}
    />;
  };

  return <div className={`this-week-workspace mode-${mode}`}>
    <section className="tw-head">
      <div>
        <small>{schedule.setup.abbreviation} / Week {week.weekNumber} / {phase.label}</small>
        <h2>Week {week.weekNumber}</h2>
        <p>{week.dateLabel}</p>
      </div>
      <div className="tw-mode-toggle" role="group" aria-label="This Week layout">
        <button type="button" className={mode === "featured" ? "active" : ""} onClick={() => setMode("featured")}><Star />Featured</button>
        <button type="button" className={mode === "grid" ? "active" : ""} onClick={() => setMode("grid")}><UsersRound />Grid</button>
      </div>
    </section>
    {gotwVm ? <section className="tw-hero" onClick={() => onOpenGame(gotwVm.game.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpenGame(gotwVm.game.id); } }}>
      <header>
        <span><Star fill="currentColor" /> Match of the Week</span>
        <WeekMatchupRank rank={week.matchupRank} total={schedule.weeks.length} score={weekSlateScore10(week.averageMatchupRating, schedule.setup.teams.length)} compact />
      </header>
      <h3>{storyLine(gotwVm.away.team, gotwVm.home.team, gotwVm.ratingScore10, showCity)}</h3>
      <div className="tw-hero-grid">
        <TeamHero side={gotwVm.away} schedule={schedule} weekNumber={week.weekNumber} showCity={showCity} />
        <div className="tw-hero-center">
          <b>@</b>
          <span><MapPin />{gotwVm.stadium}</span>
          <strong>{gotwVm.ratingScore10.toFixed(1)}/10</strong>
          {simulationProbabilities[gotwVm.game.id] && <em>{Math.round(simulationProbabilities[gotwVm.game.id].away * 100)}% / {Math.round(simulationProbabilities[gotwVm.game.id].home * 100)}%</em>}
        </div>
        <TeamHero side={gotwVm.home} schedule={schedule} weekNumber={week.weekNumber} showCity={showCity} />
      </div>
      <div className="tw-player-panels">
        <PlayerGlimpse side={gotwVm.away} />
        <PlayerGlimpse side={gotwVm.home} />
      </div>
    </section> : <section className="this-week-empty"><BarChart3 /><strong>No matchup this week</strong><span>This slate has no scheduled games.</span></section>}
    <section className="tw-story-strip" aria-label="This week's storylines">
      <span><Star />GOTW: {gotwVm ? `${teamDisplay(gotwVm.away.team, showCity)} at ${teamDisplay(gotwVm.home.team, showCity)}` : "--"}</span>
      <span><BarChart3 />Slate score: {weekSlateScore10(week.averageMatchupRating, schedule.setup.teams.length)?.toFixed(1) ?? "--"}/10</span>
      <span><ChevronDown />{allCards.length} other matchup{allCards.length === 1 ? "" : "s"}</span>
    </section>
    <section className="tw-slate-list">
      {allCards.map(cardFor)}
    </section>
  </div>;
}
