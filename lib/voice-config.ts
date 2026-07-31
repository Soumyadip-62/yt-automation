export const VOICE_OPTIONS = [
  { name: "Charon", description: "Informative" },
  { name: "Kore", description: "Firm" },
  { name: "Puck", description: "Upbeat" },
  { name: "Aoede", description: "Breezy" },
  { name: "Iapetus", description: "Clear" },
  { name: "Gacrux", description: "Mature" },
  { name: "Sulafat", description: "Warm" },
  { name: "Achird", description: "Friendly" },
  // ➕ You can add more supported Gemini voices here:
  { name: "Fenrir", description: "Deep" },
  { name: "Zephyr", description: "Calm" },
  { name: "Orpheus", description: "Narrative" },
] as const;

export const VOICE_STYLES = [
  "Documentary",
  "Energetic",
  "Calm",
  "Dramatic",
] as const;

export type VoiceName = (typeof VOICE_OPTIONS)[number]["name"];
export type VoiceStyle = (typeof VOICE_STYLES)[number];

export function isVoiceName(value: unknown): value is VoiceName {
  return VOICE_OPTIONS.some((voice) => voice.name === value);
}

export function isVoiceStyle(value: unknown): value is VoiceStyle {
  return VOICE_STYLES.some((style) => style === value);
}

export const VOICE_SPEEDS = [
  { label: "Slow (0.85x)", value: "slow", prompt: "Speak at a slow, deliberate, calm pace." },
  { label: "Normal (1.0x)", value: "normal", prompt: "Speak at a natural, standard pace." },
  { label: "Fast (1.15x)", value: "fast", prompt: "Speak at a brisk, energetic, fast pace for YouTube Shorts." },
  { label: "Very Fast (1.3x)", value: "very-fast", prompt: "Speak at a rapid-fire, extra fast pace." },
] as const;

export type VoiceSpeed = (typeof VOICE_SPEEDS)[number]["value"];

export function isVoiceSpeed(value: unknown): value is VoiceSpeed {
  return VOICE_SPEEDS.some((speed) => speed.value === value);
}

export function getVoiceSpeedPrompt(speed?: VoiceSpeed): string {
  const match = VOICE_SPEEDS.find((option) => option.value === speed);
  return match?.prompt ?? VOICE_SPEEDS[1].prompt;
}

