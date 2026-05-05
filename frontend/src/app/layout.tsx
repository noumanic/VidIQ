import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { TopNav } from "@/components/layout/top-nav";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VidIQ x AI Video Intelligence",
  description:
    "Analyse any YouTube video or live stream. Extract transcripts, key moments, summaries, events and chat with the content — powered by multimodal AI.",
  icons: {
    icon: "/vidiq_logo_black_bg.png",
    apple: "/vidiq_logo_black_bg.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0612",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="relative min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <TopNav />
            <main className="relative flex-1">{children}</main>
            <footer className="border-t border-border/40 bg-background/40 py-8 backdrop-blur-sm">
              <div className="container flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  VidIQ · multimodal video intelligence
                </span>
                <span className="opacity-70">FastAPI · Next.js · Gemini · Whisper</span>
              </div>
            </footer>
          </div>
          <Toaster
            theme="dark"
            richColors
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(265 30% 10% / 0.95)",
                border: "1px solid hsl(270 30% 100% / 0.08)",
                backdropFilter: "blur(12px)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
