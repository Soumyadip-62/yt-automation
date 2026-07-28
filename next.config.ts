import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/render": [
      "./remotion/**/*",
      "./node_modules/@rspack/binding/**/*",
      "./node_modules/.pnpm/@rspack+binding@1.7.11*/**/*",
      "./node_modules/.pnpm/@rspack+binding-linux-x64-gnu@1.7.11*/**/*",
      "./node_modules/.pnpm/@rspack+binding-linux-x64-musl@1.7.11*/**/*",
    ],
  },
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/vercel",
    "@rspack/binding",
    "@rspack/core",
    "@vercel/sandbox",
  ],
};

export default nextConfig;
