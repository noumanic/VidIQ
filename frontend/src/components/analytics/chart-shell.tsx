"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ChartShell({
  title,
  description,
  icon: Icon,
  accent = "text-violet-300",
  delay = 0,
  className,
  children,
  empty,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  accent?: string;
  delay?: number;
  className?: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn("h-full", className)}
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
              <Icon className={cn("h-4 w-4", accent)} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {empty ? (
            <div className="flex h-full min-h-[180px] items-center justify-center text-center text-xs text-muted-foreground">
              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1">
                No data yet — analyse a few videos to populate this chart
              </span>
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Minimal recharts tooltip styled to match the app theme. Loose types
 *  because recharts ships generic ValueType | NameType signatures. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChartTooltip(props: any) {
  const { active, payload, label, formatter } = props as {
    active?: boolean;
    payload?: Array<{
      name?: string | number;
      value?: string | number;
      color?: string;
      payload?: unknown;
    }>;
    label?: string | number;
    formatter?: (value: number, name?: string) => string;
  };
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-2xl backdrop-blur">
      {label !== undefined && (
        <p className="mb-1 font-medium text-muted-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => {
          const num = typeof p.value === "number" ? p.value : Number(p.value);
          const name = p.name === undefined ? undefined : String(p.name);
          return (
            <div key={i} className="flex items-center gap-2">
              {p.color && (
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: p.color }}
                />
              )}
              {name && <span className="capitalize text-muted-foreground">{name}</span>}
              <span className="ml-auto font-mono font-semibold tabular-nums text-foreground">
                {formatter && Number.isFinite(num) ? formatter(num, name) : String(p.value ?? "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CHART_PALETTE = [
  "#a855f7", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#6366f1", // indigo
  "#f43f5e", // rose
  "#8b5cf6", // purple
  "#14b8a6", // teal
  "#eab308", // yellow
];

export const CHART_GRID = "hsl(var(--border))";
export const CHART_AXIS = "hsl(var(--muted-foreground))";
