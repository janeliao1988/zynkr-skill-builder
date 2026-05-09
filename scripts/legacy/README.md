# Legacy Scripts

These files are from the Google Sheets intake/review workflow used prior to 2026-04. They are not part of the active ingest pipeline and are not called by any CI workflow.

| File | Original purpose |
|---|---|
| `review-pipeline-lib.ts` | CSV parsing, dedup logic, batch ID generation, Google Sheets integration |
| `sheet-sync.ts` | Export/append data to Google Sheets |
| `intake-research.ts` | CLI for building review candidate batches from inventory CSVs |

The active pipeline is: `ingest.ts` → `build-marketplace.ts` → `generated/*.json`
