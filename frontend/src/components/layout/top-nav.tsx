"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Radio, Library as LibraryIcon, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/fx/logo";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/analyze", label: "Analyse", icon: Sparkles },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/library", label: "Library", icon: LibraryIcon },
];

export function TopNav() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 -z-10 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl" />
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <LogoMark size={36} />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold tracking-tight">
              Vid<span className="text-gradient-static">IQ</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Video Intelligence
            </span>
          </div>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.06] bg-background/60 p-1 backdrop-blur-md md:flex">
          {links.map((l) => {
            const active = l.exact ? path === l.href : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-violet-400/30"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <l.icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="gradient" className="hidden sm:inline-flex">
            <Link href="/analyze">
              <Sparkles className="h-4 w-4" />
              New analysis
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
