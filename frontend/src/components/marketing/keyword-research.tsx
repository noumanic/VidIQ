"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Search, Filter } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KeywordData, KeywordRow } from "@/lib/marketing/types";

type SortKey = "rank" | "msv" | "kd" | "cpc";

const INTENT_ACCENT: Record<string, string> = {
  Commercial: "bg-violet-500/15 text-violet-200 ring-violet-400/30",
  Transactional: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  Informational: "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30",
};

function intentClass(intent: string): string {
  for (const key of Object.keys(INTENT_ACCENT)) {
    if (intent.toLowerCase().startsWith(key.toLowerCase())) return INTENT_ACCENT[key];
  }
  return "bg-white/[0.05] text-muted-foreground ring-white/10";
}

function kdColor(kd: number): string {
  if (kd < 15) return "from-emerald-500 to-teal-400";
  if (kd < 30) return "from-amber-500 to-yellow-400";
  return "from-rose-500 to-orange-400";
}

function fmtMsv(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function KeywordResearch({ data }: { data: KeywordData }) {
  const [filter, setFilter] = useState<"all" | "short" | "long">("all");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [q, setQ] = useState("");

  const maxMsv = useMemo(
    () => Math.max(1, ...data.rows.map((r) => r.msv)),
    [data.rows],
  );

  const visible = useMemo(() => {
    let out: KeywordRow[] = data.rows;
    if (filter === "short") out = out.filter((r) => r.isShortTail);
    if (filter === "long") out = out.filter((r) => !r.isShortTail);
    if (q.trim()) {
      const t = q.toLowerCase();
      out = out.filter(
        (r) =>
          r.keyword.toLowerCase().includes(t) ||
          r.intent.toLowerCase().includes(t) ||
          r.page.toLowerCase().includes(t),
      );
    }
    out = [...out].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const d = (av as number) - (bv as number);
      return sortDir === "asc" ? d : -d;
    });
    return out;
  }, [data.rows, filter, q, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "rank" ? "asc" : "desc");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>Keyword research</CardTitle>
            <CardDescription>
              {data.rows.length} keywords · {data.shortTailCount} short-tail · {data.longTailCount}{" "}
              long-tail · avg KD {data.avgKd}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter…"
                className="h-8 w-44 rounded-full border border-white/[0.06] bg-white/[0.03] py-1 pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20"
              />
            </div>

            {/* Filter */}
            <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
              <Filter className="ml-2 h-3 w-3 text-muted-foreground" />
              <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
                All
              </FilterPill>
              <FilterPill active={filter === "short"} onClick={() => setFilter("short")}>
                Short-tail
              </FilterPill>
              <FilterPill active={filter === "long"} onClick={() => setFilter("long")}>
                Long-tail
              </FilterPill>
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="px-6 pb-6">
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <SortHeader
                  active={sortKey === "rank"}
                  dir={sortDir}
                  onClick={() => toggleSort("rank")}
                  className="w-10"
                >
                  #
                </SortHeader>
                <th className="px-3 py-2.5">Keyword</th>
                <SortHeader
                  active={sortKey === "msv"}
                  dir={sortDir}
                  onClick={() => toggleSort("msv")}
                  className="text-right"
                >
                  MSV
                </SortHeader>
                <SortHeader
                  active={sortKey === "kd"}
                  dir={sortDir}
                  onClick={() => toggleSort("kd")}
                  className="text-right"
                >
                  KD
                </SortHeader>
                <SortHeader
                  active={sortKey === "cpc"}
                  dir={sortDir}
                  onClick={() => toggleSort("cpc")}
                  className="text-right"
                >
                  CPC
                </SortHeader>
                <th className="px-3 py-2.5">Intent</th>
                <th className="px-3 py-2.5">Page</th>
                <th className="px-3 py-2.5 text-center">Ads</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <motion.tr
                  key={r.rank}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {r.rank}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.keyword}</span>
                      {r.isShortTail ? (
                        <Badge
                          variant="outline"
                          className="border-violet-400/30 bg-violet-500/10 px-1.5 py-0 text-[9px] text-violet-200"
                        >
                          short
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0 text-[9px] text-emerald-200"
                        >
                          long
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                          style={{ width: `${(r.msv / maxMsv) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums">{fmtMsv(r.msv)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                            kdColor(r.kd),
                          )}
                          style={{ width: `${(r.kd / 100) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums">{r.kd}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    ${r.cpc.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={cn("px-1.5 py-0 text-[9px]", intentClass(r.intent))}
                    >
                      {r.intent.split("/")[0].split("·")[0].trim()}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {r.page}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.inGoogleAds ? (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-300">
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-xs text-muted-foreground">
                    No keywords match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function SortHeader({
  children,
  active,
  dir,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={cn("px-3 py-2.5", className)}>
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider transition-colors hover:text-foreground",
          active ? "text-violet-200" : "text-muted-foreground",
        )}
      >
        {children}
        {active &&
          (dir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </button>
    </th>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        active
          ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/30"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
