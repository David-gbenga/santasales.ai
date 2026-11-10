import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Card rendering reads TTF fonts from disk at request time; make sure
  // Vercel bundles them with the route that renders cards.
  outputFileTracingIncludes: {
    "/api/generate/card": ["./assets/fonts/**/*"],
  },
  partialPrefetching: true,
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
