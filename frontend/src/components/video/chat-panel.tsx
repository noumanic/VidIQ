"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User, Loader2, Quote } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VideoDetail } from "@/lib/api";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimestamp } from "@/lib/utils";

const SUGGESTIONS = [
  "Give me the TL;DR in one sentence.",
  "What are the main arguments?",
  "Are any claims unsupported?",
  "List action items I should take.",
];

export function ChatPanel({ video, onSeek }: { video: VideoDetail; onSeek: (s: number) => void }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", video.id],
    queryFn: () => api.chatHistory(video.id),
    refetchInterval: 0,
  });

  const send = useMutation({
    mutationFn: (m: string) => api.chat(video.id, m),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", video.id] }),
    onMutate: async (m) => {
      await qc.cancelQueries({ queryKey: ["chat", video.id] });
      const prev = qc.getQueryData(["chat", video.id]) as any[] | undefined;
      qc.setQueryData(["chat", video.id], [
        ...(prev ?? []),
        { id: -1, role: "user", content: m, citations: [], created_at: new Date().toISOString() },
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["chat", video.id], ctx?.prev ?? []),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [messages.length, send.isPending]);

  function submit(text: string) {
    const m = text.trim();
    if (!m) return;
    setDraft("");
    send.mutate(m);
  }

  return (
    <div className="flex h-[640px] flex-col rounded-2xl border bg-card">
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="py-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Ask anything about this video</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Answers are grounded in the transcript and frame captions.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <ChatBubble key={m.id} m={m} onSeek={onSeek} />)
          )}
          {send.isPending ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
        className="border-t p-3 flex items-center gap-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question…"
          disabled={send.isPending}
        />
        <Button type="submit" size="icon" variant="gradient" disabled={!draft.trim() || send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function ChatBubble({ m, onSeek }: { m: any; onSeek: (s: number) => void }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`flex-1 ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser ? "bg-primary text-primary-foreground" : "bg-muted/60"
          }`}
        >
          <div className="space-y-1.5 [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 dark:[&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
          </div>
        </div>
        {!isUser && m.citations?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.citations.map((c: any, i: number) => (
              <button
                key={i}
                onClick={() => onSeek(c.timestamp)}
                title={c.text}
                className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Quote className="h-3 w-3" /> {formatTimestamp(c.timestamp)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
