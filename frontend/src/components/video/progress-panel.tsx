"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Radio } from "lucide-react";
import type { VideoDetail } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const STAGES = [
  { key: "metadata", label: "Metadata" },
  { key: "transcript", label: "Transcript" },
  { key: "audio", label: "Audio" },
  { key: "transcribe", label: "Transcribe" },
  { key: "frames-download", label: "Video" },
  { key: "keyframes", label: "Keyframes" },
  { key: "vision", label: "Vision" },
  { key: "summarize", label: "Summarize" },
  { key: "done", label: "Done" },
];

export function ProgressPanel({ video, live = false }: { video: VideoDetail; live?: boolean }) {
  if (video.status === "failed") {
    return (
      <Card className="p-4 border-destructive/40 bg-destructive/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Analysis failed</div>
            <div className="text-xs text-muted-foreground mt-0.5">{video.error || "Unknown error"}</div>
          </div>
        </div>
      </Card>
    );
  }

  const currentIdx = STAGES.findIndex((s) => s.key === video.stage);
  const pct = Math.max(2, Math.round(video.progress * 100));

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-fuchsia-500/5 animate-pulse" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {live ? (
                <Badge variant="live" className="gap-1"><Radio className="h-3 w-3" /> LIVE STREAMING</Badge>
              ) : (
                <Badge variant="default" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>
              )}
              <span className="text-sm font-medium capitalize">{video.stage || "queued"}</span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
          </div>
          <Progress value={pct} className="mb-4" />
          {!live ? (
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s, i) => {
                const done = currentIdx > i || video.status === "completed";
                const active = i === currentIdx && video.status !== "completed";
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                      done
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                        : active
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border text-muted-foreground/60"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : active ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="h-3 w-3 rounded-full border" />
                    )}
                    {s.label}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
