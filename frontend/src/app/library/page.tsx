"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Library as LibraryIcon,
  Sparkles,
  Plus,
  Search,
  Filter,
  X,
  Tag as TagIcon,
} from "lucide-react";
import { api, type VideoSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "@/components/dashboard/recent-videos";
import { cn } from "@/lib/utils";

export default function LibraryPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Debounce the search query so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 220);
    return () => clearTimeout(t);
  }, [q]);

  const list = useQuery({
    queryKey: ["videos"],
    queryFn: api.listVideos,
    refetchInterval: 5_000,
  });

  // Server-side search. When q is empty, fall back to listVideos.
  const search = useQuery({
    queryKey: ["search", debouncedQ],
    queryFn: () => api.search(debouncedQ, 50),
    enabled: debouncedQ.length > 0,
    staleTime: 5_000,
  });

  const baseList = debouncedQ ? (search.data?.results ?? []) : (list.data ?? []);

  // Tag-filter on top of the current list (client-side — fast)
  const visible = useMemo(() => {
    if (activeTags.length === 0) return baseList;
    const wanted = new Set(activeTags.map((t) => t.toLowerCase()));
    return baseList.filter((v) =>
      (v.tags ?? []).some((t) => wanted.has(t.toLowerCase())),
    );
  }, [baseList, activeTags]);

  // All tags currently in the library, with counts
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of list.data ?? []) {
      for (const t of v.tags ?? []) {
        const k = t.toLowerCase();
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [list.data]);

  const total = list.data?.length ?? 0;
  const completed = list.data?.filter((v) => v.status === "completed").length ?? 0;
  const active = list.data?.filter((v) => v.status === "processing" || v.status === "live").length ?? 0;

  const isLoading = debouncedQ ? search.isLoading : list.isLoading;
  const isSearching = !!debouncedQ;

  return (
    <div className="container py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-end justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-violet-400/20">
            <LibraryIcon className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Library</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total} {total === 1 ? "analysis" : "analyses"} · {completed} ready · {active} active
            </p>
          </div>
        </div>
        <Button asChild variant="gradient">
          <Link href="/analyze">
            <Plus className="h-4 w-4" />
            New analysis
          </Link>
        </Button>
      </motion.div>

      {/* ─── Search + tag filter row ──────────────────────────── */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, channel, transcript text or topics…"
            className="h-11 w-full rounded-xl border border-border/60 bg-background/60 pl-10 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/15"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="flex flex-wrap items-center gap-1.5">
              {allTags.map(([tag, count]) => {
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() =>
                      setActiveTags((prev) =>
                        active ? prev.filter((t) => t !== tag) : [...prev, tag],
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      active
                        ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-violet-400/30 hover:text-foreground",
                    )}
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <span className="font-mono opacity-60">{count}</span>
                  </button>
                );
              })}
              {activeTags.length > 0 && (
                <button
                  onClick={() => setActiveTags([])}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result summary */}
        {isSearching && !search.isLoading && (
          <p className="text-xs text-muted-foreground">
            {search.data?.total ?? 0}{" "}
            {(search.data?.total ?? 0) === 1 ? "match" : "matches"} for{" "}
            <span className="text-foreground">&ldquo;{debouncedQ}&rdquo;</span>
          </p>
        )}
      </div>

      {/* ─── Grid / states ────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[16/11] animate-pulse rounded-2xl border border-white/[0.06] bg-card/40"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        isSearching ? (
          <EmptyResults query={debouncedQ} onClear={() => setQ("")} />
        ) : (
          <EmptyLibrary />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((v, i) => (
            <VideoCard key={v.id} v={v} index={i} snippet={getSnippet(v)} />
          ))}
        </div>
      )}
    </div>
  );
}

function getSnippet(v: VideoSummary): string | undefined {
  // SearchHit extends VideoSummary with optional snippet.
  return (v as VideoSummary & { snippet?: string | null }).snippet ?? undefined;
}

function EmptyLibrary() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-40"
      />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-400/20">
          <Sparkles className="h-7 w-7 text-violet-300" />
        </div>
        <h3 className="font-display text-lg font-semibold">Nothing here yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your first analysis to see it appear here.
        </p>
        <Button asChild variant="gradient" className="mt-5">
          <Link href="/analyze">
            <Sparkles className="h-4 w-4" />
            Analyse a video
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/40 p-12 text-center">
      <Search className="mx-auto mb-3 h-6 w-6 text-muted-foreground/60" />
      <h3 className="font-display text-base font-semibold">No matches</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Nothing matched <Badge variant="outline">{query}</Badge>
      </p>
      <Button onClick={onClear} variant="ghost" size="sm" className="mt-4">
        Clear search
      </Button>
    </div>
  );
}
