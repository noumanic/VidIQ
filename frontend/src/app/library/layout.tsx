import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Every video you have analysed with VidIQ — recorded and live — with full transcripts, summaries, keyframes and chat history.",
  alternates: { canonical: "/library" },
  robots: { index: false, follow: true },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
