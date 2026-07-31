"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Placement = "home" | "workspace" | "public";

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

// Per-placement slot ids. NEXT_PUBLIC_* vars must be read as literal member
// access so Next can inline them at build time — no dynamic indexing.
const SLOT_BY_PLACEMENT: Record<Placement, string | undefined> = {
  home: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME,
  workspace: process.env.NEXT_PUBLIC_ADSENSE_SLOT_WORKSPACE,
  public: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PUBLIC,
};

/**
 * A single Google AdSense slot.
 *
 * Gating: real ads only render once both NEXT_PUBLIC_ADSENSE_CLIENT_ID and the
 * matching slot id are set. Until AdSense is approved and those are configured,
 * production renders nothing (clean pre-launch pages) while development shows a
 * labeled placeholder so the layout is visible. Per-user suppression (Pro's
 * `no_ads`) is handled by the caller choosing whether to render this at all.
 */
export function AdUnit({ placement }: { placement: Placement }) {
  const slot = SLOT_BY_PLACEMENT[placement];
  const configured = Boolean(CLIENT_ID && slot);
  const pushed = useRef(false);

  useEffect(() => {
    if (!configured || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not ready or blocked — leave the slot empty.
    }
  }, [configured]);

  if (!configured) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <aside className={`ad-wrap ad-wrap-${placement}`} aria-label="Advertisement placeholder">
        <div className="ad-unit">
          <span>ADVERTISEMENT</span>
          <p>AdSense slot “{placement}” — set the env vars to go live.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`ad-wrap ad-wrap-${placement}`} aria-label="Advertisement">
      <ins
        className="adsbygoogle ad-slot"
        style={{ display: "block" }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
