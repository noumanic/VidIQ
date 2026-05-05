"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Radio,
  Library as LibraryIcon,
  LayoutDashboard,
  BarChart3,
  Megaphone,
  GitCompare,
  Sun,
  Moon,
  Monitor,
  ArrowRight,
  Video as VideoIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";

type CmdAction = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
  keywords?: string;
  onSelect: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const { setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: videos } = useQuery({
    queryKey: ["videos"],
    queryFn: api.listVideos,
    enabled: open, // only fetch when palette opens
    staleTime: 10_000,
  });

  // ── Global ⌘K / Ctrl+K hotkey ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // Press "/" to open when not typing in an input
      if (e.key === "/" && !open) {
        const t = e.target as HTMLElement | null;
        if (
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable)
        )
          return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus the input when the dialog opens & reset state
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const close = () => setOpen(false);
  const go = (path: string) => {
    close();
    router.push(path);
  };

  // ── Build the action list ─────────────────────────────────────
  const actions = useMemo<CmdAction[]>(() => {
    const navItems: CmdAction[] = [
      {
        id: "nav-dashboard",
        label: "Dashboard",
        hint: "Home",
        icon: LayoutDashboard,
        group: "Navigate",
        keywords: "home start",
        onSelect: () => go("/"),
      },
      {
        id: "nav-analyze",
        label: "Analyse a video",
        hint: "Start a new analysis",
        icon: Sparkles,
        group: "Navigate",
        keywords: "new analyse analyze youtube",
        onSelect: () => go("/analyze"),
      },
      {
        id: "nav-live",
        label: "Live stream",
        icon: Radio,
        group: "Navigate",
        keywords: "stream broadcast",
        onSelect: () => go("/live"),
      },
      {
        id: "nav-library",
        label: "Library",
        hint: "Past analyses",
        icon: LibraryIcon,
        group: "Navigate",
        keywords: "videos history",
        onSelect: () => go("/library"),
      },
      {
        id: "nav-compare",
        label: "Compare videos",
        hint: "Side-by-side analysis",
        icon: GitCompare,
        group: "Navigate",
        keywords: "compare diff side-by-side",
        onSelect: () => go("/compare"),
      },
      {
        id: "nav-analytics",
        label: "Analytics",
        hint: "Cross-library charts",
        icon: BarChart3,
        group: "Navigate",
        keywords: "stats data charts",
        onSelect: () => go("/analytics"),
      },
      {
        id: "nav-marketing",
        label: "Marketing",
        hint: "Campaign dashboard",
        icon: Megaphone,
        group: "Navigate",
        keywords: "kpi budget seo",
        onSelect: () => go("/marketing"),
      },
    ];

    const themeItems: CmdAction[] = [
      {
        id: "theme-light",
        label: "Light theme",
        icon: Sun,
        group: "Theme",
        onSelect: () => {
          setTheme("light");
          close();
        },
      },
      {
        id: "theme-dark",
        label: "Dark theme",
        icon: Moon,
        group: "Theme",
        onSelect: () => {
          setTheme("dark");
          close();
        },
      },
      {
        id: "theme-system",
        label: "System theme",
        icon: Monitor,
        group: "Theme",
        onSelect: () => {
          setTheme("system");
          close();
        },
      },
    ];

    const recent: CmdAction[] = (videos ?? []).slice(0, 8).map((v) => ({
      id: `vid-${v.id}`,
      label: v.title || v.source_url,
      hint: v.channel || v.source_type,
      icon: VideoIcon,
      group: "Recent videos",
      keywords: `${v.title ?? ""} ${v.channel ?? ""} ${v.source_url}`,
      onSelect: () => go(`/videos/${v.id}`),
    }));

    return [...navItems, ...themeItems, ...recent];
  }, [videos, router, setTheme]);

  // ── Filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return actions;
    return actions.filter((a) => {
      const hay = `${a.label} ${a.hint ?? ""} ${a.keywords ?? ""} ${a.group}`.toLowerCase();
      return hay.includes(t);
    });
  }, [q, actions]);

  // Reset active when filter shrinks
  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered, active]);

  // ── Group for display ─────────────────────────────────────────
  const groups = useMemo(() => {
    const map = new Map<string, CmdAction[]>();
    filtered.forEach((a) => {
      if (!map.has(a.group)) map.set(a.group, []);
      map.get(a.group)!.push(a);
    });
    return [...map.entries()];
  }, [filtered]);

  // Flat ordered list (for keyboard navigation indices)
  const flat = useMemo(() => groups.flatMap(([, items]) => items), [groups]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[active]?.onSelect();
    } else if (e.key === "Home") {
      setActive(0);
    } else if (e.key === "End") {
      setActive(flat.length - 1);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content
                asChild
                forceMount
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed left-1/2 top-[20%] z-[61] w-[92vw] max-w-xl -translate-x-1/2"
                >
                  <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Search and run commands. Use arrow keys to navigate, Enter to select, Escape to close.
                  </Dialog.Description>
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-card/95 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl">
                    {/* Input */}
                    <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <input
                        ref={inputRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search pages, videos, actions…"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      />
                      <kbd className="hidden rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                        esc
                      </kbd>
                    </div>

                    {/* Results */}
                    <div
                      role="listbox"
                      aria-label="Commands"
                      className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin"
                    >
                      {flat.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No matches for{" "}
                          <span className="text-foreground">&ldquo;{q}&rdquo;</span>
                        </div>
                      ) : (
                        groups.map(([group, items]) => (
                          <div key={group} className="mb-1 last:mb-0">
                            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {group}
                            </div>
                            {items.map((it) => {
                              const flatIdx = flat.indexOf(it);
                              const isActive = flatIdx === active;
                              return (
                                <button
                                  key={it.id}
                                  type="button"
                                  role="option"
                                  aria-selected={isActive}
                                  onMouseEnter={() => setActive(flatIdx)}
                                  onClick={() => it.onSelect()}
                                  className={cn(
                                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                                    isActive
                                      ? "bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-foreground ring-1 ring-violet-400/20"
                                      : "text-foreground/90 hover:bg-white/[0.03]",
                                  )}
                                >
                                  <it.icon
                                    className={cn(
                                      "h-4 w-4 shrink-0",
                                      isActive
                                        ? "text-violet-300"
                                        : "text-muted-foreground",
                                    )}
                                  />
                                  <span className="flex-1 truncate">{it.label}</span>
                                  {it.hint && (
                                    <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                                      {it.hint}
                                    </span>
                                  )}
                                  <ArrowRight
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0 transition-opacity",
                                      isActive ? "opacity-80" : "opacity-0",
                                    )}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-background/40 px-4 py-2 text-[10px] text-muted-foreground">
                      <span>VidIQ command palette</span>
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[9px]">
                            ↑
                          </kbd>
                          <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[9px]">
                            ↓
                          </kbd>
                          navigate
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[9px]">
                            ↵
                          </kbd>
                          select
                        </span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
