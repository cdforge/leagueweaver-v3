import type { GeneratedSchedule, Team } from "./types";

export type PickemVisibility = "after-submit" | "after-first-lock" | "always-visible" | "after-week-close";
export type PickemTab = "this-week" | "picks" | "everyone" | "standings" | "results" | "stats" | "playoffs" | "exports" | "settings";
export type PickemPickChoice = "away" | "home";
export type PickemPoolSource = "blank" | "saved-league" | "fantasy-season";
export type PickemAccessMode = "private" | "public";
export type PickemParticipantSource = "manual" | "saved-league-team" | "fantasy-team";

export interface PickemParticipant {
  id: string;
  teamId?: string;
  source: PickemParticipantSource;
  sourceTeamId?: string;
  name: string;
  manager: string;
  color: string;
  logoUrl?: string;
  active: boolean;
  claimToken: string;
  claimedAt?: string;
  claimedByName?: string;
  claimedByEmail?: string;
  email?: string;
  phone?: string;
  emailOptIn: boolean;
  smsOptIn: boolean;
}

export interface PickemGame {
  id: string;
  week: number;
  kickoffAt: string;
  away: string;
  home: string;
  favorite: "away" | "home";
  spread: number;
  finalWinner?: "away" | "home";
  status: "open" | "locked" | "final";
}

export interface PickemPick {
  participantId: string;
  gameId: string;
  choice: PickemPickChoice | "missed";
  submittedAt: string;
}

export interface PickemPlayoffDraftPick {
  pick: number;
  round: number;
  seed: number;
  participantId?: string;
  nflTeamAbbr?: string;
  isSuperBowlWinner?: boolean;
}

export interface PickemSettings {
  visibility: PickemVisibility;
  favoritePoints: number;
  underdogPoints: number;
  missedCountsAsLoss: boolean;
  playoffsEnabled: boolean;
  playoffQualifierCount: number;
}

export interface PickemPool {
  id: string;
  scheduleId?: string;
  source: PickemPoolSource;
  sourceId?: string;
  savedLeagueId?: string;
  fantasyConnectionId?: string;
  accessMode: PickemAccessMode;
  brandColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  name: string;
  seasonYear: number;
  currentWeek: number;
  publicSlug: string;
  startedWeek: number;
  launchedAt: string;
  settings: PickemSettings;
  participants: PickemParticipant[];
  games: PickemGame[];
  picks: PickemPick[];
  playoffDraft: PickemPlayoffDraftPick[];
  reminderLog: Array<{ id: string; week: number; sentAt: string; channel: "email" | "sms"; count: number }>;
}

export interface PickemStanding {
  participant: PickemParticipant;
  score: number;
  wins: number;
  losses: number;
  missed: number;
  favoriteWins: number;
  underdogWins: number;
  winPct: number;
}

const NFL_TEAMS = [
  ["DAL", "PHI"], ["KC", "LAC"], ["ARI", "NO"], ["MIA", "IND"],
  ["LV", "NE"], ["PIT", "NYJ"], ["NYG", "WSH"], ["CAR", "JAX"],
  ["CIN", "CLE"], ["TB", "ATL"], ["TEN", "DEN"], ["SF", "SEA"],
  ["DET", "GB"], ["BAL", "BUF"], ["MIN", "CHI"], ["HOU", "LAR"],
];

export const NFL_PLAYOFF_TEAM_OPTIONS = ["BAL", "BUF", "CIN", "CLE", "HOU", "IND", "JAX", "KC", "LAC", "MIA", "NYJ", "PIT", "DEN", "LV", "DAL", "NYG", "PHI", "WSH", "CHI", "DET", "GB", "MIN", "ATL", "CAR", "NO", "TB", "ARI", "LAR", "SF", "SEA"];

export type NflTeamMeta = { abbr: string; city: string; nickname: string; fullName: string; color: string; secondary: string };

