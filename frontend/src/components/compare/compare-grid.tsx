"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlignLeft,
  Clock,
  Sparkles,
  Image as ImageIcon,
  AlertTriangle,
  BookOpen,
  Tag,
  ExternalLink,
  Activity,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VideoDetail } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatTimestamp } from "@/lib/utils";
import {
  CHART_AXIS,
  CHART_GRID,
  ChartTooltip,
} from "@/components/analytics/chart-shell";

const ACCENTS = [
  {
    color: "#a855f7",
    soft: "from-violet-500/20 to-fuchsia-500/15 ring-violet-400/30 text-violet-100",
    text: "text-violet-200",
    bg: "bg-violet-500/15",
  },
  {
    color: "#06b6d4",
    soft: "from-cyan-500/20 to-sky-500/15 ring-cyan-400/30 text-cyan-100",
    text: "text-cyan-200",
    bg: "bg-cyan-500/15",
  },
  {
    color: "#10b981",
    soft: "from-emerald-500/20 to-teal-500/15 ring-emerald-400/30 text-emerald-100",
    text: "text-emerald-200",
    bg: "bg-emerald-500/15",
  },
];

type Stats = {
  id: string;
  shortLabel: string;
  duration: number;
  words: number;
  segments: number;
  keyframes: number;
  events: number;
  chapters: number;
  topics: string[];
  sentiment: string | null;
  wpm: number;
};

