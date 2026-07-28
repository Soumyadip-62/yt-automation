import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getRenderedVideoPath } from "@/lib/rendered-video";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    renderId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { renderId } = await context.params;
    const video = await readFile(getRenderedVideoPath(renderId));

    return new NextResponse(video, {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${renderId}.mp4"`,
        "Content-Type": "video/mp4",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Rendered video not found.",
      },
      { status: 404 },
    );
  }
}
