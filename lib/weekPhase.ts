/**
 * Derives the "live" state of an NFL week purely from the clock — no feed, no
 * polling. A fantasy week runs Tue 4:00 AM ET → the next Tue 4:00 AM ET (the
 * same window `getNflWeekWindow` bounds), and its games play Thursday night
 * through Monday night, so "live" is just: is `now` inside that game span, and
 * if so, which broadcast window are we in.
 *
 * Sunday is split into three windows to match how the slate actually airs:
 * afternoon (early), evening (late-afternoon), and Sunday night.
 */
export type WeekPhase = "pre" | "live" | "final";

export type LiveWindow =
  | "thursday"
  | "sunday-afternoon"
  | "sunday-evening"
  | "sunday-night"
  | "monday"
  | "between";

export interface WeekPhaseState {
  phase: WeekPhase;
  window: LiveWindow | null;
  /** Short human label for the rail, e.g. "Sunday afternoon". */
  label: string;
}

/** Wall-clock weekday + minutes-since-midnight in US Eastern, DST-aware. */
function easternParts(now: Date): { weekday: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return { weekday, minutes: hour * 60 + minute };
}

const THU_KICK = 20 * 60 + 15; // 8:15 PM ET
const SUN_AFTERNOON = 13 * 60; // 1:00 PM ET
const SUN_EVENING = 16 * 60 + 5; // 4:05 PM ET
const SUN_NIGHT = 20 * 60 + 20; // 8:20 PM ET
const MON_KICK = 20 * 60 + 15; // 8:15 PM ET

function classifyWindow(weekday: string, minutes: number): LiveWindow {
  if (weekday === "Thu") return minutes >= THU_KICK ? "thursday" : "between";
  if (weekday === "Sun") {
    if (minutes < SUN_AFTERNOON) return "between";
    if (minutes < SUN_EVENING) return "sunday-afternoon";
    if (minutes < SUN_NIGHT) return "sunday-evening";
    return "sunday-night";
  }
  if (weekday === "Mon") return minutes >= MON_KICK ? "monday" : "between";
  return "between"; // Fri, Sat, or off-hours inside the live span
}

const WINDOW_LABELS: Record<LiveWindow, string> = {
  thursday: "Thursday night",
  "sunday-afternoon": "Sunday afternoon",
  "sunday-evening": "Sunday evening",
  "sunday-night": "Sunday night",
  monday: "Monday night",
  between: "In progress",
};

/**
 * @param now current time
 * @param bounds the week's `startsAt`/`endsAt` ISO strings from getNflWeekWindow
 * @param firstGameStartsAt optional ISO for an earlier special (Wed/Fri/Sat) game,
 *        so the phase flips to live when that kicks off instead of Thursday.
 */
export function getWeekPhase(
  now: Date,
  bounds: { startsAt: string; endsAt: string },
  firstGameStartsAt?: string,
): WeekPhaseState {
  const t = now.getTime();
  const start = Date.parse(bounds.startsAt);
  const end = Date.parse(bounds.endsAt);

  if (Number.isFinite(end) && t >= end) return { phase: "final", window: null, label: "Final" };
  if (Number.isFinite(start) && t < start) return { phase: "pre", window: null, label: "Upcoming" };

  // Inside the Tue→Tue window. Games don't start until Thursday night unless a
  // special (override) game kicks earlier.
  const early = firstGameStartsAt ? Date.parse(firstGameStartsAt) : NaN;
  if (Number.isFinite(early) && t >= early) {
    const { weekday, minutes } = easternParts(now);
    const window = classifyWindow(weekday, minutes);
    return { phase: "live", window, label: WINDOW_LABELS[window] };
  }

  const { weekday, minutes } = easternParts(now);
  const gamesStarted = !(
    weekday === "Tue" ||
    weekday === "Wed" ||
    (weekday === "Thu" && minutes < THU_KICK)
  );
  if (!gamesStarted) return { phase: "pre", window: null, label: "Upcoming" };
  const window = classifyWindow(weekday, minutes);
  return { phase: "live", window, label: WINDOW_LABELS[window] };
}
