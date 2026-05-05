"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { VideoDetail } from "@/lib/api";
import { ProgressPanel } from "./progress-panel";
import { VideoPlayer, type VideoPlayerHandle } from "./video-player";
import { VideoHeader } from "./video-header";
import { WorkspaceTabs } from "./workspace-tabs";

export function VideoWorkspace({ video }: { video: VideoDetail }) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [tab, setTab] = useState("summary");

  const seek = (sec: number) => playerRef.current?.seekTo(sec);

  return (
    <div className="container py-6 space-y-6">
      <VideoHeader video={video} />

      {video.status !== "completed" && video.status !== "live" ? (
        <ProgressPanel video={video} />
      ) : null}

      {video.status === "live" ? <ProgressPanel video={video} live /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 space-y-4"
        >
          <VideoPlayer ref={playerRef} video={video} />
        </motion.div>

        <div className="lg:col-span-5">
          <WorkspaceTabs
            video={video}
            tab={tab}
            onTabChange={setTab}
            onSeek={seek}
          />
        </div>
      </div>
    </div>
  );
}
