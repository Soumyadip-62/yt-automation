import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { NextResponse } from "next/server";
import { COMPOSITION_ID } from "@/remotion/constants";
import type { RenderPlan } from "@/types/render-plan";

export const runtime = "nodejs";
export const maxDuration = 300;

let bundlePromise: Promise<string> | null = null;

function getBundle() {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion/index.ts"),
      publicDir: path.join(process.cwd(), "public"),
    }).catch((error) => {
      bundlePromise = null;
      throw error;
    });
  }

  return bundlePromise;
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
    value.startsWith("/") ||
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

function isValidMediaUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value.startsWith("/") || isRemoteHttpsUrl(value) || value.startsWith("data:");
}

function getRenderPlanError(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Render plan payload is empty.";

  const plan = value as Partial<RenderPlan>;
  if (typeof plan.script !== "string") return "Missing script string.";
  if (!plan.metadata) return "Missing video metadata.";
  if (!Array.isArray(plan.scenes) || plan.scenes.length === 0) return "Script has no scenes.";
  if (plan.scenes.length > 20) return "Too many scenes (max 20).";
  if (!plan.selectedAssetsByScene) return "Missing selected assets mapping.";
  if (typeof plan.audioUrl !== "string" || !isUnitValue(plan.audioVolume)) return "Invalid audio settings.";
  if (plan.audioUrl !== "" && !isAudioSource(plan.audioUrl)) return "Invalid voiceover audio source.";
  if (
    typeof plan.musicUrl !== "string" ||
    typeof plan.musicLoop !== "boolean" ||
    !isUnitValue(plan.musicVolume) ||
    !isUnitValue(plan.musicDucking) ||
    typeof plan.musicFadeInSeconds !== "number" ||
    plan.musicFadeInSeconds < 0 ||
    plan.musicFadeInSeconds > 10 ||
    typeof plan.musicFadeOutSeconds !== "number" ||
    plan.musicFadeOutSeconds < 0 ||
    plan.musicFadeOutSeconds > 10
  ) return "Invalid background music settings.";
  if (plan.musicUrl !== "" && !isAudioSource(plan.musicUrl)) return "Invalid background music URL.";
  if (!hasValidTimings(plan)) return "Invalid scene or word timings format.";

  for (let index = 0; index < plan.scenes.length; index += 1) {
    const scene = plan.scenes[index];
    const asset = plan.selectedAssetsByScene?.[index];
    if (!scene || typeof scene.caption !== "string") return `Scene ${index + 1} has invalid caption.`;
    if (typeof scene.duration !== "number" || scene.duration < 0.25 || scene.duration > 30) return `Scene ${index + 1} duration must be between 0.25s and 30s.`;
    if (!asset) return `Scene ${index + 1} has no selected asset. Choose an asset for every scene.`;
    if (!isValidMediaUrl(asset.assetsurl)) return `Scene ${index + 1} asset URL is invalid.`;
    if (asset.mediaType !== "image" && asset.mediaType !== "video") return `Scene ${index + 1} asset media type is invalid.`;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const rawPlan = (await request.json()) as unknown;
    const validationError = getRenderPlanError(rawPlan);

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 },
      );
    }

    const plan = JSON.parse(JSON.stringify(rawPlan)) as RenderPlan;

    if (
      plan.musicUrl &&
      (plan.musicUrl.startsWith("/sounds/") ||
        plan.musicUrl.startsWith("/api/sounds/"))
    ) {
      const filename = path.basename(decodeURIComponent(plan.musicUrl));
      const publicPath = path.join(process.cwd(), "public", "sounds", filename);
      const assetsPath = path.join(process.cwd(), "assets", "sounds", filename);
      const filePath = fs.existsSync(publicPath)
        ? publicPath
        : fs.existsSync(assetsPath)
          ? assetsPath
          : null;

      if (filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const mimeType =
          ext === ".wav"
            ? "audio/wav"
            : ext === ".ogg"
              ? "audio/ogg"
              : ext === ".m4a" || ext === ".aac"
                ? "audio/mp4"
                : "audio/mpeg";

        plan.musicUrl = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      }
    }
    const serveUrl = await getBundle();
    const composition = await selectComposition({
      id: COMPOSITION_ID,
      inputProps: plan,
      serveUrl,
    });
    const renderId = randomUUID();
    const outputDirectory = path.join(process.cwd(), "public", "videos");
    const outputLocation = path.join(outputDirectory, `${renderId}.mp4`);

    await mkdir(outputDirectory, { recursive: true });
    await renderMedia({
      codec: "h264",
      composition,
      inputProps: plan,
      outputLocation,
      serveUrl,
    });

    return NextResponse.json({
      renderId,
      videoUrl: `/videos/${renderId}.mp4`,
    });
  } catch (error) {
    console.error("Video render failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video render failed." },
      { status: 500 },
    );
  }
}
