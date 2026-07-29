import { NextResponse } from "next/server";
import { getLocalRenderProgress } from "@/lib/render/local-render-jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

type ProgressRequest = {
  cmdId?: unknown;
  commandId?: unknown;
  renderId?: unknown;
};

export async function POST(request: Request) {
  try {
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

    const progress = getLocalRenderProgress({ cmdId, renderId: body.renderId });

    if (!progress) {
      return NextResponse.json(
        { error: "Render progress not found.", stage: "error" },
        { status: 404 },
      );
    }

    return NextResponse.json(progress, {
      status: progress.stage === "error" ? 500 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not read render progress.",
        stage: "error",
      },
      { status: 500 },
    );
  }
}
