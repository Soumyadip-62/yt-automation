import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const RENDER_WORKER_URL = process.env.RENDER_WORKER_URL?.replace(/\/$/, "");

type ProgressRequest = {
  cmdId?: unknown;
  commandId?: unknown;
  renderId?: unknown;
  sandboxId?: unknown;
};

type RenderProgress = {
  contentType?: string;
  error?: string;
  message?: string;
  overallProgress?: number;
  renderId?: string;
  stage: string;
  url?: string;
  videoUrl?: string;
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

function withDownloadProxy(progress: RenderProgress, renderId: string) {
  if (progress.stage !== "done") {
    return progress;
  }

  const videoUrl = progress.videoUrl ?? progress.url;
  if (!videoUrl) {
    return progress;
  }

  return {
    ...progress,
    renderId,
    videoUrl:
      process.env.BLOB_ACCESS === "public"
        ? videoUrl
        : `/api/render/download?url=${encodeURIComponent(videoUrl)}`,
  };
}

export async function POST(request: Request) {
  try {
    if (!RENDER_WORKER_URL) {
      return NextResponse.json(
        { error: "Set RENDER_WORKER_URL to use the render worker." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as ProgressRequest;
    const cmdId =
      typeof body.cmdId === "string"
        ? body.cmdId
        : typeof body.commandId === "string"
          ? body.commandId
          : "";

    if (!cmdId || typeof body.renderId !== "string") {
      return NextResponse.json(
        { error: "Provide render id and command id." },
        { status: 400 },
      );
    }

    const response = await fetch(`${RENDER_WORKER_URL}/render/progress`, {
      body: JSON.stringify(body),
      headers: getWorkerHeaders(),
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({
      error: "Render worker returned an invalid response.",
      stage: "error",
    }))) as RenderProgress;

    if (response.ok) {
      return NextResponse.json(withDownloadProxy(payload, body.renderId), {
        status: response.status,
      });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not read render progress.",
      },
      { status: 500 },
    );
  }
}
