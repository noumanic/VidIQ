"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  GitCompare,
  Sparkles,
  Plus,
  X,
  Search,
  Video as VideoIcon,
  Loader2,
} from "lucide-react";
import { api, type VideoDetail, type VideoSummary } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatTimestamp, relativeTime } from "@/lib/utils";
import { CompareGrid } from "@/components/compare/compare-grid";

const MAX_PICKED = 3;

export default function ComparePage() {
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const list = useQuery({
    queryKey: ["videos"],
    queryFn: api.listVideos,
    refetchInterval: 8_000,
  });

  // Lazily fetch full detail for each picked video.
  const details = useQueries({
    queries: picked.map((id) => ({
      queryKey: ["video", id],
      queryFn: () => api.getVideo(id),
      staleTime: 30_000,
    })),
  });

  const ready = details.every((d) => d.data) && picked.length >= 2;
  const loaded: VideoDetail[] = details
    .map((d) => d.data)
    .filter((v): v is VideoDetail => !!v);

  const completedVideos = useMemo(
    () => (list.data ?? []).filter((v) => v.status === "completed"),
    [list.data],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return completedVideos;
    return completedVideos.filter((v) =>
      `${v.title ?? ""} ${v.channel ?? ""} ${v.source_url}`.toLowerCase().includes(t),
    );
  }, [completedVideos, q]);

  const toggle = (id: string) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PICKED) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const reset = () => setPicked([]);

  return (
    <div className="container py-10 md:py-14">
      {/* ─── Header ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/25 to-violet-500/15 ring-1 ring-cyan-400/20">
            <GitCompare className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Compare videos
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pick 2 or 3 analyses · see them side-by-side with charts and topic overlap.
            </p>
          </div>
        </div>
        {picked.length > 0 ? (
          <Button onClick={reset} variant="ghost" size="sm">
            <X className="h-4 w-4" />
            Clear selection
          </Button>
        ) : null}
      </motion.div>

      {/* ─── Selected strip ────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: MAX_PICKED }).map((_, i) => {
          const id = picked[i];
          const v = list.data?.find((x) => x.id === id);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {v ? (
                <SlotFilled video={v} onRemove={() => toggle(v.id)} index={i} />
              ) : (
                <SlotEmpty index={i} active={picked.length === i} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ─── Picker or comparison ──────────────────────────────── */}
      {ready ? (
        <CompareGrid videos={loaded} />
      ) : picked.length >= 2 && details.some((d) => d.isFetching) ? (
        <Card className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading full details for {picked.length} videos…
        </Card>
      ) : (
        <PickerCard
          q={q}
          setQ={setQ}
          videos={filtered}
          isLoading={list.isLoading}
          picked={picked}
          onToggle={toggle}
        />
      )}
    </div>
  );
}

/* ── Slot — placeholder when empty, summary chip when filled ─── */

function SlotEmpty({ index, active }: { index: number; active: boolean }) {
  return (
    <div
      className={cn(
        "flex h-24 items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-xs transition-colors",
        active
          ? "border-violet-400/40 bg-violet-500/[0.04] text-violet-200"
          : "border-white/[0.06] bg-white/[0.02] text-muted-foreground",
      )}
    >
      <Plus className="h-4 w-4" />
      <span>Slot {index + 1} {active ? "— pick a video below" : "(optional)"}</span>
    </div>
  );
}

function SlotFilled({
  video,
  onRemove,
  index,
}: {
  video: VideoSummary;
  onRemove: () => void;
  index: number;
}) {
  const accents = [
    "from-violet-500/20 to-fuchsia-500/15 ring-violet-400/30",
    "from-cyan-500/20 to-sky-500/15 ring-cyan-400/30",
    "from-emerald-500/20 to-teal-500/15 ring-emerald-400/30",
  ];
  return (
    <Card
      className={cn(
        "relative h-24 overflow-hidden bg-gradient-to-br ring-1",
        accents[index % accents.length],
      )}
    >
      <div className="flex h-full items-center gap-3 p-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] font-mono text-xs font-bold">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-semibold">{video.title || video.source_url}</p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {video.channel || video.source_type} ·{" "}
            {video.duration_sec ? formatTimestamp(video.duration_sec) : "—"} ·{" "}
            {relativeTime(video.created_at)}
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove from comparison"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

/* ── Picker card ─────────────────────────────────────────────── */

function PickerCard({
  q,
  setQ,
  videos,
  isLoading,
  picked,
  onToggle,
}: {
  q: string;
  setQ: (v: string) => void;
  videos: VideoSummary[];
  isLoading: boolean;
  picked: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, channel or URL…"
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-violet-400/30 focus:outline-none"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {picked.length}/{MAX_PICKED} selected
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading library…
        </div>
      ) : videos.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollArea className="max-h-[60vh] min-h-[300px]">
          <ul className="divide-y divide-white/[0.04]">
            {videos.map((v, i) => {
              const isPicked = picked.includes(v.id);
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(v.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      isPicked
                        ? "bg-gradient-to-r from-violet-500/10 to-transparent"
                        : "hover:bg-white/[0.03]",
                    )}
                  >
                    {/* Checkbox */}
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                        isPicked
                          ? "border-violet-400/60 bg-violet-500/20"
                          : "border-white/[0.12] bg-white/[0.02]",
                      )}
                    >
                      {isPicked && (
                        <span className="h-2 w-2 rounded-sm bg-violet-300" />
                      )}
                    </span>
                    {/* Thumbnail */}
                    <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {v.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <VideoIcon className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    {/* Meta */}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">
                        {v.title || v.source_url}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {v.channel || v.source_type} ·{" "}
                        {v.duration_sec ? formatTimestamp(v.duration_sec) : "—"} ·{" "}
                        {relativeTime(v.created_at)}
                      </p>
                    </div>
                    {isPicked && (
                      <Badge
                        variant="outline"
                        className="ml-2 border-violet-400/30 bg-violet-500/10 text-violet-200"
                      >
                        #{picked.indexOf(v.id) + 1}
                      </Badge>
                    )}
                    {/* Index hint */}
                    <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                      {i + 1}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="overflow-hidden p-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-cyan-400/20">
        <GitCompare className="h-6 w-6 text-cyan-300" />
      </div>
      <h3 className="font-display text-base font-semibold">No completed analyses</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Compare needs at least two finished videos. Run a couple of analyses first.
      </p>
      <Button asChild variant="gradient" className="mt-5">
        <Link href="/analyze">
          <Sparkles className="h-4 w-4" />
          Analyse a video
        </Link>
      </Button>
    </div>
  );
}
