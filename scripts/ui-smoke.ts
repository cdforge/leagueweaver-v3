import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { chromium, type Browser, type Locator, type Page } from "playwright";
import { defaultConferenceAssignment } from "../lib/conferences";
import { createConferences, createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import { GAME_DETAIL_CACHE_PREFIX, type GameDetailPlayerStat } from "../lib/gameDetail";
import { generateLeagueSchedule } from "../lib/schedule";
import type { GeneratedSchedule, LeagueSetupInput, PastChampion } from "../lib/types";

const port = Number(process.env.UI_SMOKE_PORT ?? 3130);
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotDir = path.join(process.cwd(), "artifacts", "screenshots");

async function closePage(page: Page, name: string) {
  let timer: NodeJS.Timeout | undefined;
  await Promise.race([
    page.close().finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        console.warn(`UI smoke warning: timed out closing ${name}`);
        resolve();
      }, 2_000);
    }),
  ]);
}

function waitForServer(url: string, timeoutMs = 45_000) {
  const startedAt = Date.now();

  return new Promise<void>((resolve, reject) => {
    const poll = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      request.on("error", retry);
      request.setTimeout(2_500, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(poll, 500);
    };

    poll();
  });
}

async function stubExternalFrames(page: Page) {
  await page.route("https://www.google.com/**", (route) => route.fulfill({ status: 204, body: "" }));
  await page.route("https://*.googlesyndication.com/**", (route) => route.fulfill({ status: 204, body: "" }));
}

