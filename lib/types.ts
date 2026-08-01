export type PlanKey = "free" | "pro";
export type PlacementSource = "regular-season" | "playoffs";
export type PlayoffFieldSize = number;
export type PlayoffBracketType = "single-elimination" | "ladder";
export type PlayoffPlacementMode = "auto" | "division-halves" | "division-leaders" | "overall";
export type ResolvedPlayoffPlacementMode = Exclude<PlayoffPlacementMode, "auto">;
export type PlayoffReseedMode = "fixed" | "each-round" | "protected";
export type PlayoffSeedDisplayMode = "reranked" | "standings-finish";
export type PlayoffChampionshipVenueMode = "higher-seed" | "neutral-site";
export type PlayoffTheme = "gold" | "silver" | "bronze" | "custom";
export type PlayoffFieldStatus = "live" | "locked";
export type PlayoffConsolationMode = "off" | "standard" | "division-halves";
export type TiebreakerScope = "division" | "league";
export type TiebreakerRule = "win-percentage" | "head-to-head" | "division-percentage" | "common-opponents" | "strength-of-victory" | "strength-of-schedule" | "point-differential" | "points-scored";

export interface TiebreakerSettings {
  division: TiebreakerRule[];
  league: TiebreakerRule[];
  manualOverrides: Record<string, string[]>;
}

/**
 * A conference groups divisions into (exactly two) halves of the playoff bracket.
 * Only present for even division counts (4/6/8); a first-class identity like a division
 * (name + initials + color + logo) so it can be branded in setup.
 */
export interface Conference {
  id: string;
  name: string;
  initials?: string;
  color: string;
  logoUrl?: string;
}

export interface Division {
  id: string;
  name: string;
  initials?: string;
  color: string;
  logoUrl?: string;
  /** Assigned conference id — set only for even division counts; undefined otherwise. */
  conferenceId?: string;
}

export interface Team {
  id: string;
  providerId?: string;
  city: string;
  name: string;
  shortName: string;
  initials?: string;
  manager: string;
  color: string;
  logoUrl?: string;
  divisionId: string;
  overallRank: number;
  draftPlace?: number;
  stadium: string;
}

export type PlatformProvider = "espn" | "sleeper";
export type PlatformSyncMode = "manual" | "assisted" | "auto";
export type PlatformAuthType = "public" | "private-cookie" | "none";
export type PlatformSyncStatus = "idle" | "ready" | "warning" | "failed" | "syncing";

export interface PlatformConnection {
  provider: PlatformProvider;
  providerLeagueId: string;
  providerLeagueName?: string;
  seasonYear: number;
  syncMode: PlatformSyncMode;
  authType: PlatformAuthType;
  lastSyncAt?: string;
  status: PlatformSyncStatus;
  warnings: string[];
  availableHistoryYears?: number[];
  blockedHistoryYears?: number[];
  hasDraftData?: boolean;
  hasRosterData?: boolean;
  hasPlayerData?: boolean;
  hasScoreSync?: boolean;
}

export interface LeagueSetupInput {
  id: string;
  name: string;
  abbreviation: string;
  initials?: string;
  description: string;
  color: string;
  logoUrl?: string;
  seasonYear: number;
  weeks: 13 | 14;
  divisions: Division[];
  /** Present (exactly two) only for even division counts; empty/undefined otherwise. */
  conferences?: Conference[];
  teams: Team[];
  display: {
    cityNames: boolean;
    managers: boolean;
    venues: boolean;
  };
  priorSeason: {
    enabled: boolean;
    hasData: boolean;
    entryMode: "none" | "manual" | "history";
    source: PlacementSource;
  };
  weekOne: {
    rankingSource: "prior-season" | "draft-day";
  };
  tiebreakers?: TiebreakerSettings;
  playoffs: {
    fieldSize: PlayoffFieldSize;
    bracketType: PlayoffBracketType;
    placementMode: PlayoffPlacementMode;
    reseedMode: PlayoffReseedMode;
    seedDisplayMode: PlayoffSeedDisplayMode;
    championshipVenueMode: PlayoffChampionshipVenueMode;
    theme: PlayoffTheme;
    fieldStatus: PlayoffFieldStatus;
    lockedTeamIds: string[];
    consolationMode: PlayoffConsolationMode;
    thirdPlaceGame: boolean;
    name: string;
    color: string;
    logoUrl?: string;
    roundNames?: string[];
    roundLogoUrls?: string[];
    gameNames?: Record<string, string>;
    gameLogoUrls?: Record<string, string>;
  };
  platformConnection?: PlatformConnection;
  fairness: {
    maxHomeAwayStreak: 2 | 3 | 4;
    preventImmediateRematches: boolean;
    finalWeekDivisional: boolean;
    prioritizeOpeningWeek: boolean;
    prioritizeThanksgiving: boolean;
  };
}

export interface ScheduledGame {
  id: string;
  week: number;
  /** Stable 1-based position after the week's games are sorted best-to-worst by matchup rating. */
  gameNumber?: number;
  homeTeamId: string;
  awayTeamId: string;
  matchupType: "division" | "cross-division";
  seriesGame: number;
  seriesLength: number;
  dateLabel: string;
  stadium: string;
  /** Fixed preseason GOTW rating. Lower values reward strong, closely ranked teams. */
  matchupRating?: number;
  /** ISO date-time used only when this game differs from the week default. */
  dateTimeOverride?: string;
  rescheduleStatus?: "rescheduled" | "postponed" | "canceled";
  specialEvent?: string;
  notes?: string[];
  tbdReason?: string;
  homeScore?: number;
  awayScore?: number;
}

