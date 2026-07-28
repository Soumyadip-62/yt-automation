import path from "node:path";
import { rm } from "node:fs/promises";
import { bundle } from "@remotion/bundler";

const outDir = path.join(process.cwd(), ".remotion-bundle");

await rm(outDir, { force: true, recursive: true });

const bundleDir = await bundle({
  entryPoint: path.join(process.cwd(), "remotion/index.ts"),
  outDir,
  publicDir: path.join(process.cwd(), "public"),
});

console.log(`Remotion bundle built at ${bundleDir}`);
