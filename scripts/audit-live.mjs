// One-off diagnostic (not wired into CI): loads the live site in a real
// browser and checks for console errors, failed network requests, broken
// internal anchors, and dead external/project/resume links. Run manually
// with `npm run audit:live` whenever you want a full health check.
//
// LinkedIn can reject automated HEAD requests with 405 or 999. Those are
// inconclusive, so the audit reports them separately from broken links.
import { chromium } from "playwright";

const URL = "https://muhammadhussain2004.github.io/My-Portfolio/";
const browser = await chromium.launch();

let hasIssues = false;
const unverifiedLinks = [];

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("response", (res) => { if (res.status() >= 400) failedRequests.push(`${res.url()} -> ${res.status()}`); });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(800);

  console.log(`\n=== Viewport ${viewport.width}x${viewport.height} ===`);
  console.log("Console errors:", consoleErrors.length ? consoleErrors : "none");
  console.log("Failed requests:", failedRequests.length ? failedRequests : "none");
  if (consoleErrors.length || failedRequests.length) hasIssues = true;

  // Check every internal nav anchor scrolls to a real element
  const navHrefs = await page.$$eval('nav a[href^="#"]', (as) => as.map((a) => a.getAttribute("href")));
  for (const href of navHrefs) {
    const exists = await page.$(href);
    console.log(`  anchor ${href}: ${exists ? "OK" : "MISSING TARGET"}`);
    if (!exists) hasIssues = true;
  }

  // Collect all external links (project live/code, github, linkedin, resume)
  const externalLinks = await page.$$eval("a[href^='http'], a[href$='.pdf']", (as) =>
    as.map((a) => a.href)
  );
  const uniqueLinks = [...new Set(externalLinks)];
  console.log(`  Found ${uniqueLinks.length} external/file links`);

  await page.close();

  if (viewport.width === 1440) {
    // Only need to link-check once
    for (const link of uniqueLinks) {
      try {
        const res = await fetch(link, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000) });
        const status = res.status;
        if (new globalThis.URL(link).hostname.endsWith("linkedin.com") && (status === 405 || status === 999)) {
          console.log(`  NOTE ${status} ${link} (LinkedIn blocks automated HEAD checks)`);
          unverifiedLinks.push(link);
          continue;
        }
        const ok = status < 400;
        console.log(`  ${ok ? "OK " : "BAD"} ${status} ${link}`);
        if (!ok) hasIssues = true;
      } catch (e) {
        console.log(`  ERR ${link}: ${e.message}`);
        hasIssues = true;
      }
    }
  }
}

await browser.close();
if (unverifiedLinks.length) console.log(`\n${unverifiedLinks.length} external link(s) were inconclusive because the host blocked HEAD requests.`);
console.log(hasIssues ? "\n>>> ISSUES FOUND" : "\n>>> ALL CLEAR");
process.exit(hasIssues ? 1 : 0);
