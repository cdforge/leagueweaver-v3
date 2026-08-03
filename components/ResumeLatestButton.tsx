"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { listLocalSeasons } from "@/lib/storage";

type LatestSchedule = { id: string; name: string };

type CloudSeason = { id: string; title: string; updated_at?: string };

/**
 * A quick "jump back to the schedule I was last in" affordance for the top header.
 * Lives in AppHeader, which only renders on non-workspace pages — so it never shows
 * on the schedule workspace itself. Renders nothing until a saved schedule is found.
 *
 * "Latest" is the most-recently-touched schedule across both stores: cloud seasons
 * (updated_at) for signed-in users and device-local guest schedules (savedAt).
 */
export function ResumeLatestButton() {
  const [latest, setLatest] = useState<LatestSchedule | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      // /api/seasons returns { seasons: [] } for guests, so this is safe to always call.
      let cloud: { id: string; name: string; ts: number }[] = [];
      try {
        const response = await fetch("/api/seasons");
        if (response.ok) {
          const payload = (await response.json()) as { seasons?: CloudSeason[] };
          cloud = (payload.seasons ?? []).map((season) => ({
            id: season.id,
            name: season.title,
            ts: season.updated_at ? Date.parse(season.updated_at) : 0,
          }));
        }
      } catch {
        // Ignore network failures; device-local schedules below still populate the list.
      }
      const local = listLocalSeasons().map((season) => ({ id: season.id, name: season.name, ts: season.savedAt }));
      const seen = new Set<string>();
      const newestFirst = [...cloud, ...local]
        .filter((entry) => {
          if (seen.has(entry.id)) return false;
          seen.add(entry.id);
          return true;
        })
        .sort((a, b) => b.ts - a.ts);
      if (active) setLatest(newestFirst[0] ? { id: newestFirst[0].id, name: newestFirst[0].name } : null);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (!latest) {
    return (
      <span className="resume-latest is-placeholder" aria-hidden="true">
        <History aria-hidden="true" />
        <span className="resume-latest-copy"><small>Resume</small><strong>Latest schedule</strong></span>
      </span>
    );
  }

  return (
    <Link href={`/season/${latest.id}`} className="resume-latest" aria-label={`Resume ${latest.name}`} title={`Resume ${latest.name}`}>
      <History aria-hidden="true" />
      <span className="resume-latest-copy"><small>Resume</small><strong>{latest.name}</strong></span>
    </Link>
  );
}
