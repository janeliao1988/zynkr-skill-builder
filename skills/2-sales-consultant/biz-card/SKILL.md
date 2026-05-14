---
name: biz-card
description: "7-phase business card pipeline — OCR extraction, schema normalization, Google Sheet CRM logging, company research, and personalized follow-up email drafting."
category: business-consulting
project: biz-card
platform: claude
status: Done
author: Peter Tu
input: "Business card image(s) — single or batch"
process: "OCR via Claude Vision → schema normalization → user review → Google Sheet append → company research → follow-up email draft → Gmail save"
output: "CRM row in Google Sheet + personalized follow-up email saved to Gmail Drafts"
synergy: []
---

# Business Card Pipeline

Automate the full post-trade-show workflow: extract contact info from business card images, log to Google Sheets CRM, research the company, and draft a personalized follow-up email.

<!-- SKILL BASE PATH: /Users/petertu/Desktop/Claude/zynkr/6.0 tech/skills/biz-card -->

---

## Step 0 — Load Config

Read the config file at:
`/Users/petertu/Desktop/Claude/zynkr/6.0 tech/skills/biz-card/biz-card-config.md`

Read the contact schema at:
`/Users/petertu/Desktop/Claude/zynkr/6.0 tech/skills/biz-card/references/contact-schema.md`

Store:
- `SHEET_ID` — Google Sheet ID from config
- `SHEET_TAB` — sheet tab name (default: `Contacts`)
- `EMAIL_SIGNATURE` — signature block from config
- `SCHEMA_FIELDS` — the 12-field list: name, title, company, email, phone, mobile, website, address, linkedin, industry, notes, card_date

**If `SHEET_ID` is `TBD`:**
```
⚠️  Google Sheet ID not configured yet.
Please paste the Google Sheet URL or ID before continuing.
```
Wait for user to provide it. Update `SHEET_ID` in memory for this session.

---

## Step 1 — Card Intake

Display:
```
---------------------------------------------
📇 Business Card Pipeline
---------------------------------------------
Phase: Card Intake
---------------------------------------------
```

Ask the user:
```
Please share your business card image(s).
You can paste one image or multiple at once for batch processing.
```

Detect intake mode:
- **Single card** — 1 image → proceed to Step 2
- **Batch** — multiple images → process all in Step 2, then review all at once in Step 3

Store images as `CARD_IMAGES[]`.

---

## Step 2 — OCR & Extract

Display:
```
---------------------------------------------
Extracting contact info from card(s)...
---------------------------------------------
```

For each card image, use Claude Vision to extract all visible text and map it to the 12-field schema:

**Extraction rules:**
- Read every element on the card: name, title, company, logos, contact details, addresses, URLs, QR code domain (if visible), social handles
- Map each piece of data to the correct schema field
- If a field is not present on the card, set it to `—`
- For `industry`: infer from company name/website if not explicitly stated; use a short label (e.g., "SaaS", "製造業", "零售", "FinTech")
- For `card_date`: default to today's date unless user specifies otherwise
- If text is ambiguous (e.g., could be phone or fax), use field label context clues on the card

Store extracted data as `CONTACTS[]` — one object per card with all 12 fields.

---

## Step 3 — Schema Review

Display:
```
---------------------------------------------
Review Extracted Contact Info
---------------------------------------------
```

For each contact, display a clean table:

```
| Field      | Extracted Value |
|------------|-----------------|
| name       | [value]         |
| title      | [value]         |
| company    | [value]         |
| email      | [value]         |
| phone      | [value]         |
| mobile     | [value]         |
| website    | [value]         |
| address    | [value]         |
| linkedin   | [value]         |
| industry   | [value]         |
| notes      | [value]         |
| card_date  | [value]         |
```

For batch mode, display all contacts in a numbered list (`Contact 1 of N`, etc.).

Ask:
```
Does this look correct?
- Type [OK] to proceed
- Type [EDIT field=value] to correct a field (e.g., EDIT email=david@company.com)
- Type [ADD note=...] to append to the notes field
```

Accept corrections until user types `OK`. Update `CONTACTS[]` with confirmed data.

---

## Step 3.5 — Website Lookup (auto-fill if missing)

For each contact where `website` is `—` or blank:

Run a WebSearch query: `"[company name]" official website`

Parse the top result for the company's official domain. Apply these rules:
- Accept only the company's own domain (skip directories like twincn.com, iyp.com.tw, etc.)
- If a clear official site is found, set `website` to the full URL (e.g., `https://example.com`)
- If no clear official site found, leave `website` as `—`

Display the result inline (no separate confirmation step needed):
```
🌐 Website found: [URL] (auto-filled)
```
or:
```
🌐 Website: not found — left blank
```

Update `CONTACTS[]` with the resolved website before proceeding to Sheet Write.

---

## Step 4 — Google Sheet Write

