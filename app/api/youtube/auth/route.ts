import { NextResponse } from "next/server";
import { createYoutubeAuthUrl } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const origin = new URL(request.url).origin;

    return NextResponse.json({ authUrl: createYoutubeAuthUrl(origin) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not start YouTube auth.",
      },
      { status: 500 },
    );
  }
}
