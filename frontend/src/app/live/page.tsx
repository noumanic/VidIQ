"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Radio, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { AuroraBg } from "@/components/fx/aurora-bg";

export default function LivePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [chunk, setChunk] = useState(30);

  const m = useMutation({
    mutationFn: () => api.startLive(url.trim(), chunk),
    onSuccess: (v) => {
      toast.success("Live session started");
      router.push(`/videos/${v.id}`);
    },
    onError: (e: Error) => toast.error("Could not start", { description: e.message }),
  });

  return (
    <div className="relative">
      <AuroraBg className="opacity-60" />
      <div className="container max-w-3xl py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <Badge
              variant="live"
              className="mb-3 gap-1.5 border-red-400/30 bg-red-500/10 text-red-200"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
              </span>
              LIVE
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Live stream <span className="text-gradient-static">analysis</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Rolling summaries, real-time transcription and event detection on any live stream.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card glass>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!url.trim()) return;
                m.mutate();
              }}
            >
              <CardHeader>
                <CardTitle>Connect a stream</CardTitle>
                <CardDescription>
                  YouTube Live, webinar HLS, lecture broadcast — anything yt-dlp supports.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-7">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Stream URL
                  </label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…  (live)"
                    disabled={m.isPending}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 text-violet-300" />
                      Chunk length
                    </label>
                    <span className="font-mono text-sm font-semibold text-violet-300">{chunk}s</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={120}
                    step={5}
                    value={chunk}
                    onChange={(e) => setChunk(parseInt(e.target.value, 10))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>15s · faster updates</span>
                    <span>120s · lower cost</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="xl"
                  variant="gradient"
                  className="w-full"
                  disabled={m.isPending || !url.trim()}
                >
                  {m.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Radio className="h-4 w-4" />
                  )}
                  {m.isPending ? "Connecting…" : "Start live analysis"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
