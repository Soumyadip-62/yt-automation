import { readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { put } from "@vercel/blob";
import {
  createSandbox,
  renderMediaOnVercel,
} from "@remotion/vercel";
import { NextResponse } from "next/server";
import { COMPOSITION_ID } from "@/remotion/constants";
import type { RenderPlan } from "@/types/render-plan";

export const runtime = "nodejs";
export const maxDuration = 300;

const REMOTION_BUNDLE_DIR = path.join(process.cwd(), ".remotion-bundle");
const REMOTION_SANDBOX_BUNDLE_DIR = "remotion-bundle";

const toPosixPath = (filePath: string) => filePath.split(/[/\\]/).join("/");

const getAncestorDirectories = (relativePath: string) => {
  const normalized = toPosixPath(relativePath);
  const parts = normalized.split("/").filter(Boolean);
  const dirs: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    dirs.push(parts.slice(0, i + 1).join("/"));
  }
  return dirs;
};

const toSandboxBundlePath = (relativePath: string) =>
  `${REMOTION_SANDBOX_BUNDLE_DIR}/${toPosixPath(relativePath)}`;

async function getRemotionBundleFiles(bundleDir: string) {
  const fullBundleDir = path.resolve(bundleDir);
  const files: { path: string; content: Buffer }[] = [];

  async function readDirRecursive(dir: string, basePath = "") {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      if (entry.isDirectory()) {
        await readDirRecursive(fullPath, relativePath);
      } else {
        const content = await readFile(fullPath);
        files.push({ path: toPosixPath(relativePath), content });
      }
    }
  }

  await readDirRecursive(fullBundleDir);
  return files;
}

const collectBundleDirectories = (bundleFiles: { path: string }[]) => {
  const dirs = new Set<string>();
  for (const file of bundleFiles) {
    for (const dir of getAncestorDirectories(file.path)) {
      dirs.add(dir);
    }
  }
  return Array.from(dirs).sort();
};

async function addBundleToSandboxBatched({
  sandbox,
  bundleDir,
  maxBatchSizeBytes = 400_000,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sandbox: any;
  bundleDir: string;
  maxBatchSizeBytes?: number;
}) {
  const bundleFiles = await getRemotionBundleFiles(bundleDir);
  const directories = collectBundleDirectories(bundleFiles);

  await sandbox.mkDir(REMOTION_SANDBOX_BUNDLE_DIR);

  for (const dir of directories) {
    const sandboxPath = toSandboxBundlePath(dir);
    try {
      await sandbox.mkDir(sandboxPath);
    } catch {
      // Directory may already exist
    }
  }

  let currentBatch: { path: string; content: Buffer }[] = [];
  let currentBatchBytes = 0;

  for (const file of bundleFiles) {
    const fileBytes = file.content.byteLength;

    if (
      currentBatch.length > 0 &&
      currentBatchBytes + fileBytes > maxBatchSizeBytes
    ) {
      await sandbox.writeFiles(
        currentBatch.map((f) => ({
          path: toSandboxBundlePath(f.path),
          content: f.content,
        })),
      );
      currentBatch = [];
      currentBatchBytes = 0;
    }

    currentBatch.push(file);
    currentBatchBytes += fileBytes;
  }

  if (currentBatch.length > 0) {
    await sandbox.writeFiles(
      currentBatch.map((f) => ({
        path: toSandboxBundlePath(f.path),
        content: f.content,
      })),
    );
  }
}


function isRemoteHttpsUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isAudioSource(value: string) {
  return (
    isRemoteHttpsUrl(value) ||
    (value.length <= 30_000_000 &&
      /^data:audio\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/.test(value))
  );
}

function isUnitValue(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && value <= 1;
}

function hasValidTimings(plan: Partial<RenderPlan>) {
  if (!Array.isArray(plan.sceneTimings) || !Array.isArray(plan.wordTimings)) {
    return false;
  }

  return (
    plan.sceneTimings.every(
      (timing) =>
        Number.isInteger(timing.sceneIndex) &&
        timing.sceneIndex >= 0 &&
        timing.sceneIndex < (plan.scenes?.length ?? 0) &&
        Number.isFinite(timing.startSeconds) &&
        timing.startSeconds >= 0 &&
        Number.isFinite(timing.durationSeconds) &&
        timing.durationSeconds > 0,
    ) &&
    plan.wordTimings.every(
      (timing) =>
        typeof timing.word === "string" &&
        timing.word.length <= 100 &&
        Number.isInteger(timing.sceneIndex) &&
        timing.sceneIndex >= 0 &&
        timing.sceneIndex < (plan.scenes?.length ?? 0) &&
        Number.isFinite(timing.startSeconds) &&
        timing.startSeconds >= 0 &&
        Number.isFinite(timing.endSeconds) &&
        timing.endSeconds >= timing.startSeconds,
    )
  );
}

