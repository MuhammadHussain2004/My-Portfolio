// Adapts the latest resume (from MuhammadHussain2004/resume, itself kept in
// sync with live GitHub activity by its own automation) into the JSON that
// drives the portfolio's narrative content: hero tagline, About bio,
// quick facts, skills grid, experience/education timeline, and the contact
// heading.
//
// The resume is treated as the single already-vetted source of truth —
// Gemini's job is narrow (reformat + adapt tone into portfolio voice), not
// to re-derive facts from raw GitHub data. This mirrors the same
// "don't fabricate, leave unsupported sections alone" discipline as the
// resume repo's own sync script.
//
// Safe-by-design: any failure here (network, bad API key, malformed
// response) leaves the last committed src/generated/content.json untouched
// and exits 0, so it never breaks the deploy — the site just keeps showing
// the last good content until the next successful run.

import { writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_JSON = path.join(ROOT, "src/generated/content.json");
const RESUME_TEX_URL = "https://raw.githubusercontent.com/MuhammadHussain2004/resume/master/Muhammad_Hussain_Resume.tex";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    tagline: { type: "string" },
    secondaryRoles: { type: "array", items: { type: "string" } },
    bio: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
    quickFacts: {
      type: "object",
      properties: {
        basedIn: { type: "string" },
        education: { type: "string" },
        focus: { type: "string" },
        currently: { type: "string" },
      },
      required: ["basedIn", "education", "focus", "currently"],
    },
    cgpaStat: { type: "string" },
    contactHeading: { type: "string" },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["category", "items"],
      },
    },
    timeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          period: { type: "string" },
          title: { type: "string" },
          place: { type: "string" },
          description: { type: "string" },
          tag: { type: "string" },
          link: { type: "string" },
          linkLabel: { type: "string" },
        },
        required: ["period", "title", "place", "description", "tag"],
      },
    },
  },
  required: ["tagline", "secondaryRoles", "bio", "quickFacts", "cgpaStat", "contactHeading", "skills", "timeline"],
};

const SYSTEM_PROMPT = `You are adapting an already-finalized, human-approved resume into structured JSON for a software engineer's portfolio website. The resume text given to you is the single source of truth.

Rules:
- Do not add, invent, or infer any fact, employer, project, date, or skill that is not explicitly present in the resume text. This is a reformatting and tone-adaptation task, not a content-generation task.
- The resume is written in third-person/telegraphic resume style. Rewrite it into natural first-person prose for a portfolio website (e.g. "I designed..." not "Designed...").
- "bio": exactly 2 paragraphs. Paragraph 1 leads with the professional identity and CS/engineering foundation from the Summary section. Paragraph 2 covers production experience (internship, certifications) and tools/working style. Keep it warm but precise, no fluff, no buzzword salad.
- "tagline": one sentence, hero-section subtitle, distilled from the Summary.
- "secondaryRoles": 1-3 short role labels (e.g. "Full-Stack Developer", "MERN Stack Specialist") that support but don't repeat the primary "Software Engineer" title — infer these from the Summary's emphasis, do not invent unrelated ones.
- "quickFacts": basedIn (city, country from the header), education (degree + university, short), focus (2-4 word phrase capturing the resume's stated specialization), currently (their current training/program from Certifications or Experience, short).
- "cgpaStat": exactly as stated in the resume, formatted like "3.7/4.0".
- "contactHeading": one short question inviting contact, matching the resume's professional framing (e.g. mentioning the primary role/specialization). No em dashes.
- "skills": mirror the resume's own "Technical Skills" category structure and items as closely as possible — do not reorganize into different categories than the resume uses, do not drop or add categories, but you may rename a category to be more portfolio-friendly if the resume's label is very terse (e.g. keep "MERN / Full-Stack" style labels if present).
- "timeline": one entry per Education, Certification, and Experience entry in the resume (skip "Self-Directed Learning" only if it has no concrete dates or evidence to build a real entry from). "tag" is a short 1-2 word label: "Education", "Certificate", "Training", "Experience", or "Independent". "description" is 1-2 sentences, first-person, based only on that resume entry's own bullet points. Order most-recent-first is fine but don't worry about perfect chronological sorting. The resume's .tex source contains \\href{URL}{label} commands (e.g. next to a certification or job title) — if an entry's heading line contains one, extract the URL into "link" and a short 1-2 word button label (e.g. "Verify", "Certificate") into "linkLabel"; omit both fields entirely for entries with no such link. Never invent a link that isn't literally present in the source.
- Output ONLY raw JSON matching the given schema. No markdown fences, no commentary.`;

