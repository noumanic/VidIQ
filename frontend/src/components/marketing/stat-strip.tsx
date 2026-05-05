"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Film, Sparkles, Zap, Activity } from "lucide-react";
import { api } from "@/lib/api";

export function StatStrip() {
  const { data } = useQuery({
    queryKey: ["videos"],
    queryFn: api.listVideos,
    refetchInterval: 6000,
  });
  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 30000,
  });

  const total = data?.length ?? 0;
  const completed = data?.filter((v) => v.status === "completed").length ?? 0;
  const liveCount = data?.filter((v) => v.status === "live" || v.status === "processing").length ?? 0;

  const items = [
    { label: "Analyses", value: total.toString(), icon: Film, accent: "text-violet-300" },
    { label: "Completed", value: completed.toString(), icon: Sparkles, accent: "text-emerald-300" },
    { label: "Active", value: liveCount.toString(), icon: Activity, accent: "text-fuchsia-300" },
    { label: "Provider", value: health?.provider ?? "—", icon: Zap, accent: "text-cyan-300" },
  ];

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 rounded-2xl border border-white/[0.06] bg-card/40 p-3 backdrop-blur-md md:grid-cols-4">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="flex items-center gap-3 rounded-xl px-3 py-2"
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ${it.accent}`}>
            <it.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="font-display text-lg font-bold tabular-nums">{it.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {it.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
