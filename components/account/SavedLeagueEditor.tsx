"use client";

import { useState } from "react";
import { AlertCircle, Check, LoaderCircle, Pencil, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { IdentityColorPicker } from "@/components/ui/IdentityColorPicker";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { divisionAcronym, leagueAcronym, resolveInitials } from "@/lib/monograms";
import { teamInitials } from "@/lib/teamIdentity";
import { normalizeSavedLeague } from "@/lib/savedLeagues";
import type { Division, SavedLeagueIdentity, SavedLeaguePreset, Team } from "@/lib/types";

type EditTab = "league" | "teams" | "divisions";

// A focused editor for a saved league: it loads the full saved identity, exposes the content
// commissioners actually change (league identity, every team, and divisions), and preserves the
// rest of the payload (display prefs, prior season, playoff naming) untouched on save.
export function SavedLeagueEditor({ preset, onClose, onSaved }: { preset: SavedLeaguePreset; onClose: () => void; onSaved: (updated: SavedLeaguePreset) => void }) {
  const [data, setData] = useState<SavedLeagueIdentity>(() => structuredClone(preset.data));
  const [tab, setTab] = useState<EditTab>("league");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLeague = (patch: Partial<SavedLeagueIdentity["league"]>) => setData((current) => ({ ...current, league: { ...current.league, ...patch } }));
  const updateTeam = (id: string, patch: Partial<Team>) => setData((current) => ({ ...current, teams: current.teams.map((team) => team.id === id ? { ...team, ...patch } : team) }));
  const updateDivision = (id: string, patch: Partial<Division>) => setData((current) => ({ ...current, divisions: current.divisions.map((division) => division.id === id ? { ...division, ...patch } : division) }));

  const divisionOptions = data.divisions.map((division) => ({ value: division.id, label: division.name || "Division", swatch: division.color, logoUrl: division.logoUrl, monogram: resolveInitials(division.initials, divisionAcronym(division.name)) }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/saved-leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preset.id, name: data.league.name || preset.name, data }),
      });
      const payload = await response.json().catch(() => ({})) as { preset?: { id: string; name: string; data: unknown; updated_at?: string }; error?: string };
      const normalized = payload.preset ? normalizeSavedLeague(payload.preset) : null;
      if (!response.ok || !normalized) throw new Error(payload.error || "This league could not be saved.");
      onSaved(normalized);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This league could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} className="saved-league-editor" label={`Edit ${preset.name}`} busy={saving}>
      <header className="saved-league-editor-head">
        <span className="saved-league-editor-mark"><Pencil /></span>
        <div><span className="step-kicker">Edit saved league</span><h2>{data.league.name || preset.name}</h2><p>Update identity, teams, and divisions — changes save back to this saved league.</p></div>
        <button type="button" className="icon-button" aria-label="Close editor" onClick={onClose}><X /></button>
      </header>

      <div className="saved-league-editor-tabs" role="tablist" aria-label="Edit sections">
        <button type="button" role="tab" aria-selected={tab === "league"} className={tab === "league" ? "active" : ""} onClick={() => setTab("league")}>League</button>
        <button type="button" role="tab" aria-selected={tab === "teams"} className={tab === "teams" ? "active" : ""} onClick={() => setTab("teams")}>Teams<span className="saved-league-editor-count">{data.teams.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === "divisions"} className={tab === "divisions" ? "active" : ""} onClick={() => setTab("divisions")}>Divisions<span className="saved-league-editor-count">{data.divisions.length}</span></button>
      </div>

      <div className="saved-league-editor-body">
        {tab === "league" && <div className="editor-league">
          <div className="editor-identity-row">
            <IdentityColorPicker name={data.league.name || "league"} abbreviation={resolveInitials(data.league.initials, leagueAcronym(data.league.name))} color={data.league.color} logoUrl={data.league.logoUrl} onChange={(next) => updateLeague(next)} />
            <label className="editor-field"><span>League name</span><input value={data.league.name} maxLength={80} onChange={(event) => updateLeague({ name: event.target.value, abbreviation: leagueAcronym(event.target.value) })} /></label>
          </div>
          <label className="editor-field"><span>Description</span><input value={data.league.description} maxLength={140} placeholder="Optional tagline for this league" onChange={(event) => updateLeague({ description: event.target.value })} /></label>
        </div>}

        {tab === "teams" && <div className="editor-teams">
          {data.teams.map((team) => <div className="editor-team-row" key={team.id}>
            <IdentityColorPicker compact name={team.name || "team"} abbreviation={teamInitials(team)} color={team.color} logoUrl={team.logoUrl} onChange={(next) => updateTeam(team.id, next)} />
            <label className="editor-field"><span>City</span><input value={team.city} placeholder="City" onChange={(event) => updateTeam(team.id, { city: event.target.value })} /></label>
            <label className="editor-field"><span>Team</span><input value={team.name} placeholder="Team name" onChange={(event) => updateTeam(team.id, { name: event.target.value })} /></label>
            <label className="editor-field"><span>Manager</span><input value={team.manager} placeholder="Manager" onChange={(event) => updateTeam(team.id, { manager: event.target.value })} /></label>
            <label className="editor-field"><span>Venue</span><input value={team.stadium} placeholder="Home venue" onChange={(event) => updateTeam(team.id, { stadium: event.target.value })} /></label>
            <label className="editor-field editor-field-select"><span>Division</span><CustomSelect label={`${team.name || "Team"} division`} value={team.divisionId} onChange={(divisionId) => updateTeam(team.id, { divisionId })} options={divisionOptions} /></label>
          </div>)}
        </div>}

        {tab === "divisions" && <div className="editor-divisions">
          {data.divisions.map((division) => <div className="editor-division-row" key={division.id}>
            <IdentityColorPicker compact name={`${division.name || "division"} division`} abbreviation={resolveInitials(division.initials, divisionAcronym(division.name))} color={division.color} logoUrl={division.logoUrl} onChange={(next) => updateDivision(division.id, next)} />
            <label className="editor-field"><span>Division name</span><input value={division.name} placeholder="Division name" onChange={(event) => updateDivision(division.id, { name: event.target.value })} /></label>
          </div>)}
        </div>}
      </div>

      {error && <div className="import-error" role="alert"><AlertCircle />{error}</div>}

      <footer className="saved-league-editor-actions">
        <button type="button" className="button-secondary visible" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="button-primary" onClick={save} disabled={saving}>{saving ? <><LoaderCircle className="spin" />Saving…</> : <><Check />Save changes</>}</button>
      </footer>
    </Modal>
  );
}
