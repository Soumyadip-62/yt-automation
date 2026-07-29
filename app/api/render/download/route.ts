import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const range = request.headers.get("range");

  if (!url) {
    return NextResponse.json({ error: "Provide Blob URL." }, { status: 400 });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    return NextResponse.json(
      { error: "Set BLOB_READ_WRITE_TOKEN to download rendered videos." },
      { status: 500 },
    );
  }

  const blob = await get(url, {
    access: process.env.BLOB_ACCESS === "public" ? "public" : "private",
    headers: range ? { range } : undefined,
    token: blobToken,
  });

  if (!blob?.stream) {
    return NextResponse.json({ error: "Rendered video not found." }, { status: 404 });
  }

  const headers = new Headers();
  blob.headers.forEach((value, key) => headers.set(key, value));
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Disposition", "inline");
  headers.set("Content-Type", blob.blob.contentType || "video/mp4");

  return new Response(blob.stream, {
    headers,
    status: range && headers.has("content-range") ? 206 : 200,
  });
}
