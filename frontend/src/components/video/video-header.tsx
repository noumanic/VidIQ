"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Trash2, Radio, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { VideoDetail } from "@/lib/api";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp, relativeTime } from "@/lib/utils";

export function VideoHeader({ video }: { video: VideoDetail }) {
  const qc = useQueryClient();
  const router = useRouter();

  const del = useMutation({
    mutationFn: () => api.deleteVideo(video.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      router.push("/library");
      toast.success("Deleted");
    },
  });

  const stopLive = useMutation({
    mutationFn: () => api.stopLive(video.id),
    onSuccess: () => toast.success("Live session stopped"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap items-start justify-between gap-4"
    >
      <div className="min-w-0 flex-1">
        <Link
          href="/library"
          className="group mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Back to library
        </Link>
        <h1 className="font-display text-2xl font-bold leading-tight tracking-tight md:text-3xl">
          {video.title || "Untitled video"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
          {video.channel ? (
            <span className="font-medium text-foreground/80">{video.channel}</span>
          ) : null}
          {video.duration_sec ? (
            <>
              <span className="opacity-40">·</span>
              <span className="font-mono">{formatTimestamp(video.duration_sec)}</span>
            </>
          ) : null}
          <span className="opacity-40">·</span>
          <span>{relativeTime(video.created_at)}</span>
          {video.status === "live" ? (
            <Badge variant="live" className="ml-1 gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
              </span>
              LIVE
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {video.status === "live" ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => stopLive.mutate()}
            disabled={stopLive.isPending}
          >
            Stop live
          </Button>
        ) : null}
        <Button variant="outline" size="sm" asChild>
          <a href={video.source_url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Source
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm("Delete this analysis?")) del.mutate();
          }}
          disabled={del.isPending}
          title="Delete"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
        </Button>
      </div>
    </motion.div>
  );
}
