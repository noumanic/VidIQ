"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Coins, AlertCircle } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "@/components/analytics/chart-shell";
import type { BudgetData } from "@/lib/marketing/types";

const CATEGORY_COLOR: Record<string, string> = {
  "Meta Ads": "#1877f2",
  "Google Ads": "#ea4335",
  Creative: "#a855f7",
  Tools: "#06b6d4",
  Influencer: "#ec4899",
  Contingency: "#f59e0b",
  Other: "#64748b",
};

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

function fmtPkr(n: number): string {
  if (n >= 1000) return `₨ ${(n / 1000).toFixed(1)}k`;
  return `₨ ${n.toLocaleString()}`;
}

export function BudgetBreakdown({ data }: { data: BudgetData }) {
  const [mode, setMode] = useState<"planned" | "actual">("planned");

  const chartData = useMemo(
    () =>
      data.lines.map((l) => ({
        label: l.label,
        category: l.category,
        value: l.usd,
        share: l.share,
      })),
    [data.lines],
  );

  const showActual = mode === "actual";
  const totalShown = showActual ? data.actualUsd : data.totalUsd;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>Budget breakdown</CardTitle>
            <CardDescription>
              Planned 14-day launch flight · showcase actual spend in parallel
            </CardDescription>
          </div>

          {/* Planned / Actual toggle */}
          <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
            <ModePill
              active={mode === "planned"}
              onClick={() => setMode("planned")}
              icon={DollarSign}
              label="Planned"
              accent="from-violet-500/20 to-fuchsia-500/15 text-violet-100 ring-violet-400/30"
            />
            <ModePill
              active={mode === "actual"}
              onClick={() => setMode("actual")}
              icon={Coins}
              label="Actual"
              accent="from-emerald-500/20 to-cyan-500/15 text-emerald-100 ring-emerald-400/30"
            />
          </div>
        </div>
      </CardHeader>

      <div className="grid grid-cols-1 gap-4 px-6 pb-6 lg:grid-cols-5">
        {/* Donut */}
        <div className="lg:col-span-2">
          <div className="relative h-[260px] w-full">
            {showActual && data.actualUsd === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
                  <Coins className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="font-display text-3xl font-bold tabular-nums text-emerald-200">
                    $0
                  </p>
                  <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                    Showcase mode — campaigns built in draft / paused state, $0 spent.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="92%"
                      paddingAngle={2}
                      stroke="hsl(265 30% 8%)"
                      strokeWidth={2}
                    >
                      {chartData.map((d) => (
                        <Cell
                          key={d.label}
                          fill={CATEGORY_COLOR[d.category] ?? CATEGORY_COLOR.Other}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={(p) => (
                        <ChartTooltip
                          {...p}
                          formatter={(v: number) =>
                            `${fmtUsd(v)} (${Math.round((v / data.totalUsd) * 100)}%)`
                          }
                        />
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold tabular-nums">
                    {fmtUsd(totalShown)}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {showActual ? "Actual" : "Planned"}
                  </span>
                  {!showActual && (
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      {fmtPkr(data.totalPkr)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Line item</th>
                  <th className="px-3 py-2 text-right">USD</th>
                  <th className="px-3 py-2 text-right">PKR</th>
                  <th className="px-3 py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((l, i) => {
                  const color = CATEGORY_COLOR[l.category] ?? CATEGORY_COLOR.Other;
                  return (
                    <motion.tr
                      key={l.label}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-white/[0.03] last:border-0"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: color }}
                          />
                          <span className="line-clamp-1 text-xs">{l.label}</span>
                        </div>
                        {/* mini share bar */}
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.04]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${l.share * 100}%`,
                              background: `linear-gradient(90deg, ${color}, ${color}99)`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                        {showActual ? "$0" : fmtUsd(l.usd)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {showActual ? "₨ 0" : fmtPkr(l.pkr)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                        {Math.round(l.share * 100)}%
                      </td>
                    </motion.tr>
                  );
                })}
                <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-xs font-semibold">Total</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums">
                    {showActual ? "$0" : fmtUsd(data.totalUsd)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums text-muted-foreground">
                    {showActual ? "₨ 0" : fmtPkr(data.totalPkr)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {showActual && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Rubric line asks for a <em>plan</em>, not actual spend. Campaigns are built in
                draft / paused state and screenshotted as evidence — no rupee spent.
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ModePill({
  active,
  onClick,
  icon: Icon,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof DollarSign;
  label: string;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
        active
          ? cn("bg-gradient-to-br ring-1", accent)
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
