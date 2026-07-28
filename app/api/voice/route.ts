import { NextResponse } from "next/server";
import { generateVoiceover } from "@/lib/voice";
import {
  isVoiceName,
  isVoiceStyle,
  type VoiceName,
  type VoiceStyle,
} from "@/lib/voice-config";

export const runtime = "nodejs";
export const maxDuration = 120;

type VoiceRequest = {
  scenes?: unknown;
  style?: unknown;
  voice?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VoiceRequest;
    const scenes = Array.isArray(body.scenes)
      ? body.scenes.map((scene) =>
          typeof scene === "string" ? scene.trim() : "",
        )
      : [];
    const totalLength = scenes.reduce((total, scene) => total + scene.length, 0);

    if (
      scenes.length === 0 ||
      scenes.length > 20 ||
      scenes.some((scene) => !scene) ||
      totalLength > 10_000 ||
      !isVoiceName(body.voice) ||
      !isVoiceStyle(body.style)
    ) {
      return NextResponse.json(
        { error: "Provide a script, supported voice, and narration style." },
        { status: 400 },
      );
    }

    const result = await generateVoiceover({
      scenes,
      style: body.style as VoiceStyle,
      voice: body.voice as VoiceName,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Voice generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Voice generation failed.",
      },
      { status: 500 },
    );
  }
}
