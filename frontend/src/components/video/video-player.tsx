"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { youtubeId } from "@/lib/utils";
import type { VideoDetail } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Video as VideoIcon } from "lucide-react";

export type VideoPlayerHandle = {
  seekTo: (sec: number) => void;
};

export const VideoPlayer = forwardRef<VideoPlayerHandle, { video: VideoDetail }>(function VideoPlayer(
  { video },
  ref
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytId = youtubeId(video.source_url);

  useImperativeHandle(ref, () => ({
    seekTo(sec: number) {
      if (!iframeRef.current || !ytId) return;
      // YouTube iframe API postMessage seek
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "seekTo", args: [Math.max(0, sec), true] }),
        "*"
      );
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      );
    },
  }));

  if (!ytId) {
    return (
      <Card className="aspect-video flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <VideoIcon className="mx-auto h-10 w-10 opacity-30" />
          <p className="mt-2 text-sm">Player not available for this source</p>
          <a href={video.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1">
            Open original
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-black">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1`}
          title={video.title || "video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    </Card>
  );
});
