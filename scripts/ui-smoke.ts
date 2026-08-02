import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { chromium, type Browser, type Locator } from "playwright";
import { defaultConferenceAssignment } from "../lib/conferences";
import { createConferences, createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import { GAME_DETAIL_CACHE_PREFIX, type GameDetailPlayerStat } from "../lib/gameDetail";
import { generateLeagueSchedule } from "../lib/schedule";
import type { GeneratedSchedule, LeagueSetupInput } from "../lib/types";

const port = Number(process.env.UI_SMOKE_PORT ?? 3130);
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotDir = path.join(process.cwd(), "artifacts", "screenshots");

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
  await page.close();
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
  await page.close();
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

function gameDetailSmokeSchedule(id: string): GeneratedSchedule {
  const divisions = createDivisions(2);
  const schedule = generateLeagueSchedule({
    ...createDefaultSetup(),
    id,
    name: id.includes("synced") ? "Synced Game Detail Smoke" : "Unsynced Game Detail Smoke",
    weeks: 13,
    divisions,
    teams: createTeams(10, divisions),
  }, `${id}-seed`);
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
    makeRow(game.awayTeamId, "bench-away", "Bench Player", "WR", "BUF", 18.1, undefined, true),
    makeRow(game.homeTeamId, "allen", "Josh Allen", "QB", "BUF", 31.12, 0),
    makeRow(game.homeTeamId, "laporta", "Sam LaPorta", "TE", "DET", 16.8, 1),
    makeRow(game.homeTeamId, "bench-home", "Reserve Player", "RB", "MIA", 12.7, undefined, true),
  ];
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
  await page.locator("button.matchup-box-score-trigger").first().click();
  await page.getByRole("dialog", { name: / at /i }).waitFor();
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`) });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await page.close();
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
  await page.close();
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
  await page.getByRole("button", { name: /MVT/i }).click();
  await page.getByRole("button", { name: /★/ }).waitFor();
  await expectText(page.locator(".stats-abbr-legend"), /MVT.*All-Star/s, `${name}: awards legend is present`);
  await page.screenshot({ path: path.join(screenshotDir, `ui-smoke-${name}.png`), fullPage: true });
  assert.deepEqual(pageErrors, [], `${name}: no page errors`);
  assert.deepEqual(consoleErrors, [], `${name}: no console errors`);
  await page.close();
}

async function expectText(locator: Locator, pattern: RegExp, message: string) {
  const text = await locator.textContent();
  assert.match(text ?? "", pattern, message);
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
    await screenshotPage(browser, "desktop", { width: 1440, height: 1000 });
    await screenshotPage(browser, "mobile", { width: 390, height: 844 });
    await screenshotBuilderSetup(browser, "conf-1-non-conference", createDefaultSetup());
    await screenshotBuilderSetup(browser, "conf-1-conference", conferenceSmokeSetup());
    const synced = gameDetailSmokeSchedule("ui-smoke-gdm-synced");
    const twSynced = gameDetailSmokeSchedule("ui-smoke-tw-synced");
    const stdSynced = gameDetailSmokeSchedule("ui-smoke-std-synced");
    await screenshotThisWeek(browser, "tw-1-synced-desktop", twSynced, { width: 1440, height: 1000 }, gameDetailSmokeRows(twSynced));
    await screenshotThisWeek(browser, "tw-1-unsynced-mobile", gameDetailSmokeSchedule("ui-smoke-tw-unsynced"), { width: 390, height: 844 });
    await screenshotStandingsAwards(browser, "std-1-synced-desktop", stdSynced, { width: 1440, height: 1000 }, gameDetailSmokeRows(stdSynced));
    await screenshotStandingsAwards(browser, "std-1-unsynced-mobile", gameDetailSmokeSchedule("ui-smoke-std-unsynced"), { width: 390, height: 844 });
    await screenshotGameDetail(browser, "gdm-1-synced-desktop", synced, { width: 1440, height: 1000 }, gameDetailSmokeRows(synced));
    await screenshotGameDetail(browser, "gdm-1-unsynced-mobile", gameDetailSmokeSchedule("ui-smoke-gdm-unsynced"), { width: 390, height: 844 });
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
