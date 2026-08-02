"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Route-base context lets the shared season views (standings, playoffs, ratings,
 * team schedule) build their internal links relative to wherever they are mounted.
 * In the authenticated app the views live under `/season/:id`; on the public share
 * page they live under `/share/:slug`. Components read the context via
 * `useRouteBase(fallback)` and default to the in-app route when no provider wraps
 * them, so existing callers keep working with no change.
 */
const RouteBaseContext = createContext<string | null>(null);

export function RouteBaseProvider({ base, children }: { base: string; children: ReactNode }) {
  return <RouteBaseContext.Provider value={base}>{children}</RouteBaseContext.Provider>;
}

/** Returns the active route base (e.g. `/season/abc123` or `/share/my-league-d137cf`). */
export function useRouteBase(fallback: string): string {
  return useContext(RouteBaseContext) ?? fallback;
}
