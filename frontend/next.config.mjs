/** @type {import('next').NextConfig} */

// Resolve the backend URL for /proxy rewrites. Defensive against:
//  1. Missing env var on Vercel  → fall back to the deployed HF Space.
//  2. Stray whitespace from clipboard pastes → trim it.
//  3. Trailing slash → strip it (`api + '/api/...'` would otherwise double up).
//  4. URLs without protocol → prepend https://.
function resolveApiUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  let url = raw || "https://noumanhafeez11-vidiq-backend.hf.space";
  url = url.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

const API_URL = resolveApiUrl();
console.log(`[vidiq] proxy → ${API_URL}`);

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      { source: "/proxy/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/proxy/media/:path*", destination: `${API_URL}/media/:path*` },
    ];
  },
};

export default nextConfig;