export const NFL_TEAM_META: Record<string, NflTeamMeta> = {
  ARI: { abbr: "ARI", city: "Arizona", nickname: "Cardinals", fullName: "Arizona Cardinals", color: "#97233F", secondary: "#FFB612" },
  ATL: { abbr: "ATL", city: "Atlanta", nickname: "Falcons", fullName: "Atlanta Falcons", color: "#A71930", secondary: "#000000" },
  BAL: { abbr: "BAL", city: "Baltimore", nickname: "Ravens", fullName: "Baltimore Ravens", color: "#241773", secondary: "#9E7C0C" },
  BUF: { abbr: "BUF", city: "Buffalo", nickname: "Bills", fullName: "Buffalo Bills", color: "#00338D", secondary: "#C60C30" },
  CAR: { abbr: "CAR", city: "Carolina", nickname: "Panthers", fullName: "Carolina Panthers", color: "#0085CA", secondary: "#101820" },
  CHI: { abbr: "CHI", city: "Chicago", nickname: "Bears", fullName: "Chicago Bears", color: "#0B162A", secondary: "#C83803" },
  CIN: { abbr: "CIN", city: "Cincinnati", nickname: "Bengals", fullName: "Cincinnati Bengals", color: "#FB4F14", secondary: "#000000" },
  CLE: { abbr: "CLE", city: "Cleveland", nickname: "Browns", fullName: "Cleveland Browns", color: "#311D00", secondary: "#FF3C00" },
  DAL: { abbr: "DAL", city: "Dallas", nickname: "Cowboys", fullName: "Dallas Cowboys", color: "#003594", secondary: "#869397" },
  DEN: { abbr: "DEN", city: "Denver", nickname: "Broncos", fullName: "Denver Broncos", color: "#FB4F14", secondary: "#002244" },
  DET: { abbr: "DET", city: "Detroit", nickname: "Lions", fullName: "Detroit Lions", color: "#0076B6", secondary: "#B0B7BC" },
  GB: { abbr: "GB", city: "Green Bay", nickname: "Packers", fullName: "Green Bay Packers", color: "#203731", secondary: "#FFB612" },
  HOU: { abbr: "HOU", city: "Houston", nickname: "Texans", fullName: "Houston Texans", color: "#03202F", secondary: "#A71930" },
  IND: { abbr: "IND", city: "Indianapolis", nickname: "Colts", fullName: "Indianapolis Colts", color: "#002C5F", secondary: "#A2AAAD" },
  JAX: { abbr: "JAX", city: "Jacksonville", nickname: "Jaguars", fullName: "Jacksonville Jaguars", color: "#006778", secondary: "#D7A22A" },
  KC: { abbr: "KC", city: "Kansas City", nickname: "Chiefs", fullName: "Kansas City Chiefs", color: "#E31837", secondary: "#FFB81C" },
  LAC: { abbr: "LAC", city: "Los Angeles", nickname: "Chargers", fullName: "Los Angeles Chargers", color: "#0080C6", secondary: "#FFC20E" },
  LAR: { abbr: "LAR", city: "Los Angeles", nickname: "Rams", fullName: "Los Angeles Rams", color: "#003594", secondary: "#FFA300" },
  LV: { abbr: "LV", city: "Las Vegas", nickname: "Raiders", fullName: "Las Vegas Raiders", color: "#000000", secondary: "#A5ACAF" },
  MIA: { abbr: "MIA", city: "Miami", nickname: "Dolphins", fullName: "Miami Dolphins", color: "#008E97", secondary: "#FC4C02" },
  MIN: { abbr: "MIN", city: "Minnesota", nickname: "Vikings", fullName: "Minnesota Vikings", color: "#4F2683", secondary: "#FFC62F" },
  NE: { abbr: "NE", city: "New England", nickname: "Patriots", fullName: "New England Patriots", color: "#002244", secondary: "#C60C30" },
  NO: { abbr: "NO", city: "New Orleans", nickname: "Saints", fullName: "New Orleans Saints", color: "#D3BC8D", secondary: "#101820" },
  NYG: { abbr: "NYG", city: "New York", nickname: "Giants", fullName: "New York Giants", color: "#0B2265", secondary: "#A71930" },
  NYJ: { abbr: "NYJ", city: "New York", nickname: "Jets", fullName: "New York Jets", color: "#125740", secondary: "#000000" },
  PHI: { abbr: "PHI", city: "Philadelphia", nickname: "Eagles", fullName: "Philadelphia Eagles", color: "#004C54", secondary: "#A5ACAF" },
  PIT: { abbr: "PIT", city: "Pittsburgh", nickname: "Steelers", fullName: "Pittsburgh Steelers", color: "#FFB612", secondary: "#101820" },
  SEA: { abbr: "SEA", city: "Seattle", nickname: "Seahawks", fullName: "Seattle Seahawks", color: "#002244", secondary: "#69BE28" },
  SF: { abbr: "SF", city: "San Francisco", nickname: "49ers", fullName: "San Francisco 49ers", color: "#AA0000", secondary: "#B3995D" },
  TB: { abbr: "TB", city: "Tampa Bay", nickname: "Buccaneers", fullName: "Tampa Bay Buccaneers", color: "#D50A0A", secondary: "#FF7900" },
  TEN: { abbr: "TEN", city: "Tennessee", nickname: "Titans", fullName: "Tennessee Titans", color: "#0C2340", secondary: "#4B92DB" },
  WSH: { abbr: "WSH", city: "Washington", nickname: "Commanders", fullName: "Washington Commanders", color: "#5A1414", secondary: "#FFB612" },
};

