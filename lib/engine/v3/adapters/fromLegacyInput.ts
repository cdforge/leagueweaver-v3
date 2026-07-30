import type { ScheduleInput, ScheduleSettings, Team } from "../../scheduleForge";
import { getLeagueFormatKey, LEAGUE_FORMAT_KEYS } from "../../leagueFormats";
import { normalizeCustomDivisionalEndingStyle } from "../../divisionalCustomSettings";
import { normalizeNflSeasonYear, thanksgivingNflWeek } from "../../nflCalendar";
import {
  EngineDivision,
  EngineInput,
  EngineSettings,
  EngineTeam,
  FormatKey,
} from "../domain/types";

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function configuredByes(formatKey: FormatKey, s: ScheduleSettings): number {
  // Only the custom divisional format honors user byes in v3; every other
  // format derives byes structurally (effectiveWeeks - degree).
  if (formatKey !== LEAGUE_FORMAT_KEYS.DIVISIONAL_LEAGUE) return 0;
  const games = Math.max(1, Math.round(s.weeks));
  const maxByes = Math.max(0, Math.min(8, games - 1));
  return clamp(Math.round(s.byeWeeksPerTeam ?? 0), 0, maxByes);
}

// v3 treats EngineSettings.weeks as the total number of scheduled weeks. For
// fantasy that equals the game count; for the divisional league it is games +
// byes; the RR/pool formats derive their week count structurally and only use
// this value in season-length RR mode.
function engineWeeks(formatKey: FormatKey, s: ScheduleSettings, byes: number): number {
  const requested = Math.max(1, Math.round(s.weeks));
  if (formatKey === LEAGUE_FORMAT_KEYS.DIVISIONAL_LEAGUE) return requested + byes;
  return requested;
}

export function fromLegacyInput(input: ScheduleInput, teams: Team[]): EngineInput {
  const s = input.settings;
  const formatKey = getLeagueFormatKey(s.format) as FormatKey;
  const isRoundRobin = formatKey === LEAGUE_FORMAT_KEYS.ROUND_ROBIN_CLASSIC;
  const isFantasy = formatKey === LEAGUE_FORMAT_KEYS.FANTASY_NFL_DIVISIONAL;
  const isDivisional = formatKey === LEAGUE_FORMAT_KEYS.DIVISIONAL_LEAGUE;

  // The wizard exposes a single "divisional ending style" control; the engine
  // acts on `divisionalPlacement`. A "college conference style" ending means the
  // divisional games cluster into a closing block → engine placement "end".
  // Honor it (for the divisional format) in addition to an explicit placement.
  const collegeConferenceEnding =
    isDivisional &&
    normalizeCustomDivisionalEndingStyle(
      s.divisionalEndingStyle,
      s.prioritizeDivisionalFinalWeek,
      s.divisionalPlacement,
    ) === "college_conference_style";
  const divisionalPlacement: "randomized" | "end" =
    s.divisionalPlacement === "end" || collegeConferenceEnding ? "end" : "randomized";

  const byesPerTeam = configuredByes(formatKey, s);
  const weeks = engineWeeks(formatKey, s, byesPerTeam);

  // Fantasy locks a season year in the wizard, so Thanksgiving's week is exact
  // calendar math (4th Thursday of November → its NFL week). Target that real
  // week instead of the legacy fixed 12–13 window. Only meaningful when the week
  // actually falls inside the season; otherwise leave null (scorer falls back).
  const thanksgivingWeek =
    isFantasy && typeof s.seasonYear === "number"
      ? (() => {
          const wk = thanksgivingNflWeek(normalizeNflSeasonYear(s.seasonYear));
          return wk >= 1 && wk <= weeks ? wk : null;
        })()
      : null;

  const engineTeams: EngineTeam[] = teams.map((t) => ({
    id: t.id,
    divisionId: isRoundRobin ? null : t.divisionId,
    divisionSeed: t.divisionSeed,
    overallSeed: t.overallSeed,
  }));

  const divisions: EngineDivision[] = isRoundRobin
    ? []
    : input.divisions.map((d, index) => ({ id: d.id, orderIndex: index }));

  // RR with a fixed week order must avoid immediate rematches (matches legacy).
  const preventImmediateRematches =
    isRoundRobin && !(s.shuffleClassicWeeks ?? false)
      ? true
      : s.preventImmediateRematches ?? true;

  const settings: EngineSettings = {
    weeks,
    byesPerTeam,
    divisionalGamesPerOpponent: isFantasy
      ? 2
      : clamp(Math.round(s.divisionalOpponentGames ?? 1), 1, 4),
    poolOpponentRepeatCount: Math.max(1, Math.round(s.poolOpponentRepeatCount ?? 1)),
    classicRoundRobinMode:
      s.classicRoundRobinMode === "season_length" ? "season_length" : "cycle_count",
    classicRoundRobinCycleCount: Math.max(1, Math.round(s.classicRoundRobinCycleCount ?? 1)),

    maxHomeAwayStreak: Math.max(3, Math.round(s.maxHomeAwayStreak ?? 3)),
    maxDivisionalStreak: Math.max(3, Math.round(s.maxDivisionalStreak ?? 4)),
    preventImmediateRematches,
    byeWeekPlacement: s.byeWeekPlacement ?? "anywhere",
    relaxStreaks: false,

    prioritizeOpeningWeekTopFive: Boolean(s.prioritizeOpeningWeekTopFive),
    prioritizeFinalWeekTopFive: Boolean(s.prioritizeFinalWeekTopFive),
    prioritizeThanksgivingWindow: Boolean(s.prioritizeThanksgivingWindow),
    thanksgivingWeek,
    regularSeasonFinalWeekDivisional: Boolean(s.regularModeFinalWeekDivisional),
    divisionalPlacement,
    seasonFlowStyle: s.seasonFlowStyle ?? "balanced",
    crossDivisionVariety: s.crossDivisionVariety ?? "balanced",
    divisionalFinishStrength: s.divisionalFinishStrength ?? "balanced_finish",
  };

  return { format: formatKey, teams: engineTeams, divisions, settings };
}
