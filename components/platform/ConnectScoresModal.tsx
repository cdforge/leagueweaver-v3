"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, Trash, X } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PlatformConnectFields } from "./PlatformConnectFields";
import { TeamMap } from "./TeamMap";
import { autoMatchTeams, type MappingCandidate, type MatchConfidence } from "@/lib/platform/matchTeams";
import { apiErrorMessage } from "@/lib/apiErrors";
import type { GeneratedSchedule, ImportPreview, PlatformConnection, PlatformProvider } from "@/lib/types";

type MapState = { assign: Map<string, string | null>; conf: Map<string, MatchConfidence> };

// Connect a manually-built league to a PUBLIC ESPN/Sleeper league so scores can
// be pulled. Two phases: (A) enter league + fetch its roster via the existing
// import endpoint, (B) map each LeagueWeaver team to a roster. On confirm it
// emits providerId assignments + a PlatformConnection — the only things score
// sync needs (it joins on Team.providerId).
export function ConnectScoresModal({ schedule, onClose, onConnect, dismissLabel = "Cancel" }: {
  schedule: GeneratedSchedule;
  onClose: () => void;
  onConnect: (assignments: Record<string, string>, connection: PlatformConnection) => void;
  /** Phase-A dismiss label — "Skip for now" when the flow is optional (wizard). */
  dismissLabel?: string;
}) {
  const teams = schedule.setup.teams;
  const [provider, setProvider] = useState<PlatformProvider>("sleeper");
  const [identifier, setIdentifier] = useState("");
  const [seasonYear, setSeasonYear] = useState(schedule.setup.seasonYear);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapState, setMapState] = useState<MapState>({ assign: new Map(), conf: new Map() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  // Default to automatic — getting hands-off scores is usually the whole point
  // of connecting. Unchecking leaves it manual (refresh on click).
  const [autoSync, setAutoSync] = useState(true);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const seasonOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = schedule.setup.seasonYear + 1; year >= schedule.setup.seasonYear - 9; year -= 1) years.push(year);
    return years.map((year) => ({ value: String(year), label: `${year} season` }));
  }, [schedule.setup.seasonYear]);

  const candidates: MappingCandidate[] = useMemo(() => (preview?.teams ?? [])
    .filter((team) => team.providerId)
    .map((team) => ({ providerId: team.providerId!, name: team.name, city: team.city, manager: team.manager, division: team.division, logoUrl: team.logoUrl })),
    [preview]);

  const mappedCount = [...mapState.assign.values()].filter(Boolean).length;
  const canStart = identifier.trim().length > 0;

  const requestClose = () => {
    if (preview && dirty) { setDiscardPrompt(true); return; }
    abortRef.current?.abort();
    onClose();
  };
  const backToConnect = () => {
    if (dirty) { setDiscardPrompt(true); return; }
    setPreview(null);
  };

  const findTeams = async () => {
    if (loading || !canStart) return;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch(`/api/import/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), seasonYear }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({})) as ImportPreview & { error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, result.error, "That league could not be found."));

      // Seed the mapping from the auto-matcher: names + owners → provider ids.
      const matches = autoMatchTeams(
        teams.map((team) => ({ id: team.id, name: team.name, city: team.city, manager: team.manager })),
        (result.teams ?? []).filter((team) => team.providerId).map((team) => ({ providerId: team.providerId!, name: team.name, city: team.city, manager: team.manager })),
      );
      const assign = new Map<string, string | null>();
      const conf = new Map<string, MatchConfidence>();
      for (const match of matches) { assign.set(match.leagueTeamId, match.providerId); conf.set(match.leagueTeamId, match.confidence); }
      setMapState({ assign, conf });
      setPreview(result);
      setDirty(false);
    } catch (caught) {
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "That league could not be found.";
      setError(provider === "espn"
        ? `${message} If your ESPN league is private, make it viewable to public to connect — or enter scores manually.`
        : message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  // Single roster per team: assigning a roster already held elsewhere clears the
  // other row. Any explicit pick is treated as confident.
  const assign = (teamId: string, providerId: string | null) => {
    setDirty(true);
    setMapState(({ assign: prevAssign, conf: prevConf }) => {
      const nextAssign = new Map(prevAssign);
      const nextConf = new Map(prevConf);
      if (providerId) {
        nextAssign.forEach((held, otherTeamId) => {
          if (held === providerId && otherTeamId !== teamId) { nextAssign.set(otherTeamId, null); nextConf.set(otherTeamId, "none"); }
        });
        nextAssign.set(teamId, providerId);
        nextConf.set(teamId, "high");
      } else {
        nextAssign.set(teamId, null);
        nextConf.set(teamId, "none");
      }
      return { assign: nextAssign, conf: nextConf };
    });
  };

  const confirm = () => {
    if (!preview || !preview.providerLeagueId || mappedCount === 0) return;
    const connection: PlatformConnection = {
      provider,
      providerLeagueId: preview.providerLeagueId,
      providerLeagueName: preview.leagueName,
      seasonYear: preview.seasonYear ?? seasonYear,
      syncMode: autoSync ? "auto" : "manual",
      authType: "public",
      status: "ready",
      warnings: [],
      availableHistoryYears: preview.dataFound?.availableHistoryYears,
      blockedHistoryYears: preview.dataFound?.blockedHistoryYears,
      hasDraftData: preview.dataFound?.hasDraftData,
      hasScoreSync: preview.dataFound?.hasScoreSync,
    };
    const assignments = Object.fromEntries([...mapState.assign].filter(([, providerId]) => providerId) as Array<[string, string]>);
    onConnect(assignments, connection);
  };

  const countMismatch = preview && candidates.length !== teams.length;

  return (
    <Modal onClose={requestClose} className="connect-scores-modal" labelledBy="connect-scores-title" busy={loading}>
      <header className="import-modal-head">
        <span className={`import-provider-mark ${provider}`}><img src={`/providers/${provider}.png`} alt="" /></span>
        <div>
          <span className="step-kicker">League scores</span>
          <h2 id="connect-scores-title">{preview ? "Match your teams" : "Connect for automatic scores"}</h2>
          <p>{preview ? "Map each team to its fantasy roster — you can change this anytime in Settings." : "Auto-fill weekly scores from a public ESPN or Sleeper league. Manual entry always stays available."}</p>
        </div>
        <button type="button" className="icon-button" aria-label="Close" onClick={requestClose}><X /></button>
      </header>

      {!preview ? (
        <PlatformConnectFields
          provider={provider}
          onProviderChange={(next) => { setProvider(next); setError(null); }}
          identifier={identifier}
          onIdentifierChange={setIdentifier}
          seasonYear={seasonYear}
          onSeasonChange={setSeasonYear}
          seasonOptions={seasonOptions}
          loading={loading}
          error={error}
        />
      ) : (
        <div className="import-modal-body">
          {countMismatch && <div className="import-warning"><span><strong>{candidates.length} fantasy teams vs {teams.length} in your league.</strong>Map the ones that line up; leave the rest on manual entry.</span></div>}
          <TeamMap teams={teams} candidates={candidates} assignments={mapState.assign} confidenceByTeam={mapState.conf} onAssign={assign} />
          <label className="connect-auto-toggle">
            <input type="checkbox" checked={autoSync} onChange={(event) => setAutoSync(event.target.checked)} />
            <span><strong>Keep scores up to date automatically</strong><small>Refreshes on its own within about 15 minutes of each slate of games finishing. You can still refresh manually anytime.</small></span>
          </label>
        </div>
      )}

      <footer className="import-modal-actions">
        <button type="button" className="button-secondary visible" disabled={loading} onClick={preview ? backToConnect : requestClose}>{preview ? <><ArrowLeft />Back</> : dismissLabel}</button>
        {!preview
          ? <button type="button" className="button-primary" disabled={!canStart || loading} onClick={findTeams}>{loading ? <><LoaderCircle className="spin" />Finding…</> : "Find teams"}</button>
          : <button type="button" className="button-primary" disabled={mappedCount === 0} onClick={confirm}><Check />Connect {mappedCount > 0 ? `${mappedCount} ` : ""}scores</button>}
      </footer>

      {discardPrompt && <ConfirmDialog
        role="alertdialog"
        tone="danger"
        icon={<Trash />}
        kicker="UNSAVED MAPPING"
        title="Discard this connection?"
        closeLabel="Keep editing"
        onClose={() => setDiscardPrompt(false)}
        actions={[
          { label: "Keep editing", onClick: () => setDiscardPrompt(false), variant: "secondary", autoFocus: true },
          { label: "Discard", onClick: () => { setDiscardPrompt(false); abortRef.current?.abort(); onClose(); }, variant: "danger", icon: <Trash /> },
        ]}
      >
        <p>Your team matches won’t be saved. You can connect scores again anytime from Settings.</p>
      </ConfirmDialog>}
    </Modal>
  );
}
