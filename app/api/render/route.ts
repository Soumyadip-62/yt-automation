import { NextResponse } from "next/server";
import type { RenderPlan } from "@/types/render-plan";

export const runtime = "nodejs";
export const maxDuration = 60;

const RENDER_WORKER_URL = process.env.RENDER_WORKER_URL?.replace(/\/$/, "");

type WorkerErrorResponse = {
  error?: string;
};

function getWorkerHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.RENDER_WORKER_SECRET) {
    headers["x-render-worker-secret"] = process.env.RENDER_WORKER_SECRET;
  }

  return headers;
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
    /^data:audio\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/.test(value)
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

export async function POST(request: Request) {
  try {
    if (!RENDER_WORKER_URL) {
      return NextResponse.json(
        { error: "Set RENDER_WORKER_URL to use the render worker." },
        { status: 500 },
      );
    }

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

    const response = await fetch(`${RENDER_WORKER_URL}/render`, {
      body: JSON.stringify(plan),
      headers: getWorkerHeaders(),
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({
      error: "Render worker returned an invalid response.",
    }))) as WorkerErrorResponse;

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Video render failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video render failed." },
      { status: 500 },
    );
  }
}
