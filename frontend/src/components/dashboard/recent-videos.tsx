"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Video as VideoIcon, Radio, CheckCircle2, AlertCircle, Play, Tag as TagIcon } from "lucide-react";
import { api, VideoSummary } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatTimestamp, relativeTime } from "@/lib/utils";

export function RecentVideos() {
  const { data, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: api.listVideos,
    refetchInterval: 4_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-[16/11] animate-pulse rounded-2xl border border-white/[0.06] bg-card/40"
          />
        ))}
      </div>
    );
  }

  const videos = data ?? [];
  if (videos.length === 0) {
    return (
      <Card className="overflow-hidden p-12 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-40"
        />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-400/20">
            <VideoIcon className="h-6 w-6 text-violet-300" />
          </div>
          <h3 className="font-display text-base font-semibold">No analyses yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a YouTube URL into the search above to get started.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.slice(0, 6).map((v, i) => (
        <VideoCard key={v.id} v={v} index={i} />
      ))}
    </div>
  );
}

export function VideoCard({
  v,
  index = 0,
  snippet,
}: {
  v: VideoSummary;
  index?: number;
  snippet?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/videos/${v.id}`} className="block">
        <Card className="group relative overflow-hidden border-white/[0.06] transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-2xl hover:shadow-violet-950/40">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            {v.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.thumbnail}
                alt={v.title ? `Thumbnail for ${v.title}` : "Video thumbnail"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground/30">
                <VideoIcon className="h-12 w-12" />
              </div>
            )}

            {/* Gradient veil */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            {/* Status pill */}
            <div className="absolute left-3 top-3">
              <StatusBadge v={v} />
            </div>

            {/* Duration */}
            {v.duration_sec ? (
              <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-sm">
                {formatTimestamp(v.duration_sec)}
              </div>
            ) : null}

            {/* Hover play */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-2xl ring-4 ring-white/20 backdrop-blur">
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug">
              {v.title || v.source_url}
            </h3>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="line-clamp-1">{v.channel || "—"}</span>
              <span className="shrink-0">{relativeTime(v.created_at)}</span>
            </div>

            {snippet && (
              <p className="mt-2 line-clamp-2 rounded-md border border-violet-400/20 bg-violet-500/[0.05] p-2 text-[11px] leading-snug text-muted-foreground">
                {snippet}
              </p>
            )}

            {(v.tags?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {v.tags!.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    <TagIcon className="h-2.5 w-2.5" />
                    {t}
                  </span>
                ))}
                {(v.tags?.length ?? 0) > 4 && (
                  <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    +{v.tags!.length - 4}
                  </span>
                )}
              </div>
            )}

            {(v.status === "processing" || v.status === "live") && (
              <div className="mt-3 space-y-1">
                <Progress value={Math.max(2, v.progress * 100)} />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="line-clamp-1">{v.stage || "processing…"}</span>
                  <span className="tabular-nums">{Math.round(v.progress * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function StatusBadge({ v }: { v: VideoSummary }) {
  if (v.status === "live")
    return (
      <Badge variant="live" className="gap-1 bg-red-500/15 text-red-200 ring-1 ring-red-400/30 backdrop-blur">
        <Radio className="h-3 w-3" /> LIVE
      </Badge>
    );
  if (v.status === "completed")
    return (
      <Badge variant="success" className="gap-1 bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30 backdrop-blur">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </Badge>
    );
  if (v.status === "failed")
    return (
      <Badge variant="destructive" className="gap-1 bg-red-500/15 text-red-200 ring-1 ring-red-400/30 backdrop-blur">
        <AlertCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  return (
    <Badge variant="default" className="gap-1 bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30 backdrop-blur">
      <Loader2 className="h-3 w-3 animate-spin" /> Processing
    </Badge>
  );
}
