"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { FloatingPopover } from "@/components/ui/FloatingPopover";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";
import { listLocalSeasons } from "@/lib/storage";

export type WorkspaceSwitcherCurrent = {
  id: string;
  name: string;
  seasonYear: number;
  color: string;
  logoUrl?: string;
  initials?: string;
};

type SwitcherEntry = { id: string; name: string; year?: number; color?: string; logoUrl?: string; initials?: string };

type CloudSeason = { id: string; title: string; time_frame?: { seasonYear?: number }; color?: string | null; logo_url?: string | null; initials?: string | null };

/**
 * CRM-style workspace switcher pinned to the bottom of the season rail: shows the
 * schedule you're in, your most recent others, and a jump to the full account list.
 * Each schedule wears its own league logo/colour, falling back to a name monogram
 * when a saved season predates logo branding.
 */
export function WorkspaceSwitcher({ current, signedIn }: { current: WorkspaceSwitcherCurrent; signedIn: boolean }) {
  const [others, setOthers] = useState<SwitcherEntry[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      let cloud: SwitcherEntry[] = [];
      if (signedIn) {
        try {
          const response = await fetch("/api/seasons");
          if (response.ok) {
            const payload = (await response.json()) as { seasons?: CloudSeason[] };
            cloud = (payload.seasons ?? []).map((season) => ({ id: season.id, name: season.title, year: season.time_frame?.seasonYear, color: season.color ?? undefined, logoUrl: season.logo_url ?? undefined, initials: season.initials ?? undefined }));
          }
        } catch {
          // Ignore network failures; device-local schedules below still populate the list.
        }
      }
      const local: SwitcherEntry[] = listLocalSeasons().map((season) => ({ id: season.id, name: season.name, year: season.seasonYear, color: season.color, logoUrl: season.logoUrl, initials: season.initials }));
      const seen = new Set<string>([current.id]);
      const merged = [...cloud, ...local].filter((entry) => {
        if (seen.has(entry.id)) return false;
        seen.add(entry.id);
        return true;
      });
      if (active) setOthers(merged);
    };
    load();
    return () => { active = false; };
  }, [signedIn, current.id]);

  const recent = others.slice(0, 3);
  const monogram = resolveInitials(current.initials, leagueAcronym(current.name));

  return (
    <FloatingPopover
      align="start"
      className="workspace-switcher"
      menuClassName="workspace-switcher-menu"
      label="Switch schedule"
      trigger={
        <span className="workspace-switcher-face">
          <EntityLogo className="mini-league-mark" color={current.color} logoUrl={current.logoUrl} monogram={monogram} size={32} entityType="league" />
          <span className="workspace-switcher-copy"><strong>{current.name}</strong><small>{current.seasonYear} season</small></span>
          <ChevronsUpDown aria-hidden="true" />
        </span>
      }
    >
      <p className="workspace-switcher-heading">Schedules</p>
      <span className="workspace-switcher-item is-current" aria-current="true">
        <EntityLogo className="mini-league-mark" color={current.color} logoUrl={current.logoUrl} monogram={monogram} size={32} entityType="league" />
        <span className="workspace-switcher-copy"><strong>{current.name}</strong><small>{current.seasonYear} season</small></span>
        <Check aria-hidden="true" />
      </span>
      {recent.length > 0 && (
        <div className="workspace-switcher-list">
          {recent.map((entry) => (
            <Link key={entry.id} href={`/season/${entry.id}`} className="workspace-switcher-item">
              <EntityLogo className="mini-league-mark" color={entry.color || "#117A45"} logoUrl={entry.logoUrl} monogram={resolveInitials(entry.initials, leagueAcronym(entry.name))} size={32} entityType="league" />
              <span className="workspace-switcher-copy"><strong>{entry.name}</strong><small>{entry.year ? `${entry.year} season` : "Saved schedule"}</small></span>
            </Link>
          ))}
        </div>
      )}
      <div className="workspace-switcher-foot">
        <Link href="/account" className="workspace-switcher-all"><LayoutGrid aria-hidden="true" />View all schedules</Link>
      </div>
    </FloatingPopover>
  );
}
