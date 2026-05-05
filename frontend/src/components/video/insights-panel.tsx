"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlignLeft,
  BookOpen,
  Gauge,
  Hash,
  Image as ImageIcon,
  Mic,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VideoDetail } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatTimestamp } from "@/lib/utils";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_PALETTE,
  ChartShell,
  ChartTooltip,
} from "@/components/analytics/chart-shell";

/* ── Token tokeniser & stoplist for "Top keywords" ─────────────── */
const STOPWORDS = new Set<string>(
  (
    "a about above after again against all am an and any are aren as at be because been before being below between both but by can cannot could did didn do does doesn doing don down during each few for from further had hadn has hasn have haven having he her here hers herself him himself his how i if in into is isn it its itself just ll let me might mightn more most mustn my myself need no nor not now of off on once only or other ought our ours ourselves out over own re s same shan she should shouldn so some such t than that the their theirs them themselves then there these they this those through to too under until up ve very was wasn we were weren what when where which while who whom why with won would wouldn y you your yours yourself yourselves like get got just really also one two three thing things really very much many lot lots way ways say says said going gonna want wanted know knows knew think thinks thought see seen saw look looked looks make makes made take takes took good well right okay ok yeah yes no kind sort actually basically literally probably maybe perhaps something someone somebody anything anyone nothing everyone everything"
  )
    .split(/\s+/)
    .filter(Boolean),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[‘’']/g, "'")
    .replace(/[^a-z'\s]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t) && !/^'+$/.test(t));
}

function topKeywords(text: string, n = 12): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const tok of tokenize(text)) counts.set(tok, (counts.get(tok) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

/* ── Bucket transcript words into time bins ────────────────────── */
function bucketBy(
  segments: { start: number; end: number; text: string }[],
  totalSec: number,
  bucketCount = 32,
): { t: number; words: number; durSec: number }[] {
  if (totalSec <= 0 || !segments.length) return [];
  const bucketSec = totalSec / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    t: i * bucketSec,
    words: 0,
    durSec: bucketSec,
  }));
  for (const s of segments) {
    const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(s.start / bucketSec)));
    const wc = s.text.trim().split(/\s+/).filter(Boolean).length;
    buckets[idx].words += wc;
  }
  return buckets;
}

/* ── Words inside each chapter range ───────────────────────────── */
function wordsPerChapter(
  chapters: { start: number; end: number; title: string }[],
  segments: { start: number; end: number; text: string }[],
): { label: string; value: number; start: number }[] {
  return chapters.map((c) => {
    let words = 0;
    for (const s of segments) {
      if (s.start >= c.start && s.start < c.end) {
        words += s.text.trim().split(/\s+/).filter(Boolean).length;
      }
    }
    return { label: c.title, value: words, start: c.start };
  });
}

function speakerShare(
  segments: { start: number; end: number; text: string; speaker: string | null }[],
): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const s of segments) {
    if (!s.speaker) continue;
    map.set(s.speaker, (map.get(s.speaker) ?? 0) + Math.max(0, s.end - s.start));
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
}

/* ── Stat tile ─────────────────────────────────────────────────── */
function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-display text-lg font-bold leading-none tabular-nums">{value}</p>
          {hint && <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1", accent)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
    </Card>
  );
}

