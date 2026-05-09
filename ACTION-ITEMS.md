# Action Items

Canonical task tracker for the Zynkr skill directory.

This file is organized into:
- `Current Focus`: the immediate execution queue
- `Remaining Plan`: a MECE forward plan by workstream
- `Progress Log`: dated history in reverse chronological order

---

## Current Focus

### Now

- [ ] Decide the next content ingestion batch after `writing-agent` core

### Current Facts

- [x] `zynkr-website-fe` is the canonical frontend (HTML/CSS/JS on Vercel) — Next.js frontend experiment deleted 2026-05-09
- [x] Backend (`backend/`) is kept for future integration; not yet wired to the live site
- [x] Backend now defaults to reading `generated/skills.json`
- [x] `writing-agent` core (`1.01`–`1.08`) has been ingested
- [x] Cleanup of legacy intake pipeline and stale artifacts complete (2026-05-09)

---

## Remaining Plan

### ~~Workstream A — Delivery Surface~~ (superseded 2026-05-09)

The Next.js frontend and Zeabur deployment plan were superseded when the `frontend/` experiment was deleted. The canonical FE is `zynkr-website-fe` (HTML/CSS/JS on Vercel). Raw file serving via Next.js route is no longer applicable.

---

### Workstream B — Application Data Model And Rendering

Goal:
make the app consume normalized/generated data consistently, without hardcoded project assumptions

### B1. Remove hardcoded taxonomy rendering

- [x] Derive project listing pages from generated skills instead of `projects[]` in `taxonomy.ts`
- [x] Derive `[category]/[project]` static params from generated skills
- [ ] Remove helpers that depend on hardcoded project objects if they are no longer needed (deferred to B2)
- [x] Keep only category-level presentation metadata in `taxonomy.ts` if still useful
- [x] Verify all current routes still build and resolve

### B2. Close the metadata gap between source repos and UI

- [ ] Add explicit project display metadata such as `projectName` and `projectDescription`
- [ ] Decide whether `useWhen` and/or `sourceDescription` should be first-class fields
- [ ] Stop overloading long prompt prose as web-app `process` text
- [ ] Update ingest output so UI-facing fields are normalized intentionally rather than inferred ad hoc

### B3. Backend/API alignment

- [x] Decided: `zynkr-website-fe` is artifact-first (fetches raw GitHub JSON); backend will replace this in a future phase
- [ ] When integrating backend: extend filters to support `project`, `kind`, and `stage`
- [ ] Keep the backend contract aligned with generated artifact fields

---

### Workstream C — Content Supply

Goal:
finish migrating from legacy CSV assumptions to repo-managed content

### C1. Clean source repos

- [ ] Define the preferred source repo shape for skill projects
- [ ] Decide whether source repos should carry explicit catalog metadata separate from prompt/runtime text
- [ ] Apply that source-repo standard to `writing-agent` before scaling it elsewhere

### C2. Ingest remaining projects

- [ ] Choose the next repo/group to ingest after `writing-agent` core
- [ ] Ingest one project group at a time via `scripts/ingest.ts`
- [ ] Validate `content/skills/` output and generated artifacts after each ingest
- [ ] Keep progress visible by project group, not by scattered individual patches

### C3. Remaining ingestion tracker

- [x] `1.01–1.08` — writing-agent core
- [ ] `0.01` — search-index
- [ ] `1.09–1.14` — writing-agent extensions
- [ ] `2.01–2.05` — resume
- [ ] `2.06–2.07` — interview
- [ ] `2.08` — career-coach
- [ ] `2.09–2.10` — career-consulting
- [ ] `2.11–2.12` — consulting-assistant
- [ ] `2.13–2.16` — operations-assistant
- [ ] `3.01` — strategy-planning
- [ ] `3.02–3.05` — project-management
- [ ] `3.06–3.10` — project-assistant
- [ ] `4.01` — video-review
- [ ] `5.01–5.02` — prompt-engineering
- [ ] `7.01–7.05` — recruitment
- [ ] `7.06–7.12` — course-ta
- [ ] `8.01–8.02` — sales-assistant

---

### Workstream D — Longer-Term Platform Decisions

Goal:
capture important but non-blocking architectural decisions without mixing them into the execution queue

- [ ] Decide where taxonomy metadata should live long term: code-owned or content-owned
- [ ] Decide how skill content should be edited: Git-only, structured content workflow, or CMS/admin
- [ ] Add `docLink` if prompt/reference docs should be first-class in the directory
- [x] Decided: backend (`backend/`) is kept for future integration — will eventually replace raw GitHub URL fetching in `zynkr-website-fe`
- [x] Decided: database platform is Supabase — add when Git-managed artifacts are no longer sufficient
- [ ] Replace temporary visual assets such as the current browser tab icon when final brand assets exist

