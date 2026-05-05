"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Code2,
  GraduationCap,
  TrendingUp,
  HeartPulse,
  Scale,
  BookOpen,
  Shapes,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { AuroraBg } from "@/components/fx/aurora-bg";
import { cn } from "@/lib/utils";

const DOMAINS = [
  { value: "general", label: "General", icon: Shapes },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "trading", label: "Trading", icon: TrendingUp },
  { value: "medical", label: "Medical", icon: HeartPulse },
  { value: "law", label: "Legal", icon: Scale },
  { value: "tutorial", label: "Tutorial", icon: BookOpen },
];

export default function AnalyzePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [domain, setDomain] = useState("general");
  const [pseudo, setPseudo] = useState(false);

  const m = useMutation({
    mutationFn: () =>
      api.analyze(url.trim(), {
        domain: domain === "general" ? undefined : domain,
        extract_pseudocode: pseudo,
      }),
    onSuccess: (v) => {
      toast.success("Analysis started");
      router.push(`/videos/${v.id}`);
    },
    onError: (e: Error) => toast.error("Failed to start", { description: e.message }),
  });

  return (
    <div className="relative">
      <AuroraBg className="opacity-60" />
      <div className="container max-w-3xl py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <Badge
            variant="outline"
            className="mb-4 border-violet-400/30 bg-violet-500/10 text-violet-200"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            Recorded video
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Analyse a <span className="text-gradient-static">video</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            We&apos;ll fetch the video, transcribe speech, analyse keyframes and produce a
            full report — usually in under a minute.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card glass className="overflow-hidden">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!url.trim()) return;
                m.mutate();
              }}
            >
              <CardHeader>
                <CardTitle>Video source</CardTitle>
                <CardDescription>YouTube, Shorts, or any URL yt-dlp can resolve.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-7">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Video URL
                  </label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    disabled={m.isPending}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Domain focus
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DOMAINS.map((d) => {
                      const active = domain === d.value;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setDomain(d.value)}
                          className={cn(
                            "group relative flex items-center gap-2.5 overflow-hidden rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all",
                            active
                              ? "border-violet-400/50 bg-violet-500/10 text-foreground shadow-lg shadow-violet-500/10"
                              : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-foreground"
                          )}
                        >
                          <d.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              active ? "text-violet-300" : "text-muted-foreground/60"
                            )}
                          />
                          <span className="font-medium">{d.label}</span>
                          {active && (
                            <motion.span
                              layoutId="domain-glow"
                              className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPseudo(!pseudo)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    pseudo
                      ? "border-violet-400/50 bg-violet-500/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      pseudo ? "border-violet-400 bg-violet-500" : "border-white/20"
                    )}
                  >
                    {pseudo && <span className="h-2 w-2 rounded-sm bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-violet-300" />
                      <span className="font-medium">Extract strategy → pseudocode</span>
                      <Badge
                        variant="outline"
                        className="border-violet-400/30 bg-violet-500/10 text-violet-200"
                      >
                        tutorials
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Convert any taught process into a step-by-step pseudocode block you can lift into code.
                    </p>
                  </div>
                </button>

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
                    <Sparkles className="h-4 w-4" />
                  )}
                  {m.isPending ? "Starting analysis…" : "Start analysis"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
