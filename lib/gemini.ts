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
  const scriptResponse = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `You are a world-class science communicator and viral YouTube Shorts scriptwriter (style: Kurzgesagt / Neil deGrasse Tyson).

Topic: ${topic}

Write narration for a 30-40 second viral YouTube Short about this space/science topic.

STRICT WRITING RULES:
- HOOK (First 3 seconds / 1st sentence): Use a pattern interrupt or mind-bending question/fact. Instantly grab attention.
- BODY: Fast-paced, awe-inspiring, high-energy storytelling. Use simple conversational English.
- LENGTH: Exactly 70 to 90 words total.
- ENDING: End on a fascinating mystery, cliffhanger, or thought-provoking question.
- CONSTRAINTS: Output ONLY the spoken narration text. No stage directions, no headings, no quotes, no hashtags, no meta commentary.`,
  });

  const script = scriptResponse.text?.trim() || "";

  const metadataResponse = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `You are an expert YouTube SEO and viral metadata strategist.

Based on this YouTube Short script:
"""
${script}
"""

Generate optimized video metadata.

Requirements:
- title: A high-CTR, punchy title under 50 characters including 1-2 relevant space/science or emotions emojis (e.g. "What's Inside a Black Hole? 🕳️✨").
- description: A short, engaging 2-sentence summary with a call to subscribe/comment.
- hashtags: Exactly 10 high-volume space/astronomy/science hashtags starting with "#".

Return JSON matching this schema:
{
  "title": "string",
  "description": "string",
  "hashtags": ["string"]
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
    contents: `You are an expert visual director for cinematic space documentaries and YouTube Shorts.

Based on this script narration:
"""
${script}
"""

Break the script down into a sequence of visual scenes for rendering.

RULES FOR SCENES:
- Divide the complete script narration across 6 to 8 sequential scenes. Every single word of narration must be accounted for across the scenes.
- Duration: Each scene must be 3 to 5 seconds long.
- asset.type: "image" or "video".
- asset.nasaQuery: 2 to 4 plain, precise searchable NASA keywords (e.g., "James Webb Carina Nebula", "Jupiter Great Red Spot", "Apollo 11 Saturn V", "Mars Curiosity Rover", "International Space Station", "Black Hole Accretion"). NEVER include words like "cinematic", "4k", "dramatic", "render", or "illustration" in nasaQuery.
- asset.query: A detailed visual prompt for generative AI (e.g., "cinematic ultra-realistic view of a supermassive black hole bending space-time with glowing accretion disk, cosmic dust, photorealistic 8k").
- caption: 2 to 4 words in ALL CAPS summarizing key phrase for screen text overlays.
- animation: One of ["zoom", "parallax", "pan-left", "pan-right", "fade"].

Return JSON format matching this structure:
{
  "title": "${metadata.title || topic}",
  "hook": "First sentence of narration",
  "scenes": [
    {
      "duration": 4,
      "narration": "exact portion of script spoken during this scene",
      "asset": {
        "type": "image",
        "query": "detailed visual prompt",
        "nasaQuery": "precise NASA search keywords"
      },
      "caption": "SHORT BOLD CAPTION",
      "animation": "zoom"
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
