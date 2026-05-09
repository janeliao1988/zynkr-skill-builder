import fs from "fs";
import path from "path";
import crypto from "crypto";

export type InventoryInputRow = {
  sourceTab: string;
  name: string;
  link: string;
  shortDescription: string;
};

export type ExistingCatalogRow = {
  rowRef: string;
  name: string;
  link: string;
};

export type DedupeStatus = "exact" | "likely" | "new";
export type CandidateType = "repo" | "skill" | "pattern" | "registry";

export type ReviewCandidate = {
  sourceType: "csv";
  sourceId: string;
  sourceTab: string;
  rawName: string;
  normalizedName: string;
  link: string;
  normalizedLink: string;
  shortDescription: string;
  candidateType: CandidateType;
  dedupeStatus: DedupeStatus;
  duplicateOf?: string;
  duplicateReason?: string;
  suggestedLob: string;
  suggestedFunction: string;
  keep: string;
  comment: string;
  importedAt: string;
  batchId: string;
};

export type CsvTable = {
  headers: string[];
  rows: Record<string, string>[];
};

type ParsedArgs = {
  _: string[];
  flags: Record<string, string | boolean>;
};

type LobRule = {
  lob: string;
  fn: string;
  keywords: string[];
};

const LOB_RULES: LobRule[] = [
  {
    lob: "0. Strategy & Leadership",
    fn: "Strategic planning",
    keywords: ["strategy", "planning", "okr", "model", "ceo", "leadership", "openai"],
  },
  {
    lob: "1. Brand & Marketing",
    fn: "Brand strategy & content marketing",
    keywords: ["marketing", "brand", "seo", "geo", "copy", "newsletter", "content", "cro", "landing page"],
  },
  {
    lob: "2. Sales & Consultant",
    fn: "Consulting and client engagement",
    keywords: ["sales", "lead", "proposal", "client", "consult", "account", "stakeholder", "pitch"],
  },
  {
    lob: "3. Operations",
    fn: "Workflow and project management",
    keywords: ["operations", "workflow", "support", "sop", "reporting", "coordination", "admin"],
  },
  {
    lob: "4.1 Training Design",
    fn: "Instructional design",
    keywords: ["course", "curriculum", "lecture", "script", "lesson", "training design", "module"],
  },
  {
    lob: "4.2 Training Delivery",
    fn: "Training delivery",
    keywords: ["workshop", "cohort", "delivery", "facilitator", "bootcamp", "webinar", "video"],
  },
  {
    lob: "5.1 Development Ops – Process Excellence",
    fn: "Process consulting",
    keywords: ["process", "optimization", "diagnostic", "sipoc", "roi", "readiness", "assessment", "mapping"],
  },
  {
    lob: "5.2 Development Ops – Build Assistant",
    fn: "Agent and skill building",
    keywords: ["agent", "skill", "prompt", "plugin", "subagent", "orchestration", "browser automation"],
  },
  {
    lob: "5.3 Development Ops – Go-to-Market",
    fn: "Launch and marketplace packaging",
    keywords: ["launch", "marketplace", "adoption", "go to market", "change management", "pilot"],
  },
  {
    lob: "6. Tech",
    fn: "Platform, MCP, RAG, and integrations",
    keywords: ["mcp", "rag", "github", "server", "api", "integration", "vector", "embedding", "n8n", "database"],
  },
  {
    lob: "7. People & Talent",
    fn: "People workflows",
    keywords: ["hr", "talent", "recruit", "onboarding", "compensation", "people ops", "meeting"],
  },
  {
    lob: "8. Finance & Admin",
    fn: "Finance operations",
    keywords: ["finance", "invoice", "receipt", "accounting", "budget", "contract", "legal", "expense"],
  },
];

const DEFAULT_REVIEW_HEADERS = [
  "",
  "Source Tab",
  "Skill / Repo / Pattern Name",
  "Link",
  "Short Description",
  "Keep",
  "Comment",
  "Candidate Type",
  "Dedupe Status",
  "Duplicate Of",
  "Suggested LOB",
  "Suggested Function",
  "Imported At",
  "Batch ID",
] as const;

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { _: [], flags: {} };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result.flags[key] = true;
      continue;
    }

    result.flags[key] = next;
    index += 1;
  }

  return result;
}

