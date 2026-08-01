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

export type SavedSeasonBranding = {
  color?: string;
  logoUrl?: string;
  initials?: string;
};

/** Pulls the league's headline branding out of a stored schedule so a saved
 *  season can wear its own logo/colour in list views. Legacy revisions without
 *  a `setup` (or without branding) return an empty object and fall back to a
 *  name monogram at render time. */
export function readSavedSeasonBrandingFromSchedule(value: unknown): SavedSeasonBranding {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const setup = (value as Record<string, unknown>).setup;
  if (!setup || typeof setup !== "object" || Array.isArray(setup)) return {};
  const branding = setup as Record<string, unknown>;
  return {
    color: typeof branding.color === "string" ? branding.color : undefined,
    logoUrl: typeof branding.logoUrl === "string" ? branding.logoUrl : undefined,
    initials: typeof branding.initials === "string" ? branding.initials : undefined,
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
