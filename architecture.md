# Zynkr Skills — Architecture

## Pipeline

```
any input (GitHub link / URL / text)             |    a built skill (SKILL.md on disk / GH URL)
      ↓                                          |          ↓
/skill-sourcer (Claude Code)                     |    /skill-publish (Claude Code, mid-pipeline intake)
      ↓  extract → classify → dedup check        |          ↓  read SKILL.md → classify → dedup check
      ↓                                          |          ↓
       \________________  ______________________/___________/
                        \/
Zynkr Skills Pipeline (GitHub Project on zynkr-skill-idea)
      ↓  item added — Pipeline Status=proposed, Keep=?, Intake Source=(skill-sourcer | skill-publish)
      ↓  human sets Keep=yes → triage-ready label added
/skill-triager (Claude Code)
      ↓  review packet → assign-build → repository_dispatch → zynkr-skill-builder
      ↓
zynkr-skill-builder
      ↓  pickup-approved-issue.yml scaffolds skills/[N-category]/[slug]/SKILL.md
      ↓  (for /skill-publish items already in-tree, scaffold is skipped — Build Status starts at ready-to-ship)
      ↓  push to main → ingest-skills.yml fires
      ↓  ingest.ts + build-marketplace.ts → generated/*.json committed
      ↓
zynkr.ai/ai-skills-marketplace (fetches raw GitHub URLs on page load)
```

There are two intake entry points into the same pipeline:

- **`/skill-sourcer`** — raw inputs (link, URL, text). Runs the full extractor → classifier → deduplicator → proposer chain. Use when you've found a skill candidate but haven't built anything yet.
- **`/skill-publish`** — already-built artifacts (a SKILL.md on disk or at a GitHub URL). Skips extraction and reads the frontmatter directly, then runs the same classifier → deduplicator → proposer chain. Use after `/skill-creator` or when you've downloaded a SKILL.md and want it categorised + dedup-checked before it enters the pipeline.

Both feed the same Project; `Intake Source` distinguishes them. `/skill-triager` is the single authorised path to fire a build dispatch, regardless of which intake fed it.

---

## Repos

