"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, HelpCircle, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";
import type { PlatformProvider } from "@/lib/types";

// The connect step for score-syncing an existing (manually-built) league to a
// PUBLIC ESPN or Sleeper league. Public leagues only — no cookies, no password,
// ever. Controlled by the parent so the modal owns fetch/state; this component
// is purely the form. Reuses the import modal's classes so it reads identically.
export function PlatformConnectFields({
  provider,
  onProviderChange,
  identifier,
  onIdentifierChange,
  seasonYear,
  onSeasonChange,
  seasonOptions,
  loading,
  error,
}: {
  provider: PlatformProvider;
  onProviderChange: (provider: PlatformProvider) => void;
  identifier: string;
  onIdentifierChange: (identifier: string) => void;
  seasonYear: number;
  onSeasonChange: (year: number) => void;
  seasonOptions: SelectOption[];
  loading: boolean;
  error: string | null;
}) {
  const [espnHelpOpen, setEspnHelpOpen] = useState(false);
  // Season defaults to the schedule's year, which is right for the common case
  // (build a 2025 league → connect your 2025 fantasy league). The picker is a
  // rarely-needed override — e.g. back-filling last season — so it stays tucked.
  const [seasonOpen, setSeasonOpen] = useState(false);
  // ESPN league IDs are numeric (its share URLs carry `leagueId=<number>`), so a
  // value with no digit is almost certainly a typo — flag it before a round-trip.
  const espnIdentifierInvalid = provider === "espn" && identifier.trim().length > 0 && !/\d/.test(identifier);

  return (
    <div className="import-modal-body">
      <div className="import-form-grid">
        <label><span>Fantasy platform</span>
          <CustomSelect label="Fantasy platform" value={provider} onChange={(value) => onProviderChange(value as PlatformProvider)} options={[
            { value: "sleeper", label: "Sleeper", description: "No password needed" },
            { value: "espn", label: "ESPN", description: "Public leagues only" },
          ]} />
        </label>
        <label><span>{provider === "sleeper" ? "League ID or username" : "Public ESPN league URL or ID"}</span>
          <input
            autoFocus
            value={identifier}
            onChange={(event) => onIdentifierChange(event.target.value)}
            placeholder={provider === "sleeper" ? "Example: 123456789 or username" : "https://fantasy.espn.com/football/league?leagueId=11593953"}
          />
        </label>
      </div>

      <div className="import-season-note">
        <span>Pulling the <strong>{seasonYear}</strong> season</span>
        <button type="button" onClick={() => setSeasonOpen((current) => !current)}>{seasonOpen ? "Done" : "Change season"}</button>
      </div>
      {seasonOpen && <label className="import-season-field"><span>Season</span>
        <CustomSelect label="Score season" value={String(seasonYear)} onChange={(value) => onSeasonChange(Number(value))} options={seasonOptions} />
      </label>}

      <p className="import-hint"><RefreshCw />{provider === "sleeper"
        ? "Read-only. Works with your league ID or Sleeper username — refresh scores anytime, no password."
        : "Read-only. Public ESPN leagues only — refresh scores whenever you click, no password, ever."}</p>

      {espnIdentifierInvalid && <p className="import-inline-hint"><AlertCircle />Add your league URL or the numeric League ID — usually the number right after “leagueId=”.</p>}

      {provider === "espn" && <>
        <div className="import-public-note"><ShieldCheck /><div><strong>Your ESPN league must be public to connect.</strong><span>LeagueWeaver reads public league data only — it never needs your ESPN password.</span></div></div>
        <div className="import-help">
          <button type="button" className="import-help-toggle" aria-expanded={espnHelpOpen} onClick={() => setEspnHelpOpen((current) => !current)}><HelpCircle />Find your League ID &amp; make your league public<ChevronDown className={espnHelpOpen ? "open" : ""} /></button>
          {espnHelpOpen && <div className="import-help-steps">
            <div>
              <strong>On desktop</strong>
              <ol>
                <li>Open your league at fantasy.espn.com — your League ID is the number after <code>leagueId=</code> in the address bar. Paste the whole URL or just that number above.</li>
                <li>From League Home, go to League → Settings.</li>
                <li>On the Basic Settings card, set “Make League Viewable to Public” to Yes (click Edit first if it’s set to No).</li>
              </ol>
            </div>
            <div>
              <strong>In the ESPN app</strong>
              <ol>
                <li>Tap the League tab, then League Info.</li>
                <li>Find your League ID on the Basic Settings card.</li>
                <li>On that same card, confirm “Make League Viewable to Public” is Yes.</li>
              </ol>
            </div>
          </div>}
        </div>
      </>}

      {loading && <p className="import-inline-hint import-inline-hint-wait"><LoaderCircle className="spin" />Finding your league — public ESPN and Sleeper leagues usually take just a few seconds.</p>}
      {error && <div className="import-error" role="alert"><AlertCircle />{error}</div>}
    </div>
  );
}
