#!/usr/bin/env tsx
import path from "path";
import {
  appendSheetRows,
  buildApprovedAppendRows,
  parseArgs,
  readCsvTable,
  readSheetRange,
  requireFlag,
  writeCsvTable,
} from "./review-pipeline-lib.js";

function usage(): never {
  throw new Error(
    [
      "Usage:",
      "  tsx sheet-sync.ts export --spreadsheet-id <id> --range <Sheet!A1:Z> --output <path>",
      "  tsx sheet-sync.ts append --spreadsheet-id <id> --range <Sheet!A1> --input <csv> [--skip-header]",
      "  tsx sheet-sync.ts append-approved --spreadsheet-id <id> --range <Sheet!A1> --input <review.csv> --columns \"Col A,Col B,...\" [--include-header]",
    ].join("\n")
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (!command) usage();

  if (command === "export") {
    const spreadsheetId = requireFlag(args, "spreadsheet-id");
    const range = requireFlag(args, "range");
    const output = path.resolve(requireFlag(args, "output"));
    const rows = await readSheetRange(spreadsheetId, range);
    const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const headers = rows[0] ?? [];
    const body = rows.slice(1).map((row) =>
      Array.from({ length: width }, (_, index) => row[index] ?? "")
    );
    writeCsvTable(output, headers, body);
    console.log(JSON.stringify({ output, rows: rows.length }, null, 2));
    return;
  }

  if (command === "append") {
    const spreadsheetId = requireFlag(args, "spreadsheet-id");
    const range = requireFlag(args, "range");
    const input = path.resolve(requireFlag(args, "input"));
    const table = readCsvTable(input);
    const skipHeader = Boolean(args.flags["skip-header"]);
    const rows = skipHeader
      ? table.rows.map((row) => table.headers.map((header) => row[header] ?? ""))
      : [table.headers, ...table.rows.map((row) => table.headers.map((header) => row[header] ?? ""))];
    await appendSheetRows(spreadsheetId, range, rows);
    console.log(JSON.stringify({ appendedRows: rows.length, input }, null, 2));
    return;
  }

  if (command === "append-approved") {
    const spreadsheetId = requireFlag(args, "spreadsheet-id");
    const range = requireFlag(args, "range");
    const input = path.resolve(requireFlag(args, "input"));
    const columns = requireFlag(args, "columns")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const includeHeader = Boolean(args.flags["include-header"]);
    const { headers, rows } = buildApprovedAppendRows(input, columns);
    const payload = includeHeader ? [headers, ...rows] : rows;
    await appendSheetRows(spreadsheetId, range, payload);
    console.log(JSON.stringify({ appendedRows: payload.length, input, range }, null, 2));
    return;
  }

  usage();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
