import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { chromium, type Browser } from "playwright";
import { defaultConferenceAssignment } from "../lib/conferences";
import { createConferences, createDefaultSetup, createDivisions, createTeams } from "../lib/defaults";
import type { LeagueSetupInput } from "../lib/types";

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
