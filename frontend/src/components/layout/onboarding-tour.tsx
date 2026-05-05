"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BarChart3,
  Megaphone,
  Library,
  Keyboard,
  ArrowRight,
  ArrowLeft,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "vidiq-onboarding-v1";

type Step = {
  icon: LucideIcon;
  accent: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    accent: "from-violet-500/30 to-fuchsia-500/20 ring-violet-400/30 text-violet-100",
    title: "Welcome to VidIQ",
    description:
      "Drop a YouTube URL or live stream link and VidIQ produces a transcript, time-stamped summary, key moments, vision-captioned frames and grounded chat — all in seconds.",
    cta: { label: "Try the analyser", href: "/analyze" },
  },
  {
    icon: Library,
    accent: "from-cyan-500/30 to-sky-500/20 ring-cyan-400/30 text-cyan-100",
    title: "Your library, organised",
    description:
      "Every analysis lands in the Library. Open any video to see Summary, Transcript, Frames, Events, Insights and Chat — all linked to the timeline so you can click to jump.",
    cta: { label: "Open library", href: "/library" },
  },
  {
    icon: BarChart3,
    accent: "from-emerald-500/30 to-teal-500/20 ring-emerald-400/30 text-emerald-100",
    title: "Cross-library analytics",
    description:
      "The Analytics page aggregates every video into KPIs and 7 charts — volume trends, source mix, top topics, event categories, sentiment and more. Live-refreshed every 15 s.",
    cta: { label: "See analytics", href: "/analytics" },
  },
  {
    icon: Megaphone,
    accent: "from-fuchsia-500/30 to-amber-500/20 ring-fuchsia-400/30 text-fuchsia-100",
    title: "Marketing dashboard",
    description:
      "The Marketing page reads live from your marketing/*.md files — KPI tracker with progress bars, budget breakdown, competitive matrix, and sortable keyword research.",
    cta: { label: "View marketing", href: "/marketing" },
  },
  {
    icon: Keyboard,
    accent: "from-indigo-500/30 to-violet-500/20 ring-indigo-400/30 text-indigo-100",
    title: "Power-user shortcuts",
    description:
      "Press ⌘K (Ctrl+K on Windows) anywhere to open the command palette. Inside a video, press 1–6 to switch tabs. Use ←/→ to navigate within tabs.",
  },
];

export function OnboardingTour() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Open automatically on first visit, after a short delay so the page paints first.
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Listen for an explicit "open the tour again" event so the help button
  // can trigger it without prop drilling.
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("vidiq:open-tour", handler);
    return () => window.removeEventListener("vidiq:open-tour", handler);
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  if (!mounted) return null;
  const s = STEPS[step];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed left-1/2 top-1/2 z-[71] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2"
                >
                  <Dialog.Title className="sr-only">{s.title}</Dialog.Title>
                  <Dialog.Description className="sr-only">{s.description}</Dialog.Description>
                  <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-card/95 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl">
                    {/* Decorative aurora */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-50"
                      style={{
                        background:
                          "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(270 91% 60% / 0.20), transparent 60%)",
                      }}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-30"
                    />

                    <button
                      onClick={close}
                      aria-label="Close tour"
                      className="absolute right-4 top-4 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {/* Body */}
                    <div className="relative px-7 pb-6 pt-9">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22 }}
                          className="text-center"
                        >
                          <div
                            className={cn(
                              "mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ring-1",
                              s.accent,
                            )}
                          >
                            <s.icon className="h-6 w-6" />
                          </div>
                          <h2 className="font-display text-xl font-bold tracking-tight">
                            {s.title}
                          </h2>
                          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                            {s.description}
                          </p>
                          {s.cta && (
                            <button
                              onClick={() => {
                                close();
                                router.push(s.cta!.href);
                              }}
                              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium transition-all hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-100"
                            >
                              {s.cta.label}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      {/* Step dots */}
                      <div className="mt-6 flex items-center justify-center gap-1.5">
                        {STEPS.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setStep(i)}
                            aria-label={`Go to step ${i + 1}`}
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              i === step
                                ? "w-6 bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                : "w-1.5 bg-white/[0.12] hover:bg-white/[0.2]",
                            )}
                          />
                        ))}
                      </div>

                      {/* Footer nav */}
                      <div className="mt-6 flex items-center justify-between gap-2">
                        <button
                          onClick={close}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Skip tour
                        </button>
                        <div className="flex items-center gap-2">
                          {step > 0 && (
                            <button
                              onClick={back}
                              className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.04]"
                            >
                              <ArrowLeft className="h-3 w-3" />
                              Back
                            </button>
                          )}
                          <button
                            onClick={next}
                            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50"
                          >
                            {step === STEPS.length - 1 ? "Get started" : "Next"}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
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

/** Small button that re-opens the tour. Drop it in TopNav or a footer. */
export function ReopenTourButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("vidiq:open-tour"))}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-violet-400/30 hover:text-foreground",
        className,
      )}
      title="Replay the welcome tour"
    >
      <Sparkles className="h-3 w-3" />
      Tour
    </button>
  );
}
