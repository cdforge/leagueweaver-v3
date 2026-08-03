"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Plus, Trophy, UsersRound } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { LoadingPlaybook } from "@/components/ui/LoadingPlaybook";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";

type PickemPoolSummary = {
  id: string;
  name: string;
  seasonYear: number;
  currentWeek?: number;
  publicSlug?: string;
  participantCount?: number;
  submittedCount?: number;
  brandColor?: string | null;
  logoUrl?: string | null;
  source?: string | null;
  participants?: Array<{ id: string; active: boolean }>;
  picks?: Array<{ participantId: string }>;
};

export function PickemDashboard() {
  const [pools, setPools] = useState<PickemPoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pickem/pools")
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { pools?: PickemPoolSummary[]; pool?: PickemPoolSummary | null; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "LW Pick'ems could not be loaded.");
        setPools(payload.pools ?? (payload.pool ? [payload.pool] : []));
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "LW Pick'ems could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  return <section className="product-dashboard page-width" aria-labelledby="pickem-dashboard-title">
    <header className="product-dashboard-hero">
      <div>
        <p className="eyebrow">LW Pick'ems</p>
        <h1 id="pickem-dashboard-title">Choose a Pick'em pool.</h1>
        <p>Run weekly favorite and underdog picks as a LeagueWeaver game. Start blank, use a saved league, or connect a fantasy season.</p>
      </div>
      <div className="product-dashboard-actions">
        <Link className="button-secondary" href="/pickem/join"><Copy />Join from invite</Link>
        <Link className="button-primary" href="/pickem/new"><Plus />Create Pick'em</Link>
      </div>
    </header>

    {loading && <LoadingPlaybook label="Loading LW Pick'ems..." />}
    {message && <div className="product-message" role="alert">{message}</div>}

    {!loading && <section className="product-panel">
      <header><span><strong>My Pick'ems</strong><small>Owned and joined pools will appear here.</small></span></header>
      <div className="product-list">
        {pools.length ? pools.map((pool) => <Link className="product-row" key={pool.id} href={`/pickem/pool/${pool.id}`}>
          <EntityLogo size={44} color={pool.brandColor || "#117A45"} logoUrl={pool.logoUrl ?? undefined} monogram={resolveInitials(undefined, leagueAcronym(pool.name))} entityType="league" />
          <span>
            <strong>{pool.name}</strong>
            <small>{pool.seasonYear} season · Week {pool.currentWeek ?? 1}</small>
            <small>{pool.participantCount ?? pool.participants?.filter((participant) => participant.active).length ?? 0} players · {pool.submittedCount ?? new Set(pool.picks?.map((pick) => pick.participantId)).size} submitted</small>
          </span>
          <em className="product-pill"><Trophy />{pool.source === "fantasy-season" ? "Connected" : "Standalone"}</em>
        </Link>) : <div className="product-empty"><UsersRound /><span><strong>No Pick'ems yet.</strong><small>Create one from scratch or start from a saved league.</small></span><Link className="button-primary" href="/pickem/new">Create Pick'em</Link></div>}
      </div>
    </section>}
  </section>;
}
