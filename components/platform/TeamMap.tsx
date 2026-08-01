"use client";

import { AlertCircle, Check } from "lucide-react";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";
import type { MappingCandidate, MatchConfidence } from "@/lib/platform/matchTeams";
import type { Team } from "@/lib/types";

const NONE = "";

// ESPN exposes owners as anonymized handles (e.g. ESPNFAN7436046405) for everyone
// but the account holder — useless as a label — so we hide those and lean on the
// team name. Real display names (Sleeper, or the owner themselves) pass through.
function ownerLabel(manager?: string) {
  if (!manager?.trim()) return undefined;
  return /^espnfan/i.test(manager.replace(/[^a-z]/gi, "")) ? undefined : manager.trim();
}

function abbreviate(team: Team) {
  return team.initials || team.name.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase() || "T";
}

// One row per LeagueWeaver team → the external roster it maps to. Selections are
// held by the parent (which enforces one roster per team); this component renders
// the pre-filled matches and reports changes. Only the providerId matters
// downstream — score sync joins on Team.providerId.
export function TeamMap({ teams, candidates, assignments, confidenceByTeam, onAssign }: {
  teams: Team[];
  candidates: MappingCandidate[];
  /** teamId → chosen providerId (null = left manual). */
  assignments: Map<string, string | null>;
  confidenceByTeam: Map<string, MatchConfidence>;
  onAssign: (teamId: string, providerId: string | null) => void;
}) {
  const teamByProvider = new Map<string, string>();
  assignments.forEach((providerId, teamId) => { if (providerId) teamByProvider.set(providerId, teamId); });
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));
  const unresolved = teams.filter((team) => !assignments.get(team.id)).length;

  return (
    <div className="team-map">
      <div className="team-map-controls">
        <span>Match each team to its roster in the {candidates.length}-team fantasy league</span>
        {unresolved > 0
          ? <span className="import-status blocked"><AlertCircle />{unresolved} to choose</span>
          : <span className="import-status ready"><Check />All matched</span>}
      </div>
      <div className="team-map-list">
        {teams.map((team) => {
          const selected = assignments.get(team.id) ?? NONE;
          const confidence = confidenceByTeam.get(team.id) ?? "none";
          const options: SelectOption[] = [
            { value: NONE, label: "Not connected", description: "Enter this team’s scores manually" },
            ...candidates.map((candidate) => {
              const heldBy = teamByProvider.get(candidate.providerId);
              const elsewhere = heldBy && heldBy !== team.id ? `Mapped to ${teamNameById.get(heldBy)}` : ownerLabel(candidate.manager);
              return {
                value: candidate.providerId,
                label: candidate.name,
                description: elsewhere,
                logoUrl: candidate.logoUrl,
                monogram: candidate.name.slice(0, 3).toUpperCase(),
              } satisfies SelectOption;
            }),
          ];
          return (
            <div key={team.id} className={`team-map-row${selected ? "" : " is-unset"}`}>
              <span className="import-review-swatch" style={{ background: team.color }} aria-hidden="true">{team.logoUrl ? <img src={team.logoUrl} alt="" /> : abbreviate(team)}</span>
              <span className="team-map-name"><strong>{team.name}</strong><small>{[team.city, ownerLabel(team.manager)].filter(Boolean).join(" · ") || "Your team"}</small></span>
              <CustomSelect label={`Fantasy roster for ${team.name}`} value={selected} options={options} onChange={(value) => onAssign(team.id, value || null)} />
              {selected
                ? confidence === "review"
                  ? <span className="import-status review"><AlertCircle />Check</span>
                  : <span className="import-status ready"><Check />Matched</span>
                : <span className="import-status blocked"><AlertCircle />Choose</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
