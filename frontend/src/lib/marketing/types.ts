// Shared types used by both the server-side parsers and the client components.

export type KpiStatus = "strong" | "adequate" | "needs-work" | "not-rated";

export type KpiRow = {
  number: number;
  pillar: string;        // e.g. "Branding"
  pillarIndex: number;   // 1..4
  title: string;
  score: number;         // 1..5
  evidence: string;
  status: KpiStatus;
};

export type KpiData = {
  rows: KpiRow[];
  totals: {
    total: number;
    strong: number;
    adequate: number;
    needsWork: number;
    notRated: number;
    average: number;
  };
};

export type BudgetLine = {
  label: string;
  usd: number;
  pkr: number;
  share: number;     // 0..1
  category: string;  // for grouping (e.g. "Paid media", "Tools", etc.)
};

export type BudgetData = {
  lines: BudgetLine[];
  totalUsd: number;
  totalPkr: number;
  actualUsd: number; // showcase-mode actual spend
};

export type CompetitorRow = {
  attribute: string;
  vidiq: string;
  notegpt: string;
  eightify: string;
  group: "Company" | "Facebook" | "Instagram" | "Other" | "Website";
};

export type SwotEntry = { entity: "VidIQ" | "NoteGPT" | "Eightify"; items: string[] };
export type SwotBlock = { kind: "Strengths" | "Weaknesses"; entries: SwotEntry[] };

export type CompetitiveData = {
  rows: CompetitorRow[];
  swot: SwotBlock[];
  opportunities: string[];
  threats: string[];
};

export type KeywordRow = {
  rank: number;
  keyword: string;
  type: string;        // "Short-tail · Head" / "Long-tail" / etc.
  isShortTail: boolean;
  msv: number;
  kd: number;
  cpc: number;
  intent: string;
  page: string;
  inGoogleAds: boolean;
};

export type KeywordData = {
  rows: KeywordRow[];
  shortTailCount: number;
  longTailCount: number;
  avgKd: number;
};

export type MarketingData = {
  kpi: KpiData | null;
  budget: BudgetData | null;
  competitive: CompetitiveData | null;
  keywords: KeywordData | null;
  missing: string[];
};
