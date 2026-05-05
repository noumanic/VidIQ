import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare videos",
  description:
    "Side-by-side comparison of any two or three analysed videos — duration, sentiment, topics, transcripts, events and keyframe density.",
  alternates: { canonical: "/compare" },
  robots: { index: false, follow: true },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