| Repo | Visibility | Role |
|---|---|---|
| [`zynkr-skill-idea`](https://github.com/peter-tu-zynkr/zynkr-skill-idea) | Private | Ideas backlog (GitHub issues) |
| [`zynkr-skill-builder`](https://github.com/peter-tu-zynkr/zynkr-skill-builder) | **Public** | Skill source + CI/CD + generated artifacts |
| [`zynkr-website`](https://github.com/peter-tu-zynkr/zynkr-website) | — | Frontend — reads from production raw URLs at runtime |

---

## Gate 1 — Idea Capture

**Tools:** `/skill-sourcer` (raw inputs) and `/skill-publish` (built artifacts) in Claude Code  
**Pipeline state:** GitHub Project on `peter-tu-zynkr/zynkr-skill-idea` — every entry is an Issue + Project item with custom fields (`Pipeline Status`, `Keep`, `Category`, `Intake Source`, `Build *`)

### `/skill-sourcer` — for raw inputs (link / URL / text)

Runs 4 subagents in sequence:

| Subagent | What it does |
|---|---|
| **extractor** | Pulls name, description, input/output, source URL from raw input; for GitHub links, extracts `owner/repo` as `upstream_repo` |
| **classifier** | Maps to one of the 10 taxonomy categories (0–9) |
| **deduplicator** | Scans the GitHub Project for `exact_duplicate`, `near_duplicate`, `partial_overlap`, or `new` |
| **proposer** | Creates an issue (`skill-proposal` label) + Project item: `Pipeline Status=proposed`, `Keep=?`, `Intake Source=skill-sourcer`, `Build Status=not-started`, `Artifact=issue-only` |

### `/skill-publish` — for already-built artifacts (SKILL.md path / GitHub URL / pasted content)

Skips the extractor (the SKILL.md is the extract) and runs 3 subagents in sequence — `classifier`, `deduplicator`, `proposer` — sharing the same agent files via `skills/6-engineer/skill-sourcer/agents/`. Differences from `/skill-sourcer`:

- The SKILL.md's `category:` frontmatter is passed to the classifier as a **prior** (confirm or override).
- The proposer sets `Intake Source=skill-publish` and `Artifact=skill-md-only`, prompts for `Build Status` (`ready-to-ship` / `shipped` / `testing`) since the skill is already built, and writes `**Built via**: skill-publish` plus a `**Built Skill URL**:` line into the issue body.

### On approval (`Keep=yes`, either intake)

- Project item updated to `Pipeline Status=approved`
- `triage-ready` label added to the issue — signal for `/skill-triager`
- Optional spec md committed at `zynkr-skill-idea/skills/approved/{slug}.md`

---

## Gate 2 — Build & Ship

**Repo:** [`zynkr-skill-builder`](https://github.com/peter-tu-zynkr/zynkr-skill-builder)

### Folder structure

```
skills/
  [N]-[category]/
    [skill-slug]/
      SKILL.md          ← orchestrator or standalone skill
      agents/
        [agent].md      ← subagents (each needs same 6 required fields)
```

### Required SKILL.md frontmatter

```yaml
name: skill-name
description: "One-line trigger description"
category: brand-marketing        # see taxonomy below
project: skill-slug
platform: claude
status: Done                     # Done | WIP | Not started | Pause | Out dated
author: Peter Tu
input: "What the user provides"
process: "What the skill does"
output: "What gets produced"
synergy: []
upstream_repo: vercel-labs/agent-browser   # optional: owner/repo of the original third-party source
```

`upstream_repo` is an optional field for skills sourced from external GitHub repos. It is `owner/repo` format only (no full URL). Omit it for internally authored skills.

**Rules that cause ingest to skip a file:**
- Missing any of: `name`, `category`, `project`, `platform`, `status`, `author`
- `category` not in the canonical 10 values (never `sales` → use `sales-consultant`)
- `status` not exactly matching allowed values
- `description` value containing `:` without being quoted

### Taxonomy

| # | Category key | Use for |
|---|---|---|
| 0 | `strategy` | Vision, OKRs, decisions |
| 1 | `brand-marketing` | Content, copywriting, social |
| 2 | `sales-consultant` | Sales, proposals, CRM |
| 3 | `operations` | SOPs, project tracking |
| 4 | `training` | Courses, transcripts, onboarding |
| 5 | `product` | Roadmap, UX, GTM, product analytics |
| 6 | `engineer` | Platform, infra, automation, data, tooling |
| 7 | `people-talent` | Recruiting, HR, org design |
| 8 | `finance-admin` | Budgeting, invoicing |
| 9 | `legal` | Contracts, compliance |

---

## CI/CD — `ingest-skills.yml`

**Trigger:** push to `main` where `skills/**` changed, or `workflow_dispatch`

**Steps:**
```
npm ci (in scripts/)
  ↓
ingest.ts "$GITHUB_WORKSPACE/skills"
  → scans skills/ locally (two-level category/project scan)
  → writes content/skills/*.md (with firstSeen preserved on re-ingest)
  → fetches GitHub API for any skill with upstream_repo set
      → appends githubStars to generated/skills.json
  → writes generated/skills.json
  ↓
build-marketplace.ts
  → reads generated/skills.json
  → passes upstream_repo, github_stars, first_seen into both index + detail JSON
  → writes generated/skills-index.json + generated/skills-detail.json
  ↓
git commit + push → generated/ committed back to main
```

No PAT needed — `GITHUB_TOKEN` with `contents: write` covers everything. The same token is used as the GitHub API `Authorization` header for star fetches (avoids the 60 req/hr unauthenticated limit).

### Source attribution fields in generated JSON

| Field | Where | Description |
|---|---|---|
| `upstream_repo` | index + detail | `owner/repo` of the original third-party source |
| `github_stars` | index + detail | Star count fetched from GitHub API at ingest time |
| `first_seen` | index + detail | ISO date the skill was first ingested; preserved on re-ingest |
| `github_url` | detail only | Direct link to the source file in the hosting repo |

---

## FE — `zynkr.ai/ai-skills-marketplace`

**File:** [`ai-skills-marketplace.html`](https://github.com/peter-tu-zynkr/zynkr-website/blob/main/ai-skills-marketplace.html)

Fetches live on every page load — no Vercel redeploy needed. Phase 1 (shipped 2026-05-12) hits Vercel + Supabase first, with the raw-GitHub URLs as a fallback for the ~2-week stabilisation window:

```javascript
// Primary: Vercel Functions backed by the Supabase read mirror
const SKILLS_INDEX_URL = '/api/skills';
const SKILLS_DETAIL_URL = '/api/skills/details';

// Fallback (to be removed after ~2 weeks of clean /api/skills* logs)
const FALLBACK_INDEX_URL = 'https://raw.githubusercontent.com/peter-tu-zynkr/zynkr-skill-builder/main/generated/skills-index.json';
const FALLBACK_DETAIL_URL = 'https://raw.githubusercontent.com/peter-tu-zynkr/zynkr-skill-builder/main/generated/skills-detail.json';
```

After each ingest run, `ingest-skills.yml` POSTs `generated/skills-detail.json` to the sync webhook (HMAC-SHA-256 signed) so the Supabase mirror reflects the latest push. The raw-GitHub fallback still serves stale-but-correct data if the API or DB is down. GitHub CDN caches raw URLs for ~5 minutes.

---

## End-to-End Timing

| Step | Trigger | Latency |
|---|---|---|
| Push SKILL.md to `main` | Manual | — |
| `ingest-skills.yml` runs | Auto | ~1–2 min |
| `generated/*.json` committed | Auto | end of CI |
| FE reflects on next hard refresh | Auto | up to 5 min (CDN cache) |

**Total: ~5–7 minutes from push to live.**
