module.exports = [
"[project]/.claude/worktrees/playoff-suite/lib/colorContrast.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "accessibleAccentColor",
    ()=>accessibleAccentColor,
    "accessibleTeamColor",
    ()=>accessibleTeamColor,
    "readableTextColor",
    ()=>readableTextColor,
    "tintColor",
    ()=>tintColor
]);
function channel(value) {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
    const clean = hex.replace("#", "");
    const value = clean.length === 3 ? clean.split("").map((part)=>part + part).join("") : clean;
    if (!/^[0-9a-f]{6}$/i.test(value)) return 0;
    const red = channel(parseInt(value.slice(0, 2), 16));
    const green = channel(parseInt(value.slice(2, 4), 16));
    const blue = channel(parseInt(value.slice(4, 6), 16));
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
function rgb(hex) {
    const clean = hex.replace("#", "");
    const value = clean.length === 3 ? clean.split("").map((part)=>part + part).join("") : clean;
    if (!/^[0-9a-f]{6}$/i.test(value)) return [
        17,
        122,
        69
    ];
    return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16)
    ];
}
function mixColor(color, target, amount) {
    const from = rgb(color);
    const to = rgb(target);
    const mixed = from.map((value, index)=>Math.round(value + (to[index] - value) * amount));
    return `#${mixed.map((value)=>value.toString(16).padStart(2, "0")).join("")}`;
}
function contrastRatio(first, second) {
    const firstLuminance = luminance(first);
    const secondLuminance = luminance(second);
    return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}
