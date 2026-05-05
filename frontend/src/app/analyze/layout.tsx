import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyse a video",
  description:
    "Paste any YouTube URL and VidIQ will transcribe speech, extract keyframes and produce a time-stamped multimodal summary, detected events and a grounded Q&A — usually in under a minute.",
  alternates: { canonical: "/analyze" },
  openGraph: {
    title: "Analyse a video · VidIQ",
    description:
      "Drop a YouTube URL — get a transcript, keyframes, summary and chat in seconds.",
    url: "/analyze",
    type: "website",
  },
};

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
