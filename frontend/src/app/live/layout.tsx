import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live stream analysis",
  description:
    "Connect any YouTube Live, webinar or lecture broadcast and VidIQ runs rolling transcription, keyframe vision and rolling LLM summarisation in real time.",
  alternates: { canonical: "/live" },
  openGraph: {
    title: "Live stream analysis · VidIQ",
    description:
      "Real-time transcription, keyframe vision and rolling AI summaries for any live stream.",
    url: "/live",
    type: "website",
  },
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
