// Server-only: uses node:fs. Don't import from a client component.
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  parseBudget,
  parseCompetitive,
  parseKeywords,
  parseKpi,
} from "./parsers";
import type { MarketingData } from "./types";

/** Marketing MDs live at `<repo>/marketing/`, one level above the
 *  Next.js app. We try a few candidate roots so this works in dev,
 *  monorepo deploys, and the case where the user copies the folder
 *  inside `frontend/`. */
const CANDIDATE_ROOTS = [
  path.join(process.cwd(), "..", "marketing"),
  path.join(process.cwd(), "marketing"),
  path.join(process.cwd(), "..", "..", "marketing"),
];

async function readMd(filename: string): Promise<string | null> {
  for (const root of CANDIDATE_ROOTS) {
    const full = path.join(root, filename);
    try {
      const txt = await fs.readFile(full, "utf8");
      if (txt) return txt;
    } catch {
      // try next root
    }
  }
  return null;
}

export async function loadMarketingData(): Promise<MarketingData> {
  const [kpiMd, budgetMd, competitiveMd, keywordsMd] = await Promise.all([
    readMd("11-kpi-tracker.md"),
    readMd("09-budget.md"),
    readMd("10-competitive-analysis.md"),
    readMd("06-keyword-research.md"),
  ]);

  const missing: string[] = [];
  if (!kpiMd) missing.push("11-kpi-tracker.md");
  if (!budgetMd) missing.push("09-budget.md");
  if (!competitiveMd) missing.push("10-competitive-analysis.md");
  if (!keywordsMd) missing.push("06-keyword-research.md");

  return {
    kpi: kpiMd ? parseKpi(kpiMd) : null,
    budget: budgetMd ? parseBudget(budgetMd) : null,
    competitive: competitiveMd ? parseCompetitive(competitiveMd) : null,
    keywords: keywordsMd ? parseKeywords(keywordsMd) : null,
    missing,
  };
}