export function nflTeamMeta(value: string): NflTeamMeta {
  const key = value.toUpperCase();
  return NFL_TEAM_META[key] ?? { abbr: key, city: value, nickname: "", fullName: value, color: "#31423B", secondary: "#9FB0A8" };
}

export function nflTeamName(value: string, mode: "full" | "city" | "abbr" = "full") {
  const meta = nflTeamMeta(value);
  if (mode === "abbr") return meta.abbr;
  if (mode === "city") return meta.city;
  return meta.fullName;
}

export function pickemStorageKey(poolOrScheduleId?: string) {
  return `leagueweaver:v3:pickem:${poolOrScheduleId ?? "standalone"}`;
}

function participantClaimToken(teamId: string) {
  return `${teamId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugFor(name: string, scheduleId: string) {
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 38) || "pickem";
  return `${safe}-${scheduleId.slice(0, 6)}`;
}

export function defaultPickemParticipants(teams: Team[]): PickemParticipant[] {
  return teams.map((team) => ({
    id: team.id,
    teamId: team.id,
    source: "saved-league-team",
    sourceTeamId: team.providerId ?? team.id,
    name: team.name,
    manager: team.manager || team.name,
    color: team.color,
    logoUrl: team.logoUrl,
    active: true,
    claimToken: participantClaimToken(team.id),
    email: team.managerEmail,
    emailOptIn: false,
    smsOptIn: false,
  }));
}

export function pickemParticipantUrl(baseUrl: string, publicSlug: string, participant: PickemParticipant) {
  const url = new URL(`/pickem/${publicSlug}`, baseUrl);
  url.searchParams.set("team", participant.teamId ?? participant.id);
  url.searchParams.set("claim", participant.claimToken);
  return url.toString();
}

export function defaultPickemSettings(participantCount: number): PickemSettings {
  return {
    visibility: "after-submit",
    favoritePoints: 1,
    underdogPoints: 1.5,
    missedCountsAsLoss: true,
    playoffsEnabled: true,
    playoffQualifierCount: Math.min(7, Math.max(2, participantCount, 2)),
  };
}

export function buildMockPickemGames(seasonYear: number, week: number): PickemGame[] {
  const now = new Date();
  const base = new Date(Date.UTC(seasonYear, 8, 4 + (week - 1) * 7, 0, 20));
  return NFL_TEAMS.map(([away, home], index) => {
    const dayOffset = index === 0 ? 0 : index < 14 ? 3 : 4;
    const hour = index === 0 ? 0 : index < 14 ? 17 : 0;
    const kickoff = new Date(base);
    kickoff.setUTCDate(base.getUTCDate() + dayOffset);
    kickoff.setUTCHours(hour, index < 14 ? 0 : 20, 0, 0);
    const finalWinner = index % 5 === 0 ? "away" : index % 3 === 0 ? "home" : undefined;
    const locked = now.getTime() > kickoff.getTime();
    return {
      id: `nfl-${seasonYear}-${week}-${away}-${home}`,
      week,
      kickoffAt: kickoff.toISOString(),
      away,
      home,
      favorite: index % 4 === 0 ? "away" : "home",
      spread: [1.5, 2.5, 3.5, 4.5, 6.5][index % 5],
      finalWinner: locked ? finalWinner : undefined,
      status: locked ? finalWinner ? "final" : "locked" : "open",
    };
  });
}

export function createPickemPool(schedule: GeneratedSchedule, participantIds?: string[], playoffQualifierCount?: number): PickemPool {
  const participants = defaultPickemParticipants(schedule.setup.teams).map((participant) => ({
    ...participant,
    active: participantIds ? participantIds.includes(participant.id) : true,
  }));
  const activeCount = participants.filter((participant) => participant.active).length;
  const settings = defaultPickemSettings(activeCount);
  settings.playoffQualifierCount = Math.min(14, Math.max(2, playoffQualifierCount ?? Math.min(7, activeCount || 2)));
  return {
    id: `pickem-${schedule.id}`,
    scheduleId: schedule.id,
    source: "saved-league",
    sourceId: schedule.id,
    accessMode: "private",
    brandColor: schedule.setup.color,
    logoUrl: schedule.setup.logoUrl,
    name: `${schedule.setup.name} Pick'em`,
    seasonYear: schedule.setup.seasonYear,
    currentWeek: 1,
    startedWeek: 1,
    publicSlug: slugFor(schedule.setup.abbreviation || schedule.setup.name, schedule.id),
    launchedAt: new Date().toISOString(),
    settings,
    participants,
    games: buildMockPickemGames(schedule.setup.seasonYear, 1),
    picks: [],
    playoffDraft: [],
    reminderLog: [],
  };
}