/* ── Main panel ────────────────────────────────────────────────── */
export function InsightsPanel({
  video,
  onSeek,
}: {
  video: VideoDetail;
  onSeek: (s: number) => void;
}) {
  const totalSec = video.duration_sec ?? 0;
  const segments = video.transcript ?? [];
  const keyframes = video.keyframes ?? [];
  const events = video.events ?? [];
  const chapters = video.summary?.chapters ?? [];

  const stats = useMemo(() => {
    const totalWords = segments.reduce(
      (n, s) => n + s.text.trim().split(/\s+/).filter(Boolean).length,
      0,
    );
    const minutes = totalSec / 60;
    const wpm = minutes > 0 ? Math.round(totalWords / minutes) : 0;
    const speakers = new Set(segments.map((s) => s.speaker).filter(Boolean)).size;
    return {
      totalWords,
      wpm,
      speakers,
      segments: segments.length,
      keyframes: keyframes.length,
      events: events.length,
    };
  }, [segments, keyframes, events, totalSec]);

  const buckets = useMemo(() => bucketBy(segments, totalSec), [segments, totalSec]);
  const keyframeDensity = useMemo(() => {
    if (!buckets.length || !keyframes.length) return [];
    const bucketSec = totalSec / buckets.length;
    return buckets.map((b, i) => ({
      t: b.t,
      label: formatTimestamp(b.t),
      words: b.words,
      keyframes: keyframes.filter((k) => {
        const idx = Math.min(buckets.length - 1, Math.floor(k.timestamp / bucketSec));
        return idx === i;
      }).length,
    }));
  }, [buckets, keyframes, totalSec]);

  const chapterData = useMemo(
    () => wordsPerChapter(chapters, segments),
    [chapters, segments],
  );

  const allText = useMemo(() => segments.map((s) => s.text).join(" "), [segments]);
  const keywords = useMemo(() => topKeywords(allText, 12), [allText]);

  const speakers = useMemo(() => speakerShare(segments), [segments]);

  /* ── Empty state ────────────────────────────────────────────── */
  if (!segments.length && !keyframes.length && !events.length) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Insights will appear here once the analysis completes.
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-360px)] min-h-[440px] max-h-[760px] pr-2">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            label="Words"
            value={stats.totalWords.toLocaleString()}
            hint={`${stats.segments} segments`}
            icon={AlignLeft}
            accent="bg-violet-500/15 text-violet-200 ring-violet-400/30"
          />
          <StatTile
            label="Speech rate"
            value={stats.wpm > 0 ? `${stats.wpm}` : "—"}
            hint="words per minute"
            icon={Gauge}
            accent="bg-cyan-500/15 text-cyan-200 ring-cyan-400/30"
          />
          <StatTile
            label="Speakers"
            value={stats.speakers || "—"}
            hint={stats.speakers > 0 ? "diarised" : "no diarisation"}
            icon={Mic}
            accent="bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30"
          />
          <StatTile
            label="Keyframes"
            value={stats.keyframes}
            hint="vision sampled"
            icon={ImageIcon}
            accent="bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
          />
          <StatTile
            label="Events"
            value={stats.events}
            hint="detected moments"
            icon={Activity}
            accent="bg-amber-500/15 text-amber-200 ring-amber-400/30"
          />
          <StatTile
            label="Duration"
            value={totalSec ? formatTimestamp(totalSec) : "—"}
            hint={chapters.length ? `${chapters.length} chapters` : undefined}
            icon={BookOpen}
            accent="bg-rose-500/15 text-rose-200 ring-rose-400/30"
          />
        </div>

        {/* Activity timeline (transcript words + keyframe density + event markers) */}
        <ChartShell
          title="Activity timeline"
          description="Transcript density + keyframe sampling along the runtime"
          icon={Activity}
          accent="text-violet-300"
          empty={!buckets.length}
        >
          <div className="relative h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keyframeDensity.length ? keyframeDensity : buckets.map((b) => ({ ...b, label: formatTimestamp(b.t), keyframes: 0 }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="words" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="kf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_GRID} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: CHART_AXIS, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={36}
                />
                <YAxis
                  tick={{ fill: CHART_AXIS, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "hsl(270 91% 65% / 0.08)" }}
                  content={(p) => <ChartTooltip {...p} />}
                />
                <Bar dataKey="words" name="Words" fill="url(#words)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="keyframes" name="Keyframes" fill="url(#kf)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Event markers — overlaid as absolute dots positioned by % of duration */}
            {totalSec > 0 && events.length > 0 ? (
              <div className="pointer-events-none absolute inset-x-8 bottom-1.5 h-0">
                {events.map((e, i) => {
                  const pct = Math.min(100, Math.max(0, (e.timestamp / totalSec) * 100));
                  const color =
                    e.severity === "warning"
                      ? "#f59e0b"
                      : e.severity === "notice"
                      ? "#a855f7"
                      : "#06b6d4";
                  return (
                    <button
                      key={i}
                      onClick={() => onSeek(e.timestamp)}
                      title={`${e.title} · ${formatTimestamp(e.timestamp)}`}
                      style={{ left: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}aa` }}
                      className="pointer-events-auto absolute -translate-x-1/2 h-2 w-2 rounded-full ring-2 ring-background hover:scale-150 transition-transform cursor-pointer"
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-violet-400" /> Words
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-cyan-400" /> Keyframes
            </span>
            {events.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 ring-1 ring-background" /> Event (click to seek)
              </span>
            )}
          </div>
        </ChartShell>

        {/* Chapter density */}
        {chapterData.length > 0 ? (
          <ChartShell
            title="Chapter depth"
            description="Words spoken inside each chapter"
            icon={BookOpen}
            accent="text-emerald-300"
          >
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chapterData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="chap" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_GRID} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: CHART_AXIS, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tick={{ fill: CHART_AXIS, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={140}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(160 91% 50% / 0.08)" }}
                    content={(p) => (
                      <ChartTooltip
                        {...p}
                        formatter={(v: number) => `${v.toLocaleString()} words`}
                      />
                    )}
                  />
                  <Bar
                    dataKey="value"
                    name="Words"
                    fill="url(#chap)"
                    radius={[0, 6, 6, 0]}
                    onClick={(d) => {
                      const seg = d as unknown as { start?: number };
                      if (typeof seg?.start === "number") onSeek(seg.start);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>
        ) : null}

        {/* Top keywords */}
        {keywords.length > 0 ? (
          <ChartShell
            title="Top keywords"
            description="Most frequent terms in the transcript (filtered)"
            icon={Hash}
            accent="text-fuchsia-300"
          >
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.map((k, i) => {
                const max = keywords[0].value || 1;
                const intensity = 0.4 + 0.6 * (k.value / max);
                return (
                  <span
                    key={k.label}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                    style={{
                      borderColor: `hsl(${(280 + i * 18) % 360} 80% 60% / 0.35)`,
                      background: `hsl(${(280 + i * 18) % 360} 80% 60% / ${0.06 + 0.12 * intensity})`,
                      color: `hsl(${(280 + i * 18) % 360} 90% ${75 + 10 * intensity}%)`,
                    }}
                  >
                    <span className="font-medium">{k.label}</span>
                    <span className="font-mono text-[10px] opacity-80">×{k.value}</span>
                  </span>
                );
              })}
            </div>
          </ChartShell>
        ) : null}

        {/* Speaker share (only if diarisation exists) */}
        {speakers.length > 1 ? (
          <ChartShell
            title="Speaker share"
            description="Speaking time distribution"
            icon={Mic}
            accent="text-cyan-300"
          >
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={speakers}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="55%"
                    outerRadius="90%"
                    paddingAngle={2}
                    stroke="hsl(265 30% 8%)"
                    strokeWidth={2}
                  >
                    {speakers.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={(p) => (
                      <ChartTooltip
                        {...p}
                        formatter={(v: number) => formatTimestamp(v)}
                      />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px]">
              {speakers.map((s, i) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.05] bg-white/[0.02] px-2 py-0.5 text-muted-foreground"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }}
                  />
                  <span>{s.label}</span>
                  <span className="font-mono text-foreground/80">{formatTimestamp(s.value)}</span>
                </span>
              ))}
            </div>
          </ChartShell>
        ) : null}
      </motion.div>
    </ScrollArea>
  );
}
