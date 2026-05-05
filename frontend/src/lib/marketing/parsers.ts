import type {
  BudgetData,
  BudgetLine,
  CompetitiveData,
  CompetitorRow,
  KeywordData,
  KeywordRow,
  KpiData,
  KpiRow,
  KpiStatus,
  SwotBlock,
  SwotEntry,
} from "./types";

/* ── Helpers ──────────────────────────────────────────────────── */

/** Split a markdown table row on "|", trimming the empty edge cells. */
function splitRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
}

/** Strip markdown emphasis, code-fences, link syntax — keep the visible text. */
function stripMd(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function parseNumber(s: string): number {
  if (!s) return 0;
  // strip currency symbols, commas, "≈", "approx", etc., keep digits + .
  const cleaned = s
    .replace(/₨|RS\.?|PKR|USD|\$|approx|~|≈/gi, "")
    .replace(/[, ]+/g, "")
    .replace(/[^0-9.\-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parsePercent(s: string): number {
  const n = parseNumber(s.replace("%", ""));
  return n / 100;
}

/* ── KPI tracker (11-kpi-tracker.md) ──────────────────────────── */

const PILLAR_RE = /^##\s+Pillar\s+(\d+)\s+—\s+([^(]+?)(?:\s*\(\d+\s*KPIs?\))?\s*$/i;

function statusFromString(raw: string): KpiStatus {
  const s = raw.toLowerCase();
  if (s.includes("strong")) return "strong";
  if (s.includes("adequate")) return "adequate";
  if (s.includes("needs work")) return "needs-work";
  return "not-rated";
}

export function parseKpi(md: string): KpiData {
  const lines = md.split(/\r?\n/);
  const rows: KpiRow[] = [];
  let pillar = "";
  let pillarIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const pm = PILLAR_RE.exec(line);
    if (pm) {
      pillarIndex = Number(pm[1]);
      pillar = pm[2].trim();
      continue;
    }

    // Table row: starts with "|" and contains digits at the start cell
    if (!line.startsWith("|")) continue;
    const cells = splitRow(line);
    if (cells.length < 4) continue;
    const num = Number(cells[0]);
    if (!Number.isFinite(num) || num < 1 || num > 99) continue;

    // Pillar 1 has 6 columns, others have 5. Find the score by
    // scanning for a cell whose stripped text is a single digit 1–5.
    let score = 0;
    let scoreIdx = -1;
    for (let c = 1; c < cells.length; c++) {
      const txt = stripMd(cells[c]);
      if (/^[1-5]$/.test(txt)) {
        score = Number(txt);
        scoreIdx = c;
        break;
      }
    }
    if (scoreIdx < 0) continue;

    const title = stripMd(cells[1]);
    const evidence = stripMd(cells[scoreIdx + 1] ?? "");
    const statusRaw = stripMd(cells[cells.length - 1] ?? "");
    const status = statusFromString(statusRaw);

    rows.push({
      number: num,
      pillar,
      pillarIndex,
      title,
      score,
      evidence,
      status,
    });
  }

  const totals = {
    total: rows.length,
    strong: rows.filter((r) => r.status === "strong").length,
    adequate: rows.filter((r) => r.status === "adequate").length,
    needsWork: rows.filter((r) => r.status === "needs-work").length,
    notRated: rows.filter((r) => r.status === "not-rated").length,
    average:
      rows.length > 0
        ? Math.round(
            (rows.reduce((s, r) => s + r.score, 0) / rows.length) * 100,
          ) / 100
        : 0,
  };

  return { rows, totals };
}

/* ── Budget (09-budget.md) ────────────────────────────────────── */

/** Parse the *Top-line budget* table inside §1. Skip the showcase-mode
 *  table (it lives in a blockquote — its lines start with "> "). */
export function parseBudget(md: string): BudgetData {
  const lines = md.split(/\r?\n/);
  const lineItems: BudgetLine[] = [];
  let inSection1 = false;
  let actualUsd = 0;

  // First pass — find the showcase actual total ("$0" by default).
  for (const line of lines) {
    const m = />\s*\|\s*\*\*TOTAL ACTUAL\*\*\s*\|\s*\$?(\d+)\s*\|\s*\*\*\$?(\d+)\*\*/i.exec(line);
    if (m) actualUsd = parseNumber(m[2]);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+1\.\s+Top-line budget/i.test(line)) {
      inSection1 = true;
      continue;
    }
    if (inSection1 && /^##\s+/.test(line)) break; // next H2 ends the section

    if (!inSection1) continue;
    if (!line.startsWith("|")) continue;
    if (line.startsWith("|---")) continue;
    if (/^\|\s*\|/.test(line) === false && /^\|\s*$/.test(line)) continue;

    const cells = splitRow(line);
    if (cells.length < 4) continue;
    const label = stripMd(cells[0]);
    if (!label) continue;
    if (/^\|\s*$/.test(label)) continue;

    // skip header row("USD | PKR | Share")
    if (/^USD$/i.test(stripMd(cells[1]))) continue;

    const usdRaw = stripMd(cells[1]);
    const pkrRaw = stripMd(cells[2]);
    const shareRaw = stripMd(cells[3]);

    if (!/[0-9]/.test(usdRaw)) continue;

    const usd = parseNumber(usdRaw);
    const pkr = parseNumber(pkrRaw);
    const share = parsePercent(shareRaw);
    const isTotal = /TOTAL/i.test(label);

    if (isTotal) continue; // we'll emit total separately

    lineItems.push({
      label,
      usd,
      pkr,
      share,
      category: categoriseBudget(label),
    });
  }

  const totalUsd = lineItems.reduce((s, l) => s + l.usd, 0);
  const totalPkr = lineItems.reduce((s, l) => s + l.pkr, 0);

  return { lines: lineItems, totalUsd, totalPkr, actualUsd };
}

function categoriseBudget(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("meta")) return "Meta Ads";
  if (l.includes("google")) return "Google Ads";
  if (l.includes("creative")) return "Creative";
  if (l.includes("tools") || l.includes("saas")) return "Tools";
  if (l.includes("influencer") || l.includes("creator")) return "Influencer";
  if (l.includes("contingency")) return "Contingency";
  return "Other";
}

/* ── Competitive analysis (10-competitive-analysis.md) ────────── */

/** Map markdown sub-headings → table-row groups for our model. */
function inferGroup(header: string): CompetitorRow["group"] | null {
  const h = header.toLowerCase();
  if (h.includes("section a")) return "Company";
  if (h.includes("facebook")) return "Facebook";
  if (h.includes("instagram")) return "Instagram";
  if (h.includes("other channels")) return "Other";
  if (h.includes("section c") || h.includes("website")) return "Website";
  return null;
}

export function parseCompetitive(md: string): CompetitiveData {
  const lines = md.split(/\r?\n/);
  const rows: CompetitorRow[] = [];
  let group: CompetitorRow["group"] | null = null;
  let inSwotKind: SwotBlock["kind"] | null = null;
  let inSwotEntity: SwotEntry["entity"] | null = null;

  const swot: SwotBlock[] = [
    { kind: "Strengths", entries: [] },
    { kind: "Weaknesses", entries: [] },
  ];
  const opportunities: string[] = [];
  const threats: string[] = [];

  let inOpps = false;
  let inThreats = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^##\s+/.test(line) || /^###\s+/.test(line)) {
      const g = inferGroup(line);
      if (g) {
        group = g;
        inSwotKind = null;
        inSwotEntity = null;
        inOpps = false;
        inThreats = false;
        continue;
      }
      if (/strengths/i.test(line)) {
        inSwotKind = "Strengths";
        group = null; // stop pushing into comparison rows
        continue;
      }
      if (/weaknesses/i.test(line)) {
        inSwotKind = "Weaknesses";
        group = null;
        continue;
      }
      if (/opportunities/i.test(line)) {
        inOpps = true;
        inSwotKind = null;
        group = null;
        continue;
      }
      if (/threats/i.test(line)) {
        inThreats = true;
        inOpps = false;
        inSwotKind = null;
        group = null;
        continue;
      }
      // any other heading
      inSwotKind = null;
      inSwotEntity = null;
      inOpps = false;
      inThreats = false;
      continue;
    }

    // Comparison-row tables — within an attribute group
    if (group && line.startsWith("|") && !line.startsWith("|---")) {
      const cells = splitRow(line);
      if (cells.length < 4) continue;
      const attr = stripMd(cells[0]);
      // Skip the header row (first cell is "Attribute" / "Channel" / etc.)
      if (/^(attribute|channel|why|metric)$/i.test(attr)) continue;
      // Many tables have 5 cols (attr, vidiq, notegpt, eightify, source); some 4.
      const vidiq = stripMd(cells[1] ?? "");
      const notegpt = stripMd(cells[2] ?? "");
      const eightify = stripMd(cells[3] ?? "");
      if (!attr || !vidiq) continue;
      rows.push({ attribute: attr, vidiq, notegpt, eightify, group });
      continue;
    }

    // SWOT table inside a kind heading: row 1 is header (VidIQ | NoteGPT | Eightify)
    if (inSwotKind && line.startsWith("|") && !line.startsWith("|---")) {
      const cells = splitRow(line);
      if (cells.length < 3) continue;
      // Header detection — first row contains the entity names verbatim
      if (/vidiq/i.test(cells[0]) && /notegpt/i.test(cells[1])) continue;

      const block = swot.find((s) => s.kind === inSwotKind)!;
      // Push each non-empty cell as an item under the right entity
      const entities: SwotEntry["entity"][] = ["VidIQ", "NoteGPT", "Eightify"];
      cells.slice(0, 3).forEach((cell, idx) => {
        const item = stripMd(cell).replace(/^—$/, "").trim();
        if (!item) return;
        const ent = entities[idx];
        const existing = block.entries.find((e) => e.entity === ent);
        if (existing) existing.items.push(item);
        else block.entries.push({ entity: ent, items: [item] });
      });
      continue;
    }

    // Opportunities / Threats — numbered list
    if (inOpps || inThreats) {
      const m = /^\s*\d+\.\s+(.+)$/.exec(line);
      if (m) {
        const txt = stripMd(m[1]);
        if (inOpps) opportunities.push(txt);
        else threats.push(txt);
      }
    }

    // Suppress unused warning
    void inSwotEntity;
  }

  return { rows, swot, opportunities, threats };
}