function validateRenderPlan(value: unknown): value is RenderPlan {
  if (!value || typeof value !== "object") return false;

  const plan = value as Partial<RenderPlan>;
  if (
    typeof plan.script !== "string" ||
    !plan.metadata ||
    !Array.isArray(plan.scenes) ||
    plan.scenes.length === 0 ||
    plan.scenes.length > 20 ||
    !plan.selectedAssetsByScene ||
    typeof plan.audioUrl !== "string" ||
    typeof plan.audioLoop !== "boolean" ||
    !isUnitValue(plan.audioVolume) ||
    (plan.audioUrl !== "" && !isAudioSource(plan.audioUrl)) ||
    typeof plan.musicUrl !== "string" ||
    typeof plan.musicLoop !== "boolean" ||
    !isUnitValue(plan.musicVolume) ||
    !isUnitValue(plan.musicDucking) ||
    typeof plan.musicFadeInSeconds !== "number" ||
    plan.musicFadeInSeconds < 0 ||
    plan.musicFadeInSeconds > 10 ||
    typeof plan.musicFadeOutSeconds !== "number" ||
    plan.musicFadeOutSeconds < 0 ||
    plan.musicFadeOutSeconds > 10 ||
    (plan.musicUrl !== "" && !isAudioSource(plan.musicUrl)) ||
    !hasValidTimings(plan) ||
    !Array.isArray(plan.wordTimings) ||
    plan.wordTimings.length > 2_000
  ) {
    return false;
  }

  return plan.scenes.every((scene, index) => {
    const asset = plan.selectedAssetsByScene?.[index];
    return (
      typeof scene.caption === "string" &&
      typeof scene.duration === "number" &&
      scene.duration >= 0.25 &&
      scene.duration <= 30 &&
      Boolean(asset) &&
      isRemoteHttpsUrl(asset?.assetsurl) &&
      (asset?.mediaType === "image" || asset?.mediaType === "video")
    );
  });
}

async function ensureBlobAudioUrl(
  url: string,
  blobToken: string,
  filenamePrefix: string,
): Promise<string> {
  if (!url || !url.startsWith("data:")) {
    return url;
  }

  try {
    const matches = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return url;

    const contentType = matches[1] || "audio/wav";
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const extension = contentType.split("/")[1] || "wav";
    const filename = `renders/inputs/${filenamePrefix}-${randomUUID()}.${extension}`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
      token: blobToken,
    });

    return blob.url;
  } catch (error) {
    console.error(
      `Failed to upload ${filenamePrefix} data URL to Vercel Blob:`,
      error,
    );
    return url;
  }
}

export async function POST(request: Request) {
  try {
    const plan = (await request.json()) as unknown;

    if (!validateRenderPlan(plan)) {
      return NextResponse.json(
        {
          error:
            "Invalid render plan. Select every scene asset and use HTTPS media URLs.",
        },
        { status: 400 },
      );
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return NextResponse.json(
        { error: "Set BLOB_READ_WRITE_TOKEN to store rendered videos." },
        { status: 500 },
      );
    }

    const sanitizedAudioUrl = await ensureBlobAudioUrl(
      plan.audioUrl,
      blobToken,
      "audio",
    );
    const sanitizedMusicUrl = await ensureBlobAudioUrl(
      plan.musicUrl,
      blobToken,
      "music",
    );

    const sanitizedPlan: RenderPlan = {
      ...plan,
      audioUrl: sanitizedAudioUrl,
      musicUrl: sanitizedMusicUrl,
    };

    const renderId = randomUUID();
    const sandbox = await createSandbox({
      resources: { vcpus: 4 },
      timeoutInMilliseconds: 5 * 60 * 1000,
    });

    await addBundleToSandboxBatched({ bundleDir: REMOTION_BUNDLE_DIR, sandbox });

    const render = await renderMediaOnVercel({
      codec: "h264",
      compositionId: COMPOSITION_ID,
      detached: true,
      detachedSandboxTimeoutInMilliseconds: 10 * 60 * 1000,
      inputProps: sanitizedPlan,
      outputFile: `/tmp/${renderId}.mp4`,
      sandbox,
      timeoutInMilliseconds: 4 * 60 * 1000,
      vercelBlob: {
        access: "public",
        blobPath: `renders/${renderId}.mp4`,
        blobToken,
      },
    });
    const cmdId = render.cmdId;
    const sandboxId = render.sandboxId;

    if (!cmdId || !sandboxId) {
      throw new Error("Vercel Sandbox render did not return command id.");
    }

    return NextResponse.json({
      cmdId,
      renderId,
      sandboxId,
    });
  } catch (error) {
    console.error("Video render failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video render failed." },
      { status: 500 },
    );
  }
}
