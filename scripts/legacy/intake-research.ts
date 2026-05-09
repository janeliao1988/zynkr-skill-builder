#!/usr/bin/env tsx
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildCandidates,
  candidatesToReviewCsvRows,
  createBatchId,
  ensureDir,
  loadCatalogRows,
  loadInventoryRows,
  optionalFlag,
  parseArgs,
  requireFlag,
  reviewHeaders,
  resolveRepoRoot,
  writeCsvTable,
} from "./review-pipeline-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = resolveRepoRoot(__dirname);
const GENERATED_DIR = path.join(ROOT, "generated");

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(requireFlag(args, "input"));
  const reviewPath = optionalFlag(args, "review")
    ? path.resolve(optionalFlag(args, "review")!)
    : undefined;
  const masterPath = optionalFlag(args, "master")
    ? path.resolve(optionalFlag(args, "master")!)
    : undefined;
  const batchId = optionalFlag(args, "batch-id") ?? createBatchId("review");
  const sourceId = optionalFlag(args, "source-id") ?? path.basename(inputPath);

  ensureDir(GENERATED_DIR);

  const inventoryRows = loadInventoryRows(inputPath);
  const existingRows = [
    ...(reviewPath && fs.existsSync(reviewPath) ? loadCatalogRows(reviewPath) : []),
    ...(masterPath && fs.existsSync(masterPath) ? loadCatalogRows(masterPath) : []),
  ];

  const candidates = buildCandidates(inventoryRows, sourceId, batchId, existingRows);

  const jsonPath = path.join(GENERATED_DIR, "review-candidates.json");
  const csvPath = path.join(GENERATED_DIR, "review-candidates.csv");
  fs.writeFileSync(jsonPath, JSON.stringify(candidates, null, 2), "utf8");
  writeCsvTable(csvPath, reviewHeaders(), candidatesToReviewCsvRows(candidates));

  const counts = candidates.reduce(
    (acc, candidate) => {
      acc.total += 1;
      acc[candidate.dedupeStatus] += 1;
      return acc;
    },
    { total: 0, exact: 0, likely: 0, new: 0 }
  );

  console.log(
    JSON.stringify(
      {
        batchId,
        sourceId,
        inputPath,
        candidateCount: counts.total,
        exactDuplicates: counts.exact,
        likelyDuplicates: counts.likely,
        newRows: counts.new,
        jsonPath,
        csvPath,
      },
      null,
      2
    )
  );
}

main();
