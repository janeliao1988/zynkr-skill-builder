# New-Section-Doc Template — nested `Zynkr Support KB`

The KB is **nested**: one Google Doc per section, all inside folder
`1LpymoVhy4YrxDBi81Sw6CRQQbZAiSLQ6`, routed by `Zynkr Support KB — 00 INDEX & Retrieval Map`
(ID `1YeOBZqoX98IHENN_rW7rvrqgHjFwZETXjRPShHBE-EE`). You don't create the whole KB anymore — the
docs already exist. You only use this template when an approved entry has an intent with **no
section doc yet** (Step 5d).

## How the anchors work

Each section doc ends with one anchor line `<!-- ▼APPEND:<intent>▼ -->`. To add an entry, run
`find_and_replace_doc` on that doc with `find_text` = the anchor and `replace_text` = `<your entry>`
+ the same anchor (so it stays at the bottom for next time). The `01 Core Facts` doc uses
`<!-- ▼APPEND:core-facts▼ -->`. The INDEX doc carries `<!-- ▼REGISTER-SECTION▼ -->` where new
sections get registered.

> Anchor lines are intentionally visible plain text — harmless markers that make appends index-free.
> Don't delete them. Import section docs as **plain text** (`source_format="txt"`) so `##` / `<!-- … -->`
> stay literal rather than being converted to Doc styles.

## Creating a new section doc (Step 5d)

1. Pick the next number `<NN>` (after the highest existing one), a `<Title>`, and the `<intent>` tag.
2. Fill the template body below and create the doc:
   ```
   mcp__google-workspace__import_to_google_doc(
     file_name="Zynkr Support KB — <NN> <Title>",
     content=<filled template>,
     source_format="txt",
     folder_id="1LpymoVhy4YrxDBi81Sw6CRQQbZAiSLQ6")
   ```
   (Fallback if unavailable: `create_doc(...)` then `update_drive_file(add_parents="1LpymoVhy4YrxDBi81Sw6CRQQbZAiSLQ6")`.)
3. **Register it in the INDEX** — `find_and_replace_doc` on the INDEX doc:
   - `find_text`: `<!-- ▼REGISTER-SECTION▼ -->`
   - `replace_text`: `| \`<intent>\` | <NN> <Title> | <new-doc-id> | <covers> | <aliases> |\n<!-- ▼REGISTER-SECTION▼ -->`
   - Also paste that same row into the visible "Intent → Section-Doc routing table" so a human
     reading the INDEX sees it.
4. Add the category to `references/intent-taxonomy.md` (with the new doc ID) so it's first-class.
5. Then append the actual entry into the new doc's `<!-- ▼APPEND:<intent>▼ -->` anchor (Step 5b).

## Section-doc template body (everything between the rules)

---

```
Zynkr Support KB — <NN> <Title>

Part of the nested Zynkr Support KB. READ by /zynkr-support, WRITTEN by /zynkr-kms.
This doc holds the "<Title>" section only (anchor intent: <intent>). Canonical numbers live once in "Zynkr Support KB — 01 Core Facts"; Q&A entries here CITE them (Cites: FACT:<id>) instead of restating numbers.
Routing: /zynkr-support resolves an inquiry's intent → this doc via "Zynkr Support KB — 00 INDEX & Retrieval Map".
Do not hand-edit the ▼ anchor line — /zynkr-kms uses it to append/update. zh-TW default, bilingual keywords.

========================================================================

## <Title>

<!-- ▼APPEND:<intent>▼ -->
```

---

## The nested doc set (snapshot 2026-06-06)

| Doc | Doc ID | Anchor |
|---|---|---|
| 00 INDEX & Retrieval Map | `1YeOBZqoX98IHENN_rW7rvrqgHjFwZETXjRPShHBE-EE` | `<!-- ▼REGISTER-SECTION▼ -->` |
| 01 Core Facts | `1R8JoTiIihh4h7Yk3P2GlIgOIzbgSWMNkIzFcmWOzvb0` | `core-facts` |
| 02 Pricing & Quoting | `1iYncrIpUWci2sfPnLDgLm2UHETX5ZXpO93t886ab2EI` | `pricing-quoting` |
| 03 Course Content & Curriculum | `1Gs2TOjdEOT891TIp9Y69sSfMU5lYyJeExpaIEhO0eTI` | `course-content` |
| 04 Scheduling & Logistics | `1To4umb0OTVnF9w2yTQox4MG7vquMzOgguLLK7ZWz78w` | `scheduling-logistics` |
| 05 Team Training & Enterprise | `1d-DBf57d9FXA6YGPM6KetYpaaNN5vUJDy6OBjri4pGE` | `team-training-enterprise` |
| 06 Technical How-To | `1zdi2gvu_kyPOv2nYQ-56p8UTapnD6DtpBPv4Pp-ZtCQ` | `technical-howto` |
| 07 Access & Account | `1j-mHGvFhtWT3Lf6YQIS1Uj4ozqf6uD1TD4N4wCJxiSo` | `access-account` |
| 08 Refunds & Policy | `1WZ6BpuE-zuGUIMANU70VIrvLuaNR-ZHq_RPSMDMPOMg` | `refund-policy` |
| 09 Other | `1ybCHI2afBDuD4qwF8y8QKnH8pryxlSdUG4d04BbLVkY` | `other` |
| 10 Instructor Profile | `1UaLcJrCa2lzn1j3xoUyhBDpIRKqQUCCFzShL4xirrys` | `instructor-profile` |
| 11 Brand & Product Vision | `1_rc1go2pqTILElBi-DKbDwOU7xg3ODarh535cc7N6BE` | `brand-product-vision` |
| 12 AI Workflow Architecture | `1WukW2HHv6r1TvOR2W0yJYEbtVJONT97kbW6Y24cagAA` | `ai-workflow-architecture` |

> The old single `Zynkr Support KB` monolith was split into the docs above on 2026-06-06 and renamed
> `[SUPERSEDED — nested 2026-06-06] Zynkr Support KB (monolith)` (ID
> `1FYJWM2i3-xheHv9sBlZKsHGJacR58CjfC41UeqzlTno`). It's a read-only rollback — never write to it.
