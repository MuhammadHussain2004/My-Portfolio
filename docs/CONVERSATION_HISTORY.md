# Sync ecosystem conversation history

This file is a durable project-memory record of the work discussed in the AI chat. It is intentionally kept inside the repository so a future assistant can understand the architecture and previous decisions without relying on the original chat session. It does not contain OAuth secrets, refresh tokens, client-secret JSON, or private keys.

## Original context

- The initial conversation database referenced by the user was `C:\Users\mhkpl\.gemini\antigravity-ide\conversations\b1b828bb-08da-4627-a624-f89dd1d704e7.db`.
- The user wanted the resume, portfolio, GitHub profile README, Google Drive, OneDrive, and local copies to remain current with minimum manual work.
- Routine GitHub pushes and scheduled automation should do the routine work; explicit changes are requested in chat.

## Canonical workspace

- Parent workspace: `D:\Programming-Development\auto-sync-profiles`
- Portfolio local repository: `D:\Programming-Development\auto-sync-profiles\my-portfolio`
- Resume local repository: `D:\Programming-Development\auto-sync-profiles\my-resume`
- Portfolio GitHub repository: `MuhammadHussain2004/My-Portfolio`, branch `main`
- Resume GitHub repository: `MuhammadHussain2004/resume`, branch `master`

## Automation decisions

1. GitHub Actions is the cloud source of automation and must work while the laptop is off.
2. The resume repository is the vetted source for resume facts and the compiled PDF.
3. This portfolio reads the latest resume source/PDF and GitHub project data, with committed generated fallbacks.
4. The Windows scheduled task is only a bridge for local/OneDrive/locally mounted Drive copies.
5. Google Drive OAuth refresh-token credentials belong only in GitHub Secrets.
6. External failures must preserve existing generated content and existing resume copies.

## Portfolio pipeline

- `scripts/generate-projects.mjs` analyzes public repositories, scores full-stack/software-engineering evidence, filters tutorial/practice repositories, and generates the top six cards, screenshots, and stats.
- `scripts/sync-resume.mjs` downloads the current PDF from the resume repository.
- `scripts/sync-content.mjs` reads the resume `.tex` and asks Gemini to adapt only vetted facts into `src/generated/content.json`. It leaves the previous fallback untouched on failure.
- `src/data.ts` consumes generated content and now derives `certifications` from timeline entries with a certificate tag or certificate link.
- `src/components/Certifications.tsx` renders a dedicated verified-proof showcase. The section is automatically populated from resume-driven timeline data.
- Navigation now includes a Certifications anchor in addition to About, Work, Skills, Experience, and Contact.

## Content requirements

- Analyze complete repositories and prefer meaningful full-stack/software-engineering applications.
- Rank projects with frontend, backend, database, authentication, deployment, testing, completeness, recency, and relevance evidence.
- Generate a project description from code evidence only when repository descriptions are missing.
- Do not invent technologies, dates, employers, certificates, or project claims.
- Keep user-authored sections intact and rewrite only generated/marked sections.
- Verified proof currently available from the resume repository includes the 10Pearls 10Shine internship certificate PDF and IBM/Coursera verification URL. SMIT is training unless an official certificate URL is added.

## Latest change

- A polished Certifications section was added to the portfolio and linked in navigation.
- The portfolio fallback narrative was aligned with the resume's improved software-engineering summary.
- The change was pushed to `main` in commit `bc28ed5`.
- Portfolio lint/build passed after the change.
- The resume layout was then refined again to keep the improved breathing room while fitting the complete resume on one page. The resume workflow confirmed the final PDF as one page and dispatched this portfolio deployment.
- 2026-10-05: The resume was tightened after a visual review so the complete Technical Skills section remains visible on one page. All required sections and ATS-relevant evidence were retained; the final PDF was visually checked and confirmed as one page by workflow `37238089789` (compiled PDF commit `a2c26c0`). The resume workflow uploaded the PDF to Drive and dispatched portfolio/profile synchronization.
- 2026-10-05: Resume section spacing was refined to remove excessive bottom whitespace while preserving readable heading, entry, and bullet gaps. The final rendered PDF remains one page with all content visible (resume workflow `37239391694`, compiled PDF commit `50a0a21`). Google Drive upload and portfolio/profile dispatch completed; the local Windows sync agent refreshed the `D:\general data` and OneDrive copies.
- 2026-10-05: Persistent history is now passed to the portfolio Gemini adapter as preference/context, and the portfolio guidance requires every AI editor to read and mirror this file with the resume repository. The resume source remains the sole factual source; history prevents regression of user preferences and synchronization rules.

## Operational rules for future assistants

- After every future chat task that changes this ecosystem, append a dated entry to this file and mirror the same update in the resume repository's `docs/CONVERSATION_HISTORY.md`. Record what changed, why, validation results, and commit/workflow IDs.
- Read this file, `AGENTS.md`, and `GEMINI.md` before editing.
- Update the resume source first when a fact belongs to the professional profile, then let portfolio generation consume it.
- Keep generated JSON as a safe fallback, never as an unexplained second source of truth.
- Run `npm run lint` and `npm run build` before pushing.
- Do not commit secrets or OAuth files.
- If a push is rejected, fetch/rebase instead of overwriting remote automation changes.
- Keep certificate cards driven by official resume links so they cannot drift from verified evidence.