---

## Progress Log

### May 9, 2026 — Cleanup & architecture alignment

**Done:**
- [x] Archived legacy intake scripts (`review-pipeline-lib.ts`, `sheet-sync.ts`, `intake-research.ts`) to `scripts/legacy/`
- [x] Deleted stale `generated/review-candidates.json` and `.csv` (last touched 2026-03-29)
- [x] Fixed duplicate slug keys in `skills-detail.json` — `marketplace-lib.ts` now keys by `id` only
- [x] Added missing `build-marketplace` npm script to `scripts/package.json`
- [x] Added `skills/README.md` to document taxonomy and empty category placeholders
- [x] Removed stale `frontend/lib/generated-skills.json` reference from CI `git add`
- [x] Deleted `frontend/` Next.js experiment (canonical FE is `zynkr-website-fe` on Vercel)
- [x] Updated `ACTION-ITEMS.md` and `README.md` to match current architecture

---

### March 9, 2026 (session 2)

**Done:**
- [x] `frontend/app/s/[id]/route.ts` created — serves `content/skills/{id}` as `text/plain`, returns 404 for unknown IDs
- [x] `generateStaticParams` for `[category]/[project]` now derived from generated skills (not hardcoded `projects[]`)
- [x] Category page now filters projects to only those with ingested skills
- [x] Build verified clean — 22 pages, `/s/[id]` dynamic route confirmed present

**Carryover:**
- [ ] Local install flow smoke test (`curl -sL localhost:3000/s/1.01.md`)
- [ ] Zeabur deployment still not done
- [ ] Decide next content ingestion batch

---

### March 9, 2026

**Done:**
- [x] Ingest pipeline now supports orchestrator + subagent repo structures such as `CLAUDE.md`, `.claude/skills/.../SKILL.md`, and `.claude/agents/*.md`
- [x] Ingest now preserves IDs by `sourceRepo` + `sourceFile`
- [x] Writing Agent core batch ingested from `github.com/peter-tu-zynkr/writing-agent` — `1.01` orchestrator plus `1.02`–`1.08` subagents
- [x] `content/skills/1.01.md` through `content/skills/1.08.md` now exist
- [x] `generated/skills.json` and `frontend/lib/generated-skills.json` now contain 8 records for the Writing Agent project
- [x] Shared site shell added for breadcrumb header + footer across home, category, project, and skill pages
- [x] Dead catalog-era files removed: `frontend/app/catalog-client.tsx`, `frontend/components/CategoryFilter.tsx`, `frontend/components/SearchBar.tsx`
- [x] Backend default provider switched from CSV to generated JSON artifacts
- [x] Root architecture docs updated to reflect the artifact-first migration design

**Carryover:**
- [ ] Raw markdown serving route is still not implemented
- [ ] Zeabur deployment is still not done
- [ ] Hardcoded project rendering still exists in taxonomy-driven pages

### March 8, 2026

**Done:**
- [x] Frontend scaffold in `frontend/` with home, category, project, and skill detail pages
- [x] Static data in `frontend/lib/skills-data.ts` and taxonomy in `frontend/lib/taxonomy.ts`
- [x] Backend scaffold in `backend/` with `GET /health`, `GET /skills`, `GET /skills/:id`, `GET /categories`
- [x] `content/skills/` folder created
- [x] `generated/` folder created
- [x] Ingest schema defined in Zod (`scripts/ingest.ts`)
- [x] Ingest pipeline implemented — clones a repo, validates frontmatter, writes `content/skills/{id}.md`, regenerates `generated/skills.json` and `frontend/lib/generated-skills.json`
- [x] `installCommand` auto-generated by ingest as `curl -sL zynkr.ai/s/{id}.md -o ~/.claude/skills/{slug}.md`
- [x] Backend `Skill` schema expanded with `project`, `kind`, `stage`, `installCommand`, `sourceRepo`, and `sourceFile`
- [x] `description` field made optional in `Skill` type; `filterSkills` updated accordingly
- [x] `skills-data.ts` switched to generated JSON input
- [x] `writing-agent` project added to taxonomy under `brand-marketing`
- [x] First generated route build verified for `/skills/1.01` and `/brand-marketing/writing-agent`

**Carryover:**
- [ ] Raw markdown serving was not yet implemented
- [ ] Deployment was not yet done
