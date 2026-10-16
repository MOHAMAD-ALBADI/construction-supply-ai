import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents / partialPrefetching from the 16.4 template are intentionally off:
  // every page is per-user and reads the Supabase session cookie, so request-time
  // rendering is the simpler, correct default for this MVP (see CLAUDE.md → Pinned stack).
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
