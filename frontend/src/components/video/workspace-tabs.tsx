"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ScanEye,
  MessageSquareText,
  AlertTriangle,
  FileText,
  Code2,
  BarChart3,
  Keyboard,
  type LucideIcon,
} from "lucide-react";
import type { VideoDetail } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { SummaryPanel } from "./summary-panel";
import { TranscriptPanel } from "./transcript-panel";
import { KeyframesPanel } from "./keyframes-panel";
import { EventsPanel } from "./events-panel";
import { InsightsPanel } from "./insights-panel";
import { ChatPanel } from "./chat-panel";

type TabDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  accent: string; // gradient for active state
  count: number; // 0 = no badge
  visible: boolean;
};

export function WorkspaceTabs({
  video,
  tab,
  onTabChange,
  onSeek,
}: {
  video: VideoDetail;
  tab: string;
  onTabChange: (v: string) => void;
  onSeek: (s: number) => void;
}) {
  const tabs = useMemo<TabDef[]>(() => {
    const summary = video.summary;
    return [
      {
        id: "summary",
        label: "Summary",
        icon: Sparkles,
        description: "Overview, key takeaways and chapters",
        accent: "from-violet-500/20 to-fuchsia-500/15 ring-violet-400/30 text-violet-100",
        count: summary?.key_points?.length ?? 0,
        visible: true,
      },
      {
        id: "transcript",
        label: "Transcript",
        icon: FileText,
        description: "Full speech-to-text · click any line to seek",
        accent: "from-cyan-500/20 to-sky-500/15 ring-cyan-400/30 text-cyan-100",
        count: video.transcript?.length ?? 0,
        visible: true,
      },
      {
        id: "frames",
        label: "Frames",
        icon: ScanEye,
        description: "Vision-captioned keyframes from the video",
        accent: "from-emerald-500/20 to-teal-500/15 ring-emerald-400/30 text-emerald-100",
        count: video.keyframes?.length ?? 0,
        visible: true,
      },
      {
        id: "events",
        label: "Events",
        icon: AlertTriangle,
        description: "Timestamped events the model surfaced",
        accent: "from-amber-500/20 to-rose-500/15 ring-amber-400/30 text-amber-100",
        count: video.events?.length ?? 0,
        visible: true,
      },
      {
        id: "insights",
        label: "Insights",
        icon: BarChart3,
        description: "Charts and statistics across the analysis",
        accent: "from-fuchsia-500/20 to-pink-500/15 ring-fuchsia-400/30 text-fuchsia-100",
        count: 0,
        visible: true,
      },
      {
        id: "chat",
        label: "Chat",
        icon: MessageSquareText,
        description: "Ask anything about the video — answers cite the source",
        accent: "from-indigo-500/20 to-violet-500/15 ring-indigo-400/30 text-indigo-100",
        count: 0,
        visible: true,
      },
      {
        id: "pseudo",
        label: "Code",
        icon: Code2,
        description: "Strategy extracted as runnable pseudocode",
        accent: "from-slate-500/20 to-zinc-500/15 ring-slate-400/30 text-slate-100",
        count: 0,
        visible: !!summary?.pseudocode,
      },
    ];
  }, [video]);

  const visibleTabs = tabs.filter((t) => t.visible);
  const active = visibleTabs.find((t) => t.id === tab) ?? visibleTabs[0];

  // ── Numeric keyboard shortcuts (1-N) ────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when typing in input/textarea/contenteditable
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > visibleTabs.length) return;
      onTabChange(visibleTabs[n - 1].id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visibleTabs, onTabChange]);

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="space-y-3">
      {/* ─── Tab nav: responsive grid of tile triggers ─────────────── */}
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 rounded-2xl border border-white/[0.06] bg-card/40 p-1.5 backdrop-blur-md sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-6">
        {visibleTabs.map((t, i) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            title={`${t.label} — ${t.description} · press ${i + 1}`}
            className={cn(
              "group relative flex h-auto flex-col items-center gap-1 overflow-hidden rounded-xl px-2 py-2.5 text-xs font-medium transition-all",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-white/[0.04] data-[state=inactive]:hover:text-foreground",
              "data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500/20 data-[state=active]:to-fuchsia-500/15 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-violet-950/30 data-[state=active]:ring-1 data-[state=active]:ring-violet-400/30",
            )}
          >
            <div className="flex w-full items-center justify-between gap-1">
              <span
                className="font-mono text-[9px] opacity-40 transition-opacity group-hover:opacity-80 group-data-[state=active]:opacity-80"
                aria-hidden
              >
                {i + 1}
              </span>
              {t.count > 0 ? (
                <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-white/[0.08] px-1 text-[10px] font-semibold tabular-nums group-data-[state=active]:bg-violet-500/20 group-data-[state=active]:text-violet-100">
                  {t.count > 99 ? "99+" : t.count}
                </span>
              ) : (
                <span className="h-4" aria-hidden />
              )}
            </div>
            <t.icon className="h-4 w-4" />
            <span className="text-[11px] leading-tight">{t.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* ─── Active panel header + content ─────────────────────────── */}
      {visibleTabs.map((t) => (
        <TabsContent key={t.id} value={t.id} className="mt-0">
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-md">
            <PanelHeader def={t} active={active.id === t.id} />
            <div className="p-3">
              {t.id === "summary" && <SummaryPanel video={video} onSeek={onSeek} />}
              {t.id === "transcript" && <TranscriptPanel video={video} onSeek={onSeek} />}
              {t.id === "frames" && <KeyframesPanel video={video} onSeek={onSeek} />}
              {t.id === "events" && <EventsPanel video={video} onSeek={onSeek} />}
              {t.id === "insights" && <InsightsPanel video={video} onSeek={onSeek} />}
              {t.id === "chat" && <ChatPanel video={video} onSeek={onSeek} />}
              {t.id === "pseudo" && video.summary?.pseudocode && (
                <pre className="max-h-[60vh] min-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-black/30 p-4 font-mono text-xs leading-relaxed scrollbar-thin">
                  {video.summary.pseudocode}
                </pre>
              )}
            </div>
          </div>
        </TabsContent>
      ))}

      {/* ─── Footer hint ──────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-1.5 px-1 text-[10px] text-muted-foreground">
        <Keyboard className="h-3 w-3" />
        <span>Press</span>
        <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[9px]">
          1
        </kbd>
        <span>–</span>
        <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[9px]">
          {visibleTabs.length}
        </kbd>
        <span>to switch tabs · </span>
        <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[9px]">
          ←
        </kbd>
        <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[9px]">
          →
        </kbd>
        <span>to navigate</span>
      </div>
    </Tabs>
  );
}

function PanelHeader({ def, active }: { def: TabDef; active: boolean }) {
  return (
    <motion.div
      key={def.id}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/[0.06] bg-card/80 px-4 py-2.5 backdrop-blur"
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1",
          def.accent,
        )}
      >
        <def.icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold tracking-tight">
            {def.label}
          </h3>
          {def.count > 0 && (
            <span className="rounded-full bg-white/[0.05] px-1.5 py-0 font-mono text-[10px] font-medium tabular-nums text-muted-foreground">
              {def.count}
            </span>
          )}
        </div>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {def.description}
        </p>
      </div>
      {active && (
        <span className="hidden items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          live
        </span>
      )}
    </motion.div>
  );
}
