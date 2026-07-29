import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { renderMedia, selectComposition } from "@remotion/renderer";

const PORT = Number(process.env.PORT || 4000);
const COMPOSITION_ID = "SpaceShort";
const BLOB_ACCESS = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const MAX_BODY_BYTES = Number(process.env.RENDER_WORKER_MAX_BODY_BYTES || 100_000_000);
const RENDER_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS || 10 * 60 * 1000);
const REMOTION_BUNDLE_DIR =
  process.env.REMOTION_BUNDLE_DIR || path.join(process.cwd(), ".remotion-bundle");
const OUTPUT_DIR = process.env.RENDER_OUTPUT_DIR || path.join(process.cwd(), ".render-output");
const WORKER_SECRET = process.env.RENDER_WORKER_SECRET || "";

const renders = new Map();

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function isAuthorized(request) {
  if (!WORKER_SECRET) return true;
  return request.headers["x-render-worker-secret"] === WORKER_SECRET;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) {
      throw new Error("Request body too large.");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isRemoteHttpsUrl(value) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isAudioSource(value) {
  return (
    isRemoteHttpsUrl(value) ||
    (typeof value === "string" &&
      value.length <= MAX_BODY_BYTES &&
      /^data:audio\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/.test(value))
  );
}

function isUnitValue(value) {
  return typeof value === "number" && value >= 0 && value <= 1;
}

function hasValidTimings(plan) {
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

function validateRenderPlan(value) {
  if (!value || typeof value !== "object") return false;

  const plan = value;
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

function updateRender(renderId, patch) {
  const current = renders.get(renderId);
  if (!current) return;
  renders.set(renderId, { ...current, ...patch });
}

async function runRender(renderId, plan) {
  const outputFile = path.join(OUTPUT_DIR, `${renderId}.mp4`);

  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await stat(REMOTION_BUNDLE_DIR);

    updateRender(renderId, {
      overallProgress: 0.05,
      stage: "selecting-composition",
    });

    const composition = await selectComposition({
      serveUrl: REMOTION_BUNDLE_DIR,
      id: COMPOSITION_ID,
      inputProps: plan,
      logLevel: "info",
      timeoutInMilliseconds: RENDER_TIMEOUT_MS,
      chromeMode: "headless-shell",
    });

    await renderMedia({
      serveUrl: REMOTION_BUNDLE_DIR,
      composition,
      inputProps: plan,
      codec: "h264",
      outputLocation: outputFile,
      overwrite: true,
      logLevel: "info",
      timeoutInMilliseconds: RENDER_TIMEOUT_MS,
      chromeMode: "headless-shell",
      onProgress: (progress) => {
        updateRender(renderId, {
          overallProgress: 0.05 + progress.progress * 0.85,
          progress,
          stage: "render-progress",
        });
      },
    });

    updateRender(renderId, { overallProgress: 0.95, stage: "uploading" });

    const output = await readFile(outputFile);
    const blob = await put(`renders/${renderId}.mp4`, output, {
      access: BLOB_ACCESS,
      contentType: "video/mp4",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const stats = await stat(outputFile);

    updateRender(renderId, {
      contentType: "video/mp4",
      overallProgress: 1,
      size: stats.size,
      stage: "done",
      url: blob.url,
    });
  } catch (error) {
    updateRender(renderId, {
      message: error instanceof Error ? error.message : String(error),
      overallProgress: 1,
      stage: "error",
    });
  } finally {
    await rm(outputFile, { force: true }).catch(() => undefined);
  }
}

async function handleRender(request, response) {
  const plan = await readJsonBody(request);

  if (!validateRenderPlan(plan)) {
    sendJson(response, 400, {
      error: "Invalid render plan. Select every scene asset and use HTTPS media URLs.",
    });
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    sendJson(response, 500, {
      error: "Set BLOB_READ_WRITE_TOKEN on the render worker.",
    });
    return;
  }

  const renderId = randomUUID();
  renders.set(renderId, {
    cmdId: renderId,
    overallProgress: 0,
    renderId,
    sandboxId: "worker",
    stage: "queued",
  });

  void runRender(renderId, plan);

  sendJson(response, 200, {
    cmdId: renderId,
    renderId,
    sandboxId: "worker",
  });
}

async function handleProgress(request, response) {
  const body = await readJsonBody(request);
  const renderId = body?.renderId;
  const cmdId = body?.cmdId || body?.commandId;

  if (typeof renderId !== "string" || typeof cmdId !== "string") {
    sendJson(response, 400, { error: "Provide render id and command id." });
    return;
  }

  const progress = renders.get(renderId);

  if (!progress || progress.cmdId !== cmdId) {
    sendJson(response, 404, { error: "Render progress not found." });
    return;
  }

  sendJson(response, progress.stage === "error" ? 500 : 200, progress);
}

const server = createServer(async (request, response) => {
  try {
    if (!isAuthorized(request)) {
      sendJson(response, 401, { error: "Unauthorized render worker request." });
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && request.url === "/render") {
      await handleRender(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/render/progress") {
      await handleProgress(request, response);
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Render worker failed.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`[render-worker] listening on :${PORT}`);
  console.log(`[render-worker] bundle=${REMOTION_BUNDLE_DIR}`);
});
