"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Tag as TagIcon, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, type VideoSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_TAGS = 12;
const MAX_LEN = 32;

export function TagEditor({
  video,
  className,
}: {
  video: Pick<VideoSummary, "id" | "tags">;
  className?: string;
}) {
  const qc = useQueryClient();
  const [tags, setTags] = useState<string[]>(video.tags ?? []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep state in sync if the upstream VideoDetail refreshes (e.g. after WS update)
  useEffect(() => {
    setTags(video.tags ?? []);
  }, [video.tags]);

  useEffect(() => {
    if (adding) requestAnimationFrame(() => inputRef.current?.focus());
  }, [adding]);

  const update = useMutation({
    mutationFn: (next: string[]) => api.updateTags(video.id, next),
    onSuccess: (v) => {
      // Refresh both the list and the detail caches.
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["video", video.id] });
      setTags(v.tags ?? []);
    },
    onError: (e: Error) => toast.error("Couldn't save tags", { description: e.message }),
  });

  const commitDraft = () => {
    const cleaned = draft.trim().toLowerCase().slice(0, MAX_LEN);
    if (!cleaned) {
      setAdding(false);
      setDraft("");
      return;
    }
    if (tags.includes(cleaned)) {
      toast.info(`"${cleaned}" is already on this video`);
      setDraft("");
      setAdding(false);
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast.error(`Up to ${MAX_TAGS} tags per video`);
      return;
    }
    const next = [...tags, cleaned];
    setTags(next);
    update.mutate(next);
    setDraft("");
    setAdding(false);
  };

  const remove = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    update.mutate(next);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <TagIcon className="h-3 w-3 text-muted-foreground" />
      <AnimatePresence initial={false}>
        {tags.map((t) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="group inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 pl-2 pr-1 py-0.5 text-[11px] text-violet-200"
          >
            <span>{t}</span>
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remove tag ${t}`}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-violet-200/60 transition-colors hover:bg-violet-500/20 hover:text-violet-100"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      {adding ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            } else if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          placeholder="add tag…"
          maxLength={MAX_LEN}
          className="h-6 w-28 rounded-full border border-border/60 bg-background/40 px-2.5 text-[11px] outline-none placeholder:text-muted-foreground/60 focus:border-violet-400/40"
        />
      ) : tags.length < MAX_TAGS ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={update.isPending}
          className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-border/60 bg-background/40 px-2 text-[11px] text-muted-foreground transition-colors hover:border-violet-400/30 hover:text-foreground disabled:opacity-40"
        >
          {update.isPending ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <Plus className="h-2.5 w-2.5" />
          )}
          tag
        </button>
      ) : null}
    </div>
  );
}
