// Server-side loader. Reads from the inlined content module — no fs
// at runtime, so this works on Vercel / HF Spaces / any host without
// needing source files outside the deploy root.
//
// To refresh after editing a source MD at <repo>/marketing/, run
// `npm run sync-marketing` (also runs automatically before dev / build).

import {
  parseBudget,
  parseCompetitive,
  parseKeywords,
  parseKpi,
} from "./parsers";
import { RAW_MD } from "./content";
import type { MarketingData } from "./types";

export async function loadMarketingData(): Promise<MarketingData> {
  const kpiMd = RAW_MD["11-kpi-tracker.md"];
  const budgetMd = RAW_MD["09-budget.md"];
  const competitiveMd = RAW_MD["10-competitive-analysis.md"];
  const keywordsMd = RAW_MD["06-keyword-research.md"];

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
