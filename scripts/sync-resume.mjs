// Pulls the latest resume PDF from the (now public) MuhammadHussain2004/resume
// repo, which rebuilds itself daily from live GitHub activity. This keeps the
// portfolio's Resume link current without ever committing a resume by hand
// again.
//
// Safe-by-design: a fetch failure leaves the already-committed
// public/Muhammad-Hussain-Resume.pdf untouched and exits 0, so a flaky
// network call never breaks the deploy.

import { writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESUME_URL = "https://raw.githubusercontent.com/MuhammadHussain2004/resume/master/Muhammad_Hussain_Resume.pdf";
const OUTPUT_PATH = path.join(ROOT, "public/Muhammad-Hussain-Resume.pdf");

async function main() {
  console.log(`Fetching latest resume from ${RESUME_URL}...`);
  const res = await fetch(RESUME_URL, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 1000) throw new Error(`Response too small to be a real PDF (${buffer.length} bytes)`);

  writeFileSync(OUTPUT_PATH, buffer);
  console.log(`Wrote ${buffer.length} bytes to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error("Resume sync failed, keeping existing public/Muhammad-Hussain-Resume.pdf:", err);
  if (!existsSync(OUTPUT_PATH)) process.exitCode = 1; // no baseline to fall back on — fail loudly
});
