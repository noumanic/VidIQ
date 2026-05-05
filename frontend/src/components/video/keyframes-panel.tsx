"use client";

import { motion } from "framer-motion";
import type { VideoDetail } from "@/lib/api";
import { mediaUrl } from "@/lib/api";
import { formatTimestamp } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function KeyframesPanel({ video, onSeek }: { video: VideoDetail; onSeek: (s: number) => void }) {
  if (!video.keyframes?.length) {
    return (
      <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
        Keyframes will appear after vision analysis completes.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[640px] pr-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {video.keyframes.map((k, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSeek(k.timestamp)}
            className="group rounded-xl overflow-hidden border bg-card text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="relative aspect-video bg-muted overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(k.image_path)}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-mono text-white">
                {formatTimestamp(k.timestamp)}
              </div>
            </div>
            {k.caption ? (
              <div className="p-3">
                <p className="text-xs leading-relaxed text-foreground/90 line-clamp-3">{k.caption}</p>
                {k.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {k.tags.slice(0, 4).map((t) => (
                      <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">{t}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </motion.button>
        ))}
      </div>
    </ScrollArea>
  );
}
