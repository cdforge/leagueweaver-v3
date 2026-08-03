const AUTO_MONOGRAM_BLOCKLIST = new Set([
  "ASS", "CUM", "CNT", "CUN", "DCK", "DIK", "FAG", "FCK", "FUC", "FUK", "KKK", "NIG", "NGR", "PNS", "SEX", "WTF",
]);

function words(value: string) {
  return value.trim().split(/\s+/).map((word) => word.replace(/[^A-Za-z]/g, "")).filter(Boolean);
}

function safeCandidate(candidates: string[], fallback: string) {
  for (const value of candidates) {
    const candidate = value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3);
    if (candidate && !AUTO_MONOGRAM_BLOCKLIST.has(candidate)) return candidate;
  }
  return fallback;
}

function nameCandidates(name: string) {
  const nameWords = words(name);
  const kept = nameWords.map((word) => `${word[0]}${word.slice(1).replace(/[AEIOUaeiou]/g, "")}`).join("");
  const letters = nameWords.join("");
  const candidates = kept.length >= 3 ? [kept, letters] : [letters, kept];
  return candidates;
}

export function entityMonogram(name: string, city = "") {
  const cityWords = words(city);
  const nameWords = words(name);
  const candidates: string[] = [];
  if (cityWords.length >= 2) {
    const multiCity = `${cityWords[0][0]}${cityWords[1][0]}${nameWords[0]?.[0] ?? ""}`;
    if (multiCity.length >= 2) candidates.push(multiCity);
  } else if (cityWords.length === 1) {
    candidates.push(cityWords[0].slice(0, 3));
  }
  candidates.push(...nameCandidates(name));
  return safeCandidate(candidates, "TM");
}

export function leagueAcronym(name: string) {
  const nameWords = words(name);
  const primary = nameWords.length > 1 ? nameWords.slice(0, 3).map((word) => word[0]).join("") : nameWords[0]?.slice(0, 3) ?? "";
  return safeCandidate([primary, ...nameCandidates(name)], "LW");
}

export function divisionAcronym(name: string) {
  const nameWords = words(name);
  const letteredDivision = /^division\s+([a-z])$/i.exec(name.trim());
  const primary = letteredDivision
    ? `${letteredDivision[1]}FC`
    : nameWords[0] ? `${nameWords[0][0]}FC` : "";
  return safeCandidate([primary, nameWords.join("").slice(0, 3)], "DIV");
}

export function conferenceAcronym(name: string) {
  const nameWords = words(name);
  const primary = nameWords[0] ? `${nameWords[0][0]}FC` : "";
  return safeCandidate([primary, nameWords.join("").slice(0, 3)], "CONF");
}

function divisionLetter(name: string, initials: string | undefined) {
  const letteredDivision = /^division\s+([a-z])$/i.exec(name.trim());
  if (letteredDivision) return letteredDivision[1].toUpperCase();
  const resolved = resolveInitials(initials, divisionAcronym(name)).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return words(name)[0]?.[0]?.toUpperCase() || resolved[0] || "D";
}

export function conferenceDivisionAcronym(divisionName: string, divisionInitials: string | undefined, conferenceName: string, conferenceInitials: string | undefined, _compact = false) {
  const conference = resolveInitials(conferenceInitials, conferenceAcronym(conferenceName)).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `${conference || "C"}-${divisionLetter(divisionName, divisionInitials)}`;
}

export function resolveInitials(initials: string | undefined, automatic: string) {
  return initials?.trim() ? initials.trim().slice(0, 4) : automatic;
}
