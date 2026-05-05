"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.22, delay: delay / 2500, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/40 p-6 backdrop-blur-sm transition-colors hover:border-white/[0.12]"
    >
      {/* Hover gradient sheen */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${accent} opacity-[0.08] blur-2xl transition-opacity duration-500 group-hover:opacity-25`}
      />
      {/* Icon */}
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg shadow-black/20 ring-1 ring-white/10`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>

      {/* Bottom border glow on hover */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />
    </motion.div>
  );
}
