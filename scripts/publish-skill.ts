#!/usr/bin/env tsx
/**
 * publish-skill.ts
 *
 * Sibling to ingest-from-issue.ts. Writes a USER-AUTHORED SKILL.md into
 * skills/<N-category>/<slug>/SKILL.md from a publish dispatch fired by
 * /skill-publish (or workflow_dispatch for manual / local runs).
 *
 * The big difference from ingest-from-issue.ts:
 *   ingest-from-issue.ts ── scaffolds a stub or lift-and-shifts an upstream README.
 *   publish-skill.ts     ── lands a SKILL.md the user has already authored.
 *
 * Inputs (env or CLI flags):
 *   ISSUE_NUMBER / --issue          GitHub issue # in the idea repo (for back-comment + PR body)
 *   ISSUE_REPO   / --repo           default: peter-tu-zynkr/zynkr-skill-idea
 *   SLUG         / --slug           kebab-case skill slug
 *   CATEGORY     / --category       digit 0-9 or canonical slug
 *   SKILL_MD_URL / --skill-md-url   raw/blob URL to fetch a single SKILL.md from
 *   SKILL_MD_B64 / --skill-md-b64   inline base64-encoded SKILL.md content (single-file mode)
 *   BUNDLE_B64   / --bundle-b64     inline base64-encoded gzipped tarball of the whole skill folder
 *                                   (multi-file mode — SKILL.md + references/ + scripts/ + assets/)
 *
 * Exactly one of SKILL_MD_URL, SKILL_MD_B64, or BUNDLE_B64 must be set.
 *
 * Bundle format: `tar -czf - -C <parent> <slug>/` then base64. The tarball must
 * contain a top-level directory matching the slug, with SKILL.md inside. The
 * script extracts the whole folder verbatim, so any references/, scripts/, or
 * assets/ subfolders ride along.
 *
 * Size note: GitHub repository_dispatch caps client_payload at ~64 KB. Gzipped
 * markdown typically lands at 25-35% of original, so most multi-file skills fit.
 * If a bundle is too large, fall back to: push the folder to a branch by hand,
 * then dispatch with SKILL_MD_B64 of just SKILL.md (the workflow's idempotency
 * check will refuse to overwrite — instead pre-push the whole folder on the
 * `skill/<slug>` branch and skip the dispatch entirely).
 *
 * Outputs the relative path of the new SKILL.md on stdout's last line —
 * the wrapping workflow reads it for commit + PR title (same contract as
 * ingest-from-issue.ts).
 *
 * Idempotency: refuses to overwrite an existing file. The publish flow
 * assumes a single authoritative artifact per slug; updates should go
 * through a normal PR, not a re-dispatch.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");

// Numeric prefix → on-disk folder name. Kept in lockstep with ingest-from-issue.ts.
const FOLDER_BY_NUMBER: Record<string, string> = {
  "0": "0-strategy",
  "1": "1-brand-marketing",
  "2": "2-sales-consultant",
  "3": "3-operations",
  "4": "4-training",
  "5": "5-product",
  "6": "6-engineer",
  "7": "7-people-talent",
  "8": "8-finance-admin",
  "9": "9-legal",
};

const NUMBER_BY_SLUG: Record<string, string> = {
  strategy: "0",
  "brand-marketing": "1",
  "sales-consultant": "2",
  "business-consulting": "2",
  operations: "3",
  training: "4",
  product: "5",
  engineer: "6",
  "people-talent": "7",
  "talent-development": "7",
  people: "7",
  "finance-admin": "8",
  legal: "9",
};

type Args = {
  issueNumber: string;
  issueRepo: string;
  slug: string;
  category: string;
  skillMdUrl?: string;
  skillMdB64?: string;
  bundleB64?: string;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const args: Args = {
    issueNumber: get("--issue") ?? process.env.ISSUE_NUMBER ?? "",
    issueRepo: get("--repo") ?? process.env.ISSUE_REPO ?? "peter-tu-zynkr/zynkr-skill-idea",
    slug: get("--slug") ?? process.env.SLUG ?? "",
    category: get("--category") ?? process.env.CATEGORY ?? "",
    skillMdUrl: get("--skill-md-url") ?? process.env.SKILL_MD_URL,
    skillMdB64: get("--skill-md-b64") ?? process.env.SKILL_MD_B64,
    bundleB64: get("--bundle-b64") ?? process.env.BUNDLE_B64,
  };
  const missing = (["issueNumber", "slug", "category"] as const).filter((k) => !args[k]);
  if (missing.length) {
    console.error(`Missing required args: ${missing.join(", ")}`);
    console.error("See header comment for usage.");
    process.exit(2);
  }
  const sources = [args.skillMdUrl, args.skillMdB64, args.bundleB64].filter((v) =>
    Boolean(v?.trim())
  );
  if (sources.length !== 1) {
    console.error(
      "Exactly one of --skill-md-url, --skill-md-b64, or --bundle-b64 must be provided " +
        "(or their env-var equivalents). Got: " +
        sources.length
    );
    process.exit(2);
  }
  return args;
}

function resolveCategory(input: string): { number: string; folder: string } {
  const trimmed = input.trim().toLowerCase();
  let digit: string | undefined;
  if (/^\d$/.test(trimmed)) {
    digit = trimmed;
  } else if (/^\d-/.test(trimmed)) {
    digit = trimmed.charAt(0);
  } else {
    digit = NUMBER_BY_SLUG[trimmed];
  }
  if (!digit)
    throw new Error(
      `Unknown category: "${input}". Expected digit 0-9, known slug, or "N-slug" combined form.`
    );
  const folder = FOLDER_BY_NUMBER[digit];
  if (!folder) throw new Error(`No on-disk folder for category number ${digit}.`);
  return { number: digit, folder };
}

/**
 * Extract a base64-encoded gzipped tarball into the parent directory of
 * targetDir. The tarball's top-level entry must match `args.slug` (the on-disk
 * folder name). After extraction, targetDir must exist and contain a SKILL.md.
 *
 * Uses system `tar` for portability — same shape `pickup-approved-issue.yml`
 * already relies on (ubuntu-latest has BSD-compatible tar with -z).
 */
