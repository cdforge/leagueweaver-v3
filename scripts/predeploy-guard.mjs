import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const errors = [];
const warnings = [];

const deployableDirs = ["app", "components", "lib"];
const ignoredPathParts = new Set(["node_modules", ".next", ".git", "components/pickem"]);
const textExtensions = new Set([
  ".css",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
  ".json",
]);

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function isIgnored(path) {
  return [...ignoredPathParts].some((part) => path === part || path.startsWith(`${part}/`));
}

function extension(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index);
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const rel = relative(root, fullPath);
    if (isIgnored(rel)) continue;
    const stats = statSync(fullPath);
    if (stats.isDirectory()) walk(fullPath, files);
    else if (textExtensions.has(extension(entry))) files.push(fullPath);
  }
  return files;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function pathExists(path) {
  return existsSync(join(root, path));
}

function walkAll(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) walkAll(fullPath, files);
    else files.push(fullPath);
  }
  return files;
}

const deployableFiles = deployableDirs.flatMap((dir) => walk(join(root, dir)));
const deployableText = deployableFiles
  .map((file) => [relative(root, file), readFileSync(file, "utf8")])
  .map(([path, text]) => ({ path, text }));

const forbiddenSourcePatterns = [
  { label: "old 10-step builder copy", pattern: /Step\s+\d+\s+of\s+10|10-step|10 step/i },
  { label: "Pickems/Pickums/PV Pickums product copy", pattern: /\b(?:Pickems?|Pickums|PV Pickums)\b/i },
];

for (const { path, text } of deployableText) {
  for (const { label, pattern } of forbiddenSourcePatterns) {
    if (pattern.test(text)) fail(`${label} found in ${path}`);
  }
}

const requiredBuilderMarkers = [
  "Step 1 of 6",
  "Step 6 of 6",
  "Build path",
  "Teams & Divisions",
  "Season & Rules",
];
const builderPath = join(root, "components/builder/LeagueBuilder.tsx");
if (!existsSync(builderPath)) {
  fail("Builder file is missing: components/builder/LeagueBuilder.tsx");
} else {
  const builder = readFileSync(builderPath, "utf8");
  for (const marker of requiredBuilderMarkers) {
    if (!builder.includes(marker)) fail(`6-step builder marker missing: ${marker}`);
  }
}

const requiredNextManifestRoutes = [
  "/page",
  "/build/page",
  "/fantasy/page",
  "/fantasy/leagues/page",
  "/fantasy/schedules/page",
  "/season/[id]/page",
  "/season/[id]/team/[teamId]/page",
  "/share/[slug]/page",
  "/share/[slug]/team/[teamId]/page",
];
const requiredVercelOutputRoutes = [
  ["home page", [".vercel/output/functions/index.func", ".vercel/output/functions/index.prerender-config.json"]],
  ["build page", [".vercel/output/functions/build.func", ".vercel/output/functions/build.prerender-config.json"]],
  ["fantasy page", [".vercel/output/functions/fantasy.func", ".vercel/output/functions/fantasy.prerender-config.json"]],
  ["fantasy leagues page", [".vercel/output/functions/fantasy/leagues.func", ".vercel/output/functions/fantasy/leagues.prerender-config.json"]],
  ["fantasy schedules page", [".vercel/output/functions/fantasy/schedules.func", ".vercel/output/functions/fantasy/schedules.prerender-config.json"]],
  ["season page", [".vercel/output/functions/season/[id].func"]],
  ["season team page", [".vercel/output/functions/season/[id]/team/[teamId].func"]],
  ["share page", [".vercel/output/functions/share/[slug].func"]],
  ["share team page", [".vercel/output/functions/share/[slug]/team/[teamId].func"]],
];

const manifestPath = join(root, ".next/server/app-paths-manifest.json");
const vercelFunctionsPath = join(root, ".vercel/output/functions");
if (existsSync(manifestPath)) {
  const manifest = readJson(manifestPath);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    fail("Build route manifest could not be read.");
  } else {
    const routes = Object.keys(manifest);
    const routeSet = new Set(routes);
    for (const route of requiredNextManifestRoutes) {
      if (!routeSet.has(route)) fail(`Expected built route is missing: ${route}`);
    }
    for (const route of routes) {
      if (/\/(?:api\/)?(?:cron\/)?pickem/i.test(route)) fail(`Pickems route found in build manifest: ${route}`);
    }
  }
} else if (existsSync(vercelFunctionsPath)) {
  for (const [label, candidates] of requiredVercelOutputRoutes) {
    if (!candidates.some(pathExists)) fail(`Expected Vercel output route is missing: ${label}`);
  }
  const outputPaths = walkAll(join(root, ".vercel/output"))
    .map((file) => relative(root, file));
  for (const path of outputPaths) {
    if (/(?:^|\/)(?:api\/)?(?:cron\/)?pickem/i.test(path)) fail(`Pickems file found in Vercel output: ${path}`);
  }
} else {
  fail("Build route output is missing. Run `npm run build` or `vercel build --prod` before `npm run predeploy:guard`.");
}

const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || (() => {
  try {
    return execSync("git branch --show-current", { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
})();
if (branch && /pickem/i.test(branch)) {
  warn(`Branch name contains "pickem": ${branch}`);
}

for (const message of warnings) console.warn(`predeploy guard warning: ${message}`);
if (errors.length) {
  console.error("predeploy guard failed:");
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}

console.log("predeploy guard passed: 6-step builder, required routes, and Pickems hold are clean.");
