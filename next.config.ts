import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Card rendering reads TTF fonts from disk at request time; make sure
  // Vercel bundles them with the route that renders cards.
  outputFileTracingIncludes: {
    "/api/generate/card": ["./assets/fonts/**/*"],
  },
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nobody may put the site in a frame (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Other sites see only our domain, never full URLs (studio and gift links).
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
