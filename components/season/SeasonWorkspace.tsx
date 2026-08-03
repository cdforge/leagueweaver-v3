"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Check,
  CircleAlert,
  Cloud,
  Copy,
  ChevronDown,
  Download,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  Flame,
  Gamepad2,
  History,
  ImagePlus,
  LayoutList,
  LoaderCircle,
  LockKeyhole,
  LogIn,
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
import { AllStarsWorkspace } from "@/components/season/AllStarsWorkspace";
import { GotwWorkspace } from "@/components/season/GotwWorkspace";
import { MvtWorkspace } from "@/components/season/MvtWorkspace";
import { BracketConnectorLayer, type BracketConnection } from "@/components/season/BracketConnectorLayer";
import { ConsolationBracket, FinalPlacementTable } from "@/components/season/ConsolationBracket";
import { GameBadgeChip, MatchupCard, MatchupRatingLegend, MatchupSeriesChip, TeamIdentityBlock, WeekMatchupRank } from "@/components/season/MatchupPresentation";
import { GameDetailSheet } from "@/components/season/GameDetailSheet";
import { WeekSelector } from "@/components/season/WeekSelector";
import { SimulatorWorkspace, type SimulatorResultView } from "@/components/season/SimulatorWorkspace";
import { StatsWorkspace, TiebreakerEditor } from "@/components/season/StatsWorkspace";
import { TeamScheduleView } from "@/components/season/TeamSchedulePage";
import { ThisWeekWorkspace } from "@/components/season/ThisWeekWorkspace";
import { WeekRecapWorkspace, getLatestFinalWeek } from "@/components/season/WeekRecapWorkspace";
import { WeekScoreBar } from "@/components/season/WeekScoreBar";
import { PlayoffPicturePanel } from "@/components/season/PlayoffPictureModal";
import { StakesButton } from "@/components/season/StakesPanel";
import { getLiveWeek } from "@/lib/scenarios";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { FloatingPopover } from "@/components/ui/FloatingPopover";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { ConnectScoresModal } from "@/components/platform/ConnectScoresModal";
import { SaveConnectionPrompt } from "@/components/platform/SaveConnectionPrompt";
import { WorkspaceSwitcher } from "@/components/season/WorkspaceSwitcher";
import { IdentityColorPicker } from "@/components/ui/IdentityColorPicker";
import { Tooltip } from "@/components/ui/Tooltip";
import { apiErrorMessage } from "@/lib/apiErrors";
import { downloadCsv } from "@/lib/csv";
import { accessibleAccentColor, readableTextColor } from "@/lib/colorContrast";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { isDivisionHalvesConsolationUsable, projectConsolationBracket } from "@/lib/consolation";
import { conferenceOfDivision, hasConferences } from "@/lib/conferences";
import { downloadSchedulePdf } from "@/lib/pdf";
import { getMatchupRatingRange, getMatchupSignal, matchupRating, sortGamesForDisplay, toMatchupScore10, weekSlateScore10 } from "@/lib/matchups";
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
import { formatPoints, gameOfWeekStatusLabel, getScheduleGameSignals } from "@/lib/statistics";
import { normalizeTiebreakerSettings, TIEBREAKER_RULE_LABELS } from "@/lib/tiebreakers";
import { formatDraftPlace, getTeamsMissingDraftPlaces, getWeekOneRankMap, getWeekOneTeamOrder, hasCompleteDraftRanking } from "@/lib/rankings";
import { loadSeasonById, normalizeSeason, removeLocalSeason, saveSeason, saveSetup } from "@/lib/storage";
import { getNflWeekWindow, getWeekDateLabel, updateGameScore } from "@/lib/schedule";
import { getWeekPhase } from "@/lib/weekPhase";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import { GAME_DETAIL_CACHE_PREFIX, type GameDetailPlayerStat } from "@/lib/gameDetail";
import { espnSlotKey, lineupSlotSortRank, sleeperSlotKey, type LineupStatus } from "@/lib/playerData";
import type { GeneratedSchedule, ImportHistoryEvent, ImportPreview, LeagueSetupInput, PastChampion, PlatformConnection, PlatformSyncMode, PlayoffFieldSize, PlayoffGame, ScheduledGame, Team, TiebreakerSettings } from "@/lib/types";

type ViewKey = "this-week" | "results" | "league-schedule" | "team-schedule" | "gotw" | "matchup-ratings" | "standings" | "mvt" | "all-stars" | "playoffs" | "simulator" | "settings";
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
type HistoryBrowserSeason = {
  id: string;
  season: number;
  provider: "espn" | "sleeper";
  providerLeagueId: string;
  leagueName: string;
  teamCount: number;
  rosterPositions?: string[];
  regularSeasonWeekCount?: number;
  playoffSettings?: Record<string, unknown>;
  teams: Array<{ leagueTeamId: string; providerRosterOrTeamId: string; teamName: string; managerName?: string; divisionId?: string; conferenceId?: string; finalStanding?: number; wins?: number; losses?: number; ties?: number; pointsFor?: number; pointsAgainst?: number }>;
  games: Array<{ week: number; providerMatchupId: string; homeLeagueTeamId: string; awayLeagueTeamId: string; homeScore?: number; awayScore?: number; status: string; finalLockAt?: string }>;
  playerRows: Array<{ week: number; canonicalPlayerId: string; leagueTeamId: string; providerPlayerId: string; playerName: string; position: string; nflTeam?: string; lineupStatus: string; lineupSlot: string; fantasyPoints: number }>;
};

type HistorySyncResponse = {
  rowsWritten?: number;
  warnings?: string[];
  dataFound?: {
    availableHistoryYears?: number[];
    blockedHistoryYears?: number[];
  };
};

function historySyncNotice(historySync?: HistorySyncResponse) {
  if (!historySync) return "";
  const years = historySync.dataFound?.availableHistoryYears;
  const yearText = years?.length ? ` Previous years found: ${years.join(", ")}.` : "";
  const warningText = historySync.warnings?.[0] ? ` ${historySync.warnings[0]}` : "";
  if ((historySync.rowsWritten ?? 0) > 0) return ` Historical data saved.${yearText}${warningText}`;
  return yearText || warningText ? ` Historical data checked.${yearText}${warningText}` : " Historical data checked.";
}

