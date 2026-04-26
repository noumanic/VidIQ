/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }] },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      { source: "/proxy/api/:path*", destination: `${api}/api/:path*` },
      { source: "/proxy/media/:path*", destination: `${api}/media/:path*` },
    ];
  },
};

export default nextConfig;
