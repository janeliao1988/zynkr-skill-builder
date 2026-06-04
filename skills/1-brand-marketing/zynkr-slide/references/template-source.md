# 模板來源（設定，非內建）

> **本技能不內建任何模板。** 模板（固定版式的 Slides 檔）放在 Drive 模板庫，不放進這個技能庫。
> 本檔做三件事：(1) 指向你的**模板庫**（SOT 範本資料夾）；(2) 說明模板如何**標記到 use-case**；(3) 給每個模板的**欄位 manifest** schema。
> `zynkr-slide` 的 **template-fill 分支**在 Step 1/2 偵測「這是哪種模板」、Step 4-T 取欄位對映時讀本檔。

> **分工提醒**：只有 **template-fill 分支**（SKILL.md Step 4-T）用本檔；三棒接力分支不碰它。本檔只決定「去哪個 Drive 模板庫、用哪個模板、填哪些欄位」；實際品牌色仍由各棒 `brand-source.md` 在執行時載入（template-fill 的視覺處理見 Step 4-T 第 6 步）。

---

## 1 · 模板庫位置（設定）

```
TEMPLATE_LIBRARY = 1j0lubFMtZ6lFW-ZTOQcvZ2O4r_ix70yF
```

- **Drive 資料夾**：「Slide template」 — https://drive.google.com/drive/folders/1j0lubFMtZ6lFW-ZTOQcvZ2O4r_ix70yF
- **模板格式**：**native Google Slides**（每個模板一個 Slides 檔）。template-fill 會 `copy_drive_file` 複製 → `get_drive_file_download_url(export_format="pptx")` 導出 → python-pptx 按 shape index 精準填。
- 一個 link-gated Drive folder ID 屬低敏感**設定**，可寫在這（與 repo 既有 `inbound-sales-config.md` / `seo-pipeline-config.md` 同慣例）；**模板內容本身留在 Drive，永不進 repo。**

**找不到 / 未設定時** → template-fill 退中性預設：**請使用者直接貼模板連結**，不自動找庫；流程其餘不變。

---

## 2 · 模板如何標記到 use-case

兩層，**以 `TEMPLATE-INDEX` 為權威**：

- **`TEMPLATE-INDEX`（權威）**：模板庫根目錄放一份 Google Sheet `TEMPLATE-INDEX`，每列一個模板：

  | 模板名 | file_id | use-case key | 一句用途 | 視覺處理預設 | 欄位 manifest |
  |---|---|---|---|---|---|
  | Project Charter | `<slides file id>` | `charter` | 單頁專案章程（問題→目標→里程碑→RAPID/RACI→KPI→roll-out） | keep（此模板已是 Zynkr 品牌） | 見下方 §3 範例 |

  **視覺處理預設**欄＝該模板的預設 `visual-treatment`（`recolor` / `keep` / `hybrid`）；template-fill 直接讀這欄決定要不要 recolor（SKILL.md Step 4-T 第 6 步）。外部／未列入索引的模板一律預設 `recolor`。

- **檔名前綴（軟提示）**：模板檔名以 use-case key 開頭，例 `charter — Project Charter (Zynkr)`、`qbr-onepager — …`。只在沒有 `TEMPLATE-INDEX` 時當 fallback。

> template 的 use-case key（`charter` / `qbr-onepager` / `one-pager` …）**獨立於** `use-case-playbooks.md` 的 9 個敘事 use-case：那 9 個給三棒接力，這裡給 template-fill 的固定版式。

---

## 3 · 每個模板的欄位 manifest（schema）

每個模板一份 field manifest（放 `TEMPLATE-INDEX` 或模板旁）。欄位定位用 **pptx 匯出後的 shape index**（最穩；Slides API 無法逐 shape 定位）。schema：

| 欄位 | shape index | 型別 | 來源提示 | 必填 |
|---|---|---|---|---|
| `<欄位名>` | `<int，pptx 匯出序>` | text / table / date / checkbox | `<從來源文件哪裡抽>` | 是 / 否 |

manifest 缺 shape index 時，runtime 用 `~/.claude/skills/pptx/.venv/bin/python` + python-pptx 列 shapes（index + type + 現有文字）就地補。

### 範例：`charter`（Project Charter）field manifest

| 欄位 | shape index | 型別 | 來源提示 |
|---|---|---|---|
| Title | 0 | text | 文件 H1 / 專案名 |
| Program / Vertical | 17 | text | 專案軌道 / 領域 |
| Project Lead | 50 | text | 負責人 |
| Objective | 20 | text | 解法→結果→效益 一句話 |
| What's not working | 52 | text | 觀察→問題→business impact |
| Deliverables (M1/M2/M3) | 14 | text | 各里程碑 end-point |
| Latest Update | 5 | text | 現況 / open items |
| KPIs | 51 | text | 指標（或「baseline 待建」） |
| Phase chevrons 1–5 | 25,4,3,2,1 | text | 各 phase 短名 |
| Milestone table (5×3) | 6 | table | phase / deliverable / week |
| Start / Completion | 31 / 28 | date | 起 / 迄日期 |
| Roll-out checks (US&C/LatAm/EMEA/APAC) | 54,58,59,60 | checkbox | 選定市場 |
| RAPID names (R/A/P/I/D) | 32,34,36,38,40 | text | 決策角色 |
| RACI names (R/A/C/I) | 42,44,46,48 | text | 任務角色 |

> 此 charter 模板**本身已是 Zynkr 品牌色** → 視覺處理預設 `keep`（不需 recolor）。

---

## 4 · 偵測與選擇流程（template-fill 怎麼用本檔）

1. Step 1 偵測為 template-fill + use-case key。
2. 使用者**自帶模板連結 → 直接用它**，跳過庫查詢。
3. 否則：載 `TEMPLATE_LIBRARY` → 讀 `TEMPLATE-INDEX` → 用 use-case key 配對 → **提 1–2 候選讓使用者確認**。
4. 配對到 → 取該模板 field manifest 進 Step 4-T。
5. 配不到 → 請使用者貼連結，或退回三棒接力。

---

## 5 · 中性預設（未設定 / 讀不到模板庫時）

- 不臆測任何 Drive 位置；**請使用者直接貼模板連結**。
- 仍守：**複製不改母版**、**抽不到標「待補」**、**外部模板預設 recolor**。
