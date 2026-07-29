import { randomUUID } from "node:crypto";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { COMPOSITION_ID } from "@/remotion/constants";
import type { RenderPlan } from "@/types/render-plan";

const REMOTION_BUNDLE_DIR = path.join(process.cwd(), ".remotion-bundle");
const OUTPUT_DIR = path.join(process.cwd(), "public", "renders");
const RENDER_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS || 10 * 60 * 1000);
const RENDER_CONCURRENCY = Math.max(
  1,
  Number(process.env.REMOTION_RENDER_CONCURRENCY || 2),
);

export type LocalRenderProgress = {
  cmdId: string;
  error?: string;
  overallProgress: number;
  renderId: string;
  sandboxId: "local";
  stage: string;
  videoUrl?: string;
};

const jobs = new Map<string, LocalRenderProgress>();

function setJob(renderId: string, patch: Partial<LocalRenderProgress>) {
  const current = jobs.get(renderId);
  if (!current) return;
  jobs.set(renderId, { ...current, ...patch });
}

async function runLocalRender(renderId: string, plan: RenderPlan) {
  const outputLocation = path.join(OUTPUT_DIR, `${renderId}.mp4`);

  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await stat(REMOTION_BUNDLE_DIR);
    const { renderMedia, selectComposition } = await import("@remotion/renderer");

    setJob(renderId, {
      overallProgress: 0.05,
      stage: "selecting-composition",
    });

    const composition = await selectComposition({
      chromeMode: "headless-shell",
      id: COMPOSITION_ID,
      inputProps: plan,
      logLevel: "info",
      serveUrl: REMOTION_BUNDLE_DIR,
      timeoutInMilliseconds: RENDER_TIMEOUT_MS,
    });

    await renderMedia({
      chromeMode: "headless-shell",
      codec: "h264",
      composition,
      concurrency: RENDER_CONCURRENCY,
      inputProps: plan,
      logLevel: "info",
      onProgress: (progress) => {
        setJob(renderId, {
          overallProgress: 0.05 + progress.progress * 0.9,
          stage: "render-progress",
        });
      },
      outputLocation,
      overwrite: true,
      serveUrl: REMOTION_BUNDLE_DIR,
      timeoutInMilliseconds: RENDER_TIMEOUT_MS,
    });

    setJob(renderId, {
      overallProgress: 1,
      stage: "done",
      videoUrl: `/renders/${renderId}.mp4`,
    });
  } catch (error) {
    setJob(renderId, {
      error: error instanceof Error ? error.message : "Video render failed.",
      overallProgress: 1,
      stage: "error",
    });
  }
}

export function startLocalRender(plan: RenderPlan) {
  const renderId = randomUUID();
  const job: LocalRenderProgress = {
    cmdId: renderId,
    overallProgress: 0,
    renderId,
    sandboxId: "local",
    stage: "queued",
  };

  jobs.set(renderId, job);
  void runLocalRender(renderId, plan);

  return {
    cmdId: renderId,
    renderId,
    sandboxId: "local",
  };
}

export function getLocalRenderProgress({
  cmdId,
  renderId,
}: {
  cmdId: string;
  renderId: string;
}) {
  const job = jobs.get(renderId);
  if (!job || job.cmdId !== cmdId) {
    return null;
  }

  return job;
}
