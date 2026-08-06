"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { AssetsTab } from "@/components/assets-tab";
import { MetadataTab } from "@/components/metadata-tab";
import { ResponseTabs, type ResponseTab } from "@/components/response-tabs";
import { ScenesTab } from "@/components/scenes-tab";
import { ScriptTab } from "@/components/script-tab";
import type { ScriptResponse } from "@/lib/gemini";
import type { Asset, SceneAssetsFromNasa } from "@/lib/nasa";

type GeneratedResponseProps = {
  assetError: string;
  assets: SceneAssetsFromNasa[];
  data: ScriptResponse | null;
  isAssetLoading: boolean;
  isLoading: boolean;
  onEditVideo: () => void;
  onSelectAsset: (sceneIndex: number, asset: Asset) => void;
  selectedAssetsByScene: Record<number, Asset>;
};

export function GeneratedResponse({
  assetError,
  assets,
  data,
  isAssetLoading,
  isLoading,
  onEditVideo,
  onSelectAsset,
  selectedAssetsByScene,
}: GeneratedResponseProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>("script");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const selectedAssetCount = Object.keys(selectedAssetsByScene).length;
  const sceneCount = data?.scenebreakdown.scenes.length ?? 0;
  const canEditVideo = sceneCount > 0 && selectedAssetCount === sceneCount;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <section
      aria-live="polite"
      className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-slate-950/50 backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-100">Generated response</h2>
        <div className="flex items-center gap-2">
          {data ? (
            <button
              type="button"
              disabled={!canEditVideo}
              onClick={onEditVideo}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              title={
                canEditVideo
                  ? "Open video editor"
                  : `Select assets for ${sceneCount - selectedAssetCount} more scenes`
              }
            >
              <Film aria-hidden="true" size={16} />
              Edit &amp; render
            </button>
          ) : null}
          <span className="rounded-lg border border-cyan-800/80 bg-cyan-950/60 px-3 py-1 text-sm font-medium text-cyan-300">
            Gemini
          </span>
        </div>
      </div>

      {data ? (
        <div className="flex flex-1 flex-col">
          <ResponseTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex-1 bg-slate-900/60">
            {activeTab === "script" ? (
              <ScriptTab
                copiedField={copiedField}
                onCopy={copyToClipboard}
                script={data.script}
                scenebreakdown={data.scenebreakdown}
              />
            ) : null}

            {activeTab === "metadata" ? (
              <MetadataTab
                copiedField={copiedField}
                metadata={data.metadata}
                onCopy={copyToClipboard}
              />
            ) : null}

            {activeTab === "scenes" ? (
              <ScenesTab scenebreakdown={data.scenebreakdown} />
            ) : null}

            {activeTab === "assets" ? (
              <AssetsTab
                error={assetError}
                isLoading={isAssetLoading}
                onSelectAsset={onSelectAsset}
                sceneAssets={assets}
                selectedAssetsByScene={selectedAssetsByScene}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 p-5">
          <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-slate-400">
            {isLoading
              ? "Generating script..."
              : "Enter a topic and generate your YouTube Shorts script."}
          </div>
        </div>
      )}
    </section>
  );
}
