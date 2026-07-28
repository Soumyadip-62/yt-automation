import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/render": ["./remotion/**/*"],
  },
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/vercel",
    "@vercel/sandbox",
  ],
};

export default nextConfig;
