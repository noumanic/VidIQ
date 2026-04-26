"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, Cpu, Clock } from "lucide-react";
import { api } from "@/lib/api";

export function HealthBadge() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 30_000,
  });

  if (isError) {
    return (
      <Pill tone="red">
        <AlertTriangle className="h-3 w-3" />
        Backend offline · start FastAPI on :8000
      </Pill>
    );
  }
  if (!data) return null;
  if (!data.llm_configured) {
    return (
      <Pill tone="amber">
        <AlertTriangle className="h-3 w-3" />
        Demo mode · add a free GEMINI_API_KEY
      </Pill>
    );
  }

  // Gemini quota state
  const g = data.gemini;
  if (g && g.configured && g.models_available_now === 0 && g.models_total > 0) {
    const next = [...g.models].sort((a, b) => a.cooldown_seconds - b.cooldown_seconds)[0];
    const hours = Math.ceil((next?.cooldown_seconds ?? 0) / 3600);
    return (
      <Pill tone="amber">
        <Clock className="h-3 w-3" />
        Free-tier quota exhausted · resets in ~{hours}h
      </Pill>
    );
  }

  return (
    <Pill tone="emerald">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <Cpu className="h-3 w-3" />
      Live · <span className="font-mono">{data.provider}</span>
      {g && (
        <span className="opacity-70">
          · {g.models_available_now}/{g.models_total} models ready
        </span>
      )}
    </Pill>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "emerald" | "amber" | "red";
  children: React.ReactNode;
}) {
  const styles = {
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    red: "border-red-400/30 bg-red-500/10 text-red-200",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md ${styles}`}
    >
      {children}
    </span>
  );
}
