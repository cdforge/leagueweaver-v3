"use client";

import { generateLeagueSchedule } from "./schedule";
import type { GeneratedSchedule, LeagueSetupInput } from "./types";

/**
 * Generates a schedule off the main thread via a Web Worker so large leagues
 * never freeze the UI while the solver runs (it can search for up to ~25s).
 * Falls back to synchronous generation when workers are unavailable (SSR, older
 * browsers) or fail to bundle/run. One-shot per call: a worker is spun up for the
 * request and terminated the moment it settles.
 *
 * A worker that computes and reports an *infeasible* configuration rejects with
 * that message — it does NOT retry synchronously, since re-running a deterministic
 * infeasible solve would just freeze the main thread for the same result.
 */
export function generateScheduleAsync(setup: LeagueSetupInput): Promise<GeneratedSchedule> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return Promise.resolve(generateLeagueSchedule(setup));
  }

  let worker: Worker;
  try {
    worker = new Worker(new URL("./schedule.worker.ts", import.meta.url));
  } catch {
    return Promise.resolve(generateLeagueSchedule(setup));
  }

  return new Promise<GeneratedSchedule>((resolve, reject) => {
    const id = 1;
    let settled = false;
    const finish = () => { settled = true; worker.terminate(); };

    // Worker bundling/runtime failure: fall back to synchronous generation so the
    // user still gets a schedule (accepting a possible brief freeze on this path).
    const fallbackSync = () => {
      if (settled) return;
      finish();
      try {
        resolve(generateLeagueSchedule(setup));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("We couldn’t build this schedule yet."));
      }
    };

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { id: number; schedule?: GeneratedSchedule; error?: string };
      if (data.id !== id || settled) return;
      if (data.schedule) {
        finish();
        resolve(data.schedule);
      } else {
        finish();
        reject(new Error(data.error || "We couldn’t build this schedule yet."));
      }
    };
    worker.onerror = fallbackSync;

    try {
      worker.postMessage({ id, setup });
    } catch {
      fallbackSync();
    }
  });
}
