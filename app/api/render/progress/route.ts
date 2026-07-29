import { getRenderProgress } from "@remotion/vercel";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type ProgressRequest = {
  cmdId?: unknown;
  commandId?: unknown;
  renderId?: unknown;
  sandboxId?: unknown;
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

    if (
      typeof body.sandboxId !== "string" ||
      !cmdId ||
      typeof body.renderId !== "string"
    ) {
      return NextResponse.json(
        { error: "Provide render id, sandbox id, and command id." },
        { status: 400 },
      );
    }

    const progress = await getRenderProgress({
      cmdId,
      sandboxId: body.sandboxId,
    });

    if (progress.stage === "done") {
      return NextResponse.json({
        renderId: body.renderId,
        stage: progress.stage,
        videoUrl: progress.url,
      });
    }

    if (progress.stage === "error") {
      return NextResponse.json(
        { error: progress.message, stage: progress.stage },
        { status: 500 },
      );
    }

    return NextResponse.json(progress);
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
