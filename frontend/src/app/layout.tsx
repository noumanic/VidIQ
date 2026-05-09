import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemedToaster } from "@/components/layout/themed-toaster";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { OnboardingTour, ReopenTourButton } from "@/components/layout/onboarding-tour";
import { NavigationProgress } from "@/components/layout/nav-progress";
import { LandingSplash } from "@/components/fx/landing-splash";
import { SiteJsonLd } from "@/components/fx/seo-jsonld";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = "VidIQ";
const SITE_TAGLINE = "AI Video Intelligence";
const SITE_DESCRIPTION =
  "Turn any YouTube video or live stream into structured intelligence — transcripts, time-stamped summaries, keyframes, event detection and grounded Q&A, powered by multimodal AI.";

const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;
const BING_VERIFICATION = process.env.NEXT_PUBLIC_BING_VERIFICATION;
const YANDEX_VERIFICATION = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "VidIQ",
    "AI video intelligence",
    "YouTube summariser",
    "video transcript AI",
    "live stream analysis",
    "keyframe extraction",
    "video Q&A",
    "multimodal AI",
    "video summarisation",
    "lecture notes AI",
    "study with video",
    "AI for educators",
    "Gemini video",
    "Whisper transcription",
  ],
  authors: [{ name: "VidIQ Team" }],
  creator: "VidIQ",
  publisher: "VidIQ",
  category: "Artificial Intelligence",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/vidiq_logo_white_bg.png",
        width: 1200,
        height: 630,
        alt: "VidIQ — AI Video Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/vidiq_logo_white_bg.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  verification: {
    ...(GSC_VERIFICATION ? { google: GSC_VERIFICATION } : {}),
    ...(YANDEX_VERIFICATION ? { yandex: YANDEX_VERIFICATION } : {}),
    ...(BING_VERIFICATION
      ? { other: { "msvalidate.01": BING_VERIFICATION } }
      : {}),
  },
  icons: {
    icon: [
      // Modern browsers will prefer the SVG (sharper at every size); the PNG
      // entries stay as fallback for older targets.
      { url: "/vidiq_logo_black_bg.svg", type: "image/svg+xml" },
      { url: "/vidiq_logo_black_bg.png", sizes: "any" },
      { url: "/vidiq_logo_black_bg.png", type: "image/png" },
    ],
    apple: "/vidiq_logo_black_bg.png",
    shortcut: "/vidiq_logo_black_bg.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0612" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Set the theme class before paint to avoid a flash of wrong colours. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="relative min-h-screen bg-background font-sans antialiased">
        <SiteJsonLd />
        <Providers>
          <NavigationProgress />
          <div className="relative flex min-h-screen flex-col">
            <TopNav />
            <main className="relative flex-1">{children}</main>
            <footer className="border-t border-border/40 bg-background/40 py-8 backdrop-blur-sm">
              <div className="container flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  VidIQ · multimodal video intelligence
                </span>
                <span className="flex items-center gap-3">
                  <ReopenTourButton />
                  <span className="opacity-70">FastAPI · Next.js · Gemini · Whisper</span>
                </span>
              </div>
            </footer>
          </div>
          <LandingSplash />
          <CommandPalette />
          <OnboardingTour />
          <ThemedToaster />
        </Providers>
      </body>
    </html>
  );
}
