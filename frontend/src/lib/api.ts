"use client";

const BASE = "/proxy";

export type VideoSummary = {
  id: string;
  source_type: "youtube" | "live" | "upload";
  source_url: string;
  title: string | null;
  channel: string | null;
  duration_sec: number | null;
  thumbnail: string | null;
  status: "pending" | "processing" | "completed" | "failed" | "live";
  progress: number;
  stage: string | null;
  error: string | null;
  tags: string[];
  created_at: string;
};

export type Chapter = { start: number; end: number; title: string };
export type Summary = {
  overview: string;
  key_points: string[];
  topics: string[];
  chapters: Chapter[];
  sentiment: string | null;
  pseudocode: string | null;
  action_items: string[];
  questions: string[];
};
export type TranscriptSegment = { start: number; end: number; text: string; speaker: string | null };
export type Keyframe = { timestamp: number; image_path: string; caption: string | null; tags: string[] };
export type DetectedEvent = {
  timestamp: number;
  title: string;
  description: string;
  severity: "info" | "notice" | "warning";
  category: string | null;
};
export type VideoDetail = VideoSummary & {
  summary: Summary | null;
  transcript: TranscriptSegment[];
  keyframes: Keyframe[];
  events: DetectedEvent[];
};
export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  citations: { timestamp: number; text: string }[];
  created_at: string;
};

export type TranslatedSegment = {
  start: number;
  end: number;
  text: string;
  speaker: string | null;
};
export type TranslationResponse = {
  language: string;
  cached: boolean;
  segments: TranslatedSegment[];
};

export type SearchHit = VideoSummary & { snippet: string | null };
export type SearchResponse = {
  query: string;
  total: number;
  results: SearchHit[];
};

export type AnalyticsKPI = {
  videos_total: number;
  videos_completed: number;
  videos_processing: number;
  videos_failed: number;
  hours_processed: number;
  events_detected: number;
  keyframes_extracted: number;
  transcript_segments: number;
  chat_messages: number;
  avg_duration_sec: number;
  completion_rate: number;
};
export type LabelValue = { label: string; value: number };
export type TimePoint = { date: string; count: number };
export type AnalyticsOverview = {
  kpi: AnalyticsKPI;
  daily_volume: TimePoint[];
  source_mix: LabelValue[];
  status_breakdown: LabelValue[];
  top_topics: LabelValue[];
  event_categories: LabelValue[];
  event_severity: LabelValue[];
  sentiment_distribution: LabelValue[];
  duration_buckets: LabelValue[];
};

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isMutation = init?.method && init.method !== "GET";
  // Only retry idempotent reads — never replay POST/DELETE.
  const maxAttempts = isMutation ? 1 : 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const r = await fetch(`${BASE}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        cache: "no-store",
      });
      // 5xx is treated as transient — retry the read.
      if (r.status >= 500 && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`${r.status} ${r.statusText}${text ? ` — ${text}` : ""}`);
      }
      if (r.status === 204) return undefined as T;
      return (await r.json()) as T;
    } catch (e) {
      lastErr = e;
      if (attempt >= maxAttempts) break;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export const api = {
  health: () =>
    jsonFetch<{
      status: string;
      llm_configured: boolean;
      provider: string;
      model: string;
      transcription_provider: string;
      gemini?: {
        configured: boolean;
        models_total: number;
        models_available_now: number;
        models: { model: string; available: boolean; cooldown_seconds: number }[];
      };
    }>("/api/health"),

  listVideos: () => jsonFetch<VideoSummary[]>("/api/videos"),

  getVideo: (id: string) => jsonFetch<VideoDetail>(`/api/videos/${id}`),

  analyze: (url: string, opts?: { domain?: string; extract_pseudocode?: boolean }) =>
    jsonFetch<VideoSummary>("/api/videos", {
      method: "POST",
      body: JSON.stringify({ url, ...opts }),
    }),

  deleteVideo: (id: string) => jsonFetch<void>(`/api/videos/${id}`, { method: "DELETE" }),

  updateTags: (id: string, tags: string[]) =>
    jsonFetch<VideoSummary>(`/api/videos/${id}/tags`, {
      method: "PATCH",
      body: JSON.stringify({ tags }),
    }),

  translate: (id: string, lang: string, refresh = false) =>
    jsonFetch<TranslationResponse>(
      `/api/videos/${id}/translate?lang=${encodeURIComponent(lang)}${refresh ? "&refresh=true" : ""}`,
      { method: "POST" },
    ),

  search: (q: string, limit = 20) =>
    jsonFetch<SearchResponse>(
      `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  chatHistory: (id: string) => jsonFetch<ChatMessage[]>(`/api/videos/${id}/chat`),
  chat: (id: string, message: string) =>
    jsonFetch<ChatMessage>(`/api/videos/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  analyticsOverview: (days = 30) =>
    jsonFetch<AnalyticsOverview>(`/api/analytics/overview?days=${days}`),

  startLive: (url: string, chunk_seconds = 30) =>
    jsonFetch<VideoSummary>("/api/live", {
      method: "POST",
      body: JSON.stringify({ url, chunk_seconds }),
    }),
  stopLive: (id: string) => jsonFetch<void>(`/api/live/${id}/stop`, { method: "POST" }),
};

export function mediaUrl(path: string): string {
  // Backend stores paths relative to MEDIA_DIR (forward slashes).
  // The /media static mount serves them; /proxy/* rewrites to the API host.
  const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `/proxy/media/${clean}`;
}

export function wsUrl(videoId: string): string {
  if (typeof window === "undefined") return "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;
  const wsBase = apiBase.replace(/^http/, "ws");
  return `${wsBase}/ws/videos/${videoId}`;
}