function normalizeHistoryName(value?: string) {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function providerTail(value?: string) {
  return value?.split("-").at(-1) ?? "";
}

function buildHistoryTeamMap(schedule: GeneratedSchedule, season: HistoryBrowserSeason) {
  const byLeagueTeamId = new Map<string, string>();
  const currentProviderId = new Map<string, string>(schedule.setup.teams.map((team) => [team.providerId ?? "", team.id]));
  const currentProviderTail = new Map<string, string>(schedule.setup.teams
    .map((team): [string, string] => [providerTail(team.providerId), team.id])
    .filter(([tail]) => Boolean(tail)));
  const currentName = new Map<string, string>(schedule.setup.teams.map((team) => [normalizeHistoryName(`${team.city ?? ""} ${team.name}`), team.id]));
  for (const team of season.teams) {
    const exactProviderId = `${season.provider}-${season.providerLeagueId}-${team.providerRosterOrTeamId}`;
    const match = currentProviderId.get(exactProviderId)
      ?? currentProviderTail.get(team.providerRosterOrTeamId)
      ?? currentName.get(normalizeHistoryName(team.teamName));
    if (match) byLeagueTeamId.set(team.leagueTeamId, match);
  }
  return byLeagueTeamId;
}

function historyLineupStatus(value: string): LineupStatus {
  return value === "starter" || value === "bench" || value === "ir" || value === "taxi" || value === "reserve" ? value : "unknown";
}

function historySlot(provider: HistoryBrowserSeason["provider"], rawSlot: string) {
  const parsed = Number(rawSlot);
  if (provider === "espn" && Number.isInteger(parsed)) return espnSlotKey(parsed);
  return sleeperSlotKey(rawSlot);
}

function numberFromHistorySetting(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function historicalRegularSeasonWeeks(season: HistoryBrowserSeason) {
  const direct = numberFromHistorySetting(season.regularSeasonWeekCount);
  if (direct && direct >= 1 && direct <= 18) return direct;
  const sleeperStart = numberFromHistorySetting(season.playoffSettings?.playoff_week_start);
  if (sleeperStart && sleeperStart > 1 && sleeperStart <= 18) return sleeperStart - 1;
  return undefined;
}

function historicalFieldSize(season: HistoryBrowserSeason, fallback: PlayoffFieldSize) {
  const providerValue = numberFromHistorySetting(season.playoffSettings?.playoff_teams);
  if (!providerValue) return fallback;
  const normalized = Math.max(2, Math.min(season.teamCount || providerValue, Math.round(providerValue)));
  return normalized as PlayoffFieldSize;
}

function compareHistoryPlayerRows(provider: HistoryBrowserSeason["provider"], left: HistoryBrowserSeason["playerRows"][number], right: HistoryBrowserSeason["playerRows"][number]) {
  const leftSlot = historySlot(provider, left.lineupSlot);
  const rightSlot = historySlot(provider, right.lineupSlot);
  return left.week - right.week
    || left.leagueTeamId.localeCompare(right.leagueTeamId)
    || lineupSlotSortRank(leftSlot) - lineupSlotSortRank(rightSlot)
    || left.lineupSlot.localeCompare(right.lineupSlot, undefined, { numeric: true })
    || left.providerPlayerId.localeCompare(right.providerPlayerId, undefined, { numeric: true });
}

function buildHistoricalSchedule(schedule: GeneratedSchedule, season?: HistoryBrowserSeason): GeneratedSchedule | null {
  if (!season) return null;
  const teamIdByHistoryTeam = buildHistoryTeamMap(schedule, season);
  const gamesByWeek = new Map<number, ScheduledGame[]>();
  const playoffGamesByRound = new Map<number, PlayoffGame[]>();
  const regularWeeks = historicalRegularSeasonWeeks(season);
  const playoffWeeks = regularWeeks ? Math.max(3, Math.min(4, Math.max(0, ...season.games.map((game) => game.week - regularWeeks)))) : undefined;
  const setupWeeks = regularWeeks === 13 || regularWeeks === 14 ? regularWeeks : schedule.setup.weeks;
  const setup = {
    ...schedule.setup,
    seasonYear: season.season,
    name: `${schedule.setup.name} ${season.season}`,
    abbreviation: schedule.setup.abbreviation,
    weeks: setupWeeks,
    playoffs: {
      ...schedule.setup.playoffs,
      fieldSize: historicalFieldSize(season, schedule.setup.playoffs.fieldSize),
      playoffWeeks: playoffWeeks === 3 || playoffWeeks === 4 ? playoffWeeks : schedule.setup.playoffs.playoffWeeks,
      fieldStatus: "locked" as const,
      lockedTeamIds: season.teams
        .filter((team) => team.finalStanding != null)
        .sort((left, right) => (left.finalStanding ?? 999) - (right.finalStanding ?? 999))
        .flatMap((team) => teamIdByHistoryTeam.get(team.leagueTeamId) ?? [])
        .slice(0, historicalFieldSize(season, schedule.setup.playoffs.fieldSize)),
    },
  };
  const roundNames = getPlayoffRoundNames(setup.playoffs, setup.divisions.length);
  for (const game of season.games) {
    const homeTeamId = teamIdByHistoryTeam.get(game.homeLeagueTeamId);
    const awayTeamId = teamIdByHistoryTeam.get(game.awayLeagueTeamId);
    const home = homeTeamId ? schedule.setup.teams.find((team) => team.id === homeTeamId) : undefined;
    const away = awayTeamId ? schedule.setup.teams.find((team) => team.id === awayTeamId) : undefined;
    if (!homeTeamId || !awayTeamId || !home || !away) continue;
    const isPlayoff = Boolean(regularWeeks && game.week > regularWeeks);
    const roundIndex = isPlayoff && regularWeeks ? game.week - regularWeeks - 1 : -1;
    const gameNumber = isPlayoff ? (playoffGamesByRound.get(roundIndex)?.length ?? 0) + 1 : (gamesByWeek.get(game.week)?.length ?? 0) + 1;
    const baseGame = {
      id: isPlayoff ? `main-r${roundIndex + 1}-g${gameNumber}` : `history-${season.season}-${game.providerMatchupId}`,
      week: game.week,
      gameNumber,
      homeTeamId,
      awayTeamId,
      matchupType: home.divisionId === away.divisionId ? "division" : "cross-division",
      seriesGame: 1,
      seriesLength: 1,
      dateLabel: getWeekDateLabel(season.season, game.week),
      stadium: home.stadium,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      notes: [`${season.provider.toUpperCase()} history`, isPlayoff ? "Historical playoff game" : "Historical regular-season game"],
    } satisfies ScheduledGame;
    if (isPlayoff) {
      const existing = playoffGamesByRound.get(roundIndex) ?? [];
      existing.push({
        ...baseGame,
        round: roundNames[roundIndex] ?? `Round ${roundIndex + 1}`,
        roundIndex,
        bracket: "main",
      });
      playoffGamesByRound.set(roundIndex, existing);
    } else {
      const existing = gamesByWeek.get(game.week) ?? [];
      existing.push(baseGame);
      gamesByWeek.set(game.week, existing);
    }
  }
  const weeks = [...gamesByWeek.entries()].sort(([left], [right]) => left - right).map(([weekNumber, games]) => ({
    weekNumber,
    dateLabel: getWeekDateLabel(season.season, weekNumber),
    games,
    averageMatchupRating: 0,
    bestMatchupRating: 0,
  }));
  const playoffGames = [...playoffGamesByRound.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([, games]) => games);
  if (!weeks.length && !playoffGames.length) return null;
  return normalizeSeason({
    ...schedule,
    id: `${schedule.id}-history-${season.season}`,
    createdAt: schedule.createdAt,
    setup,
    weeks,
    playoffGames,
    rankHistory: undefined,
  });
}

function buildHistoricalPlayerRows(schedule: GeneratedSchedule, season?: HistoryBrowserSeason): GameDetailPlayerStat[] {
  if (!season) return [];
  const teamIdByHistoryTeam = buildHistoryTeamMap(schedule, season);
  const starterCounts = new Map<string, number>();
  const sortedRows = [...season.playerRows].sort((left, right) => compareHistoryPlayerRows(season.provider, left, right));
  return sortedRows.flatMap((row) => {
    const teamId = teamIdByHistoryTeam.get(row.leagueTeamId);
    if (!teamId) return [];
    const lineupStatus = historyLineupStatus(row.lineupStatus);
    const inferredSlot = historySlot(season.provider, row.lineupSlot);
    const starterKey = `${row.week}:${teamId}`;
    const starterIndex = lineupStatus === "starter" ? (starterCounts.set(starterKey, (starterCounts.get(starterKey) ?? 0) + 1), (starterCounts.get(starterKey) ?? 1) - 1) : undefined;
    return [{
      scheduleId: schedule.id,
      provider: season.provider,
      providerLeagueId: season.providerLeagueId,
      season: season.season,
      week: row.week,
      teamId,
      providerRosterId: row.leagueTeamId,
      providerPlayerId: row.providerPlayerId,
      canonicalPlayerId: row.canonicalPlayerId,
      displayName: row.playerName,
      position: row.position,
      nflTeam: row.nflTeam,
      points: row.fantasyPoints,
      lineupStatus,
      starterIndex,
      inferredSlot,
      rawSlot: row.lineupSlot,
      slotConfidence: lineupStatus === "starter" ? "inferred" : "bench",
      isProvisional: false,
      finalLockAt: undefined,
      syncedAt: new Date(season.season, 0, 1).toISOString(),
      sourcePayloadHash: `history:${season.id}:${row.week}:${row.canonicalPlayerId}`,
    }];
  });
}

function seasonTimeframeLabel(seasonYear: number, weeks: number) {
  const firstWeek = getNflWeekWindow(seasonYear, 1);
  const finalWeek = getNflWeekWindow(seasonYear, weeks);
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const finalDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${seasonYear} season · NFL Weeks 1–${weeks} · ${monthDay.format(new Date(firstWeek.startsAt))}–${finalDate.format(new Date(finalWeek.endsAt))}`;
}

const VIEW_ITEMS: Array<{ key: ViewKey; label: string; icon: typeof CalendarDays; pro?: boolean }> = [
  { key: "this-week", label: "This Week", icon: Flame },
  { key: "results", label: "Results", icon: LayoutList },
  { key: "league-schedule", label: "League Schedule", icon: CalendarDays },
  { key: "team-schedule", label: "Team Schedule", icon: UsersRound },
  { key: "gotw", label: "Game of the Week", icon: Star },
  { key: "matchup-ratings", label: "Matchup Ratings", icon: SlidersHorizontal },
  { key: "standings", label: "Standings", icon: BarChart3 },
  { key: "mvt", label: "MVT", icon: Medal },
  { key: "all-stars", label: "All-Stars", icon: Sparkles },
  { key: "playoffs", label: "Playoffs", icon: Trophy },
  { key: "settings", label: "Settings", icon: Settings },
];
const HISTORY_COMPATIBLE_VIEWS = new Set<ViewKey>(["league-schedule", "team-schedule", "gotw", "matchup-ratings", "standings", "mvt", "all-stars", "playoffs"]);

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

function PlayoffWeekSchedule({ schedule, roundIndex, onEnterScores, onOpenGame }: { schedule: GeneratedSchedule; roundIndex: number; onEnterScores: () => void; onOpenGame?: (gameId: string) => void }) {
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
  const showCity = schedule.setup.display?.cityNames !== false;
  const roundDate = getWeekDateLabel(schedule.setup.seasonYear, round.weekNumber);
  const roundComplete = actualGames.length > 0 && actualGames.every((game) => game.homeScore != null && game.awayScore != null);
  const championshipNeutral = roundIndex === projectedRounds.length - 1 && settings.championshipVenueMode === "neutral-site";
  const playoffPhaseLabel = roundComplete ? "Final" : actualGames.length ? "Scheduled" : "Projected";
  const playoffPillClass = roundComplete ? "phase-final" : "phase-playoff";
  const playoffScored = actualGames.filter((game) => game.homeScore != null && game.awayScore != null).length;

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

  const recordFor = (teamId: string) => {
    const seedEntry = seedByTeam.get(teamId);
    const standing = standingsByTeam.get(teamId);
    return { overall: seedEntry?.record ?? (standing ? formatRecord(standing) : "0-0"), division: standing ? `${standing.divisionWins}-${standing.divisionLosses}` : undefined };
  };
  // Playoff games render with the SAME MatchupCard as the rest of the app; an
  // unresolved (not-yet-recorded) matchup shows the card's "Projected" state.
  const PlayoffMatchupCard = ({ id, gameNumber, homeTeamId, awayTeamId, homeSeed, awaySeed, homeScore, awayScore, stadium, gameLabel, projected }: {
    id: string; gameNumber: number; homeTeamId: string; awayTeamId: string; homeSeed: number; awaySeed: number; homeScore?: number; awayScore?: number; stadium?: string; gameLabel?: string; projected: boolean;
  }) => {
    const home = teamById.get(homeTeamId);
    const away = teamById.get(awayTeamId);
    if (!home || !away) return <article className="matchup-card is-projected matchup-card-standard playoff-tbd-card" role="listitem">
      {gameLabel && <div className="matchup-card-badges"><div className="matchup-card-chips"><span className="game-order-chip">{gameLabel}</span></div></div>}
      <div className="playoff-tbd-body"><b>#{awaySeed}</b><em>Projected</em><b>#{homeSeed}</b></div>
      <small className="playoff-tbd-note">Teams are set once the prior round is decided.</small>
    </article>;
    const venue = stadium || (championshipNeutral ? "Neutral championship site" : home.stadium) || "Venue to be determined";
    const game: ScheduledGame = {
      id, week: round.weekNumber, gameNumber, homeTeamId, awayTeamId,
      matchupType: home.divisionId === away.divisionId ? "division" : "cross-division",
      seriesGame: 1, seriesLength: 1, dateLabel: roundDate, stadium: venue, homeScore, awayScore,
    };
    return <MatchupCard
      game={game} away={away} home={home}
      awayDivision={divisionById.get(away.divisionId)} homeDivision={divisionById.get(home.divisionId)}
      awayRank={awaySeed} homeRank={homeSeed}
      awayRecord={recordFor(awayTeamId)} homeRecord={recordFor(homeTeamId)}
      featured={false} gameLabel={gameLabel} showCity={showCity} showVenue projected={projected}
      teamHrefBase={`/season/${schedule.id}/team`}
      onOpenGame={onOpenGame}
    />;
  };

  // --- Placeholder-aware playoff games (same rule as the championship bracket): a
  // slot is a real team only when it enters this round (bye / wild-card seed) or its
  // feeding game is decided; otherwise "Winner of <game>". Never project ahead.
  const roundNameAt = (index: number) => projectedRounds[index]?.name ?? `Round ${index + 1}`;
  const nameForGame = (id: string, fallback: string) => settings.gameNames?.[id]?.trim() || fallback;
  const defaultGameNameAt = (index: number, gameIndex: number, count: number) => count > 1 ? `${roundNameAt(index)} game ${gameIndex + 1}` : roundNameAt(index);
  const recordedMainGame = (id: string) => (schedule.playoffGames ?? []).find((g) => g.bracket === "main" && g.id === id);
  const decidedWinnerSeedAt = (index: number, gameIndex: number, homeSeed: number, awaySeed: number) => {
    const rec = recordedMainGame(`main-r${index + 1}-g${gameIndex + 1}`);
    if (rec && rec.homeScore != null && rec.awayScore != null && rec.homeScore !== rec.awayScore) return seedByTeam.get(rec.homeScore > rec.awayScore ? rec.homeTeamId : rec.awayTeamId)?.seed ?? Math.min(homeSeed, awaySeed);
    return null;
  };
  const entryRoundOf = (seedNum: number) => (seedByNumber.get(seedNum)?.bye ? 1 : 0);
  const feedingGameFor = (index: number, slotSeed: number) => {
    const prev = projectedRounds[index - 1];
    if (!prev) return undefined;
    const gi = prev.matchups.findIndex((m, mi) => (decidedWinnerSeedAt(index - 1, mi, m.homeSeed, m.awaySeed) ?? Math.min(m.homeSeed, m.awaySeed)) === slotSeed);
    if (gi < 0) return undefined;
    const id = `main-r${index}-g${gi + 1}`;
    return { id, name: nameForGame(id, defaultGameNameAt(index - 1, gi, prev.matchups.length)), decided: decidedWinnerSeedAt(index - 1, gi, prev.matchups[gi].homeSeed, prev.matchups[gi].awaySeed) != null };
  };
  type SlotV = { kind: "team"; teamId: string; seed: number } | { kind: "tbd"; label: string; sub: string; seed: number };
  const resolveMainSlot = (slotSeed: number): SlotV => {
    const teamId = seedByNumber.get(slotSeed)?.teamId;
    if (teamId && entryRoundOf(slotSeed) === roundIndex) return { kind: "team", teamId, seed: slotSeed };
    const feed = feedingGameFor(roundIndex, slotSeed);
    if (teamId && feed?.decided) return { kind: "team", teamId, seed: slotSeed };
    const fixed = settings.reseedMode === "fixed" && feed;
    return { kind: "tbd", label: fixed ? "Winner of" : "To be determined", sub: fixed ? feed!.name : `Projected seed #${slotSeed}`, seed: slotSeed };
  };
  // The placeholder reuses the exact TeamIdentityBlock grid so it lines up with a
  // real team row — the card reads as a normal matchup with the unknown side swapped.
  const TbdRow = ({ slot, mirrored = false }: { slot: Extract<SlotV, { kind: "tbd" }>; mirrored?: boolean }) => (
    <div className="matchup-team-row">
      <div className={`team-identity-block${mirrored ? " mirrored" : ""} without-record result-open playoff-tbd-block`}>
        <b className="team-identity-rank">{settings.reseedMode === "fixed" ? "W" : `#${slot.seed}`}</b>
        <span className="team-identity-mark"><span className="playoff-tbd-mark" aria-hidden="true">?</span></span>
        <span className="team-identity-name"><strong>{slot.label}</strong>{slot.sub && <small>{slot.sub}</small>}</span>
      </div>
    </div>
  );
  const RealRow = ({ teamId, seedNumber, mirrored = false }: { teamId: string; seedNumber: number; mirrored?: boolean }) => {
    const team = teamById.get(teamId);
    if (!team) return null;
    const s = seedByTeam.get(teamId);
    const shown = settings.seedDisplayMode === "standings-finish" ? s?.standingsPosition ?? seedNumber : s?.seed ?? seedNumber;
    return <div className="matchup-team-row"><TeamIdentityBlock mirrored={mirrored} team={team} division={divisionById.get(team.divisionId)} leagueRank={shown} record={recordFor(teamId)} showCity={showCity} href={`/season/${schedule.id}/team/${team.id}`} /></div>;
  };
  const GameBanner = ({ id, name, projected }: { id: string; name: string; projected: boolean }) => {
    const logo = settings.gameLogoUrls?.[id] || settings.roundLogoUrls?.[roundIndex];
    return <div className="playoff-game-banner">{logo ? <img src={logo} alt="" /> : <span className="playoff-game-banner-mark"><Trophy /></span>}<strong>{name}</strong>{projected && <em>Projected</em>}</div>;
  };
  const PlayoffGameBlock = ({ id, name, index, count, home, away, homeScore, awayScore, stadium }: { id: string; name: string; index: number; count: number; home: SlotV; away: SlotV; homeScore?: number; awayScore?: number; stadium?: string }) => {
    const homeReal = home.kind === "team" ? home : null;
    const awayReal = away.kind === "team" ? away : null;
    const played = homeScore != null && awayScore != null && !(homeScore === 0 && awayScore === 0);
    // A playoff game is just a normal match card. The banner carries the round
    // name plus a "Projected" tag until the game is played; a still-unknown side
    // shows a "?" placeholder row in that same card.
    return <div className="playoff-game-block" role="listitem">
      <GameBanner id={id} name={name} projected={!played} />
      {homeReal && awayReal
        ? <PlayoffMatchupCard id={id} gameNumber={index + 1} homeTeamId={homeReal.teamId} awayTeamId={awayReal.teamId} homeSeed={homeReal.seed} awaySeed={awayReal.seed} homeScore={homeScore} awayScore={awayScore} stadium={stadium} projected={false} />
        : <article className="matchup-card matchup-card-standard" role="listitem"><div className="matchup-card-main">
            {awayReal ? <RealRow teamId={awayReal.teamId} seedNumber={awayReal.seed} /> : <TbdRow slot={away as Extract<SlotV, { kind: "tbd" }>} />}
            <div className="matchup-score"><strong>—</strong><span aria-label="at">@</span><strong>—</strong></div>
            {homeReal ? <RealRow teamId={homeReal.teamId} seedNumber={homeReal.seed} mirrored /> : <TbdRow slot={home as Extract<SlotV, { kind: "tbd" }>} mirrored />}
          </div></article>}
    </div>;
  };
  const mainViews = actualGames.length
    ? actualGames.map((game, index) => ({ id: game.id, name: nameForGame(game.id, defaultGameNameAt(roundIndex, index, actualGames.length)), index, count: actualGames.length, home: { kind: "team", teamId: game.homeTeamId, seed: seedByTeam.get(game.homeTeamId)?.seed ?? 0 } as SlotV, away: { kind: "team", teamId: game.awayTeamId, seed: seedByTeam.get(game.awayTeamId)?.seed ?? 0 } as SlotV, homeScore: game.homeScore as number | undefined, awayScore: game.awayScore as number | undefined, stadium: game.stadium as string | undefined }))
    : round.matchups.map((m, index) => ({ id: `main-r${roundIndex + 1}-g${index + 1}`, name: nameForGame(`main-r${roundIndex + 1}-g${index + 1}`, defaultGameNameAt(roundIndex, index, round.matchups.length)), index, count: round.matchups.length, home: resolveMainSlot(m.homeSeed), away: resolveMainSlot(m.awaySeed), homeScore: undefined as number | undefined, awayScore: undefined as number | undefined, stadium: undefined as string | undefined }));
  const consolationBracket = projectConsolationBracket(schedule);
  const consolationRound = consolationBracket?.rounds.find((r) => r.roundIndex === roundIndex);
  const consolationSlot = (entrant: NonNullable<typeof consolationRound>["games"][number]["entrants"][number]): SlotV =>
    entrant.kind === "team" ? { kind: "team", teamId: entrant.teamId, seed: entrant.projectedSeed } : { kind: "tbd", label: entrant.label, sub: "", seed: entrant.projectedSeed };
  const consolationTeamIds = new Set(consolationBracket?.rounds.flatMap((r) => r.games.flatMap((g) => g.entrants.filter((e): e is Extract<typeof e, { kind: "team" }> => e.kind === "team").map((e) => e.teamId))) ?? []);
  const eliminatedTeams = roundIndex === 0 ? schedule.setup.teams.filter((team) => !seedByTeam.has(team.id) && !consolationTeamIds.has(team.id)) : [];

  return <div className="workspace-stack playoff-week-schedule" style={{ "--playoff-week-color": settings.color, "--playoff-week-ink": readableTextColor(settings.color) } as CSSProperties}>
    <div className="section-bar schedule-week-header is-playoff">
      <div className="week-lead">
        <span className="bar-number" aria-hidden="true">{settings.logoUrl ? <EntityLogo color={settings.color} logoUrl={settings.logoUrl} monogram="PO" size={40} /> : <Trophy />}</span>
        <span className="week-lead-copy">
          <span className="schedule-week-title"><strong>{round.name}</strong></span>
          <small>NFL Week {round.weekNumber} · {roundDate}</small>
        </span>
      </div>
      <div className="week-status">
        <span className="playoff-week-context">{mainViews.length} game{mainViews.length === 1 ? "" : "s"}{round.byeSeeds.length > 0 ? ` · ${round.byeSeeds.length} bye${round.byeSeeds.length === 1 ? "" : "s"}` : ""}</span>
      </div>
      <div className="section-bar-actions">
        <button type="button" className="score-entry-trigger" onClick={onEnterScores}>
          <LayoutList />
          <span>{playoffScored > 0 ? "Edit scores" : "Add scores"}</span>
          {mainViews.length > 0 && <small className="score-progress" aria-label={`${playoffScored} of ${mainViews.length} scored`}>{playoffScored}/{mainViews.length}</small>}
        </button>
      </div>
    </div>
    {round.byeSeeds.length > 0 && <section className="playoff-week-byes">
      <header><ShieldCheck /><span><strong>Projected byes</strong><small>These teams advance directly to their respective {projectedRounds[roundIndex + 1]?.name ?? "next round"}.</small></span></header>
      <div>{round.byeSeeds.map((seedNumber) => {
        const item = seedByNumber.get(seedNumber);
        return <div key={seedNumber}><TeamSlot teamId={item?.teamId ?? ""} seedNumber={seedNumber} /><span className="playoff-bye-tag"><strong>BYE</strong></span></div>;
      })}</div>
    </section>}
    <div className="playoff-week-games" role="list" aria-label={`${round.name} matchups`}>
      {mainViews.map((view) => <PlayoffGameBlock key={view.id} {...view} />)}
    </div>
    {consolationRound && consolationRound.games.length > 0 && <section className="playoff-week-consolation">
      <div className="playoff-week-divider"><Medal /><span><strong>Consolation games</strong><small>Placement matchups · projected until played</small></span></div>
      <div className="playoff-week-games" role="list" aria-label="Consolation matchups">
        {consolationRound.games.map((cg, index) => {
          const rec = (schedule.playoffGames ?? []).find((g) => g.bracket === "consolation" && g.id === cg.id);
          return <PlayoffGameBlock key={cg.id} id={cg.id} name={cg.label} index={index} count={consolationRound.games.length} home={consolationSlot(cg.entrants[0])} away={consolationSlot(cg.entrants[1])} homeScore={rec?.homeScore} awayScore={rec?.awayScore} />;
        })}
      </div>
    </section>}
    {eliminatedTeams.length > 0 && <section className="playoff-week-byes playoff-week-eliminated">
      <header><X /><span><strong>Eliminated</strong><small>Did not qualify for the postseason.</small></span></header>
      <div>{eliminatedTeams.map((team) => <div key={team.id}><TeamSlot teamId={team.id} seedNumber={team.overallRank} /><span><strong>OUT</strong><small>No playoff or consolation path</small></span></div>)}</div>
    </section>}
  </div>;
}

function ScheduleView({ schedule, selectedWeek, setSelectedWeek, canAccessPlayoffs, onOpenScores, onOpenPlayoffs, onOpenGame, highlightedGame, simulationResults = {}, simulationProbabilities = {}, readOnlyHistory = false, teamHrefBase, teamHrefFor }: {
  schedule: GeneratedSchedule;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  canAccessPlayoffs: boolean;
  onOpenScores: (week: number) => void;
  onOpenPlayoffs: () => void;
  onOpenGame?: (gameId: string) => void;
  highlightedGame?: HighlightedGame;
  simulationResults?: Record<string, SimulatorResultView>;
  simulationProbabilities?: Record<string, { away: number; home: number }>;
  readOnlyHistory?: boolean;
  teamHrefBase?: string;
  teamHrefFor?: (teamId: string) => string;
}) {
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
      signal: getMatchupSignal(game, displayedRanks, ratingRange, schedule.setup.teams.length),
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
  const renderNow = useMemo(() => new Date(), []);
  const scoreEntryDue = openScoreCount > 0 && renderNow.getTime() >= new Date(nflWeekWindow.endsAt).getTime();
  const scoredCount = week.games.length - openScoreCount;
  // Clock-derived week phase (Upcoming / Live / Final) — same source the score bar uses, no feed.
  const weekPhase = getWeekPhase(renderNow, nflWeekWindow);
  const playingTeamIds = new Set(week.games.flatMap((game) => [game.homeTeamId, game.awayTeamId]));
  const byeTeams = schedule.setup.teams.filter((team) => !playingTeamIds.has(team.id));
  const orderedGames = sortGamesForDisplay(week.games.filter((game) => teamById.has(game.homeTeamId) && teamById.has(game.awayTeamId)), displayedRanks);
  const visibleGames = orderedGames;
  // #18.4 — don't silently drop games whose teams were removed; count them so the
  // week can flag the missing matchups instead of just showing fewer games.
  const droppedGameCount = week.games.length - orderedGames.length;
  const gotwPureAway = gotwEntry ? teamById.get(gotwEntry.pureGame.awayTeamId) : undefined;
  const gotwPureHome = gotwEntry ? teamById.get(gotwEntry.pureGame.homeTeamId) : undefined;
  const gotwOverrideDetails = gotwEntry?.playoffImplication && gotwEntry.pureGame.id !== gotwEntry.game.id && gotwPureAway && gotwPureHome
    ? {
        featuredRanks: `#${gotwEntry.ranks.get(gotwEntry.game.awayTeamId) ?? "—"} vs #${gotwEntry.ranks.get(gotwEntry.game.homeTeamId) ?? "—"}`,
        pureMatchup: `${teamDisplayName(gotwPureAway, display.cityNames)} vs ${teamDisplayName(gotwPureHome, display.cityNames)}`,
      }
    : undefined;
  const weekSelector = <WeekSelector
    stripRef={weekStripRef}
    ariaLabel="Select regular season or playoff week"
    weeks={schedule.weeks.map((item) => ({ weekNumber: item.weekNumber, dateLabel: item.dateLabel, matchupRank: item.matchupRank, slateScore: weekSlateScore10(item.averageMatchupRating, schedule.setup.teams.length), isThanksgiving: getNflWeekWindow(schedule.setup.seasonYear, item.weekNumber).holidays.includes("Thanksgiving") }))}
    totalWeeks={schedule.weeks.length}
    selectedWeek={selectedWeek}
    onSelect={setSelectedWeek}
    trailing={<>
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
    </>}
  />;
  if (selectedPlayoffIndex >= 0) {
    return <div className="workspace-stack">
      {weekSelector}
      <PlayoffWeekSchedule schedule={schedule} roundIndex={selectedPlayoffIndex} onEnterScores={onOpenPlayoffs} onOpenGame={onOpenGame} />
    </div>;
  }
  return (
    <div className="workspace-stack">
      {weekSelector}
      <div className="schedule-week-panel">
        <div className={`section-bar schedule-week-header${isThanksgivingWeek ? " is-thanksgiving" : ""}${weekPhase.phase === "live" ? " is-live" : ""}`}>
          <div className="week-lead">
            <span className="bar-number" aria-hidden="true">{String(week.weekNumber).padStart(2, "0")}</span>
            <span className="week-lead-copy">
              <span className="schedule-week-title"><strong>Week {week.weekNumber}</strong>{isThanksgivingWeek && <em className="thanksgiving-week-label" aria-label="Thanksgiving week"><span aria-hidden="true">🦃</span><span className="thx-text">Thanksgiving</span></em>}</span>
              <small>{week.dateLabel}</small>
            </span>
          </div>
          <div className="week-status">
            <WeekMatchupRank rank={week.matchupRank} total={schedule.weeks.length} score={weekSlateScore10(week.averageMatchupRating, schedule.setup.teams.length)} withLabel />
            {weekPhase.phase !== "pre" && <span className={`week-phase-pill phase-${weekPhase.phase}`}>
              {weekPhase.phase === "live" && <i className="live-dot" aria-hidden="true" />}
              <span>{weekPhase.phase === "live" ? "Live" : weekPhase.label}</span>
              {weekPhase.phase === "live" && weekPhase.window && weekPhase.window !== "between" && <small>{weekPhase.label}</small>}
            </span>}
            {(secondaryHolidays.length > 0 || byeTeams.length > 0) && <span className="week-markers">{secondaryHolidays.map((holiday) => <em className="holiday-marker" key={holiday}>{holiday}</em>)}{byeTeams.length > 0 && <em className="bye-marker">{byeTeams.length} BYE</em>}</span>}
          </div>
          <div className="section-bar-actions">
            {!readOnlyHistory && week.weekNumber === liveWeekNumber && <StakesButton schedule={schedule} weekNumber={week.weekNumber} onGoToGame={goToGame} />}
            {!readOnlyHistory ? <button type="button" className={`score-entry-trigger${scoreEntryDue ? " needs-attention" : ""}`} onClick={() => onOpenScores(week.weekNumber)}>
              {scoreEntryDue && <i className="due-dot" aria-hidden="true" />}
              <LayoutList />
              <span>{scoreEntryDue ? "Enter scores" : hasEnteredScores ? "Edit scores" : "Add scores"}</span>
              {week.games.length > 0 && <small className="score-progress" aria-label={`${scoredCount} of ${week.games.length} scored`}>{scoredCount}/{week.games.length}</small>}
            </button> : <span className="history-readonly-pill"><History />Provider history</span>}
          </div>
        </div>
        {gotwOverrideDetails && gotwEntry && visibleGames.some((game) => game.id === gameOfWeekId) && <section className="gotw-selection-reason" aria-label="Why this matchup is Game of the Week">
          <span><Star fill="currentColor" /></span>
          <div><small>LATE-SEASON PLAYOFF IMPACT</small><strong>Why this won the rating tie</strong><p>This {gotwOverrideDetails.featuredRanks} matchup shares the week&apos;s best {toMatchupScore10(gotwEntry.rating, schedule.setup.teams.length).toFixed(1)}/10 rating and crosses the {schedule.setup.playoffs.fieldSize}-team playoff cutline. Playoff impact moved it ahead of <span>{gotwOverrideDetails.pureMatchup}</span> after the rating tie. Higher ratings always remain first.</p></div>
        </section>}
        {droppedGameCount > 0 && <div className="week-data-warning" role="alert"><CircleAlert /><span><strong>{droppedGameCount} matchup{droppedGameCount === 1 ? "" : "s"} can’t be shown</strong><small>A team in {droppedGameCount === 1 ? "it was" : "them was"} removed after the schedule was generated.</small></span></div>}
        <div className="matchup-list matchup-card-list">{visibleGames.map((game) => {
          const analytics = scheduleSignals.byGameId.get(game.id);
          const featured = game.id === gameOfWeekId;
          const simulationResult = simulationResults[game.id];
          const isHighlighted = highlightedGame?.id === game.id;
          const highlightedMedalLabel = isHighlighted && highlightedGame?.medalRank ? ["Gold", "Silver", "Bronze"][highlightedGame.medalRank - 1] : undefined;
          return <MatchupCard key={game.id} {...presentationFor(game, week.weekNumber)} featured={featured} featuredLabel={featured && gotwEntry ? gameOfWeekStatusLabel(gotwEntry.status) : undefined} gameLabel={featured ? undefined : `Game ${game.gameNumber}`} badges={analytics?.badges} medalRank={isHighlighted ? highlightedGame?.medalRank : analytics?.qualityRank} medalLabel={highlightedMedalLabel ? `${highlightedMedalLabel} · ${highlightedGame?.medalCategory || "League leader"}` : undefined} highlighted={isHighlighted} simulationSource={simulationResult?.source} simulationLocked={simulationResult?.locked} winProbability={simulationProbabilities[game.id]} teamHrefBase={teamHrefBase ?? `/season/${schedule.id}/team`} teamHrefFor={teamHrefFor} onOpenGame={onOpenGame} />;
        })}{visibleGames.length === 0 && <div className="rating-filter-empty"><strong>No games scheduled this week.</strong>{byeTeams.length > 0 && <span>Every team is on a bye this week.</span>}</div>}</div>
      </div>
      <MatchupRatingLegend />
      {byeTeams.length > 0 && <div className="week-bye-list"><strong>Bye</strong>{byeTeams.map((team) => <span key={team.id}><EntityLogo size={32} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />{teamDisplayName(team, display.cityNames)}</span>)}</div>}
      </div>
  );
}

function MatchupRatingsView({ schedule, teamHrefFor, leagueWeekHrefFor }: { schedule: GeneratedSchedule; teamHrefFor?: (teamId: string) => string; leagueWeekHrefFor?: (week: number) => string }) {
  // Fixed presentation: all matchups, strongest first, weekly-standings lens.
  const lens: "live" | "preseason" = "live";
  const scheduleSignals = getScheduleGameSignals(schedule);
  const allGames = schedule.weeks.flatMap((week) => week.games);
  const teamCount = schedule.setup.teams.length;
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const preseasonRanks = new Map(schedule.setup.teams.map((team) => [team.id, team.overallRank]));
  const openingWeekRanks = getWeekOneRankMap(schedule.setup);
  const weeklyRanks = new Map(schedule.weeks.map((week) => {
    const snapshot = getEnteringWeekRankSnapshot(schedule, week.weekNumber);
    return [week.weekNumber, new Map(snapshot.rows.map((row) => [row.teamId, row.rank]))];
  }));
  const weeklyRecords = new Map(schedule.weeks.map((week) => {
    const snapshot = getEnteringWeekRankSnapshot(schedule, week.weekNumber);
    return [week.weekNumber, new Map(snapshot.rows.map((row) => [row.teamId, formatRecord(row)]))];
  }));
  const ranksForGame = (game: ScheduledGame) => lens === "live"
    ? weeklyRanks.get(game.week) ?? openingWeekRanks
    : game.week === 1 ? openingWeekRanks : preseasonRanks;
  const ratingForGame = (game: ScheduledGame) => matchupRating(game, lens === "live" ? ranksForGame(game) : undefined);
  const ratings = allGames.map(ratingForGame).filter(Number.isFinite);
  const ratingRange = ratings.length ? { min: Math.min(...ratings), max: Math.max(...ratings) } : { min: 0, max: 0 };
  const visibleGames = [...allGames].sort((left, right) => {
    const difference = ratingForGame(left) - ratingForGame(right);
    return difference || left.week - right.week || left.id.localeCompare(right.id);
  });
  const strongestWeek = [...schedule.weeks].sort((left, right) => (left.matchupRank ?? 999) - (right.matchupRank ?? 999))[0];
  return <div className="matchup-ratings-view">
    <div className="matchup-ratings-summary">
      <span><small>Rating range</small><strong>{toMatchupScore10(ratingRange.max, teamCount).toFixed(1)}–{toMatchupScore10(ratingRange.min, teamCount).toFixed(1)}</strong></span>
      <span><small>Strongest week</small>{strongestWeek ? <span className="strongest-week-value"><strong>Week {strongestWeek.weekNumber}</strong><WeekMatchupRank rank={strongestWeek.matchupRank} total={schedule.weeks.length} score={weekSlateScore10(strongestWeek.averageMatchupRating, teamCount)} compact /></span> : <strong>—</strong>}</span>
      <span><small>Games shown</small><strong>{visibleGames.length}</strong></span>
    </div>
    <div className="matchup-ratings-controls">
      <span><strong>Matchup rating</strong><small>Rated out of 10, higher is better. Every matchup, strongest first.</small></span>
    </div>
    <MatchupRatingLegend />
    <div className="matchup-ratings-table-wrap">
      <table className="matchup-ratings-table">
        <thead><tr><th>Wk</th><th>Game</th><th>Away</th><th>Result</th><th>Home</th><th>Matchup</th><th>Rating</th></tr></thead>
        <tbody>{visibleGames.map((game) => {
          const away = teamById.get(game.awayTeamId)!;
          const home = teamById.get(game.homeTeamId)!;
          const rowRanks = ranksForGame(game);
          const signal = getMatchupSignal(game, lens === "live" ? rowRanks : undefined, ratingRange, teamCount);
          const played = game.awayScore != null && game.homeScore != null;
          const awayWon = played && game.awayScore! > game.homeScore!;
          const homeWon = played && game.homeScore! > game.awayScore!;
          const isGameOfWeek = scheduleSignals.gotwIds.has(game.id);
          return <tr className={isGameOfWeek ? "is-gotw" : undefined} key={game.id}>
            <td><Link href={`${leagueWeekHrefFor ? leagueWeekHrefFor(game.week) : `/season/${schedule.id}?week=${game.week}`}#${game.id}`}>W{game.week}</Link></td>
            <td>{isGameOfWeek ? <GameBadgeChip badge="GOTW" /> : <span className="matchup-table-game-label">Game {game.gameNumber ?? "—"}</span>}</td>
            <td><TeamIdentityBlock compact showRecord={false} team={away} division={divisionById.get(away.divisionId)} leagueRank={rowRanks.get(away.id) ?? away.overallRank} record={{ overall: "0-0" }} showCity={schedule.setup.display.cityNames} href={teamHrefFor ? teamHrefFor(away.id) : `/season/${schedule.id}/team/${away.id}`} /></td>
            <td>{played ? <span className="matchup-table-result" aria-label={`Final score: ${away.name} ${game.awayScore}, ${home.name} ${game.homeScore}`}><span><strong className={awayWon ? "winner" : homeWon ? "loser" : ""}>{formatPoints(game.awayScore!)}</strong><b aria-label="at">@</b><strong className={homeWon ? "winner" : awayWon ? "loser" : ""}>{formatPoints(game.homeScore!)}</strong></span><small>FINAL</small></span> : <span className="matchup-table-result pending">—<small>NOT PLAYED</small></span>}</td>
            <td><TeamIdentityBlock mirrored compact showRecord={false} team={home} division={divisionById.get(home.divisionId)} leagueRank={rowRanks.get(home.id) ?? home.overallRank} record={{ overall: "0-0" }} showCity={schedule.setup.display.cityNames} href={teamHrefFor ? teamHrefFor(home.id) : `/season/${schedule.id}/team/${home.id}`} /></td>
            <td><MatchupSeriesChip game={game} division={divisionById.get(home.divisionId)} /></td>
            <td><span className="table-rating-cell"><span className={`table-signal signal-${signal.label.toLowerCase()}`} aria-label={`${signal.label} matchup, rated ${signal.score10.toFixed(1)} out of 10`}>{[1, 2, 3].map((bar) => <i className={bar <= signal.bars ? "active" : ""} key={bar} />)}<strong>{signal.score10.toFixed(1)}</strong></span><small className="table-rating-ranks">W{game.week} ranks · #{rowRanks.get(away.id) ?? away.overallRank} vs #{rowRanks.get(home.id) ?? home.overallRank}</small></span></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <div className="matchup-ratings-cards" role="list">{visibleGames.map((game) => {
      const away = teamById.get(game.awayTeamId)!;
      const home = teamById.get(game.homeTeamId)!;
      const rowRanks = ranksForGame(game);
      return <MatchupCard key={game.id} game={game} away={away} home={home}
        awayDivision={divisionById.get(away.divisionId)} homeDivision={divisionById.get(home.divisionId)}
        awayRank={rowRanks.get(away.id) ?? away.overallRank} homeRank={rowRanks.get(home.id) ?? home.overallRank}
        awayRecord={{ overall: weeklyRecords.get(game.week)?.get(away.id) ?? "0-0" }} homeRecord={{ overall: weeklyRecords.get(game.week)?.get(home.id) ?? "0-0" }}
        signal={getMatchupSignal(game, lens === "live" ? rowRanks : undefined, ratingRange, teamCount)}
        featured={scheduleSignals.gotwIds.has(game.id)} featuredLabel="GOTW"
        dateLabel={`Week ${game.week}`} showCity={schedule.setup.display.cityNames} showVenue={false}
        teamHrefBase={`/season/${schedule.id}/team`} teamHrefFor={teamHrefFor} />;
    })}</div>
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
    // #18.2 — clamp 0–300 (parity with the simulator) so a fat-fingered 999999
    // can't poison standings/odds.
    return Number.isFinite(score) ? Math.round(Math.min(300, Math.max(0, score)) * 100) / 100 : undefined;
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
    queueMicrotask(() => {
      setRows(null);
      setWarnings([]);
      setError(null);
      setFileName("");
    });
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

function StandingsView({ schedule, playerStats, onUpdateTiebreakers, readOnly = false }: { schedule: GeneratedSchedule; playerStats?: GameDetailPlayerStat[]; onUpdateTiebreakers?: (settings: TiebreakerSettings) => void; readOnly?: boolean }) {
  return <StatsWorkspace schedule={schedule} playerStats={playerStats} onUpdateTiebreakers={onUpdateTiebreakers} readOnly={readOnly} />;
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
    queueMicrotask(() => {
      setAwayDraft(awayScore?.toString() ?? "");
      setHomeDraft(homeScore?.toString() ?? "");
    });
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
  mode = "board",
  playoffTab = "board",
  onChangePlayoffTab,
  teamHrefFor,
  onOpenGame,
}: {
  schedule: GeneratedSchedule;
  onUpdatePlayoffs: (patch: Partial<LeagueSetupInput["playoffs"]>) => void;
  onUpdatePlayoffGame: (game: PlayoffGame) => void;
  highlightedGame?: HighlightedGame;
  simulationMode?: boolean;
  /** "board" renders the Bracket/Picture tabs; "settings" renders only the config block (for the Settings page). */
  mode?: "board" | "settings";
  playoffTab?: "board" | "picture";
  onChangePlayoffTab?: (tab: "board" | "picture") => void;
  teamHrefFor?: (teamId: string) => string;
  onOpenGame?: (gameId: string) => void;
}) {
  const [roundBrandingOpen, setRoundBrandingOpen] = useState(false);
  const [boardSection, setBoardSection] = useState<"championship" | "consolation" | "placement">("championship");
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
  const placement = resolvePlayoffPlacementMode({ divisions: schedule.setup.divisions, conferences: schedule.setup.conferences, playoffs: settings });
  const byeCount = getPlayoffByeCount(fieldSize);
  const roundDate = (index: number) => getWeekDateLabel(schedule.setup.seasonYear, schedule.setup.weeks + index + 1).replace(`, ${schedule.setup.seasonYear}`, "");
  const displayedSeed = (item: NonNullable<ReturnType<typeof seed>>) => settings.seedDisplayMode === "standings-finish" ? item.standingsPosition : item.seed;
  const championshipVenueCopy = settings.championshipVenueMode === "neutral-site" ? "Neutral-site championship" : "Higher seed hosts the championship";
  const Slot = ({ number, host = false }: { number: number; host?: boolean }) => {
    const item = seed(number);
    const team = item ? teamById.get(item.teamId) : undefined;
    const standing = item ? playoffStandingsByTeam.get(item.teamId) : undefined;
    return <div className={`bracket-slot ${host ? "host" : ""}${team ? "" : " placeholder"}`} style={team ? { "--slot-spine": team.color } as React.CSSProperties : undefined}>{team && item ? <TeamIdentityBlock variant="stacked" compact team={team} division={divisionById.get(team.divisionId)} leagueRank={displayedSeed(item)} record={{ overall: item.record, division: standing ? `${standing.divisionWins}-${standing.divisionLosses}` : undefined }} showCity={showCity} href={teamHrefFor ? teamHrefFor(team.id) : `/season/${schedule.id}/team/${team.id}`} /> : <><b>{number}</b><span><strong>To be determined</strong><small>Projected seed</small></span></>}</div>;
  };
  const RoundHeading = ({ index }: { index: number }) => <h3 className="playoff-round-heading">{settings.roundLogoUrls?.[index] && <img src={settings.roundLogoUrls[index]} alt="" />}<span className="playoff-round-heading-copy"><span>{rounds[index] || `Round ${index + 1}`}</span><small>NFL Week {schedule.setup.weeks + index + 1} · {roundDate(index)}</small></span></h3>;
  const sideName = (side: "A" | "B") => {
    if (hasConferences(schedule.setup)) {
      const entry = seeds.find((item) => item.bracketSide === side);
      const conference = entry ? conferenceOfDivision(schedule.setup, entry.divisionId) : undefined;
      if (conference) return conference.name;
    }
    const divisionNames = [...new Set(seeds.filter((item) => item.bracketSide === side).map((item) => divisionById.get(item.divisionId)?.name).filter(Boolean))];
    return divisionNames.length ? divisionNames.join(" + ") : `Half ${side}`;
  };
  const sideDivision = (side: "A" | "B") => {
    const entry = seeds.find((item) => item.bracketSide === side);
    return entry ? divisionById.get(entry.divisionId) : undefined;
  };
  const mainGameBrandingLabel = (slot: typeof mainGameBrandingSlots[number]) => {
    const sameRound = mainGameBrandingSlots.filter((item) => item.roundIndex === slot.roundIndex);
    if (placement === "division-halves" && (schedule.setup.divisions.length === 2 || hasConferences(schedule.setup)) && sameRound.length === 2 && slot.roundIndex < rounds.length - 1) {
      return `${sideName(slot.gameIndex === 0 ? "A" : "B")} ${slot.roundName}`;
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
    return round.matchups.flatMap((matchup, gameIndex) => {
      const sourceId = `main-r${round.roundIndex + 1}-g${gameIndex + 1}`;
      const recorded = (schedule.playoffGames ?? []).find((game) => game.bracket === "main" && game.id === sourceId);
      const decided = recorded != null && recorded.homeScore != null && recorded.awayScore != null && recorded.homeScore !== recorded.awayScore;
      const winnerTeam = decided ? teamById.get(recorded!.homeScore! > recorded!.awayScore! ? recorded!.homeTeamId : recorded!.awayTeamId) : undefined;
      // Follow the actual advancer — a fixed-bracket upset keeps a lower seed in its slot —
      // falling back to the projected better seed while the game is unplayed.
      const advancerSeed = winnerTeam ? seeds.find((item) => item.teamId === winnerTeam.id)?.seed ?? Math.min(matchup.homeSeed, matchup.awaySeed) : Math.min(matchup.homeSeed, matchup.awaySeed);
      const targetIndex = nextRound.matchups.findIndex((next) => next.homeSeed === advancerSeed || next.awaySeed === advancerSeed);
      // No matching next-round slot: draw nothing rather than a confidently-wrong line to game 1.
      if (targetIndex < 0) return [];
      return [{
        id: `main-winner-r${round.roundIndex + 1}-g${gameIndex + 1}`,
        sourceGameId: sourceId,
        targetGameId: `main-r${round.roundIndex + 2}-g${targetIndex + 1}`,
        outcome: "winner" as const,
        pending: decided ? false : settings.reseedMode !== "fixed",
        color: winnerTeam ? accessibleAccentColor(winnerTeam.color, "#171d1a") : undefined,
        label: winnerTeam ? `${teamDisplayName(winnerTeam, showCity)} advances` : settings.reseedMode === "fixed" ? "Winner advances" : "Projected reseed path",
      }];
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
  const consolationInternalConnections = consolationConnections.filter((connection) => !connection.sourceGameId.startsWith("main-"));
  const hasConsolation = Boolean(consolationProjection);
  const PlayoffGameBrand = ({ roundIndex, gameIndex }: { roundIndex: number; gameIndex: number }) => {
    const gameId = `main-r${roundIndex + 1}-g${gameIndex + 1}`;
    const logoUrl = settings.gameLogoUrls?.[gameId] || settings.roundLogoUrls?.[roundIndex] || settings.logoUrl;
    if (!logoUrl) return null;
    return <span className="bracket-game-brand" title={`${rounds[roundIndex] ?? `Round ${roundIndex + 1}`} game ${gameIndex + 1} logo`}><EntityLogo color={settings.color} logoUrl={logoUrl} monogram={`G${gameIndex + 1}`} size={34} imagePresentation="bare" /></span>;
  };
  const simulatedMainGames = (schedule.playoffGames ?? []).filter((game) => game.bracket === "main");
  const seedByTeam = new Map(seeds.map((item) => [item.teamId, item.seed]));
  // The champion is only crowned when the actual final-round game is decided — not
  // whenever the highest *recorded* round happens to have a result (which would
  // wrongly crown a round-1 winner before later rounds are even played).
  const titleGame = simulatedMainGames.find((game) => game.roundIndex === projectedMainRounds.length - 1);
  const championId = titleGame && titleGame.homeScore != null && titleGame.awayScore != null && titleGame.homeScore !== titleGame.awayScore
    ? titleGame.homeScore > titleGame.awayScore ? titleGame.homeTeamId : titleGame.awayTeamId
    : undefined;
  const champion = championId ? teamById.get(championId) : undefined;
  const regularSeasonPlayedOut = schedule.weeks.length > 0 && schedule.weeks.every((week) => week.games.every((game) => game.homeScore != null && game.awayScore != null));
  const playoffsLive = settings.fieldStatus === "locked" || regularSeasonPlayedOut || simulatedMainGames.some((game) => game.homeScore != null && game.awayScore != null);
  const bracketMode: "projected" | "live" | "complete" = champion ? "complete" : playoffsLive ? "live" : "projected";
  const bracketModeNote = bracketMode === "complete" ? "Champion decided" : bracketMode === "live" ? "Playoffs are live — enter each result to advance the bracket" : "Projected — if the regular season ended today. Seeds firm up as the season finishes.";
  const bracketModeChip = bracketMode === "complete" ? "Final" : bracketMode === "live" ? "Live" : "Projected";
  const SimulatedPlayoffTeam = ({ teamId, score, winner }: { teamId: string; score?: number; winner: boolean }) => {
    const team = teamById.get(teamId);
    if (!team) return <div className="bracket-slot placeholder"><b>—</b><span><strong>To be determined</strong><small>Awaiting result</small></span></div>;
    const standing = playoffStandingsByTeam.get(teamId);
    const seedEntry = seeds.find((item) => item.teamId === teamId);
    return <div className={`bracket-slot result-slot ${winner ? "is-winner" : "is-loser"}`} style={{ "--slot-spine": team.color } as React.CSSProperties}>
      <TeamIdentityBlock variant="stacked" compact result={winner ? "winner" : "loser"} team={team} division={divisionById.get(team.divisionId)} leagueRank={seedByTeam.get(teamId) ?? team.overallRank} record={{ overall: seedEntry?.record ?? (standing ? formatRecord(standing) : "0-0"), division: standing ? `${standing.divisionWins}-${standing.divisionLosses}` : undefined }} showCity={showCity} href={teamHrefFor ? teamHrefFor(team.id) : `/season/${schedule.id}/team/${team.id}`} />
      <span className="bracket-score">{score ?? "—"}</span>
    </div>;
  };
  const playoffGameById = new Map(simulatedMainGames.map((game) => [game.id, game]));
  // A championship slot shows a real team only when that team actually occupies it
  // right now — a Wild Card seed (round 0), a bye entering the Divisional round
  // (round 1), or the decided winner of the feeding game. Otherwise the slot is a
  // "Winner of <game>" placeholder, never a projected advancer. (Byes enter at the
  // Divisional round per the league's single bye round.)
  const mainGameDecidedWinnerSeed = (roundIdx: number, gameIndex: number, homeSeed: number, awaySeed: number) => {
    const rec = playoffGameById.get(`main-r${roundIdx + 1}-g${gameIndex + 1}`);
    if (rec && rec.homeScore != null && rec.awayScore != null && rec.homeScore !== rec.awayScore) {
      return seedByTeam.get(rec.homeScore > rec.awayScore ? rec.homeTeamId : rec.awayTeamId) ?? Math.min(homeSeed, awaySeed);
    }
    return null;
  };
  const slotEntryRound = (seedNumber: number) => (seed(seedNumber)?.bye ? 1 : 0);
  // The prior-round game whose winner would fill a slot holding projected seed S.
  const mainFeedingGame = (roundIdx: number, slotSeed: number) => {
    const prev = projectedMainRounds[roundIdx - 1];
    if (!prev) return undefined;
    const gi = prev.matchups.findIndex((m, mi) => (mainGameDecidedWinnerSeed(roundIdx - 1, mi, m.homeSeed, m.awaySeed) ?? Math.min(m.homeSeed, m.awaySeed)) === slotSeed);
    if (gi < 0) return undefined;
    const id = `main-r${roundIdx}-g${gi + 1}`;
    const defaultName = prev.matchups.length > 1 ? `${rounds[roundIdx - 1] || `Round ${roundIdx}`} game ${gi + 1}` : (rounds[roundIdx - 1] || `Round ${roundIdx}`);
    return { id, name: gameDisplayName(id, defaultName), decided: mainGameDecidedWinnerSeed(roundIdx - 1, gi, prev.matchups[gi].homeSeed, prev.matchups[gi].awaySeed) != null };
  };
  const slotResolved = (roundIdx: number, slotSeed: number) => slotEntryRound(slotSeed) === roundIdx || Boolean(mainFeedingGame(roundIdx, slotSeed)?.decided);
  // Real team when the slot is genuinely occupied; otherwise a "Winner of <game>"
  // placeholder (fixed bracket) or a projected-seed placeholder (reseed).
  const ResolvedSlot = ({ roundIdx, number, host = false }: { roundIdx: number; number: number; host?: boolean }) => {
    if (slotResolved(roundIdx, number)) return <Slot number={number} host={host} />;
    const feed = mainFeedingGame(roundIdx, number);
    const fixedPath = settings.reseedMode === "fixed" && feed;
    return <div className={`bracket-slot placeholder result-placeholder${host ? " host" : ""}`}>
      <b>{fixedPath ? "W" : number}</b>
      <span><strong>{fixedPath ? `Winner of ${feed!.name}` : "To be determined"}</strong><small>{fixedPath ? "Updates after the prior result" : `Projected seed #${number}`}</small></span>
    </div>;
  };
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
    const side = bracketSide || seed(homeSeed)?.bracketSide;
    const halfDivision = placement === "division-halves" && side && roundIndex < projectedMainRounds.length - 1 ? sideDivision(side) : undefined;
    const sideCopy = placement === "division-halves" && side && roundIndex < projectedMainRounds.length - 1
      ? <>{halfDivision && <DivisionMark division={halfDivision} size={13} />}{sideName(side)} bracket</>
      : undefined;
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
    const canOpen = Boolean(recorded && onOpenGame);
    return <article
      className={`main-playoff-game ${played ? "is-final" : "is-projected"}${canOpen ? " is-openable" : ""}`}
      data-bracket-game-id={gameId}
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : undefined}
      aria-label={canOpen ? `Open box score for ${gameName}` : undefined}
      onClick={(event) => { if (canOpen && !(event.target instanceof HTMLElement && event.target.closest("a, button, input, select, textarea, summary"))) onOpenGame?.(gameId); }}
      onKeyDown={(event) => {
        if (!canOpen || (event.target instanceof HTMLElement && event.target.closest("a, button, input, select, textarea, summary"))) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenGame?.(gameId);
        }
      }}
      style={{ "--game-half-color": halfDivision?.color, "--game-half-accent": halfDivision ? accessibleAccentColor(halfDivision.color, "#171d1a") : undefined } as React.CSSProperties}
    >
      <header><PlayoffGameBrand roundIndex={roundIndex} gameIndex={gameIndex} /><span><strong>{gameName}</strong><small>{sideCopy || (played ? "Final result" : settings.reseedMode === "fixed" ? "Fixed bracket path" : "Projected path")}</small></span>{played && <em>FINAL</em>}</header>
      <div className="main-playoff-game-teams">{recorded ? <><SimulatedPlayoffTeam teamId={recorded.awayTeamId} score={recorded.awayScore} winner={awayWon} /><SimulatedPlayoffTeam teamId={recorded.homeTeamId} score={recorded.homeScore} winner={homeWon} /></> : <><ResolvedSlot roundIdx={roundIndex} number={homeSeed} host /><ResolvedSlot roundIdx={roundIndex} number={awaySeed} /></>}</div>
      {!simulationMode && playoffsLive && homeTeam && awayTeam && (recorded != null || (slotResolved(roundIndex, homeSeed) && slotResolved(roundIndex, awaySeed))) && <InlinePlayoffScoreEditor awayName={teamDisplayName(awayTeam, showCity)} homeName={teamDisplayName(homeTeam, showCity)} awayScore={recorded?.awayScore} homeScore={recorded?.homeScore} onSave={(awayScore, homeScore) => saveScore(awayScore, homeScore)} onClear={() => saveScore(undefined, undefined)} />}
      {homeTeam && <footer><span className="playoff-venue">{homeTeam.logoUrl ? <EntityLogo imagePresentation="bare" color={homeTeam.color} logoUrl={homeTeam.logoUrl} monogram={teamInitials(homeTeam)} size={18} /> : <MapPin />}{homeTeam.stadium}</span></footer>}
    </article>;
  };
  const championCapstone = (
    <div className={`champion-capstone${champion ? " is-crowned" : ""} playoff-theme-${settings.theme}`}>
      <span className="champion-capstone-glow" aria-hidden="true" />
      {champion ? <>
        <span className="champion-crest"><EntityLogo color={champion.color} logoUrl={champion.logoUrl} monogram={teamInitials(champion)} size={72} /></span>
        <span className="champion-copy"><span className="champion-eyebrow"><Trophy />League Champion</span><strong>{teamDisplayName(champion, showCity)}</strong><small>Wins the {settings.name}</small></span>
        <span className="champion-trophy"><Trophy /></span>
      </> : <>
        <span className="champion-trophy ghost"><Trophy /></span>
        <span className="champion-copy"><span className="champion-eyebrow">Projected champion</span><strong>Awaiting the title game</strong><small>{championshipCopy}</small></span>
      </>}
    </div>
  );
  return <div className="workspace-stack playoff-workspace" style={{ "--playoff-color": settings.color } as React.CSSProperties}>
    {mode === "settings" ? (<>
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
    </>) : (<>
    <div className="playoff-view-tabs" role="tablist" aria-label="Playoffs view">
      <button type="button" role="tab" aria-selected={playoffTab !== "picture"} className={playoffTab !== "picture" ? "active" : ""} onClick={() => onChangePlayoffTab?.("board")}><Trophy />Bracket</button>
      <button type="button" role="tab" aria-selected={playoffTab === "picture"} className={playoffTab === "picture" ? "active" : ""} onClick={() => onChangePlayoffTab?.("picture")}><LayoutList />Playoff Picture</button>
    </div>
    {playoffTab === "picture" ? <PlayoffPicturePanel schedule={normalizedSchedule} /> : (<div className="pp-board">
    <div className="pp-subtabs" role="tablist" aria-label="Bracket sections">
      <button type="button" role="tab" aria-selected={boardSection === "championship"} className={boardSection === "championship" ? "active" : ""} onClick={() => setBoardSection("championship")}><Trophy />Championship</button>
      {hasConsolation && <button type="button" role="tab" aria-selected={boardSection === "consolation"} className={boardSection === "consolation" ? "active" : ""} onClick={() => setBoardSection("consolation")}>Consolation</button>}
      <button type="button" role="tab" aria-selected={boardSection === "placement"} className={boardSection === "placement" ? "active" : ""} onClick={() => setBoardSection("placement")}>Final placement</button>
    </div>
    {boardSection === "championship" && <div className="pp-champ-section"><div className="postseason-map-scroll" aria-label="Championship bracket">
      <BracketConnectorLayer connections={mainConnections} className={`postseason-map-canvas rounds-${rounds.length}`}>
        <section className="championship-picture" aria-labelledby="championship-picture-title">
          <header className={`bracket-mode-${bracketMode}`}><span><Trophy /><span><small>TITLE BRACKET</small><strong id="championship-picture-title">Road to the championship</strong><small className="bracket-mode-note">{bracketModeNote}</small></span></span><em className={`bracket-mode-chip is-${bracketMode}`}>{bracketModeChip}</em></header>
          <div className="championship-bracket-grid" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(270px, 1fr))` }}>
            {projectedMainRounds.map((round) => <section key={round.roundIndex}><RoundHeading index={round.roundIndex} /><div className="main-playoff-round-games">{orderedRoundMatchups(round).map(({ matchup, gameIndex }) => <MainPlayoffGame key={`${round.roundIndex}-${gameIndex}`} roundIndex={round.roundIndex} gameIndex={gameIndex} homeSeed={matchup.homeSeed} awaySeed={matchup.awaySeed} bracketSide={matchup.bracketSide} />)}{round.roundIndex === 0 && round.byeSeeds.length > 0 && <div className="playoff-bye-strip"><strong>{round.byeSeeds.length} BYE{round.byeSeeds.length === 1 ? "" : "S"}</strong><span>{round.byeSeeds.map((byeSeed) => <Slot key={byeSeed} number={byeSeed} />)}</span></div>}</div></section>)}
          </div>
        </section>
      </BracketConnectorLayer>
    </div>{championCapstone}</div>}
    {boardSection === "consolation" && hasConsolation && <div className="postseason-map-scroll" aria-label="Consolation and placement bracket">
      <BracketConnectorLayer connections={consolationInternalConnections} className="postseason-map-canvas">
        <ConsolationBracket schedule={normalizedSchedule} onUpdateGame={simulationMode ? undefined : onUpdatePlayoffGame} />
      </BracketConnectorLayer>
    </div>}
    {boardSection === "placement" && <FinalPlacementTable schedule={normalizedSchedule} />}
    </div>)}
    </>)}
  </div>;
}

function PlatformSyncCard({
  schedule,
  canAccessPlatformSync,
  platformSyncLoading,
  onRefreshScores,
  onSaveConnection,
  onDisconnect,
  onConnect,
}: {
  schedule: GeneratedSchedule;
  canAccessPlatformSync: boolean;
  platformSyncLoading: boolean;
  onRefreshScores: () => void;
  onSaveConnection: (syncMode: PlatformSyncMode, swid?: string, espnS2?: string) => void;
  onDisconnect: () => void;
  onConnect: () => void;
}) {
  const connection = schedule.setup.platformConnection;
  const [syncMode, setSyncMode] = useState<PlatformSyncMode>(connection?.syncMode ?? "manual");
  const [swid, setSwid] = useState("");
  const [espnS2, setEspnS2] = useState("");
  useEffect(() => {
    queueMicrotask(() => setSyncMode(connection?.syncMode ?? "manual"));
  }, [connection?.syncMode]);
  if (!canAccessPlatformSync) {
    return <div className="platform-sync-card is-locked"><div><LockKeyhole /><span><strong>Platform Sync</strong><small>Auto-filling weekly scores from a public ESPN or Sleeper league is a Pro feature. Manual score entry is always available.</small></span></div></div>;
  }
  if (!connection) {
    return <div className="platform-sync-card"><div><Cloud /><span><strong>Platform Sync</strong><small>Connect a public ESPN or Sleeper league to auto-fill weekly scores. Manual entry always stays available.</small></span></div><div className="platform-sync-actions"><button type="button" className="button-primary" onClick={onConnect}><Cloud />Connect for scores</button><Link href="/build" className="button-secondary">Import a league</Link></div></div>;
  }
  const providerLabel = connection.provider === "espn" ? "ESPN" : "Sleeper";
  const lastSync = connection.lastSyncAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(connection.lastSyncAt)) : "Not synced yet";
  return <div className="platform-sync-panel">
    <div className="platform-sync-card">
      <div><img className="platform-sync-provider-mark" src={`/providers/${connection.provider}.png`} alt="" /><span><strong>{providerLabel} Platform Sync</strong><small>Generate here, update your fantasy platform, then sync scores back.</small></span></div>
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
        { value: "auto", label: "Automatic", description: "Refresh on open and in the background" },
      ]} />
      <button type="button" className="button-secondary visible" onClick={() => onSaveConnection(syncMode, swid, espnS2)}><Save />Save sync mode</button>
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

function HistoryMissingState({ season, onSync, syncing, canSync }: { season?: HistoryBrowserSeason; onSync: () => void; syncing: boolean; canSync: boolean }) {
  return <section className="history-missing-state" role="status">
    <History />
    <span>
      <strong>{season ? `${season.season} schedule history is not saved yet.` : "No saved history is available yet."}</strong>
      <small>Previous years show only saved LeagueWeaver seasons or real ESPN/Sleeper provider history.</small>
    </span>
    {canSync && <button type="button" onClick={onSync} disabled={syncing}>{syncing ? <LoaderCircle className="spin" /> : <RefreshCw />}Sync history</button>}
  </section>;
}

function SettingsView({ schedule, onOpenDraftRanking, onRegenerate, onUpdatePlayoffs, onUpdateTiebreakers, readOnly = false, canAccessPlatformSync, platformSyncLoading, onRefreshPlatformScores, onSavePlatformConnection, onDisconnectPlatform, onConnectPlatform, importHistory, importHistoryLoading, importHistoryError, onRefreshImportHistory }: {
  schedule: GeneratedSchedule;
  onOpenDraftRanking: () => void;
  onRegenerate: () => void;
  onUpdatePlayoffs: (patch: Partial<LeagueSetupInput["playoffs"]>) => void;
  onUpdateTiebreakers?: (settings: TiebreakerSettings) => void;
  readOnly?: boolean;
  canAccessPlatformSync: boolean;
  platformSyncLoading: boolean;
  onRefreshPlatformScores: () => void;
  onSavePlatformConnection: (syncMode: PlatformSyncMode, swid?: string, espnS2?: string) => void;
  onDisconnectPlatform: () => void;
  onConnectPlatform: () => void;
  importHistory: ImportHistoryEvent[];
  importHistoryLoading: boolean;
  importHistoryError: string | null;
  onRefreshImportHistory: () => void;
}) {
  const seeding = schedule.setup.priorSeason.entryMode === "manual" ? "Manual order" : schedule.setup.priorSeason.entryMode === "history" ? schedule.setup.priorSeason.source === "playoffs" ? "Last year’s playoff finish" : "Last year’s regular-season finish" : "Not used";
  const draftRankingPending = schedule.setup.weekOne.rankingSource === "draft-day" && getTeamsMissingDraftPlaces(schedule.setup).length > 0;
  return <div className="workspace-stack">
    <div className="settings-band"><div><Pencil /><span><strong>Schedule setup</strong><small>Changing league structure regenerates the complete matchup slate as a new revision.</small></span></div><button type="button" className="button-secondary" onClick={onRegenerate}><Pencil />Edit and regenerate</button></div>
    <PlatformSyncCard schedule={schedule} canAccessPlatformSync={canAccessPlatformSync} platformSyncLoading={platformSyncLoading} onRefreshScores={onRefreshPlatformScores} onSaveConnection={onSavePlatformConnection} onDisconnect={onDisconnectPlatform} onConnect={onConnectPlatform} />
    <ImportHistoryPanel events={importHistory} loading={importHistoryLoading} error={importHistoryError} onRefresh={onRefreshImportHistory} scheduleId={schedule.id} />
    <div className="settings-list">
      <div><span>League</span><strong>{schedule.setup.name}</strong></div>
      <div><span>Season format</span><strong>{schedule.setup.teams.length} teams · {schedule.setup.divisions.length} divisions · {schedule.setup.weeks} weeks</strong></div>
      <div><span>Seeding source</span><strong>{seeding}</strong></div>
      <div className="settings-action-row"><span>Week 1 ranking</span><span><strong>{schedule.setup.weekOne.rankingSource === "draft-day" ? draftRankingPending ? "Draft-day place · not set" : "Draft-day place · complete" : "Last season’s finish"}</strong>{draftRankingPending && <button type="button" onClick={onOpenDraftRanking}><FileSpreadsheet />Set draft ranking</button>}</span></div>
      <div><span>Revision</span><strong>Version {schedule.revision}</strong></div>
      <div><span>Generation seed</span><code>{schedule.seed}</code></div>
    </div>
    {onUpdateTiebreakers && (() => { const tb = normalizeTiebreakerSettings(schedule.setup.tiebreakers); return <>
      <div className="settings-band"><div><SlidersHorizontal /><span><strong>Standings tiebreakers</strong><small>{tb.league.map((rule) => TIEBREAKER_RULE_LABELS[rule]).join(" → ") || "No field rules; deterministic fallback only"}</small></span></div></div>
      <TiebreakerEditor settings={tb} onChange={onUpdateTiebreakers} disabled={readOnly} />
    </>; })()}
    <div className="settings-band"><div><Trophy /><span><strong>Playoffs</strong><small>Field size, bracket format, and postseason presentation for this league.</small></span></div></div>
    <PlayoffsView schedule={schedule} onUpdatePlayoffs={onUpdatePlayoffs} onUpdatePlayoffGame={() => undefined} mode="settings" />
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
    const update = () => queueMicrotask(() => setBeforeWeekTwo(Date.now() < Date.parse(cutoff)));
    update();
    const interval = window.setInterval(update, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [cutoff]);
  useEffect(() => {
    queueMicrotask(() => setDismissed(window.localStorage.getItem(draftRankingReminderDismissalKey(schedule.id)) === "true"));
  }, [schedule.id]);
  useEffect(() => {
    queueMicrotask(() => setValues(draftPlaceValues(schedule)));
  }, [schedule]);
  useEffect(() => {
    if (!openRequest) return;
    queueMicrotask(() => {
      setShowSettingsToken(false);
      setOpen(true);
    });
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

export function SeasonWorkspace({ initialView = "this-week" }: { initialView?: ViewKey }) {
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
  const [gameDetailId, setGameDetailId] = useState<string | null>(null);
  const [gameDetailPlayerStats, setGameDetailPlayerStats] = useState<GameDetailPlayerStat[]>([]);
  const [scoreImportPending, setScoreImportPending] = useState(false);
  const [scoreDiscardConfirmOpen, setScoreDiscardConfirmOpen] = useState(false);
  const [platformSyncLoading, setPlatformSyncLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<"share" | "notify" | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  // H2: publish status persists across reloads (fetched from /api/publish for
  // cloud schedules) so the public URL and Unpublish control are always
  // recoverable, not just visible for the few seconds the toast is on screen.
  const [publishStatus, setPublishStatus] = useState<{ published: boolean; url: string | null; slug: string | null } | null>(null);
  const [unpublishBusy, setUnpublishBusy] = useState(false);
  const [copiedPublishLink, setCopiedPublishLink] = useState(false);
  const [scorebarCollapsed, setScorebarCollapsed] = useState(false);
  // H1: irreversible actions (publish, save-run-back, regenerate) open this
  // confirm gate before running, so a reflexive click can't publish private data,
  // overwrite real scores, or wipe the slate.
  const [confirmAction, setConfirmAction] = useState<null | "share" | "commit" | "regenerate">(null);
  const [showRecap, setShowRecap] = useState(false);
  const [playoffTab, setPlayoffTab] = useState<"board" | "picture">("board");
  // Deep link from the account page (?recap=1) opens the recap straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("recap") !== "1") return;
    queueMicrotask(() => setShowRecap(true));
    const url = new URL(window.location.href);
    url.searchParams.delete("recap");
    window.history.replaceState({}, "", url);
  }, []);
  const [cloudRetry, setCloudRetry] = useState<CloudRetryState | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistoryEvent[]>([]);
  const [pastChampions, setPastChampions] = useState<PastChampion[]>([]);
  const [historySeasons, setHistorySeasons] = useState<HistoryBrowserSeason[]>([]);
  const [historySeasonKey, setHistorySeasonKey] = useState("current");
  const [historySyncing, setHistorySyncing] = useState(false);
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
    let cancelled = false;
    const local = loadSeasonById(params.id);
    if (local) {
      latestSchedule.current = local;
      cloudScheduleSnapshot.current = CLOUD_SCHEDULE_ID.test(local.id) ? JSON.stringify(local) : null;
      queueMicrotask(() => {
        if (cancelled) return;
        setSchedule(local);
        setSeasonLoadState("ready");
        setSeasonLoadError(null);
      });
    } else if (params.id && CLOUD_SCHEDULE_ID.test(params.id)) {
      queueMicrotask(() => {
        if (cancelled) return;
        setSeasonLoadState("loading");
        setSeasonLoadError(null);
      });
      fetch(`/api/seasons/${params.id}`).then(async (response) => {
        const payload = await response.json().catch(() => null) as { schedule?: GeneratedSchedule; error?: string } | null;
        if (!response.ok || !payload?.schedule) throw new Error(apiErrorMessage(response.status, payload?.error, "That saved season could not be opened."));
        const loaded = freezeCompletedRankHistory(normalizeSeason(payload.schedule));
        latestSchedule.current = loaded;
        cloudScheduleSnapshot.current = JSON.stringify(loaded);
        if (!cancelled) {
          setSchedule(loaded);
          setSeasonLoadState("ready");
        }
      }).catch((error) => {
        if (!cancelled) {
          setSchedule(null);
          setSeasonLoadState("error");
          setSeasonLoadError(error instanceof Error ? error.message : "That saved season could not be opened.");
        }
      });
    } else {
      queueMicrotask(() => {
        if (cancelled) return;
        setSeasonLoadState("ready");
        setSeasonLoadError(null);
      });
    }
    fetch(`/api/entitlements${params.id ? `?scheduleId=${encodeURIComponent(params.id)}` : ""}`).then((response) => response.json()).then(setEntitlements).catch(() => undefined);
    return () => { cancelled = true; };
  }, [params.id]);
  // H2: check whether this cloud schedule already has a live public page, so
  // the "Public page is live" panel survives a reload instead of only ever
  // showing right after a fresh Publish click.
  useEffect(() => {
    if (!schedule || !CLOUD_SCHEDULE_ID.test(schedule.id)) {
      queueMicrotask(() => setPublishStatus(null));
      return;
    }
    let cancelled = false;
    fetch(`/api/publish?scheduleId=${encodeURIComponent(schedule.id)}`)
      .then((response) => response.json().catch(() => ({})) as Promise<{ published?: boolean; url?: string; slug?: string }>)
      .then((payload) => { if (!cancelled) setPublishStatus({ published: Boolean(payload.published), url: payload.url ?? null, slug: payload.slug ?? null }); })
      .catch(() => { if (!cancelled) setPublishStatus({ published: false, url: null, slug: null }); });
    return () => { cancelled = true; };
  }, [schedule?.id]);
  useEffect(() => {
    if (!schedule) {
      queueMicrotask(() => setGameDetailPlayerStats([]));
      return;
    }
    let cancelled = false;
    const applyRows = (rows: GameDetailPlayerStat[]) => { if (!cancelled) setGameDetailPlayerStats(rows); };
    try {
      const cached = window.localStorage.getItem(`${GAME_DETAIL_CACHE_PREFIX}${schedule.id}`);
      if (cached) {
        const parsed = JSON.parse(cached) as { rows?: GameDetailPlayerStat[] } | GameDetailPlayerStat[];
        applyRows(Array.isArray(parsed) ? parsed : parsed.rows ?? []);
      } else {
        applyRows([]);
      }
    } catch {
      applyRows([]);
    }
    if (CLOUD_SCHEDULE_ID.test(schedule.id)) {
      fetch(`/api/seasons/${encodeURIComponent(schedule.id)}/player-stats`)
        .then((response) => response.ok ? response.json() : null)
        .then((payload: { rows?: GameDetailPlayerStat[] } | null) => {
          if (!cancelled && payload?.rows) setGameDetailPlayerStats(payload.rows);
        })
        .catch(() => undefined);
    }
    return () => { cancelled = true; };
  }, [schedule?.id]);
  // Surface the "save to an account" nudge for device-only schedules unless this
  // one was already dismissed. Cloud schedules are safe, so they never nudge.
  useEffect(() => {
    queueMicrotask(() => {
      if (!schedule || CLOUD_SCHEDULE_ID.test(schedule.id)) { setSaveNudgeDismissed(true); return; }
      try {
        setSaveNudgeDismissed(window.localStorage.getItem(`leagueweaver:v3:save-nudge:${schedule.id}`) === "dismissed");
      } catch {
        setSaveNudgeDismissed(false);
      }
    });
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
      setPastChampions([]);
      setHistorySeasons([]);
      setImportHistoryError(null);
      return;
    }
    setImportHistoryLoading(true);
    setImportHistoryError(null);
    try {
      const response = await fetch(`/api/platform/history?scheduleId=${encodeURIComponent(schedule.id)}&include=browser`);
      const payload = await response.json().catch(() => ({})) as { events?: ImportHistoryEvent[]; champions?: PastChampion[]; history?: HistoryBrowserSeason[]; error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, payload.error, "Import history could not be loaded."));
      setImportHistory(payload.events ?? []);
      setPastChampions(payload.champions ?? []);
      setHistorySeasons(payload.history ?? []);
    } catch (caught) {
      setImportHistoryError(caught instanceof Error ? caught.message : "Import history could not be loaded.");
    } finally {
      setImportHistoryLoading(false);
    }
  };
  useEffect(() => {
    if (!schedule || !CLOUD_SCHEDULE_ID.test(schedule.id)) {
      queueMicrotask(() => { setImportHistory([]); setPastChampions([]); setHistorySeasons([]); setHistorySeasonKey("current"); });
      return;
    }
    queueMicrotask(() => setHistorySeasonKey(new URLSearchParams(window.location.search).get("season") || "current"));
    queueMicrotask(() => void loadImportHistory());
  }, [schedule?.id]);
  useEffect(() => {
    const week = Number(searchParams.get("week"));
    if (Number.isInteger(week) && week >= 1 && week <= 17) queueMicrotask(() => setSelectedWeek(week));
    const requestedViewValue = searchParams.get("view");
    if (requestedViewValue === "scores") {
      queueMicrotask(() => {
        setView("league-schedule");
        setScoreModalOpen(true);
      });
    }
    if (requestedViewValue === "fairness") queueMicrotask(() => setView("league-schedule"));
    const requestedView = (requestedViewValue === "schedule" || requestedViewValue === "scores" || requestedViewValue === "fairness" ? "league-schedule" : requestedViewValue) as ViewKey | null;
    const requestedHistorySeason = searchParams.get("season");
    const historyTargetView = requestedView ?? "league-schedule";
    if (HISTORY_COMPATIBLE_VIEWS.has(historyTargetView)) queueMicrotask(() => setHistorySeasonKey(requestedHistorySeason || "current"));
    if (requestedView && VIEW_ITEMS.some((item) => item.key === requestedView) && (requestedView !== "results" || (schedule && getLatestFinalWeek(schedule)))) queueMicrotask(() => setView(requestedView));
    const gameId = decodeURIComponent(window.location.hash.slice(1));
    const medalRank = Number(searchParams.get("medal"));
    queueMicrotask(() => setHighlightedGame(gameId ? {
      id: gameId,
      medalRank: Number.isInteger(medalRank) && medalRank >= 1 && medalRank <= 3 ? medalRank : undefined,
      medalCategory: searchParams.get("medalCategory") || undefined,
    } : null));
  }, [searchParams]);
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
    queueMicrotask(() => {
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
    });
  }, [schedule?.id]);
  useEffect(() => {
    if (!schedule || !simulationLoaded) return;
    const key = `leagueweaver:v3:simulation:${schedule.id}`;
    if (simulation) {
      window.sessionStorage.setItem(key, JSON.stringify(simulation));
      queueMicrotask(() => setSavedSimulation(simulation));
    }
  }, [schedule?.id, simulation, simulationLoaded]);
  const canAccessScorekeeping = true;
  const canAccessPlatformSync = true;
  const activeSchedule = useMemo(() => schedule && simulation ? materializeSimulationSchedule(simulation) : schedule, [schedule, simulation]);
  const historyOptions = useMemo(() => [
    { value: "current", label: `${schedule?.setup.seasonYear ?? "Current"}`, description: "Current LeagueWeaver season" },
    ...historySeasons
      .filter((season) => season.season !== schedule?.setup.seasonYear)
      .map((season) => ({ value: String(season.season), label: String(season.season), description: `${season.provider.toUpperCase()} saved history` })),
  ], [historySeasons, schedule?.setup.seasonYear]);
  const effectiveHistorySeasonKey = historySeasonKey === "current" ? "current" : historySeasonKey;
  const selectedHistorySeason = useMemo(() => effectiveHistorySeasonKey === "current" ? undefined : historySeasons.find((season) => String(season.season) === effectiveHistorySeasonKey), [effectiveHistorySeasonKey, historySeasons]);
  const historySchedule = useMemo(() => schedule && selectedHistorySeason ? buildHistoricalSchedule(schedule, selectedHistorySeason) : null, [schedule, selectedHistorySeason]);
  const historyPlayerStats = useMemo(() => schedule && selectedHistorySeason ? buildHistoricalPlayerRows(schedule, selectedHistorySeason) : [], [schedule, selectedHistorySeason]);
  const historyViewActive = Boolean(selectedHistorySeason && HISTORY_COMPATIBLE_VIEWS.has(view));
  const workspaceSchedule = historyViewActive && historySchedule ? historySchedule : activeSchedule;
  const workspacePlayerStats = historyViewActive ? historyPlayerStats : gameDetailPlayerStats;
  useEffect(() => {
    if (!workspaceSchedule || !selectedTeamId || workspaceSchedule.setup.teams.some((team) => team.id === selectedTeamId)) return;
    queueMicrotask(() => setSelectedTeamId(workspaceSchedule.setup.teams[0]?.id ?? ""));
  }, [workspaceSchedule, selectedTeamId]);
  const latestRecapWeek = activeSchedule ? getLatestFinalWeek(activeSchedule) : null;
  const visibleViewItems = VIEW_ITEMS.filter((item) => item.key !== "results" || latestRecapWeek);
  const openGameDetail = (gameId: string) => {
    if (!workspaceSchedule) return;
    const gameWeek = workspaceSchedule.weeks.find((item) => item.games.some((game) => game.id === gameId));
    if (gameWeek) setSelectedWeek(gameWeek.weekNumber);
    setHighlightedGame({ id: gameId });
    setGameDetailId(gameId);
  };
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
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectAutoOpened, setConnectAutoOpened] = useState(false);
  const [saveConnectionSetup, setSaveConnectionSetup] = useState<LeagueSetupInput | null>(null);
  const pendingSyncRef = useRef(false);
  const connectParamRef = useRef(false);
  // Fresh manual leagues arrive from the builder with ?connect=scores — open the
  // connect flow once so scores are one step away right after generating. It's
  // optional: dismissing it (labelled "Skip for now") strips the param below.
  useEffect(() => {
    if (connectParamRef.current) return;
    if (searchParams.get("connect") === "scores" && schedule && !schedule.setup.platformConnection && !simulation) {
      connectParamRef.current = true;
      queueMicrotask(() => {
        setConnectOpen(true);
        setConnectAutoOpened(true);
      });
    }
  }, [searchParams, schedule, simulation]);
  // Close the connect flow and drop ?connect from the URL so a refresh (or the
  // effect above) never re-opens what the commissioner just skipped.
  const closeConnect = () => {
    setConnectOpen(false);
    setConnectAutoOpened(false);
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("connect")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("connect");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  };
  useEffect(() => {
    const connection = schedule?.setup.platformConnection;
    if (!connection || connection.syncMode === "manual" || !canAccessPlatformSync || platformSyncLoading || simulation) return;
    const key = `${schedule.id}:${connection.provider}:${connection.providerLeagueId}:${connection.syncMode}:${selectedWeek}`;
    if (platformAutoRefreshKey.current === key) return;
    platformAutoRefreshKey.current = key;
    void refreshPlatformScores();
  }, [schedule?.id, schedule?.setup.platformConnection, selectedWeek, canAccessPlatformSync, platformSyncLoading, simulation]);
  // Manual syncMode skips the auto-refresh above, so pull scores once right after
  // a fresh connection lands (the connection is applied via setSchedule, so we
  // wait for it to be present rather than reading a stale closure).
  useEffect(() => {
    if (!pendingSyncRef.current || !schedule?.setup.platformConnection || platformSyncLoading) return;
    pendingSyncRef.current = false;
    void refreshPlatformScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule?.setup.platformConnection, platformSyncLoading]);
  if (!schedule || !activeSchedule) {
    if (seasonLoadState === "loading") return <div className="empty-season" role="status"><BrandLockup /><LoaderCircle className="spin" /><h1>Loading season…</h1><p>Opening the latest saved schedule and checking your access.</p></div>;
    if (seasonLoadState === "error") return <div className="empty-season" role="alert"><BrandLockup /><Cloud /><h1>Season could not open.</h1><p>{seasonLoadError || "The saved season was not available. Your local work is still safe on this device if it was created here."}</p><Link href="/account" className="button-primary">Open account</Link><Link href="/build" className="button-secondary">Open schedule builder</Link></div>;
    return <div className="empty-season"><BrandLockup /><CalendarDays /><h1>No generated season yet.</h1><p>Build your league first, then your complete schedule will appear here.</p><Link href="/build" className="button-primary">Open schedule builder</Link></div>;
  }
  const scoreBarSchedule = workspaceSchedule ?? activeSchedule;
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
  async function syncLeagueHistory() {
    const connection = schedule?.setup.platformConnection;
    if (!connection || !CLOUD_SCHEDULE_ID.test(schedule.id) || historySyncing || simulation) return;
    setHistorySyncing(true);
    try {
      const response = await fetch("/api/platform/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: schedule.id, provider: connection.provider, identifier: connection.providerLeagueId, seasonYear: connection.seasonYear, populate: true }),
      });
      const payload = await response.json().catch(() => ({})) as { rowsWritten?: number; warnings?: string[]; availableHistoryYears?: number[]; error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, payload.error, "History could not be synced."));
      await loadImportHistory();
      const years = payload.availableHistoryYears?.length ? ` ${payload.availableHistoryYears.join(", ")}.` : ".";
      const warning = payload.warnings?.[0] ? ` ${payload.warnings[0]}` : "";
      setNotice(`History sync finished for${years}${warning}`);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "History could not be synced.");
    } finally {
      setHistorySyncing(false);
      window.setTimeout(() => setNotice(null), 6200);
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
      const result = await response.json().catch(() => ({})) as { authType?: PlatformConnection["authType"]; historySync?: HistorySyncResponse; error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, result.error, "Platform connection could not be saved."));
      updatePlatformConnection({ syncMode, authType: result.authType ?? connection.authType, status: "ready" });
      await loadImportHistory();
      setNotice(`Platform connection saved.${historySyncNotice(result.historySync)}`);
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
  // Manual league → public platform: write the mapped provider ids onto the
  // teams and attach the connection. Score sync joins on Team.providerId, so this
  // is all the pull needs. The first refresh fires from the pending-sync effect.
  const applyPlatformConnection = (assignments: Record<string, string>, connection: PlatformConnection) => {
    const updatedSetup: LeagueSetupInput = {
      ...schedule.setup,
      teams: schedule.setup.teams.map((team) => assignments[team.id] ? { ...team, providerId: assignments[team.id] } : team),
      platformConnection: connection,
    };
    setSchedule((current) => current ? {
      ...current,
      setup: {
        ...current.setup,
        teams: current.setup.teams.map((team) => assignments[team.id] ? { ...team, providerId: assignments[team.id] } : team),
        platformConnection: connection,
      },
    } : current);
    closeConnect();
    pendingSyncRef.current = true;
    if (entitlements.signedIn && CLOUD_SCHEDULE_ID.test(schedule.id)) {
      void fetch("/api/platform/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: schedule.id, provider: connection.provider, providerLeagueId: connection.providerLeagueId, seasonYear: connection.seasonYear, syncMode: connection.syncMode }),
      }).then(async (response) => {
        const result = await response.json().catch(() => ({})) as { historySync?: HistorySyncResponse };
        await loadImportHistory();
        const historyNotice = historySyncNotice(result.historySync);
        if (historyNotice) setNotice(`Connected to ${connection.provider === "espn" ? "ESPN" : "Sleeper"}.${historyNotice} Pulling scores…`);
      }).catch(() => undefined);
    }
    setNotice(`Connected to ${connection.provider === "espn" ? "ESPN" : "Sleeper"}. Pulling scores…`);
    window.setTimeout(() => setNotice(null), 4200);
    // Offer to remember this connection on the saved league so next season's
    // build starts pre-connected (signed-in only — saved leagues are account-scoped).
    if (entitlements.signedIn) setSaveConnectionSetup(updatedSetup);
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
    const cleared = game.homeScore == null && game.awayScore == null;
    const playoffGames = cleared
      ? existing.filter((item) => item.id !== game.id)
      : existing.some((item) => item.id === game.id)
        ? existing.map((item) => item.id === game.id ? game : item)
        : [...existing, game];
    return { ...current, playoffGames };
  });
  const onUpdateTiebreakers = (tiebreakers: TiebreakerSettings) => setSchedule((current) => current ? normalizeSeason({ ...current, rankHistory: undefined, setup: { ...current.setup, tiebreakers } }) : current);
  const countScoredGames = (target: GeneratedSchedule) =>
    target.weeks.reduce((sum, week) => sum + week.games.filter((game) => game.homeScore != null && game.awayScore != null).length, 0);
  const commitSimulation = () => {
    if (!simulation) return;
    const committed = freezeCompletedRankHistory(materializeSimulationSchedule(simulation));
    // H11 safety net: never let a commit carry fewer real scores than the season
    // already has. Restart re-seeds the recorded set, so a healthy sandbox always
    // clears this; a sandbox that somehow dropped it is refused, not saved blank.
    if (countScoredGames(committed) < countScoredGames(schedule)) {
      setNotice("Save blocked to protect your recorded scores — the simulation is missing real results. Discard it and try again.");
      window.setTimeout(() => setNotice(null), 6000);
      return;
    }
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
    router.push(hrefWithHistorySeason(`/season/${schedule.id}`, { week }));
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
      const payload = await response.json().catch(() => ({})) as { url?: string; slug?: string; error?: string };
      if (!response.ok || !payload.url) return setNotice(apiErrorMessage(response.status, payload.error, "This schedule could not be published."));
      setPublishStatus({ published: true, url: payload.url, slug: payload.slug ?? null });
      try { await navigator.clipboard.writeText(payload.url); setNotice("Public schedule link copied."); }
      catch { setNotice(`Public schedule ready: ${payload.url}`); }
      window.setTimeout(() => setNotice(null), 5200);
    } finally {
      setActionBusy(null);
    }
  };
  // Unpublish a live public page (H2). Reversible: publishing again reuses the
  // same slug (see the upsert in /api/publish), so this only toggles visibility.
  const unpublish = async () => {
    if (unpublishBusy || !publishStatus?.published || !CLOUD_SCHEDULE_ID.test(schedule.id)) return;
    setUnpublishBusy(true);
    try {
      const response = await fetch(`/api/publish?scheduleId=${encodeURIComponent(schedule.id)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({})) as { unpublished?: boolean; error?: string };
      if (!response.ok || !payload.unpublished) { setNotice(apiErrorMessage(response.status, payload.error, "Sharing could not be disabled.")); return; }
      setPublishStatus({ published: false, url: null, slug: null });
      setNotice("Public page unpublished.");
      window.setTimeout(() => setNotice(null), 5200);
    } finally {
      setUnpublishBusy(false);
    }
  };
  // Publish (saving to the cloud first if needed) and return the public link + slug
  // so the recap's Share button can hand them to the native share sheet.
  const shareForReveal = async (): Promise<{ url?: string; slug?: string; error?: string }> => {
    let cloudSchedule = schedule;
    try {
      if (!CLOUD_SCHEDULE_ID.test(schedule.id)) {
        const saved = await save();
        if (!saved) return { error: "Sign in and save this schedule to share it." };
        cloudSchedule = saved;
      }
      const response = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: cloudSchedule.id }) });
      const payload = await response.json().catch(() => ({})) as { url?: string; slug?: string; error?: string };
      if (!response.ok || !payload.url) return { error: apiErrorMessage(response.status, payload.error, "This schedule could not be published.") };
      setPublishStatus({ published: true, url: payload.url, slug: payload.slug ?? null });
      return { url: payload.url, slug: payload.slug };
    } catch {
      return { error: "Something went wrong publishing your schedule." };
    }
  };
  const historyViewHref = (key: ViewKey) => {
    const params = new URLSearchParams();
    if (key !== "league-schedule") params.set("view", key);
    if (HISTORY_COMPATIBLE_VIEWS.has(key) && effectiveHistorySeasonKey !== "current") params.set("season", effectiveHistorySeasonKey);
    const query = params.toString();
    return `/season/${schedule.id}${query ? `?${query}` : ""}`;
  };
  const selectHistorySeason = (seasonKey: string) => {
    setHistorySeasonKey(seasonKey);
    if (!HISTORY_COMPATIBLE_VIEWS.has(view)) return;
    const params = new URLSearchParams(window.location.search);
    if (view === "league-schedule") params.delete("view");
    else params.set("view", view);
    if (seasonKey === "current") params.delete("season");
    else params.set("season", seasonKey);
    const query = params.toString();
    window.history.replaceState(null, "", `/season/${schedule.id}${query ? `?${query}` : ""}${window.location.hash}`);
  };
  const historySeasonParam = historyViewActive && effectiveHistorySeasonKey !== "current" ? `season=${encodeURIComponent(effectiveHistorySeasonKey)}` : "";
  const hrefWithHistorySeason = (path: string, extra?: Record<string, string | number>) => {
    const params = new URLSearchParams(historySeasonParam);
    for (const [key, value] of Object.entries(extra ?? {})) params.set(key, String(value));
    const query = params.toString();
    return `${path}${query ? `?${query}` : ""}`;
  };
  const selectView = (item: typeof VIEW_ITEMS[number]) => {
    setScoreModalOpen(false);
    if (!HISTORY_COMPATIBLE_VIEWS.has(item.key)) setHistorySeasonKey("current");
    setView(item.key);
    if (HISTORY_COMPATIBLE_VIEWS.has(item.key)) router.push(historyViewHref(item.key));
    else if (item.key === "team-schedule") {
      setSelectedTeamId("");
      router.push(`/season/${schedule.id}?view=team-schedule`);
    } else router.push(`/season/${schedule.id}?view=${item.key}`);
  };
  const selectTeamSchedule = (teamId: string) => {
    setSelectedTeamId(teamId);
    setView("team-schedule");
    router.push(teamId ? hrefWithHistorySeason(`/season/${schedule.id}/team/${teamId}`) : hrefWithHistorySeason(`/season/${schedule.id}`, { view: "team-schedule" }));
  };
  const currentTitle = VIEW_ITEMS.find((item) => item.key === view)?.label ?? "League Schedule";
  const canAccessPlayoffs = true; // Playoff rounds ship to all users on the schedule page.
  const openScoreEntry = (weekNumber: number) => {
    setSelectedWeek(Math.min(weekNumber, schedule.setup.weeks));
    setScoreModalOpen(true);
  };
  const openPlayoffScores = () => {
    setView("playoffs");
    router.push(`/season/${schedule.id}?view=playoffs`);
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
  const scoreBarTeamById = new Map(scoreBarSchedule.setup.teams.map((team) => [team.id, team]));
  const scoreBarRankByTeam = new Map((getEnteringWeekRankSnapshot(scoreBarSchedule, selectedWeek)?.rows ?? []).map((row) => [row.teamId, row.rank]));
  const scoreBarDivisionById = new Map(scoreBarSchedule.setup.divisions.map((division) => [division.id, division]));
  const scoreBarWeek = scoreBarSchedule.weeks.find((item) => item.weekNumber === selectedWeek) ?? scoreBarSchedule.weeks[0];
  const modalWeek = gameDetailId && workspaceSchedule ? workspaceSchedule.weeks.find((week) => week.games.some((game) => game.id === gameDetailId)) : undefined;
  const modalPlayoffGame = gameDetailId && workspaceSchedule ? (workspaceSchedule.playoffGames ?? []).find((game) => game.id === gameDetailId) : undefined;
  const modalGames = modalWeek?.games ?? (modalPlayoffGame && workspaceSchedule ? (workspaceSchedule.playoffGames ?? []).filter((game) => game.week === modalPlayoffGame.week && game.bracket === modalPlayoffGame.bracket).sort((left, right) => (left.gameNumber ?? 0) - (right.gameNumber ?? 0) || left.id.localeCompare(right.id)) : undefined);
  const modalGameIndex = modalGames?.findIndex((game) => game.id === gameDetailId) ?? -1;
  const modalGameLabel = (game?: ScheduledGame) => {
    if (!game || !workspaceSchedule) return "";
    const away = workspaceSchedule.setup.teams.find((team) => team.id === game.awayTeamId);
    const home = workspaceSchedule.setup.teams.find((team) => team.id === game.homeTeamId);
    return away && home ? `${teamDisplayName(away, workspaceSchedule.setup.display?.cityNames !== false)} at ${teamDisplayName(home, workspaceSchedule.setup.display?.cityNames !== false)}` : "game";
  };
  const modalPreviousGame = modalGames && modalGameIndex > 0 ? modalGames[modalGameIndex - 1] : undefined;
  const modalNextGame = modalGames && modalGameIndex >= 0 && modalGameIndex < modalGames.length - 1 ? modalGames[modalGameIndex + 1] : undefined;
  const canSyncHistory = Boolean(schedule.setup.platformConnection && CLOUD_SCHEDULE_ID.test(schedule.id) && !simulation);
  const showHistoryPicker = HISTORY_COMPATIBLE_VIEWS.has(view);
  return <main className={`workspace-page ${simulation ? "simulation-mode" : ""} ${scoreBarWeek ? "has-scorebar" : ""} ${scoreBarWeek && scorebarCollapsed ? "scorebar-collapsed" : ""}`} style={{ "--brand": schedule.setup.color, "--brand-on": readableTextColor(schedule.setup.color) } as CSSProperties}>
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
    {showRecap && <GenerationReveal schedule={schedule} mode="replay" onComplete={() => setShowRecap(false)} onShare={shareForReveal} />}
    {gameDetailId && <GameDetailSheet
      schedule={workspaceSchedule ?? activeSchedule}
      gameId={gameDetailId}
      playerStats={workspacePlayerStats}
      winProbability={simulationProbabilityByGame[gameDetailId]}
      navigation={modalGames ? {
        previous: modalPreviousGame ? { id: modalPreviousGame.id, label: modalGameLabel(modalPreviousGame) } : undefined,
        next: modalNextGame ? { id: modalNextGame.id, label: modalGameLabel(modalNextGame) } : undefined,
        onSelect: openGameDetail,
      } : undefined}
      onClose={() => setGameDetailId(null)}
    />}
    <header className="workspace-topbar"><BrandLockup /><div className="workspace-top-actions"><AccountIdentity identity={entitlements} plan={entitlements.plan} /></div></header>
    {scoreBarWeek && <WeekScoreBar
      weeks={scoreBarSchedule.weeks}
      seasonYear={scoreBarSchedule.setup.seasonYear}
      getTeam={(id) => scoreBarTeamById.get(id)}
      getDivision={(id) => scoreBarDivisionById.get(id)}
      getRank={(id) => scoreBarRankByTeam.get(id)}
      displayCityNames={activeSchedule.setup.display?.cityNames !== false}
      onSelectGame={(gameId) => { openGameDetail(gameId); }}
      onCollapsedChange={setScorebarCollapsed}
      teamCount={scoreBarSchedule.setup.teams.length}
    />}
    <div className="workspace-shell">
      <aside className="workspace-rail"><nav aria-label="Season workspace">{visibleViewItems.map((item) => { const Icon = item.icon; return <button type="button" key={item.key} aria-label={item.label} title={item.label} className={view === item.key ? "active" : ""} onClick={() => selectView(item)}><Icon /><span>{item.label}</span></button>; })}</nav><div className="rail-bottom"><WorkspaceSwitcher current={{ id: schedule.id, name: schedule.setup.name, seasonYear: schedule.setup.seasonYear, color: schedule.setup.color, logoUrl: schedule.setup.logoUrl, initials: schedule.setup.initials }} signedIn={Boolean(entitlements.signedIn)} /></div></aside>
      <section className={`workspace-main ${selectedTeamColor ? "team-workspace-branded" : ""}`} style={workspaceMainStyle}>
        <div className="workspace-toolbar">
          <div>
            <span className="workspace-breadcrumb">{schedule.setup.abbreviation} / {historyViewActive && selectedHistorySeason ? selectedHistorySeason.season : schedule.setup.seasonYear}</span>
            <h1>{currentTitle}</h1>
          </div>
          <div className="toolbar-actions">
            {showHistoryPicker && <CustomSelect
              label={`Select ${currentTitle} season`}
              value={effectiveHistorySeasonKey}
              options={historyOptions}
              onChange={selectHistorySeason}
              showSelectedDescription={false}
            />}
            <button type="button" title={simulation ? "Print simulated PDF entry sheet" : "Print PDF entry sheet"} disabled={pdfBusy} aria-busy={pdfBusy} onClick={async () => { if (pdfBusy) return; setPdfBusy(true); try { await downloadSchedulePdf(workspaceSchedule ?? activeSchedule); } catch { setNotice("Couldn’t build the PDF entry sheet. Please try again."); } finally { setPdfBusy(false); } }}>{pdfBusy ? <LoaderCircle className="spin" /> : <FileDown />}{pdfBusy ? "Building…" : "PDF"}</button>
            <FloatingPopover className="toolbar-more" label="More schedule actions" trigger={<><MoreHorizontal /><span>More</span><ChevronDown /></>} menuClassName="toolbar-more-menu">
              <button type="button" onClick={() => setShowRecap(true)}><Sparkles />Recap</button>
              <button type="button" onClick={() => downloadCsv(workspaceSchedule ?? activeSchedule)}><Download />CSV</button>
              {canSyncHistory && <button type="button" onClick={() => void syncLeagueHistory()} disabled={historySyncing}>{historySyncing ? <LoaderCircle className="spin" /> : <History />}Sync history</button>}
            </FloatingPopover>
          </div>
        </div>
        <div className="workspace-notice" role="status" aria-live="polite">{notice && <><Cloud />{notice}</>}</div>
        {publishStatus && CLOUD_SCHEDULE_ID.test(schedule.id) && (publishStatus.published ? (
          <section className="publish-panel is-live" role="status" aria-label="Public schedule status">
            <span className="publish-status-dot" aria-hidden="true" />
            <span className="publish-panel-copy">
              <strong>Public page is live</strong>
              <input type="text" readOnly value={publishStatus.url ?? ""} onFocus={(event) => event.currentTarget.select()} aria-label="Public schedule link" />
            </span>
            <div className="publish-panel-actions">
              <button type="button" className="button-secondary" onClick={async () => { if (!publishStatus.url) return; try { await navigator.clipboard.writeText(publishStatus.url); setCopiedPublishLink(true); window.setTimeout(() => setCopiedPublishLink(false), 2400); } catch { setNotice(`Public schedule ready: ${publishStatus.url}`); } }}>{copiedPublishLink ? <Check /> : <Copy />}{copiedPublishLink ? "Copied" : "Copy link"}</button>
              <a className="button-secondary" href={publishStatus.url ?? "#"} target="_blank" rel="noreferrer"><ExternalLink />Open</a>
              <button type="button" className="button-danger publish-panel-unpublish" disabled={unpublishBusy} onClick={() => void unpublish()}>{unpublishBusy ? <LoaderCircle className="spin" /> : <X />}Unpublish</button>
            </div>
          </section>
        ) : (
          <section className="publish-panel is-idle" role="status" aria-label="Public schedule status">
            <span className="publish-status-dot is-off" aria-hidden="true" />
            <span className="publish-panel-copy"><strong>Not published</strong><small>Publish to share a public schedule page with anyone.</small></span>
            <button type="button" className="button-secondary" disabled={actionBusy !== null} onClick={() => setConfirmAction("share")}>{actionBusy === "share" ? <LoaderCircle className="spin" /> : <Share2 />}Publish</button>
          </section>
        ))}
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
          {view === "this-week" && <ThisWeekWorkspace schedule={activeSchedule} playerStats={gameDetailPlayerStats} simulationProbabilities={simulationProbabilityByGame} onOpenGame={openGameDetail} onOpenRecap={latestRecapWeek ? () => { setView("results"); router.push(`/season/${schedule.id}?view=results`); } : undefined} />}
          {view === "results" && latestRecapWeek && <WeekRecapWorkspace schedule={activeSchedule} playerStats={gameDetailPlayerStats} onOpenGame={openGameDetail} />}
          {view === "league-schedule" && historyViewActive && !historySchedule
            ? <HistoryMissingState season={selectedHistorySeason} onSync={syncLeagueHistory} syncing={historySyncing} canSync={canSyncHistory} />
            : view === "league-schedule" && <ScheduleView schedule={workspaceSchedule ?? activeSchedule} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} canAccessPlayoffs={!historyViewActive && canAccessPlayoffs} onOpenScores={openScoreEntry} onOpenPlayoffs={openPlayoffScores} onOpenGame={openGameDetail} highlightedGame={highlightedGame} simulationResults={historyViewActive ? {} : simulationResultByGame} simulationProbabilities={historyViewActive ? {} : simulationProbabilityByGame} readOnlyHistory={historyViewActive} teamHrefBase={`/season/${schedule.id}/team`} teamHrefFor={(teamId) => hrefWithHistorySeason(`/season/${schedule.id}/team/${teamId}`)} />}
          {view === "team-schedule" && historyViewActive && !historySchedule
            ? <HistoryMissingState season={selectedHistorySeason} onSync={syncLeagueHistory} syncing={historySyncing} canSync={canSyncHistory} />
            : view === "team-schedule" && <TeamScheduleView schedule={workspaceSchedule ?? activeSchedule} teamId={selectedTeamId} playerStats={workspacePlayerStats} onSelectTeam={selectTeamSchedule} onSelectWeek={openLeagueScheduleWeek} onOpenGame={openGameDetail} simulationResults={historyViewActive ? {} : simulationResultByGame} teamHrefFor={(teamId) => hrefWithHistorySeason(`/season/${schedule.id}/team/${teamId}`)} leagueWeekHrefFor={(week) => hrefWithHistorySeason(`/season/${schedule.id}`, { week })} readOnlyHistory={historyViewActive} />}
          {view === "gotw" && historyViewActive && !historySchedule
            ? <HistoryMissingState season={selectedHistorySeason} onSync={syncLeagueHistory} syncing={historySyncing} canSync={canSyncHistory} />
            : view === "gotw" && <GotwWorkspace schedule={workspaceSchedule ?? activeSchedule} simulationResults={historyViewActive ? {} : simulationResultByGame} simulationProbabilities={historyViewActive ? {} : simulationProbabilityByGame} teamHrefFor={(teamId) => hrefWithHistorySeason(`/season/${schedule.id}/team/${teamId}`)} />}
          {view === "matchup-ratings" && historyViewActive && !historySchedule
            ? <HistoryMissingState season={selectedHistorySeason} onSync={syncLeagueHistory} syncing={historySyncing} canSync={canSyncHistory} />
            : view === "matchup-ratings" && <MatchupRatingsView schedule={workspaceSchedule ?? activeSchedule} teamHrefFor={(teamId) => hrefWithHistorySeason(`/season/${schedule.id}/team/${teamId}`)} leagueWeekHrefFor={(week) => hrefWithHistorySeason(`/season/${schedule.id}`, { week })} />}
          {view === "standings" && historyViewActive && !historySchedule
            ? <HistoryMissingState season={selectedHistorySeason} onSync={syncLeagueHistory} syncing={historySyncing} canSync={canSyncHistory} />
            : view === "standings" && <StandingsView schedule={workspaceSchedule ?? activeSchedule} playerStats={workspacePlayerStats} onUpdateTiebreakers={simulation || historyViewActive ? undefined : onUpdateTiebreakers} readOnly={Boolean(simulation || historyViewActive)} />}
          {view === "mvt" && historyViewActive && !historySchedule
            ? <HistoryMissingState season={selectedHistorySeason} onSync={syncLeagueHistory} syncing={historySyncing} canSync={canSyncHistory} />
            : view === "mvt" && <MvtWorkspace schedule={workspaceSchedule ?? activeSchedule} playerStats={workspacePlayerStats} pastChampions={pastChampions} />}
          {view === "all-stars" && historyViewActive && !historySchedule
            ? <HistoryMissingState season={selectedHistorySeason} onSync={syncLeagueHistory} syncing={historySyncing} canSync={canSyncHistory} />
            : view === "all-stars" && <AllStarsWorkspace schedule={workspaceSchedule ?? activeSchedule} playerStats={workspacePlayerStats} pastChampions={pastChampions} />}
          {view === "playoffs" && historyViewActive && !historySchedule
            ? <HistoryMissingState season={selectedHistorySeason} onSync={syncLeagueHistory} syncing={historySyncing} canSync={canSyncHistory} />
            : view === "playoffs" && <PlayoffsView schedule={workspaceSchedule ?? activeSchedule} onUpdatePlayoffs={simulation || historyViewActive ? () => undefined : onUpdatePlayoffs} onUpdatePlayoffGame={simulation || historyViewActive ? () => undefined : onUpdatePlayoffGame} highlightedGame={highlightedGame} simulationMode={Boolean(simulation || historyViewActive)} playoffTab={playoffTab} onChangePlayoffTab={setPlayoffTab} teamHrefFor={(teamId) => hrefWithHistorySeason(`/season/${schedule.id}/team/${teamId}`)} onOpenGame={openGameDetail} />}
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
          {view === "settings" && <SettingsView schedule={activeSchedule} onOpenDraftRanking={() => setDraftRankingRequest((current) => current + 1)} onRegenerate={() => setConfirmAction("regenerate")} onUpdatePlayoffs={onUpdatePlayoffs} onUpdateTiebreakers={simulation ? undefined : onUpdateTiebreakers} readOnly={Boolean(simulation)} canAccessPlatformSync={canAccessPlatformSync} platformSyncLoading={platformSyncLoading} onRefreshPlatformScores={refreshPlatformScores} onSavePlatformConnection={savePlatformConnection} onDisconnectPlatform={disconnectPlatform} onConnectPlatform={() => setConnectOpen(true)} importHistory={importHistory} importHistoryLoading={importHistoryLoading} importHistoryError={importHistoryError} onRefreshImportHistory={loadImportHistory} />}
          {connectOpen && <ConnectScoresModal schedule={schedule} onClose={closeConnect} onConnect={applyPlatformConnection} dismissLabel={connectAutoOpened ? "Skip for now" : "Cancel"} />}
          {saveConnectionSetup && <SaveConnectionPrompt setup={saveConnectionSetup} onClose={() => setSaveConnectionSetup(null)} />}
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
          // #18.5 — seed the builder with THIS league's setup (was a blank /build).
          run: () => { saveSetup(activeSchedule.setup); router.push("/build"); },
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
