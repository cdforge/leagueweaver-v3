import { runEngine } from "./engine/v3";
import { normalizeScheduleMatchups } from "./matchups";
import { getWeekOneRankMap } from "./rankings";
import { freezeCompletedRankHistory } from "./standings";
import type { EngineInput } from "./engine/v3/domain/types";
import type {
  FairnessReport,
  GeneratedSchedule,
  LeagueSetupInput,
  ScheduleWeek,
  ScheduledGame,
} from "./types";

const NFL_OPENING_DATES: Record<number, string> = {
  2024: "2024-09-05",
  2025: "2025-09-04",
  2026: "2026-09-10",
  2027: "2027-09-09",
  2028: "2028-09-07",
  2029: "2029-09-06",
  2030: "2030-09-05",
};

function weekStartCalendarDate(seasonYear: number, weekNumber: number) {
  const opening = NFL_OPENING_DATES[seasonYear] ?? `${seasonYear}-09-05`;
  const date = new Date(`${opening}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 2 + (weekNumber - 1) * 7);
  return date;
}

function easternCutoffDate(calendarDate: Date) {
  const offsetName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  }).formatToParts(calendarDate).find((part) => part.type === "timeZoneName")?.value || "GMT-5";
  const offsetHours = Number(offsetName.replace("GMT", "")) || -5;
  return new Date(Date.UTC(calendarDate.getUTCFullYear(), calendarDate.getUTCMonth(), calendarDate.getUTCDate(), 4 - offsetHours));
}

function holidayDates(seasonYear: number) {
  const thanksgiving = new Date(Date.UTC(seasonYear, 10, 1, 12));
  thanksgiving.setUTCDate(1 + ((4 - thanksgiving.getUTCDay() + 7) % 7) + 21);
  return [
    { name: "Thanksgiving", date: thanksgiving },
    { name: "Christmas", date: new Date(Date.UTC(seasonYear, 11, 25, 12)) },
    { name: "New Year’s", date: new Date(Date.UTC(seasonYear + 1, 0, 1, 12)) },
  ];
}

export function getNflWeekWindow(seasonYear: number, weekNumber: number) {
  const startCalendar = weekStartCalendarDate(seasonYear, weekNumber);
  const endCalendar = new Date(startCalendar);
  endCalendar.setUTCDate(endCalendar.getUTCDate() + 7);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });
  const sameYear = startCalendar.getUTCFullYear() === endCalendar.getUTCFullYear();
  const range = startCalendar.getUTCMonth() === endCalendar.getUTCMonth() && sameYear
    ? `${month.format(startCalendar)} ${day.format(startCalendar)}–${day.format(endCalendar)}`
    : sameYear
      ? `${month.format(startCalendar)} ${day.format(startCalendar)}–${month.format(endCalendar)} ${day.format(endCalendar)}`
      : `${month.format(startCalendar)} ${day.format(startCalendar)}, ${startCalendar.getUTCFullYear()}–${month.format(endCalendar)} ${day.format(endCalendar)}, ${endCalendar.getUTCFullYear()}`;
  const holidays = holidayDates(seasonYear)
    .filter((holiday) => holiday.date >= startCalendar && holiday.date < endCalendar)
    .map((holiday) => holiday.name);
  return {
    week: weekNumber,
    startsAt: easternCutoffDate(startCalendar).toISOString(),
    endsAt: easternCutoffDate(endCalendar).toISOString(),
    label: sameYear ? `${range}, ${endCalendar.getUTCFullYear()}` : range,
    cutoffLabel: "Tue 4:00 AM ET → Tue 4:00 AM ET",
    holidays,
  };
}

export function getWeekDateLabel(seasonYear: number, weekNumber: number) {
  return getNflWeekWindow(seasonYear, weekNumber).label;
}

/**
 * The week the live scoreboard should show, derived from the clock alone.
 *
 * Each fantasy week's window starts Tue 4:00 AM ET; the *display* advances 24h
 * later, at Wed 4:00 AM ET. So Wed 4 AM → the next Tue 4 AM shows the current
 * week's live/available scores, and the Tue 4 AM → Wed 4 AM gap keeps the
 * just-finished week's finals up before rolling to the next week. Before the
 * season opens it stays on Week 1; after it ends it holds the final week.
 * Result is clamped to [1, weekCount].
 */
export function getCurrentSlateWeek(now: Date, seasonYear: number, weekCount: number): number {
  if (weekCount <= 0) return 1;
  const t = now.getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;
  let current = 1;
  for (let week = 1; week <= weekCount; week++) {
    const anchor = Date.parse(getNflWeekWindow(seasonYear, week).startsAt) + DAY_MS; // Wed 4:00 AM ET
    if (Number.isFinite(anchor) && t >= anchor) current = week;
    else break;
  }
  return current;
}

export function getNflWeeks(seasonYear: number, count: 13 | 14) {
  return Array.from({ length: count }, (_, index) => getNflWeekWindow(seasonYear, index + 1));
}

function buildEngineInput(setup: LeagueSetupInput): EngineInput {
  const divisionOrder = new Map(setup.divisions.map((division, index) => [division.id, index]));
  const conferenceByDivision = new Map(
    setup.divisions.map((division) => [division.id, division.conferenceId ?? null]),
  );
  const openingWeekRank = getWeekOneRankMap(setup);
  const divisionTeams = new Map<string, typeof setup.teams>();
  for (const division of setup.divisions) divisionTeams.set(division.id, []);
  for (const team of setup.teams) {
    const current = divisionTeams.get(team.divisionId) ?? [];
    current.push(team);
    divisionTeams.set(team.divisionId, current);
  }

  const divisionSeedByTeam = new Map<string, number>();
  for (const teams of divisionTeams.values()) {
    [...teams]
      .sort((a, b) => a.overallRank - b.overallRank || a.id.localeCompare(b.id))
      .forEach((team, index) => divisionSeedByTeam.set(team.id, index + 1));
  }

  return {
    format: "fantasy_nfl_divisional",
    divisions: setup.divisions.map((division) => ({
      id: division.id,
      orderIndex: divisionOrder.get(division.id) ?? 0,
    })),
    teams: setup.teams.map((team) => ({
      id: team.id,
      divisionId: team.divisionId,
      conferenceId: conferenceByDivision.get(team.divisionId) ?? null,
      divisionSeed: divisionSeedByTeam.get(team.id) ?? team.overallRank,
      overallSeed: team.overallRank,
      openingWeekSeed: openingWeekRank.get(team.id) ?? team.overallRank,
    })),
    settings: {
      weeks: setup.weeks,
      byesPerTeam: 0,
      divisionalGamesPerOpponent: 2,
      poolOpponentRepeatCount: 1,
      classicRoundRobinMode: "season_length",
      classicRoundRobinCycleCount: 1,
      maxHomeAwayStreak: setup.fairness.maxHomeAwayStreak,
      maxDivisionalStreak: 4,
      preventImmediateRematches: setup.fairness.preventImmediateRematches,
      byeWeekPlacement: "anywhere",
      relaxStreaks: false,
      prioritizeOpeningWeekTopFive: setup.fairness.prioritizeOpeningWeek,
      prioritizeFinalWeekTopFive: true,
      prioritizeThanksgivingWindow: setup.fairness.prioritizeThanksgiving,
      thanksgivingWeek: getNflWeeks(setup.seasonYear, setup.weeks).find((week) => week.holidays.includes("Thanksgiving"))?.week ?? null,
      regularSeasonFinalWeekDivisional: setup.fairness.finalWeekDivisional,
      divisionalPlacement: "end",
      seasonFlowStyle: "balanced",
      crossDivisionVariety: "max_variety",
      divisionalFinishStrength: "strong_finish",
    },
  };
}

function analyzeFairness(
  setup: LeagueSetupInput,
  weeks: ScheduleWeek[],
  hardPass: boolean,
  softScores: Array<{ score: number; weight: number }>,
  warnings: string[],
): FairnessReport {
  const homeCounts = new Map(setup.teams.map((team) => [team.id, 0]));
  const opponents = new Map<string, string[]>();
  let finalWeekDivisionGames = 0;
  let finalWeekGames = 0;

  for (const week of weeks) {
    for (const game of week.games) {
      homeCounts.set(game.homeTeamId, (homeCounts.get(game.homeTeamId) ?? 0) + 1);
      opponents.set(game.homeTeamId, [...(opponents.get(game.homeTeamId) ?? []), game.awayTeamId]);
      opponents.set(game.awayTeamId, [...(opponents.get(game.awayTeamId) ?? []), game.homeTeamId]);
      if (week.weekNumber === setup.weeks) {
        finalWeekGames += 1;
        if (game.matchupType === "division") finalWeekDivisionGames += 1;
      }
    }
  }

  const values = [...homeCounts.values()];
  const homeAwaySpread = Math.max(...values) - Math.min(...values);
  let immediateRematches = 0;
  for (const teamOpponents of opponents.values()) {
    for (let index = 1; index < teamOpponents.length; index += 1) {
      if (teamOpponents[index] === teamOpponents[index - 1]) immediateRematches += 1;
    }
  }
  immediateRematches /= 2;

  const weight = softScores.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore = softScores.reduce((sum, item) => sum + item.score * item.weight, 0);
  const score = Math.round((weight ? weightedScore / weight : 0.85) * 100);

  return {
    hardPass,
    score,
    homeAwaySpread,
    immediateRematches,
    divisionalFinishShare: finalWeekGames ? finalWeekDivisionGames / finalWeekGames : 0,
    notes: warnings.length
      ? warnings
      : ["Every team plays once per week.", "Home and away totals are balanced.", "Repeat opponents are spaced apart."],
  };
}

export function generateLeagueSchedule(setup: LeagueSetupInput, seed = crypto.randomUUID()): GeneratedSchedule {
  const result = runEngine(buildEngineInput(setup), {
    seed,
    maxAttempts: 60,
    timeBudgetMs: 25_000,
  });
  const teamById = new Map(setup.teams.map((team) => [team.id, team]));
  const openingWeekRanks = getWeekOneRankMap(setup);
  const preseasonRanks = new Map(setup.teams.map((team) => [team.id, team.overallRank]));

  const weeks: ScheduleWeek[] = result.schedule.weeks.map((engineWeek) => {
    const games: ScheduledGame[] = engineWeek.games.map((game, index) => {
      const homeTeamId = game.homeTeamId ?? game.a;
      const awayTeamId = game.awayTeamId ?? game.b;
      return {
        id: `week-${engineWeek.weekNumber}-game-${index + 1}`,
        week: engineWeek.weekNumber,
        homeTeamId,
        awayTeamId,
        matchupType: game.kind === "div" ? "division" : "cross-division",
        seriesGame: game.seriesGameIndex,
        seriesLength: game.seriesLength,
        dateLabel: getWeekDateLabel(setup.seasonYear, engineWeek.weekNumber),
        stadium: teamById.get(homeTeamId)?.stadium ?? "Stadium TBD",
      };
    });
    return {
      weekNumber: engineWeek.weekNumber,
      dateLabel: getWeekDateLabel(setup.seasonYear, engineWeek.weekNumber),
      games,
    };
  });
  const normalizedWeeks = normalizeScheduleMatchups(weeks, (weekNumber) => weekNumber === 1 ? openingWeekRanks : preseasonRanks);

  return {
    id: setup.id,
    seed: String(result.seedUsed),
    createdAt: new Date().toISOString(),
    setup,
    weeks: normalizedWeeks,
    fairness: analyzeFairness(setup, normalizedWeeks, result.hardPass, result.softReport, result.warnings),
    revision: 1,
  };
}

export function updateGameScore(
  schedule: GeneratedSchedule,
  gameId: string,
  homeScore: number | undefined,
  awayScore: number | undefined,
) {
  const frozenSchedule = freezeCompletedRankHistory(schedule);
  const updatedSchedule = {
    ...frozenSchedule,
    weeks: frozenSchedule.weeks.map((week) => ({
      ...week,
      games: week.games.map((game) =>
        game.id === gameId ? { ...game, homeScore, awayScore } : game,
      ),
    })),
  } satisfies GeneratedSchedule;
  return updatedSchedule;
}
