const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function SiteJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VidIQ",
    url: SITE_URL,
    logo: `${SITE_URL}/vidiq_logo_white_bg.png`,
    description:
      "VidIQ is an AI video intelligence platform that converts any YouTube video or live stream into transcripts, time-stamped summaries, keyframes, detected events and a grounded Q&A interface.",
    foundingDate: "2025",
    sameAs: [],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VidIQ — AI Video Intelligence",
    url: SITE_URL,
    publisher: { "@type": "Organization", name: "VidIQ" },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/library?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "VidIQ",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description:
      "Multimodal AI platform for understanding live and recorded online videos — transcribe, analyse keyframes, summarise, detect events and chat with any YouTube video or live stream.",
    url: SITE_URL,
    image: `${SITE_URL}/vidiq_logo_white_bg.png`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "YouTube video analysis",
      "Live stream analysis",
      "Multimodal summarisation",
      "Keyframe extraction with vision captioning",
      "Event detection",
      "Grounded Q&A with timestamp citations",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
