import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/render": [
      "./remotion/**/*",
      "./node_modules/@remotion/bundler/renderEntry.tsx",
      "./node_modules/.pnpm/@remotion+bundler@4.0.250_*/node_modules/@remotion/bundler/renderEntry.tsx",
    ],
  },
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer"],
};

export default nextConfig;
