import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Fonts and artwork the share card reads from disk at runtime
  outputFileTracingIncludes: {
    "/[uid]/card": ["./assets/card/**"],
  },
  cacheComponents: true,
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