/* ── Keyword research (06-keyword-research.md) ────────────────── */

export function parseKeywords(md: string): KeywordData {
  const lines = md.split(/\r?\n/);
  const rows: KeywordRow[] = [];
  let inMaster = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+Master keyword table/i.test(line)) {
      inMaster = true;
      continue;
    }
    if (inMaster && /^##\s+/.test(line) && !/Master keyword table/i.test(line)) break;

    if (!inMaster) continue;
    if (!line.startsWith("|")) continue;
    if (line.startsWith("|---")) continue;

    const cells = splitRow(line);
    if (cells.length < 8) continue;
    const rank = Number(stripMd(cells[0]));
    if (!Number.isFinite(rank) || rank < 1) continue;

    const keyword = stripMd(cells[1]);
    const type = stripMd(cells[2]);
    const msv = parseNumber(cells[3]);
    const kd = parseNumber(cells[4]);
    const cpc = parseNumber(cells[5].replace("$", ""));
    const intent = stripMd(cells[6]);
    const page = stripMd(cells[7]);
    const inGoogleAdsRaw = stripMd(cells[8] ?? "");
    const inGoogleAds = /^yes/i.test(inGoogleAdsRaw);
    const isShortTail = /short-tail/i.test(type);

    rows.push({
      rank,
      keyword,
      type,
      isShortTail,
      msv,
      kd,
      cpc,
      intent,
      page,
      inGoogleAds,
    });
  }

  const shortTailCount = rows.filter((r) => r.isShortTail).length;
  const longTailCount = rows.length - shortTailCount;
  const avgKd =
    rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.kd, 0) / rows.length) * 10) / 10
      : 0;

  return { rows, shortTailCount, longTailCount, avgKd };
}
