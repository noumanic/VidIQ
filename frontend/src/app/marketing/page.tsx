import { Megaphone, FileWarning } from "lucide-react";
import { loadMarketingData } from "@/lib/marketing/loader";
import { KpiTracker } from "@/components/marketing/kpi-tracker";
import { BudgetBreakdown } from "@/components/marketing/budget-breakdown";
import { CompetitiveMatrix } from "@/components/marketing/competitive-matrix";
import { KeywordResearch } from "@/components/marketing/keyword-research";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Re-read on every request — picks up edits to marketing/*.md without a rebuild.
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const data = await loadMarketingData();

  return (
    <div className="container py-10 md:py-14">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/25 to-amber-500/15 ring-1 ring-fuchsia-400/20">
            <Megaphone className="h-5 w-5 text-fuchsia-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                Marketing
              </h1>
              <Badge
                variant="outline"
                className="hidden border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200 sm:inline-flex"
              >
                Pillar 3 · live data
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Marketing project dashboard — read live from{" "}
              <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-xs">marketing/*.md</code>
            </p>
          </div>
        </div>
      </div>

      {data.missing.length > 0 && (
        <Card className="mb-6 overflow-hidden border-amber-400/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div className="text-xs">
              <p className="font-medium text-amber-100">
                {data.missing.length} marketing file{data.missing.length > 1 ? "s" : ""} not found
              </p>
              <p className="mt-1 text-amber-100/70">
                Expected at <code>../marketing/</code>: {data.missing.join(", ")}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {data.kpi && <KpiTracker data={data.kpi} />}
        {data.budget && <BudgetBreakdown data={data.budget} />}
        {data.competitive && <CompetitiveMatrix data={data.competitive} />}
        {data.keywords && <KeywordResearch data={data.keywords} />}
      </div>
    </div>
  );
}
