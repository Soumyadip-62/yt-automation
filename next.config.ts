import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/render": [
      "./.remotion-bundle/**/*",
      "./remotion/**/*",
    ],
  },
  serverExternalPackages: [
    "@remotion/vercel",
    "@vercel/sandbox",
  ],
};

export default nextConfig;
