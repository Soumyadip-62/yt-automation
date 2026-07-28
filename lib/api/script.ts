import type { ScriptResponse } from "@/lib/gemini";
import { readApiResponse } from "@/lib/api/read-api-response";

type ScriptErrorResponse = {
  error?: string;
};

export async function generateScriptRequest(topic: string) {
  const response = await fetch("/api/script", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic }),
  });

  const data = await readApiResponse<ScriptResponse | ScriptErrorResponse>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      "error" in data && data.error ? data.error : "Script generation failed.",
    );
  }

  if (
    "script" in data &&
    data.script &&
    data.metadata &&
    data.scenebreakdown
  ) {
    return data;
  }

  throw new Error("Invalid response format received from server.");
}
