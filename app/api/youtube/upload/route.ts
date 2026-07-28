import { type NextRequest, NextResponse } from "next/server";
import {
  createYoutubeAuthUrl,
  uploadVideoToYoutube,
  type YoutubePrivacyStatus,
} from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 300;

type UploadRequest = {
  description?: unknown;
  privacyStatus?: unknown;
  tags?: unknown;
  title?: unknown;
  videoUrl?: unknown;
};

function isPrivacyStatus(value: unknown): value is YoutubePrivacyStatus {
  return value === "private" || value === "public" || value === "unlisted";
}

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;

  try {
    const body = (await request.json()) as UploadRequest;

    if (
      typeof body.videoUrl !== "string" ||
      typeof body.title !== "string" ||
      typeof body.description !== "string" ||
      !Array.isArray(body.tags) ||
      !body.tags.every((tag) => typeof tag === "string") ||
      !isPrivacyStatus(body.privacyStatus)
    ) {
      return NextResponse.json(
        { error: "Provide video URL, title, description, tags, and privacy." },
        { status: 400 },
      );
    }

    const result = await uploadVideoToYoutube({
      input: {
        description: body.description,
        privacyStatus: body.privacyStatus,
        tags: body.tags,
        title: body.title,
        videoUrl: body.videoUrl,
      },
      origin,
      tokens: {
        accessToken: request.cookies.get("youtube_access_token")?.value,
        refreshToken: request.cookies.get("youtube_refresh_token")?.value,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not upload to YouTube.";

    if (message.includes("Connect YouTube")) {
      return NextResponse.json(
        { authUrl: createYoutubeAuthUrl(origin), error: message },
        { status: 401 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
