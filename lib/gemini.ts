import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export interface VideoMetadata {
  title: string;
  description: string;
  hashtags: string[];
}

export interface SceneAsset {
  type: string;
  nasaQuery: string;
  query: string;
}

export interface Scene {
  duration: number;
  narration: string;
  asset: SceneAsset;
  caption: string;
  animation: string;
}

export interface SceneBreakdown {
  title: string;
  hook: string;
  scenes: Scene[];
}

export interface ScriptResponse {
  script: string;
  metadata: VideoMetadata;
  scenebreakdown: SceneBreakdown;
}

export async function generateScript(topic: string): Promise<ScriptResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `You are a professional YouTube Shorts scriptwriter.

Topic: ${topic}

Write ONLY the narration for a 30-40 second YouTube Short.

Requirements:
- Hook the viewer in the first sentence.
- Build curiosity throughout.
- Use conversational English, as if speaking directly to the viewer.
- Short sentences.
- Maximum 100 words.
- End with an interesting fact or question.
- Do NOT add headings.
- Do NOT add stage directions.
- Do NOT add hashtags.
- Output ONLY the narration.`,
  });

  const script = response.text!;

  const metadataResponse = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `Based on this script:
${script}

Generate the video metadata including:
- A catchy title
- A short description
- 10 hashtags

Return a JSON object with the following structure:
{
  "title": "string (catchy video title)",
  "description": "string (engaging description)",
  "hashtags": ["array of 10 hashtags starting with #"]
}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  let metadata: VideoMetadata = { title: "", description: "", hashtags: [] };
  try {
    if (metadataResponse.text) {
      metadata = JSON.parse(metadataResponse.text) as VideoMetadata;
    }
  } catch (e) {
    console.error("Failed to parse metadata JSON:", e, metadataResponse.text);
  }

  const scenebreakdownResponse = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `Based on this script:
${script}

Create a scene-by-scene breakdown for YouTube Shorts/Reels.
Each scene should be 3-5 seconds.
For each asset, include both:
- query: an image/video generation prompt with useful visual detail.
- nasaQuery: NASA image/video library search keywords.
For nasaQuery, use 2-5 plain searchable words like object names, mission names, planets, galaxies, nebulae, astronauts, rockets, spacecraft, Earth views, or telescope names.
Do NOT use words like realistic, cinematic, dramatic, style, background, render, animation, illustration, 4k, or NASA style in nasaQuery.

Return a JSON object matching this example format:
{
  "title": "What Happens Inside a Black Hole?",
  "hook": "Cross this line... and there's no coming back.",
  "scenes": [
    {
      "duration": 4,
      "narration": "Imagine falling into a black hole.",
      "asset": {
        "type": "image",
        "query": "realistic black hole in deep space with glowing accretion disk, high contrast",
        "nasaQuery": "black hole"
      },
      "caption": "BLACK HOLE",
      "animation": "zoom"
    },
    {
      "duration": 5,
      "narration": "Its gravity is so strong that even light cannot escape.",
      "asset": {
        "type": "image",
        "query": "dramatic close-up of a black hole accretion disk bending light in space",
        "nasaQuery": "black hole accretion disk"
      },
      "caption": "LIGHT CAN'T ESCAPE",
      "animation": "parallax"
    }
  ]
}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  let scenebreakdown: SceneBreakdown = { title: "", hook: "", scenes: [] };
  try {
    if (scenebreakdownResponse.text) {
      scenebreakdown = JSON.parse(
        scenebreakdownResponse.text,
      ) as SceneBreakdown;
    }
  } catch (e) {
    console.error(
      "Failed to parse scenebreakdown JSON:",
      e,
      scenebreakdownResponse.text,
    );
  }

  return {
    script,
    metadata,
    scenebreakdown,
  };
}
