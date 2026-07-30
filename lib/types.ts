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

export interface Division {
  id: string;
  name: string;
  initials?: string;
  color: string;
  logoUrl?: string;
}

export interface Team {
  id: string;
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
    thirdPlaceGame: boolean;
    name: string;
    color: string;
    logoUrl?: string;
    roundNames?: string[];
  };
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
  streak: string;
}

export interface RankedStandingsRow extends StandingsRow {
  rank: number;
  previousRank: number;
  rankChange: number;
  preseasonRank: number;
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
  logoUrl?: string;
  stadium?: string;
  scores?: Array<{ week: number; value: number }>;
}

export interface ImportPreview {
  provider: "sleeper" | "espn" | "csv" | "paste" | "screenshot";
  providerLeagueId?: string;
  leagueName?: string;
  leagueLogoUrl?: string;
  leagueColor?: string;
  seasonYear?: number;
  teams: ImportTeam[];
  hasPriorSeasonRanks?: boolean;
  warnings: string[];
  requiresConfirmation: true;
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
  teams: Team[];
  display: LeagueSetupInput["display"];
  priorSeason?: LeagueSetupInput["priorSeason"];
}

export interface SavedLeaguePreset {
  id: string;
  name: string;
  data: SavedLeagueIdentity;
  updatedAt: string;
}
