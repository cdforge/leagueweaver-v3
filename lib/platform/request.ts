import "server-only";
import { providerBackoffDelayMs, shouldBackoffStatus } from "./playerSync";

const USER_AGENT = "LeagueWeaver/3.0 (public fantasy data sync; contact: support@leagueweaver.com)";

export async function fetchProviderJson<T>(url: string, init: RequestInit = {}, attempts = 3): Promise<{ response: Response; json: T | null }> {
  let lastResponse: Response | undefined;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...Object.fromEntries(new Headers(init.headers).entries()),
      },
      cache: init.cache ?? "no-store",
    });
    lastResponse = response;
    const shouldRetry = attempt < attempts && shouldBackoffStatus(response.status);
    if (!shouldRetry) {
      const json = await response.json().catch(() => null) as T | null;
      return { response, json };
    }
    await new Promise((resolve) => setTimeout(resolve, providerBackoffDelayMs(response.status, attempt)));
  }
  return { response: lastResponse!, json: null };
}
