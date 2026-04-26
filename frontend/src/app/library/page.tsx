"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Library as LibraryIcon, Sparkles, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "@/components/dashboard/recent-videos";

export default function LibraryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: api.listVideos,
    refetchInterval: 5_000,
  });

  const total = data?.length ?? 0;
  const completed = data?.filter((v) => v.status === "completed").length ?? 0;
  const active = data?.filter((v) => v.status === "processing" || v.status === "live").length ?? 0;

  return (
    <div className="container py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-wrap items-end justify-between gap-4"
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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[16/11] animate-pulse rounded-2xl border border-white/[0.06] bg-card/40"
            />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-card/40 p-16 text-center">
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data ?? []).map((v, i) => (
            <VideoCard key={v.id} v={v} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