function extractBundle(bundleB64: string, targetDir: string, slug: string): void {
  const parentDir = path.dirname(targetDir);
  fs.mkdirSync(parentDir, { recursive: true });

  // Decode the base64 → binary tarball through Node, so behavior is identical
  // on macOS (base64 -D) and Linux (base64 --decode). Write to a temp .tgz
  // that system `tar` can list and extract.
  const tmpTar = path.join(parentDir, `.bundle-${slug}.tgz`);
  try {
    fs.writeFileSync(tmpTar, Buffer.from(bundleB64.trim(), "base64"));

    // Inspect the tarball to confirm the top-level entry is the slug folder.
    const listing = execSync(`tar -tzf ${JSON.stringify(tmpTar)}`, { encoding: "utf-8" });
    const topLevels = new Set(
      listing
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split("/")[0])
    );
    if (!topLevels.has(slug)) {
      throw new Error(
        `Bundle's top-level directory does not match slug "${slug}". ` +
          `Top-level entries: ${[...topLevels].join(", ")}. ` +
          `Build the tarball with: tar -czf - -C <parent-of-slug-dir> ${slug}/`
      );
    }
    if (topLevels.size > 1) {
      throw new Error(
        `Bundle contains multiple top-level entries (${[...topLevels].join(", ")}). ` +
          `Tar only the slug folder: tar -czf - -C <parent> ${slug}/`
      );
    }

    // Extract into parent — the tarball already carries the slug folder as
    // its root, so this lands content at <parentDir>/<slug>/...
    execSync(`tar -xzf ${JSON.stringify(tmpTar)} -C ${JSON.stringify(parentDir)}`);

    const skillMd = path.join(targetDir, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
      throw new Error(
        `Bundle extracted but SKILL.md not found at ${path.relative(ROOT, skillMd)}. ` +
          `Every published bundle must contain SKILL.md at its root.`
      );
    }
  } finally {
    // Clean up temp file regardless of success/failure.
    if (fs.existsSync(tmpTar)) fs.unlinkSync(tmpTar);
  }
}

