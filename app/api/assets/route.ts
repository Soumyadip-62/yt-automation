import type { SceneAsset } from "@/lib/gemini";
import { getAssetsFromNasa } from "@/lib/nasa";
import type { VideoAssets } from "@/types/generatedAssets";

type AssetsRequestBody = {
  sceneAssets?: unknown;
};

function parseSceneAssets(body: AssetsRequestBody): SceneAsset[] {
  if (!Array.isArray(body.sceneAssets)) {
    return [];
  }

  return body.sceneAssets.flatMap((asset) => {
    if (!asset || typeof asset !== "object") {
      return [];
    }

    const sceneAsset = asset as Partial<SceneAsset>;
    const nasaQuery =
      typeof sceneAsset.nasaQuery === "string" ? sceneAsset.nasaQuery : "";
    const query = typeof sceneAsset.query === "string" ? sceneAsset.query : "";
    const type = typeof sceneAsset.type === "string" ? sceneAsset.type : "";

    if (!query.trim() && !nasaQuery.trim()) {
      return [];
    }

    return {
      query: query.trim(),
      nasaQuery: nasaQuery.trim(),
      type: type.trim() || "image",
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssetsRequestBody;
    const assetList: VideoAssets = {
      sceneAssets: parseSceneAssets(body),
    };

    if (assetList.sceneAssets.length === 0) {
      return Response.json(
        { error: "sceneAssets must contain at least one asset query." },
        { status: 400 },
      );
    }

    const assets = await getAssetsFromNasa(assetList);

    return Response.json({ assets });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Unable to fetch assets right now." },
      { status: 500 },
    );
  }
}
