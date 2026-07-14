"use client";

import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { GeneratedResponse } from "@/components/generated-response";
import { generateScriptRequest } from "@/lib/api/script";
import Header from "@/components/header";
import { getAssetsRequestFromSceneAssets } from "@/lib/api/assets";
import type { Asset } from "@/lib/nasa";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const [selectedAssetsByScene, setSelectedAssetsByScene] = useState<
    Record<number, Asset>
  >({});
  const assetMutation = useMutation({
    mutationFn: getAssetsRequestFromSceneAssets,
  });
  const scriptMutation = useMutation({
    mutationFn: generateScriptRequest,
    onSuccess: (data) => {
      const sceneAssets = data.scenebreakdown.scenes
        .map((scene) => scene.asset)
        .filter((asset) => asset?.query || asset?.nasaQuery);

      assetMutation.reset();
      setSelectedAssetsByScene({});

      if (sceneAssets.length > 0) {
        assetMutation.mutate(sceneAssets);
      }
    },
  });
  const scriptData = scriptMutation.data ?? null;
  const isLoading = scriptMutation.isPending;
  const requestError =
    scriptMutation.error instanceof Error
      ? scriptMutation.error.message
      : "Script generation failed.";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError("Enter a topic first.");
      scriptMutation.reset();
      assetMutation.reset();
      setSelectedAssetsByScene({});
      return;
    }

    setError("");
    assetMutation.reset();
    setSelectedAssetsByScene({});
    scriptMutation.mutate(trimmedTopic);
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <Header />

        <div className="grid flex-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleSubmit}
            className="flex h-fit flex-col gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <label
                htmlFor="topic"
                className="text-sm font-semibold text-slate-800"
              >
                Video topic
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Black holes, moon landing myths, AI tools for creators..."
                className="mt-3 min-h-36 w-full resize-none rounded-md border border-slate-300 bg-white px-4 py-3 text-base leading-7 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            {error || scriptMutation.isError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error || requestError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 cursor-pointer rounded-md bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? "Generating..." : "Generate script"}
            </button>
          </form>

          <GeneratedResponse
            assetError={
              assetMutation.error instanceof Error
                ? assetMutation.error.message
                : ""
            }
            assets={assetMutation.data ?? []}
            data={scriptData}
            isAssetLoading={assetMutation.isPending}
            isLoading={isLoading}
            onSelectAsset={(sceneIndex, asset) =>
              setSelectedAssetsByScene((current) => ({
                ...current,
                [sceneIndex]: asset,
              }))
            }
            selectedAssetsByScene={selectedAssetsByScene}
          />
        </div>
      </section>
    </main>
  );
}