export function isPickemGameLocked(game: PickemGame, now = new Date()) {
  return game.status !== "open" || now.getTime() >= new Date(game.kickoffAt).getTime();
}

export function pickemChoiceLabel(game: PickemGame, choice: PickemPick["choice"]) {
  if (choice === "missed") return "Missed";
  return nflTeamName(choice === "away" ? game.away : game.home);
}

export function calculatePickemStandings(pool: PickemPool): PickemStanding[] {
  const gamesById = new Map(pool.games.map((game) => [game.id, game]));
  const picksByParticipant = new Map<string, PickemPick[]>();
  for (const pick of pool.picks) {
    const list = picksByParticipant.get(pick.participantId) ?? [];
    list.push(pick);
    picksByParticipant.set(pick.participantId, list);
  }
  return pool.participants.filter((participant) => participant.active).map((participant) => {
    let score = 0;
    let wins = 0;
    let losses = 0;
    let missed = 0;
    let favoriteWins = 0;
    let underdogWins = 0;
    for (const pick of picksByParticipant.get(participant.id) ?? []) {
      const game = gamesById.get(pick.gameId);
      if (!game || game.status !== "final") continue;
      if (pick.choice === "missed") {
        missed += 1;
        losses += 1;
        continue;
      }
      if (pick.choice === game.finalWinner) {
        wins += 1;
        const favorite = pick.choice === game.favorite;
        score += favorite ? pool.settings.favoritePoints : pool.settings.underdogPoints;
        if (favorite) favoriteWins += 1;
        else underdogWins += 1;
      } else {
        losses += 1;
      }
    }
    return {
      participant,
      score,
      wins,
      losses,
      missed,
      favoriteWins,
      underdogWins,
      winPct: wins + losses ? wins / (wins + losses) : 0,
    };
  }).sort((left, right) => right.score - left.score || right.wins - left.wins || right.underdogWins - left.underdogWins || left.participant.name.localeCompare(right.participant.name));
}

export function pickemDraftSlots(qualifierCount: number) {
  const count = Math.min(14, Math.max(2, qualifierCount));
  return Array.from({ length: 14 }, (_, index) => ({
    pick: index + 1,
    seed: index % count + 1,
    round: Math.floor(index / count) + 1,
  }));
}

export function buildPickemPlayoffDraft(pool: PickemPool): PickemPlayoffDraftPick[] {
  const standings = calculatePickemStandings(pool);
  return pickemDraftSlots(pool.settings.playoffQualifierCount).map((slot) => ({
    ...slot,
    participantId: standings[slot.seed - 1]?.participant.id,
    nflTeamAbbr: pool.playoffDraft.find((pick) => pick.pick === slot.pick)?.nflTeamAbbr,
    isSuperBowlWinner: pool.playoffDraft.find((pick) => pick.pick === slot.pick)?.isSuperBowlWinner,
  }));
}
