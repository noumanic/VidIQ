"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { api, wsUrl } from "@/lib/api";
import { VideoWorkspace } from "@/components/video/video-workspace";

export default function VideoPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const qc = useQueryClient();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["video", id],
    queryFn: () => api.getVideo(id),
    // Keep the previous data visible while a refetch is in-flight so the UI
    // never unmounts/flickers between updates.
    placeholderData: keepPreviousData,
    refetchInterval: (q) => {
      const v = q.state.data;
      if (!v) return 2000;
      if (v.status === "processing" || v.status === "live") return 2000;
      return false;
    },
  });

  // WebSocket: invalidate the query on every server event so React Query
  // refetches in the background — no key change, no unmount, no flicker.
  useEffect(() => {
    const url = wsUrl(id);
    if (!url) return;
    let alive = true;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(url);
      ws.onmessage = () => {
        if (alive) qc.invalidateQueries({ queryKey: ["video", id] });
      };
      ws.onerror = () => {};
    } catch {}
    return () => {
      alive = false;
      ws?.close();
    };
  }, [id, qc]);

  // Only show the loader on the very first load (no cached data yet).
  if (isPending && !data) {
    return (
      <div className="container py-24 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="container py-24">
        <div className="mx-auto max-w-md rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h2 className="font-semibold">Could not load video</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as Error)?.message || "Not found"}
          </p>
        </div>
      </div>
    );
  }

  return <VideoWorkspace video={data} />;
}
