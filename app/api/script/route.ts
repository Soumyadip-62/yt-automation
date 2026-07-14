import { generateScript } from "@/lib/gemini";
import type { SceneAsset } from "@/lib/gemini";
import { getAssetsFromNasa } from "@/lib/nasa";
import type { SceneAssetsFromNasa } from "@/lib/nasa";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { topic?: unknown };
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";

    if (!topic) {
      return Response.json({ error: "Topic is required." }, { status: 400 });
    }

    if (topic.length > 200) {
      return Response.json(
        { error: "Topic must be 200 characters or fewer." },
        { status: 400 },
      );
    }

    const result = await generateScript(topic);
    const sceneAssets: SceneAsset[] = result.scenebreakdown.scenes.flatMap(
      (scene) => (scene.asset?.query || scene.asset?.nasaQuery ? [scene.asset] : []),
    );
    let generatedAssets: SceneAssetsFromNasa[] = [];

    try {
      generatedAssets = await getAssetsFromNasa({ sceneAssets });
    } catch (assetError) {
      console.error("Failed to fetch NASA scene assets:", assetError);
    }

    return Response.json({
      ...result,
      generatedAssets,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Unable to generate script right now." },
      { status: 500 },
    );
  }
}
