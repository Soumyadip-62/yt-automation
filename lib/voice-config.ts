export const VOICE_OPTIONS = [
  { name: "Charon", description: "Informative" },
  { name: "Kore", description: "Firm" },
  { name: "Puck", description: "Upbeat" },
  { name: "Aoede", description: "Breezy" },
  { name: "Iapetus", description: "Clear" },
  { name: "Gacrux", description: "Mature" },
  { name: "Sulafat", description: "Warm" },
  { name: "Achird", description: "Friendly" },
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

