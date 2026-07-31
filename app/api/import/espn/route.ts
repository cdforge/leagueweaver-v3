import { NextResponse } from "next/server";
import type { ImportPreview } from "@/lib/types";
import { fetchEspnLeague, parseEspnLeagueId, scanEspnHistory, type EspnAuthInput, type EspnMember, type EspnTeam } from "@/lib/platform/espn";

interface EspnSplitName { city: string; name: string; inferred: boolean; ruleMatched: boolean }

const ESPN_FULL_TEAM_NAME_RULES: string[] = [];

const ESPN_CITY_PREFIX_RULES = [
  "East Atlanta",
  "West End",
  "Down South",
  "McDonough",
  "Cumgetsum",
  "Bandera",
  "Decatur",
  "Georgia",
  "Rex",
];

const ESPN_TEAM_SUFFIX_RULES = [
  "MetaMookDawgs",
  "Decoupes",
  "Popeyes",
  "Yardies",
  "Mutts",
  "Savages",
  "Champs",
  "Eagles",
  "Kings",
  "Green",
];

const ESPN_TEAM_COLOR_RULES: Record<string, string[]> = {
  "bandera decoupes": ["#BC2539", "#F2F0EE", "#1A1A18", "#494A49", "#C4C3C2"],
  "uncross your mutts": ["#BDBDBD", "#4A4A4A", "#8E8E8E", "#161616", "#EDEDED"],
  "west end popeyes": ["#FF8B29", "#15101A", "#D8D8DA", "#A5A3A7", "#757378"],
  "cumgetsum yardies": ["#FFB91B", "#027546", "#F1F5F3", "#5F5F60", "#949294"],
  "decatur metamookdawgs": ["#F292FF", "#1A131B", "#EEEEED", "#BD5FF1", "#5D3663"],
  "east atlanta savages": ["#FF0000", "#AF0014", "#300306", "#2C2C2C", "#D6D6D6"],
  "georgia green": ["#071A7D", "#00FFD0", "#9098C3", "#324393", "#048EA4"],
  "down south champs": ["#E3B940", "#15231C", "#F4F7F5", "#806000", "#C9A030"],
  "rex eagles": ["#93FF41", "#BEBEBE", "#1E330F", "#60AA2C", "#E9E9E9"],
  "mcdonough kings": ["#6400DB", "#430096", "#FFB61C", "#AAAAAA", "#D9D9D9"],
};

function cleanText(value?: string | null) {
  return value?.trim() || "";
}

