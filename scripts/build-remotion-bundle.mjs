import path from "node:path";
import { rm } from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import TerserPlugin from "terser-webpack-plugin";

const outDir = path.join(process.cwd(), ".remotion-bundle");

await rm(outDir, { force: true, recursive: true });


const bundleDir = await bundle({
  entryPoint: path.join(process.cwd(), "remotion/index.ts"),
  outDir,
  publicDir: null,
  webpackOverride: (currentConfig) => {
    return {
      ...currentConfig,
      mode: "production",
      devtool: false,
      resolve: {
        ...currentConfig.resolve,
        alias: {
          ...currentConfig.resolve?.alias,
          "@mediabunny/aac-encoder": false,
          "@mediabunny/flac-encoder": false,
          "@mediabunny/mp3-encoder": false,
        },
      },
      optimization: {
        ...currentConfig.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            extractComments: false,
            terserOptions: {
              compress: {
                drop_console: true,
                passes: 2,
              },
              format: {
                comments: false,
              },
            },
          }),
        ],
      },
    };
  },










});

console.log(`Remotion bundle built at ${bundleDir}`);
