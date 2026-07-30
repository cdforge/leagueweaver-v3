export type SavedSeasonTimeFrame = {
  seasonYear?: number;
  weeks?: number;
};

function wholeNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

export function readSavedSeasonTimeFrame(value: unknown): SavedSeasonTimeFrame {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const frame = value as Record<string, unknown>;
  return {
    seasonYear: wholeNumber(frame.seasonYear),
    weeks: wholeNumber(frame.weeks),
  };
}

export function readSavedSeasonTimeFrameFromSchedule(value: unknown): SavedSeasonTimeFrame {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const schedule = value as Record<string, unknown>;
  const currentSetup = readSavedSeasonTimeFrame(schedule.setup);
  if (currentSetup.seasonYear && currentSetup.weeks) return currentSetup;
  const legacySettings = readSavedSeasonTimeFrame(schedule.settings);
  if (legacySettings.seasonYear && legacySettings.weeks) return legacySettings;
  return {
    ...currentSetup,
    ...legacySettings,
    weeks: legacySettings.weeks ?? (Array.isArray(schedule.weeks) ? schedule.weeks.length : undefined),
  };
}

export function savedSeasonIdentity(title: string, timeFrame: unknown) {
  const frame = readSavedSeasonTimeFrame(timeFrame);
  return [
    title.trim().replace(/\s+/g, " ").toLocaleLowerCase(),
    frame.seasonYear ?? "unknown-year",
    frame.weeks ?? "unknown-weeks",
  ].join("::");
}

export function isSeasonCopyTitle(title: string, leagueName: string) {
  const escapedName = leagueName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^copy(?: \\d+)? of ${escapedName}$`, "i").test(title.trim());
}

export function nextSeasonCopyTitle(leagueName: string, existingTitles: string[]) {
  const taken = new Set(existingTitles.map((title) => title.trim().toLocaleLowerCase()));
  const firstCopy = `Copy of ${leagueName}`;
  if (!taken.has(firstCopy.toLocaleLowerCase())) return firstCopy;
  let copyNumber = 2;
  while (taken.has(`copy ${copyNumber} of ${leagueName}`.toLocaleLowerCase())) copyNumber += 1;
  return `Copy ${copyNumber} of ${leagueName}`;
}
