"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  Loader2,
  RefreshCw,
  Sparkles,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { KpiStrip } from "@/components/analytics/kpi-strip";
import {
  DurationBucketsChart,
  EventCategoriesChart,
  EventSeverityChart,
  SentimentChart,
  SourceMixChart,
  StatusFunnelChart,
  TopTopicsChart,
  VolumeChart,
} from "@/components/analytics/charts";

const RANGES: { label: string; days: number }[] = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading, isError, refetch, isFetching, error } = useQuery({
    queryKey: ["analytics", days],
    queryFn: () => api.analyticsOverview(days),
    refetchInterval: 15_000,
    staleTime: 8_000,
  });

  return (
    <div className="container py-10 md:py-14">
      {/* ─── Header ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 ring-1 ring-violet-400/20">
            <BarChart3 className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                Analytics
              </h1>
              <Badge
                variant="outline"
                className="hidden gap-1.5 border-violet-400/30 bg-violet-500/10 text-violet-200 sm:inline-flex"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
                </span>
                Live
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Cross-library insights — refreshed every 15 s.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range switcher */}
          <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
            <Calendar className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  days === r.days
                    ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>

          <Button asChild size="sm" variant="gradient">
            <Link href="/analyze">
              <Sparkles className="h-4 w-4" />
              New analysis
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* ─── Content ───────────────────────────────────────────── */}
      {isLoading ? (
        <SkeletonGrid />
      ) : isError || !data ? (
        <ErrorState message={(error as Error)?.message ?? "Could not load analytics"} onRetry={() => refetch()} />
      ) : data.kpi.videos_total === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* KPI strip */}
          <KpiStrip kpi={data.kpi} />

          {/* Row 1: volume (wide) + source mix */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <VolumeChart data={data.daily_volume} delay={0.05} />
            </div>
            <SourceMixChart data={data.source_mix} delay={0.1} />
          </div>

          {/* Row 2: status funnel + top topics */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StatusFunnelChart data={data.status_breakdown} delay={0.05} />
            <div className="lg:col-span-2">
              <TopTopicsChart data={data.top_topics} delay={0.1} />
            </div>
          </div>

          {/* Row 3: events (cat + sev) + sentiment + duration */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <EventCategoriesChart data={data.event_categories} delay={0.05} />
            </div>
            <EventSeverityChart data={data.event_severity} delay={0.1} />
            <SentimentChart data={data.sentiment_distribution} delay={0.15} />
            <div className="lg:col-span-2 xl:col-span-4">
              <DurationBucketsChart data={data.duration_buckets} delay={0.2} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-white/[0.06] bg-card/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-[300px] animate-pulse rounded-2xl border border-white/[0.06] bg-card/40 lg:col-span-2" />
        <div className="h-[300px] animate-pulse rounded-2xl border border-white/[0.06] bg-card/40" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-[280px] animate-pulse rounded-2xl border border-white/[0.06] bg-card/40" />
        <div className="h-[280px] animate-pulse rounded-2xl border border-white/[0.06] bg-card/40 lg:col-span-2" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="overflow-hidden p-12 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-40"
      />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 ring-1 ring-rose-400/20">
          <AlertCircle className="h-6 w-6 text-rose-300" />
        </div>
        <h3 className="font-display text-base font-semibold">Couldn&apos;t load analytics</h3>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-5">
          <Loader2 className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="overflow-hidden p-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-40"
      />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-400/20">
          <BarChart3 className="h-7 w-7 text-violet-300" />
        </div>
        <h3 className="font-display text-lg font-semibold">No analytics yet</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Charts populate automatically as you analyse videos. Start your first one below — it&apos;ll show
          up here within a few seconds.
        </p>
        <Button asChild variant="gradient" className="mt-5">
          <Link href="/analyze">
            <Sparkles className="h-4 w-4" />
            Analyse a video
          </Link>
        </Button>
      </div>
    </Card>
  );
}
