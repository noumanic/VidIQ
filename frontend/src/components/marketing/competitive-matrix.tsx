"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Facebook,
  Instagram,
  Globe2,
  Sparkles,
  Shield,
  AlertTriangle,
  Lightbulb,
  Target,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CompetitiveData, CompetitorRow, SwotEntry } from "@/lib/marketing/types";

const GROUP_META = [
  { id: "Company", label: "Company", icon: Building2, accent: "text-violet-300" },
  { id: "Facebook", label: "Facebook", icon: Facebook, accent: "text-blue-300" },
  { id: "Instagram", label: "Instagram", icon: Instagram, accent: "text-fuchsia-300" },
  { id: "Other", label: "Other channels", icon: Globe2, accent: "text-cyan-300" },
  { id: "Website", label: "Website / SEO", icon: Globe2, accent: "text-emerald-300" },
] as const;

const ENTITY_ACCENT: Record<SwotEntry["entity"], string> = {
  VidIQ: "from-violet-500/15 to-fuchsia-500/10 ring-violet-400/30 text-violet-100",
  NoteGPT: "from-cyan-500/15 to-sky-500/10 ring-cyan-400/30 text-cyan-100",
  Eightify: "from-amber-500/15 to-rose-500/10 ring-amber-400/30 text-amber-100",
};

export function CompetitiveMatrix({ data }: { data: CompetitiveData }) {
  const [group, setGroup] = useState<CompetitorRow["group"]>("Company");
  const filtered = data.rows.filter((r) => r.group === group);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>Competitive matrix</CardTitle>
            <CardDescription>
              VidIQ vs. NoteGPT (web summariser leader) vs. Eightify (Chrome extension leader)
            </CardDescription>
          </div>

          {/* Group switcher */}
          <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
            {GROUP_META.map((g) => {
              const active = group === g.id;
              const has = data.rows.some((r) => r.group === g.id);
              if (!has) return null;
              return (
                <button
                  key={g.id}
                  onClick={() => setGroup(g.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/15 text-foreground ring-1 ring-violet-400/30"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <g.icon className={cn("h-3.5 w-3.5", active && g.accent)} />
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <div className="space-y-4 px-6 pb-6">
        {/* Comparison table */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5">Attribute</th>
                <th className="px-3 py-2.5">
                  <span className="text-violet-200">VidIQ</span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="text-cyan-200">NoteGPT</span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="text-amber-200">Eightify</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr
                  key={`${r.group}-${r.attribute}-${i}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="border-b border-white/[0.03] last:border-0 align-top"
                >
                  <td className="px-3 py-2.5 font-medium text-muted-foreground">{r.attribute}</td>
                  <td className="px-3 py-2.5">{r.vidiq || "—"}</td>
                  <td className="px-3 py-2.5">{r.notegpt || "—"}</td>
                  <td className="px-3 py-2.5">{r.eightify || "—"}</td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No data captured for this group.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SWOT lists */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data.swot.map((block) => (
            <div
              key={block.kind}
              className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]"
            >
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
                {block.kind === "Strengths" ? (
                  <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <Shield className="h-3.5 w-3.5 text-rose-300" />
                )}
                <h4 className="text-xs font-semibold uppercase tracking-wider">
                  {block.kind}
                </h4>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/[0.04]">
                {(["VidIQ", "NoteGPT", "Eightify"] as const).map((ent) => {
                  const entry = block.entries.find((e) => e.entity === ent);
                  return (
                    <div key={ent} className="p-2">
                      <div
                        className={cn(
                          "mb-1.5 inline-flex rounded-md bg-gradient-to-br px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                          ENTITY_ACCENT[ent],
                        )}
                      >
                        {ent}
                      </div>
                      <ul className="space-y-1">
                        {(entry?.items ?? []).map((it, i) => (
                          <li
                            key={i}
                            className="flex gap-1.5 text-[11px] leading-snug text-muted-foreground"
                          >
                            <span className="text-foreground/40">·</span>
                            <span>{it}</span>
                          </li>
                        ))}
                        {(entry?.items ?? []).length === 0 && (
                          <li className="text-[11px] text-muted-foreground/60">—</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Opportunities + Threats */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ListBlock
            title="Opportunities"
            icon={Lightbulb}
            accent="text-amber-300"
            border="border-amber-400/20 bg-amber-500/[0.03]"
            items={data.opportunities}
          />
          <ListBlock
            title="Threats"
            icon={Target}
            accent="text-rose-300"
            border="border-rose-400/20 bg-rose-500/[0.03]"
            items={data.threats}
          />
        </div>
      </div>
    </Card>
  );
}

function ListBlock({
  title,
  icon: Icon,
  accent,
  border,
  items,
}: {
  title: string;
  icon: typeof AlertTriangle;
  accent: string;
  border: string;
  items: string[];
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border", border)}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <Icon className={cn("h-3.5 w-3.5", accent)} />
        <h4 className="text-xs font-semibold uppercase tracking-wider">{title}</h4>
        <span className="ml-auto text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      <ol className="space-y-1.5 p-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-xs leading-relaxed">
            <span className="font-mono text-[10px] text-muted-foreground">{i + 1}.</span>
            <span>{it}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