function normalizedName(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function splitByRule(fullName: string) {
  const normalizedFullName = normalizedName(fullName);
  if (ESPN_FULL_TEAM_NAME_RULES.some((rule) => normalizedName(rule) === normalizedFullName)) {
    return { city: "", name: fullName };
  }

  const cityPrefix = [...ESPN_CITY_PREFIX_RULES]
    .sort((left, right) => right.length - left.length)
    .find((rule) => normalizedFullName.startsWith(`${normalizedName(rule)} `));
  if (cityPrefix) return { city: fullName.slice(0, cityPrefix.length), name: fullName.slice(cityPrefix.length).trim() };

  const teamSuffix = [...ESPN_TEAM_SUFFIX_RULES]
    .sort((left, right) => right.length - left.length)
    .find((rule) => normalizedFullName.endsWith(` ${normalizedName(rule)}`));
  if (teamSuffix) return { city: fullName.slice(0, -teamSuffix.length).trim(), name: fullName.slice(-teamSuffix.length) };

  return null;
}

function cleanDivisionName(value: string) {
  return value.replace(/\s+division$/i, "").trim();
}

function teamColor(fullName: string) {
  return ESPN_TEAM_COLOR_RULES[normalizedName(fullName)]?.[0];
}

function teamColorSuggestions(fullName: string) {
  return ESPN_TEAM_COLOR_RULES[normalizedName(fullName)];
}

function managerName(member?: EspnMember) {
  if (!member) return "";
  const realName = [member.firstName, member.lastName].map(cleanText).filter(Boolean).join(" ");
  if (realName) return realName;
  const displayName = cleanText(member.displayName);
  return /^espnfan\d+$/i.test(displayName) ? "" : displayName;
}

function splitTeamName(team: EspnTeam, fallback: string): EspnSplitName {
  const city = cleanText(team.location);
  const nickname = cleanText(team.nickname);
  if (city || nickname) return { city, name: nickname || cleanText(team.name) || cleanText(team.abbrev) || fallback, inferred: false, ruleMatched: false };

  const fullName = cleanText(team.name) || cleanText(team.abbrev) || fallback;
  const ruleSplit = splitByRule(fullName);
  if (ruleSplit) return { ...ruleSplit, inferred: true, ruleMatched: true };

  const words = fullName.split(/\s+/).filter(Boolean);
  if (words.length < 2) return { city: "", name: fullName, inferred: false, ruleMatched: false };
  return { city: words.slice(0, -1).join(" "), name: words.at(-1) || fullName, inferred: true, ruleMatched: false };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: string; seasonYear?: number; swid?: string; espnS2?: string };
    const identifier = body.identifier?.trim() ?? "";
    const seasonYear = Number(body.seasonYear);
    const leagueId = parseEspnLeagueId(identifier);
    if (!leagueId || !Number.isInteger(seasonYear)) return NextResponse.json({ error: "Paste a public ESPN league URL or league ID and choose a season." }, { status: 400 });
    const auth: EspnAuthInput | undefined = body.swid?.trim() && body.espnS2?.trim() ? { swid: body.swid.trim(), espnS2: body.espnS2.trim() } : undefined;
    const league = await fetchEspnLeague(leagueId, seasonYear, ["mTeam", "mSettings", "mDraftDetail"], auth);
    const dataFound = await scanEspnHistory(leagueId, seasonYear, auth).catch(() => ({
      availableHistoryYears: [seasonYear],
      blockedHistoryYears: [],
      hasDraftData: Boolean(league.draftDetail?.picks?.length),
      hasRosterData: false,
      hasPlayerData: false,
      hasScoreSync: true,
    }));
    const members = new Map((league.members ?? []).map((member) => [member.id, member]));
    const divisions = new Map((league.settings?.scheduleSettings?.divisions ?? []).map((division) => [division.id, division.name || `Division ${division.id}`]));
    let inferredTeamNames = false;
    let ruleMatchedTeamNames = false;
    const teams = (league.teams ?? []).map((team, index) => {
      const ownerId = team.primaryOwner || team.owners?.[0];
      const owner = ownerId ? members.get(ownerId) : undefined;
      const fullName = cleanText(team.name) || cleanText(team.abbrev) || `Team ${index + 1}`;
      const splitName = splitTeamName(team, `Team ${index + 1}`);
      inferredTeamNames ||= splitName.inferred;
      ruleMatchedTeamNames ||= Boolean(splitName.ruleMatched);
      return {
        providerId: `espn-${leagueId}-${team.id}`,
        city: splitName.city,
        name: splitName.name,
        manager: managerName(owner),
        division: team.divisionId == null ? "" : cleanDivisionName(divisions.get(team.divisionId) || `Division ${team.divisionId}`),
        rank: index + 1,
        color: teamColor(fullName),
        colorSuggestions: teamColorSuggestions(fullName),
        logoUrl: cleanText(team.logo) || undefined,
      };
    });
    if (teams.length === 0) return NextResponse.json({ error: "That ESPN league loaded, but no teams were found." }, { status: 400 });
    const preview: ImportPreview = {
      provider: "espn",
      providerLeagueId: String(league.id || leagueId),
      leagueName: league.settings?.name || "ESPN league",
      seasonYear: league.seasonId || seasonYear,
      teams,
      dataFound,
      authType: auth ? "private-cookie" : "public",
      syncMode: "manual",
      warnings: [
        auth
          ? "ESPN private access is active — League Weaver never asks for your ESPN password."
          : "Double-check each team name and division below before continuing.",
        ...(inferredTeamNames || ruleMatchedTeamNames ? ["ESPN combines city and team in one field — we've split them for you, so give each a quick look."] : []),
      ],
      requiresConfirmation: true,
    };
    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error && /authorized|private|forbidden/i.test(error.message)
      ? "That ESPN league or season needs permission. Use a public league, or add SWID and espn_s2 from your own ESPN browser session."
      : "That ESPN league could not be imported. Check the public URL, league ID, season, and permission values.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
