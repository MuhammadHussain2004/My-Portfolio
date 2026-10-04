# Project Memory & Operating Guidelines: Muhammad Hussain's Portfolio Ecosystem

> **Permanent Context Reference**:
> This document preserves the full development history, architecture decisions, and operational rules established during the core build session (sourced from Claude session transcript `C:\Users\mhkpl\.claude\projects\d--Programming-Development-my-portfolio\10294a83-f8ba-4fe4-b30a-0da93261fdcb.jsonl`).
> All future coding assistants (Antigravity, Claude, etc.) **must strictly respect** these guidelines and architectural choices.

---

## 1. Developer Profile & Target Positioning

- **Name**: Muhammad Hussain (Full: Muhammad Hussain Khan Lodhi)
- **Primary Target Role**: **Software Engineer** (Highlighting **Full Stack Developer** & **MERN Stack**)
- **Location**: Karachi, Pakistan
- **Email**: `muhammadhussaintech@gmail.com`
- **Phone**: `+92 324 3249217`
- **GitHub**: [https://github.com/MuhammadHussain2004](https://github.com/MuhammadHussain2004)
- **LinkedIn**: [https://www.linkedin.com/in/muhammad-hussain-khan-lodhi-139261252](https://www.linkedin.com/in/muhammad-hussain-khan-lodhi-139261252)
- **Education**: BS Computer Science (CGPA: 3.52)
- **Key Verified Certifications**:
  - **10Pearls MERN Stack Development Internship** (10Shine program) — Certificate link integrated in timeline.
  - **IBM / Coursera Full Stack Software Developer Professional Certificate** (Coursera ID: `ACOM3SC87IX4`) — Verification link integrated in timeline.

---

## 2. Repositories, Live URLs & Local Paths

| Component | Local Directory | GitHub Repository | Live Production URL |
| :--- | :--- | :--- | :--- |
| **Portfolio** | `D:\Programming-Development\auto-sync-profiles\my-portfolio` | `MuhammadHussain2004/My-Portfolio` | [https://muhammadhussain2004.github.io/My-Portfolio/](https://muhammadhussain2004.github.io/My-Portfolio/) |
| **Resume (Source)** | `D:\Programming-Development\auto-sync-profiles\my-resume` | `MuhammadHussain2004/resume` | [https://muhammadhussain2004.github.io/Muhammad-Hussain-Resume.pdf](https://muhammadhussain2004.github.io/Muhammad-Hussain-Resume.pdf) |
| **Resume Multi-Sync** | `C:\Users\mhkpl\AppData\Local\ResumeSync\sync-resume.ps1` | N/A | Syncs to Laptop, OneDrive, Google Drive & `D:\general data` |

---

## 3. Core Ecosystem Philosophy: Zero-Maintenance Dynamic Sync

The user's fundamental goal is **zero manual updates**. When Muhammad pushes new projects or updates to GitHub, the entire system must update automatically:

1. **Daily GitHub Actions Automation** (`.github/workflows/deploy.yml`):
   - Triggers: Push to `main`, manual `workflow_dispatch`, and daily cron at **03:30 UTC** (30 mins after `resume` repo's 03:00 UTC build to avoid race conditions).
2. **Project Auto-Scoring & Showcase Generation** (`scripts/generate-projects.mjs`):
   - Queries GitHub API for all public repos.
   - Detects full-stack architecture (probes top-level package.json files for frontend + backend + database + auth dependencies, checks recency and size).
   - Filters out tutorial/practice keywords (`learning`, `practice`, `tutorial`, `assignment`, `coursework`, etc.).
   - Selects top 6 projects automatically.
   - Takes headless automated screenshots via **Playwright** (`public/projects-auto/`) for live sites.
   - Generates `src/generated/projects.json` and `src/generated/stats.json`.
3. **Resume PDF Sync** (`scripts/sync-resume.mjs`):
   - Downloads the latest compiled `Muhammad_Hussain_Resume.pdf` from the raw `resume` GitHub repository into `public/Muhammad-Hussain-Resume.pdf`.
4. **Narrative Content Adaptation via Gemini** (`scripts/sync-content.mjs`):
   - Fetches the latest LaTeX source `Muhammad_Hussain_Resume.tex` from GitHub.
   - Calls Google Gemini API (`GEMINI_API_KEY` GitHub secret) using structured JSON schema.
   - Generates portfolio narrative copy: tagline, bio paragraphs, quick facts, skills categories, timeline items with certificate verification links, and contact heading.
   - Writes `src/generated/content.json`.
5. **Safe-by-Design Resilience**:
   - Every script is designed with defensive fallbacks. If GitHub rate limits or Gemini API encounters issues, the existing committed fallback files in `src/generated/` and `public/` are preserved, and scripts exit cleanly (`exitCode = 0`). The build will never crash in CI.

---

## 4. Key Projects & Overrides (`scripts/project-overrides.json`)

- **`buildbot`**: Displayed as **"BuildVolt — PC-Build Recommendation SaaS"**.
  - Final Year Project (FYP) with a 2-person team.
  - Live link: `https://buildvolt.online` (or `buildvolt.online`).
  - Tech: Node.js, Express, Turso (libSQL), React, TypeScript, WordPress/WooCommerce plugin, JWT.
- **`shopco-ecommerce`**: Displayed as **"Shop.co E-Commerce Platform (MERN Stack)"**.
  - Rebuild of community Figma template into full MERN platform (MongoDB Atlas, Express, React, Vite).
- **`Complain-Management-System-MERN`**: Displayed as **"Smart Complaint Management System (MERN Stack)"**.
  - 15 REST endpoints, JWT auth, bcrypt, role-based workflows (citizen, staff, admin).
- **`full-stack-auth`**: Core authentication reference app.
- **`students-Records-app`**: Next.js App Router, TypeScript, MongoDB, live metrics dashboard.
- **`MuhammadHussain-mern-10pshine`**: **NoteFlow — 10Pearls Internship Project**.
- **Explicitly Excluded Repos**:
  - `paradise-nursery`
  - `Wanderly-Travel-Recommendation`
  - `MuhammadHussain2004.github.io`

---

## 5. UI & Design Standards

- **Brand Logo**: `<Hussain/>` with sleek modern coding aesthetic.
- **Navigation**: Includes direct view and download actions for the auto-synced Resume PDF.
- **Skills Grid**: Dynamic responsive CSS layout designed to gracefully auto-wrap and avoid empty trailing gaps when skill categories grow or shrink.
- **Experience Timeline**: Directly integrates official verification links for 10Pearls and IBM/Coursera certificates.
- **ATS Resume Standards**:
  - The LaTeX resume follows strict 100% ATS score criteria: clean single-column structure, standard fonts, semantic sections (`Summary` → `Experience` → `Projects` → `Education` → `Certifications` → `Technical Skills`), and no unparseable formatting tables.

---

## 6. How to Handle Future Tasks

### Persistent conversation context and explicit-change sync

- Before any edit, read `docs/CONVERSATION_HISTORY.md`; it is the shared
  project-memory file mirrored with the resume repository.
- After every edit, append what changed, why, validation results, and commit or
  workflow IDs to that file and mirror the entry in the resume repository.
- Explicit resume changes must trigger the resume compile, Google Drive upload,
  portfolio resume/PDF sync, and profile synchronization in the same workflow.
  The Windows sync agent then updates local and OneDrive copies when the laptop
  is available; cloud workflows cannot write to a powered-off laptop.
- The portfolio Gemini adapter receives the history excerpt as preference
  context, but must use the resume source as the only factual source.

- **If modifying copy or descriptions**: Update `scripts/project-overrides.json` or `Muhammad_Hussain_Resume.tex` in `my-resume`, rather than hardcoding in components.
- **If modifying styles or components**: Use standard React + TypeScript patterns in `src/components/`, ensuring responsive design and aesthetic polish.
- **If adding a new project override**: Add entry under `overrides` in `scripts/project-overrides.json`.
- **If modifying build/deploy pipeline**: Keep defensive fallback behavior intact so CI never breaks if external services are unreachable.