async function resolveModel() {
  if (process.env.GEMINI_MODEL) return [process.env.GEMINI_MODEL];

  const res = await fetch(`${GEMINI_API_BASE}/v1beta/models?key=${GEMINI_API_KEY}`);
  if (!res.ok) throw new Error(`ListModels failed: ${res.status}`);
  const data = await res.json();
  const candidates = (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.split("/").pop());

  if (candidates.length === 0) throw new Error("No Gemini models support generateContent for this API key.");

  const rank = (name) => {
    let score = 0;
    if (name.includes("latest")) score += 1000;
    const match = name.match(/(\d+)(?:\.(\d+))?/);
    if (match) score += Number(match[1]) * 100 + Number(match[2] || 0);
    if (name.includes("flash")) score += 20;
    if (name.includes("pro")) score += 10;
    if (/exp|preview|thinking/.test(name)) score -= 500;
    if (/vision|embedding|tts|image|audio/.test(name)) score -= 10000;
    return -score;
  };
  return candidates.sort((a, b) => rank(a) - rank(b));
}

async function callGemini(model, resumeTex) {
  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: `RESUME (.tex source):\n\n${resumeTex}` }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  for (const apiVersion of ["v1beta", "v1"]) {
    const url = `${GEMINI_API_BASE}/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    let res;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000),
      });
      if ((res.status === 429 || res.status === 503) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 2 ** (attempt + 1) * 1000));
        continue;
      }
      break;
    }

    if (res.status === 404) continue; // try next api version, then caller tries next model
    if (!res.ok) throw new Error(`Gemini ${apiVersion} error ${res.status}: ${(await res.text()).slice(0, 500)}`);

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("");
    if (!text.trim()) throw new Error(`Gemini returned empty text: ${JSON.stringify(data).slice(0, 500)}`);
    return text;
  }
  return null; // both api versions 404'd for this model
}

function validate(content) {
  const required = ["tagline", "secondaryRoles", "bio", "quickFacts", "cgpaStat", "contactHeading", "skills", "timeline"];
  for (const key of required) {
    if (!(key in content)) throw new Error(`Missing "${key}" in Gemini response`);
  }
  if (content.bio.length !== 2) throw new Error(`Expected exactly 2 bio paragraphs, got ${content.bio.length}`);
  if (content.skills.length < 3) throw new Error(`Suspiciously few skill categories: ${content.skills.length}`);
  if (content.timeline.length < 3) throw new Error(`Suspiciously few timeline entries: ${content.timeline.length}`);
  if (!/^\d(\.\d+)?\/\d(\.\d+)?$/.test(content.cgpaStat)) {
    throw new Error(`cgpaStat doesn't look like "X.X/X.X": ${content.cgpaStat}`);
  }
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY set — skipping content sync, keeping existing generated content.");
    return;
  }

  console.log(`Fetching resume source from ${RESUME_TEX_URL}...`);
  const resumeRes = await fetch(RESUME_TEX_URL, { signal: AbortSignal.timeout(30000) });
  if (!resumeRes.ok) throw new Error(`Failed to fetch resume .tex: ${resumeRes.status}`);
  const resumeTex = await resumeRes.text();
  if (resumeTex.length < 500) throw new Error(`Resume source suspiciously short (${resumeTex.length} chars)`);

  const models = await resolveModel();
  console.log(`Gemini model candidates (best first): ${models.join(", ")}`);

  let raw = null;
  let usedModel = null;
  for (const model of models) {
    try {
      raw = await callGemini(model, resumeTex);
      if (raw) {
        usedModel = model;
        break;
      }
    } catch (err) {
      console.warn(`  ${model} failed: ${err.message}`);
    }
  }
  if (!raw) throw new Error("No working Gemini model found among candidates.");
  console.log(`Used Gemini model: ${usedModel}`);

  const content = JSON.parse(raw);
  validate(content);

  writeFileSync(OUTPUT_JSON, JSON.stringify(content, null, 2) + "\n");
  console.log(`Wrote synced content to ${path.relative(ROOT, OUTPUT_JSON)}`);
}

main().catch((err) => {
  console.error("Content sync failed, keeping existing src/generated/content.json:", err);
  if (!existsSync(OUTPUT_JSON)) process.exitCode = 1; // no baseline to fall back on — fail loudly
});
