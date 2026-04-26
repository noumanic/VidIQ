"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info, Bell } from "lucide-react";
import type { VideoDetail } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/utils";

const ICONS = { info: Info, notice: Bell, warning: AlertTriangle } as const;

export function EventsPanel({ video, onSeek }: { video: VideoDetail; onSeek: (s: number) => void }) {
  if (!video.events?.length) {
    return (
      <div className="rounded-2xl border p-6 text-sm text-muted-foreground">No events detected.</div>
    );
  }

  return (
    <ScrollArea className="h-[640px] pr-2">
      <ol className="relative ml-3 border-l border-border space-y-4 pl-6 py-2">
        {video.events.map((e, i) => {
          const Icon = ICONS[e.severity] ?? Info;
          const accent =
            e.severity === "warning"
              ? "border-amber-500/40 bg-amber-500/5"
              : e.severity === "notice"
              ? "border-blue-500/40 bg-blue-500/5"
              : "border-border bg-card";
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative"
            >
              <span className="absolute -left-[33px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border">
                <Icon className="h-3 w-3" />
              </span>
              <button
                onClick={() => onSeek(e.timestamp)}
                className={`w-full rounded-xl border ${accent} p-3 text-left hover:shadow-md transition-all`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono text-primary">
                    {formatTimestamp(e.timestamp)}
                  </span>
                  {e.category ? <Badge variant="outline">{e.category}</Badge> : null}
                </div>
                <h4 className="text-sm font-semibold">{e.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{e.description}</p>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </ScrollArea>
  );
}
