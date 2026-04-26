"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Sparkles, Youtube, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const SAMPLES = [
  ["TED talk", "https://www.youtube.com/watch?v=8jPQjjsBbIc"],
  ["Karpathy · LLMs", "https://www.youtube.com/watch?v=zjkBMFhNj_g"],
  ["3Blue1Brown · NN", "https://www.youtube.com/watch?v=aircAruvnKk"],
];

export function AnalyzeCTA({ className }: { className?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);

  const m = useMutation({
    mutationFn: (u: string) => api.analyze(u),
    onSuccess: (v) => {
      toast.success("Analysis started", { description: "Streaming progress live." });
      router.push(`/videos/${v.id}`);
    },
    onError: (e: Error) =>
      toast.error("Could not start analysis", { description: e.message }),
  });

  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>
      <motion.form
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          m.mutate(url.trim());
        }}
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="group relative"
      >
        {/* Animated halo */}
        <div
          aria-hidden
          className={cn(
            "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 opacity-0 blur-xl transition-opacity duration-500",
            focused && "opacity-30"
          )}
        />

        <div className="relative flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-card/80 p-2 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300 ring-1 ring-violet-400/20">
            <Youtube className="h-5 w-5" />
          </div>

          <Input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Paste a YouTube URL or live stream link…"
            className="border-0 bg-transparent px-1 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:bg-transparent hover:bg-transparent"
            disabled={m.isPending}
          />

          <Button
            type="submit"
            size="lg"
            variant="gradient"
            disabled={m.isPending || !url.trim()}
            className="px-6"
          >
            {m.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {m.isPending ? "Starting…" : "Analyse"}
          </Button>
        </div>
      </motion.form>

      {/* Sample chips */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-muted-foreground/70">Try:</span>
        {SAMPLES.map(([label, link]) => (
          <button
            key={link}
            onClick={() => setUrl(link)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-muted-foreground transition-all hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-violet-200"
          >
            <Link2 className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
