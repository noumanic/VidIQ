"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ListChecks, ScanEye, MessageSquareText, AlertTriangle, FileText, Code2 } from "lucide-react";
import type { VideoDetail } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressPanel } from "./progress-panel";
import { VideoPlayer, type VideoPlayerHandle } from "./video-player";
import { SummaryPanel } from "./summary-panel";
import { TranscriptPanel } from "./transcript-panel";
import { KeyframesPanel } from "./keyframes-panel";
import { EventsPanel } from "./events-panel";
import { ChatPanel } from "./chat-panel";
import { VideoHeader } from "./video-header";

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
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="summary"><Sparkles className="h-4 w-4" /> Summary</TabsTrigger>
              <TabsTrigger value="transcript"><FileText className="h-4 w-4" /> Transcript</TabsTrigger>
              <TabsTrigger value="frames"><ScanEye className="h-4 w-4" /> Frames</TabsTrigger>
              <TabsTrigger value="events"><AlertTriangle className="h-4 w-4" /> Events</TabsTrigger>
              <TabsTrigger value="chat"><MessageSquareText className="h-4 w-4" /> Chat</TabsTrigger>
              {video.summary?.pseudocode ? (
                <TabsTrigger value="pseudo"><Code2 className="h-4 w-4" /> Code</TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="summary"><SummaryPanel video={video} onSeek={seek} /></TabsContent>
            <TabsContent value="transcript"><TranscriptPanel video={video} onSeek={seek} /></TabsContent>
            <TabsContent value="frames"><KeyframesPanel video={video} onSeek={seek} /></TabsContent>
            <TabsContent value="events"><EventsPanel video={video} onSeek={seek} /></TabsContent>
            <TabsContent value="chat"><ChatPanel video={video} onSeek={seek} /></TabsContent>
            {video.summary?.pseudocode ? (
              <TabsContent value="pseudo">
                <pre className="rounded-2xl border bg-muted/40 p-4 text-xs overflow-x-auto whitespace-pre-wrap">
                  {video.summary.pseudocode}
                </pre>
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
