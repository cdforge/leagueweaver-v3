"use client";

import { useEffect, useRef, useState } from "react";
import { calculateSeasonOdds, type MonteCarloTeamOdds } from "./simulator";
import type { GeneratedSchedule } from "./types";

/**
 * Computes Monte Carlo season odds off the main thread via a Web Worker so heavy
 * trial counts never freeze the UI. Falls back to a deferred synchronous compute
 * when workers are unavailable (SSR, older browsers) or fail to bundle/run.
 *
 * Pass `enabled=false` (e.g. when the odds panel is hidden) to skip computation
 * entirely and avoid wasted work on every upstream change.
 */
export function useSeasonOdds(schedule: GeneratedSchedule | null | undefined, trials: number, enabled: boolean): { odds: MonteCarloTeamOdds[]; computing: boolean } {
  const [odds, setOdds] = useState<MonteCarloTeamOdds[]>([]);
  const [computing, setComputing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const workerUnavailable = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      workerUnavailable.current = true;
      return;
    }
    try {
      workerRef.current = new Worker(new URL("./simulator.worker.ts", import.meta.url));
    } catch {
      workerUnavailable.current = true;
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !schedule) {
      setComputing(false);
      return;
    }
    const id = ++requestId.current;
    setComputing(true);

    const computeSync = () => {
      const handle = window.setTimeout(() => {
        if (id !== requestId.current) return;
        try {
          setOdds(calculateSeasonOdds(schedule, trials));
        } catch {
          setOdds([]);
        }
        setComputing(false);
      }, 0);
      return () => window.clearTimeout(handle);
    };

    const worker = workerRef.current;
    if (!worker || workerUnavailable.current) return computeSync();

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { id: number; teams?: MonteCarloTeamOdds[]; error?: string };
      if (data.id !== id) return;
      worker.removeEventListener("message", handleMessage);
      if (data.teams) {
        setOdds(data.teams);
        setComputing(false);
      } else {
        try {
          setOdds(calculateSeasonOdds(schedule, trials));
        } catch {
          setOdds([]);
        }
        setComputing(false);
      }
    };
    worker.addEventListener("message", handleMessage);
    try {
      worker.postMessage({ id, schedule, trials });
    } catch {
      worker.removeEventListener("message", handleMessage);
      workerUnavailable.current = true;
      return computeSync();
    }
    return () => worker.removeEventListener("message", handleMessage);
  }, [schedule, trials, enabled]);

  return { odds, computing };
}
