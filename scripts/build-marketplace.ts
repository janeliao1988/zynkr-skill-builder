#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildMarketplaceArtifacts,
  loadNormalizedSkills,
  writeMarketplaceArtifacts,
} from "./marketplace-lib.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GENERATED_SKILLS_PATH = path.join(ROOT, "generated", "skills.json");
const GENERATED_DIR = path.join(ROOT, "generated");
const WEBSITE_DATA_DIR = path.resolve(ROOT, "..", "zynkr-website-fe", "data");
export function syncMarketplaceArtifacts(): void {
  if (!fs.existsSync(GENERATED_SKILLS_PATH)) {
    throw new Error(`Missing normalized skills artifact: ${GENERATED_SKILLS_PATH}`);
  }

  const CANONICAL_REPO_URL = "https://github.com/peter-tu-zynkr/zynkr-skill-builder";
  const PUBLISH_ONLY_DONE = process.env.PUBLISH_ONLY_DONE === "1";

  const allSkills = loadNormalizedSkills(GENERATED_SKILLS_PATH).map(skill => ({
    ...skill,
    sourceRepo: CANONICAL_REPO_URL,
    sourceFile: skill.sourceFile ? `skills/${skill.sourceFile}` : skill.sourceFile,
  }));

  const normalizedSkills = PUBLISH_ONLY_DONE
    ? allSkills.filter(skill => skill.status === "Done")
    : allSkills;

  if (PUBLISH_ONLY_DONE) {
    const hidden = allSkills.length - normalizedSkills.length;
    if (hidden > 0) console.log(`  → PUBLISH_ONLY_DONE=1: hiding ${hidden} non-Done skill(s) from marketplace`);
  }

  const artifacts = buildMarketplaceArtifacts(normalizedSkills);

  writeMarketplaceArtifacts(GENERATED_DIR, artifacts);

  if (fs.existsSync(path.dirname(WEBSITE_DATA_DIR))) {
    writeMarketplaceArtifacts(WEBSITE_DATA_DIR, artifacts);
  }

  console.log(`  → generated/skills-index.json updated (${artifacts.index.length} published skills total)`);
  console.log(`  → generated/skills-detail.json updated`);

  if (fs.existsSync(path.dirname(WEBSITE_DATA_DIR))) {
    console.log(`  → ../zynkr-website-fe/data synchronized`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncMarketplaceArtifacts();
}
