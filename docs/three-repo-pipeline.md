# Three-Repo Skill Pipeline

This repo is the production catalog layer for the Zynkr skill system.

```text
product-ideas
-> zynkr-skills
-> zynkr-skill-directory
-> zynkr.ai
```

## Stage 1: product-ideas

Purpose:
- capture raw skill and product ideas
- research demand, examples, and overlap
- decide whether an idea should be built
- preserve traceability from idea to shipped skill

Output:
- approved issue or spec
- target category and slug
- concise input/process/output
- target path in `zynkr-skills`

This repo should not ingest `product-ideas` directly into production. Ideas must first become real skills.

## Stage 2: zynkr-skills

Purpose:
- author production `SKILL.md` packages
- maintain agents, references, scripts, and templates
- carry catalog metadata in frontmatter
- notify this repo when live skills change

Output:
- validated skill package
- public catalog frontmatter
- `skills-updated` repository dispatch to this repo

Expected public frontmatter:

```yaml
---
name: skill-slug
description: One-sentence user-facing summary
category: brand-marketing
project: skill-slug
platform: claude
status: Done
author: Peter Tu
input: "What the user provides"
process: "What the skill does"
output: "What the user receives"
sourceIdeaId: "product-ideas#123"
visibility: public
---
```

## Stage 3: zynkr-skill-directory

Purpose:
- clone source skill repos
- normalize skill metadata into stable catalog records
- preserve lineage with `sourceRepo` and `sourceFile`
- generate frontend/backend artifacts
- render public directory pages

Output:
- `content/skills/*.md`
- `generated/skills.json`
- `frontend/lib/generated-skills.json`
- deployed website on `zynkr.ai`

## Publication Gates

Do not publish a skill unless:
- the source package exists in `zynkr-skills`
- frontmatter validates against the ingest schema
- category, platform, and status are canonical
- input/process/output are explicit rather than inferred from prompt prose
- private or draft skills are excluded or marked non-public before ingest

## Direction Of Data Flow

Allowed:

```text
product-ideas issue/spec -> zynkr-skills SKILL.md -> generated catalog artifacts
```

Avoid:

```text
directory edits -> source skill changes
idea markdown -> public website without authoring review
frontend parsing raw GitHub repos at runtime
```

## Operational Flow

1. Create or update a skill idea in `product-ideas`.
2. Approve it and define target `zynkr-skills` path.
3. Build or update the skill package in `zynkr-skills`.
4. Merge to `main`.
5. `zynkr-skills` dispatches `skills-updated`.
6. `zynkr-skill-directory` runs `scripts/ingest.ts`.
7. Generated artifacts are committed when changed.
8. The frontend deploys the updated directory.