function fetchContent(args: Args): string {
  if (args.skillMdB64) {
    try {
      return Buffer.from(args.skillMdB64, "base64").toString("utf-8");
    } catch (err) {
      throw new Error(`Failed to decode SKILL_MD_B64: ${(err as Error).message}`);
    }
  }
  // skillMdUrl path. Normalise GitHub blob URLs to raw form before fetch.
  let url = args.skillMdUrl!.trim();
  const blob = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)$/i);
  if (blob) {
    url = `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}`;
  }
  try {
    // Use gh api for github.com hosts so private repos work; curl otherwise.
    if (/^https:\/\/raw\.githubusercontent\.com\//.test(url)) {
      // gh api can fetch raw from private repos but requires the repos/.../contents path.
      // Easiest: try plain fetch via curl with the gh auth token.
      const ghToken =
        execSync(`gh auth token 2>/dev/null || true`, { encoding: "utf-8" }).trim() || "";
      const headerArg = ghToken ? `-H "Authorization: Bearer ${ghToken}"` : "";
      const out = execSync(`curl -fsSL ${headerArg} ${JSON.stringify(url)}`, {
        encoding: "utf-8",
      });
      return out;
    }
    const out = execSync(`curl -fsSL ${JSON.stringify(url)}`, { encoding: "utf-8" });
    return out;
  } catch (err) {
    throw new Error(`Failed to fetch SKILL.md from ${url}: ${(err as Error).message}`);
  }
}

function main() {
  const args = parseArgs();
  const cat = resolveCategory(args.category);
  const targetDir = path.join(SKILLS_DIR, cat.folder, args.slug);
  const targetFile = path.join(targetDir, "SKILL.md");
  const relTarget = path.relative(ROOT, targetFile);

  if (fs.existsSync(targetFile)) {
    console.error(
      `Refusing to overwrite existing file at ${relTarget}. ` +
        `Publish is one-shot per slug; subsequent updates should go through a normal PR.`
    );
    process.exit(3);
  }

  if (args.bundleB64?.trim()) {
    // Multi-file mode — extract the tarball, then sanity-check SKILL.md.
    extractBundle(args.bundleB64, targetDir, args.slug);
    const content = fs.readFileSync(targetFile, "utf-8");
    if (!content.trim().startsWith("---")) {
      console.error(
        "Extracted SKILL.md does not look valid (missing YAML frontmatter). Aborting."
      );
      process.exit(4);
    }
    // Count what landed so the workflow log has a clear summary.
    const files = listFilesRecursive(targetDir);
    console.log(`Wrote bundle to ${path.relative(ROOT, targetDir)} (${files.length} files):`);
    for (const f of files) console.log(`  ${path.relative(ROOT, f)}`);
  } else {
    // Single-file mode — fetch and write just SKILL.md (unchanged behavior).
    const content = fetchContent(args);
    if (!content.trim().startsWith("---")) {
      console.error(
        "Fetched content does not look like a SKILL.md (missing YAML frontmatter). Aborting."
      );
      process.exit(4);
    }
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(targetFile, content, "utf-8");
    console.log(`Wrote ${relTarget} (${content.length} bytes)`);
  }

  console.log(`Source issue: ${args.issueRepo}#${args.issueNumber}`);
  // Last line of stdout is the relative path of SKILL.md — the workflow reads this.
  console.log(relTarget);
}

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out.sort();
}

main();
