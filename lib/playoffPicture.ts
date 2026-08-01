import { projectPlayoffSeeds } from "./playoffs";
import { calculateStandings, formatRecord } from "./standings";
import { getLatestScoredWeek, getTeamClinchTimelines, type TeamClinchTimeline } from "./clinch";
import type { GeneratedSchedule, StandingsRow } from "./types";

/**
 * A read-only "playoff picture" snapshot — who is currently seeded, who is on
 * the bubble, and who is out — derived entirely from the existing engine:
 *  - `projectPlayoffSeeds` gives the live 1..N field and seed order,
 *  - `getTeamClinchTimelines` gives the clinch/elimination status + the week it
 *    became mathematically certain,
 *  - `calculateStandings` gives the ranking, records, and division records.
 * Nothing here mutates the schedule, so it is safe to show anywhere.
 */

export type PlayoffPictureStatus =
  | "top-seed"     // #1 overall — carries the league logo
  | "division"     // clinched a division title
  | "clinched"     // clinched a berth
  | "in"           // currently in the field by projection, not yet clinched
  | "hunt"         // outside the field but still alive
  | "eliminated";  // mathematically out

export interface PlayoffPictureEntry {
  teamId: string;
  seed?: number;            // present when in the field
  standingsRank: number;    // 1-based league rank
  overallRecord: string;
  divisionRecord: string;
  divisionId: string;
  divisionLeader: boolean;
  bye: boolean;
  isTopSeed: boolean;
  status: PlayoffPictureStatus;
  clinchWeek?: number;      // week the clinched status became certain
  eliminatedWeek?: number;
  gamesBack?: number;       // for hunt entries, games behind the cut line
}

export interface PlayoffPicture {
  throughWeek: number;
  weeksToPlay: number;
  fieldSize: number;
  regularSeasonComplete: boolean;
  clinchedCount: number;    // teams in the field that have clinched a berth
  huntCount: number;
  field: PlayoffPictureEntry[];
  hunt: PlayoffPictureEntry[];
  eliminated: PlayoffPictureEntry[];
}

function divisionRecord(row?: StandingsRow) {
  if (!row) return "0-0";
  return row.divisionTies
    ? `${row.divisionWins}-${row.divisionLosses}-${row.divisionTies}`
    : `${row.divisionWins}-${row.divisionLosses}`;
}

/** Standard games-back: ((leadW - teamW) + (teamL - leadL)) / 2. */
function gamesBehind(cut: StandingsRow, team: StandingsRow) {
  return ((cut.wins - team.wins) + (team.losses - cut.losses)) / 2;
}

function fieldStatus(timeline: TeamClinchTimeline | undefined, isTopSeed: boolean): {
  status: PlayoffPictureStatus;
  clinchWeek?: number;
} {
  if (isTopSeed && timeline?.topSeed) return { status: "top-seed", clinchWeek: timeline.topSeedWeek };
  if (timeline?.divisionTitle) return { status: "division", clinchWeek: timeline.divisionTitleWeek };
  if (timeline?.playoffBerth) return { status: "clinched", clinchWeek: timeline.playoffBerthWeek };
  return { status: isTopSeed ? "top-seed" : "in" };
}

export function buildPlayoffPicture(schedule: GeneratedSchedule): PlayoffPicture {
  const teamCount = schedule.setup.teams.length;
  const fieldSize = Math.max(2, Math.min(teamCount, Math.round(schedule.setup.playoffs.fieldSize)));
  const throughWeek = getLatestScoredWeek(schedule);
  const totalWeeks = schedule.setup.weeks;

  const seeds = projectPlayoffSeeds(schedule, fieldSize);
  const seededTeamIds = new Set(seeds.map((seed) => seed.teamId));
  const standings = calculateStandings(schedule);
  const rowByTeam = new Map(standings.map((row) => [row.teamId, row]));
  const rankByTeam = new Map(standings.map((row, index) => [row.teamId, index + 1]));
  const timelineByTeam = new Map(getTeamClinchTimelines(schedule).map((timeline) => [timeline.teamId, timeline]));

  const field: PlayoffPictureEntry[] = seeds.map((seed) => {
    const row = rowByTeam.get(seed.teamId);
    const timeline = timelineByTeam.get(seed.teamId);
    const isTopSeed = seed.seed === 1;
    const { status, clinchWeek } = fieldStatus(timeline, isTopSeed);
    return {
      teamId: seed.teamId,
      seed: seed.seed,
      standingsRank: rankByTeam.get(seed.teamId) ?? seed.standingsPosition,
      overallRecord: row ? formatRecord(row) : seed.record,
      divisionRecord: divisionRecord(row),
      divisionId: seed.divisionId,
      divisionLeader: seed.divisionLeader,
      bye: seed.bye,
      isTopSeed,
      status,
      clinchWeek,
    };
  });

  // The cut line is the lowest seed currently in the field; the bubble measures
  // games back from that team.
  const cutRow = rowByTeam.get(seeds[seeds.length - 1]?.teamId ?? "");
  const outsideRows = standings.filter((row) => !seededTeamIds.has(row.teamId));

  const hunt: PlayoffPictureEntry[] = [];
  const eliminated: PlayoffPictureEntry[] = [];
  for (const row of outsideRows) {
    const timeline = timelineByTeam.get(row.teamId);
    const base: PlayoffPictureEntry = {
      teamId: row.teamId,
      standingsRank: rankByTeam.get(row.teamId) ?? 0,
      overallRecord: formatRecord(row),
      divisionRecord: divisionRecord(row),
      divisionId: schedule.setup.teams.find((team) => team.id === row.teamId)?.divisionId ?? "",
      divisionLeader: false,
      bye: false,
      isTopSeed: false,
      status: "hunt",
    };
    if (timeline?.eliminated) {
      eliminated.push({ ...base, status: "eliminated", eliminatedWeek: timeline.eliminatedWeek });
    } else {
      hunt.push({ ...base, gamesBack: cutRow ? Math.max(0, gamesBehind(cutRow, row)) : undefined });
    }
  }

  return {
    throughWeek,
    weeksToPlay: Math.max(0, totalWeeks - throughWeek),
    fieldSize,
    regularSeasonComplete: throughWeek >= totalWeeks && totalWeeks > 0,
    clinchedCount: field.filter((entry) => entry.status !== "in").length,
    huntCount: hunt.length,
    field,
    hunt,
    eliminated,
  };
}
