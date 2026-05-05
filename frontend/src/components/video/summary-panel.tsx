"use client";

import { motion } from "framer-motion";
import { Sparkles, ListChecks, Tag, BookOpen, SmilePlus, CheckSquare, HelpCircle } from "lucide-react";
import type { VideoDetail } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SummaryPanel({ video, onSeek }: { video: VideoDetail; onSeek: (s: number) => void }) {
  const s = video.summary;
  if (!s) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Summary will appear here once analysis completes.
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-360px)] min-h-[440px] max-h-[760px] pr-2">
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-fuchsia-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-semibold">Overview</span>
                {s.sentiment ? (
                  <Badge variant="secondary" className="ml-auto gap-1">
                    <SmilePlus className="h-3 w-3" /> {s.sentiment}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{s.overview}</p>
              {s.topics?.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.topics.map((t) => (
                    <Badge key={t} variant="outline" className="gap-1">
                      <Tag className="h-3 w-3" /> {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </motion.div>

        {s.key_points?.length ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-primary" /> Key takeaways
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {s.key_points.map((kp, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{kp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {s.action_items?.length ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckSquare className="h-4 w-4 text-emerald-300" /> Action items
                <Badge variant="outline" className="ml-auto border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
                  {s.action_items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {s.action_items.map((it, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-500/10">
                      <CheckSquare className="h-3 w-3 text-emerald-300" />
                    </span>
                    <span className="leading-relaxed">{it}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {s.questions?.length ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <HelpCircle className="h-4 w-4 text-amber-300" /> Open questions
                <Badge variant="outline" className="ml-auto border-amber-400/30 bg-amber-500/10 text-amber-200">
                  {s.questions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {s.questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-amber-400/30 bg-amber-500/10 text-[10px] font-semibold text-amber-200">
                      ?
                    </span>
                    <span className="leading-relaxed text-foreground/90">{q}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {s.chapters?.length ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" /> Chapters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-3">
              {s.chapters.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onSeek(c.start)}
                  className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-accent transition-colors"
                >
                  <span className="mt-0.5 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono tabular-nums text-primary">
                    {formatTimestamp(c.start)}
                  </span>
                  <span className="text-sm font-medium leading-snug">{c.title}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </ScrollArea>
  );
}
