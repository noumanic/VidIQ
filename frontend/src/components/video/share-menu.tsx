"use client";

import { useState } from "react";
import {
  Share2,
  Download,
  Printer,
  Link as LinkIcon,
  Check,
  FileText,
  Braces,
} from "lucide-react";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { VideoDetail } from "@/lib/api";
import { downloadVideoJson, downloadVideoMarkdown } from "@/lib/export";
import { cn } from "@/lib/utils";

export function ShareMenu({ video }: { video: VideoDetail }) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/videos/${video.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — your browser blocked clipboard access");
    }
  };

  const nativeShare = async () => {
    if (typeof navigator === "undefined" || !("share" in navigator)) {
      copyLink();
      return;
    }
    try {
      await navigator.share({
        title: video.title || "VidIQ analysis",
        text: video.summary?.overview?.slice(0, 200) ?? "Watch and analyse with VidIQ",
        url: shareUrl,
      });
    } catch {
      // user cancelled — silent
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Share or export"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-sm font-medium transition-colors hover:bg-white/[0.05]"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 overflow-hidden rounded-xl border border-white/[0.08] bg-card/95 p-1.5 shadow-2xl shadow-violet-950/30 backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          {/* Section: Share */}
          <SectionLabel>Share</SectionLabel>
          <Item
            icon={copied ? Check : LinkIcon}
            label={copied ? "Copied!" : "Copy link"}
            onSelect={copyLink}
            highlight={copied}
          />
          {typeof navigator !== "undefined" && "share" in navigator ? (
            <Item icon={Share2} label="Share via system…" onSelect={nativeShare} />
          ) : null}

          <Separator />

          {/* Section: Export */}
          <SectionLabel>Export</SectionLabel>
          <Item
            icon={FileText}
            label="Download as Markdown"
            hint=".md"
            onSelect={() => {
              downloadVideoMarkdown(video);
              toast.success("Markdown export downloaded");
            }}
          />
          <Item
            icon={Braces}
            label="Download as JSON"
            hint=".json"
            onSelect={() => {
              downloadVideoJson(video);
              toast.success("JSON export downloaded");
            }}
          />
          <Item
            icon={Printer}
            label="Print / Save as PDF"
            hint="⌘P"
            onSelect={() => {
              // Defer slightly so the dropdown closes before the print dialog blocks the UI.
              setTimeout(() => window.print(), 50);
            }}
          />

          <Separator />

          {/* Inline shareable link */}
          <div className="px-2 pb-1.5 pt-2">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Direct link
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 truncate bg-transparent px-1 font-mono text-[11px] text-muted-foreground outline-none"
              />
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-violet-100"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Item({
  icon: Icon,
  label,
  hint,
  onSelect,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onSelect: () => void;
  highlight?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        "group relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none transition-colors",
        highlight
          ? "bg-emerald-500/10 text-emerald-200"
          : "text-foreground/90 hover:bg-white/[0.04] focus:bg-white/[0.05]",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          highlight ? "text-emerald-300" : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {hint && (
        <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 font-mono text-[9px] text-muted-foreground">
          {hint}
        </kbd>
      )}
    </DropdownMenu.Item>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function Separator() {
  return <div className="my-1 h-px bg-white/[0.06]" />;
}

