"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/fx/logo";

const STORAGE_KEY = "vidiq-landing-v2";
const SPLASH_DURATION_MS = 2400;

/** First-impression intro animation.
 *
 *  Plays once per browser session on the home route. Designed to feel
 *  "premium AI product" — orbital rings, gradient sweep, kinetic
 *  wordmark — without delaying anything past ~2.4 s.
 *
 *  Skipped automatically when:
 *    – the user has `prefers-reduced-motion: reduce` set
 *    – they've already seen it this session (sessionStorage flag)
 *    – we're not on `/` (deep links shouldn't be blocked)
 *    – the URL has `?nosplash=1` (handy for demos / development)
 */
export function LandingSplash() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname !== "/") return;

    // Honour reduced-motion users
    const mq = window.matchMedia("(prefers-color-scheme: reduce)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    void mq;

    // Demo / dev override
    if (new URLSearchParams(window.location.search).has("nosplash")) return;

    // Session-storage gate
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;

    setShow(true);
    const t = window.setTimeout(() => {
      setShow(false);
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    }, SPLASH_DURATION_MS);

    // Allow user to dismiss with any keypress / click
    const dismiss = () => {
      window.clearTimeout(t);
      setShow(false);
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    };
    window.addEventListener("keydown", dismiss, { once: true });
    window.addEventListener("click", dismiss, { once: true });

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("click", dismiss);
    };
  }, [mounted, pathname]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          role="status"
          aria-live="polite"
          aria-label="Loading VidIQ"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[hsl(265_35%_5%)]"
        >
          {/* ── Backdrop layers ─────────────────────────────────────── */}
          {/* Aurora */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hero-gradient opacity-90"
          />
          {/* Grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-40"
          />
          {/* Sweeping radial glow */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute -inset-40 rounded-full bg-gradient-radial blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, hsl(270 91% 60% / 0.35) 0%, hsl(310 80% 60% / 0.18) 35%, transparent 70%)",
            }}
          />

          {/* ── Centerpiece ─────────────────────────────────────────── */}
          <div className="relative flex flex-col items-center gap-7 px-6 text-center">
            {/* Logo with pulsing rings */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <LogoMark size={120} glow />

              {/* Three concentric rings ripple outward */}
              {[0, 0.4, 0.8].map((delay) => (
                <motion.span
                  key={delay}
                  aria-hidden
                  initial={{ scale: 0.85, opacity: 0.7 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{
                    duration: 1.6,
                    delay: 0.3 + delay,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 rounded-3xl ring-2 ring-violet-400/40"
                />
              ))}

              {/* Orbital dot */}
              <motion.span
                aria-hidden
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                className="pointer-events-none absolute inset-[-22px]"
              >
                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-300 shadow-[0_0_12px_rgba(168,85,247,0.9)]" />
              </motion.span>
            </motion.div>

            {/* Wordmark */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.h1
                initial={{ opacity: 0, y: 14, letterSpacing: "0.4em" }}
                animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-4xl font-bold tracking-tight md:text-5xl"
              >
                Vid<span className="text-gradient-static">IQ</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ duration: 0.6, delay: 0.95 }}
                className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground"
              >
                AI Video Intelligence
              </motion.p>
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ duration: 0.6, delay: 1.15 }}
              className="max-w-sm text-sm text-foreground/80"
            >
              Watch less. <span className="text-gradient-static font-semibold">Learn more.</span>
            </motion.p>

            {/* Progress shimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.0 }}
              className="relative mt-2 h-0.5 w-56 overflow-hidden rounded-full bg-white/[0.06]"
            >
              <motion.div
                initial={{ width: "0%", x: "-100%" }}
                animate={{ width: "100%", x: "0%" }}
                transition={{ duration: 1.2, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_14px_rgba(168,85,247,0.6)]"
              />
              {/* Travelling glint */}
              <motion.div
                aria-hidden
                initial={{ x: "-30%" }}
                animate={{ x: "130%" }}
                transition={{ duration: 1.4, delay: 1.0, ease: "easeOut" }}
                className="absolute inset-y-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent blur-sm"
              />
            </motion.div>

            {/* Subtle hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="absolute -bottom-12 text-[10px] uppercase tracking-[0.24em] text-muted-foreground"
            >
              press any key to skip
            </motion.p>
          </div>

          {/* Corner brand mark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="absolute bottom-6 right-6 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
            </span>
            booting · multimodal pipeline
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
