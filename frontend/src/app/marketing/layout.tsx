import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketing",
  description:
    "Live digital-marketing dashboard for the VidIQ project — KPI tracker, budget breakdown, competitive matrix and keyword research, all sourced from the marketing/ deliverables.",
  alternates: { canonical: "/marketing" },
  robots: { index: false, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
