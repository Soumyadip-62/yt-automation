"use client";

import { useState } from "react";
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
  onSelectAsset: (sceneIndex: number, asset: Asset) => void;
  selectedAssetsByScene: Record<number, Asset>;
};

export function GeneratedResponse({
  assetError,
  assets,
  data,
  isAssetLoading,
  isLoading,
  onSelectAsset,
  selectedAssetsByScene,
}: GeneratedResponseProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>("script");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <section
      aria-live="polite"
      className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-5 py-4">
        <h2 className="text-lg font-semibold">Generated response</h2>
        <span className="rounded-md border border-cyan-100 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
          Gemini
        </span>
      </div>

      {data ? (
        <div className="flex flex-1 flex-col">
          <ResponseTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex-1 bg-white">
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
          <div className="flex w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            {isLoading
              ? "Generating script..."
              : "Enter a topic and generate your YouTube Shorts script."}
          </div>
        </div>
      )}
    </section>
  );
}
