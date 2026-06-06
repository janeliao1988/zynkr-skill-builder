# Intent Taxonomy — Zynkr Support KB (nested)

Each resolved Q&A is classified into exactly one intent. The intent decides **which section DOC** of
the nested KB the entry lands in, and is stored on the entry's `Intent:` line. The live routing
source of truth is **`Zynkr Support KB — 00 INDEX & Retrieval Map`**
(ID `1YeOBZqoX98IHENN_rW7rvrqgHjFwZETXjRPShHBE-EE`) — this file is the authoring reference; keep the
two in sync.

Keep this list small and stable. When a question genuinely doesn't fit, **propose a new category to
Peter** (don't silently overload `other`). Once Peter approves, create its section doc, register it
in the INDEX, and add a row here so it becomes first-class.

| Intent tag | Section doc (NN) | Doc ID | Append anchor | Covers | zh-TW / EN aliases |
|---|---|---|---|---|---|
| `pricing-quoting` | 02 Pricing & Quoting | `1iYncrIpUWci2sfPnLDgLm2UHETX5ZXpO93t886ab2EI` | `pricing-quoting` | Rates, quotes, how a session/course is priced, day-rates, per-hour, per-head | 費用, 報價, 價格, 收費, 鐘點, 一小時多少, quote, price, pricing, cost, rate, how much |
| `course-content` | 03 Course Content & Curriculum | `1Gs2TOjdEOT891TIp9Y69sSfMU5lYyJeExpaIEhO0eTI` | `course-content` | What a course covers, syllabus, level, prerequisites, which course to pick, methodology frameworks | 課程內容, 課綱, 大綱, 程度, 適合誰, 先修, 哪一門課, GUIDE, IPO, curriculum, syllabus, topics, prerequisite |
| `scheduling-logistics` | 04 Scheduling & Logistics | `1To4umb0OTVnF9w2yTQox4MG7vquMzOgguLLK7ZWz78w` | `scheduling-logistics` | Dates, times, duration, headcount, location, online vs in-person, booking | 時間, 日期, 時數, 人數, 地點, 線上, 實體, 預約, 場次, schedule, time, duration, headcount, location, online, in-person, booking |
| `team-training-enterprise` | 05 Team Training & Enterprise | `1d-DBf57d9FXA6YGPM6KetYpaaNN5vUJDy6OBjri4pGE` | `team-training-enterprise` | Group/corporate training, in-house workshops, custom programs, B2B | 團隊訓練, 企業內訓, 包班, 客製, 公司, 內訓, team training, corporate, enterprise, in-house, custom |
| `technical-howto` | 06 Technical How-To | `1zdi2gvu_kyPOv2nYQ-56p8UTapnD6DtpBPv4Pp-ZtCQ` | `technical-howto` | Product/tooling setup & usage: MCP, Claude Code, skills, accounts/tools | MCP, Claude Code, skills, subagent, 設定, 安裝, 怎麼用, 操作, setup, install, configure, how to, integration |
| `access-account` | 07 Access & Account | `1j-mHGvFhtWT3Lf6YQIS1Uj4ozqf6uD1TD4N4wCJxiSo` | `access-account` | Login, access to materials/recordings, account issues, links not working | 帳號, 登入, 存取, 錄影, 回放, 教材連結, 拿不到, account, login, access, recording, materials, link |
| `refund-policy` | 08 Refunds & Policy | `1WZ6BpuE-zuGUIMANU70VIrvLuaNR-ZHq_RPSMDMPOMg` | `refund-policy` | Refunds, cancellations, rescheduling policy, terms, invoices/receipts | 退費, 退款, 取消, 改期, 轉讓, 政策, 發票, 收據, refund, cancel, reschedule, policy, invoice, receipt |
| `other` | 09 Other | `1ybCHI2afBDuD4qwF8y8QKnH8pryxlSdUG4d04BbLVkY` | `other` | Genuinely doesn't fit above **and** isn't worth a new category yet | — |
| `instructor-profile` | 10 Instructor Profile | `1UaLcJrCa2lzn1j3xoUyhBDpIRKqQUCCFzShL4xirrys` | `instructor-profile` | Instructor background, experience, bio (Dennis / Peter) | 講師, 老師, 背景, 經歷, Dennis, Peter, 介紹, instructor, teacher, bio, background |
| `brand-product-vision` | 11 Brand & Product Vision | `1_rc1go2pqTILElBi-DKbDwOU7xg3ODarh535cc7N6BE` | `brand-product-vision` | Zynkr brand, vision, mission, product direction, "about us" | 品牌, 願景, 使命, 產品方向, 公司理念, Zynkr, brand, vision, mission, about |
| `ai-workflow-architecture` | 12 AI Workflow Architecture | `1WukW2HHv6r1TvOR2W0yJYEbtVJONT97kbW6Y24cagAA` | `ai-workflow-architecture` | AI workflow / automation architecture, memory & KB design, RAG | 架構, 流程設計, pipeline, 自動化架構, 知識庫架構, RAG, workflow, architecture, automation, memory, retrieval |

> **Core Facts** (`### FACT:<id>`) are NOT a Q&A intent — they all live in `01 Core Facts`
> (ID `1R8JoTiIihh4h7Yk3P2GlIgOIzbgSWMNkIzFcmWOzvb0`, anchor `core-facts`). Q&A entries in the
> section docs **cite** them.

## Classification notes
- Prefer the **most specific** fit. "How much for in-house team training?" is `pricing-quoting` if
  the answer is the rate, or `team-training-enterprise` if the answer is program scope — judge by
  *what Peter actually answered*, not what was asked.
- A single thread can yield **multiple entries** under different intents (e.g. a pricing answer + a
  scheduling answer). Split them — each routes to its own section doc.
- `other` is a holding pen, not a destination. If two or more `other` entries start looking alike,
  that's the signal to propose a new category → new section doc (see `kb-doc-template.md`).
- The last three rows (`instructor-profile`, `brand-product-vision`, `ai-workflow-architecture`)
  grew in during the 2026-06-05 enrichment and were made first-class section docs at the 2026-06-06
  nesting migration.