Display:
```
---------------------------------------------
Writing to Google Sheet CRM...
---------------------------------------------
```

### 4a — Verify sheet and header row

Use `mcp__google-workspace__read_sheet_values` to read row 1 (A1:L1):
- `user_google_email`: `<your-google-workspace-account>`
- `spreadsheet_id`: `SHEET_ID`
- `range`: `[SHEET_TAB]!A1:L1`

If the header row is missing or empty, write it first using `mcp__google-workspace__modify_sheet_values`:
- `range`: `[SHEET_TAB]!A1:L1`
- `values`: `[["name","title","company","email","phone","mobile","website","address","linkedin","industry","notes","card_date"]]`

### 4b — Append contact row(s)

For each confirmed contact in `CONTACTS[]`, append a row using `mcp__google-workspace__modify_sheet_values`:
- `user_google_email`: `<your-google-workspace-account>`
- `spreadsheet_id`: `SHEET_ID`
- `range`: `[SHEET_TAB]!A:L`
- `value_input_option`: `USER_ENTERED`
- `insert_data_option`: `INSERT_ROWS`
- `values`: `[[name, title, company, email, phone, mobile, website, address, linkedin, industry, notes, card_date]]`

Display confirmation:
```
✓ [Contact Name] @ [Company] — added to Google Sheet
```

---

## Step 5 — Company Research

Display:
```
---------------------------------------------
Researching Company...
---------------------------------------------
[Company Name]
```

For each contact, run 3 WebSearch queries in sequence:

1. **Company overview**: `"[company name]" company overview products services`
2. **Recent news**: `"[company name]" news 2024 OR 2025`
3. **Industry context**: `[industry] Taiwan market trends 2025` (or adjust region based on company location)

Synthesize the search results into a `RESEARCH_SUMMARY` for each contact:

```
## Company: [Company Name]

### Overview
[2–3 sentences: what they do, business model, size/stage]

### Recent News
- [key item 1]
- [key item 2]

### Personalization Hook
[The single most relevant/interesting detail to reference in the follow-up email]
```

Display the research summary to the user. Ask:
```
Research looks good? [OK] or [EDIT] to add/change context.
```

---

## Step 6 — Follow-up Email Draft

Display:
```
---------------------------------------------
Drafting Follow-up Email...
---------------------------------------------
[Contact Name] @ [Company]
```

For each contact, launch the `followup-email-writer` agent using the Agent tool.

Pass the following in the prompt:
```
## Contact Info
[all 12 fields from CONTACTS[i]]

## Company Research Summary
[RESEARCH_SUMMARY for this contact]

## Meeting Context
[CONTACTS[i].notes — or "No specific notes" if empty]

## Language
[Detect from card: if Chinese characters on card → zh-TW; otherwise → en]

## Email Signature
[EMAIL_SIGNATURE from config]
```

Wait for the agent to complete. Display the drafted email.

Ask:
```
Email looks good?
- [OK] → save to Gmail Drafts
- [SEND] → send immediately
- [EDIT subject=...] / [EDIT body=...] → adjust the email
- [SKIP] → skip this contact's email
```

Accept edits until user approves.

---

## Step 7 — Save to Gmail Drafts / Send

For each approved email:

**If user chose [OK] (save as draft):**
Use `mcp__gmail__draft_email`:
- `to`: contact email from `CONTACTS[i]`
- `subject`: subject line from agent output
- `body`: email body from agent output
- `from`: `<your-google-workspace-account>`

**If user chose [SEND]:**
Use `mcp__gmail__send_email`:
- `to`: contact email from `CONTACTS[i]`
- `subject`: subject line from agent output
- `body`: email body from agent output
- `from`: `<your-google-workspace-account>`

Display confirmation per contact:
```
✓ [Contact Name] — email saved to Drafts / sent
```

---

## Step 8 — Pipeline Summary

Display final completion summary:

```
=============================================
📇 Business Card Pipeline — Complete
=============================================

Processed: [N] contact(s)

[Contact 1 Name] @ [Company]
  ✓ CRM row added to Google Sheet
  ✓ Email drafted / sent

[Contact 2 Name] @ [Company]
  ✓ CRM row added to Google Sheet
  ✓ Email saved to Drafts
  ...

Google Sheet: https://docs.google.com/spreadsheets/d/[SHEET_ID]
=============================================
```

---

## Progress Indicator

Show this line at the top of each phase:

```
📇 Intake → Extract → Review → Website → Sheet → Research → Email → Done
```

Use `▶` for current phase, `✓` for completed, `○` for upcoming.

---

## Error Handling

- If OCR fails to extract a field: mark it `?` and flag it in the review table
- If Google Sheet write fails: display the error and offer to retry or skip
- If WebSearch returns no results: note "No recent news found" and proceed to email with overview only
- If Gmail draft/send fails: display the error; offer to copy email text to clipboard instead
- Never silently skip a step — always surface errors clearly
