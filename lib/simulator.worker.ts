// Web Worker: runs the Monte Carlo season-odds simulation off the main thread
// so heavy trial counts (up to 2000 full-season sims) never freeze the UI.
import { calculateSeasonOdds } from "./simulator";
import type { GeneratedSchedule } from "./types";

type OddsRequest = { id: number; schedule: GeneratedSchedule; trials: number };

const ctx = self as unknown as {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<OddsRequest>) => void) | null;
};

ctx.onmessage = (event) => {
  const { id, schedule, trials } = event.data;
  try {
    const teams = calculateSeasonOdds(schedule, trials);
    ctx.postMessage({ id, teams });
  } catch (error) {
    ctx.postMessage({ id, error: error instanceof Error ? error.message : "Simulation failed." });
  }
};
