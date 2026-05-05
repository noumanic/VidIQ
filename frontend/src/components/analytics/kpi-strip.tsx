"use client";

import { motion } from "framer-motion";
import {
  Video as VideoIcon,
  Clock,
  Sparkles,
  Image as ImageIcon,
  MessageSquareText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import type { AnalyticsKPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tile = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: string;
};

function formatHours(h: number): string {
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${Math.round(h * 60)}m`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function KpiStrip({ kpi }: { kpi: AnalyticsKPI }) {
  const tiles: Tile[] = [
    {
      label: "Videos analysed",
      value: formatNumber(kpi.videos_total),
      hint: `${kpi.videos_completed} ready · ${kpi.videos_processing} active`,
      icon: VideoIcon,
      accent: "from-violet-500/30 to-fuchsia-500/20 text-violet-200 ring-violet-400/30",
    },
    {
      label: "Hours processed",
      value: formatHours(kpi.hours_processed),
      hint: kpi.avg_duration_sec
        ? `avg ${Math.round(kpi.avg_duration_sec / 60)} min / video`
        : undefined,
      icon: Clock,
      accent: "from-cyan-500/30 to-sky-500/20 text-cyan-200 ring-cyan-400/30",
    },
    {
      label: "Events detected",
      value: formatNumber(kpi.events_detected),
      hint: `${formatNumber(kpi.keyframes_extracted)} keyframes`,
      icon: Sparkles,
      accent: "from-fuchsia-500/30 to-pink-500/20 text-fuchsia-200 ring-fuchsia-400/30",
    },
    {
      label: "Transcript segments",
      value: formatNumber(kpi.transcript_segments),
      hint: `${formatNumber(kpi.chat_messages)} chat turns`,
      icon: MessageSquareText,
      accent: "from-emerald-500/30 to-teal-500/20 text-emerald-200 ring-emerald-400/30",
    },
    {
      label: "Completion rate",
      value: `${Math.round(kpi.completion_rate * 100)}%`,
      hint: `${kpi.videos_completed}/${kpi.videos_total || 0}`,
      icon: CheckCircle2,
      accent: "from-emerald-500/30 to-lime-500/20 text-emerald-200 ring-emerald-400/30",
    },
    {
      label: "In flight",
      value: formatNumber(kpi.videos_processing),
      hint: kpi.videos_failed > 0 ? `${kpi.videos_failed} failed` : "no failures",
      icon: kpi.videos_processing > 0 ? Loader2 : kpi.videos_failed > 0 ? AlertTriangle : ImageIcon,
      accent:
        kpi.videos_failed > 0
          ? "from-rose-500/30 to-orange-500/20 text-rose-200 ring-rose-400/30"
          : "from-violet-500/25 to-indigo-500/20 text-violet-200 ring-violet-400/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.02, duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="overflow-hidden p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </p>
                <p className="mt-1.5 font-display text-2xl font-bold leading-none tracking-tight tabular-nums">
                  {t.value}
                </p>
                {t.hint && (
                  <p className="mt-1.5 line-clamp-1 text-[11px] text-muted-foreground">{t.hint}</p>
                )}
              </div>
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
                  t.accent
                )}
              >
                <t.icon
                  className={cn(
                    "h-4 w-4",
                    t.label === "In flight" && kpi.videos_processing > 0 && "animate-spin"
                  )}
                />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
