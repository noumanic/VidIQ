"use client";

import Link from "next/link";
import {
  Brain,
  Radio,
  MessageSquareText,
  ScanEye,
  Workflow,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalyzeCTA } from "@/components/dashboard/analyze-cta";
import { RecentVideos } from "@/components/dashboard/recent-videos";
import { HealthBadge } from "@/components/dashboard/health-badge";
import { AuroraBg } from "@/components/fx/aurora-bg";
import { LogoSplash } from "@/components/fx/logo";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StatStrip } from "@/components/marketing/stat-strip";

const features = [
  {
    icon: Brain,
    title: "Multimodal summarisation",
    desc: "Combines transcript with visual frames into a faithful overview, key points and chapters.",
    accent: "from-violet-500 via-purple-500 to-fuchsia-500",
  },
  {
    icon: Clock,
    title: "Time-stamped insights",
    desc: "Click any moment to jump to it. Every claim is grounded with the exact timecode.",
    accent: "from-fuchsia-500 via-pink-500 to-rose-500",
  },
  {
    icon: Radio,
    title: "Live stream analysis",
    desc: "Rolling summaries and event detection for YouTube Live, webinars and lectures.",
    accent: "from-rose-500 via-orange-500 to-amber-500",
  },
  {
    icon: ScanEye,
    title: "Vision + event detection",
    desc: "Keyframes captioned by a vision model. Surfaces demos, claims, definitions, examples.",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    icon: MessageSquareText,
    title: "Chat with the video",
    desc: "Ask anything — the answer cites the exact transcript moment it came from.",
    accent: "from-cyan-500 via-sky-500 to-indigo-500",
  },
  {
    icon: Workflow,
    title: "Strategy → pseudocode",
    desc: "For tutorials, extract executable workflows or pseudocode blocks automatically.",
    accent: "from-indigo-500 via-violet-500 to-purple-500",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <AuroraBg />

        <div className="container relative pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="mb-8 animate-fade-up" style={{ animationDelay: "0ms" }}>
              <LogoSplash size={84} />
            </div>

            <div
              className="mb-6 animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-violet-400/30 bg-violet-500/10 px-3 py-1 text-violet-200"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
                </span>
                Multimodal AI · Live + Recorded
              </Badge>
            </div>

            <h1
              className="font-display text-display-xl font-bold tracking-tight animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              Understand{" "}
              <span className="relative inline-block">
                <span className="text-gradient">any video</span>
                <svg
                  aria-hidden
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,5 Q50,0 100,5 T200,5"
                    stroke="url(#g)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.5"
                  />
                  <defs>
                    <linearGradient id="g">
                      <stop offset="0" stopColor="#a855f7" />
                      <stop offset="1" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              ,
              <br className="hidden md:block" />
              in seconds.
            </h1>

            <p
              className="mt-7 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              Drop a YouTube link or live stream. VidIQ transcribes, analyses keyframes and
              produces a timestamped summary, detected events and an interactive Q&A —
              grounded entirely in the source.
            </p>

            <div
              className="mt-10 w-full animate-fade-up"
              style={{ animationDelay: "400ms" }}
            >
              <AnalyzeCTA />
            </div>

            <div
              className="mt-5 flex animate-fade-up items-center gap-3"
              style={{ animationDelay: "500ms" }}
            >
              <HealthBadge />
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div
          className="container relative animate-fade-up"
          style={{ animationDelay: "600ms" }}
        >
          <StatStrip />
        </div>
      </section>

      {/* ─── RECENT ─────────────────────────────────────────── */}
      <section className="relative">
        <div className="container py-16 md:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
                Recent
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                Pick up where you left off
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/library" className="gap-1">
                Open library
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
          <RecentVideos />
        </div>
      </section>

      {/* ─── DEMO VIDEO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 50%, hsl(310 80% 60% / 0.10), transparent 70%)",
          }}
        />
        <div className="container py-16 md:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-fuchsia-400">
              How it works
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Watch VidIQ run end-to-end
            </h2>
            <p className="mt-3 text-muted-foreground">
              Paste a YouTube URL → transcript, keyframes, summary and a grounded chat — all in one pipeline.
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/40 shadow-2xl shadow-violet-500/10 ring-1 ring-violet-500/20 backdrop-blur-sm">
              <video
                className="block w-full"
                controls
                preload="metadata"
                playsInline
                poster="/vidiq_logo_black_bg.png"
              >
                <source src="/introductory-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
                <a href="/introductory-video.mp4" className="text-violet-400 underline">
                  Download the walkthrough
                </a>
              </video>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              ▶  Click anywhere on the player to start the walkthrough · 60 seconds · no audio required.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 20%, hsl(270 91% 60% / 0.12), transparent 60%)",
          }}
        />
        <div className="container py-16 md:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
              Capabilities
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              One pipeline, every kind of video
            </h2>
            <p className="mt-3 text-muted-foreground">
              Education, lectures, trading streams, medical demos, legal sessions — domain-aware
              insights from the same engine.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-violet-600/15 via-purple-700/10 to-fuchsia-600/15 p-10 md:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-40"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl"
            />
            <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <Badge
                  variant="outline"
                  className="mb-4 border-white/10 bg-white/[0.04] text-foreground"
                >
                  <Zap className="mr-1.5 h-3 w-3 text-violet-300" />
                  Ready in seconds
                </Badge>
                <h3 className="font-display text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                  Turn any video into structured intelligence.
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Free Gemini-powered analysis with local Whisper fallback — no paid API needed.
                </p>
              </div>
              <Button asChild variant="gradient" size="xl">
                <Link href="/analyze">
                  <Sparkles className="h-5 w-5" />
                  Start an analysis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
