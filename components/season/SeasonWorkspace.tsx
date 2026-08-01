"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ArrowDownRight,
  Bell,
  CalendarDays,
  Check,
  Cloud,
  Copy,
  Download,
  FileDown,
  FileSpreadsheet,
  Gamepad2,
  History,
  ImagePlus,
  LayoutList,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  MapPin,
  Medal,
  Pencil,
  Play,
  RefreshCw,
  Save,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { BrandLockup } from "@/components/AppHeader";
import { GenerationReveal } from "@/components/builder/GenerationReveal";
import { AccountIdentity } from "@/components/account/AccountIdentity";
import { useAuthModal } from "@/components/account/AuthModalProvider";
import { AdUnit } from "@/components/ads/AdUnit";
import { GotwWorkspace } from "@/components/season/GotwWorkspace";
import { BracketConnectorLayer, type BracketConnection } from "@/components/season/BracketConnectorLayer";
import { ConsolationBracket, FinalPlacementTable } from "@/components/season/ConsolationBracket";
import { GameBadgeChip, MatchupCard, MatchupRatingLegend, MatchupSeriesChip, TeamIdentityBlock, WeekMatchupRank } from "@/components/season/MatchupPresentation";
import { SimulatorWorkspace, type SimulatorResultView } from "@/components/season/SimulatorWorkspace";
import { StatsWorkspace } from "@/components/season/StatsWorkspace";
import { TeamScheduleView } from "@/components/season/TeamSchedulePage";
import { WeekScoreBar } from "@/components/season/WeekScoreBar";
import { StakesButton } from "@/components/season/StakesPanel";
import { getLiveWeek } from "@/lib/scenarios";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { WorkspaceSwitcher } from "@/components/season/WorkspaceSwitcher";
import { IdentityColorPicker } from "@/components/ui/IdentityColorPicker";
import { Tooltip } from "@/components/ui/Tooltip";
import { apiErrorMessage } from "@/lib/apiErrors";
import { downloadCsv } from "@/lib/csv";
import { readableTextColor } from "@/lib/colorContrast";
import { isDivisionHalvesConsolationUsable, projectConsolationBracket } from "@/lib/consolation";
import { downloadSchedulePdf } from "@/lib/pdf";
import { getMatchupRatingRange, getMatchupSignal, matchupRating, sortGamesForDisplay } from "@/lib/matchups";
import {
  getPlayoffByeCount,
  getPlayoffGameBrandingSlots,
  getPlayoffRoundNames,
  normalizePlayoffSettings,
  playoffPlacementLabel,
  projectPlayoffRounds,
  projectPlayoffSeeds,
  resolvePlayoffPlacementMode,
} from "@/lib/playoffs";
import {
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
import { loadSeasonById, normalizeSeason, removeLocalSeason, saveSeason } from "@/lib/storage";
import { getNflWeekWindow, getWeekDateLabel, updateGameScore } from "@/lib/schedule";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, ImportHistoryEvent, ImportPreview, LeagueSetupInput, PlatformConnection, PlatformSyncMode, PlayoffGame, ScheduledGame, Team, TiebreakerSettings } from "@/lib/types";

type ViewKey = "league-schedule" | "team-schedule" | "gotw" | "matchup-ratings" | "standings" | "playoffs" | "simulator" | "settings";
const CLOUD_SCHEDULE_ID = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;

type ExistingSeasonConflict = {
  id: string;
  title: string;
  time_frame?: { seasonYear?: number; weeks?: number };
  updated_at: string;
};

type CloudSaveResponse = {
  schedule?: GeneratedSchedule;
  title?: string;
  error?: string;
  code?: string;
  existingSeason?: ExistingSeasonConflict;
};

type SeasonSaveConflict = {
  existingSeason: ExistingSeasonConflict;
  schedule: GeneratedSchedule;
  snapshot: string;
};

type CloudRetryState = {
  schedule: GeneratedSchedule;
  reason: string;
  retrying: boolean;
};

function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function providerLabel(provider: ImportHistoryEvent["provider"]) {
  if (provider === "espn") return "ESPN";
  if (provider === "sleeper") return "Sleeper";
  if (provider === "leagueweaver") return "League Weaver";
  if (provider === "csv") return "CSV";
  if (provider === "paste") return "Pasted roster";
  return "Screenshot";
}

function historyStatusLabel(status: ImportHistoryEvent["status"]) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type HighlightedGame = { id: string; medalRank?: number; medalCategory?: string } | null;
type ImportedScoreRow = { gameId: string; awayTeamId: string; homeTeamId: string; awayName: string; homeName: string; awayScore?: number; homeScore?: number };

function seasonTimeframeLabel(seasonYear: number, weeks: number) {
  const firstWeek = getNflWeekWindow(seasonYear, 1);
  const finalWeek = getNflWeekWindow(seasonYear, weeks);
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const finalDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${seasonYear} season · NFL Weeks 1–${weeks} · ${monthDay.format(new Date(firstWeek.startsAt))}–${finalDate.format(new Date(finalWeek.endsAt))}`;
}

const VIEW_ITEMS: Array<{ key: ViewKey; label: string; icon: typeof CalendarDays; pro?: boolean }> = [
  { key: "league-schedule", label: "League Schedule", icon: CalendarDays },
  { key: "team-schedule", label: "Team Schedule", icon: UsersRound },
  { key: "gotw", label: "Game of the Week", icon: Star },
  { key: "matchup-ratings", label: "Matchup Ratings", icon: SlidersHorizontal },
  { key: "standings", label: "Standings", icon: BarChart3 },
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
  logoUrl?: string;
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
    ? actualGames.map((game, index) => ({
      key: game.id,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      homeSeed: seedByTeam.get(game.homeTeamId)?.seed ?? teamById.get(game.homeTeamId)?.overallRank ?? 0,
      awaySeed: seedByTeam.get(game.awayTeamId)?.seed ?? teamById.get(game.awayTeamId)?.overallRank ?? 0,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      stadium: game.stadium,
      logoUrl: game.logoUrl || settings.gameLogoUrls?.[`main-r${roundIndex + 1}-g${index + 1}`],
      recorded: true,
    }))
    : round.matchups.map((matchup, index) => ({
      key: `main-r${roundIndex + 1}-g${index + 1}`,
      homeTeamId: seedByNumber.get(matchup.homeSeed)?.teamId ?? "",
      awayTeamId: seedByNumber.get(matchup.awaySeed)?.teamId ?? "",
      homeSeed: matchup.homeSeed,
      awaySeed: matchup.awaySeed,
      logoUrl: settings.gameLogoUrls?.[`main-r${roundIndex + 1}-g${index + 1}`],
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
    <div className={`playoff-week-heading${settings.logoUrl ? " has-logo" : " no-logo"}`}>
      {settings.logoUrl && <EntityLogo color={settings.color} logoUrl={settings.logoUrl} monogram="PO" size={48} />}
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
          <span className="playoff-week-game-label">{matchup.logoUrl && <EntityLogo color={settings.color} logoUrl={matchup.logoUrl} monogram={`G${index + 1}`} size={34} />}<span><small>GAME {index + 1}</small><strong>{played ? "Final" : matchup.recorded ? "Scheduled" : "Projected"}</strong></span></span>
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

function ScheduleView({ schedule, selectedWeek, setSelectedWeek, canAccessPlayoffs, onOpenScores, highlightedGame, simulationResults = {}, simulationProbabilities = {} }: {
  schedule: GeneratedSchedule;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  canAccessPlayoffs: boolean;
  onOpenScores: (week: number) => void;
  highlightedGame?: HighlightedGame;
  simulationResults?: Record<string, SimulatorResultView>;
  simulationProbabilities?: Record<string, { away: number; home: number }>;
}) {
  const [ratingTier, setRatingTier] = useState("all");
  const weekStripRef = useRef<HTMLDivElement>(null);
  const scheduleSignals = useMemo(() => getScheduleGameSignals(schedule), [schedule]);
  const playoffRounds = useMemo(() => projectPlayoffRounds(schedule), [schedule]);
  const selectedPlayoffIndex = canAccessPlayoffs ? playoffRounds.findIndex((round) => round.weekNumber === selectedWeek) : -1;
  const liveWeekNumber = useMemo(() => getLiveWeek(schedule), [schedule]);
  const goToGame = (gameId: string) => window.setTimeout(() => document.getElementById(gameId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  useEffect(() => {
    const gameId = highlightedGame?.id || window.location.hash.slice(1);
    if (!gameId) return;
    const timer = window.setTimeout(() => document.getElementById(gameId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    return () => window.clearTimeout(timer);
  }, [selectedWeek, highlightedGame?.id]);
  // Keep the selected week centered in the strip, but only when it's off-screen —
  // clicking an already-visible week shouldn't make the strip jump (audit #22).
  useEffect(() => {
    const container = weekStripRef.current;
    const active = container?.querySelector<HTMLElement>(".active");
    if (!container || !active) return;
    const c = container.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    if (a.left < c.left || a.right > c.right) active.scrollIntoView({ inline: "center", block: "nearest" });
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
  const nflWeekWindow = getNflWeekWindow(schedule.setup.seasonYear, week.weekNumber);
  const holidays = nflWeekWindow.holidays;
  const isThanksgivingWeek = holidays.includes("Thanksgiving");
  const secondaryHolidays = holidays.filter((holiday) => holiday !== "Thanksgiving");
  const openScoreCount = week.games.filter((game) => game.homeScore == null || game.awayScore == null).length;
  const hasEnteredScores = week.games.some((game) => game.homeScore != null || game.awayScore != null);
  const scoreEntryDue = openScoreCount > 0 && Date.now() >= new Date(nflWeekWindow.endsAt).getTime();
  const playingTeamIds = new Set(week.games.flatMap((game) => [game.homeTeamId, game.awayTeamId]));
  const byeTeams = schedule.setup.teams.filter((team) => !playingTeamIds.has(team.id));
  const orderedGames = sortGamesForDisplay(week.games.filter((game) => teamById.has(game.homeTeamId) && teamById.has(game.awayTeamId)), displayedRanks);
  const visibleGames = ratingTier === "all" ? orderedGames : orderedGames.filter((game) => getMatchupSignal(game, displayedRanks, ratingRange).label.toLowerCase() === ratingTier);
  const ratingOptions = [
    { value: "all", label: "All matchups", description: "Show the complete week" },
    { value: "competitive", label: "Competitive", description: "Strongest third of this schedule" },
    { value: "neutral", label: "Neutral", description: "Middle third of this schedule" },
    { value: "lopsided", label: "Lopsided", description: "Widest ranking gaps" },
  ];
  const gotwPureAway = gotwEntry ? teamById.get(gotwEntry.pureGame.awayTeamId) : undefined;
  const gotwPureHome = gotwEntry ? teamById.get(gotwEntry.pureGame.homeTeamId) : undefined;
  const gotwOverrideDetails = gotwEntry?.playoffImplication && gotwEntry.pureGame.id !== gotwEntry.game.id && gotwPureAway && gotwPureHome
    ? {
        featuredRanks: `#${gotwEntry.ranks.get(gotwEntry.game.awayTeamId) ?? "—"} vs #${gotwEntry.ranks.get(gotwEntry.game.homeTeamId) ?? "—"}`,
        pureMatchup: `${teamDisplayName(gotwPureAway, display.cityNames)} vs ${teamDisplayName(gotwPureHome, display.cityNames)}`,
      }
    : undefined;
  const weekSelector = <div ref={weekStripRef} className="week-selector schedule-week-selector" aria-label="Select regular season or playoff week">
    {schedule.weeks.map((item) => {
      const isThanksgiving = getNflWeekWindow(schedule.setup.seasonYear, item.weekNumber).holidays.includes("Thanksgiving");
      return <button type="button" aria-current={item.weekNumber === selectedWeek ? "true" : undefined} aria-label={`Week ${item.weekNumber}, ${item.dateLabel}${item.weekNumber === selectedWeek ? ", selected" : ""}${isThanksgiving ? ", Thanksgiving week" : ""}`} className={`${item.weekNumber === selectedWeek ? "active" : ""}${isThanksgiving ? " is-thanksgiving" : ""}`.trim()} key={item.weekNumber} onClick={() => setSelectedWeek(item.weekNumber)}>{isThanksgiving && <span className="week-thanksgiving-mark" title="Thanksgiving week" aria-hidden="true">🦃</span>}<span>W{item.weekNumber}</span><small>{item.dateLabel.split(",")[0]}</small><WeekMatchupRank rank={item.matchupRank} total={schedule.weeks.length} compact /></button>;
    })}
    {canAccessPlayoffs && <span className="week-selector-divider" aria-hidden="true" />}
    {canAccessPlayoffs && playoffRounds.map((round) => <Tooltip key={round.weekNumber} label={`${round.name}, NFL Week ${round.weekNumber}`}>
      <button
        type="button"
        className={`playoff-week-button ${round.weekNumber === selectedWeek ? "active" : ""}`}
        style={{ "--playoff-week-color": schedule.setup.playoffs.color, "--playoff-week-ink": readableTextColor(schedule.setup.playoffs.color) } as CSSProperties}
        aria-label={`${round.name}, NFL Week ${round.weekNumber}`}
        onClick={() => setSelectedWeek(round.weekNumber)}
      >
        <span>W{round.weekNumber}</span>
        <small>{playoffRoundShortLabel(round.name)}</small>
        <span className="playoff-week-selector-icon"><Trophy /></span>
      </button>
    </Tooltip>)}
  </div>;
  if (selectedPlayoffIndex >= 0) {
    return <div className="workspace-stack">
      {weekSelector}
      <PlayoffWeekSchedule schedule={schedule} roundIndex={selectedPlayoffIndex} />
    </div>;
  }
  return (
    <div className="workspace-stack">
      {weekSelector}
      <div className="schedule-week-panel">
        <div className={`section-bar schedule-week-header${isThanksgivingWeek ? " is-thanksgiving" : ""}`}><div><span className="bar-number">{String(week.weekNumber).padStart(2, "0")}</span><span><span className="schedule-week-title"><strong>Week {week.weekNumber}</strong>{isThanksgivingWeek && <em className="thanksgiving-week-label">Thanksgiving Week</em>}</span><small>{week.dateLabel}</small></span></div><div className="section-bar-actions"><WeekMatchupRank rank={week.matchupRank} total={schedule.weeks.length} />{week.weekNumber === liveWeekNumber && <StakesButton schedule={schedule} weekNumber={week.weekNumber} onGoToGame={goToGame} />}<button type="button" className={`score-entry-trigger${scoreEntryDue ? " needs-attention" : ""}`} onClick={() => onOpenScores(week.weekNumber)}><LayoutList /><span>{hasEnteredScores ? "Edit scores" : "Add scores"}</span></button><span className="week-markers">{secondaryHolidays.map((holiday) => <em className="holiday-marker" key={holiday}>{holiday}</em>)}{byeTeams.length > 0 && <em className="bye-marker">{byeTeams.length} BYE</em>}</span><span className="rating-tier-filter"><CustomSelect label="Filter matchup rating" value={ratingTier} onChange={setRatingTier} options={ratingOptions} showSelectedDescription={false} /></span></div></div>
        {gotwOverrideDetails && gotwEntry && visibleGames.some((game) => game.id === gameOfWeekId) && <section className="gotw-selection-reason" aria-label="Why this matchup is Game of the Week">
          <span><Star fill="currentColor" /></span>
          <div><small>LATE-SEASON PLAYOFF IMPACT</small><strong>Why this won the rating tie</strong><p>This {gotwOverrideDetails.featuredRanks} matchup shares the week&apos;s best {gotwEntry.rating.toFixed(1)} rating and crosses the {schedule.setup.playoffs.fieldSize}-team playoff cutline. Playoff impact moved it ahead of <span>{gotwOverrideDetails.pureMatchup}</span> after the rating tie. Lower ratings always remain first.</p></div>
        </section>}
        <div className="matchup-list matchup-card-list">{visibleGames.map((game) => {
          const analytics = scheduleSignals.byGameId.get(game.id);
          const featured = game.id === gameOfWeekId;
          const simulationResult = simulationResults[game.id];
          const isHighlighted = highlightedGame?.id === game.id;
          const highlightedMedalLabel = isHighlighted && highlightedGame?.medalRank ? ["Gold", "Silver", "Bronze"][highlightedGame.medalRank - 1] : undefined;
          return <MatchupCard key={game.id} {...presentationFor(game, week.weekNumber)} featured={featured} featuredLabel={featured && gotwEntry ? gameOfWeekStatusLabel(gotwEntry.status) : undefined} gameLabel={featured ? undefined : `Game ${game.gameNumber}`} badges={analytics?.badges} medalRank={isHighlighted ? highlightedGame?.medalRank : analytics?.qualityRank} medalLabel={highlightedMedalLabel ? `${highlightedMedalLabel} · ${highlightedGame?.medalCategory || "League leader"}` : undefined} highlighted={isHighlighted} simulationSource={simulationResult?.source} simulationLocked={simulationResult?.locked} winProbability={simulationProbabilities[game.id]} teamHrefBase={`/season/${schedule.id}/team`} />;
        })}{visibleGames.length === 0 && (ratingTier !== "all"
          ? <div className="rating-filter-empty"><strong>No {ratingTier} matchups this week.</strong><button type="button" onClick={() => setRatingTier("all")}>Show all matchups</button></div>
          : <div className="rating-filter-empty"><strong>No games scheduled this week.</strong>{byeTeams.length > 0 && <span>Every team is on a bye this week.</span>}</div>)}</div>
      </div>
      <MatchupRatingLegend />
      {byeTeams.length > 0 && <div className="week-bye-list"><strong>Bye</strong>{byeTeams.map((team) => <span key={team.id}><EntityLogo size={32} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />{teamDisplayName(team, display.cityNames)}</span>)}</div>}
      </div>
  );
}

