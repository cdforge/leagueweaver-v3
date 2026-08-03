"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingPlaybook } from "@/components/ui/LoadingPlaybook";
import { PickemPoolWorkspace as ReusedPickemWorkspace } from "@/components/season/PickemWorkspace";
import type { PickemPool } from "@/lib/pickem";

type PickemPoolWorkspacePageProps = {
  poolId: string;
};

export function PickemPoolWorkspace({ poolId }: PickemPoolWorkspacePageProps) {
  const [pool, setPool] = useState<PickemPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadPool = async () => {
    setLoading(true);
    setMessage(null);
    const response = await fetch(`/api/pickem/pools?poolId=${encodeURIComponent(poolId)}`);
    const payload = await response.json().catch(() => null) as { pool?: PickemPool | null; error?: string } | null;
    if (!response.ok) {
      setMessage(payload?.error ?? "Pick'em pool could not be loaded.");
      setPool(null);
      setLoading(false);
      return;
    }
    setPool(payload?.pool ?? null);
    setMessage(payload?.pool ? null : "Pick'em pool was not found for this account.");
    setLoading(false);
  };

  useEffect(() => {
    void loadPool();
  }, [poolId]);

  const savePool = async (next: PickemPool) => {
    setPool(next);
    const response = await fetch("/api/pickem/pools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poolId: next.id,
        name: next.name,
        accessMode: next.accessMode,
        brandColor: next.brandColor,
        logoUrl: next.logoUrl ?? null,
        settings: next.settings,
      }),
    });
    const payload = await response.json().catch(() => null) as { pool?: PickemPool; error?: string } | null;
    if (!response.ok) {
      setMessage(payload?.error ?? "Pick'em changes could not be saved.");
      return;
    }
    if (payload?.pool) setPool(payload.pool);
  };

  return <section className="product-dashboard page-width">
    <header className="product-dashboard-hero">
      <div>
        <p className="eyebrow">LW Pick'ems</p>
        <h1>{pool?.name ?? "Pick'em workspace"}</h1>
        <p>Manage weekly picks, standings, results, reminders, exports, and playoff drafting from one pool-first workspace.</p>
      </div>
      <Link className="button-secondary" href="/pickem">All Pick'ems</Link>
    </header>

    {loading && <LoadingPlaybook label="Loading Pick'em workspace..." />}
    {message && <div className="product-message" role="alert">{message}</div>}
    {pool && <ReusedPickemWorkspace
      pool={pool}
      onChange={(next) => { void savePool(next); }}
      onNotice={setMessage}
      onReload={loadPool}
    />}
  </section>;
}
