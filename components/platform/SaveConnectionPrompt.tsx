"use client";

import { useEffect, useState } from "react";
import { Cloud, LoaderCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/Modal";
import { identityFromSetup, normalizeSavedLeague } from "@/lib/savedLeagues";
import type { LeagueSetupInput, SavedLeaguePreset } from "@/lib/types";

// After a commissioner connects scores, offer to persist that connection (and the
// team↔roster mappings, carried on setup.teams[].providerId) onto their saved
// league — so next season's build starts pre-connected. Reuses the exact save
// path the builder uses: POST /api/saved-leagues with identityFromSetup(), which
// already serializes platformConnection + provider ids. Signed-in only (saved
// leagues are account-scoped); the parent gates on that.
export function SaveConnectionPrompt({ setup, onClose }: { setup: LeagueSetupInput; onClose: () => void }) {
  const [match, setMatch] = useState<SavedLeaguePreset | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the saved league this schedule came from (by name — the builder matches
  // the same way) before deciding whether to update one or offer to create.
  useEffect(() => {
    let active = true;
    fetch("/api/saved-leagues")
      .then((response) => response.json())
      .then((payload: { presets?: Array<{ id: string; name: string; data: unknown; updated_at?: string }> }) => {
        if (!active) return;
        const presets = (payload.presets ?? [])
          .map(normalizeSavedLeague)
          .filter((preset): preset is SavedLeaguePreset => Boolean(preset));
        const name = setup.name.trim().toLowerCase();
        setMatch(presets.find((preset) => preset.name.trim().toLowerCase() === name) ?? null);
        setReady(true);
      })
      .catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [setup.name]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/saved-leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: match?.id, name: setup.name, data: identityFromSetup(setup) }),
      });
      const payload = await response.json() as { preset?: unknown; error?: string };
      if (!response.ok || !payload.preset) throw new Error(payload.error || "This connection could not be saved.");
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This connection could not be saved.");
      setBusy(false);
    }
  };

  // Hold rendering until we know whether a matching league exists — avoids a
  // title that flips from "Save league" to "Save connection to X".
  if (!ready) return null;
  const providerLabel = setup.platformConnection?.provider === "espn" ? "ESPN" : "Sleeper";

  return (
    <ConfirmDialog
      tone="default"
      icon={<Cloud />}
      kicker="SAVED LEAGUE"
      title={match ? `Save this connection to “${match.name}”?` : `Save “${setup.name}” with this connection?`}
      closeLabel="Not now"
      onClose={onClose}
      busy={busy}
      actions={[
        { label: "Not now", onClick: onClose, variant: "secondary", autoFocus: true, disabled: busy },
        { label: busy ? "Saving…" : match ? "Save connection" : "Save league", onClick: save, variant: "primary", icon: busy ? <LoaderCircle className="spin" /> : <Cloud />, disabled: busy },
      ]}
    >
      <p>{match
        ? `Next time you build from “${match.name}”, its ${providerLabel} score connection and team matches come along automatically.`
        : `We’ll save this league to your account with its ${providerLabel} connection, so you can reuse both next season.`}</p>
      {error && <p className="import-error" role="alert">{error}</p>}
    </ConfirmDialog>
  );
}
