export const WELCOMED_KEY = "leagueweaver:v3:welcomed";

/** Marks the visitor as having seen the intro so the WelcomeGate stops redirecting them. */
export function markWelcomed() {
  try {
    window.localStorage.setItem(WELCOMED_KEY, "1");
  } catch {
    // Ignore storage failures; navigation still proceeds.
  }
}

/** True when the visitor has already passed through the intro at least once. */
export function hasBeenWelcomed(): boolean {
  try {
    return window.localStorage.getItem(WELCOMED_KEY) === "1";
  } catch {
    return false;
  }
}