function computeStats(v: VideoDetail, i: number): Stats {
  const words = (v.transcript ?? []).reduce(
    (n, s) => n + s.text.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const minutes = (v.duration_sec ?? 0) / 60;
  return {
    id: v.id,
    shortLabel: `#${i + 1}`,
    duration: v.duration_sec ?? 0,
    words,
    segments: v.transcript?.length ?? 0,
    keyframes: v.keyframes?.length ?? 0,
    events: v.events?.length ?? 0,
    chapters: v.summary?.chapters?.length ?? 0,
    topics: (v.summary?.topics ?? []).map((t) => t.toLowerCase()),
    sentiment: v.summary?.sentiment ?? null,
    wpm: minutes > 0 ? Math.round(words / minutes) : 0,
  };
}

export function CompareGrid({ videos }: { videos: VideoDetail[] }) {
  const stats = useMemo(() => videos.map((v, i) => computeStats(v, i)), [videos]);

  // Topic overlap — set of topics shared across ALL videos
  const sharedTopics = useMemo(() => {
    if (stats.length === 0) return [];
    const sets = stats.map((s) => new Set(s.topics));
    return [...sets[0]].filter((t) => sets.every((s) => s.has(t)));
  }, [stats]);

  // Per-video unique topics
  const uniqueTopics = useMemo(() => {
    return stats.map((s, i) => {
      const others = stats.filter((_, j) => j !== i).flatMap((o) => o.topics);
      const otherSet = new Set(others);
      return s.topics.filter((t) => !otherSet.has(t));
    });
  }, [stats]);

  // Bars-per-metric data (each row = one metric, bars = one per video)
  const metricBars = useMemo(() => {
    type Row = { metric: string } & Record<string, number | string>;
    const rows: Row[] = [
      { metric: "Words" },
      { metric: "Segments" },
      { metric: "Keyframes" },
      { metric: "Events" },
      { metric: "Chapters" },
    ];
    stats.forEach((s, i) => {
      rows[0][s.shortLabel] = s.words;
      rows[1][s.shortLabel] = s.segments;
      rows[2][s.shortLabel] = s.keyframes;
      rows[3][s.shortLabel] = s.events;
      rows[4][s.shortLabel] = s.chapters;
    });
    return rows;
  }, [stats]);

  return (
    <div className="space-y-5">
      {/* ─── Side-by-side cards ─────────────────────────────────── */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          videos.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3",
        )}
      >
        {videos.map((v, i) => (
          <VideoSummaryCard key={v.id} video={v} stats={stats[i]} accent={ACCENTS[i]} />
        ))}
      </div>

      {/* ─── Cross-video metrics chart ─────────────────────────── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
            <Activity className="h-4 w-4 text-violet-300" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold tracking-tight">
              Metric showdown
            </h3>
            <p className="text-xs text-muted-foreground">
              Words, segments, keyframes, events and chapters compared per video.
            </p>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricBars} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={CHART_GRID} vertical={false} />
              <XAxis
                dataKey="metric"
                tick={{ fill: CHART_AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: CHART_AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "hsl(270 91% 65% / 0.06)" }}
                content={(p) => (
                  <ChartTooltip
                    {...p}
                    formatter={(v: number) => v.toLocaleString()}
                  />
                )}
              />
              {stats.map((s, i) => (
                <Bar
                  key={s.id}
                  dataKey={s.shortLabel}
                  name={s.shortLabel}
                  fill={ACCENTS[i].color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
          {stats.map((s, i) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: ACCENTS[i].color }}
              />
              <span className={cn("font-mono", ACCENTS[i].text)}>{s.shortLabel}</span>
              <span className="line-clamp-1 max-w-[180px]">{videos[i].title}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* ─── Topic overlap ─────────────────────────────────────── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
            <Tag className="h-4 w-4 text-fuchsia-300" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold tracking-tight">
              Topic overlap
            </h3>
            <p className="text-xs text-muted-foreground">
              Shared topics across all selected videos · unique to each.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.04] p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
            <Sparkles className="h-3 w-3" />
            Shared by all
            <span className="ml-auto font-mono text-foreground/80">{sharedTopics.length}</span>
          </div>
          {sharedTopics.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {sharedTopics.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                >
                  {t}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No topics shared across all videos.
            </p>
          )}
        </div>

        <div
          className={cn(
            "grid grid-cols-1 gap-3",
            videos.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
          )}
        >
          {uniqueTopics.map((topics, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border bg-gradient-to-br p-3 ring-1",
                ACCENTS[i].soft,
              )}
            >
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                Unique to <span className="font-mono">{stats[i].shortLabel}</span>
                <span className="ml-auto font-mono">{topics.length}</span>
              </div>
              {topics.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Nothing unique vs. the other videos.
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Side-by-side overviews ─────────────────────────────── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
            <BookOpen className="h-4 w-4 text-cyan-300" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold tracking-tight">
              Side-by-side overviews
            </h3>
            <p className="text-xs text-muted-foreground">
              The opening summary from each analysis.
            </p>
          </div>
        </div>
        <div
          className={cn(
            "grid grid-cols-1 gap-3",
            videos.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
          )}
        >
          {videos.map((v, i) => (
            <div key={v.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-bold",
                    ACCENTS[i].bg,
                    ACCENTS[i].text,
                  )}
                >
                  {i + 1}
                </span>
                <span className="line-clamp-1 text-xs font-semibold">{v.title}</span>
              </div>
              <ScrollArea className="h-[180px] pr-2">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {v.summary?.overview ?? (
                    <span className="italic opacity-60">No summary available.</span>
                  )}
                </p>
              </ScrollArea>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Single-video summary card ────────────────────────────────── */

function VideoSummaryCard({
  video,
  stats,
  accent,
}: {
  video: VideoDetail;
  stats: Stats;
  accent: (typeof ACCENTS)[number];
}) {
  const tiles: { icon: LucideIcon; label: string; value: string }[] = [
    {
      icon: Clock,
      label: "Duration",
      value: stats.duration ? formatTimestamp(stats.duration) : "—",
    },
    {
      icon: AlignLeft,
      label: "Words",
      value: stats.words.toLocaleString(),
    },
    {
      icon: ImageIcon,
      label: "Frames",
      value: String(stats.keyframes),
    },
    {
      icon: AlertTriangle,
      label: "Events",
      value: String(stats.events),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn("h-full overflow-hidden bg-gradient-to-br ring-1", accent.soft)}>
        {/* Thumbnail strip */}
        <div className="relative h-28 overflow-hidden border-b border-white/[0.06] bg-muted/40">
          {video.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/30">
              —
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 text-white drop-shadow">
            <p className="line-clamp-1 text-sm font-semibold">{video.title}</p>
            <p className="line-clamp-1 text-[10px] opacity-80">
              {video.channel || video.source_type}
            </p>
          </div>
        </div>

        <div className="p-4">
          {/* Stat grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-2 text-center"
              >
                <t.icon className="mx-auto mb-1 h-3 w-3 text-muted-foreground" />
                <p className="font-display text-sm font-bold leading-none tabular-nums">
                  {t.value}
                </p>
                <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </p>
              </div>
            ))}
          </div>

          {/* Sentiment + WPM */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            {stats.sentiment && (
              <Badge variant="outline" className="border-white/10 bg-white/[0.04] capitalize">
                {stats.sentiment}
              </Badge>
            )}
            <span className="text-muted-foreground">
              <span className="font-mono font-semibold text-foreground/90">{stats.wpm}</span>{" "}
              wpm
            </span>
          </div>

          {/* Top topics */}
          {stats.topics.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Topics
              </p>
              <div className="flex flex-wrap gap-1">
                {stats.topics.slice(0, 6).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[10px]"
                  >
                    {t}
                  </span>
                ))}
                {stats.topics.length > 6 && (
                  <span className="rounded-full bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    +{stats.topics.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}

          <Link
            href={`/videos/${video.id}`}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Open full analysis
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
