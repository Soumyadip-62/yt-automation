import { GoogleGenAI } from "@google/genai";
import {
  getVoiceSpeedPrompt,
  type VoiceName,
  type VoiceSpeed,
  type VoiceStyle,
} from "@/lib/voice-config";
import type { SceneTiming, WordTiming } from "@/types/render-plan";

const SAMPLE_RATE = 24_000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const TTS_MODEL =
  process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const BYTES_PER_SECOND = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);

function pcmToWav(pcm: Buffer) {
  const header = Buffer.alloc(44);
  const bytesPerSample = BITS_PER_SAMPLE / 8;
  const byteRate = SAMPLE_RATE * CHANNELS * bytesPerSample;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(CHANNELS * bytesPerSample, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

async function generatePcm({
  ai,
  narration,
  speed,
  style,
  voice,
}: {
  ai: GoogleGenAI;
  narration: string;
  speed?: VoiceSpeed;
  style: VoiceStyle;
  voice: VoiceName;
}) {
  const speedPrompt = getVoiceSpeedPrompt(speed);
  const prompt = `Read the transcript exactly as written. Do not add or remove words. Pause briefly between paragraphs.
Voice direction: ${style} educational YouTube Short narration. ${speedPrompt} Clear pronunciation, engaging delivery.

Transcript:
${narration}`;
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
      const data =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!data) {
        throw new Error("Gemini returned no audio data.");
      }

      return Buffer.from(data, "base64");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Voice generation failed.");
}

function getWordWeight(word: string) {
  const punctuationPause = /[.!?]$/.test(word)
    ? 0.8
    : /[,;:]$/.test(word)
      ? 0.35
      : 0;

  return (
    Math.max(1, word.replace(/[^a-zA-Z0-9]/g, "").length * 0.14) +
    punctuationPause
  );
}

function getNarrationWeight(narration: string) {
  return (narration.match(/\S+/g) ?? []).reduce(
    (total, word) => total + getWordWeight(word),
    0,
  );
}

function getWordTimings(
  narration: string,
  sceneIndex: number,
  durationSeconds: number,
): WordTiming[] {
  const words = narration.match(/\S+/g) ?? [];
  if (words.length === 0) return [];

  const weights = words.map(getWordWeight);
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  let cursor = 0;

  return words.map((word, index) => {
    const startSeconds = cursor;
    cursor += (weights[index] / totalWeight) * durationSeconds;
    return {
      endSeconds: Number(cursor.toFixed(3)),
      sceneIndex,
      startSeconds: Number(startSeconds.toFixed(3)),
      word,
    };
  });
}

export async function generateVoiceover({
  scenes,
  speed,
  style,
  voice,
}: {
  scenes: string[];
  speed?: VoiceSpeed;
  style: VoiceStyle;
  voice: VoiceName;
}) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const sceneTimings: SceneTiming[] = [];
  const wordTimings: WordTiming[] = [];
  const narration = scenes.join("\n\n");
  const pcm = await generatePcm({ ai, narration, speed, style, voice });
  const durationSeconds = pcm.length / BYTES_PER_SECOND;
  const sceneWeights = scenes.map(getNarrationWeight);
  const totalWeight = sceneWeights.reduce((total, weight) => total + weight, 0);
  let cursorSeconds = 0;

  for (const [sceneIndex, sceneNarration] of scenes.entries()) {
    const isLastScene = sceneIndex === scenes.length - 1;
    const sceneDuration = isLastScene
      ? durationSeconds - cursorSeconds
      : (sceneWeights[sceneIndex] / totalWeight) * durationSeconds;

    sceneTimings.push({
      durationSeconds: Number(sceneDuration.toFixed(3)),
      sceneIndex,
      startSeconds: Number(cursorSeconds.toFixed(3)),
    });
    wordTimings.push(
      ...getWordTimings(sceneNarration, sceneIndex, sceneDuration),
    );
    cursorSeconds += sceneDuration;
  }

  const wav = pcmToWav(pcm);

  return {
    audioUrl: `data:audio/wav;base64,${wav.toString("base64")}`,
    durationSeconds,
    sceneTimings,
    wordTimings,
  };
}