function MatchupRatingsView({ schedule }: { schedule: GeneratedSchedule }) {
  const [lens, setLens] = useState("live");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("best");
  const scheduleSignals = getScheduleGameSignals(schedule);
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
        <thead><tr><th>Wk</th><th>Game</th><th>Away</th><th>Result</th><th>Home</th><th>Matchup</th><th>Rating</th></tr></thead>
        <tbody>{visibleGames.map((game) => {
          const away = teamById.get(game.awayTeamId)!;
          const home = teamById.get(game.homeTeamId)!;
          const rowRanks = ranksForGame(game);
          const signal = getMatchupSignal(game, lens === "live" ? rowRanks : undefined, ratingRange);
          const played = game.awayScore != null && game.homeScore != null;
          const awayWon = played && game.awayScore! > game.homeScore!;
          const homeWon = played && game.homeScore! > game.awayScore!;
          const isGameOfWeek = scheduleSignals.gotwIds.has(game.id);
          return <tr className={isGameOfWeek ? "is-gotw" : undefined} key={game.id}>
            <td><Link href={`/season/${schedule.id}?week=${game.week}#${game.id}`}>W{game.week}</Link></td>
            <td>{isGameOfWeek ? <GameBadgeChip badge="GOTW" /> : <span className="matchup-table-game-label">Game {game.gameNumber ?? "—"}</span>}</td>
            <td><TeamIdentityBlock compact showRecord={false} team={away} division={divisionById.get(away.divisionId)} leagueRank={rowRanks.get(away.id) ?? away.overallRank} record={{ overall: "0-0" }} showCity={schedule.setup.display.cityNames} href={`/season/${schedule.id}/team/${away.id}`} /></td>
            <td>{played ? <span className="matchup-table-result" aria-label={`Final score: ${away.name} ${game.awayScore}, ${home.name} ${game.homeScore}`}><span><strong className={awayWon ? "winner" : homeWon ? "loser" : ""}>{game.awayScore}</strong><b aria-label="at">@</b><strong className={homeWon ? "winner" : awayWon ? "loser" : ""}>{game.homeScore}</strong></span><small>FINAL</small></span> : <span className="matchup-table-result pending">—<small>NOT PLAYED</small></span>}</td>
            <td><TeamIdentityBlock mirrored compact showRecord={false} team={home} division={divisionById.get(home.divisionId)} leagueRank={rowRanks.get(home.id) ?? home.overallRank} record={{ overall: "0-0" }} showCity={schedule.setup.display.cityNames} href={`/season/${schedule.id}/team/${home.id}`} /></td>
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

function ScoreImageImport({ schedule, selectedWeek, onApply, onPendingChange }: { schedule: GeneratedSchedule; selectedWeek: number; onApply: (rows: ImportedScoreRow[]) => void; onPendingChange: (pending: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportedScoreRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const week = schedule.weeks.find((item) => item.weekNumber === selectedWeek) ?? schedule.weeks[0];
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  useEffect(() => {
    setRows(null);
    setWarnings([]);
    setError(null);
    setFileName("");
  }, [selectedWeek]);
  useEffect(() => {
    onPendingChange(Boolean(rows?.length));
  }, [rows, onPendingChange]);
  const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const findTeam = (city: string | undefined, name: string) => {
    const extracted = [normalizeName(`${city ?? ""}${name}`), normalizeName(name)].filter(Boolean);
    return schedule.setup.teams.find((team) => {
      const aliases = [normalizeName(`${team.city}${team.name}`), normalizeName(team.name)].filter(Boolean);
      return extracted.some((candidate) => aliases.some((alias) => candidate === alias || (alias.length >= 4 && candidate.endsWith(alias))));
    });
  };
  const readImage = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("That image could not be read."));
    reader.onerror = () => reject(new Error("That image could not be read."));
    reader.readAsDataURL(file);
  });
  const importImage = async (file?: File) => {
    if (!file) return;
    if (file.size > 8_000_000) return setError("Choose a PNG, JPG, or WebP image under 8 MB.");
    setLoading(true);
    setError(null);
    setRows(null);
    setFileName(file.name);
    try {
      const imageDataUrl = await readImage(file);
      const response = await fetch("/api/import/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "scores",
          imageDataUrl,
          seasonYear: schedule.setup.seasonYear,
          week: selectedWeek,
          teamNames: schedule.setup.teams.map((team) => teamDisplayName(team, true)),
        }),
      });
      const preview = await response.json().catch(() => ({})) as ImportPreview & { error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, preview.error, "That score image could not be read."));
      const scoreByTeamId = new Map<string, number>();
      preview.teams.forEach((importedTeam) => {
        const matchedTeam = findTeam(importedTeam.city, importedTeam.name);
        const score = importedTeam.scores?.find((item) => item.week === selectedWeek)?.value;
        if (matchedTeam && score != null) scoreByTeamId.set(matchedTeam.id, score);
      });
      const nextRows = week.games.map((game) => {
        const away = teamById.get(game.awayTeamId)!;
        const home = teamById.get(game.homeTeamId)!;
        return {
          gameId: game.id,
          awayTeamId: away.id,
          homeTeamId: home.id,
          awayName: teamDisplayName(away, true),
          homeName: teamDisplayName(home, true),
          awayScore: scoreByTeamId.get(away.id),
          homeScore: scoreByTeamId.get(home.id),
        };
      });
      const unmatchedCount = preview.teams.filter((team) => !findTeam(team.city, team.name)).length;
      setRows(nextRows);
      setWarnings([...preview.warnings, ...(unmatchedCount ? [`${unmatchedCount} extracted team ${unmatchedCount === 1 ? "name did" : "names did"} not match this league.`] : [])]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That score image could not be read.");
    } finally {
      setLoading(false);
    }
  };
  const updateScore = (gameId: string, side: "awayScore" | "homeScore", value: string) => {
    const parsed = value === "" ? undefined : Math.round(Math.max(0, Number(value)) * 100) / 100;
    setRows((current) => current?.map((row) => row.gameId === gameId ? { ...row, [side]: Number.isFinite(parsed) ? parsed : undefined } : row) ?? null);
  };
  const completeRows = rows?.filter((row) => row.awayScore != null && row.homeScore != null) ?? [];
  return <section className={`score-image-import${rows ? " reviewing" : ""}`} aria-label="Import scores from an image">
    {!rows && <div className="score-image-import-start"><span className="score-image-import-mark"><ImagePlus /></span><span><strong>Import a score image</strong><small>Upload a clear scoreboard screenshot. AI will suggest scores for Week {selectedWeek}, then you review them.</small></span><label className="button-secondary"><ImagePlus />{loading ? "Reading image…" : "Choose image"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={(event) => void importImage(event.target.files?.[0])} /></label></div>}
    {loading && <div className="score-image-loading" role="status"><RefreshCw className="spin" /><span><strong>Reading {fileName}</strong><small>Matching team names and Week {selectedWeek} scores…</small></span></div>}
    {error && <div className="score-image-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError(null)}>Dismiss</button></div>}
    {rows && <>
      <header><span><strong>Review AI score suggestions</strong><small>{fileName} · Week {selectedWeek} · Check every matchup before applying.</small></span><button type="button" onClick={() => { setRows(null); setWarnings([]); setFileName(""); onPendingChange(false); }}><ImagePlus />Choose another</button></header>
      <div className="score-image-review-list">{rows.map((row) => {
        const away = teamById.get(row.awayTeamId)!;
        const home = teamById.get(row.homeTeamId)!;
        const complete = row.awayScore != null && row.homeScore != null;
        return <div className={`score-image-review-row${complete ? " complete" : " incomplete"}`} key={row.gameId}>
          <span className="score-image-team away"><TeamMark team={away} size="small" /><strong>{row.awayName}</strong></span>
          <input type="number" inputMode="decimal" min="0" step="0.01" aria-label={`${row.awayName} imported score`} value={row.awayScore ?? ""} onChange={(event) => updateScore(row.gameId, "awayScore", event.target.value)} />
          <b aria-label="at">@</b>
          <input type="number" inputMode="decimal" min="0" step="0.01" aria-label={`${row.homeName} imported score`} value={row.homeScore ?? ""} onChange={(event) => updateScore(row.gameId, "homeScore", event.target.value)} />
          <span className="score-image-team home"><strong>{row.homeName}</strong><TeamMark team={home} size="small" /></span>
          <em>{complete ? "Ready" : "Check scores"}</em>
        </div>;
      })}</div>
      {warnings.length > 0 && <div className="score-image-warnings">{warnings.slice(0, 4).map((warning) => <span key={warning}>{warning}</span>)}</div>}
      <footer><span><strong>{completeRows.length} of {rows.length} matchups ready</strong><small>Incomplete rows will not be changed.</small></span><button type="button" className="button-primary" disabled={completeRows.length === 0} onClick={() => { onApply(completeRows); setRows(null); setWarnings([]); setFileName(""); onPendingChange(false); }}><Check />Apply reviewed scores</button></footer>
    </>}
  </section>;
}

function StandingsView({ schedule, onUpdateTiebreakers, readOnly = false }: { schedule: GeneratedSchedule; onUpdateTiebreakers?: (settings: TiebreakerSettings) => void; readOnly?: boolean }) {
  return <StatsWorkspace schedule={schedule} onUpdateTiebreakers={onUpdateTiebreakers} readOnly={readOnly} />;
}

function InlinePlayoffScoreEditor({
  awayName,
  homeName,
  awayScore,
  homeScore,
  onSave,
  onClear,
}: {
  awayName: string;
  homeName: string;
  awayScore?: number;
  homeScore?: number;
  onSave: (away: number, home: number) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [awayDraft, setAwayDraft] = useState(awayScore?.toString() ?? "");
  const [homeDraft, setHomeDraft] = useState(homeScore?.toString() ?? "");
  const away = Number(awayDraft);
  const home = Number(homeDraft);
  const valid = awayDraft !== "" && homeDraft !== "" && Number.isFinite(away) && Number.isFinite(home) && away >= 0 && home >= 0 && away !== home;

  useEffect(() => {
    setAwayDraft(awayScore?.toString() ?? "");
    setHomeDraft(homeScore?.toString() ?? "");
  }, [awayScore, homeScore]);

  return <div className={`inline-playoff-score${open ? " is-open" : ""}`}>
    <button type="button" className="inline-playoff-score-trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}><Pencil />{awayScore != null && homeScore != null ? "Edit score" : "Enter score"}</button>
    {open && <div className="inline-playoff-score-form">
      <label><span>{awayName}</span><input aria-label={`${awayName} score`} type="number" min="0" step="0.01" inputMode="decimal" value={awayDraft} onChange={(event) => setAwayDraft(event.target.value)} /></label>
      <b aria-hidden="true">@</b>
      <label><span>{homeName}</span><input aria-label={`${homeName} score`} type="number" min="0" step="0.01" inputMode="decimal" value={homeDraft} onChange={(event) => setHomeDraft(event.target.value)} /></label>
      <span className="inline-playoff-score-actions">
        {(awayScore != null || homeScore != null) && <button type="button" onClick={() => { onClear(); setOpen(false); }}>Clear</button>}
        <button type="button" className="button-primary" disabled={!valid} onClick={() => { onSave(Math.round(away * 100) / 100, Math.round(home * 100) / 100); setOpen(false); }}><Check />Save</button>
      </span>
      {awayDraft !== "" && homeDraft !== "" && away === home && <small>Playoff games need a winner. Enter a non-tied score.</small>}
    </div>}
  </div>;
}

function PlayoffsView({
  schedule,
  onUpdatePlayoffs,
  onUpdatePlayoffGame,
  highlightedGame,
  simulationMode = false,
}: {
  schedule: GeneratedSchedule;
  onUpdatePlayoffs: (patch: Partial<LeagueSetupInput["playoffs"]>) => void;
  onUpdatePlayoffGame: (game: PlayoffGame) => void;
  highlightedGame?: HighlightedGame;
  simulationMode?: boolean;
}) {
  const [roundBrandingOpen, setRoundBrandingOpen] = useState(false);
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
  useEffect(() => {
    if (!highlightedGame?.id) return;
    const timer = window.setTimeout(() => document.getElementById(highlightedGame.id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    return () => window.clearTimeout(timer);
  }, [highlightedGame?.id]);
  const mainGameBrandingSlots = getPlayoffGameBrandingSlots(settings, schedule.setup.divisions.length);
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
  const RoundHeading = ({ index }: { index: number }) => <h3 className="playoff-round-heading">{settings.roundLogoUrls?.[index] && <img src={settings.roundLogoUrls[index]} alt="" />}<span className="playoff-round-heading-copy"><span>{rounds[index] || `Round ${index + 1}`}</span><small>NFL Week {schedule.setup.weeks + index + 1} · {roundDate(index)}</small></span></h3>;
  const sideName = (side: "A" | "B") => {
    const divisionNames = [...new Set(seeds.filter((item) => item.bracketSide === side).map((item) => divisionById.get(item.divisionId)?.name).filter(Boolean))];
    return divisionNames.length ? divisionNames.join(" + ") : `Half ${side}`;
  };
  const mainGameBrandingLabel = (slot: typeof mainGameBrandingSlots[number]) => {
    const sameRound = mainGameBrandingSlots.filter((item) => item.roundIndex === slot.roundIndex);
    if (placement === "division-halves" && schedule.setup.divisions.length === 2 && sameRound.length === 2 && slot.roundIndex < rounds.length - 1) {
      return `${schedule.setup.divisions[slot.gameIndex]?.name ?? `Half ${slot.gameIndex + 1}`} ${slot.roundName}`;
    }
    return sameRound.length === 1 ? slot.roundName : `${slot.roundName} · Game ${slot.gameIndex + 1}`;
  };
  const gameDisplayName = (gameId: string, fallback: string) => settings.gameNames?.[gameId]?.trim() || fallback;
  const halfChampionCopy = placement === "division-halves" ? `${sideName("A")} champion vs. ${sideName("B")} champion` : null;
  const championshipCopy = halfChampionCopy ? `${halfChampionCopy} · ${championshipVenueCopy}` : championshipVenueCopy;
  const lockField = () => onUpdatePlayoffs(settings.fieldStatus === "locked"
    ? { fieldStatus: "live", lockedTeamIds: [] }
    : { fieldStatus: "locked", lockedTeamIds: seeds.map((item) => item.teamId) });
  const formatLabel = settings.bracketType.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const consolationOptions = [
    { value: "standard", label: "Standard placement", description: "Overall seeds follow a separate ESPN-style placement bracket" },
    ...(isDivisionHalvesConsolationUsable(schedule.setup, fieldSize) ? [{ value: "division-halves", label: "Division-halves placement", description: "Teams open inside their division, then cross for final places" }] : []),
    { value: "off", label: "No consolation bracket", description: "Show only the championship bracket" },
  ];
  const updateRoundLogo = (roundIndex: number, logoUrl?: string) => {
    const roundLogoUrls = [...(settings.roundLogoUrls ?? Array(rounds.length).fill(""))];
    roundLogoUrls[roundIndex] = logoUrl || "";
    onUpdatePlayoffs({ roundLogoUrls });
  };
  const updateRoundName = (roundIndex: number, name: string) => {
    const roundNames = [...(settings.roundNames ?? rounds)];
    roundNames[roundIndex] = name.slice(0, 40);
    onUpdatePlayoffs({ roundNames });
  };
  const updateGameName = (gameId: string, name: string) => {
    const gameNames = { ...(settings.gameNames ?? {}) };
    if (name.trim()) gameNames[gameId] = name.slice(0, 60);
    else delete gameNames[gameId];
    onUpdatePlayoffs({ gameNames });
  };
  const updateGameLogo = (gameId: string, logoUrl?: string) => {
    const gameLogoUrls = { ...(settings.gameLogoUrls ?? {}) };
    if (logoUrl) gameLogoUrls[gameId] = logoUrl;
    else delete gameLogoUrls[gameId];
    onUpdatePlayoffs({ gameLogoUrls });
  };
  const consolationGameBrandingSlots = projectConsolationBracket(normalizedSchedule)?.rounds.flatMap((round) =>
    round.games.map((game) => ({ ...game, roundName: round.name }))) ?? [];
  const projectedMainRounds = projectPlayoffRounds(normalizedSchedule);
  const consolationProjection = projectConsolationBracket(normalizedSchedule);
  const mainConnections: BracketConnection[] = projectedMainRounds.slice(0, -1).flatMap((round) => {
    const nextRound = projectedMainRounds[round.roundIndex + 1];
    if (!nextRound) return [];
    return round.matchups.map((matchup, gameIndex) => {
      const projectedWinner = Math.min(matchup.homeSeed, matchup.awaySeed);
      const targetIndex = Math.max(0, nextRound.matchups.findIndex((next) => next.homeSeed === projectedWinner || next.awaySeed === projectedWinner));
      return {
        id: `main-winner-r${round.roundIndex + 1}-g${gameIndex + 1}`,
        sourceGameId: `main-r${round.roundIndex + 1}-g${gameIndex + 1}`,
        targetGameId: `main-r${round.roundIndex + 2}-g${targetIndex + 1}`,
        outcome: "winner" as const,
        pending: settings.reseedMode !== "fixed",
        label: settings.reseedMode === "fixed" ? "Winner advances" : "Projected reseed path",
      };
    });
  });
  const consolationConnections: BracketConnection[] = consolationProjection?.rounds.flatMap((round) => round.games.flatMap((game) =>
    game.entrants.filter((entrant) => entrant.kind === "result").map((entrant) => ({
      id: `${entrant.gameId}-${entrant.outcome}-${game.id}`,
      sourceGameId: entrant.gameId,
      targetGameId: game.id,
      outcome: entrant.outcome,
      label: entrant.label,
    })))) ?? [];
  const transferRoutes = consolationConnections.filter((connection) => connection.sourceGameId.startsWith("main-"));
  const connectedTransferRoutes: BracketConnection[] = transferRoutes.flatMap((connection, index) => {
    const transferId = `placement-transfer-${index + 1}`;
    return [
      { ...connection, id: `${connection.id}-exit`, targetGameId: transferId },
      { ...connection, id: `${connection.id}-entry`, sourceGameId: transferId },
    ];
  });
  const bracketConnections = [
    ...mainConnections,
    ...connectedTransferRoutes,
    ...consolationConnections.filter((connection) => !connection.sourceGameId.startsWith("main-")),
  ];
  const PlayoffGameBrand = ({ roundIndex, gameIndex }: { roundIndex: number; gameIndex: number }) => {
    const gameId = `main-r${roundIndex + 1}-g${gameIndex + 1}`;
    const logoUrl = settings.gameLogoUrls?.[gameId] || settings.roundLogoUrls?.[roundIndex] || settings.logoUrl;
    if (!logoUrl) return null;
    return <span className="bracket-game-brand" title={`${rounds[roundIndex] ?? `Round ${roundIndex + 1}`} game ${gameIndex + 1} logo`}><EntityLogo color={settings.color} logoUrl={logoUrl} monogram={`G${gameIndex + 1}`} size={34} imagePresentation="bare" /></span>;
  };
  const simulatedMainGames = (schedule.playoffGames ?? []).filter((game) => game.bracket === "main");
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
  const playoffGameById = new Map(simulatedMainGames.map((game) => [game.id, game]));
  const orderedRoundMatchups = (round: typeof projectedMainRounds[number]) => round.matchups
    .map((matchup, gameIndex) => ({ matchup, gameIndex }))
    .sort((left, right) => {
      if (placement !== "division-halves" || round.roundIndex === projectedMainRounds.length - 1) return left.gameIndex - right.gameIndex;
      const leftDivision = seed(left.matchup.homeSeed)?.divisionId;
      const rightDivision = seed(right.matchup.homeSeed)?.divisionId;
      return schedule.setup.divisions.findIndex((division) => division.id === leftDivision)
        - schedule.setup.divisions.findIndex((division) => division.id === rightDivision);
    });
  const MainPlayoffGame = ({ roundIndex, gameIndex, homeSeed, awaySeed, bracketSide }: { roundIndex: number; gameIndex: number; homeSeed: number; awaySeed: number; bracketSide?: "A" | "B" }) => {
    const gameId = `main-r${roundIndex + 1}-g${gameIndex + 1}`;
    const recorded = playoffGameById.get(gameId);
    const homeSeedEntry = seed(homeSeed);
    const awaySeedEntry = seed(awaySeed);
    const homeTeamId = recorded?.homeTeamId ?? homeSeedEntry?.teamId;
    const awayTeamId = recorded?.awayTeamId ?? awaySeedEntry?.teamId;
    const homeTeam = homeTeamId ? teamById.get(homeTeamId) : undefined;
    const awayTeam = awayTeamId ? teamById.get(awayTeamId) : undefined;
    const played = recorded?.homeScore != null && recorded.awayScore != null;
    const homeWon = Boolean(played && recorded!.homeScore! > recorded!.awayScore!);
    const awayWon = Boolean(played && recorded!.awayScore! > recorded!.homeScore!);
    const route = transferRoutes.find((connection) => connection.sourceGameId === gameId);
    const side = bracketSide || seed(homeSeed)?.bracketSide;
    const sideCopy = placement === "division-halves" && side && roundIndex < projectedMainRounds.length - 1 ? `${sideName(side)} tournament` : undefined;
    const defaultName = projectedMainRounds[roundIndex]?.matchups.length > 1
      ? `${rounds[roundIndex] || `Round ${roundIndex + 1}`} · Game ${gameIndex + 1}`
      : rounds[roundIndex] || `Round ${roundIndex + 1}`;
    const gameName = gameDisplayName(gameId, defaultName);
    const saveScore = (awayScore: number | undefined, homeScore: number | undefined) => {
      if (!homeTeamId || !awayTeamId) return;
      onUpdatePlayoffGame({
        ...(recorded ?? {}),
        id: gameId,
        week: schedule.setup.weeks + roundIndex + 1,
        gameNumber: gameIndex + 1,
        homeTeamId,
        awayTeamId,
        matchupType: homeTeam?.divisionId === awayTeam?.divisionId ? "division" : "cross-division",
        seriesGame: 1,
        seriesLength: 1,
        dateLabel: getWeekDateLabel(schedule.setup.seasonYear, schedule.setup.weeks + roundIndex + 1),
        stadium: homeTeam?.stadium || "Venue to be determined",
        homeScore,
        awayScore,
        round: rounds[roundIndex] || `Round ${roundIndex + 1}`,
        roundIndex,
        name: settings.gameNames?.[gameId],
        logoUrl: settings.gameLogoUrls?.[gameId],
        roundLogoUrl: settings.roundLogoUrls?.[roundIndex],
        bracket: "main",
      });
    };
    return <article className={`main-playoff-game ${played ? "is-final" : "is-projected"}`} data-bracket-game-id={gameId}>
      <header><PlayoffGameBrand roundIndex={roundIndex} gameIndex={gameIndex} /><span><strong>{gameName}</strong><small>{sideCopy || (played ? "Final result" : settings.reseedMode === "fixed" ? "Fixed bracket path" : "Projected path")}</small></span><em>{played ? "FINAL" : "PROJECTED"}</em></header>
      <div className="main-playoff-game-teams">{recorded ? <><SimulatedPlayoffTeam teamId={recorded.awayTeamId} score={recorded.awayScore} winner={awayWon} /><SimulatedPlayoffTeam teamId={recorded.homeTeamId} score={recorded.homeScore} winner={homeWon} /></> : <><Slot number={homeSeed} host /><Slot number={awaySeed} /></>}</div>
      {!simulationMode && homeTeam && awayTeam && <InlinePlayoffScoreEditor awayName={teamDisplayName(awayTeam, showCity)} homeName={teamDisplayName(homeTeam, showCity)} awayScore={recorded?.awayScore} homeScore={recorded?.homeScore} onSave={(awayScore, homeScore) => saveScore(awayScore, homeScore)} onClear={() => saveScore(undefined, undefined)} />}
      <footer><span className="advance-route"><b>W</b>Advances toward championship</span>{route && <span className="placement-route"><b>L</b>Moves to placement</span>}</footer>
    </article>;
  };
  const EliminationTransferRail = () => {
    if (!transferRoutes.length) return null;
    const consolationById = new Map(consolationGameBrandingSlots.map((game) => [game.id, game]));
    return <section className="elimination-transfer-rail" aria-labelledby="placement-transfer-title">
      <header><span><ArrowDownRight /><strong id="placement-transfer-title">Moves to placement</strong></span><small>Championship losses continue below without re-entering title contention.</small></header>
      <div>{transferRoutes.map((route, index) => {
        const destination = consolationById.get(route.targetGameId);
        return <div key={route.id} data-bracket-game-id={`placement-transfer-${index + 1}`}><b>L</b><span><strong>{route.label}</strong><small>{destination ? `Continues in ${destination.label}` : "Destination updates after the result"}</small></span><ArrowDownRight /></div>;
      })}</div>
    </section>;
  };
  return <div className="workspace-stack playoff-workspace" style={{ "--playoff-color": settings.color } as React.CSSProperties}>
    <div className={`playoff-topline playoff-theme-${settings.theme}`}><div>{settings.logoUrl && <EntityLogo color={settings.color} logoUrl={settings.logoUrl} monogram="PO" imagePresentation="bare" />}<span><strong>{settings.name}</strong><small>{fieldSize} teams · {formatLabel} · Higher seed hosts before title · {championshipVenueCopy}</small></span></div><div className="playoff-field-actions">{simulationMode ? <span className="projected-pill simulation"><Gamepad2 />SIMULATED BRACKET</span> : <><span className={`projected-pill ${settings.fieldStatus === "locked" ? "locked" : ""}`}>{settings.fieldStatus === "locked" ? "FIELD LOCKED" : "LIVE PROJECTION"}</span><button type="button" onClick={lockField}><LockKeyhole />{settings.fieldStatus === "locked" ? "Unlock field" : "Lock field"}</button></>}</div></div>
    <div className="playoff-policy"><span><strong>{playoffPlacementLabel(placement)}</strong><small>{placement === "division-halves" ? `${sideName("A")} and ${sideName("B")} run separate tournaments; their champions meet in the final` : placement === "division-leaders" ? "Division winners protected at the top" : "Top teams qualify regardless of division"}</small></span><span><strong>{byeCount || "No"} {byeCount === 1 ? "bye" : "byes"}</strong><small>{byeCount ? "Awarded to the top seeds" : "Every qualifier opens play"}</small></span><span><strong>{settings.reseedMode === "fixed" ? "Fixed bracket" : settings.reseedMode === "protected" ? "Protected reseed" : "Reseed each round"}</strong><small>{placement === "division-halves" && settings.reseedMode !== "fixed" ? "Reseeding stays inside each half until the final" : settings.seedDisplayMode === "reranked" ? "Showing bracket seeds" : "Showing standings finish"}</small></span></div>
    {!simulationMode && <><div className="playoff-customization-bar"><span><strong>Postseason presentation</strong><small>Choose placement format and personalize round names, game names, and logos.</small></span><CustomSelect label="Consolation format" value={settings.consolationMode} onChange={(value) => onUpdatePlayoffs({ consolationMode: value as LeagueSetupInput["playoffs"]["consolationMode"], thirdPlaceGame: value !== "off" })} options={consolationOptions} /><button type="button" aria-expanded={roundBrandingOpen} onClick={() => setRoundBrandingOpen((current) => !current)}><Pencil />Names & logos</button></div>{roundBrandingOpen && <div className="playoff-branding-panels">
      <section aria-label="Playoff round names and logos"><header><span><strong>Round defaults</strong><small>Rename each round and choose the logo used when a game has no override.</small></span></header><div className="playoff-round-branding">{rounds.map((round, roundIndex) => <div key={`round-${roundIndex}`}><label><span>Round {roundIndex + 1} name</span><input aria-label={`Round ${roundIndex + 1} name`} defaultValue={round} maxLength={40} onBlur={(event) => updateRoundName(roundIndex, event.target.value)} /></label><small>NFL Week {schedule.setup.weeks + roundIndex + 1}</small><IdentityColorPicker compact showColorControl={false} showAbbreviation={false} imagePresentation="bare" name={`${round || `Round ${roundIndex + 1}`} round`} abbreviation={(round || "R").slice(0, 3).toUpperCase()} color={settings.color} logoUrl={settings.roundLogoUrls?.[roundIndex]} onChange={(next) => updateRoundLogo(roundIndex, next.logoUrl)} /></div>)}</div></section>
      <section aria-label="Specific playoff game names and logos"><header><span><strong>Specific playoff games</strong><small>Rename any matchup and optionally override its round logo.</small></span><em>{mainGameBrandingSlots.length + consolationGameBrandingSlots.length} games</em></header><div className="playoff-game-branding-rounds">{rounds.map((round, roundIndex) => {
        const mainSlots = mainGameBrandingSlots.filter((slot) => slot.roundIndex === roundIndex);
        const placementSlots = consolationGameBrandingSlots.filter((game) => game.roundIndex === roundIndex);
        return <section key={`${roundIndex}-branding`}><header><strong>{round || `Round ${roundIndex + 1}`}</strong><small>NFL Week {schedule.setup.weeks + roundIndex + 1}</small></header><div>{mainSlots.map((slot) => { const fallback = mainGameBrandingLabel(slot); const label = gameDisplayName(slot.id, fallback); return <div key={slot.id}><label><span>Championship bracket</span><input aria-label={`${fallback} name`} defaultValue={label} maxLength={60} onBlur={(event) => updateGameName(slot.id, event.target.value)} /></label><IdentityColorPicker compact showColorControl={false} showAbbreviation={false} imagePresentation="bare" name={label} abbreviation={`G${slot.gameIndex + 1}`} color={settings.color} logoUrl={settings.gameLogoUrls?.[slot.id]} onChange={(next) => updateGameLogo(slot.id, next.logoUrl)} /></div>; })}{placementSlots.map((game) => { const label = gameDisplayName(game.id, game.label); return <div key={game.id}><label><span>Placement bracket</span><input aria-label={`${game.label} name`} defaultValue={label} maxLength={60} onBlur={(event) => updateGameName(game.id, event.target.value)} /></label><IdentityColorPicker compact showColorControl={false} showAbbreviation={false} imagePresentation="bare" name={label} abbreviation="CG" color={settings.color} logoUrl={settings.gameLogoUrls?.[game.id]} onChange={(next) => updateGameLogo(game.id, next.logoUrl)} /></div>; })}</div></section>;
      })}</div></section>
    </div>}</>}
    <div className="postseason-map-scroll" aria-label="Connected postseason bracket">
      <BracketConnectorLayer connections={bracketConnections} className={`postseason-map-canvas rounds-${rounds.length}`}>
        <section className="championship-picture" aria-labelledby="championship-picture-title">
          <header><span><Trophy /><span><small>TITLE BRACKET</small><strong id="championship-picture-title">Road to the championship</strong></span></span><em>{settings.fieldStatus === "locked" ? "Locked field" : "Live projection"}</em></header>
          <div className="championship-bracket-grid" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(270px, 1fr))` }}>
            {projectedMainRounds.map((round) => <section key={round.roundIndex}><RoundHeading index={round.roundIndex} /><div className="main-playoff-round-games">{orderedRoundMatchups(round).map(({ matchup, gameIndex }) => <MainPlayoffGame key={`${round.roundIndex}-${gameIndex}`} roundIndex={round.roundIndex} gameIndex={gameIndex} homeSeed={matchup.homeSeed} awaySeed={matchup.awaySeed} bracketSide={matchup.bracketSide} />)}{round.roundIndex === 0 && round.byeSeeds.length > 0 && <div className="playoff-bye-strip"><strong>{round.byeSeeds.length} BYE{round.byeSeeds.length === 1 ? "" : "S"}</strong><span>{round.byeSeeds.map((byeSeed) => <Slot key={byeSeed} number={byeSeed} />)}</span></div>}{round.roundIndex === projectedMainRounds.length - 1 && <div className={`championship-outcome playoff-theme-${settings.theme}`}><Trophy />{champion ? <><EntityLogo color={champion.color} logoUrl={champion.logoUrl} monogram={teamInitials(champion)} size={52} /><strong>{teamDisplayName(champion, showCity)}</strong><small>League Champion</small></> : <><strong>League Champion</strong><small>{championshipCopy}</small></>}</div>}</div></section>)}
          </div>
        </section>
        <EliminationTransferRail />
        <ConsolationBracket schedule={normalizedSchedule} onUpdateGame={simulationMode ? undefined : onUpdatePlayoffGame} />
      </BracketConnectorLayer>
    </div>
    <FinalPlacementTable schedule={normalizedSchedule} />
  </div>;
}

function PlatformSyncCard({
  schedule,
  canAccessPlatformSync,
  platformSyncLoading,
  onRefreshScores,
  onSaveConnection,
  onDisconnect,
}: {
  schedule: GeneratedSchedule;
  canAccessPlatformSync: boolean;
  platformSyncLoading: boolean;
  onRefreshScores: () => void;
  onSaveConnection: (syncMode: PlatformSyncMode, swid?: string, espnS2?: string) => void;
  onDisconnect: () => void;
}) {
  const connection = schedule.setup.platformConnection;
  const [syncMode, setSyncMode] = useState<PlatformSyncMode>(connection?.syncMode ?? "manual");
  const [swid, setSwid] = useState("");
  const [espnS2, setEspnS2] = useState("");
  useEffect(() => setSyncMode(connection?.syncMode ?? "manual"), [connection?.syncMode]);
  if (!connection) {
    return <div className="platform-sync-card"><div><Cloud /><span><strong>Platform Sync</strong><small>Connect ESPN or Sleeper during import to refresh scores after your platform schedule is updated.</small></span></div><Link href="/" className="button-secondary"><RefreshCw />Import league</Link></div>;
  }
  const providerLabel = connection.provider === "espn" ? "ESPN" : "Sleeper";
  const lastSync = connection.lastSyncAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(connection.lastSyncAt)) : "Not synced yet";
  return <div className="platform-sync-panel">
    <div className="platform-sync-card">
      <div><Cloud /><span><strong>{providerLabel} Platform Sync</strong><small>Generate here, update your fantasy platform, then sync scores back.</small></span></div>
      <button type="button" className="button-primary" disabled={platformSyncLoading} onClick={onRefreshScores}>{platformSyncLoading ? <LoaderCircle className="spin" /> : <RefreshCw />}Refresh scores</button>
    </div>
    <div className="platform-sync-details">
      <span><strong>League ID</strong><small>{connection.providerLeagueId}</small></span>
      <span><strong>Last synced</strong><small>{lastSync}</small></span>
      <span><strong>Status</strong><small>{connection.status}</small></span>
      <span><strong>History found</strong><small>{connection.availableHistoryYears?.join(", ") || "Scan after connecting"}</small></span>
    </div>
    <div className="platform-sync-mode">
      <CustomSelect label="Sync mode" value={syncMode} onChange={(value) => setSyncMode(value as PlatformSyncMode)} options={[
        { value: "manual", label: "Manual", description: "Only refresh when you click" },
      ]} />
      <button type="button" className="button-secondary visible" onClick={() => onSaveConnection("manual", swid, espnS2)}><Save />Save sync mode</button>
    </div>
    <div className="platform-sync-note"><ShieldCheck /><span>LeagueWeaver cannot update ESPN/Sleeper schedules for you. Refresh scores after your fantasy platform has matching results.</span><button type="button" onClick={onDisconnect}>Disconnect</button></div>
  </div>;
}

function ImportHistoryPanel({ events, loading, error, onRefresh, scheduleId }: {
  events: ImportHistoryEvent[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  scheduleId: string;
}) {
  return <section className="import-history-panel" aria-labelledby="import-history-title">
    <header>
      <span><History /><span><strong id="import-history-title">Import history</strong><small>Recent imports, syncs, and saved revisions for this season.</small></span></span>
      <button type="button" onClick={onRefresh} disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <RefreshCw />}Refresh history</button>
    </header>
    {error ? <div className="import-history-state error" role="alert"><span>{error}</span><button type="button" onClick={onRefresh}>Try again</button></div>
      : loading && events.length === 0 ? <div className="import-history-state" role="status"><LoaderCircle className="spin" />Loading history…</div>
        : events.length ? <ol className="import-history-list">{events.map((event) => <li key={event.id}>
          <span className={`import-history-provider ${event.provider}`}>{providerLabel(event.provider).slice(0, 2).toUpperCase()}</span>
          <span className="import-history-copy">
            <strong>{event.action}</strong>
            <small>{providerLabel(event.provider)} · {historyStatusLabel(event.status)} · {formatHistoryTime(event.createdAt)}{event.week ? ` · Week ${event.week}` : ""}{event.seasonYear ? ` · ${event.seasonYear}` : ""}</small>
            {event.message && <small>{event.message}</small>}
          </span>
          {event.revisionId ? <Link href={`/account?season=${encodeURIComponent(scheduleId)}`} className="import-history-link">View revisions</Link> : <span aria-hidden="true" />}
        </li>)}</ol>
          : <div className="import-history-state"><History /><span>No import history is attached to this saved season yet.</span></div>}
  </section>;
}

function SettingsView({ schedule, onOpenDraftRanking, onRegenerate, canAccessPlatformSync, platformSyncLoading, onRefreshPlatformScores, onSavePlatformConnection, onDisconnectPlatform, importHistory, importHistoryLoading, importHistoryError, onRefreshImportHistory }: {
  schedule: GeneratedSchedule;
  onOpenDraftRanking: () => void;
  onRegenerate: () => void;
  canAccessPlatformSync: boolean;
  platformSyncLoading: boolean;
  onRefreshPlatformScores: () => void;
  onSavePlatformConnection: (syncMode: PlatformSyncMode, swid?: string, espnS2?: string) => void;
  onDisconnectPlatform: () => void;
  importHistory: ImportHistoryEvent[];
  importHistoryLoading: boolean;
  importHistoryError: string | null;
  onRefreshImportHistory: () => void;
}) {
  const seeding = schedule.setup.priorSeason.entryMode === "manual" ? "Manual order" : schedule.setup.priorSeason.entryMode === "history" ? schedule.setup.priorSeason.source === "playoffs" ? "Last year’s playoff finish" : "Last year’s regular-season finish" : "Not used";
  const draftRankingPending = schedule.setup.weekOne.rankingSource === "draft-day" && getTeamsMissingDraftPlaces(schedule.setup).length > 0;
  return <div className="workspace-stack">
    <div className="settings-band"><div><Pencil /><span><strong>Schedule setup</strong><small>Changing league structure regenerates the complete matchup slate as a new revision.</small></span></div><button type="button" className="button-secondary" onClick={onRegenerate}><Pencil />Edit and regenerate</button></div>
    <PlatformSyncCard schedule={schedule} canAccessPlatformSync={canAccessPlatformSync} platformSyncLoading={platformSyncLoading} onRefreshScores={onRefreshPlatformScores} onSaveConnection={onSavePlatformConnection} onDisconnect={onDisconnectPlatform} />
    <ImportHistoryPanel events={importHistory} loading={importHistoryLoading} error={importHistoryError} onRefresh={onRefreshImportHistory} scheduleId={schedule.id} />
    <div className="settings-list">
      <div><span>League</span><strong>{schedule.setup.name}</strong></div>
      <div><span>Season format</span><strong>{schedule.setup.teams.length} teams · {schedule.setup.divisions.length} divisions · {schedule.setup.weeks} weeks</strong></div>
      <div><span>Seeding source</span><strong>{seeding}</strong></div>
      <div className="settings-action-row"><span>Week 1 ranking</span><span><strong>{schedule.setup.weekOne.rankingSource === "draft-day" ? draftRankingPending ? "Draft-day place · not set" : "Draft-day place · complete" : "Last season’s finish"}</strong>{draftRankingPending && <button type="button" onClick={onOpenDraftRanking}><FileSpreadsheet />Set draft ranking</button>}</span></div>
      <div><span>Revision</span><strong>Version {schedule.revision}</strong></div>
      <div><span>Generation seed</span><code>{schedule.seed}</code></div>
    </div>
  </div>;
}

function draftPlaceValues(schedule: GeneratedSchedule) {
  return Object.fromEntries(schedule.setup.teams.map((team) => [team.id, Number.isInteger(team.draftPlace) ? team.draftPlace : undefined]));
}

function draftRankingReminderDismissalKey(seasonId: string) {
  return `leagueweaver:v3:draft-ranking-reminder-dismissed:${seasonId}`;
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
  useEffect(() => {
    setDismissed(window.localStorage.getItem(draftRankingReminderDismissalKey(schedule.id)) === "true");
  }, [schedule.id]);
  useEffect(() => setValues(draftPlaceValues(schedule)), [schedule]);
  useEffect(() => {
    if (!openRequest) return;
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
    window.localStorage.setItem(draftRankingReminderDismissalKey(schedule.id), "true");
    setShowSettingsToken(true);
    if (tokenTimer.current) window.clearTimeout(tokenTimer.current);
    tokenTimer.current = window.setTimeout(() => setShowSettingsToken(false), 8000);
  };

  if (dismissed && !open) return showSettingsToken ? <div className="draft-rank-settings-token" role="status"><Settings /><span>Draft-day ranking is available in Settings if you want to add it later.</span><button type="button" onClick={onOpenSettings}>Open Settings</button></div> : null;

  return <>
    {!dismissed && <div className="draft-rank-reminder" role="status">
      <FileSpreadsheet />
      <span><strong>Draft-day ranking is waiting.</strong><small>Add every team’s draft place by {cutoffLabel}. Until then, Week 1 uses last season’s order; saving the order updates the opening ranks and Game of the Week.</small></span>
      <div className="draft-rank-reminder-actions"><button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>{open ? "Close editor" : "Set draft ranking"}</button><Tooltip label="Dismiss draft ranking reminder"><button type="button" className="draft-rank-reminder-close" aria-label="Dismiss draft ranking reminder" onClick={dismissReminder}><X /></button></Tooltip></div>
    </div>}
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
  const { openSignIn } = useAuthModal();
  const [saveNudgeDismissed, setSaveNudgeDismissed] = useState(true);
  const searchParams = useSearchParams();
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [seasonLoadState, setSeasonLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [seasonLoadError, setSeasonLoadError] = useState<string | null>(null);
  const [view, setView] = useState<ViewKey>(initialView);
  const [selectedTeamId, setSelectedTeamId] = useState(params.teamId ?? "");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [highlightedGame, setHighlightedGame] = useState<HighlightedGame>(null);
  const [draftRankingRequest, setDraftRankingRequest] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationSandbox | null>(null);
  const [savedSimulation, setSavedSimulation] = useState<SimulationSandbox | null>(null);
  const [simulationLoaded, setSimulationLoaded] = useState(false);
  const [simulationTrials, setSimulationTrials] = useState<MonteCarloTrialCount>(500);
  const [entitlements, setEntitlements] = useState<{ signedIn: boolean; plan: "free" | "pro"; features: string[]; email?: string; displayName?: string; avatarUrl?: string }>({ signedIn: false, plan: "free", features: [] });
  const [saveConflict, setSaveConflict] = useState<SeasonSaveConflict | null>(null);
  const [saveConflictLoading, setSaveConflictLoading] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreImportPending, setScoreImportPending] = useState(false);
  const [scoreDiscardConfirmOpen, setScoreDiscardConfirmOpen] = useState(false);
  const [platformSyncLoading, setPlatformSyncLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<"share" | "notify" | null>(null);
  // H1: irreversible actions (publish, save-run-back, regenerate) open this
  // confirm gate before running, so a reflexive click can't publish private data,
  // overwrite real scores, or wipe the slate.
  const [confirmAction, setConfirmAction] = useState<null | "share" | "commit" | "regenerate">(null);
  const [showRecap, setShowRecap] = useState(false);
  // Deep link from the account page (?recap=1) opens the recap straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("recap") !== "1") return;
    setShowRecap(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("recap");
    window.history.replaceState({}, "", url);
  }, []);
  const [cloudRetry, setCloudRetry] = useState<CloudRetryState | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistoryEvent[]>([]);
  const [importHistoryLoading, setImportHistoryLoading] = useState(false);
  const [importHistoryError, setImportHistoryError] = useState<string | null>(null);
  const cloudScheduleSnapshot = useRef<string | null>(null);
  const blockedCloudSnapshot = useRef<string | null>(null);
  const latestSchedule = useRef<GeneratedSchedule | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  const platformAutoRefreshKey = useRef<string | null>(null);
  const applyCloudSchedule = (savedSchedule: GeneratedSchedule, sourceSchedule: GeneratedSchedule) => {
    const synced = freezeCompletedRankHistory(normalizeSeason(savedSchedule));
    cloudScheduleSnapshot.current = JSON.stringify(synced);
    blockedCloudSnapshot.current = null;
    setCloudRetry(null);
    const latest = latestSchedule.current;
    if (latest && latest !== sourceSchedule) {
      const merged = normalizeSeason({ ...latest, id: synced.id, revision: synced.revision });
      latestSchedule.current = merged;
      setSchedule(merged);
    } else {
      latestSchedule.current = synced;
      setSchedule(synced);
    }
    // Once claimed into the account, drop the device-only copy so it stops
    // counting as unsaved guest work (and nudging) under its old local id.
    if (sourceSchedule.id !== synced.id) removeLocalSeason(sourceSchedule.id);
    const nextPath = window.location.pathname.replace(`/season/${sourceSchedule.id}`, `/season/${synced.id}`);
    window.history.replaceState(null, "", `${nextPath}${window.location.search}${window.location.hash}`);
    return synced;
  };
  const setCloudRetryState = (scheduleToSave: GeneratedSchedule, reason: string) => {
    setCloudRetry({ schedule: scheduleToSave, reason, retrying: false });
  };
  const openSaveConflict = (payload: CloudSaveResponse, scheduleToSave: GeneratedSchedule) => {
    if (payload.code !== "SEASON_EXISTS" || !payload.existingSeason) return false;
    const snapshot = JSON.stringify(scheduleToSave);
    blockedCloudSnapshot.current = snapshot;
    setSaveConflict({ existingSeason: payload.existingSeason, schedule: scheduleToSave, snapshot });
    return true;
  };
  const closeScoreModal = (finalize = false) => {
    if (scoreImportPending) {
      setScoreDiscardConfirmOpen(true);
      return;
    }
    if (finalize) onFinalizeScores();
    setScoreModalOpen(false);
    setScoreDiscardConfirmOpen(false);
  };
  const discardScoreSuggestions = () => {
    setScoreImportPending(false);
    setScoreDiscardConfirmOpen(false);
    setScoreModalOpen(false);
  };
  useEffect(() => {
    const local = loadSeasonById(params.id);
    if (local) {
      latestSchedule.current = local;
      cloudScheduleSnapshot.current = CLOUD_SCHEDULE_ID.test(local.id) ? JSON.stringify(local) : null;
      setSchedule(local);
      setSeasonLoadState("ready");
      setSeasonLoadError(null);
    } else if (params.id && CLOUD_SCHEDULE_ID.test(params.id)) {
      setSeasonLoadState("loading");
      setSeasonLoadError(null);
      fetch(`/api/seasons/${params.id}`).then(async (response) => {
        const payload = await response.json().catch(() => null) as { schedule?: GeneratedSchedule; error?: string } | null;
        if (!response.ok || !payload?.schedule) throw new Error(apiErrorMessage(response.status, payload?.error, "That saved season could not be opened."));
        const loaded = freezeCompletedRankHistory(normalizeSeason(payload.schedule));
        latestSchedule.current = loaded;
        cloudScheduleSnapshot.current = JSON.stringify(loaded);
        setSchedule(loaded);
        setSeasonLoadState("ready");
      }).catch((error) => {
        setSchedule(null);
        setSeasonLoadState("error");
        setSeasonLoadError(error instanceof Error ? error.message : "That saved season could not be opened.");
      });
    } else {
      setSeasonLoadState("ready");
      setSeasonLoadError(null);
    }
    fetch(`/api/entitlements${params.id ? `?scheduleId=${encodeURIComponent(params.id)}` : ""}`).then((response) => response.json()).then(setEntitlements).catch(() => undefined);
  }, [params.id]);
  // Surface the "save to an account" nudge for device-only schedules unless this
  // one was already dismissed. Cloud schedules are safe, so they never nudge.
  useEffect(() => {
    if (!schedule || CLOUD_SCHEDULE_ID.test(schedule.id)) { setSaveNudgeDismissed(true); return; }
    try {
      setSaveNudgeDismissed(window.localStorage.getItem(`leagueweaver:v3:save-nudge:${schedule.id}`) === "dismissed");
    } catch {
      setSaveNudgeDismissed(false);
    }
  }, [schedule?.id]);
  const dismissSaveNudge = () => {
    setSaveNudgeDismissed(true);
    if (schedule) {
      try { window.localStorage.setItem(`leagueweaver:v3:save-nudge:${schedule.id}`, "dismissed"); } catch { /* ignore quota */ }
    }
  };
  const loadImportHistory = async () => {
    if (!schedule || !CLOUD_SCHEDULE_ID.test(schedule.id)) {
      setImportHistory([]);
      setImportHistoryError(null);
      return;
    }
    setImportHistoryLoading(true);
    setImportHistoryError(null);
    try {
      const response = await fetch(`/api/platform/history?scheduleId=${encodeURIComponent(schedule.id)}`);
      const payload = await response.json().catch(() => ({})) as { events?: ImportHistoryEvent[]; error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, payload.error, "Import history could not be loaded."));
      setImportHistory(payload.events ?? []);
    } catch (caught) {
      setImportHistoryError(caught instanceof Error ? caught.message : "Import history could not be loaded.");
    } finally {
      setImportHistoryLoading(false);
    }
  };
  useEffect(() => {
    if (!schedule || !CLOUD_SCHEDULE_ID.test(schedule.id)) {
      setImportHistory([]);
      return;
    }
    void loadImportHistory();
  }, [schedule?.id]);
  useEffect(() => {
    const week = Number(searchParams.get("week"));
    if (Number.isInteger(week) && week >= 1 && week <= 17) setSelectedWeek(week);
    const requestedViewValue = searchParams.get("view");
    if (requestedViewValue === "scores") {
      setView("league-schedule");
      setScoreModalOpen(true);
    }
    if (requestedViewValue === "fairness") setView("league-schedule");
    const requestedView = (requestedViewValue === "schedule" || requestedViewValue === "scores" || requestedViewValue === "fairness" ? "league-schedule" : requestedViewValue) as ViewKey | null;
    if (requestedView && VIEW_ITEMS.some((item) => item.key === requestedView)) setView(requestedView);
    const gameId = decodeURIComponent(window.location.hash.slice(1));
    const medalRank = Number(searchParams.get("medal"));
    setHighlightedGame(gameId ? {
      id: gameId,
      medalRank: Number.isInteger(medalRank) && medalRank >= 1 && medalRank <= 3 ? medalRank : undefined,
      medalCategory: searchParams.get("medalCategory") || undefined,
    } : null);
  }, [searchParams]);
  useEffect(() => {
    if (!schedule || !selectedTeamId || schedule.setup.teams.some((team) => team.id === selectedTeamId)) return;
    setSelectedTeamId(schedule.setup.teams[0]?.id ?? "");
  }, [schedule, selectedTeamId]);
  // Focus trap, scroll lock, focus restore, and Escape are handled by <Modal>.
  // Escape routing between the score sheet and its nested discard prompt lives in
  // the modal's onClose handler below.
  useEffect(() => {
    if (!schedule) return;
    latestSchedule.current = schedule;
    saveSeason(schedule);
    const snapshot = JSON.stringify(schedule);
    if (!entitlements.signedIn || snapshot === cloudScheduleSnapshot.current || snapshot === blockedCloudSnapshot.current) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    const scheduleToSave = freezeCompletedRankHistory(schedule);
    autosaveTimer.current = window.setTimeout(async () => {
      autosaveTimer.current = null;
      try {
        const response = await fetch("/api/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: scheduleToSave }) });
        const payload = await response.json().catch(() => ({})) as CloudSaveResponse;
        if (!response.ok || !payload.schedule) {
          if (response.status === 401) setEntitlements((current) => ({ ...current, signedIn: false }));
          else if (openSaveConflict(payload, scheduleToSave)) return;
          else {
            const reason = apiErrorMessage(response.status, payload.error, "Cloud sync needs attention.");
            setCloudRetryState(scheduleToSave, reason);
            setNotice("Saved on this device. Cloud sync needs attention.");
          }
          return;
        }
        applyCloudSchedule(payload.schedule, schedule);
      } catch (caught) {
        setCloudRetryState(scheduleToSave, caught instanceof Error ? caught.message : "Cloud sync is temporarily unavailable.");
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
  const canAccessScorekeeping = true;
  const canAccessPlatformSync = entitlements.plan === "pro" || entitlements.features.includes("platform_sync");
  const activeSchedule = useMemo(() => schedule && simulation ? materializeSimulationSchedule(simulation) : schedule, [schedule, simulation]);
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
  useEffect(() => {
    const connection = schedule?.setup.platformConnection;
    if (!connection || connection.syncMode === "manual" || !canAccessPlatformSync || platformSyncLoading || simulation) return;
    const key = `${schedule.id}:${connection.provider}:${connection.providerLeagueId}:${connection.syncMode}:${selectedWeek}`;
    if (platformAutoRefreshKey.current === key) return;
    platformAutoRefreshKey.current = key;
    void refreshPlatformScores();
  }, [schedule?.id, schedule?.setup.platformConnection, selectedWeek, canAccessPlatformSync, platformSyncLoading, simulation]);
  if (!schedule || !activeSchedule) {
    if (seasonLoadState === "loading") return <div className="empty-season" role="status"><BrandLockup /><LoaderCircle className="spin" /><h1>Loading season…</h1><p>Opening the latest saved schedule and checking your access.</p></div>;
    if (seasonLoadState === "error") return <div className="empty-season" role="alert"><BrandLockup /><Cloud /><h1>Season could not open.</h1><p>{seasonLoadError || "The saved season was not available. Your local work is still safe on this device if it was created here."}</p><Link href="/account" className="button-primary">Open account</Link><Link href="/" className="button-secondary">Open schedule builder</Link></div>;
    return <div className="empty-season"><BrandLockup /><CalendarDays /><h1>No generated season yet.</h1><p>Build your league first, then your complete schedule will appear here.</p><Link href="/" className="button-primary">Open schedule builder</Link></div>;
  }
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
  const applyImportedScores = (rows: ImportedScoreRow[]) => {
    if (simulation || rows.length === 0) return;
    setSchedule((current) => {
      if (!current) return current;
      const updated = rows.reduce((next, row) => updateGameScore(next, row.gameId, row.homeScore, row.awayScore), current);
      return freezeCompletedRankHistory(updated);
    });
    setNotice(`${rows.length} reviewed ${rows.length === 1 ? "matchup" : "matchups"} added to Week ${selectedWeek}.`);
    window.setTimeout(() => setNotice(null), 4200);
  };
  const updatePlatformConnection = (patch: Partial<PlatformConnection>) => setSchedule((current) => {
    if (!current?.setup.platformConnection) return current;
    return { ...current, setup: { ...current.setup, platformConnection: { ...current.setup.platformConnection, ...patch } } };
  });
  async function refreshPlatformScores() {
    if (!schedule?.setup.platformConnection || simulation) return;
    setPlatformSyncLoading(true);
    try {
      const response = await fetch("/api/platform/sync/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule, week: selectedWeek }),
      });
      const result = await response.json().catch(() => ({})) as { rows?: Array<ImportedScoreRow & { confidence?: "high" | "review" }>; unmatched?: unknown[]; warnings?: string[]; syncedAt?: string; error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, result.error, "Scores could not be refreshed."));
      const highConfidence = (result.rows ?? []).filter((row) => row.confidence !== "review");
      if (highConfidence.length > 0) {
        setSchedule((current) => {
          if (!current) return current;
          const updated = highConfidence.reduce((next, row) => updateGameScore(next, row.gameId, row.homeScore, row.awayScore), current);
          return freezeCompletedRankHistory({
            ...updated,
            setup: {
              ...updated.setup,
              platformConnection: updated.setup.platformConnection ? {
                ...updated.setup.platformConnection,
                lastSyncAt: result.syncedAt,
                status: result.warnings?.length ? "warning" : "ready",
                warnings: result.warnings ?? [],
              } : undefined,
            },
          });
        });
      } else {
        updatePlatformConnection({ lastSyncAt: result.syncedAt, status: result.warnings?.length ? "warning" : "ready", warnings: result.warnings ?? [] });
      }
      const reviewCount = (result.rows ?? []).length - highConfidence.length;
      void loadImportHistory();
      setNotice(reviewCount > 0
        ? `Refreshed ${highConfidence.length} scores. ${reviewCount} matchups need review before applying.`
        : highConfidence.length > 0
          ? `Refreshed ${highConfidence.length} platform scores.`
          : "No platform scores were ready yet. Try again after the fantasy platform has matching results.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Scores could not be refreshed.";
      updatePlatformConnection({ status: "failed", warnings: [message] });
      setNotice(message);
    } finally {
      setPlatformSyncLoading(false);
      window.setTimeout(() => setNotice(null), 5200);
    }
  }
  const savePlatformConnection = async (syncMode: PlatformSyncMode, swid?: string, espnS2?: string) => {
    if (!schedule?.setup.platformConnection) return;
    const connection = schedule.setup.platformConnection;
    updatePlatformConnection({ syncMode });
    if (!entitlements.signedIn || !CLOUD_SCHEDULE_ID.test(schedule.id)) {
      setNotice("Save this season to your account before storing platform permissions.");
      window.setTimeout(() => setNotice(null), 5200);
      return;
    }
    setPlatformSyncLoading(true);
    try {
      const response = await fetch("/api/platform/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: schedule.id, provider: connection.provider, providerLeagueId: connection.providerLeagueId, seasonYear: connection.seasonYear, syncMode, swid, espnS2 }),
      });
      const result = await response.json().catch(() => ({})) as { authType?: PlatformConnection["authType"]; error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, result.error, "Platform connection could not be saved."));
      updatePlatformConnection({ syncMode, authType: result.authType ?? connection.authType, status: "ready" });
      setNotice("Platform connection saved.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Platform connection could not be saved.");
    } finally {
      setPlatformSyncLoading(false);
      window.setTimeout(() => setNotice(null), 5200);
    }
  };
  const disconnectPlatform = async () => {
    if (!schedule?.setup.platformConnection) return;
    const connection = schedule.setup.platformConnection;
    setSchedule((current) => current ? { ...current, setup: { ...current.setup, platformConnection: undefined } } : current);
    if (entitlements.signedIn && CLOUD_SCHEDULE_ID.test(schedule.id)) {
      await fetch("/api/platform/connections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: schedule.id, provider: connection.provider }) }).catch(() => undefined);
    }
    setNotice("Platform connection disconnected. Your generated schedule and scores stayed in place.");
    window.setTimeout(() => setNotice(null), 5200);
  };
  const onUpdatePlayoffs = (patch: Partial<LeagueSetupInput["playoffs"]>) => setSchedule((current) => current ? { ...current, setup: { ...current.setup, playoffs: { ...current.setup.playoffs, ...patch } } } : current);
  const onUpdatePlayoffGame = (game: PlayoffGame) => setSchedule((current) => {
    if (!current) return current;
    const existing = (current.playoffGames ?? []).filter((item) => {
      if (item.id === game.id) return true;
      if (game.bracket === "main") {
        if (item.bracket === "main" && item.roundIndex > game.roundIndex) return false;
        if (item.bracket === "consolation" && item.roundIndex >= game.roundIndex) return false;
      }
      if (game.bracket === "consolation" && item.bracket === "consolation" && item.roundIndex > game.roundIndex) return false;
      return true;
    });
    const playoffGames = existing.some((item) => item.id === game.id)
      ? existing.map((item) => item.id === game.id ? game : item)
      : [...existing, game];
    return { ...current, playoffGames };
  });
  const onUpdateTiebreakers = (tiebreakers: TiebreakerSettings) => setSchedule((current) => current ? normalizeSeason({ ...current, rankHistory: undefined, setup: { ...current.setup, tiebreakers } }) : current);
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
  const resolveSaveConflict = async (saveMode: "overwrite" | "copy") => {
    if (!saveConflict) return;
    setSaveConflictLoading(true);
    const scheduleToSave = freezeCompletedRankHistory(latestSchedule.current ?? saveConflict.schedule);
    try {
      const response = await fetch("/api/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule: scheduleToSave,
          saveMode,
          existingScheduleId: saveConflict.existingSeason.id,
        }),
      });
      const payload = await response.json().catch(() => ({})) as CloudSaveResponse;
      if (!response.ok || !payload.schedule) {
        setNotice(apiErrorMessage(response.status, payload.error, "The cloud season could not be updated."));
        return;
      }
      applyCloudSchedule(payload.schedule, scheduleToSave);
      setSaveConflict(null);
      setNotice(saveMode === "copy" ? `${payload.title ?? "Season copy"} created.` : "Existing season updated. The prior version is still in Revisions.");
      void loadImportHistory();
      window.setTimeout(() => setNotice(null), 5200);
    } catch (caught) {
      setCloudRetryState(scheduleToSave, caught instanceof Error ? caught.message : "Cloud sync is temporarily unavailable.");
      setNotice("Saved on this device. Cloud sync is temporarily unavailable.");
    } finally {
      setSaveConflictLoading(false);
    }
  };
  const dismissSaveConflict = () => {
    setSaveConflict(null);
    setNotice("Cloud autosave is paused for this version. You can keep working and choose what to do after the next change.");
    window.setTimeout(() => setNotice(null), 5200);
  };
  const retryCloudSave = async () => {
    if (!cloudRetry) return;
    const scheduleToSave = freezeCompletedRankHistory(latestSchedule.current ?? cloudRetry.schedule);
    setCloudRetry({ ...cloudRetry, schedule: scheduleToSave, retrying: true });
    try {
      const response = await fetch("/api/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: scheduleToSave }) });
      const payload = await response.json().catch(() => ({})) as CloudSaveResponse;
      if (!response.ok || !payload.schedule) {
        if (response.status === 401) {
          setEntitlements((current) => ({ ...current, signedIn: false }));
          setCloudRetry(null);
          setNotice("Saved on this device. Sign in again when you want cloud revisions.");
          return;
        }
        if (openSaveConflict(payload, scheduleToSave)) {
          setCloudRetry(null);
          return;
        }
        throw new Error(apiErrorMessage(response.status, payload.error, "Cloud sync needs attention."));
      }
      applyCloudSchedule(payload.schedule, scheduleToSave);
      setNotice(`Cloud revision ${payload.schedule.revision} saved.`);
      void loadImportHistory();
      window.setTimeout(() => setNotice(null), 5200);
    } catch (caught) {
      setCloudRetry({
        schedule: scheduleToSave,
        reason: caught instanceof Error ? caught.message : "Cloud sync is temporarily unavailable.",
        retrying: false,
      });
    }
  };
  const save = async () => {
    const frozenSchedule = freezeCompletedRankHistory(schedule);
    saveSeason(frozenSchedule);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    try {
      const response = await fetch("/api/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: frozenSchedule }) });
      const payload = await response.json().catch(() => ({})) as CloudSaveResponse;
      if (response.status === 401) {
        setNotice("Saved on this device. Sign in when you want cloud revisions and resume-anywhere access.");
        return null;
      } else if (!response.ok || !payload.schedule) {
        if (openSaveConflict(payload, frozenSchedule)) return null;
        const reason = apiErrorMessage(response.status, payload.error, "The cloud copy needs attention.");
        setCloudRetryState(frozenSchedule, reason);
        setNotice("Saved on this device, but the cloud copy needs attention.");
        return null;
      } else {
        const synced = applyCloudSchedule(payload.schedule, frozenSchedule);
        setEntitlements((current) => ({ ...current, signedIn: true }));
        setNotice(`Cloud revision ${payload.schedule.revision} saved.`);
        void loadImportHistory();
        return synced;
      }
    } catch (caught) {
      setCloudRetryState(frozenSchedule, caught instanceof Error ? caught.message : "Cloud save is temporarily unavailable.");
      setNotice("Saved on this device. Cloud save is temporarily unavailable.");
      return null;
    } finally {
      window.setTimeout(() => setNotice(null), 4200);
    }
  };
  const share = async () => {
    if (actionBusy) return;
    setActionBusy("share");
    let cloudSchedule = schedule;
    try {
      if (!CLOUD_SCHEDULE_ID.test(schedule.id)) {
        const saved = await save();
        if (!saved) return;
        cloudSchedule = saved;
      }
      const response = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: cloudSchedule.id }) });
      const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !payload.url) return setNotice(apiErrorMessage(response.status, payload.error, "This schedule could not be published."));
      try { await navigator.clipboard.writeText(payload.url); setNotice("Public schedule link copied."); }
      catch { setNotice(`Public schedule ready: ${payload.url}`); }
      window.setTimeout(() => setNotice(null), 5200);
    } finally {
      setActionBusy(null);
    }
  };
  const sendNotification = async () => {
    if (actionBusy) return;
    if (!CLOUD_SCHEDULE_ID.test(schedule.id)) return setNotice("This season needs to finish cloud syncing before sending an update.");
    if (typeof window !== "undefined" && !window.confirm("Send a schedule update email to everyone subscribed to this league?")) return;
    setActionBusy("notify");
    try {
      const response = await fetch("/api/notifications/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: schedule.id }) });
      const payload = await response.json().catch(() => ({})) as { sent?: number; message?: string; error?: string };
      setNotice(response.ok ? payload.message || `Update sent to ${payload.sent ?? 0} subscriber${payload.sent === 1 ? "" : "s"}.` : apiErrorMessage(response.status, payload.error, "The update could not be sent."));
      window.setTimeout(() => setNotice(null), 5200);
    } finally {
      setActionBusy(null);
    }
  };
  const selectView = (item: typeof VIEW_ITEMS[number]) => {
    setScoreModalOpen(false);
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
  const canAccessPlayoffs = false;
  const openScoreEntry = (weekNumber: number) => {
    setSelectedWeek(Math.min(weekNumber, schedule.setup.weeks));
    setScoreModalOpen(true);
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
  const scoreBarTeamById = new Map(activeSchedule.setup.teams.map((team) => [team.id, team]));
  const scoreBarRankByTeam = new Map((getEnteringWeekRankSnapshot(activeSchedule, selectedWeek)?.rows ?? []).map((row) => [row.teamId, row.rank]));
  const scoreBarDivisionById = new Map(activeSchedule.setup.divisions.map((division) => [division.id, division]));
  const scoreBarWeek = activeSchedule.weeks.find((item) => item.weekNumber === selectedWeek) ?? activeSchedule.weeks[0];
  return <main className={`workspace-page ${simulation ? "simulation-mode" : ""} ${scoreBarWeek ? "has-scorebar" : ""}`} style={{ "--brand": schedule.setup.color, "--brand-on": readableTextColor(schedule.setup.color) } as CSSProperties}>
    {scoreModalOpen && canAccessScorekeeping && <Modal
      className="score-entry-modal"
      backdropClassName="score-entry-modal-backdrop"
      labelledBy="score-entry-modal-title"
      onClose={() => { if (scoreDiscardConfirmOpen) setScoreDiscardConfirmOpen(false); else closeScoreModal(); }}
    >
        <header>
          <span className="score-entry-modal-mark"><LayoutList /></span>
          <span><small>LEAGUE SCHEDULE</small><h2 id="score-entry-modal-title">Enter Week {selectedWeek} scores</h2></span>
          <button type="button" aria-label="Close score entry" onClick={() => closeScoreModal()}><X /></button>
        </header>
        <div className="score-entry-modal-body"><ScoresView schedule={activeSchedule} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} onScore={onScore} onFinalizeScores={onFinalizeScores} simulationActive={Boolean(simulation)} simulationResults={simulationResultByGame} /></div>
        {scoreDiscardConfirmOpen && <div className="score-entry-discard-warning" role="alertdialog" aria-modal="true" aria-labelledby="score-discard-title" aria-describedby="score-discard-desc"><span><strong id="score-discard-title">Discard imported score suggestions?</strong><small id="score-discard-desc">Apply the reviewed scores first, or discard the suggestions and close this panel.</small></span><button type="button" autoFocus onClick={() => setScoreDiscardConfirmOpen(false)}>Keep reviewing</button><button type="button" onClick={discardScoreSuggestions}>Discard</button></div>}
        <footer><span><ShieldCheck /><small>Scores save automatically as you enter them.</small></span><button type="button" className="button-primary" onClick={() => closeScoreModal(true)}>Done</button></footer>
    </Modal>}
    {showRecap && <GenerationReveal schedule={schedule} mode="replay" onComplete={() => setShowRecap(false)} />}
    <header className="workspace-topbar"><BrandLockup /><div className="workspace-top-actions"><Tooltip label="Send schedule update"><button type="button" aria-label="Send schedule update" disabled={actionBusy !== null} onClick={sendNotification}>{actionBusy === "notify" ? <LoaderCircle className="spin" /> : <Bell />}</button></Tooltip><AccountIdentity identity={entitlements} plan={entitlements.plan} /></div></header>
    {scoreBarWeek && <WeekScoreBar
      week={scoreBarWeek}
      weekCount={activeSchedule.weeks.length}
      seasonYear={activeSchedule.setup.seasonYear}
      getTeam={(id) => scoreBarTeamById.get(id)}
      getDivision={(id) => scoreBarDivisionById.get(id)}
      getRank={(id) => scoreBarRankByTeam.get(id)}
      displayCityNames={activeSchedule.setup.display?.cityNames !== false}
      onSelectWeek={setSelectedWeek}
      onSelectGame={(gameId) => { openLeagueScheduleWeek(scoreBarWeek.weekNumber); setHighlightedGame({ id: gameId }); }}
    />}
    <div className="workspace-shell">
      <aside className="workspace-rail"><nav aria-label="Season workspace">{VIEW_ITEMS.map((item) => { const Icon = item.icon; return <button type="button" key={item.key} aria-label={item.label} title={item.label} className={view === item.key ? "active" : ""} onClick={() => selectView(item)}><Icon /><span>{item.label}</span></button>; })}</nav><div className="rail-bottom"><WorkspaceSwitcher current={{ id: schedule.id, name: schedule.setup.name, seasonYear: schedule.setup.seasonYear, color: schedule.setup.color, logoUrl: schedule.setup.logoUrl, initials: schedule.setup.initials }} signedIn={Boolean(entitlements.signedIn)} /></div></aside>
      <section className={`workspace-main ${selectedTeamColor ? "team-workspace-branded" : ""}`} style={workspaceMainStyle}>
        <div className="workspace-toolbar"><div><span className="workspace-breadcrumb">{schedule.setup.abbreviation} / {schedule.setup.seasonYear}</span><h1>{currentTitle}</h1></div><div className="toolbar-actions"><button type="button" title="Replay the season recap" onClick={() => setShowRecap(true)}><Sparkles />Recap</button><button type="button" title={simulation ? "Export simulated CSV" : "Export CSV"} onClick={() => downloadCsv(activeSchedule)}><Download />CSV</button><button type="button" title={simulation ? "Print simulated ESPN entry sheet" : "Print ESPN entry sheet"} onClick={() => downloadSchedulePdf(activeSchedule)}><FileDown />ESPN PDF</button><button type="button" title={simulation ? "Share the real schedule" : "Share schedule"} disabled={actionBusy !== null} onClick={() => setConfirmAction("share")}>{actionBusy === "share" ? <LoaderCircle className="spin" /> : <Share2 />}Share</button></div></div>
        <div className="workspace-notice" role="status" aria-live="polite">{notice && <><Cloud />{notice}</>}</div>
        {!entitlements.signedIn && !CLOUD_SCHEDULE_ID.test(schedule.id) && !saveNudgeDismissed && <section className="cloud-retry-banner save-nudge-banner" role="status" aria-label="Save this schedule to an account">
          <ShieldCheck />
          <span><strong>This schedule is saved on this device only.</strong><small>Create a free account so you never lose it and can open it on any device.</small></span>
          <button type="button" onClick={() => openSignIn("signup")}><LogIn />Create free account</button>
          <button type="button" className="save-nudge-dismiss" aria-label="Dismiss save reminder" onClick={dismissSaveNudge}><X /></button>
        </section>}
        {cloudRetry && <section className="cloud-retry-banner" role="status" aria-label="Cloud autosave needs attention">
          <Cloud />
          <span><strong>Saved on this device.</strong><small>{cloudRetry.reason}</small></span>
          <button type="button" onClick={retryCloudSave} disabled={cloudRetry.retrying}>{cloudRetry.retrying ? <LoaderCircle className="spin" /> : <RefreshCw />}Retry cloud save</button>
        </section>}
        {saveConflict && <section className="workspace-conflict-notice" aria-labelledby="season-save-conflict-title">
          <span className="season-save-conflict-mark"><Cloud /></span>
          <div>
            <small>SAVED SEASON FOUND</small>
            <h2 id="season-save-conflict-title">Update this season or make a copy?</h2>
            <p><strong>{saveConflict.existingSeason.title}</strong> · {seasonTimeframeLabel(saveConflict.schedule.setup.seasonYear, saveConflict.schedule.setup.weeks)}</p>
          </div>
          <div className="workspace-conflict-actions">
            <button type="button" className="button-secondary" onClick={dismissSaveConflict} disabled={saveConflictLoading} aria-label="Dismiss saved season choice"><X />Later</button>
            <button type="button" className="button-secondary" onClick={() => resolveSaveConflict("copy")} disabled={saveConflictLoading}><Copy />Create copy</button>
            <button type="button" className="button-primary" onClick={() => resolveSaveConflict("overwrite")} disabled={saveConflictLoading}><RefreshCw />Overwrite</button>
          </div>
        </section>}
        {simulation && <div className="simulation-mode-banner" role="status">
          <Gamepad2 />
          <span><strong>You’re in the Simulator</strong><small>Every score, rank, statistic, GOTW, odds, and playoff result shown is hypothetical until you save this run.</small></span>
          <em>{Object.values(simulation.results).filter((result) => result.source !== "recorded").length} simulated</em>
          <button type="button" onClick={() => { setView("simulator"); router.push(`/season/${schedule.id}?view=simulator`); }}>Open simulator</button>
          <button type="button" onClick={discardSimulation}>Discard</button>
          <button type="button" className="save-simulation" onClick={() => setConfirmAction("commit")}><Save />Save run back</button>
        </div>}
        <DraftRankingReminder schedule={schedule} onSave={onSaveDraftPlaces} openRequest={draftRankingRequest} onOpenSettings={openDraftRankingSettings} />
        <div className="workspace-content">
          {view === "league-schedule" && <ScheduleView schedule={activeSchedule} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} canAccessPlayoffs={canAccessPlayoffs} onOpenScores={openScoreEntry} highlightedGame={highlightedGame} simulationResults={simulationResultByGame} simulationProbabilities={simulationProbabilityByGame} />}
          {view === "team-schedule" && <TeamScheduleView schedule={activeSchedule} teamId={selectedTeamId} onSelectTeam={selectTeamSchedule} onSelectWeek={openLeagueScheduleWeek} simulationResults={simulationResultByGame} />}
          {view === "gotw" && <GotwWorkspace schedule={activeSchedule} simulationResults={simulationResultByGame} simulationProbabilities={simulationProbabilityByGame} />}
          {view === "matchup-ratings" && <MatchupRatingsView schedule={activeSchedule} />}
          {view === "standings" && <StandingsView schedule={activeSchedule} onUpdateTiebreakers={simulation ? undefined : onUpdateTiebreakers} readOnly={Boolean(simulation)} />}
          {view === "playoffs" && <PlayoffsView schedule={activeSchedule} onUpdatePlayoffs={simulation ? () => undefined : onUpdatePlayoffs} onUpdatePlayoffGame={simulation ? () => undefined : onUpdatePlayoffGame} highlightedGame={highlightedGame} simulationMode={Boolean(simulation)} />}
          {view === "simulator" && !simulation && simulationLoaded && <SimulatorLaunch hasSavedRun={Boolean(savedSimulation)} onPlay={playSimulation} onStartFromReal={startSimulationFromReal} />}
          {view === "simulator" && simulation && <SimulatorWorkspace
            schedule={activeSchedule}
            resultByGame={simulationResultByGame}
            probabilityByGame={simulationProbabilityByGame}
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
            onSave={() => setConfirmAction("commit")}
            onDiscard={discardSimulation}
            onOpenSchedule={openLeagueScheduleWeek}
          />}
          {view === "settings" && <SettingsView schedule={activeSchedule} onOpenDraftRanking={() => setDraftRankingRequest((current) => current + 1)} onRegenerate={() => setConfirmAction("regenerate")} canAccessPlatformSync={canAccessPlatformSync} platformSyncLoading={platformSyncLoading} onRefreshPlatformScores={refreshPlatformScores} onSavePlatformConnection={savePlatformConnection} onDisconnectPlatform={disconnectPlatform} importHistory={importHistory} importHistoryLoading={importHistoryLoading} importHistoryError={importHistoryError} onRefreshImportHistory={loadImportHistory} />}
        </div>
        {entitlements.plan !== "pro" && <AdUnit placement="workspace" />}
      </section>
    </div>
    {confirmAction && (() => {
      const recordedScoreCount = schedule.weeks.reduce((sum, week) => sum + week.games.filter((game) => game.homeScore != null && game.awayScore != null).length, 0);
      const configs = {
        share: {
          icon: <Share2 />, kicker: "Publish publicly",
          title: "Publish this schedule to a public page?",
          body: <p>This publishes your full schedule <strong>and manager names</strong> to a public web page anyone with the link can open.</p>,
          confirmLabel: "Publish & copy link", confirmIcon: <Share2 />,
          run: () => { void share(); },
        },
        commit: {
          icon: <Save />, kicker: "Save simulation",
          title: "Save simulated results to the real season?",
          body: <p>This replaces <strong>{recordedScoreCount} real game {recordedScoreCount === 1 ? "score" : "scores"}</strong> with your simulated results. This can’t be undone.</p>,
          confirmLabel: "Replace real scores", confirmIcon: <Save />,
          run: () => commitSimulation(),
        },
        regenerate: {
          icon: <Pencil />, kicker: "Regenerate",
          title: "Build a new matchup slate?",
          body: <p>This builds a new matchup slate and <strong>clears any entered scores and standings.</strong></p>,
          confirmLabel: "Edit & regenerate", confirmIcon: <Pencil />,
          run: () => router.push("/"),
        },
      };
      const config = configs[confirmAction];
      return <ConfirmDialog
        tone="danger"
        role="alertdialog"
        icon={config.icon}
        kicker={config.kicker}
        title={config.title}
        onClose={() => setConfirmAction(null)}
        actions={[
          { label: "Cancel", variant: "secondary", autoFocus: true, onClick: () => setConfirmAction(null) },
          { label: config.confirmLabel, variant: "danger", icon: config.confirmIcon, onClick: () => { setConfirmAction(null); config.run(); } },
        ]}
      >{config.body}</ConfirmDialog>;
    })()}
  </main>;
}