export function requireFlag(args: ParsedArgs, key: string): string {
  const value = args.flags[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required flag --${key}`);
  }
  return value;
}

export function optionalFlag(args: ParsedArgs, key: string): string | undefined {
  const value = args.flags[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readCsvTable(filePath: string): CsvTable {
  const raw = fs.readFileSync(filePath, "utf8");
  const rows = parseCsvRows(raw);
  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerRow = rows[0].map((value) => value.trim());
  const body = rows.slice(1).map((row) =>
    Object.fromEntries(headerRow.map((header, index) => [header, row[index] ?? ""]))
  );

  return { headers: headerRow, rows: body };
}

export function writeCsvTable(filePath: string, headers: string[], rows: string[][]): void {
  const csv = [headers, ...rows].map(serializeCsvRow).join("\n");
  fs.writeFileSync(filePath, `${csv}\n`, "utf8");
}

export function parseCsvRows(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function serializeCsvRow(values: string[]): string {
  return values
    .map((value) => {
      const safe = value ?? "";
      if (/[",\n\r]/.test(safe)) {
        return `"${safe.replace(/"/g, '""')}"`;
      }
      return safe;
    })
    .join(",");
}

export function loadInventoryRows(filePath: string): InventoryInputRow[] {
  const table = readCsvTable(filePath);
  const nameHeader =
    findHeader(table.headers, [
      "Skill / Repo / Pattern Name",
      "name",
      "Name",
    ]) ?? "";
  const linkHeader = findHeader(table.headers, ["Link", "link", "URL"]) ?? "";
  const descHeader =
    findHeader(table.headers, ["Short Description", "Description", "description"]) ?? "";
  const sourceHeader =
    findHeader(table.headers, ["Source Tab", "sourceTab", "Source"]) ?? "";

  return table.rows
    .map((row) => ({
      sourceTab: (row[sourceHeader] ?? "").trim() || path.basename(filePath),
      name: (row[nameHeader] ?? "").trim(),
      link: (row[linkHeader] ?? "").trim(),
      shortDescription: (row[descHeader] ?? "").trim(),
    }))
    .filter((row) => row.name || row.link);
}

export function loadCatalogRows(filePath: string): ExistingCatalogRow[] {
  const table = readCsvTable(filePath);
  const nameHeader =
    findHeader(table.headers, [
      "Skill / Repo / Pattern Name",
      "name",
      "Name",
    ]) ?? "";
  const linkHeader = findHeader(table.headers, ["Link", "link", "Repo / Source Link"]) ?? "";

  return table.rows
    .map((row, index) => ({
      rowRef: `${path.basename(filePath)}:${index + 2}`,
      name: (row[nameHeader] ?? "").trim(),
      link: (row[linkHeader] ?? "").trim(),
    }))
    .filter((row) => row.name || row.link);
}

function findHeader(headers: string[], candidates: string[]): string | undefined {
  const normalizedMap = new Map(headers.map((header) => [normalizeName(header), header]));
  for (const candidate of candidates) {
    const match = normalizedMap.get(normalizeName(candidate));
    if (match) {
      return match;
    }
  }
  return undefined;
}

export function buildCandidates(
  rows: InventoryInputRow[],
  sourceId: string,
  batchId: string,
  existingRows: ExistingCatalogRow[]
): ReviewCandidate[] {
  const importedAt = new Date().toISOString();
  return rows.map((row) => {
    const normalizedName = normalizeName(row.name);
    const normalizedLink = normalizeLink(row.link);
    const candidateType = inferCandidateType(row.name, row.link, row.shortDescription);
    const dedupe = classifyDuplicate(normalizedName, normalizedLink, existingRows);
    const category = categorizeRow(row.name, row.shortDescription, row.link);

    return {
      sourceType: "csv",
      sourceId,
      sourceTab: row.sourceTab,
      rawName: row.name,
      normalizedName,
      link: row.link,
      normalizedLink,
      shortDescription: row.shortDescription,
      candidateType,
      dedupeStatus: dedupe.status,
      duplicateOf: dedupe.duplicateOf,
      duplicateReason: dedupe.duplicateReason,
      suggestedLob: category.lob,
      suggestedFunction: category.fn,
      keep: "",
      comment: "",
      importedAt,
      batchId,
    };
  });
}

