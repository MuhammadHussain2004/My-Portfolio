// Scores this GitHub account's public repos for "complete full-stack project,
// live somewhere" and picks the best N for the portfolio's project showcase.
//
// Selection is automatic (score-driven) so a new repo that's a stronger
// full-stack project than what's currently shown will replace it on the next
// run, without anyone touching this file. `project-overrides.json` only
// supplies nicer copy for known repos (and an explicit exclude list) — it
// never overrides the score-based decision of *which* repos qualify.
//
// Safe-by-design: any failure here leaves the last committed
// src/generated/projects.json untouched and exits 0, so a flaky API call
// never breaks the deploy.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OWNER = "MuhammadHussain2004";
const OUTPUT_JSON = path.join(ROOT, "src/generated/projects.json");
const STATS_JSON = path.join(ROOT, "src/generated/stats.json");
const SCREENSHOT_DIR = path.join(ROOT, "public/projects-auto");

const overrides = JSON.parse(readFileSync(path.join(__dirname, "project-overrides.json"), "utf8"));
const MAX_PROJECTS = overrides.maxProjects ?? 6;
const MIN_SCORE = overrides.minScore ?? 7;
const EXCLUDE_SLUGS = new Set((overrides.excludeSlugs ?? []).map((s) => s.toLowerCase()));

const EXCLUDE_KEYWORDS = /\b(learning|practice|tutorial|training|exercise|coursework|assignment|tasks?)\b/i;

const FRONTEND_DEPS = ["react", "next", "vue", "svelte", "vite", "@angular/core"];
const BACKEND_DEPS = ["express", "fastify", "koa", "@nestjs/core", "mongoose", "sequelize", "prisma", "mysql2", "pg"];
const DB_DEPS = ["mongoose", "mongodb", "pg", "mysql2", "sequelize", "prisma", "@libsql/client", "better-sqlite3"];
const AUTH_DEPS = ["jsonwebtoken", "bcrypt", "bcryptjs", "passport"];

const TAG_LABELS = {
  react: "React",
  next: "Next.js",
  vue: "Vue",
  svelte: "Svelte",
  vite: "Vite",
  express: "Express",
  fastify: "Fastify",
  mongoose: "Mongoose",
  mongodb: "MongoDB",
  sequelize: "Sequelize",
  prisma: "Prisma",
  mysql2: "MySQL",
  pg: "PostgreSQL",
  jsonwebtoken: "JWT",
  bcrypt: "bcrypt",
  bcryptjs: "bcrypt",
  passport: "Passport",
  "@libsql/client": "Turso (libSQL)",
  typescript: "TypeScript",
};

async function ghFetch(pathname) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-generator" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${pathname}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${pathname} -> ${res.status}`);
  return res.json();
}

async function isLive(url) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    return res.ok || (res.status >= 200 && res.status < 400);
  } catch {
    return false;
  }
}

async function fetchPackageJson(repo, dirPath) {
  const filePath = dirPath ? `${dirPath}/package.json` : "package.json";
  try {
    const res = await ghFetch(`/repos/${OWNER}/${repo}/contents/${filePath}`);
    if (!res || !res.content) return null;
    const raw = Buffer.from(res.content, "base64").toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function humanize(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .filter(Boolean)
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

async function analyzeRepo(repo) {
  const contents = (await ghFetch(`/repos/${OWNER}/${repo.name}/contents`).catch(() => null)) || [];
  const dirEntries = contents.filter((c) => c.type === "dir").map((c) => c.name);
  const dirNames = dirEntries.map((d) => d.toLowerCase());
  const fileNames = contents.filter((c) => c.type === "file").map((c) => c.name.toLowerCase());

  // Real repos name their service folders all sorts of things (server,
  // dashboard, widget, plugin, ...) — rather than guess a fixed list, probe
  // every top-level directory's package.json (bounded, these are cheap
  // reads) plus root, and let the aggregated dependencies speak for
  // themselves.
  const dirsToProbe = dirEntries.slice(0, 8);
  const [rootPkg, ...dirPkgs] = await Promise.all([
    fetchPackageJson(repo.name, null),
    ...dirsToProbe.map((d) => fetchPackageJson(repo.name, d)),
  ]);

  const allDeps = new Set();
  for (const pkg of [rootPkg, ...dirPkgs]) {
    if (!pkg) continue;
    for (const dep of Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) })) {
      allDeps.add(dep.toLowerCase());
    }
  }

  const hasAny = (list) => list.some((d) => allDeps.has(d));

  const nonJsBackendFile = fileNames.some((f) =>
    ["requirements.txt", "manage.py", "composer.json"].includes(f) || f.endsWith(".php")
  );
  const looksLikeFrontendDir = dirNames.some((d) => /front|client|dashboard|^web$|^app$|^ui$/i.test(d));
  const looksLikeBackendDir = dirNames.some((d) => /back|server|^api$/i.test(d));

  const frontendSignal = hasAny(FRONTEND_DEPS) || fileNames.includes("index.html") || looksLikeFrontendDir;
  const backendSignal = hasAny(BACKEND_DEPS) || looksLikeBackendDir || nonJsBackendFile;
  const dbSignal = hasAny(DB_DEPS) || /mongo|mysql|postgres|sql server/i.test(repo.description || "");
  const authSignal = hasAny(AUTH_DEPS) || /\bjwt\b|\bauth\b/i.test(repo.description || "");

  const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / 86_400_000;
  const recencyScore = daysSincePush < 90 ? 2 : daysSincePush < 180 ? 1 : 0;
  const sizeScore = repo.size >= 50 && repo.size <= 200_000 ? 1 : 0;

  const score =
    (frontendSignal ? 3 : 0) +
    (backendSignal ? 3 : 0) +
    (frontendSignal && backendSignal ? 2 : 0) +
    (dbSignal ? 1 : 0) +
    (authSignal ? 1 : 0) +
    recencyScore +
    sizeScore;

  const tags = [];
  for (const dep of allDeps) {
    if (TAG_LABELS[dep] && !tags.includes(TAG_LABELS[dep])) tags.push(TAG_LABELS[dep]);
    if (tags.length >= 6) break;
  }
  if (tags.length === 0 && repo.language) tags.push(repo.language);

  return { score, tags, frontendSignal, backendSignal };
}

