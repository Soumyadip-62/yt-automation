import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const soundsDir = path.join(process.cwd(), "assets", "sounds");

    if (!fs.existsSync(soundsDir)) {
      return NextResponse.json({ sounds: [] });
    }

    const files = fs.readdirSync(soundsDir).filter((file) =>
      /\.(mp3|wav|ogg|m4a|aac)$/i.test(file),
    );

    const publicSoundsDir = path.join(process.cwd(), "public", "sounds");
    if (!fs.existsSync(publicSoundsDir)) {
      fs.mkdirSync(publicSoundsDir, { recursive: true });
    }

    const sounds = files.map((file) => {
      const srcPath = path.join(soundsDir, file);
      const destPath = path.join(publicSoundsDir, file);

      try {
        if (
          !fs.existsSync(destPath) ||
          fs.statSync(srcPath).mtimeMs > fs.statSync(destPath).mtimeMs
        ) {
          fs.copyFileSync(srcPath, destPath);
        }
      } catch (err) {
        console.error(`Failed to copy ${file} to public/sounds:`, err);
      }

      const name = file
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      return {
        filename: file,
        name,
        url: `/sounds/${encodeURIComponent(file)}`,
      };
    });

    return NextResponse.json({ sounds });
  } catch (error) {
    console.error("Failed to list sounds:", error);
    return NextResponse.json(
      { error: "Failed to list background sounds." },
      { status: 500 },
    );
  }
}
