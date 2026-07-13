import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateScript(topic: string) {
  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `Write a 30-second YouTube Shorts script about ${topic}. With hastags`,
  });

  return response.text!;
}

// generateScript("Dwarf stars");