function tintColor(color, amount = 0.82) {
    const mixed = rgb(color).map((value)=>Math.round(value + (255 - value) * amount));
    return `#${mixed.map((value)=>value.toString(16).padStart(2, "0")).join("")}`;
}
function accessibleAccentColor(color, background = "#15231C") {
    const backgroundLuminance = luminance(background);
    for (const amount of [
        0,
        0.18,
        0.32,
        0.46,
        0.6,
        0.74,
        0.84
    ]){
        const candidate = tintColor(color, amount);
        const candidateLuminance = luminance(candidate);
        const contrast = (Math.max(backgroundLuminance, candidateLuminance) + 0.05) / (Math.min(backgroundLuminance, candidateLuminance) + 0.05);
        if (contrast >= 4.5) return candidate;
    }
    return "#FFFFFF";
}
function accessibleTeamColor(color, background = "#FFFFFF") {
    for (const amount of [
        0,
        0.16,
        0.28,
        0.4,
        0.54,
        0.68,
        0.82
    ]){
        const candidate = mixColor(color, "#15231C", amount);
        if (contrastRatio(candidate, background) >= 4.5) return candidate;
    }
    return "#15231C";
}
function readableTextColor(background) {
    const ink = "#15231C";
    const inkContrast = contrastRatio(ink, background);
    const whiteContrast = contrastRatio("#FFFFFF", background);
    const softBest = inkContrast >= whiteContrast ? ink : "#FFFFFF";
    if (Math.max(inkContrast, whiteContrast) >= 4.5) return softBest;
    // Mid-tone: neither soft option clears AA. Fall back to the pure extreme with
    // the most contrast — one of pure black / white always exceeds 4.5:1.
    return contrastRatio("#000000", background) >= whiteContrast ? "#000000" : "#FFFFFF";
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/defaults.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createBlankSetup",
    ()=>createBlankSetup,
    "createDefaultSetup",
    ()=>createDefaultSetup,
    "createDivisions",
    ()=>createDivisions,
    "createTeams",
    ()=>createTeams
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/monograms.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/playoffs.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$tiebreakers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/tiebreakers.ts [app-ssr] (ecmascript)");
;
;
;
const TEAM_NAMES = [
    "Sunday Architects",
    "Goal Line Guild",
    "Fourth & Forever",
    "Gridiron Union",
    "Red Zone Society",
    "Huddle House",
    "Blitz Department",
    "Two Minute Club",
    "Waiver Wire Works",
    "End Zone Office",
    "Prime Time Crew",
    "The Audible",
    "Pocket Presence",
    "First Down Foundry",
    "Play Action Club",
    "Victory Formation"
];
const TEAM_CITIES = [
    "Brooklyn",
    "Austin",
    "Chicago",
    "Phoenix",
    "Seattle",
    "Nashville",
    "Baltimore",
    "Portland",
    "Denver",
    "Atlanta",
    "Boston",
    "Detroit",
    "Charlotte",
    "San Diego",
    "Cleveland",
    "Las Vegas"
];
const TEAM_COLORS = [
    "#B91C1C",
    "#1D4ED8",
    "#7C3AED",
    "#C2410C",
    "#047857",
    "#BE185D",
    "#0369A1",
    "#4D7C0F",
    "#A16207",
    "#4338CA",
    "#0F766E",
    "#9F1239",
    "#6D28D9",
    "#C2410C",
    "#166534",
    "#1E40AF"
];
const STADIUMS = [
    "Foundry Field",
    "Union Stadium",
    "The Yard",
    "Commissioner Park",
    "Victory Grounds",
    "Sunday Stadium",
    "The Gridiron",
    "Championship Field"
];
function createDivisions(count = 2) {
    const names = count === 2 ? [
        "North",
        "South"
    ] : count === 3 ? [
        "North",
        "Central",
        "South"
    ] : [
        "North",
        "South",
        "East",
        "West"
    ];
    const colors = [
        "#117A45",
        "#B42318",
        "#2457A7",
        "#7A4A12"
    ];
    return names.map((name, index)=>({
            id: `division-${index + 1}`,
            name,
            color: colors[index]
        }));
}
function createTeams(teamCount, divisions) {
    return Array.from({
        length: teamCount
    }, (_, index)=>({
            id: `team-${index + 1}`,
            city: TEAM_CITIES[index],
            name: TEAM_NAMES[index],
            shortName: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["entityMonogram"])(TEAM_NAMES[index], TEAM_CITIES[index]),
            manager: `Manager ${index + 1}`,
            color: TEAM_COLORS[index],
            divisionId: divisions[index % divisions.length].id,
            overallRank: index + 1,
            stadium: STADIUMS[index % STADIUMS.length]
        }));
}
function createDefaultSetup() {
    const divisions = createDivisions(2);
    return {
        id: "local-season",
        name: "Sunday Night League",
        abbreviation: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])("Sunday Night League"),
        description: "A competitive home league built for a fair, memorable season.",
        color: "#117A45",
        seasonYear: 2026,
        weeks: 14,
        divisions,
        teams: createTeams(10, divisions),
        display: {
            cityNames: true,
            managers: true,
            venues: true
        },
        priorSeason: {
            enabled: true,
            hasData: true,
            entryMode: "history",
            source: "playoffs"
        },
        weekOne: {
            rankingSource: "prior-season"
        },
        tiebreakers: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$tiebreakers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeTiebreakerSettings"])(),
        playoffs: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createDefaultPlayoffSettings"])(10, "#117A45"),
        fairness: {
            maxHomeAwayStreak: 3,
            preventImmediateRematches: true,
            finalWeekDivisional: true,
            prioritizeOpeningWeek: true,
            prioritizeThanksgiving: true
        }
    };
}
function createBlankSetup() {
    const setup = createDefaultSetup();
    return {
        ...setup,
        name: "",
        abbreviation: "",
        description: "",
        logoUrl: undefined,
        divisions: setup.divisions.map((division)=>({
                ...division,
                logoUrl: undefined
            })),
        priorSeason: {
            ...setup.priorSeason,
            enabled: false,
            hasData: false,
            entryMode: "none"
        },
        teams: setup.teams.map((team, index)=>({
                ...team,
                city: "",
                name: `Team ${index + 1}`,
                shortName: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["entityMonogram"])(`Team ${index + 1}`),
                manager: "",
                logoUrl: undefined,
                overallRank: index + 1,
                stadium: `Team ${index + 1} Stadium`
            }))
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/teamIdentity.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "teamDisplayName",
    ()=>teamDisplayName,
    "teamInitials",
    ()=>teamInitials,
    "teamMonogram",
    ()=>teamMonogram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/monograms.ts [app-ssr] (ecmascript)");
;
function teamDisplayName(team, includeCity = true) {
    return [
        includeCity ? team.city?.trim() : "",
        team.name?.trim()
    ].filter(Boolean).join(" ") || "Untitled team";
}
function teamMonogram(city, name) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["entityMonogram"])(name, city);
}
function teamInitials(team) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(team.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["entityMonogram"])(team.name, team.city));
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/savedLeagues.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "identityFromSetup",
    ()=>identityFromSetup,
    "normalizeSavedLeague",
    ()=>normalizeSavedLeague
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/teamIdentity.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/monograms.ts [app-ssr] (ecmascript)");
;
;
function identityFromSetup(setup) {
    return {
        version: 3,
        league: {
            name: setup.name,
            abbreviation: setup.abbreviation,
            initials: setup.initials ?? "",
            description: setup.description,
            color: setup.color,
            logoUrl: setup.logoUrl
        },
        divisions: setup.divisions.map((division)=>({
                ...division,
                initials: division.initials ?? ""
            })),
        teams: setup.teams.map((team)=>({
                ...team,
                initials: team.initials ?? ""
            })),
        display: setup.display,
        priorSeason: setup.priorSeason,
        platformConnection: setup.platformConnection,
        playoffs: {
            name: setup.playoffs.name,
            color: setup.playoffs.color,
            theme: setup.playoffs.theme,
            logoUrl: setup.playoffs.logoUrl,
            roundNames: setup.playoffs.roundNames,
            roundLogoUrls: setup.playoffs.roundLogoUrls,
            gameNames: setup.playoffs.gameNames,
            gameLogoUrls: setup.playoffs.gameLogoUrls
        }
    };
}
function normalizeSavedLeague(row) {
    if (!row.data || typeof row.data !== "object") return null;
    const data = row.data;
    if ("version" in data && data.version === 3 && Array.isArray(data.divisions) && Array.isArray(data.teams)) {
        const divisions = data.divisions.map((division, index)=>normalizeDivision(division, index));
        const teams = data.teams.map((team, index)=>normalizeTeam(team, index, divisions[index % divisions.length]?.id || "division-1", data.teams.length));
        const hasLeagueInitials = Object.prototype.hasOwnProperty.call(data.league, "initials");
        const leagueInitials = hasLeagueInitials ? data.league.initials || undefined : data.league.abbreviation || undefined;
        const league = {
            ...data.league,
            initials: leagueInitials?.slice(0, 4),
            abbreviation: data.league.abbreviation || (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(data.league.name)
        };
        const priorSeason = data.priorSeason ? {
            ...data.priorSeason,
            entryMode: data.priorSeason.entryMode ?? (data.priorSeason.enabled ? data.priorSeason.hasData ? "history" : "manual" : "none")
        } : {
            enabled: false,
            hasData: false,
            entryMode: "none",
            source: "regular-season"
        };
        return {
            id: row.id,
            name: row.name,
            data: {
                ...data,
                league,
                divisions,
                teams,
                display: data.display || {
                    cityNames: true,
                    managers: true,
                    venues: true
                },
                priorSeason,
                platformConnection: data.platformConnection
            },
            updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
        };
    }
    const legacy = data;
    if (!legacy.leagueName || !Array.isArray(legacy.divisions)) return null;
    const legacyDivisions = legacy.divisions;
    const divisions = legacyDivisions.map((division, index)=>normalizeDivision({
            ...division,
            logoUrl: division.logo
        }, index));
    const legacyTeamCount = legacyDivisions.reduce((total, division)=>total + (division.teams?.length ?? 0), 0);
    const teams = legacyDivisions.flatMap((division, divisionIndex)=>(division.teams ?? []).map((team, teamIndex)=>{
            const index = teamsLengthBefore(legacyDivisions, divisionIndex) + teamIndex;
            return normalizeTeam({
                ...team,
                logoUrl: team.logo
            }, index, team.divisionId || divisions[divisionIndex].id, legacyTeamCount);
        }));
    return {
        id: row.id,
        name: row.name,
        data: {
            version: 3,
            league: {
                name: legacy.leagueName,
                abbreviation: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(legacy.leagueName),
                initials: legacy.leagueInitials?.slice(0, 4) || undefined,
                description: legacy.leagueDescription || "",
                color: legacy.leagueColor || "#117A45",
                logoUrl: legacy.leagueLogo || undefined
            },
            divisions,
            teams,
            display: {
                cityNames: true,
                managers: true,
                venues: true
            },
            priorSeason: {
                enabled: false,
                hasData: false,
                entryMode: "none",
                source: "regular-season"
            }
        },
        updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
    };
}
function normalizeDivision(division, index) {
    const hasInitials = Object.prototype.hasOwnProperty.call(division, "initials");
    const legacyAcronym = division.acronym;
    return {
        id: division.id || `division-${index + 1}`,
        name: division.name || `Division ${index + 1}`,
        initials: (hasInitials ? division.initials || undefined : legacyAcronym || undefined)?.slice(0, 4),
        color: division.color || "#117A45",
        logoUrl: division.logoUrl || undefined
    };
}
function normalizeTeam(team, index, fallbackDivisionId, teamCount) {
    const city = String(team.city || team.location || "").trim();
    const name = String(team.teamName || team.nickname || team.name || `Team ${index + 1}`).trim();
    const hasInitials = Object.prototype.hasOwnProperty.call(team, "initials");
    const initials = (hasInitials ? String(team.initials || "") || undefined : String(team.shortName || team.acronym || "") || undefined)?.slice(0, 4);
    const automatic = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamMonogram"])(city, name);
    const draftPlace = Number(team.draftPlace ?? team.draftScore);
    return {
        id: String(team.id || `team-${index + 1}`),
        providerId: typeof team.providerId === "string" ? team.providerId : undefined,
        city,
        name,
        shortName: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(initials, automatic),
        initials,
        manager: String(team.manager || team.owner || ""),
        color: String(team.color || "#117A45"),
        logoUrl: String(team.logoUrl || team.logo || "") || undefined,
        divisionId: String(team.divisionId || fallbackDivisionId),
        overallRank: Number(team.overallRank || team.overallSeed) || index + 1,
        draftPlace: Number.isInteger(draftPlace) && draftPlace >= 1 && draftPlace <= teamCount ? draftPlace : undefined,
        stadium: String(team.stadium || team.venue || `${name} Stadium`)
    };
}
function teamsLengthBefore(divisions, divisionIndex) {
    return divisions.slice(0, divisionIndex).reduce((total, division)=>total + (division.teams?.length ?? 0), 0);
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/crossDivisionPriority.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeCrossDivisionPriority",
    ()=>analyzeCrossDivisionPriority,
    "analyzeScheduledCrossDivisionInventoryPriority",
    ()=>analyzeScheduledCrossDivisionInventoryPriority,
    "analyzeScheduledCrossDivisionPriority",
    ()=>analyzeScheduledCrossDivisionPriority,
    "buildPrioritizedCrossDivisionPairCounts",
    ()=>buildPrioritizedCrossDivisionPairCounts,
    "buildScheduledCrossDivisionPairCounts",
    ()=>buildScheduledCrossDivisionPairCounts,
    "solveCrossDivisionPairCounts",
    ()=>solveCrossDivisionPairCounts,
    "toCrossDivisionPairKey",
    ()=>toCrossDivisionPairKey
]);
function normalizeSeed(seed) {
    return Number.isFinite(seed) ? Number(seed) : null;
}
function toCrossDivisionPairKey(teamAId, teamBId) {
    return [
        teamAId,
        teamBId
    ].sort().join("::");
}
function buildCrossDivisionPairs(teams) {
    const sameSeedPairs = [];
    const otherPairs = [];
    for(let index = 0; index < teams.length; index += 1){
        const teamA = teams[index];
        const teamASeed = normalizeSeed(teamA.divisionSeed);
        if (!teamA.divisionId) continue;
        for(let nextIndex = index + 1; nextIndex < teams.length; nextIndex += 1){
            const teamB = teams[nextIndex];
            const teamBSeed = normalizeSeed(teamB.divisionSeed);
            if (!teamB.divisionId || teamA.divisionId === teamB.divisionId) continue;
            const pair = {
                teamAId: teamA.id,
                teamBId: teamB.id,
                sameSeed: teamASeed != null && teamASeed === teamBSeed
            };
            if (pair.sameSeed) {
                sameSeedPairs.push(pair);
            } else {
                otherPairs.push(pair);
            }
        }
    }
    return {
        sameSeedPairs,
        otherPairs
    };
}
function shuffleInPlace(items, random) {
    for(let index = items.length - 1; index > 0; index -= 1){
        const nextIndex = Math.floor(random() * (index + 1));
        [items[index], items[nextIndex]] = [
            items[nextIndex],
            items[index]
        ];
    }
}
function allocatePair(pair, pairCounts, remainingGamesByTeam) {
    const nextA = (remainingGamesByTeam.get(pair.teamAId) ?? 0) - 1;
    const nextB = (remainingGamesByTeam.get(pair.teamBId) ?? 0) - 1;
    if (nextA < 0 || nextB < 0) {
        return false;
    }
    remainingGamesByTeam.set(pair.teamAId, nextA);
    remainingGamesByTeam.set(pair.teamBId, nextB);
    const key = toCrossDivisionPairKey(pair.teamAId, pair.teamBId);
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    return true;
}
function allocateUniqueStage(sourcePairs, pairCounts, remainingGamesByTeam, random) {
    while(true){
        const candidates = sourcePairs.filter((pair)=>(pairCounts.get(toCrossDivisionPairKey(pair.teamAId, pair.teamBId)) ?? 0) === 0).filter((pair)=>(remainingGamesByTeam.get(pair.teamAId) ?? 0) > 0 && (remainingGamesByTeam.get(pair.teamBId) ?? 0) > 0).sort((left, right)=>{
            const leftNeed = (remainingGamesByTeam.get(left.teamAId) ?? 0) + (remainingGamesByTeam.get(left.teamBId) ?? 0);
            const rightNeed = (remainingGamesByTeam.get(right.teamAId) ?? 0) + (remainingGamesByTeam.get(right.teamBId) ?? 0);
            if (leftNeed !== rightNeed) {
                return rightNeed - leftNeed;
            }
            return random() < 0.5 ? -1 : 1;
        });
        const candidate = candidates[0];
        if (!candidate) {
            return;
        }
        if (!allocatePair(candidate, pairCounts, remainingGamesByTeam)) {
            return;
        }
    }
}
function allocateRepeatStage(sourcePairs, pairCounts, remainingGamesByTeam, random) {
    while(true){
        const candidates = sourcePairs.filter((pair)=>(remainingGamesByTeam.get(pair.teamAId) ?? 0) > 0 && (remainingGamesByTeam.get(pair.teamBId) ?? 0) > 0).sort((left, right)=>{
            const leftCount = pairCounts.get(toCrossDivisionPairKey(left.teamAId, left.teamBId)) ?? 0;
            const rightCount = pairCounts.get(toCrossDivisionPairKey(right.teamAId, right.teamBId)) ?? 0;
            if (leftCount !== rightCount) {
                return leftCount - rightCount;
            }
            const leftNeed = (remainingGamesByTeam.get(left.teamAId) ?? 0) + (remainingGamesByTeam.get(left.teamBId) ?? 0);
            const rightNeed = (remainingGamesByTeam.get(right.teamAId) ?? 0) + (remainingGamesByTeam.get(right.teamBId) ?? 0);
            if (leftNeed !== rightNeed) {
                return rightNeed - leftNeed;
            }
            return random() < 0.5 ? -1 : 1;
        });
        const candidate = candidates[0];
        if (!candidate) {
            return;
        }
        if (!allocatePair(candidate, pairCounts, remainingGamesByTeam)) {
            return;
        }
    }
}
function buildPrioritizedCrossDivisionPairCounts(teams, initialRemainingGamesByTeam, random = Math.random) {
    const remainingGamesByTeam = new Map(initialRemainingGamesByTeam);
    const pairCounts = new Map();
    const { sameSeedPairs, otherPairs } = buildCrossDivisionPairs(teams);
    shuffleInPlace(sameSeedPairs, random);
    shuffleInPlace(otherPairs, random);
    allocateUniqueStage(sameSeedPairs, pairCounts, remainingGamesByTeam, random);
    allocateUniqueStage(otherPairs, pairCounts, remainingGamesByTeam, random);
    allocateRepeatStage(sameSeedPairs, pairCounts, remainingGamesByTeam, random);
    allocateRepeatStage(otherPairs, pairCounts, remainingGamesByTeam, random);
    return {
        pairCounts,
        remainingGamesByTeam
    };
}
function solveCrossDivisionPairCounts(teams, initialRemainingGamesByTeam, random = Math.random, options) {
    const orderedDivisionIds = Array.from(new Set(teams.map((team)=>team.divisionId).filter((divisionId)=>Boolean(divisionId)))).sort((left, right)=>{
        const leftOrder = options?.divisionOrder?.get(left) ?? 0;
        const rightOrder = options?.divisionOrder?.get(right) ?? 0;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.localeCompare(right);
    });
    const effectiveDivisionCount = Math.max(1, orderedDivisionIds.length);
    const maxAttempts = Math.max(8, options?.maxAttempts ?? teams.length);
    const maxRepairSteps = Math.max(1_000, options?.maxRepairSteps ?? 20_000);
    const teamSort = (left, right, remainingGamesByTeam)=>{
        const remainingDifference = (remainingGamesByTeam.get(right.id) ?? 0) - (remainingGamesByTeam.get(left.id) ?? 0);
        if (remainingDifference !== 0) return remainingDifference;
        const leftSeed = left.overallSeed ?? Number.MAX_SAFE_INTEGER;
        const rightSeed = right.overallSeed ?? Number.MAX_SAFE_INTEGER;
        if (leftSeed !== rightSeed) return leftSeed - rightSeed;
        const leftLabel = `${left.city ?? ""} ${left.name ?? ""}`.trim() || left.id;
        const rightLabel = `${right.city ?? ""} ${right.name ?? ""}`.trim() || right.id;
        return leftLabel.localeCompare(rightLabel);
    };
    const tryCompleteBuild = (remainingGamesByTeam, pairCounts)=>{
        const nextDivisionIndex = new Map(teams.map((team)=>[
                team.id,
                0
            ]));
        for(let guard = 0; guard < maxRepairSteps; guard += 1){
            const needers = teams.filter((team)=>(remainingGamesByTeam.get(team.id) ?? 0) > 0).sort((left, right)=>teamSort(left, right, remainingGamesByTeam));
            if (needers.length === 0) {
                return true;
            }
            const team = needers[0];
            const teamRemaining = remainingGamesByTeam.get(team.id) ?? 0;
            if (teamRemaining <= 0) continue;
            const teamDivisionPreference = nextDivisionIndex.get(team.id) ?? 0;
            const candidates = teams.filter((candidate)=>candidate.id !== team.id).filter((candidate)=>candidate.divisionId !== team.divisionId).filter((candidate)=>(remainingGamesByTeam.get(candidate.id) ?? 0) > 0).sort((left, right)=>{
                const leftPairKey = toCrossDivisionPairKey(team.id, left.id);
                const rightPairKey = toCrossDivisionPairKey(team.id, right.id);
                const leftPairCount = pairCounts.get(leftPairKey) ?? 0;
                const rightPairCount = pairCounts.get(rightPairKey) ?? 0;
                if (leftPairCount !== rightPairCount) return leftPairCount - rightPairCount;
                const leftSameSeed = left.divisionSeed === team.divisionSeed ? 1 : 0;
                const rightSameSeed = right.divisionSeed === team.divisionSeed ? 1 : 0;
                if (leftSameSeed !== rightSameSeed) return rightSameSeed - leftSameSeed;
                const leftDivisionRank = orderedDivisionIds.indexOf(left.divisionId ?? "");
                const rightDivisionRank = orderedDivisionIds.indexOf(right.divisionId ?? "");
                const leftCycleDistance = (leftDivisionRank - teamDivisionPreference + effectiveDivisionCount) % effectiveDivisionCount;
                const rightCycleDistance = (rightDivisionRank - teamDivisionPreference + effectiveDivisionCount) % effectiveDivisionCount;
                if (leftCycleDistance !== rightCycleDistance) return leftCycleDistance - rightCycleDistance;
                const leftNeed = (remainingGamesByTeam.get(team.id) ?? 0) + (remainingGamesByTeam.get(left.id) ?? 0);
                const rightNeed = (remainingGamesByTeam.get(team.id) ?? 0) + (remainingGamesByTeam.get(right.id) ?? 0);
                if (leftNeed !== rightNeed) return rightNeed - leftNeed;
                return random() < 0.5 ? -1 : 1;
            });
            const opponent = candidates[0];
            if (!opponent) {
                return false;
            }
            const key = toCrossDivisionPairKey(team.id, opponent.id);
            pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
            remainingGamesByTeam.set(team.id, teamRemaining - 1);
            remainingGamesByTeam.set(opponent.id, (remainingGamesByTeam.get(opponent.id) ?? 0) - 1);
            const opponentDivisionIndex = Math.max(0, orderedDivisionIds.indexOf(opponent.divisionId ?? ""));
            nextDivisionIndex.set(team.id, (opponentDivisionIndex + 1) % effectiveDivisionCount);
            const teamDivisionIndex = Math.max(0, orderedDivisionIds.indexOf(team.divisionId ?? ""));
            nextDivisionIndex.set(opponent.id, (teamDivisionIndex + 1) % effectiveDivisionCount);
        }
        return false;
    };
    let bestPairCounts = new Map();
    let bestRemainingGamesByTeam = new Map(initialRemainingGamesByTeam);
    let bestRemainingTotal = Number.POSITIVE_INFINITY;
    for(let attempt = 0; attempt < maxAttempts; attempt += 1){
        const initialBuild = buildPrioritizedCrossDivisionPairCounts(teams, initialRemainingGamesByTeam, random);
        const pairCounts = new Map(initialBuild.pairCounts);
        const remainingGamesByTeam = new Map(initialBuild.remainingGamesByTeam);
        const finished = tryCompleteBuild(remainingGamesByTeam, pairCounts);
        const remainingTotal = Array.from(remainingGamesByTeam.values()).reduce((sum, value)=>sum + Math.max(0, value), 0);
        if (remainingTotal < bestRemainingTotal) {
            bestRemainingTotal = remainingTotal;
            bestPairCounts = pairCounts;
            bestRemainingGamesByTeam = remainingGamesByTeam;
        }
        if (finished && remainingTotal === 0) {
            return {
                pairCounts,
                remainingGamesByTeam
            };
        }
    }
    return {
        pairCounts: bestPairCounts,
        remainingGamesByTeam: bestRemainingGamesByTeam
    };
}
function analyzeCrossDivisionPriority(teams, pairCounts) {
    const crossOpponentsByTeam = new Map();
    const sameSeedOpponentsByTeam = new Map();
    const playedOpponentsByTeam = new Map();
    const repeatedOpponentsByTeam = new Map();
    const repeatedSameSeedOpponentsByTeam = new Map();
    const repeatedOtherOpponentsByTeam = new Map();
    const teamById = new Map(teams.map((team)=>[
            team.id,
            team
        ]));
    teams.forEach((team)=>{
        crossOpponentsByTeam.set(team.id, []);
        sameSeedOpponentsByTeam.set(team.id, []);
        playedOpponentsByTeam.set(team.id, new Set());
        repeatedOpponentsByTeam.set(team.id, new Set());
        repeatedSameSeedOpponentsByTeam.set(team.id, new Set());
        repeatedOtherOpponentsByTeam.set(team.id, new Set());
    });
    for(let index = 0; index < teams.length; index += 1){
        const teamA = teams[index];
        const seedA = normalizeSeed(teamA.divisionSeed);
        if (!teamA.divisionId) continue;
        for(let nextIndex = index + 1; nextIndex < teams.length; nextIndex += 1){
            const teamB = teams[nextIndex];
            const seedB = normalizeSeed(teamB.divisionSeed);
            if (!teamB.divisionId || teamA.divisionId === teamB.divisionId) continue;
            crossOpponentsByTeam.get(teamA.id)?.push(teamB);
            crossOpponentsByTeam.get(teamB.id)?.push(teamA);
            const sameSeed = seedA != null && seedA === seedB;
            if (sameSeed) {
                sameSeedOpponentsByTeam.get(teamA.id)?.push(teamB);
                sameSeedOpponentsByTeam.get(teamB.id)?.push(teamA);
            }
            const pairCount = pairCounts.get(toCrossDivisionPairKey(teamA.id, teamB.id)) ?? 0;
            if (pairCount > 0) {
                playedOpponentsByTeam.get(teamA.id)?.add(teamB.id);
                playedOpponentsByTeam.get(teamB.id)?.add(teamA.id);
            }
            if (pairCount > 1) {
                repeatedOpponentsByTeam.get(teamA.id)?.add(teamB.id);
                repeatedOpponentsByTeam.get(teamB.id)?.add(teamA.id);
                if (sameSeed) {
                    repeatedSameSeedOpponentsByTeam.get(teamA.id)?.add(teamB.id);
                    repeatedSameSeedOpponentsByTeam.get(teamB.id)?.add(teamA.id);
                } else {
                    repeatedOtherOpponentsByTeam.get(teamA.id)?.add(teamB.id);
                    repeatedOtherOpponentsByTeam.get(teamB.id)?.add(teamA.id);
                }
            }
        }
    }
    const teamSummaries = teams.map((team)=>{
        const sameSeedOpponents = sameSeedOpponentsByTeam.get(team.id) ?? [];
        const playedOpponents = playedOpponentsByTeam.get(team.id) ?? new Set();
        const repeatedSameSeedOpponents = repeatedSameSeedOpponentsByTeam.get(team.id) ?? new Set();
        const repeatedOtherOpponents = repeatedOtherOpponentsByTeam.get(team.id) ?? new Set();
        const availableSameSeedOpponentIds = sameSeedOpponents.map((opponent)=>opponent.id);
        const playedSameSeedOpponentIds = availableSameSeedOpponentIds.filter((opponentId)=>playedOpponents.has(opponentId));
        const missingSameSeedOpponentIds = availableSameSeedOpponentIds.filter((opponentId)=>!playedOpponents.has(opponentId));
        const playedOtherCrossOpponentIds = (crossOpponentsByTeam.get(team.id) ?? []).map((opponent)=>opponent.id).filter((opponentId)=>playedOpponents.has(opponentId)).filter((opponentId)=>!availableSameSeedOpponentIds.includes(opponentId));
        const unplayedCrossOpponentIds = (crossOpponentsByTeam.get(team.id) ?? []).map((opponent)=>opponent.id).filter((opponentId)=>!playedOpponents.has(opponentId));
        const hasSameSeedRepeatAvailable = playedSameSeedOpponentIds.some((opponentId)=>{
            const pairCount = pairCounts.get(toCrossDivisionPairKey(team.id, opponentId)) ?? 0;
            return pairCount === 1;
        });
        const missingAnySameSeed = missingSameSeedOpponentIds.length > 0;
        const skippedSameSeedForOtherCross = missingAnySameSeed && playedOtherCrossOpponentIds.length > 0;
        const usedRepeatBeforeUniqueExhausted = !missingAnySameSeed && repeatedOpponentsByTeam.get(team.id).size > 0 && unplayedCrossOpponentIds.length > 0;
        const usedOtherRepeatBeforeSameSeedRepeat = repeatedOtherOpponents.size > 0 && hasSameSeedRepeatAvailable;
        return {
            teamId: team.id,
            availableSameSeedOpponentIds,
            playedSameSeedOpponentIds,
            missingSameSeedOpponentIds,
            playedOtherCrossOpponentIds,
            repeatedSameSeedOpponentIds: Array.from(repeatedSameSeedOpponents),
            repeatedOtherCrossOpponentIds: Array.from(repeatedOtherOpponents),
            missingAnySameSeed,
            skippedSameSeedForOtherCross,
            usedRepeatBeforeUniqueExhausted,
            usedOtherRepeatBeforeSameSeedRepeat,
            isPriorityCompliant: !skippedSameSeedForOtherCross && !usedRepeatBeforeUniqueExhausted && !usedOtherRepeatBeforeSameSeedRepeat,
            firstSkippedSameSeedWeek: null
        };
    });
    return {
        isPriorityCompliant: teamSummaries.every((summary)=>summary.isPriorityCompliant),
        teamSummaries
    };
}
function isCrossDivisionGame(game) {
    return game.matchupType === "Cross-Divisional" || game.matchType === "cross_division";
}
function buildScheduledCrossDivisionPairCounts(weeks) {
    const pairCounts = new Map();
    weeks.forEach((week)=>{
        week.games.forEach((game)=>{
            if (!isCrossDivisionGame(game)) {
                return;
            }
            const key = toCrossDivisionPairKey(game.homeTeamId, game.awayTeamId);
            pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        });
    });
    return pairCounts;
}
function analyzeScheduledCrossDivisionInventoryPriority(teams, weeks) {
    return analyzeCrossDivisionPriority(teams, buildScheduledCrossDivisionPairCounts(weeks));
}
function analyzeScheduledCrossDivisionPriority(teams, weeks) {
    const crossOpponentsByTeam = new Map();
    const sameSeedOpponentsByTeam = new Map();
    const playedSameSeedByTeam = new Map();
    const playedOtherByTeam = new Map();
    const repeatedSameSeedByTeam = new Map();
    const repeatedOtherByTeam = new Map();
    const playedAnyByTeam = new Map();
    const encounterCountsByTeam = new Map();
    const skippedSameSeedWeekByTeam = new Map();
    const usedRepeatBeforeUniqueExhaustedByTeam = new Map();
    const usedOtherRepeatBeforeSameSeedRepeatByTeam = new Map();
    const teamById = new Map(teams.map((team)=>[
            team.id,
            team
        ]));
    teams.forEach((team)=>{
        crossOpponentsByTeam.set(team.id, []);
        sameSeedOpponentsByTeam.set(team.id, []);
        playedSameSeedByTeam.set(team.id, new Set());
        playedOtherByTeam.set(team.id, new Set());
        repeatedSameSeedByTeam.set(team.id, new Set());
        repeatedOtherByTeam.set(team.id, new Set());
        playedAnyByTeam.set(team.id, new Set());
        encounterCountsByTeam.set(team.id, new Map());
        skippedSameSeedWeekByTeam.set(team.id, null);
        usedRepeatBeforeUniqueExhaustedByTeam.set(team.id, false);
        usedOtherRepeatBeforeSameSeedRepeatByTeam.set(team.id, false);
    });
    for(let index = 0; index < teams.length; index += 1){
        const teamA = teams[index];
        const seedA = normalizeSeed(teamA.divisionSeed);
        if (!teamA.divisionId) continue;
        for(let nextIndex = index + 1; nextIndex < teams.length; nextIndex += 1){
            const teamB = teams[nextIndex];
            const seedB = normalizeSeed(teamB.divisionSeed);
            if (!teamB.divisionId || teamA.divisionId === teamB.divisionId) continue;
            crossOpponentsByTeam.get(teamA.id)?.push(teamB);
            crossOpponentsByTeam.get(teamB.id)?.push(teamA);
            if (seedA != null && seedA === seedB) {
                sameSeedOpponentsByTeam.get(teamA.id)?.push(teamB);
                sameSeedOpponentsByTeam.get(teamB.id)?.push(teamA);
            }
        }
    }
    const orderedWeeks = weeks.slice().sort((a, b)=>a.weekNumber - b.weekNumber);
    orderedWeeks.forEach((week)=>{
        week.games.forEach((game)=>{
            if (!isCrossDivisionGame(game)) return;
            const pairings = [
                {
                    teamId: game.homeTeamId,
                    opponentId: game.awayTeamId
                },
                {
                    teamId: game.awayTeamId,
                    opponentId: game.homeTeamId
                }
            ];
            pairings.forEach(({ teamId, opponentId })=>{
                const team = teamById.get(teamId);
                const opponent = teamById.get(opponentId);
                if (!team || !opponent || !team.divisionId || team.divisionId === opponent.divisionId) {
                    return;
                }
                const isSameSeed = normalizeSeed(team.divisionSeed) != null && normalizeSeed(team.divisionSeed) === normalizeSeed(opponent.divisionSeed);
                const availableSameSeedOpponentIds = (sameSeedOpponentsByTeam.get(teamId) ?? []).map((candidate)=>candidate.id);
                const playedSameSeedOpponentIds = playedSameSeedByTeam.get(teamId) ?? new Set();
                const encounterCounts = encounterCountsByTeam.get(teamId) ?? new Map();
                const priorCount = encounterCounts.get(opponentId) ?? 0;
                const isRepeat = priorCount > 0;
                if (!isSameSeed && skippedSameSeedWeekByTeam.get(teamId) == null && availableSameSeedOpponentIds.some((candidateId)=>!playedSameSeedOpponentIds.has(candidateId))) {
                    skippedSameSeedWeekByTeam.set(teamId, week.weekNumber);
                }
                if (isRepeat) {
                    const totalCrossOpponentCount = (crossOpponentsByTeam.get(teamId) ?? []).length;
                    if ((playedAnyByTeam.get(teamId)?.size ?? 0) < totalCrossOpponentCount) {
                        usedRepeatBeforeUniqueExhaustedByTeam.set(teamId, true);
                    }
                    const hasSameSeedRepeatAvailable = Array.from(encounterCounts.entries()).some(([candidateId, count])=>count === 1 && availableSameSeedOpponentIds.includes(candidateId));
                    if (!isSameSeed && hasSameSeedRepeatAvailable) {
                        usedOtherRepeatBeforeSameSeedRepeatByTeam.set(teamId, true);
                    }
                }
                encounterCounts.set(opponentId, priorCount + 1);
                encounterCountsByTeam.set(teamId, encounterCounts);
                playedAnyByTeam.get(teamId)?.add(opponentId);
                if (isSameSeed) {
                    playedSameSeedByTeam.get(teamId)?.add(opponentId);
                    if (isRepeat) {
                        repeatedSameSeedByTeam.get(teamId)?.add(opponentId);
                    }
                } else {
                    playedOtherByTeam.get(teamId)?.add(opponentId);
                    if (isRepeat) {
                        repeatedOtherByTeam.get(teamId)?.add(opponentId);
                    }
                }
            });
        });
    });
    const teamSummaries = teams.map((team)=>{
        const availableSameSeedOpponentIds = (sameSeedOpponentsByTeam.get(team.id) ?? []).map((opponent)=>opponent.id);
        const playedSameSeedOpponentIds = Array.from(playedSameSeedByTeam.get(team.id) ?? []);
        const missingSameSeedOpponentIds = availableSameSeedOpponentIds.filter((opponentId)=>!playedSameSeedByTeam.get(team.id)?.has(opponentId));
        const skippedSameSeedForOtherCross = (skippedSameSeedWeekByTeam.get(team.id) ?? null) != null;
        const usedRepeatBeforeUniqueExhausted = usedRepeatBeforeUniqueExhaustedByTeam.get(team.id) ?? false;
        const usedOtherRepeatBeforeSameSeedRepeat = usedOtherRepeatBeforeSameSeedRepeatByTeam.get(team.id) ?? false;
        return {
            teamId: team.id,
            availableSameSeedOpponentIds,
            playedSameSeedOpponentIds,
            missingSameSeedOpponentIds,
            playedOtherCrossOpponentIds: Array.from(playedOtherByTeam.get(team.id) ?? []),
            repeatedSameSeedOpponentIds: Array.from(repeatedSameSeedByTeam.get(team.id) ?? []),
            repeatedOtherCrossOpponentIds: Array.from(repeatedOtherByTeam.get(team.id) ?? []),
            missingAnySameSeed: missingSameSeedOpponentIds.length > 0,
            skippedSameSeedForOtherCross,
            usedRepeatBeforeUniqueExhausted,
            usedOtherRepeatBeforeSameSeedRepeat,
            isPriorityCompliant: !skippedSameSeedForOtherCross && !usedRepeatBeforeUniqueExhausted && !usedOtherRepeatBeforeSameSeedRepeat,
            firstSkippedSameSeedWeek: skippedSameSeedWeekByTeam.get(team.id) ?? null
        };
    });
    return {
        isPriorityCompliant: teamSummaries.every((summary)=>summary.isPriorityCompliant),
        teamSummaries
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/domain/groups.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SINGLE_LEAGUE_KEY",
    ()=>SINGLE_LEAGUE_KEY,
    "buildTeamsById",
    ()=>buildTeamsById,
    "effectiveWeeks",
    ()=>effectiveWeeks,
    "gamesPerTeamTarget",
    ()=>gamesPerTeamTarget,
    "groupSizes",
    ()=>groupSizes,
    "groupTeams",
    ()=>groupTeams,
    "hasMultipleDivisions",
    ()=>hasMultipleDivisions,
    "sortedByOverallSeed",
    ()=>sortedByOverallSeed
]);
const SINGLE_LEAGUE_KEY = "__league__";
function groupTeams(teams) {
    const groups = new Map();
    for (const team of teams){
        const key = team.divisionId ?? SINGLE_LEAGUE_KEY;
        const list = groups.get(key);
        if (list) list.push(team);
        else groups.set(key, [
            team
        ]);
    }
    // deterministic intra-group order: by divisionSeed then id
    for (const list of groups.values()){
        list.sort((a, b)=>a.divisionSeed - b.divisionSeed || (a.id < b.id ? -1 : 1));
    }
    return groups;
}
function groupSizes(teams) {
    return [
        ...groupTeams(teams).values()
    ].map((g)=>g.length);
}
function hasMultipleDivisions(teams) {
    let first;
    for (const team of teams){
        const key = team.divisionId ?? SINGLE_LEAGUE_KEY;
        if (first === undefined) first = key;
        else if (key !== first) return true;
    }
    return false;
}
function gamesPerTeamTarget(input) {
    return input.settings.weeks - input.settings.byesPerTeam;
}
function effectiveWeeks(input) {
    const n = input.teams.length;
    switch(input.format){
        case "fantasy_nfl_divisional":
        case "divisional_league":
            return input.settings.weeks;
        case "round_robin_classic":
            {
                if (input.settings.classicRoundRobinMode === "cycle_count") {
                    const roundsPerCycle = n % 2 === 0 ? n - 1 : n;
                    return roundsPerCycle * input.settings.classicRoundRobinCycleCount;
                }
                return input.settings.weeks;
            }
        case "pool_play":
            {
                const repeat = input.settings.poolOpponentRepeatCount;
                let maxRounds = 0;
                for (const members of groupTeams(input.teams).values()){
                    const p = members.length;
                    const rounds = (p % 2 === 0 ? p - 1 : p) * repeat;
                    if (rounds > maxRounds) maxRounds = rounds;
                }
                return maxRounds;
            }
        default:
            return input.settings.weeks;
    }
}
function sortedByOverallSeed(teams) {
    return [
        ...teams
    ].sort((a, b)=>a.overallSeed - b.overallSeed || (a.id < b.id ? -1 : 1));
}
function buildTeamsById(teams) {
    return new Map(teams.map((t)=>[
            t.id,
            t
        ]));
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/constraints/registry.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONSTRAINTS",
    ()=>CONSTRAINTS,
    "constraintsFor",
    ()=>constraintsFor,
    "validateSchedule",
    ()=>validateSchedule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/crossDivisionPriority.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/domain/groups.ts [app-ssr] (ecmascript)");
;
;
// ---- helpers ----
function pairKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
}
// Ordered sequence of a team's games across weeks (bye weeks omitted).
function teamGameSequence(schedule, teamId) {
    const out = [];
    for (const week of schedule.weeks){
        for (const game of week.games){
            if (game.a === teamId || game.b === teamId) {
                out.push({
                    week: week.weekNumber,
                    game
                });
            }
        }
    }
    return out;
}
function isHomeFor(game, teamId) {
    if (game.homeTeamId == null) return null;
    return game.homeTeamId === teamId;
}
function opponentOf(game, teamId) {
    return game.a === teamId ? game.b : game.a;
}
// ---- Tier 1: hard structural ----
const oneGamePerWeek = {
    id: "one-game-per-week",
    tier: "hard",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule) {
        const issues = [];
        for (const week of schedule.weeks){
            const seen = new Set();
            for (const game of week.games){
                for (const t of [
                    game.a,
                    game.b
                ]){
                    if (seen.has(t)) {
                        issues.push({
                            code: "ONE_GAME_PER_WEEK",
                            message: `Team ${t} appears in more than one game in week ${week.weekNumber}.`,
                            teamId: t,
                            week: week.weekNumber
                        });
                    }
                    seen.add(t);
                }
            }
        }
        return issues;
    }
};
const noSelfMatch = {
    id: "no-self-match",
    tier: "hard",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule) {
        const issues = [];
        for (const week of schedule.weeks){
            for (const game of week.games){
                if (game.a === game.b) {
                    issues.push({
                        code: "NO_SELF_MATCH",
                        message: `Team ${game.a} is scheduled against itself in week ${week.weekNumber}.`,
                        teamId: game.a,
                        week: week.weekNumber
                    });
                }
            }
        }
        return issues;
    }
};
const matchupMultiset = {
    id: "matchup-multiset",
    tier: "hard",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule, ctx) {
        const issues = [];
        const target = new Map();
        for (const pair of ctx.inventory.pairs){
            target.set(pairKey(pair.a, pair.b), pair.count);
        }
        const realized = new Map();
        for (const week of schedule.weeks){
            for (const game of week.games){
                const k = pairKey(game.a, game.b);
                realized.set(k, (realized.get(k) ?? 0) + 1);
            }
        }
        for (const [k, count] of target){
            const got = realized.get(k) ?? 0;
            if (got !== count) {
                issues.push({
                    code: "MATCHUP_MULTISET",
                    message: `Pairing ${k} should occur ${count}× but occurs ${got}×.`
                });
            }
        }
        for (const [k, got] of realized){
            if (!target.has(k)) {
                issues.push({
                    code: "MATCHUP_MULTISET_EXTRA",
                    message: `Pairing ${k} occurs ${got}× but is not in the required inventory.`
                });
            }
        }
        return issues;
    }
};
// Each team is present or on bye every week, so its byes must equal
// effectiveWeeks − games. This structural quota covers all three bye sources
// uniformly: explicit user byes (divisional, where effectiveWeeks − degree
// resolves to settings.byesPerTeam by construction), odd-participant structural
// byes (round robin / pool play, where settings.byesPerTeam is 0 but a team
// still sits out parity-forced weeks), and zero-bye formats. Grading against the
// flat settings.byesPerTeam instead used to raise false hard failures on every
// odd-team round-robin and odd-size-pool schedule.
const byeCount = {
    id: "bye-count",
    tier: "hard",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule, ctx) {
        const issues = [];
        const W = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["effectiveWeeks"])(ctx.input);
        const byes = new Map();
        for (const t of ctx.input.teams)byes.set(t.id, 0);
        for (const week of schedule.weeks){
            for (const t of week.byes)byes.set(t, (byes.get(t) ?? 0) + 1);
        }
        for (const [teamId, got] of byes){
            const want = W - (ctx.gamesPerTeam.get(teamId) ?? 0);
            if (got !== want) {
                issues.push({
                    code: "BYE_COUNT",
                    message: `Team ${teamId} has ${got} byes but should have ${want} (weeks ${W} − games).`,
                    teamId
                });
            }
        }
        return issues;
    }
};
const homeAwayTotals = {
    id: "home-away-totals",
    tier: "hard",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule, ctx) {
        const issues = [];
        const homeCount = new Map();
        for (const t of ctx.input.teams)homeCount.set(t.id, 0);
        for (const week of schedule.weeks){
            for (const game of week.games){
                if (game.homeTeamId != null) {
                    homeCount.set(game.homeTeamId, (homeCount.get(game.homeTeamId) ?? 0) + 1);
                }
            }
        }
        for (const [teamId, target] of ctx.targetHomeCounts){
            const got = homeCount.get(teamId) ?? 0;
            if (got !== target) {
                issues.push({
                    code: "HOME_AWAY_TOTALS",
                    message: `Team ${teamId} has ${got} home games but the allocation requires ${target}.`,
                    teamId
                });
            }
        }
        return issues;
    }
};
// Per-pairing home/away balance. A pair meeting n times must split its home
// games floor(n/2) / ceil(n/2): even n → exactly equal, odd n → differ by one,
// NEVER all on one side (a 3-game series is 2-1 or 1-2, never 3-0). The §5
// allocation and `home-away-totals` only govern each team's SEASON total, so
// without this a series can legally land all-home for one side while totals still
// balance — the defect this constraint pins. Orientation (phases/orientation)
// enforces it structurally; this validator is the audit-grade guarantee.
const homeAwaySeriesBalance = {
    id: "home-away-series-balance",
    tier: "hard",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule) {
        const issues = [];
        // pairKey -> { total, home: Map<teamId, count> }
        const series = new Map();
        for (const week of schedule.weeks){
            for (const game of week.games){
                const k = pairKey(game.a, game.b);
                let rec = series.get(k);
                if (!rec) {
                    rec = {
                        total: 0,
                        home: new Map()
                    };
                    series.set(k, rec);
                }
                rec.total += 1;
                if (game.homeTeamId != null) {
                    rec.home.set(game.homeTeamId, (rec.home.get(game.homeTeamId) ?? 0) + 1);
                }
            }
        }
        for (const [k, rec] of series){
            if (rec.total < 2) continue; // a single meeting is trivially balanced
            const counts = [
                ...rec.home.values()
            ];
            const hi = counts.length ? Math.max(...counts) : rec.total;
            const lo = counts.length ? Math.min(...counts) : 0;
            // both sides must appear; spread may exceed 1 only when total is odd? no —
            // odd allows spread exactly 1, even requires spread 0. Ideal spread = n%2.
            const spread = rec.home.size < 2 ? rec.total : hi - lo;
            if (spread > rec.total % 2) {
                const [a, b] = k.split("|");
                issues.push({
                    code: "HOME_AWAY_SERIES_BALANCE",
                    message: `Pairing ${a}/${b} meets ${rec.total}× but its home split (${rec.home.get(a) ?? 0}-${rec.home.get(b) ?? 0}) is not balanced floor/ceil.`
                });
            }
        }
        return issues;
    }
};
// ---- Tier 2: fairness (hard by default; relaxed mode raises caps) ----
function effectiveStreakCap(base, relax) {
    return relax ? base + 2 : base;
}
const maxHomeAwayStreak = {
    id: "max-home-away-streak",
    tier: "fairness",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule, ctx) {
        const issues = [];
        const cap = effectiveStreakCap(ctx.input.settings.maxHomeAwayStreak, ctx.input.settings.relaxStreaks);
        for (const team of ctx.input.teams){
            const seq = teamGameSequence(schedule, team.id);
            let run = 0;
            let prev = null;
            for (const { game } of seq){
                const home = isHomeFor(game, team.id);
                if (home == null) continue;
                if (home === prev) run += 1;
                else {
                    run = 1;
                    prev = home;
                }
                if (run > cap) {
                    issues.push({
                        code: "MAX_HOME_AWAY_STREAK",
                        message: `Team ${team.id} exceeds the ${cap}-game ${home ? "home" : "away"} streak cap.`,
                        teamId: team.id
                    });
                    break;
                }
            }
        }
        return issues;
    }
};
const maxDivisionalStreak = {
    id: "max-divisional-streak",
    tier: "fairness",
    weight: 0,
    appliesTo: (fmt)=>fmt === "fantasy_nfl_divisional" || fmt === "divisional_league",
    check (schedule, ctx) {
        const issues = [];
        // Single-division leagues have only divisional games, so the streak cap is
        // structurally unsatisfiable and meaningless — skip it.
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasMultipleDivisions"])(ctx.input.teams)) return issues;
        const cap = effectiveStreakCap(ctx.input.settings.maxDivisionalStreak, ctx.input.settings.relaxStreaks);
        for (const team of ctx.input.teams){
            const seq = teamGameSequence(schedule, team.id);
            let run = 0;
            for (const { game } of seq){
                if (game.kind === "div") run += 1;
                else run = 0;
                if (run > cap) {
                    issues.push({
                        code: "MAX_DIVISIONAL_STREAK",
                        message: `Team ${team.id} exceeds the ${cap}-game divisional streak cap.`,
                        teamId: team.id
                    });
                    break;
                }
            }
        }
        return issues;
    }
};
const preventImmediateRematch = {
    id: "prevent-immediate-rematch",
    tier: "fairness",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule, ctx) {
        if (!ctx.input.settings.preventImmediateRematches) return [];
        const issues = [];
        const weeks = [
            ...schedule.weeks
        ].sort((x, y)=>x.weekNumber - y.weekNumber);
        // opponent map per week
        const oppByWeek = new Map();
        for (const week of weeks){
            const m = new Map();
            for (const game of week.games){
                m.set(game.a, game.b);
                m.set(game.b, game.a);
            }
            oppByWeek.set(week.weekNumber, m);
        }
        for(let i = 0; i < weeks.length - 1; i += 1){
            const cur = oppByWeek.get(weeks[i].weekNumber);
            const nxt = oppByWeek.get(weeks[i + 1].weekNumber);
            for (const [team, opp] of cur){
                if (nxt.get(team) === opp) {
                    issues.push({
                        code: "IMMEDIATE_REMATCH",
                        message: `Team ${team} faces ${opp} in back-to-back weeks ${weeks[i].weekNumber}-${weeks[i + 1].weekNumber}.`,
                        teamId: team,
                        week: weeks[i + 1].weekNumber
                    });
                }
            }
        }
        return issues;
    }
};
const byeWindow = {
    id: "bye-window",
    tier: "fairness",
    weight: 0,
    appliesTo: ()=>true,
    check (schedule, ctx) {
        const placement = ctx.input.settings.byeWeekPlacement;
        if (placement !== "middle_only") return []; // prefer_middle/anywhere are soft
        const issues = [];
        const total = ctx.input.settings.weeks;
        const lo = Math.floor(total * 0.25) + 1;
        const hi = Math.ceil(total * 0.75);
        for (const week of schedule.weeks){
            if (week.byes.length === 0) continue;
            if (week.weekNumber < lo || week.weekNumber > hi) {
                for (const t of week.byes){
                    issues.push({
                        code: "BYE_WINDOW",
                        message: `Team ${t} byes in week ${week.weekNumber}, outside the middle-only window ${lo}-${hi}.`,
                        teamId: t,
                        week: week.weekNumber
                    });
                }
            }
        }
        return issues;
    }
};
// Balanced coverage for single-league round robins: a team must face every other
// team once before any rematch (and twice before any third meeting, etc.). Week
// ORDER is the lever, so it is a fairness violation. Mirrors the generator
// harness's assertCoverageBeforeRepeats.
const coverageBeforeRepeats = {
    id: "coverage-before-repeats",
    tier: "fairness",
    weight: 0,
    appliesTo: (fmt)=>fmt === "fantasy_nfl_divisional" || fmt === "round_robin_classic",
    check (schedule, ctx) {
        // Only single-league schedules are pure round robins; multi-division fantasy
        // mixes divisional + cross games and has no such ordering property.
        if (ctx.input.format === "fantasy_nfl_divisional" && (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasMultipleDivisions"])(ctx.input.teams)) {
            return [];
        }
        const issues = [];
        const teamIds = ctx.input.teams.map((t)=>t.id);
        const counts = new Map();
        for (const id of teamIds)counts.set(id, new Map());
        const weeks = [
            ...schedule.weeks
        ].sort((a, b)=>a.weekNumber - b.weekNumber);
        for (const week of weeks){
            for (const game of week.games){
                for (const [team, opp] of [
                    [
                        game.a,
                        game.b
                    ],
                    [
                        game.b,
                        game.a
                    ]
                ]){
                    const teamCounts = counts.get(team);
                    teamCounts.set(opp, (teamCounts.get(opp) ?? 0) + 1);
                    let minOthers = Infinity;
                    for (const other of teamIds){
                        if (other === team || other === opp) continue;
                        minOthers = Math.min(minOthers, teamCounts.get(other) ?? 0);
                    }
                    if (minOthers === Infinity) minOthers = 0;
                    if ((teamCounts.get(opp) ?? 0) - minOthers > 1) {
                        issues.push({
                            code: "COVERAGE_BEFORE_REPEATS",
                            message: `Team ${team} faces ${opp} again before covering the rest of the league.`,
                            teamId: team,
                            week: week.weekNumber
                        });
                    }
                }
            }
        }
        return issues;
    }
};
const crossDivisionPriority = {
    id: "cross-division-priority",
    tier: "fairness",
    weight: 0,
    appliesTo: (fmt)=>fmt === "fantasy_nfl_divisional" || fmt === "divisional_league",
    check (schedule, ctx) {
        // "more_flexible" cross variety intentionally trades away the strict
        // same-seed / distinct-before-repeat priority order for fewer, more
        // concentrated cross opponents — so priority breaks are expected, not faults.
        if (ctx.input.settings.crossDivisionVariety === "more_flexible") return [];
        const pairCounts = new Map();
        for (const week of schedule.weeks){
            for (const game of week.games){
                if (game.kind !== "cross") continue;
                const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toCrossDivisionPairKey"])(game.a, game.b);
                pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
            }
        }
        // The fantasy final-week rule deliberately pairs the two divisions' bottom
        // seeds cross-division, which can break same-seed priority when the odd
        // divisions differ in size. That is an intentional exception (bottom-vs-
        // bottom final-week cross > same-seed priority), so subtract the reserved
        // games from the accounting before judging priority compliance.
        for (const { a, b } of ctx.inventory.reservedFinalCrossPairs ?? []){
            const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toCrossDivisionPairKey"])(a, b);
            const cur = pairCounts.get(key);
            if (cur == null) continue;
            if (cur <= 1) pairCounts.delete(key);
            else pairCounts.set(key, cur - 1);
        }
        const analysis = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeCrossDivisionPriority"])(ctx.input.teams, pairCounts);
        const issues = [];
        for (const summary of analysis.teamSummaries){
            if (summary.isPriorityCompliant) continue;
            issues.push({
                code: "CROSS_DIVISION_PRIORITY",
                message: `Team ${summary.teamId} breaks cross-division priority order.`,
                teamId: summary.teamId
            });
        }
        return issues;
    }
};
// ---- End-of-season divisional concentration ("SEC football" closing block) ----
// Drives a divisional-only FINAL WEEK, in two cases that both want it:
//   • divisionalPlacement === "end" — a contiguous run of divisional-only weeks
//     closes the season (college-conference / SEC-style closing rivalry weeks).
//   • regularSeasonFinalWeekDivisional — an otherwise-regular ending whose last
//     regular-season week is divisional-heavy.
// Both reduce to "the last week must be divisional-only". Enforcing it at the
// fairness tier (not soft) is what makes it effective: soft scorers only break
// ties within a single attempt and can't add divisional games a placement never
// clustered, whereas a fairness violation steers the seeded-restart selection
// toward an attempt whose placement CAN end on an all-divisional week, then the
// Phase-4 reorderer moves that week last.
const closingDivisionalBlock = {
    id: "closing-divisional-block",
    tier: "fairness",
    weight: 0,
    // divisional_league only: fantasy uses its own divisional-heavy closing rule
    // with a carve-out for odd division sizes (where an all-divisional final week
    // is structurally impossible), so a hard block here would be unsatisfiable.
    appliesTo: (fmt)=>fmt === "divisional_league",
    check (schedule, ctx) {
        if (ctx.input.settings.divisionalPlacement !== "end" && !ctx.input.settings.regularSeasonFinalWeekDivisional) {
            return [];
        }
        const weeks = [
            ...schedule.weeks
        ].sort((a, b)=>a.weekNumber - b.weekNumber);
        const isDivisionalWeek = (w)=>w.games.length > 0 && w.games.every((g)=>g.kind === "div");
        // The final week must be divisional-only; any non-divisional game after the
        // closing block has begun is a violation.
        const last = weeks[weeks.length - 1];
        if (!last || !isDivisionalWeek(last)) {
            return [
                {
                    code: "CLOSING_DIVISIONAL_BLOCK",
                    message: "Season does not end with a divisional-only week.",
                    week: last?.weekNumber
                }
            ];
        }
        return [];
    }
};
// ---- Fantasy final-week divisional rule -------------------------------------
// Fantasy is bye-free, so within a division teams pair up in-division and every
// odd-sized division leaves one team that must play cross. These two fairness
// constraints make the FINAL week as divisional as the league shape allows and
// push the unavoidable cross game(s) onto the weakest teams:
//   1. the last week has exactly L/2 cross games (L = # odd divisions), and each
//      is one of the reserved bottom-vs-bottom pairings (Phase-1 inventory);
//   2. every team in a final-week cross game plays a divisional game the week
//      before, so it still gets a season-ending divisional matchup.
// Fairness tier (not soft) so a miss steers seeded-restart selection toward an
// attempt whose placement CAN end this way, then Phase-4 reorder lands the
// reserved slates last. Best-effort: an unreachable shape simply degrades to a
// warning (placement already falls back to an unreserved schedule).
function sortedWeeks(schedule) {
    return [
        ...schedule.weeks
    ].sort((a, b)=>a.weekNumber - b.weekNumber);
}
const fantasyFinalWeekDivisional = {
    id: "fantasy-final-week-divisional",
    tier: "fairness",
    weight: 0,
    appliesTo: (fmt)=>fmt === "fantasy_nfl_divisional",
    check (schedule, ctx) {
        if (!ctx.input.settings.regularSeasonFinalWeekDivisional) return [];
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasMultipleDivisions"])(ctx.input.teams)) return [];
        const weeks = sortedWeeks(schedule);
        const last = weeks[weeks.length - 1];
        if (!last || last.games.length === 0) return [];
        const oddDivisions = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupSizes"])(ctx.input.teams).filter((n)=>n % 2 === 1).length;
        const expectedCross = Math.floor(oddDivisions / 2);
        const crossGames = last.games.filter((g)=>g.kind === "cross");
        const issues = [];
        if (crossGames.length !== expectedCross) {
            issues.push({
                code: "FINAL_WEEK_NOT_MAX_DIVISIONAL",
                message: `Final week has ${crossGames.length} cross-division game(s); the league shape allows only ${expectedCross}.`,
                week: last.weekNumber
            });
        }
        const reservedKeys = new Set((ctx.inventory.reservedFinalCrossPairs ?? []).map(({ a, b })=>pairKey(a, b)));
        for (const g of crossGames){
            if (!reservedKeys.has(pairKey(g.a, g.b))) {
                issues.push({
                    code: "FINAL_WEEK_CROSS_NOT_BOTTOM_SEED",
                    message: "Final-week cross game is not between the two divisions' lowest-ranked teams.",
                    week: last.weekNumber
                });
            }
        }
        return issues;
    }
};
const fantasyFinalCrossRipple = {
    id: "fantasy-final-cross-ripple",
    tier: "fairness",
    weight: 0,
    appliesTo: (fmt)=>fmt === "fantasy_nfl_divisional",
    check (schedule, ctx) {
        if (!ctx.input.settings.regularSeasonFinalWeekDivisional) return [];
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasMultipleDivisions"])(ctx.input.teams)) return [];
        const weeks = sortedWeeks(schedule);
        const last = weeks[weeks.length - 1];
        const penult = weeks[weeks.length - 2];
        if (!last || !penult) return [];
        const crossTeams = new Set();
        for (const g of last.games){
            if (g.kind === "cross") {
                crossTeams.add(g.a);
                crossTeams.add(g.b);
            }
        }
        const issues = [];
        for (const teamId of crossTeams){
            const game = penult.games.find((g)=>g.a === teamId || g.b === teamId);
            if (!game || game.kind !== "div") {
                issues.push({
                    code: "FINAL_CROSS_RIPPLE_MISSING",
                    message: `Team ${teamId} plays a final-week cross game but not a divisional game the week before.`,
                    teamId,
                    week: penult.weekNumber
                });
            }
        }
        return issues;
    }
};
// ---- Tier 3: soft (scored 0..1, never block) ----
function matchupSeed(ctx, teamId, useOpeningWeekSeed = false) {
    const team = ctx.teamsById.get(teamId);
    if (!team) return 999;
    return useOpeningWeekSeed ? team.openingWeekSeed ?? team.overallSeed : team.overallSeed;
}
function engineMatchupRating(ctx, teamA, teamB, useOpeningWeekSeed = false) {
    const rankA = matchupSeed(ctx, teamA, useOpeningWeekSeed);
    const rankB = matchupSeed(ctx, teamB, useOpeningWeekSeed);
    return Math.round(((rankA + rankB) / 2 + 2.2 * Math.abs(rankA - rankB)) * 10) / 10;
}
// The optimizer uses the same lower-is-better matchup formula as the workspace.
// A week's best game is normalized against the candidate schedule's full rating
// range, so genuine top-vs-top games pull opening, final, and Thanksgiving weeks.
function weekMarqueeScore(schedule, ctx, weekNumber, useOpeningWeekSeed = false) {
    const week = schedule.weeks.find((w)=>w.weekNumber === weekNumber);
    if (!week || week.games.length === 0) return 0;
    const scheduleRatings = schedule.weeks.flatMap((candidateWeek)=>candidateWeek.games.map((game)=>engineMatchupRating(ctx, game.a, game.b, useOpeningWeekSeed)));
    const min = Math.min(...scheduleRatings);
    const max = Math.max(...scheduleRatings);
    if (max === min) return 0.5;
    const bestWeekRating = Math.min(...week.games.map((game)=>engineMatchupRating(ctx, game.a, game.b, useOpeningWeekSeed)));
    return 1 - (bestWeekRating - min) / (max - min);
}
const finalWeekMarquee = {
    id: "final-week-marquee",
    tier: "soft",
    weight: 1,
    appliesTo: ()=>true,
    score (schedule, ctx) {
        if (!ctx.input.settings.prioritizeFinalWeekTopFive) return 0.5;
        const last = Math.max(...schedule.weeks.map((w)=>w.weekNumber));
        return weekMarqueeScore(schedule, ctx, last);
    }
};
const openingWeekMarquee = {
    id: "opening-week-marquee",
    tier: "soft",
    weight: 1,
    appliesTo: ()=>true,
    score (schedule, ctx) {
        if (!ctx.input.settings.prioritizeOpeningWeekTopFive) return 0.5;
        return weekMarqueeScore(schedule, ctx, 1, true);
    }
};
const thanksgivingStrength = {
    id: "thanksgiving-window-strength",
    tier: "soft",
    weight: 1,
    appliesTo: (fmt)=>fmt === "fantasy_nfl_divisional",
    score (schedule, ctx) {
        if (!ctx.input.settings.prioritizeThanksgivingWindow) return 0.5;
        // With a locked season year the wizard resolves the EXACT Thanksgiving week
        // (4th Thursday of November → its NFL week), so reward a marquee slate in that
        // single week. Without a season year (thanksgivingWeek null) fall back to the
        // legacy fixed 12–13 window.
        const tgWeek = ctx.input.settings.thanksgivingWeek;
        if (tgWeek != null) return weekMarqueeScore(schedule, ctx, tgWeek);
        return (weekMarqueeScore(schedule, ctx, 12) + weekMarqueeScore(schedule, ctx, 13)) / 2;
    }
};
const finalWeekDivisional = {
    id: "final-week-divisional",
    tier: "soft",
    weight: 1.5,
    appliesTo: (fmt)=>fmt === "fantasy_nfl_divisional" || fmt === "divisional_league",
    score (schedule, ctx) {
        // Gated on the toggle: only pull divisional games into the final week when
        // the user asked for a divisional-heavy regular-season finish. Otherwise the
        // scorer is neutral so week order is free for the other soft preferences.
        if (!ctx.input.settings.regularSeasonFinalWeekDivisional) return 0.5;
        const last = Math.max(...schedule.weeks.map((w)=>w.weekNumber));
        const week = schedule.weeks.find((w)=>w.weekNumber === last);
        if (!week || week.games.length === 0) return 0;
        const div = week.games.filter((g)=>g.kind === "div").length;
        return div / week.games.length;
    }
};
const divisionalFinishStrength = {
    id: "divisional-finish-strength",
    tier: "soft",
    weight: 1,
    appliesTo: (fmt)=>fmt === "divisional_league",
    score (schedule, ctx) {
        const strength = ctx.input.settings.divisionalFinishStrength;
        if (strength === "spread_out") return 0.5;
        // reward divisional games landing in the final third
        const last = Math.max(...schedule.weeks.map((w)=>w.weekNumber));
        const cut = Math.ceil(last * (2 / 3));
        let divTotal = 0;
        let divLate = 0;
        for (const week of schedule.weeks){
            for (const game of week.games){
                if (game.kind === "div") {
                    divTotal += 1;
                    if (week.weekNumber > cut) divLate += 1;
                }
            }
        }
        return divTotal === 0 ? 0.5 : divLate / divTotal;
    }
};
// How "grouped" each team's divisional-vs-cross games are across the season:
// per team, 1 − (kind transitions / max transitions) over its game sequence in
// week order (1 = one contiguous run of each kind, 0 = alternating every week).
// Averaged over teams that play both kinds. Week ORDER is the lever, so this is a
// gradient the Phase-4 reorderer can climb in either direction.
function divisionalGroupingScore(schedule) {
    const weeks = [
        ...schedule.weeks
    ].sort((a, b)=>a.weekNumber - b.weekNumber);
    const teams = new Set();
    for (const w of weeks)for (const g of w.games){
        teams.add(g.a);
        teams.add(g.b);
    }
    let acc = 0;
    let counted = 0;
    for (const team of teams){
        const kinds = [];
        for (const w of weeks){
            const g = w.games.find((x)=>x.a === team || x.b === team);
            if (g) kinds.push(g.kind === "div" ? "d" : "x");
        }
        if (kinds.length < 2) continue;
        let transitions = 0;
        for(let i = 1; i < kinds.length; i += 1)if (kinds[i] !== kinds[i - 1]) transitions += 1;
        acc += 1 - transitions / (kinds.length - 1);
        counted += 1;
    }
    return counted === 0 ? 0.5 : acc / counted;
}
// seasonFlowStyle: shape how clustered a team's divisional vs cross games are
// across the season. "more_grouped" rewards long same-kind runs, "more_mixed"
// rewards alternation, "balanced" is neutral (leaves week order to the other
// preferences). Weight 2 so it outranks the single competing divisional-finish
// scorer when the user has expressed a flow preference.
const seasonFlow = {
    id: "season-flow-style",
    tier: "soft",
    weight: 2,
    appliesTo: (fmt)=>fmt === "fantasy_nfl_divisional" || fmt === "divisional_league",
    score (schedule, ctx) {
        const style = ctx.input.settings.seasonFlowStyle;
        if (style === "balanced") return 0.5;
        const grouping = divisionalGroupingScore(schedule);
        return style === "more_grouped" ? grouping : 1 - grouping;
    }
};
const CONSTRAINTS = [
    // hard
    oneGamePerWeek,
    noSelfMatch,
    matchupMultiset,
    byeCount,
    homeAwayTotals,
    homeAwaySeriesBalance,
    // fairness
    maxHomeAwayStreak,
    maxDivisionalStreak,
    preventImmediateRematch,
    byeWindow,
    coverageBeforeRepeats,
    crossDivisionPriority,
    closingDivisionalBlock,
    fantasyFinalWeekDivisional,
    fantasyFinalCrossRipple,
    // soft
    finalWeekMarquee,
    openingWeekMarquee,
    thanksgivingStrength,
    finalWeekDivisional,
    divisionalFinishStrength,
    seasonFlow
];
function constraintsFor(fmt, tier) {
    return CONSTRAINTS.filter((c)=>c.appliesTo(fmt) && (tier ? c.tier === tier : true));
}
function validateSchedule(schedule, ctx) {
    const fmt = ctx.input.format;
    const hardIssues = [];
    const fairnessIssues = [];
    const softScores = [];
    for (const c of CONSTRAINTS){
        if (!c.appliesTo(fmt)) continue;
        if (c.tier === "hard" && c.check) {
            hardIssues.push(...c.check(schedule, ctx));
        } else if (c.tier === "fairness" && c.check) {
            fairnessIssues.push(...c.check(schedule, ctx));
        } else if (c.tier === "soft" && c.score) {
            softScores.push({
                id: c.id,
                weight: c.weight,
                score: c.score(schedule, ctx)
            });
        }
    }
    return {
        hardIssues,
        fairnessIssues,
        softScores
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/feasibility.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkFeasibility",
    ()=>checkFeasibility
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/domain/groups.ts [app-ssr] (ecmascript)");
;
function ok() {
    return {
        ok: true,
        reasons: [],
        suggestions: []
    };
}
function fail(reasons, suggestions = []) {
    return {
        ok: false,
        reasons,
        suggestions
    };
}
function checkFeasibility(input) {
    const { format, teams } = input;
    const n = teams.length;
    if (n < 2) {
        return fail([
            "A league needs at least 2 teams."
        ], [
            "Add more teams."
        ]);
    }
    switch(format){
        case "fantasy_nfl_divisional":
            return checkFantasy(input);
        case "divisional_league":
            return checkDivisional(input);
        case "round_robin_classic":
            return checkRoundRobin(input);
        case "pool_play":
            return checkPoolPlay(input);
        default:
            return fail([
                `Unknown format: ${format}`
            ]);
    }
}
function checkFantasy(input) {
    const { teams, settings } = input;
    const reasons = [];
    const suggestions = [];
    const n = teams.length;
    const weeks = settings.weeks;
    if (weeks !== 13 && weeks !== 14) {
        reasons.push("Fantasy format supports only 13- or 14-week seasons.");
        suggestions.push("Set weeks to 13 or 14.");
    }
    if (settings.byesPerTeam !== 0) {
        reasons.push("Fantasy format does not use bye weeks.");
        suggestions.push("Set byes per team to 0.");
    }
    if (n % 2 !== 0) {
        reasons.push("Fantasy format needs an even number of teams (every team plays every week).");
        suggestions.push("Add or remove a team to make the count even.");
    }
    const groups = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupTeams"])(teams);
    // Single-division (or "no divisions") fantasy: every team plays `weeks`
    // intra-league games via a round-robin fill (distinct opponents before
    // repeats), with no cross-division games. The double-round-robin capacity and
    // cross-handshake checks below only apply when there are 2+ divisions.
    if (groups.size < 2) {
        return reasons.length ? fail(reasons, suggestions) : ok();
    }
    for (const [divId, members] of groups){
        const size = members.length;
        const divisionalGames = (size - 1) * 2;
        if (divisionalGames > weeks) {
            reasons.push(`Division ${divId} needs ${divisionalGames} divisional games (each opponent twice) but the season is only ${weeks} weeks.`);
            suggestions.push("Use smaller divisions or a longer season.");
            continue;
        }
        // Odd-size division cross-shortage. Fantasy uses no byes, so every week is a
        // perfect matching on all teams (zero bye slack). Intra-division games use an
        // even number of a division's teams, so an ODD-size division must send at
        // least one team cross-division EVERY week — that needs `weeks` cross
        // appearances, but the division only supplies `size * (weeks - divisionalGames)`.
        // The necessary condition `size*(weeks - 2(size-1)) >= weeks` simplifies (for
        // size > 1) to `weeks >= 2*size`. This is a proven necessary condition, so it
        // never rejects a realizable shape (e.g. 7/7/13 fails, 7/7/14 passes). Only
        // reached when capacity above did not already flag the division.
        if (size % 2 === 1 && weeks < 2 * size) {
            const crossTotal = size * (weeks - divisionalGames);
            reasons.push(`Division ${divId} has ${size} teams (an odd number), so every week at least one of its teams must play outside the division — that needs ${weeks} cross-division games over the season, but this shape only creates ${crossTotal}. No valid schedule exists.`);
            const minWeeks = 2 * size;
            suggestions.push(minWeeks <= 14 ? `Set the season to ${minWeeks} weeks, or use even-size divisions.` : `Use even-size divisions — an odd division of ${size} teams needs at least ${minWeeks} weeks, more than Fantasy supports.`);
        }
    }
    // cross-division degree handshake: sum of cross games per team must be even
    let crossSum = 0;
    let crossNegative = false;
    for (const members of groups.values()){
        const cross = weeks - (members.length - 1) * 2;
        if (cross < 0) crossNegative = true;
        crossSum += cross * members.length;
    }
    if (!crossNegative && crossSum % 2 !== 0) {
        reasons.push("Cross-division games cannot be paired evenly for this team/division shape.");
        suggestions.push("Adjust division sizes so cross-division games balance.");
    }
    return reasons.length ? fail(reasons, suggestions) : ok();
}
function checkDivisional(input) {
    const { teams, settings } = input;
    const reasons = [];
    const suggestions = [];
    const n = teams.length;
    const G = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gamesPerTeamTarget"])(input);
    if (G < 1) {
        reasons.push("Each team must play at least one game; weeks minus byes is too low.");
        suggestions.push("Increase weeks or reduce byes.");
    }
    // total games integer (handshake)
    if (n * G % 2 !== 0) {
        reasons.push(`A league of ${n} teams playing ${G} games each yields a non-integer game total.`);
        suggestions.push("Adjust weeks, byes, or team count so total games are even.");
    }
    const groups = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupTeams"])(teams);
    const dgpo = settings.divisionalGamesPerOpponent;
    for (const [divId, members] of groups){
        const guaranteed = (members.length - 1) * dgpo;
        if (guaranteed > G) {
            reasons.push(`Division ${divId} needs ${guaranteed} guaranteed divisional games but each team only plays ${G}.`);
            suggestions.push("Lower divisional games per opponent, add weeks, or reduce byes.");
        }
    }
    // bye parity: each week the number of playing teams must be even
    // total byes spread across weeks; necessary condition: n*byes distributable
    const totalByes = n * settings.byesPerTeam;
    const totalPlayingSlots = n * settings.weeks - totalByes;
    if (totalPlayingSlots % 2 !== 0) {
        reasons.push("Bye distribution cannot keep every week's playing-team count even.");
        suggestions.push("Adjust byes per team or the team count.");
    }
    return reasons.length ? fail(reasons, suggestions) : ok();
}
function checkRoundRobin(input) {
    const { teams, settings } = input;
    const reasons = [];
    const suggestions = [];
    const n = teams.length;
    if (settings.classicRoundRobinMode === "cycle_count") {
        if (settings.classicRoundRobinCycleCount < 1) {
            reasons.push("Round robin needs at least one full cycle.");
            suggestions.push("Set cycle count to 1 or more.");
        }
    } else {
        // season_length: weeks must be reachable from an in-order RR build
        if (settings.weeks < 1) {
            reasons.push("Season length must be at least one week.");
            suggestions.push("Increase the season length.");
        }
        // Odd team counts force one bye per week, so a fixed season length yields
        // unequal per-team game counts. That requires the uneven-degree builder,
        // which season-length mode does not implement; cycle count handles it.
        if (n % 2 !== 0) {
            reasons.push("Season-length round robin needs an even number of teams.");
            suggestions.push("Add or remove a team, or switch to cycle-count mode for odd leagues.");
        }
        const maxUniqueRounds = n % 2 === 0 ? n - 1 : n;
        if (settings.weeks > maxUniqueRounds * 50) {
            reasons.push("Season length is unreasonably long for this team count.");
        }
    }
    return reasons.length ? fail(reasons, suggestions) : ok();
}
function checkPoolPlay(input) {
    const { teams, settings } = input;
    const reasons = [];
    const suggestions = [];
    const groups = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupTeams"])(teams);
    if (groups.size < 2) {
        reasons.push("Pool Play needs at least 2 pools.");
        suggestions.push("Create 2 or more pools.");
    }
    for (const [poolId, members] of groups){
        if (members.length < 2) {
            reasons.push(`Pool ${poolId} needs at least 2 teams.`);
            suggestions.push("Add teams to small pools or merge pools.");
        }
    }
    if (settings.poolOpponentRepeatCount < 1) {
        reasons.push("Pool opponent repeat count must be at least 1.");
        suggestions.push("Set repeat count to 1 or more.");
    }
    return reasons.length ? fail(reasons, suggestions) : ok();
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/degreeRealization.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "realizeDegreeGraph",
    ()=>realizeDegreeGraph
]);
function key(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
}
function realizeDegreeGraph(params) {
    const { teamIds, forbidSameGroup, groupOf, rng } = params;
    const remaining = new Map();
    for (const t of teamIds)remaining.set(t, params.degree.get(t) ?? 0);
    const pairCount = new Map();
    const groupKey = (t)=>groupOf ? groupOf.get(t) ?? "" : "";
    const allowed = (a, b)=>a !== b && (!forbidSameGroup || groupKey(a) !== groupKey(b));
    // Safety bound on iterations.
    let guard = 0;
    const maxGuard = teamIds.reduce((s, t)=>s + (params.degree.get(t) ?? 0), 0) + teamIds.length + 10;
    for(;;){
        guard += 1;
        if (guard > maxGuard * 4) return null;
        const active = teamIds.filter((t)=>(remaining.get(t) ?? 0) > 0);
        if (active.length === 0) break;
        // highest remaining degree; random tiebreak for determinism+variety
        const shuffled = rng.shuffle(active);
        shuffled.sort((x, y)=>(remaining.get(y) ?? 0) - (remaining.get(x) ?? 0));
        const t = shuffled[0];
        const need = remaining.get(t) ?? 0;
        // candidate partners
        let candidates = active.filter((p)=>p !== t && allowed(t, p) && (remaining.get(p) ?? 0) > 0);
        if (candidates.length === 0) return null;
        // order: prefer never-paired (variety), then highest remaining degree
        candidates = rng.shuffle(candidates);
        candidates.sort((x, y)=>{
            const px = pairCount.get(key(t, x)) ?? 0;
            const py = pairCount.get(key(t, y)) ?? 0;
            if (px !== py) return px - py;
            return (remaining.get(y) ?? 0) - (remaining.get(x) ?? 0);
        });
        let assigned = 0;
        for (const p of candidates){
            if (assigned >= need) break;
            if ((remaining.get(p) ?? 0) <= 0) continue;
            const k = key(t, p);
            pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
            remaining.set(t, (remaining.get(t) ?? 0) - 1);
            remaining.set(p, (remaining.get(p) ?? 0) - 1);
            assigned += 1;
        }
        // if still short, allow repeats over candidates that still have remaining
        while(assigned < need){
            const repeatPool = active.filter((p)=>p !== t && allowed(t, p) && (remaining.get(p) ?? 0) > 0);
            if (repeatPool.length === 0) return null;
            repeatPool.sort((x, y)=>{
                const px = pairCount.get(key(t, x)) ?? 0;
                const py = pairCount.get(key(t, y)) ?? 0;
                if (px !== py) return px - py;
                return (remaining.get(y) ?? 0) - (remaining.get(x) ?? 0);
            });
            const p = repeatPool[0];
            const k = key(t, p);
            pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
            remaining.set(t, (remaining.get(t) ?? 0) - 1);
            remaining.set(p, (remaining.get(p) ?? 0) - 1);
            assigned += 1;
        }
    }
    const edges = [];
    for (const [k, count] of pairCount){
        const [a, b] = k.split("|");
        edges.push({
            a,
            b,
            count
        });
    }
    return edges;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/crossRealization.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "realizeCrossDivisionGraph",
    ()=>realizeCrossDivisionGraph
]);
function realizeCrossDivisionGraph(teams, degree, rng, divisionOrder) {
    // Group teams (with a positive cross degree contributes to totals; all teams
    // in a division are candidates).
    const divTeams = new Map();
    for (const team of teams){
        if (!team.divisionId) continue;
        const list = divTeams.get(team.divisionId) ?? [];
        list.push(team.id);
        divTeams.set(team.divisionId, list);
    }
    const divIds = [
        ...divTeams.keys()
    ].sort((a, b)=>{
        const oa = divisionOrder?.get(a) ?? 0;
        const ob = divisionOrder?.get(b) ?? 0;
        return oa !== ob ? oa - ob : a.localeCompare(b);
    });
    if (divIds.length < 2) {
        // No cross games possible; only valid if every degree is zero.
        return [
            ...degree.values()
        ].some((d)=>d > 0) ? null : [];
    }
    const deg = (id)=>Math.max(0, degree.get(id) ?? 0);
    const divTotal = new Map();
    for (const d of divIds)divTotal.set(d, (divTeams.get(d) ?? []).reduce((s, id)=>s + deg(id), 0));
    const grandTotal = [
        ...divTotal.values()
    ].reduce((s, v)=>s + v, 0);
    if (grandTotal === 0) return [];
    if (grandTotal % 2 !== 0) return null;
    // Stage 1 — division-level multigraph: pairTotal[i][j] cross games between
    // divisions i and j.
    const idx = new Map(divIds.map((d, i)=>[
            d,
            i
        ]));
    const rem = divIds.map((d)=>divTotal.get(d) ?? 0);
    const pairTotal = divIds.map(()=>divIds.map(()=>0));
    let guard = grandTotal + divIds.length + 10;
    while(rem.some((r)=>r > 0)){
        if (guard-- <= 0) return null;
        // two divisions with the highest remaining totals
        const order = rem.map((r, i)=>[
                r,
                i
            ]).sort((x, y)=>y[0] - x[0]);
        const [ra, ia] = order[0];
        const [rb, ib] = order[1];
        if (ra <= 0) break;
        if (rb <= 0) return null; // a division needs games but no partner has capacity
        pairTotal[ia][ib] += 1;
        pairTotal[ib][ia] += 1;
        rem[ia] -= 1;
        rem[ib] -= 1;
    }
    // Balanced transportation: given row sums and column sums with equal totals,
    // return a non-negative matrix with those margins, spread as evenly as
    // possible (repeatedly add to the (row,col) with the most remaining need).
    const transport = (rowSums, colSums)=>{
        const rows = rowSums.length;
        const cols = colSums.length;
        const m = Array.from({
            length: rows
        }, ()=>new Array(cols).fill(0));
        const r = [
            ...rowSums
        ];
        const c = [
            ...colSums
        ];
        let total = r.reduce((s, v)=>s + v, 0);
        while(total > 0){
            let bi = -1;
            let bMax = 0;
            for(let i = 0; i < rows; i += 1)if (r[i] > bMax) {
                bMax = r[i];
                bi = i;
            }
            if (bi < 0) break;
            let bj = -1;
            let cMax = 0;
            for(let j = 0; j < cols; j += 1)if (c[j] > cMax) {
                cMax = c[j];
                bj = j;
            }
            if (bj < 0) break;
            m[bi][bj] += 1;
            r[bi] -= 1;
            c[bj] -= 1;
            total -= 1;
        }
        return m;
    };
    // Stage 2 — for each division, split each team's cross degree across the other
    // divisions to match stage-1 pair totals.
    //   crossTo[teamId] = Map<otherDivId, count>
    const crossTo = new Map();
    for (const d of divIds){
        const members = rng.shuffle([
            ...divTeams.get(d) ?? []
        ]);
        const i = idx.get(d);
        const otherDivs = divIds.filter((o)=>o !== d);
        const rowSums = members.map((id)=>deg(id));
        const colSums = otherDivs.map((o)=>pairTotal[i][idx.get(o)]);
        const m = transport(rowSums, colSums);
        members.forEach((id, ri)=>{
            const perDiv = new Map();
            otherDivs.forEach((o, ci)=>perDiv.set(o, m[ri][ci]));
            crossTo.set(id, perDiv);
        });
    }
    // Stage 3 — for each unordered division pair, realize the bipartite multigraph
    // between the two teams sets using their stage-2 allocations toward each other.
    const edges = [];
    for(let i = 0; i < divIds.length; i += 1){
        for(let j = i + 1; j < divIds.length; j += 1){
            const di = divIds[i];
            const dj = divIds[j];
            const teamsI = rng.shuffle([
                ...divTeams.get(di) ?? []
            ]);
            const teamsJ = rng.shuffle([
                ...divTeams.get(dj) ?? []
            ]);
            const rowSums = teamsI.map((id)=>crossTo.get(id)?.get(dj) ?? 0);
            const colSums = teamsJ.map((id)=>crossTo.get(id)?.get(di) ?? 0);
            const sumR = rowSums.reduce((s, v)=>s + v, 0);
            const sumC = colSums.reduce((s, v)=>s + v, 0);
            if (sumR !== sumC) return null; // stage-1/2 inconsistency (shouldn't happen)
            const m = transport(rowSums, colSums);
            teamsI.forEach((a, ri)=>{
                teamsJ.forEach((b, cj)=>{
                    const count = m[ri][cj];
                    if (count > 0) edges.push({
                        a,
                        b,
                        count
                    });
                });
            });
        }
    }
    return edges;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/crossPriorityRealization.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "realizePriorityCrossDivisionGraph",
    ()=>realizePriorityCrossDivisionGraph
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$crossRealization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/crossRealization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/crossDivisionPriority.ts [app-ssr] (ecmascript)");
;
;
function realizePriorityCrossDivisionGraph(teams, degree, rng, divisionOrder, opts = {}) {
    const restarts = opts.restarts ?? 6;
    const iters = opts.iters ?? 4000;
    const meta = buildTeamMeta(teams);
    let best = null;
    for(let r = 0; r < restarts; r += 1){
        const edges = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$crossRealization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["realizeCrossDivisionGraph"])(teams, degree, rng.fork(`cp-init${r}`), divisionOrder);
        if (!edges) return null;
        const pairCounts = edgesToPairCounts(edges);
        const adj = buildAdjacency(teams, pairCounts);
        let cost = totalCost(teams, adj, meta);
        const search = rng.fork(`cp-search${r}`);
        for(let it = 0; it < iters && cost > 0; it += 1){
            const e1 = pickRandomEdge(teams, adj, search);
            const e2 = pickRandomEdge(teams, adj, search);
            if (!e1 || !e2) break;
            const [a, b] = e1;
            const [c, d] = e2;
            if (new Set([
                a,
                b,
                c,
                d
            ]).size !== 4) continue;
            // Two rotation orientations; pick one. The kept endpoints of each edge must
            // land in different divisions (stay cross) — original edges are cross, so
            // this just re-pairs the four teams across the two division sides.
            let n1a, n1b, n2a, n2b;
            if (search.bool()) {
                n1a = a;
                n1b = d;
                n2a = c;
                n2b = b;
            } else {
                n1a = a;
                n1b = c;
                n2a = b;
                n2b = d;
            }
            if (meta.divisionOf.get(n1a) === meta.divisionOf.get(n1b)) continue;
            if (meta.divisionOf.get(n2a) === meta.divisionOf.get(n2b)) continue;
            const affected = [
                a,
                b,
                c,
                d
            ];
            const before = affected.reduce((s, t)=>s + teamCost(t, adj, meta), 0);
            applyDelta(pairCounts, adj, a, b, -1);
            applyDelta(pairCounts, adj, c, d, -1);
            applyDelta(pairCounts, adj, n1a, n1b, +1);
            applyDelta(pairCounts, adj, n2a, n2b, +1);
            const after = affected.reduce((s, t)=>s + teamCost(t, adj, meta), 0);
            const delta = after - before;
            if (delta <= 0) {
                cost += delta;
            } else {
                applyDelta(pairCounts, adj, n1a, n1b, -1);
                applyDelta(pairCounts, adj, n2a, n2b, -1);
                applyDelta(pairCounts, adj, a, b, +1);
                applyDelta(pairCounts, adj, c, d, +1);
            }
        }
        if (!best || cost < best.cost) best = {
            pairCounts: new Map(pairCounts),
            cost
        };
        if (cost === 0) break;
    }
    if (!best) return null;
    const compliant = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeCrossDivisionPriority"])(teams, best.pairCounts).isPriorityCompliant;
    const edges = [];
    for (const [key, count] of best.pairCounts){
        if (count <= 0) continue;
        const [a, b] = key.split("::");
        edges.push({
            a,
            b,
            count
        });
    }
    return {
        edges,
        compliant
    };
}
function buildTeamMeta(teams) {
    const divisionOf = new Map();
    for (const t of teams)if (t.divisionId) divisionOf.set(t.id, t.divisionId);
    const crossOpponents = new Map();
    const sameSeedOpponents = new Map();
    for (const t of teams){
        const opps = [];
        const same = new Set();
        if (t.divisionId) {
            for (const u of teams){
                if (u.id === t.id || !u.divisionId || u.divisionId === t.divisionId) continue;
                opps.push(u.id);
                if (u.divisionSeed === t.divisionSeed) same.add(u.id);
            }
        }
        crossOpponents.set(t.id, opps);
        sameSeedOpponents.set(t.id, same);
    }
    return {
        divisionOf,
        crossOpponents,
        sameSeedOpponents
    };
}
function edgesToPairCounts(edges) {
    const m = new Map();
    for (const e of edges){
        if (e.count <= 0) continue;
        const k = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toCrossDivisionPairKey"])(e.a, e.b);
        m.set(k, (m.get(k) ?? 0) + e.count);
    }
    return m;
}
function buildAdjacency(teams, pairCounts) {
    const adj = new Map();
    for (const t of teams)adj.set(t.id, new Map());
    for (const [k, count] of pairCounts){
        if (count <= 0) continue;
        const [x, y] = k.split("::");
        adj.get(x)?.set(y, count);
        adj.get(y)?.set(x, count);
    }
    return adj;
}
function applyDelta(pairCounts, adj, x, y, delta) {
    const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toCrossDivisionPairKey"])(x, y);
    const nc = (pairCounts.get(key) ?? 0) + delta;
    if (nc <= 0) pairCounts.delete(key);
    else pairCounts.set(key, nc);
    const ax = adj.get(x);
    const ay = adj.get(y);
    const cx = (ax.get(y) ?? 0) + delta;
    if (cx <= 0) ax.delete(y);
    else ax.set(y, cx);
    const cy = (ay.get(x) ?? 0) + delta;
    if (cy <= 0) ay.delete(x);
    else ay.set(x, cy);
}
function pickRandomEdge(teams, adj, rng) {
    for(let tries = 0; tries < 8; tries += 1){
        const t = teams[rng.int(0, teams.length - 1)].id;
        const opps = adj.get(t);
        if (!opps || opps.size === 0) continue;
        const keys = [
            ...opps.keys()
        ];
        return [
            t,
            keys[rng.int(0, keys.length - 1)]
        ];
    }
    return null;
}
// Per-team priority-violation cost. Zero for every team ⟺ the assignment is
// priority-compliant per analyzeCrossDivisionPriority (this is a strictly
// tighter surrogate that gives the local search a gradient to descend).
function teamCost(teamId, adj, meta) {
    const counts = adj.get(teamId);
    const opponents = meta.crossOpponents.get(teamId);
    const sameSeed = meta.sameSeedOpponents.get(teamId);
    let missingSameSeed = 0;
    let unplayed = 0;
    let hasRepeat = false;
    let otherRepeats = 0;
    let sameSeedAtOne = 0;
    for (const o of opponents){
        const c = counts.get(o) ?? 0;
        const isSameSeed = sameSeed.has(o);
        if (c === 0) {
            unplayed += 1;
            if (isSameSeed) missingSameSeed += 1;
        } else if (c >= 2) {
            hasRepeat = true;
            if (!isSameSeed) otherRepeats += 1;
        }
        if (isSameSeed && c === 1) sameSeedAtOne += 1;
    }
    let cost = 0;
    cost += 100 * missingSameSeed; // tier 1: cover every same-seed opponent
    if (hasRepeat) cost += 10 * unplayed; // tier 2: cover before repeating
    if (otherRepeats > 0) cost += sameSeedAtOne; // tier 3: same-seed repeat first
    return cost;
}
function totalCost(teams, adj, meta) {
    let c = 0;
    for (const t of teams)c += teamCost(t.id, adj, meta);
    return c;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/inventory.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildInventory",
    ()=>buildInventory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/domain/groups.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$degreeRealization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/degreeRealization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$crossPriorityRealization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/crossPriorityRealization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/crossDivisionPriority.ts [app-ssr] (ecmascript)");
;
;
;
;
// Builds the cross-division pairings honoring the same-seed priority order
// (same-seed unique → other unique → same-seed repeat → other repeat). This is
// the legacy allocator the generator harness validates via
// analyzeCrossDivisionPriority, so using it makes the inventory priority-
// compliant by construction. Returns null if the degree sequence can't be fully
// realized (caller retries with a fresh seed).
function addPrioritizedCrossPairs(map, input, degree, rng) {
    const total = [
        ...degree.values()
    ].reduce((s, v)=>s + v, 0);
    if (total === 0) return true;
    const divisionOrder = new Map(input.divisions.map((d)=>[
            d.id,
            d.orderIndex
        ]));
    const { pairCounts, remainingGamesByTeam } = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["solveCrossDivisionPairCounts"])(input.teams, degree, ()=>rng.next(), {
        divisionOrder
    });
    const leftover = [
        ...remainingGamesByTeam.values()
    ].reduce((s, v)=>s + Math.max(0, v), 0);
    if (leftover > 0) {
        // The greedy priority allocator can't realize this cross-degree sequence —
        // this happens systematically for odd-size divisions (e.g. a 4-3-3 fantasy
        // league). The strict same-seed cross-priority order is usually still
        // *achievable* here (the greedy allocator just can't find it), so hand off to
        // the priority-aware realizer: it starts from a guaranteed transportation
        // realization and runs a degree-preserving local search toward the same-seed
        // priority order. It returns a compliant assignment whenever one exists and a
        // best-effort one (no worse than the raw transportation) otherwise, so a valid
        // schedule always results. Even-division leagues never hit this path.
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$crossPriorityRealization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["realizePriorityCrossDivisionGraph"])(input.teams, degree, rng, divisionOrder);
        if (!result) return false;
        for (const e of result.edges)addPair(map, e.a, e.b, e.count, "cross");
        return true;
    }
    // Reject non-priority-compliant pairings so the restart loop retries a fresh
    // seed; the cross-division priority order is a hard requirement, not soft.
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeCrossDivisionPriority"])(input.teams, pairCounts).isPriorityCompliant) {
        return false;
    }
    const idByKey = new Map();
    for(let i = 0; i < input.teams.length; i += 1){
        for(let j = i + 1; j < input.teams.length; j += 1){
            const a = input.teams[i].id;
            const b = input.teams[j].id;
            idByKey.set((0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$crossDivisionPriority$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toCrossDivisionPairKey"])(a, b), [
                a,
                b
            ]);
        }
    }
    for (const [key, count] of pairCounts){
        if (count <= 0) continue;
        const ids = idByKey.get(key);
        if (!ids) return false;
        addPair(map, ids[0], ids[1], count, "cross");
    }
    return true;
}
// crossDivisionVariety === "more_flexible": lower each team's cross-opponent
// variety by concentrating its cross games onto fewer distinct opponents. The
// prioritized allocator always maximizes distinct-before-repeat (max variety),
// and week reordering can't change who plays whom, so variety is a Phase-1
// property — the only place to shape it.
//
// We apply degree-preserving "rectangle" swaps within a division pair: given
// A,D in one division and B,C in another where A plays C once, D plays B once,
// and A–B, D–C already exist once each, rewrite to A–B twice and D–C twice
// (dropping A–C and D–B). Every team's total game count is unchanged, no cross
// pair exceeds count 2 (the same ceiling max-variety already produces), and A's
// and D's distinct-opponent counts each drop by one. Bounded to one swap per
// team so it stays cheap on large leagues.
function reduceCrossVariety(map, input, rng, protectedKeys) {
    const pk = (a, b)=>a < b ? `${a}|${b}` : `${b}|${a}`;
    const countOf = (a, b)=>map.get(pk(a, b))?.count ?? 0;
    const dec = (a, b)=>{
        const k = pk(a, b);
        const p = map.get(k);
        if (!p) return;
        p.count -= 1;
        if (p.count <= 0) map.delete(k);
    };
    const inc = (a, b)=>addPair(map, a, b, 1, "cross");
    const byDiv = new Map();
    for (const t of input.teams){
        if (!t.divisionId) continue;
        const list = byDiv.get(t.divisionId) ?? [];
        list.push(t.id);
        byDiv.set(t.divisionId, list);
    }
    const divIds = [
        ...byDiv.keys()
    ];
    if (divIds.length < 2) return;
    const maxSwaps = input.teams.length;
    let swaps = 0;
    let progress = true;
    while(progress && swaps < maxSwaps){
        progress = false;
        for(let di = 0; di < divIds.length && !progress; di += 1){
            for(let dj = 0; dj < divIds.length && !progress; dj += 1){
                if (di === dj) continue;
                const left = rng.shuffle([
                    ...byDiv.get(divIds[di]) ?? []
                ]);
                const right = rng.shuffle([
                    ...byDiv.get(divIds[dj]) ?? []
                ]);
                for (const A of left){
                    for (const D of left){
                        if (A === D) continue;
                        for (const B of right){
                            for (const C of right){
                                if (B === C) continue;
                                // Never dissolve a reserved final-week cross pair.
                                if (protectedKeys && (protectedKeys.has(pk(A, C)) || protectedKeys.has(pk(D, B)))) {
                                    continue;
                                }
                                if (countOf(A, C) === 1 && countOf(D, B) === 1 && countOf(A, B) === 1 && countOf(D, C) === 1) {
                                    dec(A, C);
                                    dec(D, B);
                                    inc(A, B);
                                    inc(D, C);
                                    swaps += 1;
                                    progress = true;
                                    break;
                                }
                            }
                            if (progress) break;
                        }
                        if (progress) break;
                    }
                    if (progress) break;
                }
            }
        }
    }
}
function addPair(map, a, b, count, kind) {
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    const existing = map.get(k);
    if (existing) existing.count += count;
    else map.set(k, {
        a: a < b ? a : b,
        b: a < b ? b : a,
        count,
        kind
    });
}
// Each team plays `games` matchups within `teamIds`, distinct opponents before
// repeats: full round-robin cycles plus a partial cycle for the remainder. Used
// for season-length round robin and single-division fantasy. Returns false if a
// partial cycle's degree sequence can't be realized (caller retries a seed).
function fillRoundRobin(map, teamIds, games, kind, rng) {
    const maxDistinct = teamIds.length - 1;
    const fullCycles = Math.floor(games / maxDistinct);
    const remainder = games - fullCycles * maxDistinct;
    if (fullCycles > 0) {
        for(let i = 0; i < teamIds.length; i += 1)for(let j = i + 1; j < teamIds.length; j += 1)addPair(map, teamIds[i], teamIds[j], fullCycles, kind);
    }
    if (remainder > 0) {
        const rem = new Map();
        for (const id of teamIds)rem.set(id, remainder);
        const edges = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$degreeRealization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["realizeDegreeGraph"])({
            teamIds,
            degree: rem,
            forbidSameGroup: false,
            rng
        });
        if (!edges) return false;
        for (const e of edges)addPair(map, e.a, e.b, e.count, kind);
    }
    return true;
}
// Fantasy divisional final-week rule. Fantasy is bye-free, so within a division
// teams pair up in-division and a division of ODD size leaves exactly one team
// that must play cross-division. To keep the final week as divisional as the
// league shape allows AND push the unavoidable cross game(s) onto the weakest
// teams, the leftover from each odd division is that division's lowest-ranked
// member (max divisionSeed). Those bottom teams are paired weakest-with-weakest
// (by overallSeed) across divisions. The returned pairs are reserved into the
// final week by placement. Empty when the rule is off, single-division, or every
// division is even-sized (final week is then 100% divisional).
function computeReservedFinalCrossPairs(input) {
    if (!input.settings.regularSeasonFinalWeekDivisional) return [];
    const groups = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupTeams"])(input.teams);
    if (groups.size <= 1) return [];
    const leftovers = [];
    for (const members of groups.values()){
        if (members.length % 2 === 0) continue; // even division pairs fully in-division
        let bottom = members[0];
        for (const t of members){
            // lowest rank within the division = highest divisionSeed value
            if (t.divisionSeed > bottom.divisionSeed) bottom = t;
        }
        leftovers.push(bottom);
    }
    // The number of odd-sized divisions is even whenever the total team count is
    // even (guaranteed for fantasy), so leftovers always pair up. Bail defensively
    // if a dangling odd leftover ever appears rather than emit a broken reservation.
    if (leftovers.length === 0 || leftovers.length % 2 !== 0) return [];
    // Weakest-with-weakest: the two lowest teams overall meet, then the next two,
    // preserving stronger cross matchups when there are multiple (e.g. 4 divisions).
    leftovers.sort((x, y)=>y.overallSeed - x.overallSeed);
    const pairs = [];
    for(let i = 0; i + 1 < leftovers.length; i += 2){
        pairs.push({
            a: leftovers[i].id,
            b: leftovers[i + 1].id
        });
    }
    return pairs;
}
// Intra-group complete graph, each pair `times`.
function intraGroupPairs(map, groups, times, kind) {
    for (const members of groups.values()){
        for(let i = 0; i < members.length; i += 1){
            for(let j = i + 1; j < members.length; j += 1){
                addPair(map, members[i], members[j], times, kind);
            }
        }
    }
}
function buildInventory(input, rng) {
    const map = new Map();
    let reservedFinalCrossPairs = [];
    const groups = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupTeams"])(input.teams);
    const groupsIds = new Map([
        ...groups.entries()
    ].map(([k, v])=>[
            k,
            v.map((t)=>t.id)
        ]));
    const groupOf = new Map();
    for (const [gid, members] of groupsIds)for (const id of members)groupOf.set(id, gid);
    const teamIds = input.teams.map((t)=>t.id);
    switch(input.format){
        case "fantasy_nfl_divisional":
            {
                const weeks = input.settings.weeks;
                // Single-division ("no divisions") fantasy: fill `weeks` intra-league
                // games via round-robin; no cross-division games exist.
                if (groupsIds.size === 1) {
                    const members = [
                        ...groupsIds.values()
                    ][0];
                    if (!fillRoundRobin(map, members, weeks, "div", rng)) return null;
                    break;
                }
                intraGroupPairs(map, groupsIds, 2, "div");
                const degree = new Map();
                for (const [, members] of groupsIds){
                    const cross = weeks - 2 * (members.length - 1);
                    for (const id of members)degree.set(id, cross);
                }
                // Reserve the bottom-vs-bottom cross game(s) for the final week and spend
                // one cross game from each participant, so the priority allocator fills
                // only the residual cross degree around them.
                reservedFinalCrossPairs = computeReservedFinalCrossPairs(input);
                for (const { a, b } of reservedFinalCrossPairs){
                    addPair(map, a, b, 1, "cross");
                    degree.set(a, (degree.get(a) ?? 0) - 1);
                    degree.set(b, (degree.get(b) ?? 0) - 1);
                }
                // Two equal odd divisions can land on an exact complete cross round robin.
                // For 5/5 teams over 13 weeks, every team needs all five cross opponents
                // once. The final-week reservation above already owns one of those pairs;
                // feeding only the residual degrees to the priority allocator makes it
                // select that same-seed pair again and reject an otherwise valid shape.
                const groupLists = [
                    ...groupsIds.values()
                ];
                const completeCrossRoundRobin = groupLists.length === 2 && groupLists[0].length === groupLists[1].length && weeks - 2 * (groupLists[0].length - 1) === groupLists[1].length;
                if (completeCrossRoundRobin) {
                    for (const a of groupLists[0]){
                        for (const b of groupLists[1]){
                            const key = a < b ? `${a}|${b}` : `${b}|${a}`;
                            if (!map.has(key)) addPair(map, a, b, 1, "cross");
                        }
                    }
                } else if (!addPrioritizedCrossPairs(map, input, degree, rng)) return null;
                break;
            }
        case "divisional_league":
            {
                const dgpo = input.settings.divisionalGamesPerOpponent;
                intraGroupPairs(map, groupsIds, dgpo, "div");
                const G = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gamesPerTeamTarget"])(input);
                const degree = new Map();
                for (const [, members] of groupsIds){
                    const cross = G - dgpo * (members.length - 1);
                    for (const id of members)degree.set(id, cross);
                }
                // single-division divisional league => no cross games
                const anyCross = [
                    ...degree.values()
                ].some((d)=>d > 0);
                if (anyCross) {
                    if (!addPrioritizedCrossPairs(map, input, degree, rng)) return null;
                }
                break;
            }
        case "round_robin_classic":
            {
                if (input.settings.classicRoundRobinMode === "cycle_count") {
                    // exact full cycles: every pair `cycles` times
                    const cycles = input.settings.classicRoundRobinCycleCount;
                    for(let i = 0; i < teamIds.length; i += 1)for(let j = i + 1; j < teamIds.length; j += 1)addPair(map, teamIds[i], teamIds[j], cycles, "round_robin");
                    break;
                }
                // season_length: each team plays `weeks` games, distinct before repeats
                if (!fillRoundRobin(map, teamIds, input.settings.weeks, "round_robin", rng)) {
                    return null;
                }
                break;
            }
        case "pool_play":
            {
                const repeat = input.settings.poolOpponentRepeatCount;
                intraGroupPairs(map, groupsIds, repeat, "pool");
                break;
            }
        default:
            return null;
    }
    if (input.settings.crossDivisionVariety === "more_flexible") {
        const protectedKeys = new Set(reservedFinalCrossPairs.map(({ a, b })=>a < b ? `${a}|${b}` : `${b}|${a}`));
        reduceCrossVariety(map, input, rng, protectedKeys);
    }
    return {
        pairs: [
            ...map.values()
        ],
        reservedFinalCrossPairs
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/placement.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "placeSchedule",
    ()=>placeSchedule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/domain/groups.ts [app-ssr] (ecmascript)");
;
function expandEdges(inventory) {
    const edges = [];
    for (const pair of inventory.pairs){
        const seriesId = `${pair.a}~${pair.b}`;
        for(let i = 0; i < pair.count; i += 1){
            edges.push({
                a: pair.a,
                b: pair.b,
                kind: pair.kind,
                seriesId,
                seriesGameIndex: i + 1,
                seriesLength: pair.count
            });
        }
    }
    return edges;
}
// Which weeks each team is PRESENT (i.e. not on bye). `quota` gives each team's
// total bye count (= effectiveWeeks − degree), uniformly covering explicit byes,
// odd-team structural byes, and zero-bye formats. Returns null if a valid bye
// layout can't be found under the window + parity constraints.
function decidePresence(input, W, quota, rng) {
    const n = input.teams.length;
    const present = new Map();
    for (const t of input.teams){
        present.set(t.id, new Set(Array.from({
            length: W
        }, (_, i)=>i + 1)));
    }
    const totalByes = [
        ...quota.values()
    ].reduce((s, v)=>s + v, 0);
    if (totalByes === 0) return present;
    // Bye-window preference only applies to divisional_league explicit byes. Other
    // formats have structural byes whose per-week distribution is parity-forced.
    const placement = input.settings.byeWeekPlacement;
    let windowWeeks;
    if (input.format !== "divisional_league" || placement === "anywhere") {
        windowWeeks = Array.from({
            length: W
        }, (_, i)=>i + 1);
    } else {
        const lo = Math.floor(W * 0.25) + 1;
        const hi = Math.ceil(W * 0.75);
        windowWeeks = [];
        for(let w = lo; w <= hi; w += 1)windowWeeks.push(w);
        if (placement === "prefer_middle") {
            // allow spill to all weeks if needed, window first (handled by load order)
            const rest = [];
            for(let w = 1; w <= W; w += 1)if (w < lo || w > hi) rest.push(w);
            windowWeeks = [
                ...windowWeeks,
                ...rest
            ];
        }
    }
    const byeCountPerWeek = new Map();
    for(let w = 1; w <= W; w += 1)byeCountPerWeek.set(w, 0);
    const teamByeWeeks = new Map();
    for (const t of input.teams)teamByeWeeks.set(t.id, new Set());
    const teamsOrder = rng.shuffle(input.teams.map((t)=>t.id));
    for (const teamId of teamsOrder){
        const byes = quota.get(teamId) ?? 0;
        if (byes === 0) continue;
        const chosen = teamByeWeeks.get(teamId);
        // pick `byes` distinct weeks with lowest current load, preferring window order
        const candidates = windowWeeks.filter((w)=>!chosen.has(w));
        candidates.sort((x, y)=>byeCountPerWeek.get(x) - byeCountPerWeek.get(y));
        if (candidates.length < byes) return null;
        for(let i = 0; i < byes; i += 1){
            const w = candidates[i];
            chosen.add(w);
            byeCountPerWeek.set(w, byeCountPerWeek.get(w) + 1);
        }
    }
    // parity fix: each week's present count (n - byes_w) must be even
    // i.e. byes_w must have parity == n mod 2
    const needParity = n % 2;
    for(let pass = 0; pass < 200; pass += 1){
        const badWeek = [
            ...byeCountPerWeek.entries()
        ].find(([, c])=>c % 2 !== needParity);
        if (!badWeek) break;
        const [bw] = badWeek;
        // move one bye from bw to another week with the opposite need, or vice versa
        // find a team byeing in bw that can move to a week with room and opposite parity issue
        let moved = false;
        const movableTeams = input.teams.map((t)=>t.id).filter((id)=>teamByeWeeks.get(id).has(bw));
        for (const teamId of rng.shuffle(movableTeams)){
            const targetWeek = rng.shuffle(windowWeeks).find((w)=>w !== bw && !teamByeWeeks.get(teamId).has(w) && (byeCountPerWeek.get(w) % 2 !== needParity || true));
            if (targetWeek == null) continue;
            // only beneficial if it fixes bw parity (it always flips bw by 1)
            teamByeWeeks.get(teamId).delete(bw);
            teamByeWeeks.get(teamId).add(targetWeek);
            byeCountPerWeek.set(bw, byeCountPerWeek.get(bw) - 1);
            byeCountPerWeek.set(targetWeek, byeCountPerWeek.get(targetWeek) + 1);
            moved = true;
            break;
        }
        if (!moved) return null;
    }
    // final parity check
    for (const [, c] of byeCountPerWeek){
        if (c % 2 !== needParity) return null;
    }
    for (const t of input.teams){
        const byeSet = teamByeWeeks.get(t.id);
        const presentSet = present.get(t.id);
        for (const w of byeSet)presentSet.delete(w);
    }
    return present;
}
function placeSchedule(input, inventory, rng, nodeBudget = 200_000) {
    const W = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["effectiveWeeks"])(input);
    const edges = expandEdges(inventory);
    // degree per team (for static ordering + bye quota)
    const degree = new Map();
    for (const t of input.teams)degree.set(t.id, 0);
    for (const e of edges){
        degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
        degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
    }
    // per-team bye quota = effectiveWeeks − degree (uniformly handles explicit
    // byes, odd-team structural byes, and zero-bye formats)
    const byeQuota = new Map();
    for (const t of input.teams){
        const q = W - (degree.get(t.id) ?? 0);
        if (q < 0) return null;
        byeQuota.set(t.id, q);
    }
    const presence = decidePresence(input, W, byeQuota, rng);
    if (!presence) return null;
    // present-by-week and capacity
    const presentByWeek = [];
    const cap = [];
    for(let w = 1; w <= W; w += 1){
        const set = new Set();
        for (const t of input.teams)if (presence.get(t.id).has(w)) set.add(t.id);
        presentByWeek.push(set);
        cap.push(set.size / 2);
    }
    const ordered = rng.shuffle(edges.slice());
    const occupied = Array.from({
        length: W
    }, ()=>new Set());
    const gamesInWeek = Array(W).fill(0);
    const assignment = Array(ordered.length).fill(-1);
    const assigned = Array(ordered.length).fill(false);
    let assignedCount = 0;
    let nodes = 0;
    // ---- Fantasy final-week divisional reservation --------------------------
    // Pre-build the closing slate so the general decomposition runs around it: the
    // final week is all-divisional except for the reserved bottom-vs-bottom cross
    // game(s), and each cross team gets a divisional game in the penultimate week
    // (the season-ending "ripple" rule). Week ORDER is arbitrary here — the
    // fantasy-final-week fairness constraints move these slates into place during
    // Phase-4 reorder. Applied best-effort: if the reservation or the solve around
    // it can't be realized we roll it back and place normally (never fail hard).
    const reservedIdx = [];
    const undoReservation = ()=>{
        for (const idx of reservedIdx){
            if (!assigned[idx]) continue;
            const w = assignment[idx];
            occupied[w].delete(ordered[idx].a);
            occupied[w].delete(ordered[idx].b);
            gamesInWeek[w] -= 1;
            assignment[idx] = -1;
            assigned[idx] = false;
            assignedCount -= 1;
        }
        reservedIdx.length = 0;
    };
    // Returns true if a (possibly empty) reservation was fully applied; false if it
    // hit an internal wall, in which case the caller rolls back the partial state.
    const applyFinalWeekReservation = ()=>{
        if (input.format !== "fantasy_nfl_divisional" || !input.settings.regularSeasonFinalWeekDivisional || W < 2) {
            return true;
        }
        const byDivision = new Map();
        for (const t of input.teams){
            if (!t.divisionId) continue;
            const list = byDivision.get(t.divisionId) ?? [];
            list.push(t);
            byDivision.set(t.divisionId, list);
        }
        if (byDivision.size <= 1) return true; // single-division fantasy: no cross games
        // Index unassigned edges by unordered-pair + kind so we can claim specific
        // pairings for the reserved slates.
        const edgeKey = (a, b, kind)=>`${a < b ? a : b}|${a < b ? b : a}|${kind}`;
        const edgeIndex = new Map();
        ordered.forEach((e, i)=>{
            const key = edgeKey(e.a, e.b, e.kind);
            const arr = edgeIndex.get(key);
            if (arr) arr.push(i);
            else edgeIndex.set(key, [
                i
            ]);
        });
        const reserveEdge = (a, b, kind, w)=>{
            const idx = edgeIndex.get(edgeKey(a, b, kind))?.find((i)=>!assigned[i]);
            if (idx === undefined) return false;
            if (gamesInWeek[w] >= cap[w]) return false;
            if (occupied[w].has(a) || occupied[w].has(b)) return false;
            occupied[w].add(a);
            occupied[w].add(b);
            gamesInWeek[w] += 1;
            assignment[idx] = w;
            assigned[idx] = true;
            assignedCount += 1;
            reservedIdx.push(idx);
            return true;
        };
        const reserved = inventory.reservedFinalCrossPairs ?? [];
        const wF = W - 1; // closing slate (0-indexed)
        const wP = W - 2; // penultimate slate
        const leftoverIds = new Set();
        for (const { a, b } of reserved){
            leftoverIds.add(a);
            leftoverIds.add(b);
        }
        // Closing slate: reserved cross games first, then a divisional perfect
        // matching of every non-leftover team (dropping each odd division's bottom
        // seed leaves all divisions even, so a full matching exists).
        for (const { a, b } of reserved){
            if (!reserveEdge(a, b, "cross", wF)) return false;
        }
        for (const members of byDivision.values()){
            const eligible = members.filter((t)=>!leftoverIds.has(t.id)).sort((x, y)=>x.divisionSeed - y.divisionSeed);
            for(let i = 0; i + 1 < eligible.length; i += 2){
                if (!reserveEdge(eligible[i].id, eligible[i + 1].id, "div", wF)) return false;
            }
        }
        // Penultimate slate: each cross team gets an in-division game (vs its top
        // seed) so it still finishes on a divisional matchup. Cross teams come from
        // distinct divisions, so these games never collide within the week.
        const teamById = new Map(input.teams.map((t)=>[
                t.id,
                t
            ]));
        for (const teamId of leftoverIds){
            const team = teamById.get(teamId);
            const opponent = team?.divisionId ? (byDivision.get(team.divisionId) ?? []).filter((t)=>t.id !== teamId).sort((x, y)=>x.divisionSeed - y.divisionSeed)[0] : undefined;
            if (!opponent || !reserveEdge(teamId, opponent.id, "div", wP)) return false;
        }
        return true;
    };
    const validWeeksFor = (e)=>{
        const out = [];
        for(let w = 0; w < W; w += 1){
            if (gamesInWeek[w] >= cap[w]) continue;
            if (!presentByWeek[w].has(e.a) || !presentByWeek[w].has(e.b)) continue;
            if (occupied[w].has(e.a) || occupied[w].has(e.b)) continue;
            out.push(w);
        }
        return out;
    };
    // Dynamic MRV: each step assign the most-constrained remaining edge (fewest
    // valid weeks). This prunes the exact-fill decomposition far harder than a
    // static order and is what makes dense regular instances (e.g. 16t/4div)
    // solvable within budget. LCV week order (pack fuller weeks) for values.
    const solve = ()=>{
        if (assignedCount === ordered.length) return true;
        nodes += 1;
        if (nodes > nodeBudget) return false;
        let bestEdge = -1;
        let bestWeeks = null;
        for(let i = 0; i < ordered.length; i += 1){
            if (assigned[i]) continue;
            const weeks = validWeeksFor(ordered[i]);
            if (weeks.length === 0) return false; // dead end: prune immediately
            if (bestWeeks === null || weeks.length < bestWeeks.length) {
                bestEdge = i;
                bestWeeks = weeks;
                if (weeks.length === 1) break; // forced move, take it now
            }
        }
        if (bestEdge === -1 || bestWeeks === null) return false;
        const e = ordered[bestEdge];
        const weeks = rng.shuffle(bestWeeks);
        weeks.sort((a, b)=>cap[a] - gamesInWeek[a] - (cap[b] - gamesInWeek[b]));
        for (const w of weeks){
            occupied[w].add(e.a);
            occupied[w].add(e.b);
            gamesInWeek[w] += 1;
            assignment[bestEdge] = w;
            assigned[bestEdge] = true;
            assignedCount += 1;
            if (solve()) return true;
            occupied[w].delete(e.a);
            occupied[w].delete(e.b);
            gamesInWeek[w] -= 1;
            assignment[bestEdge] = -1;
            assigned[bestEdge] = false;
            assignedCount -= 1;
            if (nodes > nodeBudget) return false;
        }
        return false;
    };
    // Try to place with the reserved final-week slates first; if that (or the
    // decomposition around it) is infeasible, roll the reservation back and place
    // normally so a valid schedule is still returned (best-effort).
    if (!applyFinalWeekReservation()) undoReservation();
    if (!solve()) {
        if (reservedIdx.length > 0) {
            undoReservation();
            nodes = 0; // fresh search budget for the unreserved fallback
            if (!solve()) return null;
        } else {
            return null;
        }
    }
    // build schedule
    const weekGames = Array.from({
        length: W
    }, ()=>[]);
    ordered.forEach((e, i)=>{
        const w = assignment[i];
        weekGames[w].push({
            a: e.a,
            b: e.b,
            homeTeamId: null,
            awayTeamId: null,
            kind: e.kind,
            seriesId: e.seriesId,
            seriesGameIndex: e.seriesGameIndex,
            seriesLength: e.seriesLength
        });
    });
    const weeks = [];
    for(let w = 0; w < W; w += 1){
        const byes = input.teams.map((t)=>t.id).filter((id)=>!presentByWeek[w].has(id));
        weeks.push({
            weekNumber: w + 1,
            games: weekGames[w],
            byes
        });
    }
    // Series numbers describe chronological meetings, not inventory order.
    const seriesOccurrences = new Map();
    for (const week of weeks){
        for (const game of week.games){
            const occurrence = (seriesOccurrences.get(game.seriesId) ?? 0) + 1;
            seriesOccurrences.set(game.seriesId, occurrence);
            game.seriesGameIndex = occurrence;
        }
    }
    return {
        format: input.format,
        weeks
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/roundRobin.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildRoundRobinSchedule",
    ()=>buildRoundRobinSchedule
]);
// Circle-method rounds for an even number of teams. Returns (n-1) rounds, each a
// perfect matching of all teams; every unordered pair appears exactly once across
// the full set of rounds, and no two consecutive rounds share a pair.
function circleRounds(teamIds) {
    const n = teamIds.length;
    const rounds = [];
    let list = teamIds.slice();
    for(let r = 0; r < n - 1; r += 1){
        const round = [];
        for(let i = 0; i < n / 2; i += 1){
            round.push([
                list[i],
                list[n - 1 - i]
            ]);
        }
        rounds.push(round);
        // rotate everything except the first element one step to the right
        const tail = list.slice(1);
        tail.unshift(tail.pop());
        list = [
            list[0],
            ...tail
        ];
    }
    return rounds;
}
function pairKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
}
function buildRoundRobinSchedule(input, teamIds, weeks, kind, rng) {
    const n = teamIds.length;
    if (n < 2 || n % 2 !== 0 || weeks < 1) return null;
    // Shuffle team → circle-position mapping for per-seed variety.
    const rounds = circleRounds(rng.shuffle(teamIds.slice()));
    const R = rounds.length;
    const counts = new Map();
    const weeksOut = [];
    for(let w = 0; w < weeks; w += 1){
        const round = rounds[w % R];
        const games = round.map(([a, b])=>{
            const key = pairKey(a, b);
            counts.set(key, (counts.get(key) ?? 0) + 1);
            return {
                a,
                b,
                homeTeamId: null,
                awayTeamId: null,
                kind,
                seriesId: key,
                seriesGameIndex: counts.get(key),
                seriesLength: 0
            };
        });
        weeksOut.push({
            weekNumber: w + 1,
            games,
            byes: []
        });
    }
    // Patch series totals now that every pair's final count is known.
    for (const week of weeksOut){
        for (const game of week.games){
            game.seriesLength = counts.get(pairKey(game.a, game.b)) ?? 1;
        }
    }
    const pairs = [
        ...counts.entries()
    ].map(([key, count])=>{
        const [a, b] = key.split("|");
        return {
            a,
            b,
            count,
            kind
        };
    });
    return {
        schedule: {
            format: input.format,
            weeks: weeksOut
        },
        inventory: {
            pairs
        }
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/orientation.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "allocateExtraHomes",
    ()=>allocateExtraHomes,
    "computeTargetHomeCounts",
    ()=>computeTargetHomeCounts,
    "degreeByTeam",
    ()=>degreeByTeam,
    "orientSchedule",
    ()=>orientSchedule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/domain/groups.ts [app-ssr] (ecmascript)");
;
function degreeByTeam(schedule) {
    const deg = new Map();
    for (const week of schedule.weeks){
        for (const g of week.games){
            deg.set(g.a, (deg.get(g.a) ?? 0) + 1);
            deg.set(g.b, (deg.get(g.b) ?? 0) + 1);
        }
    }
    return deg;
}
function allocateExtraHomes(input, degree) {
    const awarded = new Set();
    const oddTeams = input.teams.filter((t)=>(degree.get(t.id) ?? 0) % 2 === 1);
    if (oddTeams.length === 0) return awarded;
    const K = oddTeams.length / 2; // guaranteed integer (handshake parity)
    // group eligible (odd-G) teams by division, sorted best-divisionSeed first
    const byDiv = new Map();
    for (const t of oddTeams){
        const key = t.divisionId ?? __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SINGLE_LEAGUE_KEY"];
        const list = byDiv.get(key);
        if (list) list.push(t);
        else byDiv.set(key, [
            t
        ]);
    }
    for (const list of byDiv.values()){
        list.sort((a, b)=>a.divisionSeed - b.divisionSeed || (a.id < b.id ? -1 : 1));
    }
    const extraCount = new Map();
    const pointer = new Map(); // next un-awarded index per division
    let baseTotal = 0;
    for (const [key, list] of byDiv){
        const base = Math.floor(list.length / 2);
        for(let i = 0; i < base; i += 1)awarded.add(list[i].id);
        extraCount.set(key, base);
        pointer.set(key, base);
        baseTotal += base;
    }
    let remaining = K - baseTotal;
    while(remaining > 0){
        // divisions that still have an un-awarded eligible team
        const eligible = [
            ...byDiv.keys()
        ].filter((key)=>pointer.get(key) < byDiv.get(key).length);
        if (eligible.length === 0) break; // shouldn't happen given K ≤ oddTeams
        const min = Math.min(...eligible.map((key)=>extraCount.get(key)));
        const atMin = eligible.filter((key)=>extraCount.get(key) === min);
        // tie-break: division whose next-best team has the better (lowest) overallSeed
        atMin.sort((x, y)=>{
            const tx = byDiv.get(x)[pointer.get(x)];
            const ty = byDiv.get(y)[pointer.get(y)];
            return tx.overallSeed - ty.overallSeed || (tx.id < ty.id ? -1 : 1);
        });
        const chosen = atMin[0];
        const team = byDiv.get(chosen)[pointer.get(chosen)];
        awarded.add(team.id);
        extraCount.set(chosen, extraCount.get(chosen) + 1);
        pointer.set(chosen, pointer.get(chosen) + 1);
        remaining -= 1;
    }
    return awarded;
}
function computeTargetHomeCounts(input, degree) {
    const awarded = allocateExtraHomes(input, degree);
    const target = new Map();
    for (const t of input.teams){
        const d = degree.get(t.id) ?? 0;
        if (d % 2 === 0) target.set(t.id, d / 2);
        else target.set(t.id, awarded.has(t.id) ? (d + 1) / 2 : (d - 1) / 2);
    }
    return target;
}
class MaxFlow {
    graph;
    constructor(n){
        this.graph = Array.from({
            length: n
        }, ()=>[]);
    }
    addEdge(u, v, cap) {
        this.graph[u].push({
            to: v,
            cap,
            flow: 0,
            rev: this.graph[v].length
        });
        this.graph[v].push({
            to: u,
            cap: 0,
            flow: 0,
            rev: this.graph[u].length - 1
        });
    }
    // Edmonds-Karp BFS augmenting (small graphs; correctness over speed)
    maxflow(s, t) {
        let total = 0;
        for(;;){
            const parentNode = new Array(this.graph.length).fill(-1);
            const parentEdge = new Array(this.graph.length).fill(-1);
            parentNode[s] = s;
            const queue = [
                s
            ];
            while(queue.length > 0){
                const u = queue.shift();
                this.graph[u].forEach((e, idx)=>{
                    if (parentNode[e.to] === -1 && e.cap - e.flow > 0) {
                        parentNode[e.to] = u;
                        parentEdge[e.to] = idx;
                        queue.push(e.to);
                    }
                });
                if (parentNode[t] !== -1) break;
            }
            if (parentNode[t] === -1) break;
            // augment by 1 (all caps are 1 along the relevant paths)
            let v = t;
            let bottleneck = Infinity;
            while(v !== s){
                const u = parentNode[v];
                const e = this.graph[u][parentEdge[v]];
                bottleneck = Math.min(bottleneck, e.cap - e.flow);
                v = u;
            }
            v = t;
            while(v !== s){
                const u = parentNode[v];
                const e = this.graph[u][parentEdge[v]];
                e.flow += bottleneck;
                this.graph[e.to][e.rev].flow -= bottleneck;
                v = u;
            }
            total += bottleneck;
        }
        return total;
    }
}
function pairKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
}
function orientSchedule(schedule, targetHome) {
    const games = [];
    const byPair = new Map(); // pairKey -> game indices (week order)
    for (const week of schedule.weeks){
        for (const g of week.games){
            const idx = games.length;
            games.push({
                a: g.a,
                b: g.b,
                set: (home, away)=>{
                    g.homeTeamId = home;
                    g.awayTeamId = away;
                }
            });
            const key = pairKey(g.a, g.b);
            const list = byPair.get(key);
            if (list) list.push(idx);
            else byPair.set(key, [
                idx
            ]);
        }
    }
    const preHome = new Map();
    for (const id of targetHome.keys())preHome.set(id, 0);
    const bump = (id, n = 1)=>preHome.set(id, (preHome.get(id) ?? 0) + n);
    // Pre-assign the balanced (even) portion of every pairing; collect the leftover
    // swing game index (one per odd-count pairing) for the flow.
    const swingIdx = [];
    const assignHome = new Array(games.length).fill(null);
    for (const indices of byPair.values()){
        const first = games[indices[0]];
        const lo = first.a < first.b ? first.a : first.b;
        const hi = first.a < first.b ? first.b : first.a;
        const base = Math.floor(indices.length / 2);
        for(let i = 0; i < base; i += 1)assignHome[indices[i]] = lo;
        for(let i = base; i < 2 * base; i += 1)assignHome[indices[i]] = hi;
        bump(lo, base);
        bump(hi, base);
        if (indices.length % 2 === 1) swingIdx.push(indices[2 * base]);
    }
    // Residual swing target per team; must be a non-negative integer.
    const teamIds = [
        ...targetHome.keys()
    ];
    const teamIndex = new Map();
    teamIds.forEach((id, i)=>teamIndex.set(id, i));
    const swingTarget = new Map();
    for (const id of teamIds){
        const residual = (targetHome.get(id) ?? 0) - (preHome.get(id) ?? 0);
        if (residual < 0) return false; // §5 split unrealizable under balance here
        swingTarget.set(id, residual);
    }
    // Degree-constrained max-flow over swing games only.
    const K = swingIdx.length;
    const N = teamIds.length;
    const S = 0;
    const edgeBase = 1; // swing-edge nodes: edgeBase .. edgeBase+K-1
    const teamBase = edgeBase + K;
    const T = teamBase + N;
    const flow = new MaxFlow(T + 1);
    swingIdx.forEach((gi, i)=>{
        const g = games[gi];
        const eNode = edgeBase + i;
        flow.addEdge(S, eNode, 1);
        flow.addEdge(eNode, teamBase + teamIndex.get(g.a), 1);
        flow.addEdge(eNode, teamBase + teamIndex.get(g.b), 1);
    });
    teamIds.forEach((id, i)=>{
        flow.addEdge(teamBase + i, T, swingTarget.get(id) ?? 0);
    });
    if (flow.maxflow(S, T) !== K) return false;
    // Read swing orientation: the team-edge carrying flow is HOME.
    swingIdx.forEach((gi, i)=>{
        const g = games[gi];
        const eNode = edgeBase + i;
        let home = null;
        for (const fe of flow.graph[eNode]){
            if (fe.to >= teamBase && fe.to < T && fe.flow > 0) {
                home = teamIds[fe.to - teamBase];
                break;
            }
        }
        assignHome[gi] = home ?? g.a; // defensive; saturating flow guarantees one
    });
    // Commit every game (pre-assigned + swing).
    games.forEach((g, i)=>{
        const home = assignHome[i] ?? g.a;
        const away = home === g.a ? g.b : g.a;
        g.set(home, away);
    });
    return true;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/streakRepair.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "repairHomeAwayStreaks",
    ()=>repairHomeAwayStreaks
]);
// Home/away streak repair for the canonical round-robin path.
//
// The max-flow orientation (phases/orientation) realizes each team's target home
// count exactly AND balances every pairing floor/ceil, but it is blind to
// consecutive home/away runs — so a canonical single-division fantasy schedule
// comes back with `max-home-away-streak` fairness violations for several teams.
// Week order already guarantees coverage-before-repeats and no immediate rematch,
// and the SA reorder is skipped on this path, so orientation is the only remaining
// lever.
//
// Move set — every move must preserve BOTH invariants orientation established:
// per-team home totals AND per-pairing floor/ceil balance. Two families do:
//
//   (A) Intra-pair swap: within one pairing, take a game the low-id team hosts and
//       a game the high-id team hosts and swap their hosts. The pair's per-side
//       home count is unchanged (so balance holds) and each team's season total is
//       unchanged — only WHICH week each side hosts moves, which is exactly the
//       streak lever. This is the only freedom for even pairings (e.g. a 2-game
//       series that is locked 1-1).
//
//   (B) Odd-pair ceil-swap cycle: an odd pairing splits ceil/floor by one, so it
//       has a "majority host". Flipping its majority game moves one home from the
//       majority side to the minority side (ceil↔floor — still balanced) but shifts
//       one game off each team's total. Orient one edge per odd pairing toward its
//       current majority host and reverse a directed cycle: every node loses one
//       majority-holding and gains one, so all season totals are preserved while a
//       set of pairings swap which side carries the extra home.
//
// Together these are the complete set of balance-preserving re-orientations, so a
// short simulated anneal over them drives streak excess down without ever
// reintroducing an all-home/all-away series. A move is represented as the set of
// game indices whose host flips; undo re-flips the same set.
function otherEndpoint(game, team) {
    return team === game.a ? game.b : game.a;
}
function pairKeyOf(g) {
    return g.a < g.b ? `${g.a}|${g.b}` : `${g.b}|${g.a}`;
}
// Propose an intra-pair swap: a low-host game and a high-host game of the same
// pairing. Returns the two game indices to flip, or null if none available.
function proposeIntraPairSwap(games, home, pairIndices, rng) {
    const keys = [
        ...pairIndices.keys()
    ];
    if (keys.length === 0) return null;
    // Try a few random pairings before giving up.
    for(let attempt = 0; attempt < 8; attempt += 1){
        const key = keys[rng.int(0, keys.length - 1)];
        const indices = pairIndices.get(key);
        const lo = key.split("|")[0];
        const loHost = [];
        const hiHost = [];
        for (const gi of indices)(home[gi] === lo ? loHost : hiHost).push(gi);
        if (loHost.length === 0 || hiHost.length === 0) continue;
        const x = loHost[rng.int(0, loHost.length - 1)];
        const y = hiHost[rng.int(0, hiHost.length - 1)];
        return [
            x,
            y
        ];
    }
    return null;
}
// Propose an odd-pair ceil-swap cycle. Builds one edge per odd pairing directed
// toward its current majority host, walks to a directed cycle, and returns the
// majority game index of each pairing on the cycle (the games to flip). Null if
// no cycle is found.
function proposeCeilSwapCycle(games, home, oddPairKeys, pairIndices, rng) {
    // majorityHost + a majority game index per odd pairing, from current orientation
    const majorityHost = new Map();
    const majorityGame = new Map();
    const outEdges = new Map(); // majority host -> odd pair keys
    for (const key of oddPairKeys){
        const indices = pairIndices.get(key);
        const [lo, hi] = key.split("|");
        let loCount = 0;
        let loGame = -1;
        let hiGame = -1;
        for (const gi of indices){
            if (home[gi] === lo) {
                loCount += 1;
                loGame = gi;
            } else {
                hiGame = gi;
            }
        }
        const hiCount = indices.length - loCount;
        const host = loCount > hiCount ? lo : hi;
        majorityHost.set(key, host);
        majorityGame.set(key, host === lo ? loGame : hiGame);
        const list = outEdges.get(host);
        if (list) list.push(key);
        else outEdges.set(host, [
            key
        ]);
    }
    const starts = [
        ...outEdges.keys()
    ];
    if (starts.length === 0) return null;
    let cur = starts[rng.int(0, starts.length - 1)];
    const posInPath = new Map([
        [
            cur,
            0
        ]
    ]);
    const edgeSeq = []; // pair keys along the path
    const maxSteps = oddPairKeys.length + 1;
    for(let step = 0; step < maxSteps; step += 1){
        const edges = outEdges.get(cur);
        if (!edges || edges.length === 0) return null;
        const key = edges[rng.int(0, edges.length - 1)];
        const head = otherEndpoint(games[majorityGame.get(key)], majorityHost.get(key)); // minority side
        const seenAt = posInPath.get(head);
        if (seenAt !== undefined) {
            const cycleKeys = edgeSeq.slice(seenAt);
            cycleKeys.push(key);
            return cycleKeys.map((k)=>majorityGame.get(k));
        }
        posInPath.set(head, edgeSeq.length + 1);
        edgeSeq.push(key);
        cur = head;
    }
    return null;
}
// Count of over-cap positions summed across teams (a run of length L>cap
// contributes L−cap). Zero ⇔ no team exceeds the streak cap, matching the
// registry's `max-home-away-streak` fairness check.
function streakExcess(teamSequences, home, cap) {
    let total = 0;
    for (const { team, games } of teamSequences){
        let run = 0;
        let prev = null;
        for (const gi of games){
            const isHome = home[gi] === team;
            if (isHome === prev) run += 1;
            else {
                run = 1;
                prev = isHome;
            }
            if (run > cap) total += 1;
        }
    }
    return total;
}
function repairHomeAwayStreaks(schedule, cap, rng, opts = {}) {
    const refs = [];
    const games = [];
    const weeksInOrder = [
        ...schedule.weeks
    ].sort((x, y)=>x.weekNumber - y.weekNumber);
    for (const week of weeksInOrder){
        for (const g of week.games){
            refs.push(g);
            games.push({
                a: g.a,
                b: g.b
            });
        }
    }
    const E = games.length;
    if (E === 0) return;
    // Current home team per game (games are already in week order).
    const home = refs.map((g, i)=>g.homeTeamId ?? games[i].a);
    // Per-team ordered game indices (used for streak counting).
    const seqByTeam = new Map();
    games.forEach((g, i)=>{
        for (const t of [
            g.a,
            g.b
        ]){
            const list = seqByTeam.get(t);
            if (list) list.push(i);
            else seqByTeam.set(t, [
                i
            ]);
        }
    });
    const teamSequences = [
        ...seqByTeam.entries()
    ].map(([team, gs])=>({
            team,
            games: gs
        }));
    // Group game indices by pairing; odd-count pairings are the ceil-swap edges.
    const pairIndices = new Map();
    games.forEach((g, i)=>{
        const key = pairKeyOf(g);
        const list = pairIndices.get(key);
        if (list) list.push(i);
        else pairIndices.set(key, [
            i
        ]);
    });
    const oddPairKeys = [
        ...pairIndices.entries()
    ].filter(([, idxs])=>idxs.length % 2 === 1).map(([k])=>k);
    let curCost = streakExcess(teamSequences, home, cap);
    if (curCost === 0) return;
    let best = home.slice();
    let bestCost = curCost;
    const maxIterations = opts.maxIterations ?? 6000;
    let temp = 1.0;
    const cooling = 0.999;
    const applyFlip = (idxs)=>{
        for (const gi of idxs)home[gi] = otherEndpoint(games[gi], home[gi]);
    };
    for(let iter = 0; iter < maxIterations && bestCost > 0; iter += 1){
        // Alternate between the two balance-preserving move families. Ceil-swap
        // cycles need odd pairings; fall back to intra-pair swaps otherwise.
        const useCycle = oddPairKeys.length > 0 && rng.next() < 0.5;
        const move = useCycle ? proposeCeilSwapCycle(games, home, oddPairKeys, pairIndices, rng) : proposeIntraPairSwap(games, home, pairIndices, rng);
        if (move && move.length > 0) {
            applyFlip(move);
            const newCost = streakExcess(teamSequences, home, cap);
            const delta = newCost - curCost;
            if (delta <= 0 || rng.next() < Math.exp(-delta / Math.max(temp, 1e-6))) {
                curCost = newCost;
                if (newCost < bestCost) {
                    bestCost = newCost;
                    best = home.slice();
                }
            } else {
                applyFlip(move); // reject: undo (flipping the same set is its own inverse)
            }
        }
        temp *= cooling;
    }
    // Write the best orientation found back onto the schedule.
    refs.forEach((g, i)=>{
        const h = best[i];
        g.homeTeamId = h;
        g.awayTeamId = otherEndpoint(games[i], h);
    });
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/optimize.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "optimizeSchedule",
    ()=>optimizeSchedule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$constraints$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/constraints/registry.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$streakRepair$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/streakRepair.ts [app-ssr] (ecmascript)");
;
;
// Phase 4 cost: fairness violations dominate (they are hard, surfaced as
// warnings only if unbeatable), then the weighted soft objective. Week ORDER is
// the only lever here — it is feasibility-preserving for every Tier-1 constraint
// (counts, multiset, byes, home/away totals are all order-invariant), while
// streaks, immediate-rematch, bye-window, and the soft scorers all depend on it.
const FAIRNESS_PENALTY = 10_000;
function softObjective(schedule, ctx) {
    const soft = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$constraints$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["constraintsFor"])(ctx.input.format, "soft");
    let weight = 0;
    let acc = 0;
    for (const c of soft){
        if (!c.score) continue;
        weight += c.weight;
        acc += c.weight * c.score(schedule, ctx);
    }
    return weight === 0 ? 0.5 : acc / weight; // higher is better, 0..1
}
function fairnessViolations(schedule, ctx) {
    let count = 0;
    for (const c of (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$constraints$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["constraintsFor"])(ctx.input.format, "fairness")){
        if (c.check) count += c.check(schedule, ctx).length;
    }
    return count;
}
// Lower is better.
function cost(schedule, ctx) {
    return fairnessViolations(schedule, ctx) * FAIRNESS_PENALTY + (1 - softObjective(schedule, ctx));
}
// Renumber weeks to their array position (1-based) so weekNumber-dependent
// constraints (final/opening/Thanksgiving/bye-window) read the new order.
function renumber(weeks) {
    return weeks.map((w, i)=>({
            ...w,
            weekNumber: i + 1
        }));
}
// Deep-copy weeks (and their games) so optimize owns its game objects and the
// balance-preserving streak repair can re-orient them in place without leaking
// mutations back to the caller's schedule or corrupting a saved snapshot.
function cloneWeeks(weeks) {
    return weeks.map((w)=>({
            ...w,
            games: w.games.map((g)=>({
                    ...g
                })),
            byes: [
                ...w.byes
            ]
        }));
}
// One simulated-annealing pass over week ORDER (orientation held fixed). Returns
// the best-ordered clone found. Order is feasibility-preserving for every Tier-1
// constraint; streaks, immediate-rematch, bye-window and the soft scorers depend
// on it.
function reorderPass(schedule, weeks, ctx, rng, maxIterations, deadline) {
    let current = renumber(weeks);
    let currentCost = cost({
        ...schedule,
        weeks: current
    }, ctx);
    let best = current;
    let bestCost = currentCost;
    const W = current.length;
    if (W < 2) return {
        weeks: current,
        cost: currentCost
    };
    let temp = 1.0;
    const cooling = 0.9995;
    for(let iter = 0; iter < maxIterations; iter += 1){
        if (bestCost === 0) break;
        if ((iter & 63) === 0 && Date.now() > deadline) break;
        const candidate = current.slice();
        if (rng.next() < 0.5) {
            const i = rng.int(0, W - 1);
            let j = rng.int(0, W - 1);
            if (i === j) j = (j + 1) % W;
            const tmp = candidate[i];
            candidate[i] = candidate[j];
            candidate[j] = tmp;
        } else {
            let lo = rng.int(0, W - 1);
            let hi = rng.int(0, W - 1);
            if (lo > hi) [lo, hi] = [
                hi,
                lo
            ];
            while(lo < hi){
                const tmp = candidate[lo];
                candidate[lo] = candidate[hi];
                candidate[hi] = tmp;
                lo += 1;
                hi -= 1;
            }
        }
        const renumbered = renumber(candidate);
        const candCost = cost({
            ...schedule,
            weeks: renumbered
        }, ctx);
        const delta = candCost - currentCost;
        if (delta <= 0 || rng.next() < Math.exp(-delta / Math.max(temp, 1e-6))) {
            current = renumbered;
            currentCost = candCost;
            if (candCost < bestCost) {
                best = renumbered;
                bestCost = candCost;
            }
        }
        temp *= cooling;
    }
    return {
        weeks: best,
        cost: bestCost
    };
}
function optimizeSchedule(schedule, ctx, rng, opts = {}) {
    const maxIterations = opts.maxIterations ?? 6000;
    const timeBudgetMs = opts.timeBudgetMs ?? 20_000;
    const deadline = Date.now() + timeBudgetMs;
    const streakCap = ctx.input.settings.relaxStreaks ? ctx.input.settings.maxHomeAwayStreak + 2 : ctx.input.settings.maxHomeAwayStreak;
    // optimize owns its game objects from here on.
    let work = cloneWeeks(schedule.weeks);
    // (0) Full-strength reorder, then a balance-preserving streak repair.
    work = reorderPass(schedule, work, ctx, rng, maxIterations, deadline).weeks;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$streakRepair$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["repairHomeAwayStreaks"])({
        ...schedule,
        weeks: work
    }, streakCap, rng, {
        maxIterations: 8_000
    });
    let bestWeeks = cloneWeeks(work);
    let bestCost = cost({
        ...schedule,
        weeks: renumber(bestWeeks)
    }, ctx);
    // (1) Extra co-adaptation rounds ONLY while streak violations survive: reorder
    // against the repaired orientation, then repair again. Each round gets half the
    // budget; caps and deadline bound total effort.
    const EXTRA_ROUNDS = 4;
    for(let round = 0; round < EXTRA_ROUNDS && fairnessViolations({
        ...schedule,
        weeks: renumber(work)
    }, ctx) > 0 && Date.now() < deadline; round += 1){
        work = reorderPass(schedule, work, ctx, rng, Math.max(1, maxIterations >> 1), deadline).weeks;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$streakRepair$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["repairHomeAwayStreaks"])({
            ...schedule,
            weeks: work
        }, streakCap, rng, {
            maxIterations: 6_000
        });
        const roundCost = cost({
            ...schedule,
            weeks: renumber(work)
        }, ctx);
        if (roundCost < bestCost) {
            bestCost = roundCost;
            bestWeeks = cloneWeeks(work);
        }
    }
    const result = {
        ...schedule,
        weeks: renumber(bestWeeks)
    };
    return {
        schedule: result,
        fairnessViolations: fairnessViolations(result, ctx),
        softScore: softObjective(result, ctx)
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/report.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildReport",
    ()=>buildReport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$constraints$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/constraints/registry.ts [app-ssr] (ecmascript)");
;
function buildReport(schedule, ctx) {
    const { hardIssues, fairnessIssues, softScores } = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$constraints$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateSchedule"])(schedule, ctx);
    const warnings = [];
    for (const i of hardIssues)warnings.push(`[hard] ${i.message}`);
    for (const i of fairnessIssues)warnings.push(`[fairness] ${i.message}`);
    return {
        hardPass: hardIssues.length === 0,
        warnings,
        softReport: softScores
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/rng.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSeededRng",
    ()=>createSeededRng
]);
function hashSeed(seed) {
    let hash = 2166136261;
    for(let i = 0; i < seed.length; i += 1){
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
function nextXorshift(state) {
    let x = state >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
}
function createSeededRng(seed) {
    const seedStr = typeof seed === "number" ? `n:${seed}` : seed;
    let state = hashSeed(seedStr) || 1;
    const next = ()=>{
        state = nextXorshift(state);
        return state / 0xffffffff;
    };
    const rng = {
        seed: seedStr,
        next,
        int (min, max) {
            if (max < min) {
                throw new Error(`Invalid rng.int bounds: ${min}..${max}`);
            }
            return Math.floor(next() * (max - min + 1)) + min;
        },
        bool (probability = 0.5) {
            return next() < probability;
        },
        pick (values) {
            if (values.length === 0) {
                throw new Error("Cannot pick from an empty array");
            }
            return values[rng.int(0, values.length - 1)];
        },
        shuffle (values) {
            const cloned = [
                ...values
            ];
            for(let i = cloned.length - 1; i > 0; i -= 1){
                const j = rng.int(0, i);
                [cloned[i], cloned[j]] = [
                    cloned[j],
                    cloned[i]
                ];
            }
            return cloned;
        },
        fork (tag) {
            return createSeededRng(`${seedStr}::${tag}`);
        }
    };
    return rng;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/engine/v3/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EngineInfeasibleError",
    ()=>EngineInfeasibleError,
    "runEngine",
    ()=>runEngine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$constraints$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/constraints/registry.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/domain/groups.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$feasibility$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/feasibility.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$inventory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/inventory.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$placement$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/placement.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$roundRobin$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/roundRobin.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$orientation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/orientation.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$optimize$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/optimize.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$streakRepair$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/streakRepair.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$report$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/phases/report.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$rng$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/rng.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
class EngineInfeasibleError extends Error {
    reasons;
    suggestions;
    constructor(reasons, suggestions){
        super(reasons.join(" "));
        this.name = "EngineInfeasibleError";
        this.reasons = reasons;
        this.suggestions = suggestions;
    }
}
// Single-league round-robin shape: every game is intra-league, so the schedule
// is a pure round robin and is generated canonically (see phases/roundRobin) to
// guarantee balanced coverage before repeats and no back-to-back rematches. Two
// configs qualify:
//   • fantasy with only one division (or "no divisions"), and
//   • season-length classic round robin.
// The circle-method builder is even-team-only; both configs are even by the time
// they reach here (fantasy requires an even count; season-length round robin is
// rejected at Phase 0 for odd counts), so the builder always applies. Classic
// cycle-count mode stays on the placement path — it can be odd-team (structural
// byes), which the builder does not handle, and it already meets coverage.
function isSingleDivisionRoundRobin(input) {
    if (input.format === "fantasy_nfl_divisional" && (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupTeams"])(input.teams).size <= 1) {
        return true;
    }
    return input.format === "round_robin_classic" && input.settings.classicRoundRobinMode === "season_length";
}
// The canonical builder tags every game with the format's single intra-league
// kind: fantasy games are "div"; classic round-robin games are "round_robin".
function canonicalRoundRobinKind(input) {
    return input.format === "round_robin_classic" ? "round_robin" : "div";
}
// Weighted mean of the soft scorers (0..1), matching optimize's softObjective.
function softScoreOf(outcome) {
    let weight = 0;
    let acc = 0;
    for (const s of outcome.softScores){
        weight += s.weight;
        acc += s.weight * s.score;
    }
    return weight === 0 ? 0.5 : acc / weight;
}
function runEngine(input, options = {}) {
    const verdict = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$feasibility$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkFeasibility"])(input);
    if (!verdict.ok) throw new EngineInfeasibleError(verdict.reasons, verdict.suggestions);
    const seedBase = String(options.seed ?? "v3");
    const maxAttempts = Math.max(1, options.maxAttempts ?? 60);
    const timeBudgetMs = Math.max(1_000, options.timeBudgetMs ?? 150_000);
    const start = Date.now();
    let placedAny = false;
    let best = null;
    const canonicalRoundRobin = isSingleDivisionRoundRobin(input);
    for(let attempt = 0; attempt < maxAttempts; attempt += 1){
        if (Date.now() - start > timeBudgetMs) break;
        const rng = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$rng$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createSeededRng"])(`${seedBase}::${attempt}`);
        let inventory;
        let placed;
        if (canonicalRoundRobin) {
            const built = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$roundRobin$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildRoundRobinSchedule"])(input, input.teams.map((t)=>t.id), input.settings.weeks, canonicalRoundRobinKind(input), rng);
            inventory = built?.inventory ?? null;
            placed = built?.schedule ?? null;
        } else {
            inventory = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$inventory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildInventory"])(input, rng);
            if (!inventory) continue;
            placed = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$placement$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeSchedule"])(input, inventory, rng);
        }
        if (!inventory || !placed) continue;
        placedAny = true;
        const degree = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$orientation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["degreeByTeam"])(placed);
        const targetHomeCounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$orientation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeTargetHomeCounts"])(input, degree);
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$orientation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["orientSchedule"])(placed, targetHomeCounts)) continue;
        const ctx = {
            input,
            teamsById: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$domain$2f$groups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildTeamsById"])(input.teams),
            gamesPerTeam: degree,
            inventory,
            targetHomeCounts
        };
        let candidate;
        if (canonicalRoundRobin) {
            // Canonical order already satisfies coverage-before-repeats and produces no
            // back-to-back rematches; the SA reorder can only jeopardize those, so
            // score the placed order directly instead of optimizing week order. The
            // max-flow orientation hits every home total but ignores home/away runs, so
            // repair streaks first via totals-preserving cycle reversals (see
            // phases/streakRepair) — the only remaining fairness lever on this path.
            const streakCap = input.settings.relaxStreaks ? input.settings.maxHomeAwayStreak + 2 : input.settings.maxHomeAwayStreak;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$streakRepair$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["repairHomeAwayStreaks"])(placed, streakCap, rng);
            const outcome = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$constraints$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateSchedule"])(placed, ctx);
            candidate = {
                schedule: placed,
                ctx,
                fairnessViolations: outcome.fairnessIssues.length,
                softScore: softScoreOf(outcome)
            };
        } else {
            const remaining = timeBudgetMs - (Date.now() - start);
            const perAttemptBudget = Math.max(1_000, Math.min(20_000, remaining));
            const opt = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$optimize$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["optimizeSchedule"])(placed, ctx, rng, {
                timeBudgetMs: perAttemptBudget
            });
            candidate = {
                schedule: opt.schedule,
                ctx,
                fairnessViolations: opt.fairnessViolations,
                softScore: opt.softScore
            };
        }
        if (!best || candidate.fairnessViolations < best.fairnessViolations || candidate.fairnessViolations === best.fairnessViolations && candidate.softScore > best.softScore) {
            best = candidate;
        }
        if (candidate.fairnessViolations === 0) break;
    }
    if (!best) {
        if (!placedAny) {
            throw new EngineInfeasibleError([
                "The scheduler could not build a valid matchup set for this configuration."
            ], [
                "Try adjusting team counts, divisions, weeks, or byes."
            ]);
        }
        throw new EngineInfeasibleError([
            "The scheduler could not orient home/away games for this configuration."
        ], [
            "Try a different seed or relax home/away balance settings."
        ]);
    }
    const report = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$phases$2f$report$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildReport"])(best.schedule, best.ctx);
    return {
        schedule: best.schedule,
        warnings: report.warnings,
        softReport: report.softReport,
        hardPass: report.hardPass,
        seedUsed: seedBase,
        phaseName: best.fairnessViolations === 0 ? "optimized" : "best-effort"
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/schedule.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateLeagueSchedule",
    ()=>generateLeagueSchedule,
    "getNflWeekWindow",
    ()=>getNflWeekWindow,
    "getNflWeeks",
    ()=>getNflWeeks,
    "getWeekDateLabel",
    ()=>getWeekDateLabel,
    "updateGameScore",
    ()=>updateGameScore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/engine/v3/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$matchups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/matchups.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/rankings.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$standings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/standings.ts [app-ssr] (ecmascript)");
;
;
;
;
const NFL_OPENING_DATES = {
    2024: "2024-09-05",
    2025: "2025-09-04",
    2026: "2026-09-10",
    2027: "2027-09-09",
    2028: "2028-09-07",
    2029: "2029-09-06",
    2030: "2030-09-05"
};
function weekStartCalendarDate(seasonYear, weekNumber) {
    const opening = NFL_OPENING_DATES[seasonYear] ?? `${seasonYear}-09-05`;
    const date = new Date(`${opening}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 2 + (weekNumber - 1) * 7);
    return date;
}
function easternCutoffDate(calendarDate) {
    const offsetName = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        timeZoneName: "shortOffset"
    }).formatToParts(calendarDate).find((part)=>part.type === "timeZoneName")?.value || "GMT-5";
    const offsetHours = Number(offsetName.replace("GMT", "")) || -5;
    return new Date(Date.UTC(calendarDate.getUTCFullYear(), calendarDate.getUTCMonth(), calendarDate.getUTCDate(), 4 - offsetHours));
}
function holidayDates(seasonYear) {
    const thanksgiving = new Date(Date.UTC(seasonYear, 10, 1, 12));
    thanksgiving.setUTCDate(1 + (4 - thanksgiving.getUTCDay() + 7) % 7 + 21);
    return [
        {
            name: "Thanksgiving",
            date: thanksgiving
        },
        {
            name: "Christmas",
            date: new Date(Date.UTC(seasonYear, 11, 25, 12))
        },
        {
            name: "New Year’s",
            date: new Date(Date.UTC(seasonYear + 1, 0, 1, 12))
        }
    ];
}
function getNflWeekWindow(seasonYear, weekNumber) {
    const startCalendar = weekStartCalendarDate(seasonYear, weekNumber);
    const endCalendar = new Date(startCalendar);
    endCalendar.setUTCDate(endCalendar.getUTCDate() + 7);
    const month = new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC"
    });
    const day = new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        timeZone: "UTC"
    });
    const sameYear = startCalendar.getUTCFullYear() === endCalendar.getUTCFullYear();
    const range = startCalendar.getUTCMonth() === endCalendar.getUTCMonth() && sameYear ? `${month.format(startCalendar)} ${day.format(startCalendar)}–${day.format(endCalendar)}` : sameYear ? `${month.format(startCalendar)} ${day.format(startCalendar)}–${month.format(endCalendar)} ${day.format(endCalendar)}` : `${month.format(startCalendar)} ${day.format(startCalendar)}, ${startCalendar.getUTCFullYear()}–${month.format(endCalendar)} ${day.format(endCalendar)}, ${endCalendar.getUTCFullYear()}`;
    const holidays = holidayDates(seasonYear).filter((holiday)=>holiday.date >= startCalendar && holiday.date < endCalendar).map((holiday)=>holiday.name);
    return {
        week: weekNumber,
        startsAt: easternCutoffDate(startCalendar).toISOString(),
        endsAt: easternCutoffDate(endCalendar).toISOString(),
        label: sameYear ? `${range}, ${endCalendar.getUTCFullYear()}` : range,
        cutoffLabel: "Tue 4:00 AM ET → Tue 4:00 AM ET",
        holidays
    };
}
function getWeekDateLabel(seasonYear, weekNumber) {
    return getNflWeekWindow(seasonYear, weekNumber).label;
}
function getNflWeeks(seasonYear, count) {
    return Array.from({
        length: count
    }, (_, index)=>getNflWeekWindow(seasonYear, index + 1));
}
function buildEngineInput(setup) {
    const divisionOrder = new Map(setup.divisions.map((division, index)=>[
            division.id,
            index
        ]));
    const openingWeekRank = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWeekOneRankMap"])(setup);
    const divisionTeams = new Map();
    for (const division of setup.divisions)divisionTeams.set(division.id, []);
    for (const team of setup.teams){
        const current = divisionTeams.get(team.divisionId) ?? [];
        current.push(team);
        divisionTeams.set(team.divisionId, current);
    }
    const divisionSeedByTeam = new Map();
    for (const teams of divisionTeams.values()){
        [
            ...teams
        ].sort((a, b)=>a.overallRank - b.overallRank || a.id.localeCompare(b.id)).forEach((team, index)=>divisionSeedByTeam.set(team.id, index + 1));
    }
    return {
        format: "fantasy_nfl_divisional",
        divisions: setup.divisions.map((division)=>({
                id: division.id,
                orderIndex: divisionOrder.get(division.id) ?? 0
            })),
        teams: setup.teams.map((team)=>({
                id: team.id,
                divisionId: team.divisionId,
                divisionSeed: divisionSeedByTeam.get(team.id) ?? team.overallRank,
                overallSeed: team.overallRank,
                openingWeekSeed: openingWeekRank.get(team.id) ?? team.overallRank
            })),
        settings: {
            weeks: setup.weeks,
            byesPerTeam: 0,
            divisionalGamesPerOpponent: 2,
            poolOpponentRepeatCount: 1,
            classicRoundRobinMode: "season_length",
            classicRoundRobinCycleCount: 1,
            maxHomeAwayStreak: setup.fairness.maxHomeAwayStreak,
            maxDivisionalStreak: 4,
            preventImmediateRematches: setup.fairness.preventImmediateRematches,
            byeWeekPlacement: "anywhere",
            relaxStreaks: false,
            prioritizeOpeningWeekTopFive: setup.fairness.prioritizeOpeningWeek,
            prioritizeFinalWeekTopFive: true,
            prioritizeThanksgivingWindow: setup.fairness.prioritizeThanksgiving,
            thanksgivingWeek: getNflWeeks(setup.seasonYear, setup.weeks).find((week)=>week.holidays.includes("Thanksgiving"))?.week ?? null,
            regularSeasonFinalWeekDivisional: setup.fairness.finalWeekDivisional,
            divisionalPlacement: "end",
            seasonFlowStyle: "balanced",
            crossDivisionVariety: "max_variety",
            divisionalFinishStrength: "strong_finish"
        }
    };
}
function analyzeFairness(setup, weeks, hardPass, softScores, warnings) {
    const homeCounts = new Map(setup.teams.map((team)=>[
            team.id,
            0
        ]));
    const opponents = new Map();
    let finalWeekDivisionGames = 0;
    let finalWeekGames = 0;
    for (const week of weeks){
        for (const game of week.games){
            homeCounts.set(game.homeTeamId, (homeCounts.get(game.homeTeamId) ?? 0) + 1);
            opponents.set(game.homeTeamId, [
                ...opponents.get(game.homeTeamId) ?? [],
                game.awayTeamId
            ]);
            opponents.set(game.awayTeamId, [
                ...opponents.get(game.awayTeamId) ?? [],
                game.homeTeamId
            ]);
            if (week.weekNumber === setup.weeks) {
                finalWeekGames += 1;
                if (game.matchupType === "division") finalWeekDivisionGames += 1;
            }
        }
    }
    const values = [
        ...homeCounts.values()
    ];
    const homeAwaySpread = Math.max(...values) - Math.min(...values);
    let immediateRematches = 0;
    for (const teamOpponents of opponents.values()){
        for(let index = 1; index < teamOpponents.length; index += 1){
            if (teamOpponents[index] === teamOpponents[index - 1]) immediateRematches += 1;
        }
    }
    immediateRematches /= 2;
    const weight = softScores.reduce((sum, item)=>sum + item.weight, 0);
    const weightedScore = softScores.reduce((sum, item)=>sum + item.score * item.weight, 0);
    const score = Math.round((weight ? weightedScore / weight : 0.85) * 100);
    return {
        hardPass,
        score,
        homeAwaySpread,
        immediateRematches,
        divisionalFinishShare: finalWeekGames ? finalWeekDivisionGames / finalWeekGames : 0,
        notes: warnings.length ? warnings : [
            "Every team plays once per week.",
            "Home and away totals are balanced.",
            "Repeat opponents are spaced apart."
        ]
    };
}
function generateLeagueSchedule(setup, seed = crypto.randomUUID()) {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$engine$2f$v3$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["runEngine"])(buildEngineInput(setup), {
        seed,
        maxAttempts: 60,
        timeBudgetMs: 25_000
    });
    const teamById = new Map(setup.teams.map((team)=>[
            team.id,
            team
        ]));
    const openingWeekRanks = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWeekOneRankMap"])(setup);
    const preseasonRanks = new Map(setup.teams.map((team)=>[
            team.id,
            team.overallRank
        ]));
    const weeks = result.schedule.weeks.map((engineWeek)=>{
        const games = engineWeek.games.map((game, index)=>{
            const homeTeamId = game.homeTeamId ?? game.a;
            const awayTeamId = game.awayTeamId ?? game.b;
            return {
                id: `week-${engineWeek.weekNumber}-game-${index + 1}`,
                week: engineWeek.weekNumber,
                homeTeamId,
                awayTeamId,
                matchupType: game.kind === "div" ? "division" : "cross-division",
                seriesGame: game.seriesGameIndex,
                seriesLength: game.seriesLength,
                dateLabel: getWeekDateLabel(setup.seasonYear, engineWeek.weekNumber),
                stadium: teamById.get(homeTeamId)?.stadium ?? "Stadium TBD"
            };
        });
        return {
            weekNumber: engineWeek.weekNumber,
            dateLabel: getWeekDateLabel(setup.seasonYear, engineWeek.weekNumber),
            games
        };
    });
    const normalizedWeeks = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$matchups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeScheduleMatchups"])(weeks, (weekNumber)=>weekNumber === 1 ? openingWeekRanks : preseasonRanks);
    return {
        id: setup.id,
        seed: String(result.seedUsed),
        createdAt: new Date().toISOString(),
        setup,
        weeks: normalizedWeeks,
        fairness: analyzeFairness(setup, normalizedWeeks, result.hardPass, result.softReport, result.warnings),
        revision: 1
    };
}
function updateGameScore(schedule, gameId, homeScore, awayScore) {
    const frozenSchedule = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$standings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["freezeCompletedRankHistory"])(schedule);
    const updatedSchedule = {
        ...frozenSchedule,
        weeks: frozenSchedule.weeks.map((week)=>({
                ...week,
                games: week.games.map((game)=>game.id === gameId ? {
                        ...game,
                        homeScore,
                        awayScore
                    } : game)
            }))
    };
    return updatedSchedule;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/revealStats.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "divisionSeriesGaps",
    ()=>divisionSeriesGaps,
    "opponentsByWeek",
    ()=>opponentsByWeek,
    "strengthOfSchedule",
    ()=>strengthOfSchedule,
    "toughestGauntlet",
    ()=>toughestGauntlet
]);
function pairKey(a, b) {
    return [
        a,
        b
    ].sort((left, right)=>left.localeCompare(right)).join("~");
}
function opponentsByWeek(schedule) {
    const table = new Map();
    for (const team of schedule.setup.teams)table.set(team.id, []);
    for (const week of [
        ...schedule.weeks
    ].sort((a, b)=>a.weekNumber - b.weekNumber)){
        for (const game of week.games){
            table.get(game.homeTeamId)?.push({
                week: week.weekNumber,
                opponentId: game.awayTeamId
            });
            table.get(game.awayTeamId)?.push({
                week: week.weekNumber,
                opponentId: game.homeTeamId
            });
        }
    }
    for (const list of table.values())list.sort((a, b)=>a.week - b.week);
    return table;
}
function strengthOfSchedule(schedule) {
    const rankById = new Map(schedule.setup.teams.map((team)=>[
            team.id,
            team.overallRank
        ]));
    let hardest;
    let easiest;
    for (const [teamId, games] of opponentsByWeek(schedule)){
        if (!games.length) continue;
        const avg = games.reduce((sum, game)=>sum + (rankById.get(game.opponentId) ?? 0), 0) / games.length;
        if (!hardest || avg < hardest.avgOpponentRank) hardest = {
            teamId,
            avgOpponentRank: avg
        };
        if (!easiest || avg > easiest.avgOpponentRank) easiest = {
            teamId,
            avgOpponentRank: avg
        };
    }
    return {
        hardest,
        easiest
    };
}
function toughestGauntlet(schedule, windowSize = 4) {
    const rankById = new Map(schedule.setup.teams.map((team)=>[
            team.id,
            team.overallRank
        ]));
    let best;
    for (const [teamId, games] of opponentsByWeek(schedule)){
        const size = Math.min(windowSize, games.length);
        if (size < 2) continue;
        for(let start = 0; start + size <= games.length; start += 1){
            const slice = games.slice(start, start + size);
            // Only genuinely consecutive weeks count as one stretch.
            if (slice[size - 1].week - slice[0].week !== size - 1) continue;
            const ranks = slice.map((game)=>rankById.get(game.opponentId) ?? 0);
            const avg = ranks.reduce((sum, rank)=>sum + rank, 0) / size;
            if (!best || avg < best.avgOpponentRank) {
                best = {
                    teamId,
                    startWeek: slice[0].week,
                    endWeek: slice[size - 1].week,
                    avgOpponentRank: avg,
                    opponentRanks: ranks
                };
            }
        }
    }
    return best;
}
function divisionSeriesGaps(schedule) {
    const pairs = new Map();
    for (const week of schedule.weeks){
        for (const game of week.games){
            if (game.matchupType !== "division") continue;
            const key = pairKey(game.homeTeamId, game.awayTeamId);
            const entry = pairs.get(key) ?? {
                aId: game.homeTeamId,
                bId: game.awayTeamId,
                weeks: []
            };
            entry.weeks.push(week.weekNumber);
            pairs.set(key, entry);
        }
    }
    let longest;
    let closest;
    for (const entry of pairs.values()){
        if (entry.weeks.length < 2) continue;
        const sorted = [
            ...entry.weeks
        ].sort((a, b)=>a - b);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const record = {
            aId: entry.aId,
            bId: entry.bId,
            first,
            last,
            gap: last - first
        };
        if (!longest || record.gap > longest.gap) longest = record;
        if (!closest || record.gap < closest.gap) closest = record;
    }
    return {
        longest,
        closest
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/welcome.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WELCOMED_KEY",
    ()=>WELCOMED_KEY,
    "hasBeenWelcomed",
    ()=>hasBeenWelcomed,
    "markWelcomed",
    ()=>markWelcomed
]);
const WELCOMED_KEY = "leagueweaver:v3:welcomed";
function markWelcomed() {
    try {
        window.localStorage.setItem(WELCOMED_KEY, "1");
    } catch  {
    // Ignore storage failures; navigation still proceeds.
    }
}
function hasBeenWelcomed() {
    try {
        return window.localStorage.getItem(WELCOMED_KEY) === "1";
    } catch  {
        return false;
    }
}
}),
];

//# sourceMappingURL=_claude_worktrees_playoff-suite_lib_94d8c077._.js.map