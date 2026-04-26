"use client";

import { cn } from "@/lib/utils";

/** Animated gradient blobs that float behind the hero. Pure CSS, no JS cost. */
export function AuroraBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      {/* Aurora blobs */}
      <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/30 blur-[120px] animate-aurora" />
      <div
        className="absolute top-20 -right-40 h-[500px] w-[600px] rounded-full bg-fuchsia-600/25 blur-[120px] animate-aurora"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="absolute bottom-0 -left-32 h-[500px] w-[600px] rounded-full bg-cyan-500/15 blur-[120px] animate-aurora"
        style={{ animationDelay: "-8s" }}
      />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.7]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
