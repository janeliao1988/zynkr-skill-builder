# LOB ↔ Cloud Folder ↔ Local Path Map

Canonical mapping used by the `admin-governance` skill. Update this file when:
- A new LOB is added
- A cloud folder is renamed/moved (ID stays the same — should be rare)
- The local repo layout changes

Source of truth: established 2026-05-27 by the local↔cloud governance work (see Zynkr CLAUDE.md `Knowledge Governance` if present, otherwise the strategy v2 doc).

## Mapping

| LOB | Local path (under `~/Desktop/Claude/zynkr/`) | Cloud folder ID(s) | Cloud folder name | Notes |
|---|---|---|---|---|
| 0 | `0 strategy-planning/` | `11LFipvdXLn-qgLSSVdtS8wqpYEfFFNBq` | `[0] Core knowledge & Strategy` | Cloud canonical |
| 1.0 | `1.0 brand-marketing/` | `13Brg4QCuPlEdHh5mA7dvjxXlud4BvqFx` | `[1.0] 品牌與行銷部門` | SPLIT — cloud for brand assets, local for pipelines |
| 2.0 | `2.0 sales-consultant-offering/` | `1ZapREC_tFSsYSA7BY18GaGDvxb41rIgd` | `[2.0] 業務部門與顧問` | Cloud canonical |
| 3.0 | `3.0 operation/` | `1Y2St1Zaj3j3VS_iiPU_-TcltgR8LuBde` | `[3.0] 營運部門：諮詢案例，行政，流程` | Cloud canonical (most active) |
| 4.0 | `4.0 training-design/` | `1WIu-FdKFs4EF6LLBlGCyaOnWucSCB9A1` | `[4.0] 知識產品專案` | LOCAL canonical for course content; cloud holds delivery artifacts in `[4.1]`–`[4.3]` subfolders (not surveyed deeply yet) |
| 5 (SDLC) | `5.0 product/` | (multiple — see below) | `[5.1]`–`[5.6]` series under Drive root | Cloud canonical for SDLC narrative. No `[5.0]` parent folder — children live at Drive root |
| 7 (People) | `7.0 people/` | `1t8HgbGePw7Dt9KuqBDEKXzGBEkqUkGr2`, `1P71EGNNWDDTQ8gI0II5NfrYHjjojsp8A`, `1VHgwkW_HZPuKnyqLuqiX685SuDx36R4I` | `[7.1] 人資，人力管理 🔒`, `[7.2] 人資，外包商管理 🔒`, `[7.3] Onboarding` | Cloud canonical. Scan all three folders. |
| 8.0 | `8.0 finance-analytics/` | `16Uf0JN5SoS5v7_BUuW7Js5UeH0795Uf6` | `[8.0] 財務 💰` | SPLIT — cloud for data, local for automation code |

## Special: Drive root + `[5.x]` series

Drive root folder ID: `1rqkpNt1NFmRXhXnVAXL_eoXVfON4qD32`.

For LOB `5`: list the Drive root and filter to children whose name starts with `[5.` — these are the SDLC phase folders. The two consulting-SDLC Google Docs ("Consulting Service Development Plan" and "Consulting Service Development Process") were also pushed at root level on 2026-05-27 — they should be present in the local index for `5.0`.

## Out of scope for admin-governance

- `6.0 tech/` — code, governed by git, not by `_INDEX.md`.
- `9.0 legal/` — not part of the 8 LOBs in scope (separate governance).
- `tools/`, `about-me/`, `0 about-me/` — utility folders, no cloud counterpart.

## Index file paths

Each LOB has its index at `<local_path>/_INDEX.md`. So for example LOB 2.0 index is at `~/Desktop/Claude/zynkr/2.0 sales-consultant-offering/_INDEX.md`.
