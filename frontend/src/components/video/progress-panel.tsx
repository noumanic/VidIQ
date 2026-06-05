"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Radio, FileText, Upload, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import type { VideoDetail } from "@/lib/api";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const transcriptFileRef = useRef<HTMLInputElement>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const pasteMutation = useMutation({
    mutationFn: () => api.submitTranscript(video.id, transcript),
    onSuccess: () => {
      toast.success("Transcript submitted");
      router.refresh();
    },
    onError: (e: Error) => toast.error("Could not submit transcript", { description: e.message }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadSource(video.id, file),
    onSuccess: () => {
      toast.success("Upload received");
      router.refresh();
    },
    onError: (e: Error) => toast.error("Upload failed", { description: e.message }),
  });

  if (video.status === "needs_upload") {
    const busy = pasteMutation.isPending || uploadMutation.isPending;
    return (
      <Card className="border-amber-400/30 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-400" />
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <div className="text-sm font-semibold">Upload or transcript required</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {video.upload_message ||
                  "YouTube blocked automated access from the hosted backend. For full analysis, paste a transcript, upload a transcript file, upload audio/video, or try another public video with available captions."}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Paste transcript
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={busy}
                rows={5}
                className="min-h-28 w-full resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-primary"
                placeholder="Paste transcript text here..."
              />
              <Button
                type="button"
                size="sm"
                disabled={busy || !transcript.trim()}
                onClick={() => pasteMutation.mutate()}
              >
                {pasteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPaste className="h-4 w-4" />}
                Analyze pasted transcript
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={transcriptFileRef}
                type="file"
                accept=".txt,.srt,.vtt,.md,text/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                  e.currentTarget.value = "";
                }}
              />
              <input
                ref={mediaFileRef}
                type="file"
                accept="audio/*,video/*,.mp3,.wav,.m4a,.webm,.mp4,.mov,.mkv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                  e.currentTarget.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => transcriptFileRef.current?.click()}>
                <FileText className="h-4 w-4" />
                Upload transcript
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => mediaFileRef.current?.click()}>
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload audio/video
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

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
