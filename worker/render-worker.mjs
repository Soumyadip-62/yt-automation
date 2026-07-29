import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { get, put } from "@vercel/blob";
import { renderMedia, selectComposition } from "@remotion/renderer";

dotenv.config({ path: ".env.local" });
dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const COMPOSITION_ID = "SpaceShort";
const BLOB_ACCESS = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const MAX_BODY_BYTES = Number(process.env.RENDER_WORKER_MAX_BODY_BYTES || 100_000_000);
const RENDER_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS || 10 * 60 * 1000);
const RENDER_CONCURRENCY = Math.max(
  1,
  Number(process.env.REMOTION_RENDER_CONCURRENCY || 1),
);
const REMOTION_BUNDLE_DIR =
  process.env.REMOTION_BUNDLE_DIR || path.join(process.cwd(), ".remotion-bundle");
const OUTPUT_DIR = process.env.RENDER_OUTPUT_DIR || path.join(process.cwd(), ".render-output");
const INPUT_DIR = path.join(OUTPUT_DIR, "inputs");
const WORKER_SECRET = process.env.RENDER_WORKER_SECRET || "";

const renders = new Map();

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendStream(response, stream, contentType) {
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  });
  stream.pipe(response);
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

function extensionFromContentType(contentType) {
  if (contentType.includes("mpeg")) return "mp3";
  if (contentType.includes("mp4")) return "m4a";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("wav")) return "wav";
  return "audio";
}

function workerAssetUrl(filename) {
  return `http://127.0.0.1:${PORT}/worker-assets/${encodeURIComponent(filename)}`;
}

async function streamToBuffer(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function materializeDataUrlAudio(url, renderId, label) {
  const matches = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return url;

  await mkdir(INPUT_DIR, { recursive: true });
  const contentType = matches[1] || "audio/wav";
  const filename = `${renderId}-${label}.${extensionFromContentType(contentType)}`;
  await writeFile(path.join(INPUT_DIR, filename), Buffer.from(matches[2], "base64"));
  return workerAssetUrl(filename);
}

async function materializeBlobAudio(url, renderId, label) {
  if (!url || !url.includes(".blob.vercel-storage.com")) {
    return url;
  }

  const blob = await get(url, {
    access: BLOB_ACCESS,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  if (!blob?.stream) {
    throw new Error(`Could not read ${label} from Vercel Blob.`);
  }

  await mkdir(INPUT_DIR, { recursive: true });
  const contentType = blob.blob.contentType || "audio/wav";
  const filename = `${renderId}-${label}.${extensionFromContentType(contentType)}`;
  await writeFile(path.join(INPUT_DIR, filename), await streamToBuffer(blob.stream));
  return workerAssetUrl(filename);
}

async function materializeAudioSources(plan, renderId) {
  const audioUrl = plan.audioUrl?.startsWith("data:")
    ? await materializeDataUrlAudio(plan.audioUrl, renderId, "audio")
    : await materializeBlobAudio(plan.audioUrl, renderId, "audio");
  const musicUrl = plan.musicUrl?.startsWith("data:")
    ? await materializeDataUrlAudio(plan.musicUrl, renderId, "music")
    : await materializeBlobAudio(plan.musicUrl, renderId, "music");

  return { ...plan, audioUrl, musicUrl };
}

async function runRender(renderId, plan) {
  const outputFile = path.join(OUTPUT_DIR, `${renderId}.mp4`);
  const inputFiles = [
    path.join(INPUT_DIR, `${renderId}-audio.wav`),
    path.join(INPUT_DIR, `${renderId}-audio.mp3`),
    path.join(INPUT_DIR, `${renderId}-audio.m4a`),
    path.join(INPUT_DIR, `${renderId}-audio.ogg`),
    path.join(INPUT_DIR, `${renderId}-audio.audio`),
    path.join(INPUT_DIR, `${renderId}-music.wav`),
    path.join(INPUT_DIR, `${renderId}-music.mp3`),
    path.join(INPUT_DIR, `${renderId}-music.m4a`),
    path.join(INPUT_DIR, `${renderId}-music.ogg`),
    path.join(INPUT_DIR, `${renderId}-music.audio`),
  ];

  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await stat(REMOTION_BUNDLE_DIR);
    const renderPlan = await materializeAudioSources(plan, renderId);

    updateRender(renderId, {
      overallProgress: 0.05,
      stage: "selecting-composition",
    });

    const composition = await selectComposition({
      serveUrl: REMOTION_BUNDLE_DIR,
      id: COMPOSITION_ID,
      inputProps: renderPlan,
      logLevel: "info",
      timeoutInMilliseconds: RENDER_TIMEOUT_MS,
      chromeMode: "headless-shell",
    });

    await renderMedia({
      serveUrl: REMOTION_BUNDLE_DIR,
      composition,
      inputProps: renderPlan,
      codec: "h264",
      concurrency: RENDER_CONCURRENCY,
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
    await Promise.all(inputFiles.map((file) => rm(file, { force: true }))).catch(
      () => undefined,
    );
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
    if (request.method === "GET" && request.url?.startsWith("/worker-assets/")) {
      const filename = decodeURIComponent(request.url.slice("/worker-assets/".length));

      if (filename.includes("/") || filename.includes("\\")) {
        sendJson(response, 400, { error: "Invalid worker asset path." });
        return;
      }

      const filePath = path.join(INPUT_DIR, filename);
      const contentType = filename.endsWith(".wav")
        ? "audio/wav"
        : filename.endsWith(".mp3")
          ? "audio/mpeg"
          : filename.endsWith(".m4a")
            ? "audio/mp4"
            : filename.endsWith(".ogg")
              ? "audio/ogg"
              : "application/octet-stream";

      sendStream(response, createReadStream(filePath), contentType);
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (!isAuthorized(request)) {
      sendJson(response, 401, { error: "Unauthorized render worker request." });
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
