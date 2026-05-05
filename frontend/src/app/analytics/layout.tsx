import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Cross-library analytics for every video VidIQ has analysed — volume trends, source mix, top topics, event categories, sentiment distribution and pipeline health.",
  alternates: { canonical: "/analytics" },
  robots: { index: false, follow: true },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