async function screenshotPage(browser: Browser, name: string, viewport: { width: number; height: number }) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: page returned a response`);
  assert.ok((response.status() >= 200 && response.status() < 400) || response.status() === 404, `${name}: route is reachable or cleanly absent`);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotBuilderSetup(browser: Browser, name: string, setup: LeagueSetupInput) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.addInitScript((draftSetup) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:setup", JSON.stringify(draftSetup));
  }, setup);

  const response = await page.goto(`${baseUrl}/build`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: builder returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: builder route is reachable`);
  await page.getByRole("button", { name: /start manually/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();
  await page.getByRole("heading", { name: "Build the divisions." }).waitFor();
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

function conferenceSmokeSetup(): LeagueSetupInput {
  const conferences = createConferences(2);
  const divisions = defaultConferenceAssignment(createDivisions(4), conferences);
  return {
    ...createDefaultSetup(),
    id: "ui-smoke-conference",
    name: "Conference Smoke League",
    divisions,
    conferences,
    teams: createTeams(16, divisions),
  };
}

function conferenceAwardsSmokeSchedule(id: string): GeneratedSchedule {
  const conferences = createConferences(2);
  const divisions = defaultConferenceAssignment(createDivisions(4), conferences);
  const schedule = generateLeagueSchedule({
    ...createDefaultSetup(),
    id,
    name: "Conference Awards Smoke",
    weeks: 13,
    divisions,
    conferences,
    teams: createTeams(16, divisions),
  }, `${id}-seed`);
  for (const [index, game] of (schedule.weeks[0]?.games ?? []).entries()) {
    game.awayScore = 126 + index * 2;
    game.homeScore = 114 + index;
  }
  return schedule;
}

let gameDetailSmokeBase: GeneratedSchedule | undefined;

function cloneSchedule(schedule: GeneratedSchedule): GeneratedSchedule {
  return structuredClone(schedule);
}

function gameDetailSmokeSchedule(id: string): GeneratedSchedule {
  if (!gameDetailSmokeBase) {
    const divisions = createDivisions(2);
    gameDetailSmokeBase = generateLeagueSchedule({
      ...createDefaultSetup(),
      id: "ui-smoke-gdm-base",
      name: "Game Detail Smoke Base",
      weeks: 13,
      divisions,
      teams: createTeams(10, divisions),
    }, "ui-smoke-gdm-base-seed");
  }
  const schedule = cloneSchedule(gameDetailSmokeBase);
  schedule.id = id;
  schedule.setup.id = id;
  schedule.setup.name = id.includes("synced") ? "Synced Game Detail Smoke" : "Unsynced Game Detail Smoke";
  const game = schedule.weeks[0].games[0];
  game.awayScore = 129.24;
  game.homeScore = 118.76;
  return schedule;
}

function gameDetailSmokeRows(schedule: GeneratedSchedule): GameDetailPlayerStat[] {
  const game = schedule.weeks[0].games[0];
  const syncedAt = "2026-08-02T12:00:00.000Z";
  const makeRow = (teamId: string, id: string, name: string, slot: "QB" | "RB" | "WR" | "TE", nflTeam: string, points: number, starterIndex?: number, bench = false, flags?: { slotConfidence?: GameDetailPlayerStat["slotConfidence"]; isProvisional?: boolean }): GameDetailPlayerStat => ({
    scheduleId: schedule.id,
    provider: "sleeper",
    providerLeagueId: "gdm-ui-smoke",
    season: schedule.setup.seasonYear,
    week: game.week,
    teamId,
    providerRosterId: teamId,
    providerPlayerId: id,
    canonicalPlayerId: `sleeper:${id}`,
    displayName: name,
    position: slot,
    nflTeam,
    points,
    lineupStatus: bench ? "bench" : "starter",
    starterIndex,
    inferredSlot: slot,
    rawSlot: bench ? "BN" : slot,
    slotConfidence: flags?.slotConfidence ?? (bench ? "bench" : "confirmed"),
    isProvisional: flags?.isProvisional ?? false,
    finalLockAt: syncedAt,
    syncedAt,
    sourcePayloadHash: `ui-smoke-${id}`,
  });
  return [
    makeRow(game.awayTeamId, "mahomes", "Patrick Mahomes", "QB", "KC", 28.44, 0),
    makeRow(game.awayTeamId, "gibbs", "Jahmyr Gibbs", "RB", "DET", 22.6, 1),
    makeRow(game.awayTeamId, "bijan", "Bijan Robinson", "RB", "ATL", 19.4, 2, false, { slotConfidence: "inferred", isProvisional: true }),
    makeRow(game.awayTeamId, "bench-away", "Bench Player", "WR", "BUF", 18.1, undefined, true),
    makeRow(game.homeTeamId, "allen", "Josh Allen", "QB", "BUF", 31.12, 0),
    makeRow(game.homeTeamId, "achane", "De'Von Achane", "RB", "MIA", 16.8, 1),
    makeRow(game.homeTeamId, "hall", "Breece Hall", "RB", "NYJ", 15.9, 2),
    makeRow(game.homeTeamId, "bench-home", "Reserve Player", "RB", "MIA", 12.7, undefined, true),
  ];
}

function allStarsSmokeSchedule(id: string): GeneratedSchedule {
  const schedule = gameDetailSmokeSchedule(id);
  for (const [index, game] of [...(schedule.weeks[0]?.games ?? []), ...(schedule.weeks[1]?.games ?? [])].entries()) {
    const gameNumber = game.gameNumber ?? index + 1;
    game.awayScore = 112.4 + gameNumber;
    game.homeScore = 104.2 + gameNumber;
  }
  return schedule;
}

function allStarsSmokeRows(schedule: GeneratedSchedule): GameDetailPlayerStat[] {
  const rows = [...gameDetailSmokeRows(schedule)];
  const weekTwoGame = schedule.weeks[1]?.games[0];
  if (!weekTwoGame) return rows;
  const syncedAt = "2026-08-02T12:00:00.000Z";
  const makeRow = (teamId: string, id: string, name: string, slot: "QB" | "RB" | "WR" | "TE", nflTeam: string, points: number, starterIndex?: number): GameDetailPlayerStat => ({
    scheduleId: schedule.id,
    provider: "sleeper",
    providerLeagueId: "as-ui-smoke",
    season: schedule.setup.seasonYear,
    week: weekTwoGame.week,
    teamId,
    providerRosterId: teamId,
    providerPlayerId: id,
    canonicalPlayerId: `sleeper:${id}`,
    displayName: name,
    position: slot,
    nflTeam,
    points,
    lineupStatus: "starter",
    starterIndex,
    inferredSlot: slot,
    rawSlot: slot,
    slotConfidence: "confirmed",
    isProvisional: false,
    finalLockAt: syncedAt,
    syncedAt,
    sourcePayloadHash: `ui-smoke-${id}`,
  });
  rows.push(
    makeRow(weekTwoGame.awayTeamId, "jackson", "Lamar Jackson", "QB", "BAL", 34.1, 0),
    makeRow(weekTwoGame.awayTeamId, "bijan", "Bijan Robinson", "RB", "ATL", 24.2, 1),
    makeRow(weekTwoGame.homeTeamId, "hurts", "Jalen Hurts", "QB", "PHI", 30.5, 0),
    makeRow(weekTwoGame.homeTeamId, "amonra", "Amon-Ra St. Brown", "WR", "DET", 27.4, 1),
  );
  return rows;
}

function pastChampionSmokeData(): PastChampion[] {
  return [
    { season: 2025, provider: "sleeper", providerLeagueId: "history-smoke-2025", leagueName: "History Smoke", teamName: "Harbor Kings", managerName: "Avery", wins: 13, losses: 1, pointsFor: 2144.42 },
    { season: 2024, provider: "sleeper", providerLeagueId: "history-smoke-2024", leagueName: "History Smoke", teamName: "Lake Union", managerName: "Jordan", wins: 12, losses: 2, ties: 1, pointsFor: 2076.18 },
  ];
}

function historyBrowserSmokeData(schedule: GeneratedSchedule) {
  const leagueId = "history-smoke-2025";
  const historyTeams = schedule.setup.teams.map((team, index) => ({
    leagueTeamId: `sleeper-${leagueId}-${index + 1}`,
    providerRosterOrTeamId: String(index + 1),
    teamName: `${team.city ? `${team.city} ` : ""}${team.name}`.trim(),
    managerName: team.manager,
    finalStanding: index + 1,
    wins: Math.max(0, 12 - index),
    losses: Math.min(14, index + 2),
    pointsFor: 1800 - index * 22,
  }));
  const games = schedule.weeks.slice(0, 2).flatMap((week) => week.games.map((game, index) => {
    const homeIndex = schedule.setup.teams.findIndex((team) => team.id === game.homeTeamId);
    const awayIndex = schedule.setup.teams.findIndex((team) => team.id === game.awayTeamId);
    return {
      week: week.weekNumber,
      providerMatchupId: `sleeper:${leagueId}:week-${week.weekNumber}:matchup-${index + 1}`,
      homeLeagueTeamId: `sleeper-${leagueId}-${homeIndex + 1}`,
      awayLeagueTeamId: `sleeper-${leagueId}-${awayIndex + 1}`,
      homeScore: 116.5 + index,
      awayScore: 124.2 + index,
      status: "final",
      finalLockAt: "2025-12-30T12:00:00.000Z",
    };
  }));
  const playerRows = games.flatMap((game, index) => [
    { week: game.week, canonicalPlayerId: `hist-qb-away-${index}`, leagueTeamId: game.awayLeagueTeamId, providerPlayerId: `hist-qb-away-${index}`, playerName: "History Away QB", position: "QB", nflTeam: "KC", lineupStatus: "starter", lineupSlot: "QB", fantasyPoints: 27.4 + index },
    { week: game.week, canonicalPlayerId: `hist-rb-away-${index}`, leagueTeamId: game.awayLeagueTeamId, providerPlayerId: `hist-rb-away-${index}`, playerName: "History Away RB", position: "RB", nflTeam: "DET", lineupStatus: "starter", lineupSlot: "RB", fantasyPoints: 21.2 + index },
    { week: game.week, canonicalPlayerId: `hist-qb-home-${index}`, leagueTeamId: game.homeLeagueTeamId, providerPlayerId: `hist-qb-home-${index}`, playerName: "History Home QB", position: "QB", nflTeam: "BUF", lineupStatus: "starter", lineupSlot: "QB", fantasyPoints: 31.1 + index },
    { week: game.week, canonicalPlayerId: `hist-rb-home-${index}`, leagueTeamId: game.homeLeagueTeamId, providerPlayerId: `hist-rb-home-${index}`, playerName: "History Home RB", position: "RB", nflTeam: "MIA", lineupStatus: "starter", lineupSlot: "RB", fantasyPoints: 18.9 + index },
  ]);
  return [{ id: "history-season-smoke-2025", season: 2025, provider: "sleeper", providerLeagueId: leagueId, leagueName: "History Smoke", teamCount: historyTeams.length, teams: historyTeams, games, playerRows }];
}

function recapSmokeSchedule(id: string, finalWeek: boolean): GeneratedSchedule {
  const schedule = gameDetailSmokeSchedule(id);
  const week = schedule.weeks[0];
  if (!week || !finalWeek) return schedule;
  for (const [index, game] of week.games.entries()) {
    const away = schedule.setup.teams.find((team) => team.id === game.awayTeamId);
    const home = schedule.setup.teams.find((team) => team.id === game.homeTeamId);
    const awayIsLowerSeed = (away?.overallRank ?? 0) > (home?.overallRank ?? 0);
    const forceUpset = index === 1;
    const awayWins = forceUpset ? awayIsLowerSeed : index % 2 === 0;
    const margin = index === 0 ? 48.2 : forceUpset ? 8.6 : 14.4 + index;
    const low = 96.4 + index * 3;
    if (awayWins) {
      game.awayScore = Math.round((low + margin) * 100) / 100;
      game.homeScore = low;
    } else {
      game.homeScore = Math.round((low + margin) * 100) / 100;
      game.awayScore = low;
    }
  }
  return schedule;
}

function recapSmokeRows(schedule: GeneratedSchedule): GameDetailPlayerStat[] {
  const week = schedule.weeks[0];
  if (!week) return [];
  const syncedAt = "2026-08-02T12:00:00.000Z";
  const makeRow = (gameIndex: number, teamId: string, side: "away" | "home", slot: "QB" | "RB", points: number, starterIndex: number): GameDetailPlayerStat => {
    const id = `${gameIndex}-${side}-${slot.toLowerCase()}-${starterIndex}`;
    return {
      scheduleId: schedule.id,
      provider: "sleeper",
      providerLeagueId: "rw-ui-smoke",
      season: schedule.setup.seasonYear,
      week: week.weekNumber,
      teamId,
      providerRosterId: teamId,
      providerPlayerId: id,
      canonicalPlayerId: `sleeper:${id}`,
      displayName: `${side === "away" ? "Away" : "Home"} ${slot} ${gameIndex + 1}${starterIndex + 1}`,
      position: slot,
      nflTeam: slot === "QB" ? "KC" : "DET",
      points,
      lineupStatus: "starter",
      starterIndex,
      inferredSlot: slot,
      rawSlot: slot,
      slotConfidence: "confirmed",
      isProvisional: false,
      finalLockAt: syncedAt,
      syncedAt,
      sourcePayloadHash: `ui-smoke-${id}`,
    };
  };
  return week.games.flatMap((game, index) => [
    makeRow(index, game.awayTeamId, "away", "QB", 26 + index, 0),
    makeRow(index, game.awayTeamId, "away", "RB", 18 + index, 1),
    makeRow(index, game.homeTeamId, "home", "QB", index === 0 ? 36.4 : 22 + index, 0),
    makeRow(index, game.homeTeamId, "home", "RB", index === 0 ? 31.2 : 16 + index, 1),
  ]);
}

async function screenshotGameDetail(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows?: GameDetailPlayerStat[]) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.addInitScript(({ seededSchedule, seededRows, cachePrefix }) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:seasons", JSON.stringify({ [seededSchedule.id]: { schedule: seededSchedule, savedAt: Date.now() } }));
    if (seededRows) window.localStorage.setItem(`${cachePrefix}${seededSchedule.id}`, JSON.stringify({ rows: seededRows }));
  }, { seededSchedule: schedule, seededRows: rows, cachePrefix: GAME_DETAIL_CACHE_PREFIX });

  const response = await page.goto(`${baseUrl}/season/${schedule.id}`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: season route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: season route is reachable`);
  await page.locator(".workspace-rail nav").getByRole("button", { name: /league schedule/i }).click();
  assert.equal(await page.locator("button.matchup-box-score-trigger").count(), 0, `${name}: no redundant Box score button is rendered`);
  const firstCard = page.locator(".matchup-card.is-openable").first();
  await firstCard.locator("a.team-identity-block").first().click();
  await page.waitForURL(new RegExp(`/season/${schedule.id}/team/`));
  const teamScheduleUrl = page.url();
  if (viewport.width <= 560) {
    const teamCard = page.locator(".team-schedule-cards .matchup-card.is-openable").first();
    await teamCard.locator("a.team-identity-block").first().click();
    await page.waitForURL(new RegExp(`/season/${schedule.id}/team/`));
    await page.goto(teamScheduleUrl, { waitUntil: "networkidle" });
    await page.locator(".team-schedule-cards .matchup-card.is-openable").first().locator(".matchup-card-badges").click();
  } else {
    await page.locator(".team-schedule-table tbody tr.is-openable").first().locator("a.team-identity-block").click();
    await page.waitForURL(new RegExp(`/season/${schedule.id}/team/`));
    await page.goto(teamScheduleUrl, { waitUntil: "networkidle" });
    await page.locator(".team-schedule-table tbody tr.is-openable").first().locator(".col-score").click();
  }
  await page.getByRole("dialog", { name: / at /i }).waitFor();
  await page.getByRole("button", { name: /close game detail/i }).click();
  await page.goto(`${baseUrl}/season/${schedule.id}`, { waitUntil: "networkidle" });
  await page.locator(".workspace-rail nav").getByRole("button", { name: /league schedule/i }).click();
  await page.locator(".matchup-card.is-openable").first().locator(".matchup-card-badges").click();
  await page.getByRole("dialog", { name: / at /i }).waitFor();
  if (rows?.length) {
    const badges = page.locator(".allstar-badge");
    await badges.first().waitFor();
    assert.ok(await badges.filter({ hasText: "1" }).count(), `${name}: multi-slot All-Star badge shows a rank numeral`);
    assert.ok(await page.locator(".gdm-player-row").filter({ has: page.locator(".allstar-badge") }).count(), `${name}: at least one row has an All-Star badge`);
    assert.ok(await page.locator(".gdm-player-row").filter({ hasNot: page.locator(".allstar-badge") }).count(), `${name}: at least one row keeps the empty badge slot`);
    await expectText(page.locator(".gdm-row-flags"), /Provisional.*Inferred slot/s, `${name}: provisional and inferred labels are visible`);
    await badges.filter({ hasText: "1" }).first().hover();
    await expectText(page.locator(".tooltip-bubble").last(), /Week 1 All-Star .* RB1 .* 22\.60 pts/s, `${name}: All-Star tooltip includes week, slot, and points`);
  }
  const initialTitle = await page.locator("#game-detail-title").innerText();
  const nextGame = page.getByRole("button", { name: /Next game:/i }).first();
  if (await nextGame.isEnabled()) {
    await nextGame.click();
    await page.waitForFunction((title) => document.querySelector("#game-detail-title")?.textContent !== title, initialTitle);
  }
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`) });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotWeekRecap(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows: GameDetailPlayerStat[], expectRecap: boolean) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.addInitScript(({ seededSchedule, seededRows, cachePrefix }) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:seasons", JSON.stringify({ [seededSchedule.id]: { schedule: seededSchedule, savedAt: Date.now() } }));
    window.localStorage.setItem(`${cachePrefix}${seededSchedule.id}`, JSON.stringify({ rows: seededRows }));
  }, { seededSchedule: schedule, seededRows: rows, cachePrefix: GAME_DETAIL_CACHE_PREFIX });

  const response = await page.goto(`${baseUrl}/season/${schedule.id}`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: season route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: season route is reachable`);

  if (!expectRecap) {
    await assertHidden(page.getByRole("button", { name: /^results$/i }), `${name}: Results nav is hidden before the week is final`);
    await assertHidden(page.getByRole("button", { name: /week recap/i }), `${name}: This Week recap prompt is hidden before the week is final`);
    await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
    assert.deepEqual(pageErrors, [], `${name}: no page errors`);
    assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
    await closePage(page, name);
    return;
  }

  await page.getByRole("button", { name: /^results$/i }).waitFor();
  await page.getByRole("button", { name: /week recap/i }).click();
  await page.getByRole("heading", { name: /Weekly Results Recap/i }).waitFor();
  await expectText(page.locator(".recap-head"), /Week 1 Final/s, `${name}: final week header appears`);
  await expectText(page.locator(".recap-hero"), /Match of the Week Result.*MVP.*All-Star-of-the-Week/s, `${name}: MOTW hero has MVP and All-Star markers`);
  await expectText(page.locator(".recap-matchup-list"), /BLOWOUT/s, `${name}: blowout badge appears`);
  await expectText(page.locator(".recap-matchup-list"), /Upset/s, `${name}: upset badge appears`);
  await expectText(page.locator(".recap-card").first(), /beat .* by .* (behind|despite)/s, `${name}: recap sentence is data-driven`);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  await page.locator(".recap-card").first().click();
  await page.getByRole("dialog", { name: / at /i }).waitFor();
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotThisWeek(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows?: GameDetailPlayerStat[]) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.addInitScript(({ seededSchedule, seededRows, cachePrefix }) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:seasons", JSON.stringify({ [seededSchedule.id]: { schedule: seededSchedule, savedAt: Date.now() } }));
    if (seededRows) window.localStorage.setItem(`${cachePrefix}${seededSchedule.id}`, JSON.stringify({ rows: seededRows }));
  }, { seededSchedule: schedule, seededRows: rows, cachePrefix: GAME_DETAIL_CACHE_PREFIX });

  const response = await page.goto(`${baseUrl}/season/${schedule.id}`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: season route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: season route is reachable`);
  await page.locator("h1", { hasText: "This Week" }).waitFor();
  await expectText(page.locator(".workspace-rail nav button").first(), /This Week/i, `${name}: This Week is first in nav`);
  await page.locator(".tw-hero").click();
  await page.getByRole("dialog", { name: / at /i }).waitFor();
  await page.getByRole("button", { name: /close game detail/i }).click();
  await page.locator("h1", { hasText: "This Week" }).waitFor();
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotStandingsAwards(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows?: GameDetailPlayerStat[]) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.addInitScript(({ seededSchedule, seededRows, cachePrefix }) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:seasons", JSON.stringify({ [seededSchedule.id]: { schedule: seededSchedule, savedAt: Date.now() } }));
    if (seededRows) window.localStorage.setItem(`${cachePrefix}${seededSchedule.id}`, JSON.stringify({ rows: seededRows }));
  }, { seededSchedule: schedule, seededRows: rows, cachePrefix: GAME_DETAIL_CACHE_PREFIX });

  const response = await page.goto(`${baseUrl}/season/${schedule.id}?view=standings`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: standings route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: standings route is reachable`);
  await page.locator("#stats-panel-standings").getByRole("button", { name: /^MVT$/i }).click();
  await page.getByRole("button", { name: /★/ }).waitFor();
  await expectText(page.locator(".stats-abbr-legend"), /MVT.*All-Star/s, `${name}: awards legend is present`);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotMvt(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows: GameDetailPlayerStat[], champions?: PastChampion[]) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  if (champions) {
    const history = historyBrowserSmokeData(schedule);
    await page.route("**/api/platform/history?**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: [], champions, history }) }));
    await page.route("**/api/publish?**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ published: false }) }));
    await page.route("**/api/seasons/*/player-stats", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ rows }) }));
  }

  await page.addInitScript(({ seededSchedule, seededRows, cachePrefix }) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:seasons", JSON.stringify({ [seededSchedule.id]: { schedule: seededSchedule, savedAt: Date.now() } }));
    window.localStorage.setItem(`${cachePrefix}${seededSchedule.id}`, JSON.stringify({ rows: seededRows }));
  }, { seededSchedule: schedule, seededRows: rows, cachePrefix: GAME_DETAIL_CACHE_PREFIX });

  const response = await page.goto(`${baseUrl}/season/${schedule.id}?view=mvt`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: MVT route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: MVT route is reachable`);
  await page.getByRole("button", { name: /^MVT$/i }).waitFor();
  await page.getByRole("heading", { name: /Most Valuable Team/i }).waitFor();
  await expectText(page.locator(".mvt-overview"), /Power Ranking/s, `${name}: MVT overview is present`);
  if (champions) await expectText(page.locator(".past-champions-strip"), /Past Champions.*2025.*Harbor Kings/s, `${name}: past champions strip is present`);
  if (champions) {
    await page.getByLabel(/Select MVT season/i).click();
    await page.getByRole("option", { name: /2025/ }).click();
    await expectText(page.locator(".mvt-hero"), /2025/s, `${name}: MVT switches to historical season`);
  }
  for (const label of ["Positional Awards", "Achievement Awards", "Divisional / League", "Bonus Awards"]) {
    await page.getByRole("tab", { name: label }).click();
    if (label === "Divisional / League") {
      await expectText(page.locator(".mvt-award-groups"), /League Awards.*Division Awards/s, `${name}: ${label} grouped tables are present`);
    } else {
      await expectText(page.locator(".mvt-award-panel"), new RegExp(label.replace("/", "\\/")), `${name}: ${label} table is present`);
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  if (champions) {
    await page.locator(".workspace-rail nav").getByRole("button", { name: /league schedule/i }).click();
    await page.locator(".matchup-card.is-openable").first().locator("a.team-identity-block").first().click();
    await page.waitForURL(new RegExp(`/season/${schedule.id}/team/`));
    assert.ok(!page.url().includes("-history-"), `${name}: historical schedule team links use the real season route`);
  }
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotConferenceAwards(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows: GameDetailPlayerStat[], expectConference: boolean) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.addInitScript(({ seededSchedule, seededRows, cachePrefix }) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:seasons", JSON.stringify({ [seededSchedule.id]: { schedule: seededSchedule, savedAt: Date.now() } }));
    window.localStorage.setItem(`${cachePrefix}${seededSchedule.id}`, JSON.stringify({ rows: seededRows }));
  }, { seededSchedule: schedule, seededRows: rows, cachePrefix: GAME_DETAIL_CACHE_PREFIX });

  const mvtResponse = await page.goto(`${baseUrl}/season/${schedule.id}?view=mvt`, { waitUntil: "networkidle" });
  assert.ok(mvtResponse, `${name}: MVT route returned a response`);
  assert.ok(mvtResponse.status() >= 200 && mvtResponse.status() < 400, `${name}: MVT route is reachable`);
  if (expectConference) {
    await page.getByRole("tab", { name: "Divisional / League" }).click();
    await expectText(page.locator(".conference-award-group"), /Conference Awards.*\+1\.50/s, `${name}: conference tier is grouped in division/league awards`);
    await page.getByRole("tab", { name: "Conference Awards" }).click();
    await expectText(page.locator(".mvt-award-panel"), /Conference Awards/s, `${name}: conference awards sub-view is present`);
  } else {
    await assertHidden(page.getByRole("tab", { name: "Conference Awards" }), `${name}: conference awards tab is hidden for non-conference leagues`);
    await page.getByRole("tab", { name: "Divisional / League" }).click();
    await assertHidden(page.locator(".conference-award-group"), `${name}: conference awards group is hidden for non-conference leagues`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });

  const standingsResponse = await page.goto(`${baseUrl}/season/${schedule.id}?view=standings`, { waitUntil: "networkidle" });
  assert.ok(standingsResponse, `${name}: standings route returned a response`);
  assert.ok(standingsResponse.status() >= 200 && standingsResponse.status() < 400, `${name}: standings route is reachable`);
  if (expectConference) {
    await page.locator(".standings-conference-chip").first().waitFor();
    await expectText(page.locator(".standings-division-cell").first(), /Conference/i, `${name}: standings rows show conference marks`);
  } else {
    await assertHidden(page.locator(".standings-conference-chip"), `${name}: standings conference marks are hidden for non-conference leagues`);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}-standings.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotAllStars(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows: GameDetailPlayerStat[], champions?: PastChampion[]) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  if (champions) {
    const history = historyBrowserSmokeData(schedule);
    await page.route("**/api/platform/history?**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: [], champions, history }) }));
    await page.route("**/api/publish?**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ published: false }) }));
    await page.route("**/api/seasons/*/player-stats", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ rows }) }));
  }

  await page.addInitScript(({ seededSchedule, seededRows, cachePrefix }) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:seasons", JSON.stringify({ [seededSchedule.id]: { schedule: seededSchedule, savedAt: Date.now() } }));
    window.localStorage.setItem(`${cachePrefix}${seededSchedule.id}`, JSON.stringify({ rows: seededRows }));
  }, { seededSchedule: schedule, seededRows: rows, cachePrefix: GAME_DETAIL_CACHE_PREFIX });

  const response = await page.goto(`${baseUrl}/season/${schedule.id}?view=all-stars`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: All-Stars route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: All-Stars route is reachable`);
  await page.locator(".workspace-rail nav").getByRole("button", { name: /^All-Stars$/i }).waitFor();
  await page.getByRole("heading", { name: /All-Star Team of the Week/i }).waitFor();
  await expectText(page.locator(".allstars-board"), /Week 2 Board/s, `${name}: latest week board is present`);
  if (champions) await expectText(page.locator(".past-champions-strip"), /Past Champions.*2025.*Harbor Kings/s, `${name}: past champions strip is present`);
  if (champions) {
    await page.getByLabel(/Select All-Stars season/i).click();
    await page.getByRole("option", { name: /2025/ }).click();
    await expectText(page.locator(".allstars-hero"), /2025/s, `${name}: All-Stars switches to historical season`);
  }
  await expectText(page.locator(".allstars-rail"), /All-Stars by Team/s, `${name}: team count rail is present`);
  await expectText(page.locator(".allstar-trend"), /Weekly Total Trend/s, `${name}: trend is present`);
  await page.getByRole("button", { name: /Previous All-Star week/i }).click();
  await expectText(page.locator(".allstars-board"), /Week 1 Board/s, `${name}: week switcher changes board`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotAwardEmptyState(browser: Browser, name: string, schedule: GeneratedSchedule, view: "mvt" | "all-stars", viewport: { width: number; height: number }) {
  const page = await browser.newPage({ viewport });
  await stubExternalFrames(page);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.addInitScript((seededSchedule) => {
    window.localStorage.setItem("leagueweaver:v3:welcomed", "1");
    window.localStorage.setItem("leagueweaver:v3:seasons", JSON.stringify({ [seededSchedule.id]: { schedule: seededSchedule, savedAt: Date.now() } }));
  }, schedule);

  const response = await page.goto(`${baseUrl}/season/${schedule.id}?view=${view}`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: ${view} route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: ${view} route is reachable`);
  await expectText(page.locator(view === "mvt" ? ".mvt-empty-panel" : ".allstars-empty-panel"), /Connect a public ESPN\/Sleeper league/s, `${name}: public ESPN/Sleeper empty state is present`);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function expectText(locator: Locator, pattern: RegExp, message: string) {
  const text = await locator.textContent();
  assert.match(text ?? "", pattern, message);
}

