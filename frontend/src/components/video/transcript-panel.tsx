"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { VideoDetail } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimestamp } from "@/lib/utils";

export function TranscriptPanel({ video, onSeek }: { video: VideoDetail; onSeek: (s: number) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return video.transcript;
    const term = q.toLowerCase();
    return video.transcript.filter((s) => s.text.toLowerCase().includes(term));
  }, [q, video.transcript]);

  if (!video.transcript?.length) {
    return <div className="rounded-2xl border p-6 text-sm text-muted-foreground">Transcript not yet available.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transcript…" className="pl-9" />
      </div>
      <ScrollArea className="h-[580px] rounded-xl border bg-card">
        <div className="divide-y">
          {filtered.map((s, i) => (
            <button
              key={i}
              onClick={() => onSeek(s.start)}
              className="group flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono tabular-nums text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {formatTimestamp(s.start)}
              </span>
              <span className="text-sm leading-relaxed text-foreground/90">{highlight(s.text, q)}</span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No matches.</div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const re = new RegExp(`(${escapeRe(q)})`, "ig");
  return text.split(re).map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="rounded bg-primary/20 text-foreground px-0.5">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