async function fetchAllRepos() {
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await ghFetch(`/users/${OWNER}/repos?per_page=100&type=owner&sort=pushed&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

async function main() {
  console.log(`Fetching repos for ${OWNER}...`);
  const repos = await fetchAllRepos();
  if (repos.length === 0) throw new Error("Unexpected repos response");
  console.log(`${repos.length} public repos total.`);

  const candidates = repos.filter(
    (r) =>
      !r.fork &&
      !r.archived &&
      r.name.toLowerCase() !== OWNER.toLowerCase() &&
      !EXCLUDE_SLUGS.has(r.name.toLowerCase()) &&
      r.homepage &&
      !EXCLUDE_KEYWORDS.test(`${r.name} ${r.description || ""}`)
  );

  console.log(`${candidates.length} candidates have a homepage set and pass the keyword filter.`);

  const liveCandidates = [];
  for (const repo of candidates) {
    if (await isLive(repo.homepage)) liveCandidates.push(repo);
  }
  console.log(`${liveCandidates.length} candidates are verified live.`);

  const scored = [];
  for (const repo of liveCandidates) {
    try {
      const analysis = await analyzeRepo(repo);
      scored.push({ repo, ...analysis });
      console.log(`  ${repo.name}: score=${analysis.score}`);
    } catch (err) {
      console.warn(`  ${repo.name}: analysis failed (${err.message}), skipping`);
    }
  }

  // Ground-truth "shipped full-stack apps" count — every live repo with
  // real evidence of both a frontend and a backend, not just the 6 shown
  // in the showcase. Drives an About-section stat with no LLM involved.
  const fullStackRepoCount = scored.filter((s) => s.frontendSignal && s.backendSignal).length;
  console.log(`${fullStackRepoCount} live repos have real full-stack signal.`);

  // Genuinely full-stack repos (both a frontend and a backend detected)
  // always rank ahead of everything else. Only if there aren't enough of
  // those to fill every slot does a live, decent-scoring but not-fully-
  // full-stack repo backfill the remainder — the showcase always tries to
  // show MAX_PROJECTS, it just prefers full-stack work for every slot it can.
  const qualified = scored
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => {
      const aFull = a.frontendSignal && a.backendSignal ? 1 : 0;
      const bFull = b.frontendSignal && b.backendSignal ? 1 : 0;
      if (aFull !== bFull) return bFull - aFull;
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.repo.pushed_at) - new Date(a.repo.pushed_at);
    })
    .slice(0, MAX_PROJECTS);

  if (qualified.length === 0) throw new Error("No repo qualified — refusing to overwrite baseline");

  console.log(`Selected ${qualified.length} projects:`, qualified.map((q) => q.repo.name));

  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });

  const browser = await chromium.launch();
  const results = [];
  let rank = 0;
  for (const { repo, tags } of qualified) {
    rank++;
    const slug = repo.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const override = overrides.overrides?.[repo.name] || {};

    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      try {
        await page.goto(repo.homepage, { waitUntil: "networkidle", timeout: 20000 });
      } catch {
        // Some sites never go fully idle (polling, websockets) — a loaded
        // DOM is good enough for a screenshot.
        await page.goto(repo.homepage, { waitUntil: "load", timeout: 20000 });
      }
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${slug}.png`) });
      await page.close();
    } catch (err) {
      console.warn(`  ${repo.name}: screenshot failed (${err.message})`);
    }

    results.push({
      slug,
      title: override.title || humanize(repo.name),
      description:
        override.description ||
        (repo.description && repo.description.length > 30
          ? repo.description
          : `Full-stack project built with ${tags.slice(0, 3).join(", ") || repo.language}.`),
      // Base-relative (no leading slash): this script runs outside Vite and
      // has no idea what base path the site is deployed under, so the path
      // prefix is applied at render time instead — see Projects.tsx.
      image: `projects-auto/${slug}.png`,
      tags: override.tags || tags,
      live: repo.homepage,
      code: repo.html_url,
      featured: override.featured ?? rank <= 2,
    });
  }
  await browser.close();

  writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2) + "\n");
  console.log(`Wrote ${results.length} projects to ${path.relative(ROOT, OUTPUT_JSON)}`);

  // Drives the "public repositories" stat on the About section — sourced
  // live from GitHub every run instead of a number typed once by hand,
  // which is exactly the kind of thing that goes stale.
  writeFileSync(STATS_JSON, JSON.stringify({ publicRepos: repos.length, fullStackRepoCount }, null, 2) + "\n");
  console.log(`Wrote publicRepos=${repos.length} to ${path.relative(ROOT, STATS_JSON)}`);

  const keepFiles = new Set(results.map((r) => `${r.slug}.png`));
  for (const file of readdirSync(SCREENSHOT_DIR)) {
    if (!keepFiles.has(file)) {
      unlinkSync(path.join(SCREENSHOT_DIR, file));
      console.log(`Removed stale screenshot ${file}`);
    }
  }
}

main().catch((err) => {
  console.error("Project generation failed, keeping existing src/generated/projects.json:", err);
  if (!existsSync(OUTPUT_JSON)) process.exitCode = 1; // no baseline to fall back on — fail loudly
});