export interface ScheduleWeek {
  weekNumber: number;
  dateLabel: string;
  games: ScheduledGame[];
  /** League-wide rank of this week's slate; 1 is the strongest week. */
  matchupRank?: number;
  bestMatchupRating?: number;
  averageMatchupRating?: number;
}

export interface PlayoffGame extends ScheduledGame {
  round: string;
  roundIndex: number;
  /** Optional commissioner-authored name for this exact playoff matchup. */
  name?: string;
  /** Optional branding for this exact playoff matchup. */
  logoUrl?: string;
  roundLogoUrl?: string;
  bracket: "main" | "consolation";
}

export interface FairnessReport {
  hardPass: boolean;
  score: number;
  homeAwaySpread: number;
  immediateRematches: number;
  divisionalFinishShare: number;
  notes: string[];
}

export interface GeneratedSchedule {
  id: string;
  seed: string;
  createdAt: string;
  setup: LeagueSetupInput;
  weeks: ScheduleWeek[];
  playoffGames?: PlayoffGame[];
  rankHistory?: RankHistorySnapshot[];
  fairness: FairnessReport;
  revision: number;
}

export interface StandingsRow {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  winPercentage: number;
  divisionWins: number;
  divisionLosses: number;
  divisionTies: number;
  streak: string;
}

export interface StandingsRankExplanation {
  rule?: TiebreakerRule;
  label: string;
  value?: number;
  resolution: "rule" | "manual" | "fallback";
}

export interface StandingsTieGroup {
  signature: string;
  scope: TiebreakerScope;
  divisionId?: string;
  teamIds: string[];
  orderedTeamIds: string[];
  appliedRules: TiebreakerRule[];
  resolution: "manual" | "fallback";
  explanation: string;
}

export interface StandingsResolution {
  rows: StandingsRow[];
  tieGroups: StandingsTieGroup[];
  explanationsByTeam: Record<string, StandingsRankExplanation>;
}

export interface RankedStandingsRow extends StandingsRow {
  rank: number;
  previousRank: number;
  rankChange: number;
  preseasonRank: number;
  tiebreaker?: StandingsRankExplanation;
}

export interface RankHistorySnapshot {
  weekNumber: number;
  completed: boolean;
  playedGames: number;
  rows: RankedStandingsRow[];
}

export interface PlayoffSeed {
  seed: number;
  teamId: string;
  record: string;
  divisionLeader: boolean;
  divisionId: string;
  standingsPosition: number;
  bracketSide?: "A" | "B";
  bye: boolean;
}

export interface ImportTeam {
  providerId?: string;
  city?: string;
  name: string;
  manager?: string;
  division?: string;
  rank?: number;
  color?: string;
  colorSuggestions?: string[];
  logoUrl?: string;
  stadium?: string;
  scores?: Array<{ week: number; value: number }>;
}

export interface ImportDataFound {
  availableHistoryYears: number[];
  blockedHistoryYears: number[];
  hasDraftData: boolean;
  hasRosterData: boolean;
  hasPlayerData: boolean;
  hasScoreSync: boolean;
}

export interface ImportPreview {
  provider: PlatformProvider | "csv" | "paste" | "screenshot";
  providerLeagueId?: string;
  leagueName?: string;
  leagueLogoUrl?: string;
  leagueColor?: string;
  seasonYear?: number;
  teams: ImportTeam[];
  dataFound?: ImportDataFound;
  syncMode?: PlatformSyncMode;
  authType?: PlatformAuthType;
  hasPriorSeasonRanks?: boolean;
  warnings: string[];
  requiresConfirmation: true;
}

export interface PlatformSyncScoreRow {
  gameId: string;
  week: number;
  awayTeamId: string;
  homeTeamId: string;
  awayScore?: number;
  homeScore?: number;
  confidence: "high" | "review";
  source: PlatformProvider;
}

export interface PlatformSyncResult {
  rows: PlatformSyncScoreRow[];
  unmatched: Array<{ week: number; providerHomeId?: string; providerAwayId?: string; reason: string }>;
  warnings: string[];
  syncedAt: string;
}

export interface ImportHistoryEvent {
  id: string;
  provider: PlatformProvider | "csv" | "paste" | "screenshot" | "leagueweaver";
  action: string;
  status: "previewed" | "confirmed" | "failed" | "ready" | "warning" | "idle" | "saved" | "restored";
  createdAt: string;
  week?: number;
  seasonYear?: number;
  message?: string;
  revisionId?: string;
}

export interface SavedSeasonSummary {
  id: string;
  title: string;
  updatedAt: string;
  revision: number;
  editable: boolean;
  plan: PlanKey;
}

export interface SavedLeagueIdentity {
  version: 3;
  league: Pick<LeagueSetupInput, "name" | "abbreviation" | "initials" | "description" | "color" | "logoUrl">;
  divisions: Division[];
  conferences?: Conference[];
  teams: Team[];
  display: LeagueSetupInput["display"];
  priorSeason?: LeagueSetupInput["priorSeason"];
  platformConnection?: PlatformConnection;
  playoffs?: Pick<LeagueSetupInput["playoffs"], "name" | "color" | "theme" | "logoUrl" | "roundNames" | "roundLogoUrls" | "gameNames" | "gameLogoUrls">;
}

export interface SavedLeaguePreset {
  id: string;
  name: string;
  data: SavedLeagueIdentity;
  updatedAt: string;
}