function classifyDuplicate(
  normalizedName: string,
  normalizedLink: string,
  existingRows: ExistingCatalogRow[]
): { status: DedupeStatus; duplicateOf?: string; duplicateReason?: string } {
  let bestLikely:
    | { score: number; duplicateOf: string; duplicateReason: string }
    | undefined;

  for (const row of existingRows) {
    const existingName = normalizeName(row.name);
    const existingLink = normalizeLink(row.link);

    if (normalizedLink && existingLink && normalizedLink === existingLink) {
      return {
        status: "exact",
        duplicateOf: row.rowRef,
        duplicateReason: "normalized-link-match",
      };
    }

    if (
      normalizedName &&
      existingName &&
      normalizedName === existingName &&
      sameDomain(normalizedLink, existingLink)
    ) {
      return {
        status: "exact",
        duplicateOf: row.rowRef,
        duplicateReason: "normalized-name-plus-domain-match",
      };
    }

    const repoRootA = extractRepoRoot(normalizedLink);
    const repoRootB = extractRepoRoot(existingLink);
    if (repoRootA && repoRootB && repoRootA === repoRootB) {
      bestLikely = {
        score: 1,
        duplicateOf: row.rowRef,
        duplicateReason: "same-github-repo-root",
      };
      continue;
    }

    const similarity = tokenSimilarity(normalizedName, existingName);
    if (similarity >= 0.72) {
      if (!bestLikely || similarity > bestLikely.score) {
        bestLikely = {
          score: similarity,
          duplicateOf: row.rowRef,
          duplicateReason: `name-token-similarity-${similarity.toFixed(2)}`,
        };
      }
    }
  }

  if (bestLikely) {
    return {
      status: "likely",
      duplicateOf: bestLikely.duplicateOf,
      duplicateReason: bestLikely.duplicateReason,
    };
  }

  return { status: "new" };
}

function categorizeRow(name: string, description: string, link: string): { lob: string; fn: string } {
  const haystack = `${name} ${description} ${link}`.toLowerCase();
  let best: { lob: string; fn: string; score: number } | undefined;

  for (const rule of LOB_RULES) {
    const score = rule.keywords.reduce((sum, keyword) => {
      return haystack.includes(keyword.toLowerCase()) ? sum + 1 : sum;
    }, 0);

    if (!best || score > best.score) {
      best = { lob: rule.lob, fn: rule.fn, score };
    }
  }

  if (!best || best.score === 0) {
    return {
      lob: "5.2 Development Ops – Build Assistant",
      fn: "Agent and skill building",
    };
  }

  return { lob: best.lob, fn: best.fn };
}

function inferCandidateType(name: string, link: string, description: string): CandidateType {
  const lowerName = name.toLowerCase();
  const lowerLink = link.toLowerCase();
  const lowerDescription = description.toLowerCase();

  if (
    lowerLink.includes("skills.sh") ||
    lowerLink.includes("mcpmarket.com") ||
    lowerLink.includes("clawhub.ai") ||
    lowerName.includes("registry") ||
    lowerName.includes("marketplace")
  ) {
    return "registry";
  }

  if (extractRepoRoot(lowerLink)) {
    return "repo";
  }

  if (
    lowerName.includes("pattern") ||
    lowerDescription.includes("pattern") ||
    lowerDescription.includes("workflow") ||
    lowerDescription.includes("framework")
  ) {
    return "pattern";
  }

  return "skill";
}

export function candidatesToReviewCsvRows(candidates: ReviewCandidate[]): string[][] {
  return candidates.map((candidate) => [
    "",
    candidate.sourceTab,
    candidate.rawName,
    candidate.link,
    candidate.shortDescription,
    candidate.keep,
    candidate.comment,
    candidate.candidateType,
    candidate.dedupeStatus,
    candidate.duplicateOf ?? "",
    candidate.suggestedLob,
    candidate.suggestedFunction,
    candidate.importedAt,
    candidate.batchId,
  ]);
}

