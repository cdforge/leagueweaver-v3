"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  Cloud,
  Download,
  FileDown,
  FileSpreadsheet,
  Gamepad2,
  LayoutList,
  LockKeyhole,
  MapPin,
  Medal,
  MoreHorizontal,
  Pencil,
  Play,
  RefreshCw,
  Save,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { BrandLockup } from "@/components/AppHeader";
import { AdUnit } from "@/components/ads/AdUnit";
import { GotwWorkspace } from "@/components/season/GotwWorkspace";
import { GameBadgeChip, MatchupCard, MatchupRatingLegend, MatchupSeriesChip, TeamIdentityBlock, WeekMatchupRank } from "@/components/season/MatchupPresentation";
import { SimulatorWorkspace, type SimulatorOddsView, type SimulatorResultView } from "@/components/season/SimulatorWorkspace";
import { StatsWorkspace } from "@/components/season/StatsWorkspace";
import { TeamScheduleView } from "@/components/season/TeamSchedulePage";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { Tooltip } from "@/components/ui/Tooltip";
import { downloadCsv } from "@/lib/csv";
import { readableTextColor } from "@/lib/colorContrast";
import { downloadSchedulePdf } from "@/lib/pdf";
import { getMatchupRatingRange, getMatchupSignal, matchupRating, sortGamesForDisplay } from "@/lib/matchups";
import {
  getFirstRoundSeedPairs,
  getPlayoffByeCount,
  getPlayoffRoundNames,
  normalizePlayoffSettings,
  playoffPlacementLabel,
  projectPlayoffRounds,
  projectPlayoffSeeds,
  resolvePlayoffPlacementMode,
} from "@/lib/playoffs";
import {
  calculateSeasonOdds,
  clearAllHypotheticalResults,
  clearSimulatedResults,
  createSimulationSandbox,
  materializeSimulationSchedule,
  overrideSimulationGame,
  restartSimulationFromBeginning,
  rerollSimulation,
  rerollSimulationGame,
  simulateFirstHalf,
  simulateNextGame,
  simulateNextWeek,
  simulateRestOfSeason,
  simulateToChampion,
  toggleSimulationGameLock,
  type MonteCarloTrialCount,
  type SimulationSandbox,
} from "@/lib/simulator";
import { calculateStandings, formatRecord, freezeCompletedRankHistory, getEnteringWeekRankSnapshot } from "@/lib/standings";
import { gameOfWeekStatusLabel, getScheduleGameSignals } from "@/lib/statistics";
import { formatDraftPlace, getTeamsMissingDraftPlaces, getWeekOneRankMap, getWeekOneTeamOrder, hasCompleteDraftRanking } from "@/lib/rankings";
import { loadSeason, normalizeSeason, saveSeason } from "@/lib/storage";
import { getNflWeekWindow, getWeekDateLabel, updateGameScore } from "@/lib/schedule";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, LeagueSetupInput, ScheduledGame, Team } from "@/lib/types";

type ViewKey = "league-schedule" | "team-schedule" | "gotw" | "matchup-ratings" | "scores" | "standings" | "playoffs" | "simulator" | "fairness" | "settings";
const CLOUD_SCHEDULE_ID = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;

const VIEW_ITEMS: Array<{ key: ViewKey; label: string; icon: typeof CalendarDays; pro?: boolean }> = [
  { key: "league-schedule", label: "League Schedule", icon: CalendarDays },
  { key: "team-schedule", label: "Team Schedule", icon: UsersRound },
  { key: "gotw", label: "Game of the Week", icon: Star },
  { key: "matchup-ratings", label: "Matchup Ratings", icon: SlidersHorizontal },
  { key: "scores", label: "Scores", icon: LayoutList, pro: true },
  { key: "standings", label: "Standings", icon: BarChart3, pro: true },
  { key: "playoffs", label: "Playoffs", icon: Trophy, pro: true },
  { key: "simulator", label: "Simulator", icon: Play, pro: true },
  { key: "fairness", label: "Fairness", icon: ShieldCheck },
  { key: "settings", label: "Settings", icon: Settings },
];

function TeamMark({ team, size = "normal" }: { team: Team; size?: "small" | "normal" }) {
  return <EntityLogo className={`team-mark team-mark-${size}`} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={size === "small" ? 32 : 42} />;
}

type PlayoffWeekMatchupView = {
  key: string;
  homeTeamId: string;
  awayTeamId: string;
  homeSeed: number;
  awaySeed: number;
  homeScore?: number;
  awayScore?: number;
  stadium?: string;
  recorded: boolean;
};

function playoffRoundShortLabel(name: string) {
  if (name === "Divisional Championship") return "Div Champ";
  if (name === "Championship") return "Final";
  return name.replace("Round ", "Rd ");
}

function PlayoffWeekSchedule({ schedule, roundIndex }: { schedule: GeneratedSchedule; roundIndex: number }) {
  const settings = normalizePlayoffSettings(schedule.setup.playoffs, schedule.setup.teams.length, schedule.setup.color, schedule.setup.weeks);
  const normalizedSchedule = { ...schedule, setup: { ...schedule.setup, playoffs: settings } };
  const projectedRounds = projectPlayoffRounds(normalizedSchedule);
  const round = projectedRounds[roundIndex] ?? projectedRounds[0];
  const seeds = projectPlayoffSeeds(normalizedSchedule, settings.fieldSize);
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const standingsByTeam = new Map(calculateStandings(schedule).map((row) => [row.teamId, row]));
  const seedByNumber = new Map(seeds.map((item) => [item.seed, item]));
  const seedByTeam = new Map(seeds.map((item) => [item.teamId, item]));
  const actualGames = (schedule.playoffGames ?? [])
    .filter((game) => game.bracket === "main" && game.roundIndex === roundIndex)
    .sort((left, right) => (left.gameNumber ?? 0) - (right.gameNumber ?? 0) || left.id.localeCompare(right.id));
  const matchups: PlayoffWeekMatchupView[] = actualGames.length
    ? actualGames.map((game) => ({
      key: game.id,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      homeSeed: seedByTeam.get(game.homeTeamId)?.seed ?? teamById.get(game.homeTeamId)?.overallRank ?? 0,
      awaySeed: seedByTeam.get(game.awayTeamId)?.seed ?? teamById.get(game.awayTeamId)?.overallRank ?? 0,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      stadium: game.stadium,
      recorded: true,
    }))
    : round.matchups.map((matchup, index) => ({
      key: `projected-playoff-${roundIndex}-${index}`,
      homeTeamId: seedByNumber.get(matchup.homeSeed)?.teamId ?? "",
      awayTeamId: seedByNumber.get(matchup.awaySeed)?.teamId ?? "",
      homeSeed: matchup.homeSeed,
      awaySeed: matchup.awaySeed,
      recorded: false,
    }));
  const showCity = schedule.setup.display?.cityNames !== false;
  const roundDate = getWeekDateLabel(schedule.setup.seasonYear, round.weekNumber);
  const roundComplete = actualGames.length > 0 && actualGames.every((game) => game.homeScore != null && game.awayScore != null);
  const projectionCopy = roundIndex === 0
    ? "The field and byes follow the current standings and playoff settings."
    : "Future teams assume the higher projected seed advances from each prior matchup.";
  const statusLabel = roundComplete ? "PLAYOFF RESULTS" : actualGames.length ? "PLAYOFF WEEK" : "LIVE PROJECTION";
  const championshipNeutral = roundIndex === projectedRounds.length - 1 && settings.championshipVenueMode === "neutral-site";

  const TeamSlot = ({ teamId, seedNumber, mirrored = false, result = "open" }: {
    teamId: string;
    seedNumber: number;
    mirrored?: boolean;
    result?: "winner" | "loser" | "open";
  }) => {
    const team = teamById.get(teamId);
    const seed = seedByTeam.get(teamId);
    const standing = standingsByTeam.get(teamId);
    if (!team) return <div className={`playoff-week-team-placeholder ${mirrored ? "mirrored" : ""}`}><b>#{seedNumber}</b><span><strong>To be determined</strong><small>Projected seed</small></span></div>;
    const displayedSeed = settings.seedDisplayMode === "standings-finish" ? seed?.standingsPosition ?? seedNumber : seed?.seed ?? seedNumber;
    return <TeamIdentityBlock
      compact
      mirrored={mirrored}
      team={team}
      division={divisionById.get(team.divisionId)}
      leagueRank={displayedSeed}
      record={{ overall: seed?.record ?? (standing ? formatRecord(standing) : "0-0"), division: standing ? `${standing.divisionWins}-${standing.divisionLosses}` : undefined }}
      showCity={showCity}
      result={result}
      href={`/season/${schedule.id}/team/${team.id}`}
    />;
  };

  return <div className="workspace-stack playoff-week-schedule" style={{ "--playoff-week-color": settings.color, "--playoff-week-ink": readableTextColor(settings.color) } as CSSProperties}>
    <div className="playoff-week-heading">
      <EntityLogo color={settings.color} logoUrl={settings.logoUrl} monogram="PO" size={48} />
      <span><small>{statusLabel}</small><strong>{round.name}</strong><em>NFL Week {round.weekNumber} · {roundDate}</em></span>
      <span className="playoff-week-heading-copy"><strong>{settings.name}</strong><small>{projectionCopy}</small></span>
    </div>
    <div className="playoff-week-games" role="list" aria-label={`${round.name} matchups`}>
      {matchups.map((matchup, index) => {
        const played = matchup.homeScore != null && matchup.awayScore != null;
        const homeResult = !played ? "open" : matchup.homeScore! > matchup.awayScore! ? "winner" : "loser";
        const awayResult = !played ? "open" : matchup.awayScore! > matchup.homeScore! ? "winner" : "loser";
        const home = teamById.get(matchup.homeTeamId);
        const venue = matchup.stadium || (championshipNeutral ? "Neutral championship site" : home?.stadium);
        return <article className={`playoff-week-row ${played ? "played" : ""}`} key={matchup.key} role="listitem">
          <span className="playoff-week-game-label"><Trophy /><span><small>GAME {index + 1}</small><strong>{played ? "Final" : matchup.recorded ? "Scheduled" : "Projected"}</strong></span></span>
          <TeamSlot teamId={matchup.awayTeamId} seedNumber={matchup.awaySeed} result={awayResult} />
          <span className="playoff-week-score" aria-label={played ? `Away ${matchup.awayScore}, home ${matchup.homeScore}, final` : "Projected matchup"}>
            <strong className={awayResult === "loser" ? "loser" : ""}>{matchup.awayScore ?? "—"}</strong>
            <b aria-label="at">@</b>
            <strong className={homeResult === "loser" ? "loser" : ""}>{matchup.homeScore ?? "—"}</strong>
            <small>{played ? "FINAL" : "PROJECTED"}</small>
          </span>
          <TeamSlot mirrored teamId={matchup.homeTeamId} seedNumber={matchup.homeSeed} result={homeResult} />
          <span className="playoff-week-venue"><MapPin />{home?.logoUrl && <img src={home.logoUrl} alt="" />}<span><small>{championshipNeutral ? "CHAMPIONSHIP SITE" : "HIGHER SEED HOSTS"}</small><strong>{venue || "Venue to be determined"}</strong></span></span>
        </article>;
      })}
    </div>
    {round.byeSeeds.length > 0 && <section className="playoff-week-byes">
      <header><ShieldCheck /><span><strong>Projected byes</strong><small>These teams advance directly to NFL Week {round.weekNumber + 1}.</small></span></header>
      <div>{round.byeSeeds.map((seedNumber) => {
        const item = seedByNumber.get(seedNumber);
        return <div key={seedNumber}><TeamSlot teamId={item?.teamId ?? ""} seedNumber={seedNumber} /><span><strong>BYE</strong><small>Advances to {projectedRounds[roundIndex + 1]?.name ?? "the next round"}</small></span></div>;
      })}</div>
    </section>}
  </div>;
}

