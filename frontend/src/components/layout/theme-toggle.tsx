"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolved, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render a placeholder until client-side mount.
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn(
          "h-8 w-[88px] rounded-full border border-white/[0.06] bg-white/[0.02]",
          className,
        )}
      />
    );
  }

  const items: { id: Theme; icon: typeof Sun; label: string }[] = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "system", icon: Monitor, label: "System" },
    { id: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5",
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      {items.map((it) => {
        const active = theme === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => setTheme(it.id)}
            title={`${it.label} theme`}
            aria-pressed={active}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full transition-all",
              active
                ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            <it.icon className="h-3.5 w-3.5" />
            <span className="sr-only">{it.label}</span>
          </button>
        );
      })}
      <span className="sr-only" aria-live="polite">
        Active theme: {resolved}
      </span>
    </div>
  );
}