async function assertHidden(locator: Locator, message: string) {
  assert.equal(await locator.count(), 0, message);
}

async function runSmokeStep(name: string, step: () => Promise<void>) {
  console.log(`UI smoke step: ${name}`);
  await step();
}

async function stopServer(server: ChildProcessWithoutNullStreams) {
  if (server.killed) return;
  server.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 2_000);
    server.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function main() {
  mkdirSync(screenshotDir, { recursive: true });
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "dev", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: "pipe",
  });

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));

  let browser: Browser | undefined;
  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch();
    await runSmokeStep("desktop", () => screenshotPage(browser!, "desktop", { width: 1440, height: 1000 }));
    await runSmokeStep("mobile", () => screenshotPage(browser!, "mobile", { width: 390, height: 844 }));
    await runSmokeStep("conf-1-non-conference", () => screenshotBuilderSetup(browser!, "conf-1-non-conference", createDefaultSetup()));
    await runSmokeStep("conf-1-conference", () => screenshotBuilderSetup(browser!, "conf-1-conference", conferenceSmokeSetup()));
    const synced = gameDetailSmokeSchedule("ui-smoke-gdm-synced");
    const twSynced = gameDetailSmokeSchedule("ui-smoke-tw-synced");
    const stdSynced = gameDetailSmokeSchedule("ui-smoke-std-synced");
    const mvtSynced = gameDetailSmokeSchedule("ui-smoke-mvt-synced");
    const mvtMobile = gameDetailSmokeSchedule("ui-smoke-mvt-mobile");
    const mvtHistory = gameDetailSmokeSchedule("11111111-1111-4111-8111-111111111111");
    const allStarsSynced = allStarsSmokeSchedule("ui-smoke-as-synced");
    const allStarsMobile = allStarsSmokeSchedule("ui-smoke-as-mobile");
    const allStarsHistory = allStarsSmokeSchedule("22222222-2222-4222-8222-222222222222");
    const recapFinal = recapSmokeSchedule("ui-smoke-rw-final", true);
    const recapNonFinal = recapSmokeSchedule("ui-smoke-rw-non-final", false);
    const confAwards = conferenceAwardsSmokeSchedule("ui-smoke-conf-2-conference");
    const nonConfAwards = gameDetailSmokeSchedule("ui-smoke-conf-2-non-conference");
    const emptyAwards = gameDetailSmokeSchedule("ui-smoke-ui-empty-awards");
    await runSmokeStep("tw-1-synced-desktop", () => screenshotThisWeek(browser!, "tw-1-synced-desktop", twSynced, { width: 1440, height: 1000 }, gameDetailSmokeRows(twSynced)));
    await runSmokeStep("tw-1-unsynced-mobile", () => screenshotThisWeek(browser!, "tw-1-unsynced-mobile", gameDetailSmokeSchedule("ui-smoke-tw-unsynced"), { width: 390, height: 844 }));
    await runSmokeStep("std-1-synced-desktop", () => screenshotStandingsAwards(browser!, "std-1-synced-desktop", stdSynced, { width: 1440, height: 1000 }, gameDetailSmokeRows(stdSynced)));
    await runSmokeStep("std-1-unsynced-mobile", () => screenshotStandingsAwards(browser!, "std-1-unsynced-mobile", gameDetailSmokeSchedule("ui-smoke-std-unsynced"), { width: 390, height: 844 }));
    await runSmokeStep("mvt-2-desktop", () => screenshotMvt(browser!, "mvt-2-desktop", mvtSynced, { width: 1440, height: 1000 }, gameDetailSmokeRows(mvtSynced)));
    await runSmokeStep("mvt-2-mobile", () => screenshotMvt(browser!, "mvt-2-mobile", mvtMobile, { width: 390, height: 844 }, gameDetailSmokeRows(mvtMobile)));
    await runSmokeStep("dep-4-mvt-history-desktop", () => screenshotMvt(browser!, "dep-4-mvt-history-desktop", mvtHistory, { width: 1440, height: 1000 }, gameDetailSmokeRows(mvtHistory), pastChampionSmokeData()));
    await runSmokeStep("as-2-desktop", () => screenshotAllStars(browser!, "as-2-desktop", allStarsSynced, { width: 1440, height: 1000 }, allStarsSmokeRows(allStarsSynced)));
    await runSmokeStep("as-2-mobile", () => screenshotAllStars(browser!, "as-2-mobile", allStarsMobile, { width: 390, height: 844 }, allStarsSmokeRows(allStarsMobile)));
    await runSmokeStep("dep-4-allstars-history-mobile", () => screenshotAllStars(browser!, "dep-4-allstars-history-mobile", allStarsHistory, { width: 390, height: 844 }, allStarsSmokeRows(allStarsHistory), pastChampionSmokeData()));
    await runSmokeStep("ui-1-empty-mvt-desktop", () => screenshotAwardEmptyState(browser!, "ui-1-empty-mvt-desktop", emptyAwards, "mvt", { width: 1440, height: 1000 }));
    await runSmokeStep("ui-1-empty-allstars-mobile", () => screenshotAwardEmptyState(browser!, "ui-1-empty-allstars-mobile", emptyAwards, "all-stars", { width: 390, height: 844 }));
    await runSmokeStep("rw-1-final-desktop", () => screenshotWeekRecap(browser!, "rw-1-final-desktop", recapFinal, { width: 1440, height: 1000 }, recapSmokeRows(recapFinal), true));
    await runSmokeStep("rw-1-final-mobile", () => screenshotWeekRecap(browser!, "rw-1-final-mobile", recapFinal, { width: 390, height: 844 }, recapSmokeRows(recapFinal), true));
    await runSmokeStep("rw-1-non-final-mobile", () => screenshotWeekRecap(browser!, "rw-1-non-final-mobile", recapNonFinal, { width: 390, height: 844 }, recapSmokeRows(recapNonFinal), false));
    await runSmokeStep("conf-2-conference-desktop", () => screenshotConferenceAwards(browser!, "conf-2-conference-desktop", confAwards, { width: 1440, height: 1000 }, recapSmokeRows(confAwards), true));
    await runSmokeStep("conf-2-non-conference-mobile", () => screenshotConferenceAwards(browser!, "conf-2-non-conference-mobile", nonConfAwards, { width: 390, height: 844 }, gameDetailSmokeRows(nonConfAwards), false));
    await runSmokeStep("gdm-1-synced-desktop", () => screenshotGameDetail(browser!, "gdm-1-synced-desktop", synced, { width: 1440, height: 1000 }, gameDetailSmokeRows(synced)));
    await runSmokeStep("gdm-1-unsynced-mobile", () => screenshotGameDetail(browser!, "gdm-1-unsynced-mobile", gameDetailSmokeSchedule("ui-smoke-gdm-unsynced"), { width: 390, height: 844 }));
    console.log(`UI smoke passed: screenshots written to ${path.relative(process.cwd(), screenshotDir)}`);
  } finally {
    await browser?.close();
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