export function reviewHeaders(): string[] {
  return [...DEFAULT_REVIEW_HEADERS];
}

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9/#+.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLink(link: string): string {
  if (!link.trim()) return "";

  try {
    const url = new URL(link.trim());
    url.hash = "";

    if (url.hostname === "github.com") {
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length >= 2 && !["search", "topics"].includes(segments[0])) {
        return `https://github.com/${segments[0].toLowerCase()}/${segments[1].toLowerCase()}`;
      }
    }

    const filtered = new URL(url.toString());
    const keepParams = new URLSearchParams();
    [...filtered.searchParams.entries()]
      .filter(([key]) => !key.toLowerCase().startsWith("utm_") && key !== "usp")
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => keepParams.append(key, value));

    filtered.search = keepParams.toString();
    return filtered.toString().replace(/\/$/, "");
  } catch {
    return link.trim();
  }
}

function extractRepoRoot(link: string): string | undefined {
  try {
    const url = new URL(link);
    if (url.hostname !== "github.com") return undefined;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return undefined;
    if (segments[0] === "search" || segments[0] === "topics") return undefined;
    return `${segments[0].toLowerCase()}/${segments[1].toLowerCase()}`;
  } catch {
    return undefined;
  }
}

function sameDomain(linkA: string, linkB: string): boolean {
  try {
    return new URL(linkA).hostname === new URL(linkB).hostname;
  } catch {
    return false;
  }
}

function tokenSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokensA = new Set(a.split(" ").filter(Boolean));
  const tokensB = new Set(b.split(" ").filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection += 1;
    }
  }

  return intersection / Math.max(tokensA.size, tokensB.size);
}

export function createBatchId(prefix = "batch"): string {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

export function resolveRepoRoot(fromDir: string): string {
  return path.basename(fromDir) === "dist"
    ? path.resolve(fromDir, "..", "..")
    : path.resolve(fromDir, "..");
}

export async function getGoogleAccessToken(): Promise<string> {
  const directToken = process.env.GOOGLE_SHEETS_BEARER_TOKEN?.trim();
  if (directToken) {
    return directToken;
  }

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      "Missing Google auth. Set GOOGLE_SHEETS_BEARER_TOKEN or GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_SERVICE_ACCOUNT_JSON_PATH."
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const jwtPayload = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: serviceAccount.token_uri,
      exp: now + 3600,
      iat: now,
    })
  );

  const signingInput = `${jwtHeader}.${jwtPayload}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(serviceAccount.private_key, "base64url");

  const assertion = `${signingInput}.${signature}`;
  const response = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch Google access token: ${response.status} ${body}`);
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Google token response missing access_token");
  }

  return json.access_token;
}

function loadServiceAccount():
  | { client_email: string; private_key: string; token_uri: string }
  | undefined {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    return JSON.parse(inline) as {
      client_email: string;
      private_key: string;
      token_uri: string;
    };
  }

  const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH?.trim();
  if (filePath && fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as {
      client_email: string;
      private_key: string;
      token_uri: string;
    };
  }

  return undefined;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function readSheetRange(
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to read Google Sheet: ${response.status} ${body}`);
  }

  const json = (await response.json()) as { values?: string[][] };
  return json.values ?? [];
}

export async function appendSheetRows(
  spreadsheetId: string,
  range: string,
  rows: string[][]
): Promise<void> {
  if (rows.length === 0) return;

  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to append Google Sheet rows: ${response.status} ${body}`);
  }
}

export function buildApprovedAppendRows(
  reviewCsvPath: string,
  columns: string[]
): { headers: string[]; rows: string[][] } {
  const table = readCsvTable(reviewCsvPath);
  const keepHeader = findHeader(table.headers, ["Keep", "keep"]);
  if (!keepHeader) {
    throw new Error(`Review CSV ${reviewCsvPath} is missing a Keep column`);
  }

  const resolvedHeaders = columns.map((column) => {
    const match = findHeader(table.headers, [column]);
    if (!match) {
      throw new Error(`Review CSV ${reviewCsvPath} is missing requested column: ${column}`);
    }
    return match;
  });

  const approvedRows = table.rows
    .filter((row) => ["Y", "YES", "TRUE"].includes((row[keepHeader] ?? "").trim().toUpperCase()))
    .map((row) => resolvedHeaders.map((header) => row[header] ?? ""));

  return { headers: resolvedHeaders, rows: approvedRows };
}
