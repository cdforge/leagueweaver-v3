import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow a parallel dev instance (its own build dir → its own lock) via
  // NEXT_DIST_DIR, so QA can run alongside another running dev server.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