function ScheduleView({ schedule, selectedWeek, setSelectedWeek, canAccessPlayoffs, onLockedPlayoffWeek, simulationResults = {}, simulationProbabilities = {} }: {
  schedule: GeneratedSchedule;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  canAccessPlayoffs: boolean;
  onLockedPlayoffWeek: (roundName: string) => void;
  simulationResults?: Record<string, SimulatorResultView>;
  simulationProbabilities?: Record<string, { away: number; home: number }>;
}) {
  const [ratingTier, setRatingTier] = useState("all");
  const scheduleSignals = useMemo(() => getScheduleGameSignals(schedule), [schedule]);
  const playoffRounds = useMemo(() => projectPlayoffRounds(schedule), [schedule]);
  const selectedPlayoffIndex = playoffRounds.findIndex((round) => round.weekNumber === selectedWeek);
  useEffect(() => {
    const gameId = window.location.hash.slice(1);
    if (!gameId) return;
    window.requestAnimationFrame(() => document.getElementById(gameId)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [selectedWeek]);
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const display = schedule.setup.display ?? { cityNames: true, managers: true, venues: true };
  const week = schedule.weeks.find((item) => item.weekNumber === selectedWeek) ?? schedule.weeks[0];
  const gotwEntry = scheduleSignals.gotwByWeek.get(week.weekNumber);
  const displayedSnapshot = getEnteringWeekRankSnapshot(schedule, week.weekNumber);
  const standingsByTeam = new Map(displayedSnapshot.rows.map((row) => [row.teamId, row]));
  const displayedRanks = new Map(displayedSnapshot.rows.map((row) => [row.teamId, row.rank]));
  const ratingRange = getMatchupRatingRange(schedule.weeks.flatMap((item) => item.games), displayedRanks);
  const recordFor = (teamId: string) => {
    const row = standingsByTeam.get(teamId);
    return { overall: row ? formatRecord(row) : "0-0", division: row ? `${row.divisionWins}-${row.divisionLosses}` : "0-0" };
  };
  const presentationFor = (game: ScheduledGame, weekNumber: number) => {
    const away = teamById.get(game.awayTeamId)!;
    const home = teamById.get(game.homeTeamId)!;
    return {
      game,
      away,
      home,
      awayDivision: divisionById.get(away.divisionId),
      homeDivision: divisionById.get(home.divisionId),
      awayRank: standingsByTeam.get(away.id)?.rank ?? away.overallRank,
      homeRank: standingsByTeam.get(home.id)?.rank ?? home.overallRank,
      awayRecord: recordFor(away.id),
      homeRecord: recordFor(home.id),
      signal: getMatchupSignal(game, displayedRanks, ratingRange),
      showCity: display.cityNames,
      showVenue: display.venues,
    };
  };
  const gameOfWeekId = gotwEntry?.game.id;
  const holidays = getNflWeekWindow(schedule.setup.seasonYear, week.weekNumber).holidays;
  const playingTeamIds = new Set(week.games.flatMap((game) => [game.homeTeamId, game.awayTeamId]));
  const byeTeams = schedule.setup.teams.filter((team) => !playingTeamIds.has(team.id));
  const orderedGames = sortGamesForDisplay(week.games, gameOfWeekId);
  const visibleGames = ratingTier === "all" ? orderedGames : orderedGames.filter((game) => getMatchupSignal(game, displayedRanks, ratingRange).label.toLowerCase() === ratingTier);
  const ratingOptions = [
    { value: "all", label: "All matchups", description: "Show the complete week" },
    { value: "competitive", label: "Competitive", description: "Strongest third of this schedule" },
    { value: "neutral", label: "Neutral", description: "Middle third of this schedule" },
    { value: "lopsided", label: "Lopsided", description: "Widest ranking gaps" },
  ];
  const weekSelector = <div className="week-selector schedule-week-selector" aria-label="Select regular season or playoff week">
    {schedule.weeks.map((item) => <button type="button" className={item.weekNumber === selectedWeek ? "active" : ""} key={item.weekNumber} onClick={() => setSelectedWeek(item.weekNumber)}><span>W{item.weekNumber}</span><small>{item.dateLabel.split(",")[0]}</small><WeekMatchupRank rank={item.matchupRank} total={schedule.weeks.length} compact /></button>)}
    <span className="week-selector-divider" aria-hidden="true" />
    {playoffRounds.map((round) => <Tooltip key={round.weekNumber} label={canAccessPlayoffs ? `${round.name}, NFL Week ${round.weekNumber}` : `${round.name} is included with Pro`}>
      <button
        type="button"
        className={`playoff-week-button ${round.weekNumber === selectedWeek ? "active" : ""} ${canAccessPlayoffs ? "" : "locked"}`}
        style={{ "--playoff-week-color": schedule.setup.playoffs.color, "--playoff-week-ink": readableTextColor(schedule.setup.playoffs.color) } as CSSProperties}
        aria-label={`${round.name}, NFL Week ${round.weekNumber}${canAccessPlayoffs ? "" : ", Pro required"}`}
        aria-disabled={!canAccessPlayoffs}
        onClick={() => canAccessPlayoffs ? setSelectedWeek(round.weekNumber) : onLockedPlayoffWeek(round.name)}
      >
        <span>W{round.weekNumber}</span>
        <small>{playoffRoundShortLabel(round.name)}</small>
        <span className="playoff-week-selector-icon">{canAccessPlayoffs ? <Trophy /> : <LockKeyhole />}</span>
      </button>
    </Tooltip>)}
  </div>;
  if (selectedPlayoffIndex >= 0) {
    return <div className="workspace-stack">
      {weekSelector}
      {canAccessPlayoffs
        ? <PlayoffWeekSchedule schedule={schedule} roundIndex={selectedPlayoffIndex} />
        : <section className="playoff-week-locked-state">
          <span><LockKeyhole /></span>
          <div><small>PRO PLAYOFF WEEK</small><h2>{playoffRounds[selectedPlayoffIndex].name}</h2><p>Upgrade to open projected playoff matchups, byes, venues, and results inside the full season schedule.</p></div>
          <Link href="/pricing" className="button-primary"><Trophy />See Pro plans</Link>
          <button type="button" className="button-secondary" onClick={() => setSelectedWeek(schedule.setup.weeks)}>Back to Week {schedule.setup.weeks}</button>
        </section>}
    </div>;
  }
  return (
    <div className="workspace-stack">
      {weekSelector}
      <div className="section-bar"><div><span className="bar-number">{String(week.weekNumber).padStart(2, "0")}</span><span><strong>Week {week.weekNumber}</strong><small>{week.dateLabel}</small></span></div><div className="section-bar-actions"><WeekMatchupRank rank={week.matchupRank} total={schedule.weeks.length} /><span className="week-markers">{holidays.map((holiday) => <em className="holiday-marker" key={holiday}>{holiday}</em>)}{byeTeams.length > 0 && <em className="bye-marker">{byeTeams.length} BYE</em>}</span><span className="rating-tier-filter"><CustomSelect label="Filter matchup rating" value={ratingTier} onChange={setRatingTier} options={ratingOptions} /></span><Tooltip label="More week actions"><button type="button" aria-label="More week actions"><MoreHorizontal /></button></Tooltip></div></div>
      <div className="matchup-list matchup-card-list">{visibleGames.map((game) => {
        const analytics = scheduleSignals.byGameId.get(game.id);
        const featured = game.id === gameOfWeekId;
        const simulationResult = simulationResults[game.id];
        return <MatchupCard key={game.id} {...presentationFor(game, week.weekNumber)} featured={featured} featuredLabel={featured && gotwEntry ? gameOfWeekStatusLabel(gotwEntry.status) : undefined} badges={analytics?.badges} medalRank={analytics?.qualityRank} simulationSource={simulationResult?.source} simulationLocked={simulationResult?.locked} winProbability={simulationProbabilities[game.id]} teamHrefBase={`/season/${schedule.id}/team`} />;
      })}{visibleGames.length === 0 && <div className="rating-filter-empty"><strong>No {ratingTier} matchups this week.</strong><button type="button" onClick={() => setRatingTier("all")}>Show all matchups</button></div>}</div>
      <MatchupRatingLegend />
      {byeTeams.length > 0 && <div className="week-bye-list"><strong>Bye</strong>{byeTeams.map((team) => <span key={team.id}><EntityLogo size={32} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />{teamDisplayName(team, display.cityNames)}</span>)}</div>}
    </div>
  );
}

function MatchupRatingsView({ schedule }: { schedule: GeneratedSchedule }) {
  const [lens, setLens] = useState("live");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("best");
  const allGames = schedule.weeks.flatMap((week) => week.games);
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const preseasonRanks = new Map(schedule.setup.teams.map((team) => [team.id, team.overallRank]));
  const openingWeekRanks = getWeekOneRankMap(schedule.setup);
  const weeklyRanks = new Map(schedule.weeks.map((week) => {
    const snapshot = getEnteringWeekRankSnapshot(schedule, week.weekNumber);
    return [week.weekNumber, new Map(snapshot.rows.map((row) => [row.teamId, row.rank]))];
  }));
  const ranksForGame = (game: ScheduledGame) => lens === "live"
    ? weeklyRanks.get(game.week) ?? openingWeekRanks
    : game.week === 1 ? openingWeekRanks : preseasonRanks;
  const ratingForGame = (game: ScheduledGame) => matchupRating(game, lens === "live" ? ranksForGame(game) : undefined);
  const ratings = allGames.map(ratingForGame).filter(Number.isFinite);
  const ratingRange = ratings.length ? { min: Math.min(...ratings), max: Math.max(...ratings) } : { min: 0, max: 0 };
  const visibleGames = allGames
    .filter((game) => tier === "all" || getMatchupSignal(game, lens === "live" ? ranksForGame(game) : undefined, ratingRange).label.toLowerCase() === tier)
    .sort((left, right) => {
      if (sort === "week") return left.week - right.week || (left.gameNumber ?? 0) - (right.gameNumber ?? 0) || left.id.localeCompare(right.id);
      const difference = ratingForGame(left) - ratingForGame(right);
      return (sort === "worst" ? -difference : difference) || left.week - right.week || left.id.localeCompare(right.id);
    });
  const tierOptions = [
    { value: "all", label: "All tiers", description: "Complete regular season" },
    { value: "competitive", label: "Competitive", description: "Strongest third" },
    { value: "neutral", label: "Neutral", description: "Middle third" },
    { value: "lopsided", label: "Lopsided", description: "Widest ranking gaps" },
  ];
  const strongestWeek = [...schedule.weeks].sort((left, right) => (left.matchupRank ?? 999) - (right.matchupRank ?? 999))[0];
  return <div className="matchup-ratings-view">
    <div className="matchup-ratings-summary">
      <span><small>Rating range</small><strong>{ratingRange.min.toFixed(1)}–{ratingRange.max.toFixed(1)}</strong></span>
      <span><small>Strongest week</small>{strongestWeek ? <span className="strongest-week-value"><strong>Week {strongestWeek.weekNumber}</strong><WeekMatchupRank rank={strongestWeek.matchupRank} total={schedule.weeks.length} compact /></span> : <strong>—</strong>}</span>
      <span><small>Games shown</small><strong>{visibleGames.length}</strong></span>
    </div>
    <div className="matchup-ratings-controls">
      <span><strong>Matchup rating</strong><small>Lower is better. Tiers are relative to this schedule.</small></span>
      <div>
        <CustomSelect label="Rating lens" value={lens} onChange={setLens} options={[{ value: "live", label: "Weekly standings", description: "Frozen ranks entering each week" }, { value: "preseason", label: "Preseason plan", description: "Original season-building ranks" }]} />
        <CustomSelect label="Filter rating tier" value={tier} onChange={setTier} options={tierOptions} />
        <CustomSelect label="Sort matchup ratings" value={sort} onChange={setSort} options={[{ value: "best", label: "Best first", description: "Lowest rating first" }, { value: "worst", label: "Worst first", description: "Highest rating first" }, { value: "week", label: "Schedule order", description: "Week and game number" }]} />
      </div>
    </div>
    <MatchupRatingLegend />
    <div className="matchup-ratings-table-wrap">
      <table className="matchup-ratings-table">
        <thead><tr><th>Wk</th><th>Game</th><th>Away</th><th>Home</th><th>Matchup</th><th>Rating</th></tr></thead>
        <tbody>{visibleGames.map((game) => {
          const away = teamById.get(game.awayTeamId)!;
          const home = teamById.get(game.homeTeamId)!;
          const rowRanks = ranksForGame(game);
          const signal = getMatchupSignal(game, lens === "live" ? rowRanks : undefined, ratingRange);
          return <tr key={game.id}>
            <td><Link href={`/season/${schedule.id}?week=${game.week}#${game.id}`}>W{game.week}</Link></td>
            <td>#{game.gameNumber ?? "—"}</td>
            <td><TeamIdentityBlock compact showRecord={false} team={away} division={divisionById.get(away.divisionId)} leagueRank={rowRanks.get(away.id) ?? away.overallRank} record={{ overall: "0-0" }} showCity={schedule.setup.display.cityNames} href={`/season/${schedule.id}/team/${away.id}`} /></td>
            <td><TeamIdentityBlock compact showRecord={false} team={home} division={divisionById.get(home.divisionId)} leagueRank={rowRanks.get(home.id) ?? home.overallRank} record={{ overall: "0-0" }} showCity={schedule.setup.display.cityNames} href={`/season/${schedule.id}/team/${home.id}`} /></td>
            <td><MatchupSeriesChip game={game} division={divisionById.get(home.divisionId)} /></td>
            <td><span className="table-rating-cell"><span className={`table-signal signal-${signal.label.toLowerCase()}`} aria-label={`${signal.label} matchup, rating ${signal.rating.toFixed(1)}`}>{[1, 2, 3].map((bar) => <i className={bar <= signal.bars ? "active" : ""} key={bar} />)}<strong>{signal.rating.toFixed(1)}</strong></span><small className="table-rating-ranks">W{game.week} ranks · #{rowRanks.get(away.id) ?? away.overallRank} vs #{rowRanks.get(home.id) ?? home.overallRank}</small></span></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}

function ScoresView({ schedule, selectedWeek, setSelectedWeek, onScore, onFinalizeScores, simulationActive = false, simulationResults = {} }: {
  schedule: GeneratedSchedule;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  onScore: (id: string, home?: number, away?: number) => void;
  onFinalizeScores: () => void;
  simulationActive?: boolean;
  simulationResults?: Record<string, SimulatorResultView>;
}) {
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const showCity = schedule.setup.display?.cityNames !== false;
  const week = schedule.weeks.find((item) => item.weekNumber === selectedWeek) ?? schedule.weeks[0];
  const enteringWeekSnapshot = getEnteringWeekRankSnapshot(schedule, week.weekNumber);
  const rankByTeamId = new Map(enteringWeekSnapshot.rows.map((row) => [row.teamId, row.rank]));
  const scheduleSignals = useMemo(() => getScheduleGameSignals(schedule), [schedule]);
  const parseScore = (value: string) => {
    if (value === "") return undefined;
    const score = Number(value);
    return Number.isFinite(score) ? Math.round(Math.max(0, score) * 100) / 100 : undefined;
  };
  return <div className="workspace-stack">
    <div className="week-selector" aria-label="Select score entry week">{schedule.weeks.map((item) => <button type="button" className={item.weekNumber === selectedWeek ? "active" : ""} key={item.weekNumber} onClick={() => setSelectedWeek(item.weekNumber)}><span>W{item.weekNumber}</span><small>{item.dateLabel.split(",")[0]}</small></button>)}</div>
    <div className="workspace-filter-row score-entry-heading"><span><strong>Week {week.weekNumber} score entry</strong><small>{week.dateLabel}</small></span><p>{simulationActive ? "Sandbox scores are read-only here. Use Game-day control to simulate, reroll, or override a matchup." : "Scores save locally as you enter them."}</p></div>
    <div className="score-entry-table"><div className="data-head"><span>Away team</span><span>Away score</span><span aria-hidden="true">@</span><span>Home score</span><span>Home team</span><span>Status</span></div>{week.games.map((game) => {
      const away = teamById.get(game.awayTeamId)!; const home = teamById.get(game.homeTeamId)!;
      const simulationResult = simulationResults[game.id];
      const status = simulationResult?.source === "override"
        ? `Commissioner${simulationResult.locked ? " · Locked" : ""}`
        : simulationResult
          ? `Simulated${simulationResult.locked ? " · Locked" : ""}`
          : game.homeScore == null || game.awayScore == null ? "Open" : "Recorded";
      const isUpset = scheduleSignals.byGameId.get(game.id)?.badges.includes("Upset");
      const awayRank = rankByTeamId.get(away.id) ?? away.overallRank;
      const homeRank = rankByTeamId.get(home.id) ?? home.overallRank;
      const awayRankColor = divisionById.get(away.divisionId)?.color ?? away.color;
      const homeRankColor = divisionById.get(home.divisionId)?.color ?? home.color;
      return <div className={`score-entry-row ${simulationResult ? `is-simulated simulation-${simulationResult.source}` : ""}`} key={game.id}><Link className="score-team score-team-away" href={`/season/${schedule.id}/team/${away.id}`}><b className="score-team-rank" style={{ background: awayRankColor, color: readableTextColor(awayRankColor) }}>#{awayRank}</b><TeamMark team={away} size="small" /><span><strong>{away.name}</strong><small>{showCity && away.city ? `${away.city} · Away` : "Away"}</small></span></Link><input disabled={simulationActive} aria-label={`${teamDisplayName(away, showCity)} score`} type="number" inputMode="decimal" min="0" step="0.01" value={game.awayScore ?? ""} onBlur={onFinalizeScores} onChange={(event) => onScore(game.id, game.homeScore, parseScore(event.target.value))} /><span className="score-versus" aria-label="at">@</span><input disabled={simulationActive} aria-label={`${teamDisplayName(home, showCity)} score`} type="number" inputMode="decimal" min="0" step="0.01" value={game.homeScore ?? ""} onBlur={onFinalizeScores} onChange={(event) => onScore(game.id, parseScore(event.target.value), game.awayScore)} /><Link className="score-team score-team-home" href={`/season/${schedule.id}/team/${home.id}`}><span><strong>{home.name}</strong><small>{showCity && home.city ? `${home.city} · Home` : "Home"}</small></span><TeamMark team={home} size="small" /><b className="score-team-rank" style={{ background: homeRankColor, color: readableTextColor(homeRankColor) }}>#{homeRank}</b></Link><span className="score-status-stack"><span className={simulationResult ? `status-simulated source-${simulationResult.source}` : game.homeScore == null || game.awayScore == null ? "status-open" : "status-final"}>{status}</span>{isUpset && <GameBadgeChip badge="Upset" />}</span></div>;
    })}</div>
  </div>;
}

function StandingsView({ schedule }: { schedule: GeneratedSchedule }) {
  return <StatsWorkspace schedule={schedule} />;
}

function PlayoffsView({ schedule, onUpdatePlayoffs, simulationMode = false }: { schedule: GeneratedSchedule; onUpdatePlayoffs: (patch: Partial<LeagueSetupInput["playoffs"]>) => void; simulationMode?: boolean }) {
  const settings = normalizePlayoffSettings(schedule.setup.playoffs, schedule.setup.teams.length, schedule.setup.color, schedule.setup.weeks);
  const normalizedSchedule = settings === schedule.setup.playoffs ? schedule : { ...schedule, setup: { ...schedule.setup, playoffs: settings } };
  const fieldSize = settings.fieldSize;
  const seeds = projectPlayoffSeeds(normalizedSchedule, fieldSize);
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const playoffStandingsByTeam = new Map(calculateStandings(schedule).map((row) => [row.teamId, row]));
  const seed = (number: number) => seeds.find((item) => item.seed === number);
  const showCity = schedule.setup.display?.cityNames !== false;
  const rounds = getPlayoffRoundNames(settings, schedule.setup.divisions.length);
  const placement = resolvePlayoffPlacementMode({ divisions: schedule.setup.divisions, playoffs: settings });
  const byeCount = getPlayoffByeCount(fieldSize);
  const roundDate = (index: number) => getWeekDateLabel(schedule.setup.seasonYear, schedule.setup.weeks + index + 1).replace(`, ${schedule.setup.seasonYear}`, "");
  const displayedSeed = (item: NonNullable<ReturnType<typeof seed>>) => settings.seedDisplayMode === "standings-finish" ? item.standingsPosition : item.seed;
  const hostCopy = (team: Team) => `Hosts · ${team.stadium}`;
  const championshipVenueCopy = settings.championshipVenueMode === "neutral-site" ? "Neutral-site championship" : "Higher seed hosts the championship";
  const Slot = ({ number, host = false }: { number: number; host?: boolean }) => {
    const item = seed(number);
    const team = item ? teamById.get(item.teamId) : undefined;
    const standing = item ? playoffStandingsByTeam.get(item.teamId) : undefined;
    return <div className={`bracket-slot ${host ? "host" : ""}`}>{team && item ? <><TeamIdentityBlock compact team={team} division={divisionById.get(team.divisionId)} leagueRank={displayedSeed(item)} record={{ overall: item.record, division: standing ? `${standing.divisionWins}-${standing.divisionLosses}` : undefined }} showCity={showCity} href={`/season/${schedule.id}/team/${team.id}`} /><span className="playoff-slot-meta">{item.divisionLeader && <small>DIV WINNER</small>}{item.bye && <small>BYE</small>}{host && <em><MapPin />{hostCopy(team)}</em>}</span></> : <><b>{number}</b><span><strong>To be determined</strong><small>Projected seed</small></span></>}</div>;
  };
  const Placeholder = ({ label, after }: { label: string; after: string }) => <div className="bracket-slot placeholder"><span><strong>{label}</strong><small>{after}</small></span></div>;
  const RoundHeading = ({ index }: { index: number }) => <h3><span>{rounds[index] || `Round ${index + 1}`}</span><small>NFL Week {schedule.setup.weeks + index + 1} · {roundDate(index)}</small></h3>;
  const sideLabel = (numbers: number[]) => {
    const side = numbers.map((number) => seed(number)?.bracketSide).find(Boolean);
    if (!side) return null;
    const divisionNames = [...new Set(seeds.filter((item) => item.bracketSide === side).map((item) => divisionById.get(item.divisionId)?.name).filter(Boolean))];
    return divisionNames.join(" + ");
  };
  const sideName = (side: "A" | "B") => {
    const divisionNames = [...new Set(seeds.filter((item) => item.bracketSide === side).map((item) => divisionById.get(item.divisionId)?.name).filter(Boolean))];
    return divisionNames.length ? divisionNames.join(" + ") : `Half ${side}`;
  };
  const seedOneSide = seed(1)?.bracketSide || "A";
  const seedTwoSide = seed(2)?.bracketSide || "B";
  const halfChampionCopy = placement === "division-halves" ? `${sideName("A")} champion vs. ${sideName("B")} champion` : null;
  const championshipCopy = halfChampionCopy ? `${halfChampionCopy} · ${championshipVenueCopy}` : championshipVenueCopy;
  const fixedSemifinalCopy = placement === "division-halves" && settings.reseedMode !== "fixed"
    ? [`Lowest remaining in ${sideName(seedOneSide)}`, `Lowest remaining in ${sideName(seedTwoSide)}`]
    : placement === "division-halves"
      ? [`Winner of the ${sideName(seedOneSide)} opening game`, `Winner of the ${sideName(seedTwoSide)} opening game`]
    : settings.reseedMode === "each-round"
    ? ["Lowest remaining seed", "Highest remaining seed"]
    : settings.reseedMode === "protected"
      ? ["Lowest eligible seed", "Highest eligible seed"]
      : ["Winner of 4 vs 5", "Winner of 3 vs 6"];
  const lockField = () => onUpdatePlayoffs(settings.fieldStatus === "locked"
    ? { fieldStatus: "live", lockedTeamIds: [] }
    : { fieldStatus: "locked", lockedTeamIds: seeds.map((item) => item.teamId) });
  const formatLabel = settings.bracketType.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const firstRoundPairs = getFirstRoundSeedPairs(fieldSize);
  const simulatedMainGames = (schedule.playoffGames ?? []).filter((game) => game.bracket === "main");
  const simulatedRounds = [...new Set(simulatedMainGames.map((game) => game.roundIndex))].sort((left, right) => left - right);
  const seedByTeam = new Map(seeds.map((item) => [item.teamId, item.seed]));
  const titleGame = [...simulatedMainGames].sort((left, right) => right.roundIndex - left.roundIndex)[0];
  const championId = titleGame && titleGame.homeScore != null && titleGame.awayScore != null
    ? titleGame.homeScore > titleGame.awayScore ? titleGame.homeTeamId : titleGame.awayTeamId
    : undefined;
  const champion = championId ? teamById.get(championId) : undefined;
  const SimulatedPlayoffTeam = ({ teamId, score, winner }: { teamId: string; score?: number; winner: boolean }) => {
    const team = teamById.get(teamId);
    if (!team) return <span className="sim-bracket-team placeholder"><strong>To be determined</strong></span>;
    return <span className={`sim-bracket-team ${winner ? "winner" : ""}`}>
      <b>#{seedByTeam.get(teamId) ?? team.overallRank}</b>
      <EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={34} />
      <span><small className="team-city">{team.city}</small><strong>{team.name}</strong></span>
      <em>{score ?? "—"}</em>
    </span>;
  };
  return <div className="workspace-stack playoff-workspace" style={{ "--playoff-color": settings.color } as React.CSSProperties}>
    <div className={`playoff-topline playoff-theme-${settings.theme}`}><div><EntityLogo color={settings.color} logoUrl={settings.logoUrl} monogram="PO" /><span><strong>{settings.name}</strong><small>{fieldSize} teams · {formatLabel} · Higher seed hosts before title · {championshipVenueCopy}</small></span></div><div className="playoff-field-actions">{simulationMode ? <span className="projected-pill simulation"><Gamepad2 />SIMULATED BRACKET</span> : <><span className={`projected-pill ${settings.fieldStatus === "locked" ? "locked" : ""}`}>{settings.fieldStatus === "locked" ? "FIELD LOCKED" : "LIVE PROJECTION"}</span><button type="button" onClick={lockField}><LockKeyhole />{settings.fieldStatus === "locked" ? "Unlock field" : "Lock field"}</button></>}</div></div>
    <div className="playoff-policy"><span><strong>{playoffPlacementLabel(placement)}</strong><small>{placement === "division-halves" ? `${sideName("A")} and ${sideName("B")} run separate tournaments; their champions meet in the final` : placement === "division-leaders" ? "Division winners protected at the top" : "Top teams qualify regardless of division"}</small></span><span><strong>{byeCount || "No"} {byeCount === 1 ? "bye" : "byes"}</strong><small>{byeCount ? "Awarded to the top seeds" : "Every qualifier opens play"}</small></span><span><strong>{settings.reseedMode === "fixed" ? "Fixed bracket" : settings.reseedMode === "protected" ? "Protected reseed" : "Reseed each round"}</strong><small>{placement === "division-halves" && settings.reseedMode !== "fixed" ? "Reseeding stays inside each half until the final" : settings.seedDisplayMode === "reranked" ? "Showing bracket seeds" : "Showing standings finish"}</small></span></div>
    {simulatedMainGames.length ? <div className="simulated-playoff-surface">
      <header><Trophy /><span><small>SIMULATED PLAYOFF RESULT</small><strong>{champion ? `${teamDisplayName(champion, showCity)} are champions` : "Playoffs in progress"}</strong><em>{champion ? `Seed #${seedByTeam.get(champion.id) ?? champion.overallRank}` : `${simulatedMainGames.filter((game) => game.homeScore != null && game.awayScore != null).length} games complete`}</em></span>{champion && <EntityLogo color={champion.color} logoUrl={champion.logoUrl} monogram={teamInitials(champion)} size={54} />}</header>
      <div className="simulated-bracket-rounds">{simulatedRounds.map((roundIndex) => <section key={roundIndex}><h3><span>{simulatedMainGames.find((game) => game.roundIndex === roundIndex)?.round || rounds[roundIndex] || `Round ${roundIndex + 1}`}</span><small>NFL Week {schedule.setup.weeks + roundIndex + 1}</small></h3>{simulatedMainGames.filter((game) => game.roundIndex === roundIndex).map((game) => {
        const played = game.homeScore != null && game.awayScore != null;
        const homeWon = played && game.homeScore! > game.awayScore!;
        const awayWon = played && game.awayScore! > game.homeScore!;
        return <article className="sim-bracket-match" key={game.id}><SimulatedPlayoffTeam teamId={game.awayTeamId} score={game.awayScore} winner={awayWon} /><span className="sim-bracket-separator"><EntityLogo color={settings.color} logoUrl={game.roundLogoUrl || settings.logoUrl} monogram="PO" size={32} /></span><SimulatedPlayoffTeam teamId={game.homeTeamId} score={game.homeScore} winner={homeWon} /></article>;
      })}</section>)}</div>
    </div> : settings.bracketType === "single-elimination" ? <div className={`bracket-board field-${fieldSize} rounds-${rounds.length}`}>
      {fieldSize === 2 && <><section><RoundHeading index={0} /><div className="bracket-match"><Slot number={1} host={settings.championshipVenueMode === "higher-seed"} /><Slot number={2} /></div></section><section><h3><span>Champion</span><small>Winner of the championship</small></h3><div className={`championship-cup playoff-theme-${settings.theme}`}><Trophy /><strong>League Champion</strong><small>{championshipCopy}</small></div></section></>}
      {fieldSize === 4 && <><section><RoundHeading index={0} />{[[1, 4], [2, 3]].map(([high, low]) => <div className="bracket-match" key={high}>{placement === "division-halves" && <em className="bracket-side-label">{sideLabel([high, low])} tournament</em>}<Slot number={high} host /><Slot number={low} /></div>)}</section><section><RoundHeading index={1} /><div className={`championship-cup playoff-theme-${settings.theme}`}><Trophy /><strong>League Champion</strong><small>{championshipCopy}</small></div></section></>}
      {fieldSize === 6 && <><section><RoundHeading index={0} />{[[3, 6], [4, 5]].map(([high, low]) => <div className="bracket-match" key={high}>{placement === "division-halves" && <em className="bracket-side-label">{sideLabel([high, low])} tournament</em>}<Slot number={high} host /><Slot number={low} /></div>)}</section><section><RoundHeading index={1} /><div className="bracket-match spaced"><Slot number={1} host /><Placeholder label={fixedSemifinalCopy[0]} after={settings.reseedMode === "fixed" ? `${sideName(seedOneSide)} path` : "After opening round"} /></div><div className="bracket-match"><Slot number={2} host /><Placeholder label={fixedSemifinalCopy[1]} after={settings.reseedMode === "fixed" ? `${sideName(seedTwoSide)} path` : "After opening round"} /></div></section><section><RoundHeading index={2} /><div className={`championship-cup playoff-theme-${settings.theme}`}><Trophy /><strong>League Champion</strong><small>{championshipCopy}</small></div></section></>}
      {fieldSize === 8 && <><section><RoundHeading index={0} />{firstRoundPairs.map(([high, low]) => <div className="bracket-match" key={high}>{placement === "division-halves" && <em className="bracket-side-label">{sideLabel([high, low])} tournament</em>}<Slot number={high} host /><Slot number={low} /></div>)}</section><section><RoundHeading index={1} /><div className="bracket-match spaced"><Placeholder label={placement === "division-halves" ? `${sideName("A")} quarterfinal winner` : "Opening-round winner"} after={placement === "division-halves" ? `${sideName("A")} path` : settings.reseedMode === "fixed" ? "Top bracket path" : "Highest eligible seed"} /><Placeholder label={placement === "division-halves" ? `${sideName("A")} quarterfinal winner` : "Opening-round winner"} after={placement === "division-halves" ? `${sideName("A")} path` : settings.reseedMode === "fixed" ? "Top bracket path" : "Lowest eligible seed"} /></div><div className="bracket-match"><Placeholder label={placement === "division-halves" ? `${sideName("B")} quarterfinal winner` : "Opening-round winner"} after={placement === "division-halves" ? `${sideName("B")} path` : settings.reseedMode === "fixed" ? "Bottom bracket path" : "Second-highest seed"} /><Placeholder label={placement === "division-halves" ? `${sideName("B")} quarterfinal winner` : "Opening-round winner"} after={placement === "division-halves" ? `${sideName("B")} path` : settings.reseedMode === "fixed" ? "Bottom bracket path" : "Second-lowest seed"} /></div></section><section><RoundHeading index={2} /><div className={`championship-cup playoff-theme-${settings.theme}`}><Trophy /><strong>League Champion</strong><small>{championshipCopy}</small></div></section></>}
      {![2, 4, 6, 8].includes(fieldSize) && rounds.map((round, roundIndex) => <section key={`${round}-${roundIndex}`}><RoundHeading index={roundIndex} />{roundIndex === 0 ? <div className="format-seed-list">{firstRoundPairs.map(([high, low]) => <div className="bracket-match" key={high}>{placement === "division-halves" && <em className="bracket-side-label">{sideLabel([high, low])} tournament</em>}<Slot number={high} host /><Slot number={low} /></div>)}{seeds.filter((item) => item.bye).map((item) => <div className="format-bye" key={item.seed}><Slot number={item.seed} /><span>ADVANCES WITH BYE</span></div>)}</div> : roundIndex === rounds.length - 1 ? <div className={`championship-cup playoff-theme-${settings.theme}`}><Trophy /><strong>League Champion</strong><small>{championshipCopy}</small></div> : <div className="format-placeholder"><RefreshCw /><strong>{settings.reseedMode === "fixed" ? placement === "division-halves" ? "Each half advances its own winner" : "Fixed bracket winners" : placement === "division-halves" ? "Teams reseeded within each half" : "Remaining teams reseeded"}</strong><small>{placement === "division-halves" ? "The two half champions meet only in the final" : "Updates after the prior round"}</small></div>}</section>)}
    </div> : <div className={`bracket-board format-board format-${settings.bracketType}`}>
      {rounds.map((round, roundIndex) => <section key={`${round}-${roundIndex}`}><RoundHeading index={roundIndex} />{roundIndex === 0 ? <div className="format-seed-list">{seeds.filter((item) => !item.bye).map((item) => <Slot key={item.seed} number={item.seed} host={item.seed % 2 === 1} />)}{seeds.filter((item) => item.bye).map((item) => <div className="format-bye" key={item.seed}><Slot number={item.seed} /><span>ADVANCES WITH BYE</span></div>)}</div> : roundIndex === rounds.length - 1 ? <div className={`championship-cup playoff-theme-${settings.theme}`}><Trophy /><strong>League Champion</strong><small>{championshipVenueCopy}</small></div> : <div className="format-placeholder"><RefreshCw /><strong>Advancing ladder teams</strong><small>Updates as playoff results are recorded</small></div>}</section>)}
    </div>}
    {settings.thirdPlaceGame && <div className="third-place-note"><Medal /><span><strong>Third-place game enabled</strong><small>Semifinal losers meet during championship week.</small></span></div>}
  </div>;
}

function FairnessView({ schedule }: { schedule: GeneratedSchedule }) {
  const report = schedule.fairness;
  return <div className="workspace-stack"><div className="fairness-hero"><div className="score-ring" style={{ "--score": `${report.score * 3.6}deg` } as React.CSSProperties}><span><strong>{report.score}</strong><small>/100</small></span></div><div><span className="status-pass"><Check />HARD RULES PASSED</span><h2>A balanced season, ready to play.</h2><p>Correctness is never a Pro feature. Every team, matchup, and home/away total was validated before this schedule appeared.</p></div></div><div className="fairness-grid"><div><span>Home/away spread</span><strong>{report.homeAwaySpread}</strong><small>{report.homeAwaySpread <= 1 ? "Excellent balance" : "Within allowed range"}</small></div><div><span>Immediate rematches</span><strong>{report.immediateRematches}</strong><small>{report.immediateRematches === 0 ? "None scheduled" : "Review recommended"}</small></div><div><span>Final-week division share</span><strong>{Math.round(report.divisionalFinishShare * 100)}%</strong><small>Shape-aware finish</small></div></div><div className="audit-list"><h3>Validation audit</h3>{report.notes.map((note) => <div key={note}><Check /><span>{note}</span><b>Passed</b></div>)}<div><Check /><span>Each required matchup appears exactly once in its assigned week.</span><b>Passed</b></div><div><Check /><span>No team plays more than one matchup in a week.</span><b>Passed</b></div></div></div>;
}

function SettingsView({ schedule, onOpenDraftRanking }: { schedule: GeneratedSchedule; onOpenDraftRanking: () => void }) {
  const seeding = schedule.setup.priorSeason.entryMode === "manual" ? "Manual order" : schedule.setup.priorSeason.entryMode === "history" ? schedule.setup.priorSeason.source === "playoffs" ? "Last year’s playoff finish" : "Last year’s regular-season finish" : "Not used";
  const draftRankingPending = schedule.setup.weekOne.rankingSource === "draft-day" && getTeamsMissingDraftPlaces(schedule.setup).length > 0;
  return <div className="workspace-stack">
    <div className="settings-band"><div><Pencil /><span><strong>Schedule setup</strong><small>Changing league structure regenerates the complete matchup slate as a new revision.</small></span></div><Link href="/" className="button-secondary"><Pencil />Edit and regenerate</Link></div>
    <div className="settings-list">
      <div><span>League</span><strong>{schedule.setup.name}</strong></div>
      <div><span>Season format</span><strong>{schedule.setup.teams.length} teams · {schedule.setup.divisions.length} divisions · {schedule.setup.weeks} weeks</strong></div>
      <div><span>Seeding source</span><strong>{seeding}</strong></div>
      <div className="settings-action-row"><span>Week 1 ranking</span><span><strong>{schedule.setup.weekOne.rankingSource === "draft-day" ? draftRankingPending ? "Draft-day place · not set" : "Draft-day place · complete" : "Last season’s finish"}</strong>{draftRankingPending && <button type="button" onClick={onOpenDraftRanking}><FileSpreadsheet />Set draft ranking</button>}</span></div>
      <div><span>Revision</span><strong>Version {schedule.revision}</strong></div>
      <div><span>Generation seed</span><code>{schedule.seed}</code></div>
    </div>
    <div className="danger-zone"><span><strong>Archive season</strong><small>Archived seasons stay available for viewing and export.</small></span><button type="button">Archive</button></div>
  </div>;
}

function draftPlaceValues(schedule: GeneratedSchedule) {
  return Object.fromEntries(schedule.setup.teams.map((team) => [team.id, Number.isInteger(team.draftPlace) ? team.draftPlace : undefined]));
}

function DraftRankingReminder({ schedule, onSave, openRequest, onOpenSettings }: {
  schedule: GeneratedSchedule;
  onSave: (places: Record<string, number | undefined>) => void;
  openRequest: number;
  onOpenSettings: () => void;
}) {
  const cutoff = getNflWeekWindow(schedule.setup.seasonYear, 2).startsAt;
  const [beforeWeekTwo, setBeforeWeekTwo] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showSettingsToken, setShowSettingsToken] = useState(false);
  const [values, setValues] = useState<Record<string, number | undefined>>(() => draftPlaceValues(schedule));
  const tokenTimer = useRef<number | null>(null);
  useEffect(() => {
    const update = () => setBeforeWeekTwo(Date.now() < Date.parse(cutoff));
    update();
    const interval = window.setInterval(update, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [cutoff]);
  useEffect(() => setValues(draftPlaceValues(schedule)), [schedule]);
  useEffect(() => {
    if (!openRequest) return;
    setDismissed(false);
    setShowSettingsToken(false);
    setOpen(true);
  }, [openRequest]);
  useEffect(() => () => {
    if (tokenTimer.current) window.clearTimeout(tokenTimer.current);
  }, []);

  const missingTeams = getTeamsMissingDraftPlaces(schedule.setup);
  if (schedule.setup.weekOne.rankingSource !== "draft-day" || !missingTeams.length || !beforeWeekTwo) return null;

  const localSetup = { ...schedule.setup, teams: schedule.setup.teams.map((team) => ({ ...team, draftPlace: values[team.id] })) };
  const orderedTeams = getWeekOneTeamOrder(localSetup);
  const complete = hasCompleteDraftRanking(localSetup);
  const placeOptions = [{ value: "unranked", label: "Not set", description: "Choose draft place" }, ...schedule.setup.teams.map((_, index) => ({ value: String(index + 1), label: formatDraftPlace(index + 1, schedule.setup.teams.length) }))];
  const cutoffLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(cutoff));
  const updatePlace = (teamId: string, value: string) => setValues((current) => {
    const nextPlace = value === "unranked" ? undefined : Number(value);
    const previousPlace = current[teamId];
    const occupiedTeam = schedule.setup.teams.find((team) => team.id !== teamId && nextPlace && current[team.id] === nextPlace);
    return { ...current, [teamId]: nextPlace, ...(occupiedTeam ? { [occupiedTeam.id]: previousPlace } : {}) };
  });
  const saveRanking = () => {
    if (!complete) return;
    onSave(values);
    setOpen(false);
  };
  const dismissReminder = () => {
    setOpen(false);
    setDismissed(true);
    setShowSettingsToken(true);
    if (tokenTimer.current) window.clearTimeout(tokenTimer.current);
    tokenTimer.current = window.setTimeout(() => setShowSettingsToken(false), 8000);
  };

  if (dismissed) return showSettingsToken ? <div className="draft-rank-settings-token" role="status"><Settings /><span>Draft-day ranking is available in Settings if you want to add it later.</span><button type="button" onClick={onOpenSettings}>Open Settings</button></div> : null;

  return <>
    <div className="draft-rank-reminder" role="status">
      <FileSpreadsheet />
      <span><strong>Draft-day ranking is waiting.</strong><small>Add every team’s draft place by {cutoffLabel}. Until then, Week 1 uses last season’s order; saving the order updates the opening ranks and Game of the Week.</small></span>
      <div className="draft-rank-reminder-actions"><button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>{open ? "Close editor" : "Set draft ranking"}</button><Tooltip label="Dismiss draft ranking reminder"><button type="button" className="draft-rank-reminder-close" aria-label="Dismiss draft ranking reminder" onClick={dismissReminder}><X /></button></Tooltip></div>
    </div>
    {open && <section className="draft-rank-panel" aria-label="Draft-day ranking editor">
      <header><span><strong>Set the Week 1 draft ranking</strong><small>Choose each team’s draft place from first through last. Selecting an occupied place swaps the two teams.</small></span><button type="button" aria-label="Close draft ranking editor" onClick={() => setOpen(false)}><X /></button></header>
      <div className="draft-rank-panel-list">{orderedTeams.map((team) => <div className="draft-rank-panel-row" key={team.id}>
        <b>{team.draftPlace ? `#${team.draftPlace}` : "—"}</b>
        <EntityLogo size={32} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />
        <span>{schedule.setup.display.cityNames && team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong><small>Last season #{team.overallRank}</small></span>
        <CustomSelect label={`${teamDisplayName(team)} draft place`} value={team.draftPlace ? String(team.draftPlace) : "unranked"} onChange={(value) => updatePlace(team.id, value)} options={placeOptions} />
      </div>)}</div>
      <footer><span><strong>{complete ? "Ranking complete" : "Complete every draft place to save"}</strong><small>{complete ? "Every team has one unique place from first through last." : "Every team needs a unique place before this ranking can be saved."}</small></span><button type="button" className="button-primary" disabled={!complete} onClick={saveRanking}><Save />Save draft ranking</button></footer>
    </section>}
  </>;
}

function SimulatorLaunch({ hasSavedRun, onPlay, onStartFromReal }: { hasSavedRun: boolean; onPlay: () => void; onStartFromReal: () => void }) {
  return <section className="simulator-launch" aria-labelledby="simulator-launch-title">
    <span className="simulator-launch-mark"><Gamepad2 /></span>
    <div className="simulator-launch-copy">
      <small>HYPOTHETICAL SANDBOX</small>
      <h2 id="simulator-launch-title">Press play when you’re ready</h2>
      <p>Opening this page does not start a simulation. Your real scores, standings, ranks, and playoffs stay unchanged until you choose to save a run back.</p>
      <span><ShieldCheck /><strong>Real season protected</strong><em>{hasSavedRun ? "A paused simulation is ready to continue." : "The simulator will begin from your current season."}</em></span>
    </div>
    <div className="simulator-launch-actions">
      <button type="button" className="button-primary" onClick={onPlay}><Play />Play Simulator</button>
      {hasSavedRun && <button type="button" className="button-secondary" onClick={onStartFromReal}><RefreshCw />Start from real season</button>}
    </div>
  </section>;
}

export function SeasonWorkspace({ initialView = "league-schedule" }: { initialView?: ViewKey }) {
  const params = useParams<{ id: string; teamId?: string }>();
  const router = useRouter();
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [view, setView] = useState<ViewKey>(initialView);
  const [selectedTeamId, setSelectedTeamId] = useState(params.teamId ?? "");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [draftRankingRequest, setDraftRankingRequest] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationSandbox | null>(null);
  const [savedSimulation, setSavedSimulation] = useState<SimulationSandbox | null>(null);
  const [simulationLoaded, setSimulationLoaded] = useState(false);
  const [simulationTrials, setSimulationTrials] = useState<MonteCarloTrialCount>(500);
  const [entitlements, setEntitlements] = useState<{ signedIn: boolean; plan: "free" | "pro"; features: string[]; email?: string }>({ signedIn: false, plan: "free", features: [] });
  const cloudScheduleSnapshot = useRef<string | null>(null);
  const latestSchedule = useRef<GeneratedSchedule | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  useEffect(() => {
    const local = loadSeason();
    if (local && (params.id === local.id || params.id === "local-season")) {
      latestSchedule.current = local;
      cloudScheduleSnapshot.current = CLOUD_SCHEDULE_ID.test(local.id) ? JSON.stringify(local) : null;
      setSchedule(local);
    } else if (params.id) fetch(`/api/seasons/${params.id}`).then((response) => response.ok ? response.json() : null).then((payload) => {
      if (!payload?.schedule) return;
      const loaded = freezeCompletedRankHistory(normalizeSeason(payload.schedule));
      latestSchedule.current = loaded;
      cloudScheduleSnapshot.current = JSON.stringify(loaded);
      setSchedule(loaded);
    }).catch(() => undefined);
    fetch(`/api/entitlements${params.id ? `?scheduleId=${encodeURIComponent(params.id)}` : ""}`).then((response) => response.json()).then(setEntitlements).catch(() => undefined);
  }, [params.id]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const week = Number(query.get("week"));
    if (Number.isInteger(week) && week >= 1 && week <= 17) setSelectedWeek(week);
    const requestedViewValue = query.get("view");
    const requestedView = (requestedViewValue === "schedule" ? "league-schedule" : requestedViewValue) as ViewKey | null;
    if (requestedView && VIEW_ITEMS.some((item) => item.key === requestedView)) setView(requestedView);
  }, []);
  useEffect(() => {
    if (!schedule || !selectedTeamId || schedule.setup.teams.some((team) => team.id === selectedTeamId)) return;
    setSelectedTeamId(schedule.setup.teams[0]?.id ?? "");
  }, [schedule, selectedTeamId]);
  useEffect(() => {
    if (!schedule) return;
    latestSchedule.current = schedule;
    saveSeason(schedule);
    const snapshot = JSON.stringify(schedule);
    if (!entitlements.signedIn || snapshot === cloudScheduleSnapshot.current) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    const scheduleToSave = freezeCompletedRankHistory(schedule);
    autosaveTimer.current = window.setTimeout(async () => {
      autosaveTimer.current = null;
      try {
        const response = await fetch("/api/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: scheduleToSave }) });
        const payload = await response.json() as { schedule?: GeneratedSchedule; error?: string };
        if (!response.ok || !payload.schedule) {
          if (response.status === 401) setEntitlements((current) => ({ ...current, signedIn: false }));
          else setNotice(payload.error || "Saved on this device, but cloud sync needs attention.");
          return;
        }
        const synced = freezeCompletedRankHistory(normalizeSeason(payload.schedule));
        cloudScheduleSnapshot.current = JSON.stringify(synced);
        const latest = latestSchedule.current;
        if (latest && latest !== schedule) {
          const merged = normalizeSeason({ ...latest, id: synced.id, revision: synced.revision });
          latestSchedule.current = merged;
          setSchedule(merged);
        } else {
          latestSchedule.current = synced;
          setSchedule(synced);
        }
        const nextPath = window.location.pathname.replace(`/season/${schedule.id}`, `/season/${synced.id}`);
        window.history.replaceState(null, "", `${nextPath}${window.location.search}${window.location.hash}`);
      } catch {
        setNotice("Saved on this device. Cloud sync is temporarily unavailable.");
      }
    }, 1200);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [schedule, entitlements.signedIn]);
  useEffect(() => {
    if (!schedule) return;
    setSimulationLoaded(false);
    setSimulation(null);
    try {
      const stored = window.sessionStorage.getItem(`leagueweaver:v3:simulation:${schedule.id}`);
      const parsed = stored ? JSON.parse(stored) as SimulationSandbox : null;
      setSavedSimulation(parsed?.version === 1 && parsed.baseSchedule?.id === schedule.id ? parsed : null);
    } catch {
      setSavedSimulation(null);
    } finally {
      setSimulationLoaded(true);
    }
  }, [schedule?.id]);
  useEffect(() => {
    if (!schedule || !simulationLoaded) return;
    const key = `leagueweaver:v3:simulation:${schedule.id}`;
    if (simulation) {
      window.sessionStorage.setItem(key, JSON.stringify(simulation));
      setSavedSimulation(simulation);
    }
  }, [schedule?.id, simulation, simulationLoaded]);
  const activeSchedule = useMemo(() => schedule && simulation ? materializeSimulationSchedule(simulation) : schedule, [schedule, simulation]);
  const simulatorOdds = useMemo((): SimulatorOddsView[] => {
    if (!activeSchedule || view !== "simulator") return [];
    return calculateSeasonOdds(activeSchedule, simulationTrials).map((row) => ({
      teamId: row.teamId,
      playoffOdds: row.playoffOdds,
      divisionOdds: row.divisionOdds,
      championshipOdds: row.championshipOdds,
      topSeedOdds: row.topSeedOdds,
      projectedWins: row.projectedWins,
      projectedLosses: row.projectedLosses,
      averageFinish: row.averageFinish,
      finishDistribution: row.finishDistribution.map((finish) => finish.probability),
      confidence: row.confidence.score,
    }));
  }, [activeSchedule, simulationTrials, view]);
  const simulationResultByGame = useMemo((): Record<string, SimulatorResultView> => {
    if (!simulation) return {};
    return Object.fromEntries(Object.values(simulation.results)
      .filter((result) => result.source !== "recorded")
      .map((result) => [result.gameId, {
        gameId: result.gameId,
        source: result.source as "simulated" | "override",
        locked: result.locked,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        homeWinProbability: result.probability?.home ?? .5,
      }]));
  }, [simulation]);
  const simulationProbabilityByGame = useMemo(() => {
    if (!simulation) return {};
    const probabilities = Object.fromEntries(Object.entries(simulation.probabilitiesByGameId).map(([gameId, probability]) => [gameId, { away: probability.away, home: probability.home }]));
    for (const result of Object.values(simulation.results)) {
      if (result.probability) probabilities[result.gameId] = { away: result.probability.away, home: result.probability.home };
    }
    return probabilities;
  }, [simulation]);
  if (!schedule || !activeSchedule) return <div className="empty-season"><BrandLockup /><CalendarDays /><h1>No generated season yet.</h1><p>Build your league first, then your complete schedule will appear here.</p><Link href="/" className="button-primary">Open schedule builder</Link></div>;
  const onScore = (id: string, home?: number, away?: number) => {
    if (simulation) {
      if (home != null && away != null && home !== away) setSimulation((current) => current ? overrideSimulationGame(current, id, { homeScore: home, awayScore: away }) : current);
      return;
    }
    setSchedule((current) => current ? updateGameScore(current, id, home, away) : current);
  };
  const onFinalizeScores = () => {
    if (!simulation) setSchedule((current) => current ? freezeCompletedRankHistory(current) : current);
  };
  const onUpdatePlayoffs = (patch: Partial<LeagueSetupInput["playoffs"]>) => setSchedule((current) => current ? { ...current, setup: { ...current.setup, playoffs: { ...current.setup.playoffs, ...patch } } } : current);
  const commitSimulation = () => {
    if (!simulation) return;
    const committed = freezeCompletedRankHistory(materializeSimulationSchedule(simulation));
    setSchedule(committed);
    setSimulation(null);
    setSavedSimulation(null);
    window.sessionStorage.removeItem(`leagueweaver:v3:simulation:${schedule.id}`);
    setNotice("Simulation saved back to the season. Those results are now part of the real schedule.");
    window.setTimeout(() => setNotice(null), 5200);
  };
  const discardSimulation = () => {
    setSimulation(null);
    setSavedSimulation(null);
    window.sessionStorage.removeItem(`leagueweaver:v3:simulation:${schedule.id}`);
    setView("league-schedule");
    router.push(`/season/${schedule.id}`);
    setNotice("Simulation discarded. Your real schedule was not changed.");
    window.setTimeout(() => setNotice(null), 4200);
  };
  const openLeagueScheduleWeek = (week: number) => {
    setSelectedWeek(week);
    setView("league-schedule");
    router.push(`/season/${schedule.id}?week=${week}`);
  };
  const onSaveDraftPlaces = (places: Record<string, number | undefined>) => {
    const nextSetup = { ...schedule.setup, teams: schedule.setup.teams.map((team) => ({ ...team, draftPlace: places[team.id] })) };
    if (!hasCompleteDraftRanking(nextSetup)) return setNotice("Choose one unique draft place for every team before saving.");
    setSchedule((current) => current ? normalizeSeason({ ...current, setup: { ...current.setup, teams: current.setup.teams.map((team) => ({ ...team, draftPlace: places[team.id] })) } }) : current);
    setNotice("Draft ranking saved. Week 1 ranks and Game of the Week are updated.");
    window.setTimeout(() => setNotice(null), 4200);
  };
  const save = async () => {
    const frozenSchedule = freezeCompletedRankHistory(schedule);
    saveSeason(frozenSchedule);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    try {
      const response = await fetch("/api/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: frozenSchedule }) });
      const payload = await response.json() as { schedule?: GeneratedSchedule; error?: string };
      if (response.status === 401) {
        setNotice("Saved on this device. Sign in when you want cloud revisions and resume-anywhere access.");
        return null;
      } else if (!response.ok || !payload.schedule) {
        setNotice(payload.error || "Saved on this device, but the cloud copy needs attention.");
        return null;
      } else {
        const synced = freezeCompletedRankHistory(normalizeSeason(payload.schedule));
        cloudScheduleSnapshot.current = JSON.stringify(synced);
        latestSchedule.current = synced;
        setSchedule(synced);
        setEntitlements((current) => ({ ...current, signedIn: true }));
        window.history.replaceState(null, "", `/season/${payload.schedule.id}`);
        setNotice(`Cloud revision ${payload.schedule.revision} saved.`);
        return payload.schedule;
      }
    } catch {
      setNotice("Saved on this device. Cloud save is temporarily unavailable.");
      return null;
    } finally {
      window.setTimeout(() => setNotice(null), 4200);
    }
  };
  const share = async () => {
    let cloudSchedule = schedule;
    if (!CLOUD_SCHEDULE_ID.test(schedule.id)) {
      const saved = await save();
      if (!saved) return;
      cloudSchedule = saved;
    }
    const response = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: cloudSchedule.id }) });
    const payload = await response.json() as { url?: string; error?: string };
    if (!response.ok || !payload.url) return setNotice(payload.error || "This schedule could not be published.");
    try { await navigator.clipboard.writeText(payload.url); setNotice("Public schedule link copied."); }
    catch { setNotice(`Public schedule ready: ${payload.url}`); }
    window.setTimeout(() => setNotice(null), 5200);
  };
  const sendNotification = async () => {
    if (!CLOUD_SCHEDULE_ID.test(schedule.id)) return setNotice("This season needs to finish cloud syncing before sending an update.");
    const response = await fetch("/api/notifications/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: schedule.id }) });
    const payload = await response.json() as { sent?: number; message?: string; error?: string };
    setNotice(response.ok ? payload.message || `Update sent to ${payload.sent ?? 0} subscriber${payload.sent === 1 ? "" : "s"}.` : payload.error || "The update could not be sent.");
    window.setTimeout(() => setNotice(null), 5200);
  };
  const selectView = (item: typeof VIEW_ITEMS[number]) => {
    const feature = item.key === "scores" ? "scorekeeping" : item.key;
    if (item.pro && entitlements.plan !== "pro" && !entitlements.features.includes(feature)) {
      setNotice(`${item.label} is included with Pro. Your complete schedule and basic fairness report remain available on Free.`);
      return;
    }
    if (item.key === "scores" && selectedWeek > schedule.setup.weeks) setSelectedWeek(schedule.setup.weeks);
    setView(item.key);
    if (item.key === "league-schedule") router.push(`/season/${schedule.id}`);
    else if (item.key === "team-schedule") {
      setSelectedTeamId("");
      router.push(`/season/${schedule.id}?view=team-schedule`);
    } else router.push(`/season/${schedule.id}?view=${item.key}`);
  };
  const selectTeamSchedule = (teamId: string) => {
    setSelectedTeamId(teamId);
    setView("team-schedule");
    router.push(teamId ? `/season/${schedule.id}/team/${teamId}` : `/season/${schedule.id}?view=team-schedule`);
  };
  const currentTitle = VIEW_ITEMS.find((item) => item.key === view)?.label ?? "League Schedule";
  const canAccessPlayoffs = entitlements.plan === "pro" || entitlements.features.includes("playoffs");
  const showLockedPlayoffNotice = (roundName: string) => {
    setNotice(`${roundName} is included with Pro. The playoff weeks remain visible here so you can see how the full season is structured.`);
    window.setTimeout(() => setNotice(null), 5200);
  };
  const openDraftRankingSettings = () => {
    setView("settings");
    router.push(`/season/${schedule.id}?view=settings`);
  };
  const playSimulation = () => setSimulation(savedSimulation ?? createSimulationSandbox(schedule));
  const startSimulationFromReal = () => {
    const fresh = createSimulationSandbox(schedule);
    setSavedSimulation(fresh);
    setSimulation(fresh);
  };
  const selectedTeamColor = view === "team-schedule"
    ? activeSchedule.setup.teams.find((team) => team.id === selectedTeamId)?.color
    : undefined;
  const workspaceMainStyle = selectedTeamColor
    ? ({ "--workspace-team-wash": selectedTeamColor } as CSSProperties)
    : undefined;
  return <main className={`workspace-page ${simulation ? "simulation-mode" : ""}`}>
    <header className="workspace-topbar"><BrandLockup /><div className="workspace-season-switch"><EntityLogo className="mini-league-mark" color={schedule.setup.color} logoUrl={schedule.setup.logoUrl} monogram={resolveInitials(schedule.setup.initials, leagueAcronym(schedule.setup.name))} size={34} /><span><strong>{schedule.setup.name}</strong><small>{schedule.setup.seasonYear} season</small></span><ChevronDown /></div><div className="workspace-top-actions"><Tooltip label="Send schedule update"><button type="button" aria-label="Send schedule update" onClick={sendNotification}><Bell /></button></Tooltip><Link href="/account"><CircleUserRound />{entitlements.signedIn ? "Account" : "Sign in"}</Link></div></header>
    <div className="workspace-shell">
      <aside className="workspace-rail"><nav aria-label="Season workspace">{VIEW_ITEMS.map((item) => { const Icon = item.icon; return <button type="button" key={item.key} aria-label={item.label} title={item.label} className={view === item.key ? "active" : ""} onClick={() => selectView(item)}><Icon /><span>{item.label}</span>{item.pro && entitlements.plan !== "pro" && <em>PRO</em>}</button>; })}</nav><div className="rail-bottom"><span>{entitlements.plan === "pro" ? "PRO PLAN" : "FREE PLAN"}</span><p>{entitlements.plan === "pro" ? "Unlimited seasons" : "1 editable season"}</p>{entitlements.plan === "free" && <Link href="/pricing">Upgrade</Link>}</div></aside>
      <section className={`workspace-main ${selectedTeamColor ? "team-workspace-branded" : ""}`} style={workspaceMainStyle}>
        <div className="workspace-toolbar"><div><span className="workspace-breadcrumb">{schedule.setup.abbreviation} / {schedule.setup.seasonYear}</span><h1>{currentTitle}</h1></div><div className="toolbar-actions"><button type="button" title={simulation ? "Export simulated CSV" : "Export CSV"} onClick={() => downloadCsv(activeSchedule)}><Download />CSV</button><button type="button" title={simulation ? "Export simulated PDF" : "Export PDF"} onClick={() => downloadSchedulePdf(activeSchedule)}><FileDown />PDF</button><button type="button" title={simulation ? "Share the real schedule" : "Share schedule"} onClick={share}><Share2 />Share</button></div></div>
        {notice && <div className="workspace-notice"><Cloud />{notice}</div>}
        {simulation && <div className="simulation-mode-banner" role="status">
          <Gamepad2 />
          <span><strong>You’re in the Simulator</strong><small>Every score, rank, statistic, GOTW, odds, and playoff result shown is hypothetical until you save this run.</small></span>
          <em>{Object.values(simulation.results).filter((result) => result.source !== "recorded").length} simulated</em>
          <button type="button" onClick={() => { setView("simulator"); router.push(`/season/${schedule.id}?view=simulator`); }}>Open simulator</button>
          <button type="button" onClick={discardSimulation}>Discard</button>
          <button type="button" className="save-simulation" onClick={commitSimulation}><Save />Save run back</button>
        </div>}
        <DraftRankingReminder schedule={schedule} onSave={onSaveDraftPlaces} openRequest={draftRankingRequest} onOpenSettings={openDraftRankingSettings} />
        <div className="workspace-content">
          {view === "league-schedule" && <ScheduleView schedule={activeSchedule} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} canAccessPlayoffs={canAccessPlayoffs} onLockedPlayoffWeek={showLockedPlayoffNotice} simulationResults={simulationResultByGame} simulationProbabilities={simulationProbabilityByGame} />}
          {view === "team-schedule" && <TeamScheduleView schedule={activeSchedule} teamId={selectedTeamId} onSelectTeam={selectTeamSchedule} onSelectWeek={openLeagueScheduleWeek} simulationResults={simulationResultByGame} />}
          {view === "gotw" && <GotwWorkspace schedule={activeSchedule} simulationResults={simulationResultByGame} simulationProbabilities={simulationProbabilityByGame} />}
          {view === "matchup-ratings" && <MatchupRatingsView schedule={activeSchedule} />}
          {view === "scores" && <ScoresView schedule={activeSchedule} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} onScore={onScore} onFinalizeScores={onFinalizeScores} simulationActive={Boolean(simulation)} simulationResults={simulationResultByGame} />}
          {view === "standings" && <StandingsView schedule={activeSchedule} />}
          {view === "playoffs" && <PlayoffsView schedule={activeSchedule} onUpdatePlayoffs={simulation ? () => undefined : onUpdatePlayoffs} simulationMode={Boolean(simulation)} />}
          {view === "simulator" && !simulation && simulationLoaded && <SimulatorLaunch hasSavedRun={Boolean(savedSimulation)} onPlay={playSimulation} onStartFromReal={startSimulationFromReal} />}
          {view === "simulator" && simulation && <SimulatorWorkspace
            schedule={activeSchedule}
            resultByGame={simulationResultByGame}
            probabilityByGame={simulationProbabilityByGame}
            odds={simulatorOdds}
            trials={simulationTrials}
            onTrialsChange={setSimulationTrials}
            onSimulateGame={(gameId) => setSimulation((current) => current ? simulateNextGame(current, gameId) : current)}
            onRerollGame={(gameId) => setSimulation((current) => current ? rerollSimulationGame(current, gameId) : current)}
            onOverrideGame={(gameId, homeScore, awayScore) => setSimulation((current) => current ? overrideSimulationGame(current, gameId, { homeScore, awayScore }) : current)}
            onToggleLock={(gameId) => setSimulation((current) => current ? toggleSimulationGameLock(current, gameId) : current)}
            onAdvanceWeek={() => setSimulation((current) => current ? simulateNextWeek(current) : current)}
            onFirstHalf={() => setSimulation((current) => current ? simulateFirstHalf(current) : current)}
            onRestOfSeason={() => setSimulation((current) => current ? simulateRestOfSeason(current) : current)}
            onRerollSeason={() => setSimulation((current) => current ? rerollSimulation(current, { scope: "full", includePlayoffs: Boolean(current.playoff) }) : current)}
            onRestartFromBeginning={() => setSimulation((current) => current ? restartSimulationFromBeginning(current) : current)}
            onPlayToChampion={() => setSimulation((current) => current ? simulateToChampion(current) : current)}
            onClearSimulated={() => setSimulation((current) => current ? clearSimulatedResults(current) : current)}
            onClearAll={() => setSimulation((current) => current ? clearAllHypotheticalResults(current) : current)}
            onSave={commitSimulation}
            onDiscard={discardSimulation}
            onOpenSchedule={openLeagueScheduleWeek}
          />}
          {view === "fairness" && <FairnessView schedule={activeSchedule} />}
          {view === "settings" && <SettingsView schedule={activeSchedule} onOpenDraftRanking={() => setDraftRankingRequest((current) => current + 1)} />}
        </div>
        {entitlements.plan !== "pro" && <AdUnit placement="workspace" />}
      </section>
    </div>
  </main>;
}
