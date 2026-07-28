import type { SceneAsset } from "@/lib/gemini";
import { readApiResponse } from "@/lib/api/read-api-response";
import type { SceneAssetsFromNasa } from "@/lib/nasa";
import type { VideoAssets } from "@/types/generatedAssets";

type AssetsResponse = {
  assets: SceneAssetsFromNasa[];
};

type AssetsErrorResponse = {
  error?: string;
};

export async function getAssetsRequest(assetList: VideoAssets) {
  const response = await fetch("/api/assets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(assetList),
  });

  const data = await readApiResponse<AssetsResponse | AssetsErrorResponse>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      "error" in data && data.error ? data.error : "Asset lookup failed.",
    );
  }

  if ("assets" in data && Array.isArray(data.assets)) {
    return data.assets;
  }

  throw new Error("Invalid asset response format received from server.");
}

export function getAssetsRequestFromSceneAssets(sceneAssets: SceneAsset[]) {
  return getAssetsRequest({ sceneAssets });
}
