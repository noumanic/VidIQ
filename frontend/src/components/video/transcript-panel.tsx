"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Languages, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { api, type TranslatedSegment, type VideoDetail } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn, formatTimestamp } from "@/lib/utils";

type Lang = { code: string; label: string; flag: string };

const LANGUAGES: Lang[] = [
  { code: "ur", label: "Urdu", flag: "🇵🇰" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "tr", label: "Turkish", flag: "🇹🇷" },
];

// Right-to-left scripts get RTL text alignment for legibility.
const RTL_LANGS = new Set(["ur", "ar", "fa", "he"]);

export function TranscriptPanel({
  video,
  onSeek,
}: {
  video: VideoDetail;
  onSeek: (s: number) => void;
}) {
  const [q, setQ] = useState("");
  const [activeLang, setActiveLang] = useState<Lang | null>(null);
  const [translated, setTranslated] = useState<TranslatedSegment[] | null>(null);

  const translateM = useMutation({
    mutationFn: (lang: string) => api.translate(video.id, lang),
    onSuccess: (res, lang) => {
      const meta = LANGUAGES.find((l) => l.code === lang) ?? null;
      setActiveLang(meta);
      setTranslated(res.segments);
      toast.success(
        res.cached
          ? `Loaded cached ${meta?.label ?? lang} translation`
          : `Translated to ${meta?.label ?? lang}`,
      );
    },
    onError: (e: Error) => toast.error("Translation failed", { description: e.message }),
  });

  const segments = translated ?? video.transcript;
  const isRtl = activeLang ? RTL_LANGS.has(activeLang.code) : false;

  const filtered = useMemo(() => {
    if (!q.trim()) return segments;
    const term = q.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(term));
  }, [q, segments]);

  if (!video.transcript?.length) {
    return (
      <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
        Transcript not yet available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transcript…"
            className="pl-9"
          />
        </div>

        {/* Language selector */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              disabled={translateM.isPending}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 text-xs font-medium transition-colors hover:bg-white/[0.04] disabled:opacity-60"
              title="Translate transcript"
            >
              {translateM.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Languages className="h-3.5 w-3.5" />
              )}
              {activeLang ? (
                <>
                  <span>{activeLang.flag}</span>
                  <span>{activeLang.label}</span>
                </>
              ) : (
                <span>Translate</span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 max-h-72 w-44 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
            >
              {activeLang && (
                <>
                  <DropdownMenu.Item
                    onSelect={(e) => {
                      e.preventDefault();
                      setActiveLang(null);
                      setTranslated(null);
                      toast.success("Showing original transcript");
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none transition-colors hover:bg-white/[0.04]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Show original
                  </DropdownMenu.Item>
                  <div className="my-1 h-px bg-border" />
                </>
              )}
              {LANGUAGES.map((l) => (
                <DropdownMenu.Item
                  key={l.code}
                  onSelect={(e) => {
                    e.preventDefault();
                    translateM.mutate(l.code);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none transition-colors hover:bg-white/[0.04]",
                    activeLang?.code === l.code && "bg-violet-500/10 text-violet-200",
                  )}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="flex-1">{l.label}</span>
                  {activeLang?.code === l.code && (
                    <span className="text-[10px] text-muted-foreground">active</span>
                  )}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {activeLang && (
        <div className="flex items-center gap-2 rounded-md border border-violet-400/20 bg-violet-500/[0.04] px-3 py-1.5 text-[11px] text-muted-foreground">
          <Languages className="h-3 w-3 text-violet-300" />
          Showing <Badge variant="outline">{activeLang.flag} {activeLang.label}</Badge> translation —
          AI-generated · timestamps still seek the original audio.
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-460px)] min-h-[400px] max-h-[720px] rounded-xl border bg-card">
        <div className="divide-y">
          {filtered.map((s, i) => (
            <button
              key={i}
              onClick={() => onSeek(s.start)}
              dir={isRtl ? "rtl" : "ltr"}
              className="group flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono tabular-nums text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {formatTimestamp(s.start)}
              </span>
              <span
                className={cn(
                  "text-sm leading-relaxed text-foreground/90",
                  isRtl && "text-right",
                )}
              >
                {highlight(s.text, q)}
              </span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No matches.</div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const re = new RegExp(`(${escapeRe(q)})`, "ig");
  return text.split(re).map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="rounded bg-primary/20 text-foreground px-0.5">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
