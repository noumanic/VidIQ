"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Star,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KpiData, KpiRow, KpiStatus } from "@/lib/marketing/types";

const PILLAR_ACCENT: Record<number, string> = {
  1: "from-violet-500/30 to-fuchsia-500/20 text-violet-200 ring-violet-400/30",
  2: "from-cyan-500/30 to-sky-500/20 text-cyan-200 ring-cyan-400/30",
  3: "from-emerald-500/30 to-teal-500/20 text-emerald-200 ring-emerald-400/30",
  4: "from-amber-500/30 to-rose-500/20 text-amber-200 ring-amber-400/30",
};

const STATUS_META: Record<
  KpiStatus,
  { label: string; bar: string; icon: typeof CheckCircle2; chip: string }
> = {
  strong: {
    label: "Strong",
    bar: "from-emerald-500 to-teal-400",
    icon: CheckCircle2,
    chip: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  },
  adequate: {
    label: "Adequate",
    bar: "from-amber-500 to-yellow-400",
    icon: AlertTriangle,
    chip: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  },
  "needs-work": {
    label: "Needs work",
    bar: "from-rose-500 to-orange-400",
    icon: AlertTriangle,
    chip: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
  },
  "not-rated": {
    label: "Not rated",
    bar: "from-slate-500 to-slate-400",
    icon: Circle,
    chip: "bg-slate-500/15 text-slate-200 ring-slate-400/30",
  },
};

export function KpiTracker({ data }: { data: KpiData }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));
  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const grouped = new Map<number, { name: string; rows: KpiRow[] }>();
  for (const r of data.rows) {
    if (!grouped.has(r.pillarIndex)) {
      grouped.set(r.pillarIndex, { name: r.pillar, rows: [] });
    }
    grouped.get(r.pillarIndex)!.rows.push(r);
  }
  const pillars = [...grouped.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>KPI tracker</CardTitle>
            <CardDescription>
              Self-assessment across 18 KPIs · 5 pillars · live progress
            </CardDescription>
          </div>
          <Scorecard totals={data.totals} />
        </div>
      </CardHeader>

      <div className="space-y-2 px-6 pb-6">
        {pillars.map(([idx, group], pi) => {
          const isOpen = expanded.has(idx);
          const avg =
            group.rows.length > 0
              ? group.rows.reduce((s, r) => s + r.score, 0) / group.rows.length
              : 0;
          const accent = PILLAR_ACCENT[idx] ?? PILLAR_ACCENT[1];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.04 }}
              className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]"
            >
              <button
                onClick={() => toggle(idx)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
                    accent,
                  )}
                >
                  <span className="font-display text-base font-bold">{idx}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-semibold tracking-tight">
                      Pillar {idx} — {group.name}
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      · {group.rows.length} KPIs
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
                        style={{ width: `${(avg / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums">
                      {avg.toFixed(2)}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
              </button>

              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-white/[0.06] bg-black/10"
                >
                  <ul className="divide-y divide-white/[0.04]">
                    {group.rows.map((r) => {
                      const meta = STATUS_META[r.status];
                      const Icon = meta.icon;
                      return (
                        <li key={r.number} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[11px] font-mono font-semibold text-muted-foreground">
                              {r.number}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">{r.title}</p>
                                <Badge
                                  variant="outline"
                                  className={cn("ml-auto gap-1 px-2 py-0", meta.chip)}
                                >
                                  <Icon className="h-3 w-3" />
                                  {meta.label}
                                </Badge>
                              </div>
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                                  <div
                                    className={cn(
                                      "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                                      meta.bar,
                                    )}
                                    style={{ width: `${(r.score / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
                                  {r.score}/5
                                </span>
                              </div>
                              {r.evidence && (
                                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                                  {r.evidence}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

function Scorecard({ totals }: { totals: KpiData["totals"] }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 px-3 py-2">
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span className="font-display text-xl font-bold tabular-nums leading-none">
          {totals.average.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground">/ 5</span>
      </div>
      <div className="h-6 w-px bg-white/10" />
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          {totals.strong}
        </span>
        <span className="inline-flex items-center gap-1 text-amber-300">
          <AlertTriangle className="h-3 w-3" />
          {totals.adequate}
        </span>
        <span className="text-muted-foreground">/ {totals.total}</span>
      </div>
    </div>
  );
}
