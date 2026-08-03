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
import type { GeneratedSchedule, LeagueSetupInput } from "../lib/types";

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

async function screenshotPage(browser: Browser, name: string, viewport: { width: number; height: number }) {
  const page = await browser.newPage({ viewport });
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
  const makeRow = (teamId: string, id: string, name: string, slot: "QB" | "RB" | "WR" | "TE", nflTeam: string, points: number, starterIndex?: number, bench = false): GameDetailPlayerStat => ({
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
    slotConfidence: bench ? "bench" : "confirmed",
    isProvisional: false,
    finalLockAt: syncedAt,
    syncedAt,
    sourcePayloadHash: `ui-smoke-${id}`,
  });
  return [
    makeRow(game.awayTeamId, "mahomes", "Patrick Mahomes", "QB", "KC", 28.44, 0),
    makeRow(game.awayTeamId, "gibbs", "Jahmyr Gibbs", "RB", "DET", 22.6, 1),
    makeRow(game.awayTeamId, "bijan", "Bijan Robinson", "RB", "ATL", 19.4, 2),
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

async function screenshotGameDetail(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows?: GameDetailPlayerStat[]) {
  const page = await browser.newPage({ viewport });
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
  await page.locator("button.matchup-box-score-trigger").first().click();
  await page.getByRole("dialog", { name: / at /i }).waitFor();
  if (rows?.length) {
    const badges = page.locator(".allstar-badge");
    await badges.first().waitFor();
    assert.ok(await badges.filter({ hasText: "1" }).count(), `${name}: multi-slot All-Star badge shows a rank numeral`);
    assert.ok(await page.locator(".gdm-player-row").filter({ has: page.locator(".allstar-badge") }).count(), `${name}: at least one row has an All-Star badge`);
    assert.ok(await page.locator(".gdm-player-row").filter({ hasNot: page.locator(".allstar-badge") }).count(), `${name}: at least one row keeps the empty badge slot`);
    await badges.filter({ hasText: "1" }).first().hover();
    await expectText(page.locator(".tooltip-bubble").last(), /Week 1 All-Star .* RB1 .* 22\.60 pts/s, `${name}: All-Star tooltip includes week, slot, and points`);
  }
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`) });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotThisWeek(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows?: GameDetailPlayerStat[]) {
  const page = await browser.newPage({ viewport });
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

async function screenshotMvt(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows: GameDetailPlayerStat[]) {
  const page = await browser.newPage({ viewport });
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

  const response = await page.goto(`${baseUrl}/season/${schedule.id}?view=mvt`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: MVT route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: MVT route is reachable`);
  await page.getByRole("button", { name: /^MVT$/i }).waitFor();
  await page.getByRole("heading", { name: /Most Valuable Team/i }).waitFor();
  await expectText(page.locator(".mvt-overview"), /Power Ranking/s, `${name}: MVT overview is present`);
  for (const label of ["Positional Awards", "Achievement Awards", "Divisional / League", "Bonus Awards"]) {
    await page.getByRole("tab", { name: label }).click();
    await expectText(page.locator(".mvt-award-panel"), new RegExp(label.replace("/", "\\/")), `${name}: ${label} table is present`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await closePage(page, name);
}

async function screenshotAllStars(browser: Browser, name: string, schedule: GeneratedSchedule, viewport: { width: number; height: number }, rows: GameDetailPlayerStat[]) {
  const page = await browser.newPage({ viewport });
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

  const response = await page.goto(`${baseUrl}/season/${schedule.id}?view=all-stars`, { waitUntil: "networkidle" });
  assert.ok(response, `${name}: All-Stars route returned a response`);
  assert.ok(response.status() >= 200 && response.status() < 400, `${name}: All-Stars route is reachable`);
  await page.getByRole("button", { name: /All-Stars/i }).waitFor();
  await page.getByRole("heading", { name: /All-Star Team of the Week/i }).waitFor();
  await expectText(page.locator(".allstars-board"), /Week 2 Board/s, `${name}: latest week board is present`);
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

async function expectText(locator: Locator, pattern: RegExp, message: string) {
  const text = await locator.textContent();
  assert.match(text ?? "", pattern, message);
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
    const allStarsSynced = allStarsSmokeSchedule("ui-smoke-as-synced");
    const allStarsMobile = allStarsSmokeSchedule("ui-smoke-as-mobile");
    await runSmokeStep("tw-1-synced-desktop", () => screenshotThisWeek(browser!, "tw-1-synced-desktop", twSynced, { width: 1440, height: 1000 }, gameDetailSmokeRows(twSynced)));
    await runSmokeStep("tw-1-unsynced-mobile", () => screenshotThisWeek(browser!, "tw-1-unsynced-mobile", gameDetailSmokeSchedule("ui-smoke-tw-unsynced"), { width: 390, height: 844 }));
    await runSmokeStep("std-1-synced-desktop", () => screenshotStandingsAwards(browser!, "std-1-synced-desktop", stdSynced, { width: 1440, height: 1000 }, gameDetailSmokeRows(stdSynced)));
    await runSmokeStep("std-1-unsynced-mobile", () => screenshotStandingsAwards(browser!, "std-1-unsynced-mobile", gameDetailSmokeSchedule("ui-smoke-std-unsynced"), { width: 390, height: 844 }));
    await runSmokeStep("mvt-2-desktop", () => screenshotMvt(browser!, "mvt-2-desktop", mvtSynced, { width: 1440, height: 1000 }, gameDetailSmokeRows(mvtSynced)));
    await runSmokeStep("mvt-2-mobile", () => screenshotMvt(browser!, "mvt-2-mobile", mvtMobile, { width: 390, height: 844 }, gameDetailSmokeRows(mvtMobile)));
    await runSmokeStep("as-2-desktop", () => screenshotAllStars(browser!, "as-2-desktop", allStarsSynced, { width: 1440, height: 1000 }, allStarsSmokeRows(allStarsSynced)));
    await runSmokeStep("as-2-mobile", () => screenshotAllStars(browser!, "as-2-mobile", allStarsMobile, { width: 390, height: 844 }, allStarsSmokeRows(allStarsMobile)));
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
