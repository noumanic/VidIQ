"use client";

import {
  Activity,
  BarChart3,
  Layers,
  PieChart as PieChartIcon,
  Smile,
  TrendingUp,
  Tag,
  Hourglass,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from "recharts";
import type { LabelValue, TimePoint } from "@/lib/api";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_PALETTE,
  ChartShell,
  ChartTooltip,
} from "./chart-shell";

const STATUS_COLOR: Record<string, string> = {
  pending: "#94a3b8",
  processing: "#a855f7",
  live: "#ef4444",
  completed: "#10b981",
  failed: "#f43f5e",
};

const SOURCE_COLOR: Record<string, string> = {
  youtube: "#ef4444",
  live: "#f97316",
  upload: "#06b6d4",
  unknown: "#64748b",
};

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "#10b981",
  neutral: "#6366f1",
  negative: "#f43f5e",
  mixed: "#f59e0b",
};

function colorFor(map: Record<string, string>, key: string, fallback: string): string {
  return map[key.toLowerCase()] ?? fallback;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function capitalise(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── Volume over time ─────────────────────────────────────────── */
export function VolumeChart({ data, delay = 0 }: { data: TimePoint[]; delay?: number }) {
  const total = data.reduce((s, p) => s + p.count, 0);
  return (
    <ChartShell
      title="Volume over time"
      description={`${total} videos in the last ${data.length} days`}
      icon={TrendingUp}
      accent="text-violet-300"
      delay={delay}
      empty={total === 0}
    >
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickFormatter={shortDate}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              cursor={{ stroke: "#a855f7", strokeOpacity: 0.4, strokeWidth: 1 }}
              content={(p) => (
                <ChartTooltip
                  {...p}
                  label={typeof p.label === "string" ? shortDate(p.label) : p.label}
                  formatter={(v: number) => `${v} ${v === 1 ? "video" : "videos"}`}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Videos"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#vol)"
              activeDot={{ r: 4, fill: "#ec4899", stroke: "#fff", strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

/* ── Source mix donut ─────────────────────────────────────────── */
export function SourceMixChart({ data, delay = 0 }: { data: LabelValue[]; delay?: number }) {
  const total = data.reduce((s, p) => s + p.value, 0);
  return (
    <ChartShell
      title="Source mix"
      description="Where your videos come from"
      icon={PieChartIcon}
      accent="text-cyan-300"
      delay={delay}
      empty={total === 0}
    >
      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="60%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="hsl(265 30% 8%)"
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.label}
                  fill={colorFor(SOURCE_COLOR, d.label, CHART_PALETTE[i % CHART_PALETTE.length])}
                />
              ))}
            </Pie>
            <Tooltip
              content={(p) => (
                <ChartTooltip
                  {...p}
                  formatter={(v: number) =>
                    `${v} (${total ? Math.round((v / total) * 100) : 0}%)`
                  }
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tabular-nums">{total}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</span>
        </div>
      </div>
      <Legend data={data} colorMap={SOURCE_COLOR} />
    </ChartShell>
  );
}

/* ── Status funnel (horizontal bar) ───────────────────────────── */
export function StatusFunnelChart({ data, delay = 0 }: { data: LabelValue[]; delay?: number }) {
  const total = data.reduce((s, p) => s + p.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ChartShell
      title="Status funnel"
      description="Pipeline state across every analysis"
      icon={Activity}
      accent="text-emerald-300"
      delay={delay}
      empty={total === 0}
    >
      <div className="space-y-2.5 pt-1">
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          const color = colorFor(STATUS_COLOR, d.label, "#a855f7");
          return (
            <div key={d.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">{d.label}</span>
                <span className="font-mono font-semibold tabular-nums">{d.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(pct, d.value > 0 ? 4 : 0)}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    boxShadow: `0 0 12px ${color}40`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartShell>
  );
}

/* ── Top topics horizontal bar ────────────────────────────────── */
export function TopTopicsChart({ data, delay = 0 }: { data: LabelValue[]; delay?: number }) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 10);
  return (
    <ChartShell
      title="Top topics"
      description="Most common topics across your library"
      icon={Tag}
      accent="text-fuchsia-300"
      delay={delay}
      empty={sorted.length === 0}
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="topic" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              dataKey="label"
              type="category"
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip
              cursor={{ fill: "hsl(270 91% 65% / 0.08)" }}
              content={(p) => (
                <ChartTooltip
                  {...p}
                  formatter={(v: number) => `${v} ${v === 1 ? "video" : "videos"}`}
                />
              )}
            />
            <Bar dataKey="value" name="Mentions" fill="url(#topic)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

/* ── Event categories radial ──────────────────────────────────── */
export function EventCategoriesChart({
  data,
  delay = 0,
}: {
  data: LabelValue[];
  delay?: number;
}) {
  const total = data.reduce((s, p) => s + p.value, 0);
  const enriched = data.slice(0, 8).map((d, i) => ({
    ...d,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }));
  return (
    <ChartShell
      title="Event categories"
      description={`${total} events across all videos`}
      icon={Layers}
      accent="text-amber-300"
      delay={delay}
      empty={total === 0}
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="22%"
            outerRadius="100%"
            data={enriched}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, Math.max(1, ...enriched.map((d) => d.value))]} tick={false} />
            <RadialBar
              background={{ fill: "hsl(270 25% 100% / 0.04)" }}
              dataKey="value"
              cornerRadius={6}
            />
            <Tooltip
              content={(p) => (
                <ChartTooltip
                  {...p}
                  formatter={(v: number) => `${v} ${v === 1 ? "event" : "events"}`}
                />
              )}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <Legend data={enriched.map((e) => ({ label: e.label, value: e.value }))} colors={enriched.map((e) => e.fill)} />
    </ChartShell>
  );
}

/* ── Sentiment distribution ───────────────────────────────────── */
export function SentimentChart({ data, delay = 0 }: { data: LabelValue[]; delay?: number }) {
  const total = data.reduce((s, p) => s + p.value, 0);
  return (
    <ChartShell
      title="Sentiment distribution"
      description="Overall mood across analysed videos"
      icon={Smile}
      accent="text-emerald-300"
      delay={delay}
      empty={total === 0}
    >
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickFormatter={capitalise}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "hsl(270 91% 65% / 0.08)" }}
              content={(p) => (
                <ChartTooltip
                  {...p}
                  formatter={(v: number) => `${v} ${v === 1 ? "video" : "videos"}`}
                />
              )}
            />
            <Bar dataKey="value" name="Videos" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <Cell
                  key={d.label}
                  fill={colorFor(SENTIMENT_COLOR, d.label, CHART_PALETTE[i % CHART_PALETTE.length])}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

/* ── Duration buckets ─────────────────────────────────────────── */
export function DurationBucketsChart({
  data,
  delay = 0,
}: {
  data: LabelValue[];
  delay?: number;
}) {
  const total = data.reduce((s, p) => s + p.value, 0);
  return (
    <ChartShell
      title="Duration distribution"
      description="How long are the videos you analyse?"
      icon={Hourglass}
      accent="text-cyan-300"
      delay={delay}
      empty={total === 0}
    >
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="dur" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "hsl(190 91% 65% / 0.08)" }}
              content={(p) => (
                <ChartTooltip
                  {...p}
                  formatter={(v: number) => `${v} ${v === 1 ? "video" : "videos"}`}
                />
              )}
            />
            <Bar dataKey="value" name="Videos" fill="url(#dur)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

/* ── Event severity (compact bar) ─────────────────────────────── */
export function EventSeverityChart({
  data,
  delay = 0,
}: {
  data: LabelValue[];
  delay?: number;
}) {
  const SEV_COLOR: Record<string, string> = {
    info: "#06b6d4",
    notice: "#a855f7",
    warning: "#f59e0b",
  };
  const total = data.reduce((s, p) => s + p.value, 0);
  return (
    <ChartShell
      title="Event severity"
      description="Info / notice / warning counts"
      icon={BarChart3}
      accent="text-rose-300"
      delay={delay}
      empty={total === 0}
    >
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickFormatter={capitalise}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "hsl(270 91% 65% / 0.08)" }}
              content={(p) => (
                <ChartTooltip
                  {...p}
                  formatter={(v: number) => `${v} ${v === 1 ? "event" : "events"}`}
                />
              )}
            />
            <Bar dataKey="value" name="Events" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <Cell
                  key={d.label}
                  fill={colorFor(SEV_COLOR, d.label, CHART_PALETTE[i % CHART_PALETTE.length])}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

/* ── Shared legend (used by donut + radial) ───────────────────── */
function Legend({
  data,
  colorMap,
  colors,
}: {
  data: LabelValue[];
  colorMap?: Record<string, string>;
  colors?: string[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px]">
      {data.map((d, i) => {
        const c =
          colors?.[i] ??
          (colorMap ? colorFor(colorMap, d.label, CHART_PALETTE[i % CHART_PALETTE.length]) : CHART_PALETTE[i % CHART_PALETTE.length]);
        return (
          <span
            key={d.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.05] bg-white/[0.02] px-2 py-0.5 text-muted-foreground"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: c }} />
            <span className="capitalize">{d.label}</span>
            <span className="font-mono text-foreground/80">{d.value}</span>
          </span>
        );
      })}
    </div>
  );
}
