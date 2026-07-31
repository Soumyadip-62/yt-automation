import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const assetsPath = path.join(process.cwd(), "assets", "closing_video.mp4");
    const publicPath = path.join(process.cwd(), "public", "closing_video.mp4");

    const filePath = fs.existsSync(assetsPath)
      ? assetsPath
      : fs.existsSync(publicPath)
        ? publicPath
        : null;

    if (!filePath) {
      return NextResponse.json({ error: "Closing video not found." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileBuffer.length.toString(),
        "Content-Type": "video/mp4",
      },
    });
  } catch (error) {
    console.error("Failed to serve closing video:", error);
    return NextResponse.json(
      { error: "Failed to serve closing video." },
      { status: 500 },
    );
  }
}
