// Web Worker: runs schedule generation off the main thread so large leagues
// (the solver can spend up to ~25s searching for a fair schedule) never freeze
// the UI. Mirrors lib/simulator.worker.ts.
import { generateLeagueSchedule } from "./schedule";
import type { LeagueSetupInput } from "./types";

type GenerateRequest = { id: number; setup: LeagueSetupInput; seed?: string };

const ctx = self as unknown as {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<GenerateRequest>) => void) | null;
};

ctx.onmessage = (event) => {
  const { id, setup, seed } = event.data;
  try {
    const schedule = seed ? generateLeagueSchedule(setup, seed) : generateLeagueSchedule(setup);
    ctx.postMessage({ id, schedule });
  } catch (error) {
    ctx.postMessage({ id, error: error instanceof Error ? error.message : "We couldn’t build this schedule yet." });
  }
};
