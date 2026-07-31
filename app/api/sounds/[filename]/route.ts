import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    const safeFilename = path.basename(decodeURIComponent(filename));
    const filePath = path.join(process.cwd(), "assets", "sounds", safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Sound file not found." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType =
      ext === ".wav"
        ? "audio/wav"
        : ext === ".ogg"
          ? "audio/ogg"
          : ext === ".m4a" || ext === ".aac"
            ? "audio/mp4"
            : "audio/mpeg";

    return new NextResponse(fileBuffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileBuffer.length.toString(),
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Failed to serve sound file:", error);
    return NextResponse.json(
      { error: "Failed to serve sound file." },
      { status: 500 },
    );
  }
}
