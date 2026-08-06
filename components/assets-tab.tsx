"use client";

import { useState } from "react";
import { Search, Filter, Check, Eye, ExternalLink, RefreshCw, Sparkles, Layers } from "lucide-react";
import type { Asset, SceneAssetsFromNasa } from "@/lib/nasa";

type AssetsTabProps = {
  error: string;
  isLoading: boolean;
  onSelectAsset: (sceneIndex: number, asset: Asset) => void;
  sceneAssets: SceneAssetsFromNasa[];
  selectedAssetsByScene: Record<number, Asset>;
};

function getAssetLabel(asset: Asset) {
  return asset.mediaType === "video" ? "Video" : "Image";
}

function isSameAsset(left?: Asset, right?: Asset) {
  return Boolean(left && right && left.assetsurl === right.assetsurl);
}

export function AssetsTab({
  error,
  isLoading,
  onSelectAsset,
  sceneAssets,
  selectedAssetsByScene,
}: AssetsTabProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "image" | "video">("all");

  if (isLoading) {
    return (
      <div className="flex flex-1 p-5">
        <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-slate-400">
          <RefreshCw className="animate-spin text-cyan-400" size={24} />
          <p className="text-sm font-semibold">Discovering media assets from NASA library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <p className="rounded-lg border border-red-800/80 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (sceneAssets.length === 0) {
    return (
      <div className="flex flex-1 p-5">
        <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-slate-400">
          Assets will appear here after generating script.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Panel Header & Controls */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="text-cyan-400" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Asset Explorer
            </h2>
          </div>
          <span className="rounded-full border border-cyan-800/60 bg-cyan-950/80 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
            {Object.keys(selectedAssetsByScene).length} / {sceneAssets.length} Selected
          </span>
        </div>

        {/* Filter inputs */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-700/80 bg-slate-950 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value as "all" | "image" | "video")}
            className="h-9 rounded-lg border border-slate-700/80 bg-slate-950 px-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
          </select>
        </div>
      </div>

      {/* Scrollable Asset List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-h-[calc(100vh-220px)] custom-scrollbar">
        {sceneAssets.map((sceneAsset, sceneIndex) => {
          const filteredAssets = sceneAsset.assets.filter((asset) => {
            const matchesQuery =
              !searchFilter ||
              (asset.title && asset.title.toLowerCase().includes(searchFilter.toLowerCase())) ||
              (asset.description && asset.description.toLowerCase().includes(searchFilter.toLowerCase()));
            const matchesType =
              mediaTypeFilter === "all" || asset.mediaType === mediaTypeFilter;
            return matchesQuery && matchesType;
          });

          return (
            <section
              key={`${sceneAsset.searchQuery}-${sceneIndex}`}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Scene #{sceneIndex + 1} Assets
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Query:{" "}
                    <span className="font-semibold text-cyan-400">
                      {sceneAsset.searchQuery || "Space"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedAssetsByScene[sceneIndex] ? (
                    <span className="rounded border border-emerald-800/80 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Selected
                    </span>
                  ) : (
                    <span className="rounded border border-amber-800/80 bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Select 1 Asset
                    </span>
                  )}
                </div>
              </div>

              {filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredAssets.map((asset) => {
                    const selected = isSameAsset(
                      selectedAssetsByScene[sceneIndex],
                      asset,
                    );

                    return (
                      <article
                        key={`${asset.assetsurl}-${asset.nasaId ?? asset.title ?? ""}`}
                        className={`group relative overflow-hidden rounded-xl border bg-slate-950 transition-all ${
                          selected
                            ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/30"
                            : "border-slate-800/90 hover:border-slate-700"
                        }`}
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                          {asset.mediaType === "video" ? (
                            <video
                              className="size-full object-cover"
                              controls
                              muted
                              preload="metadata"
                              poster={asset.previewUrl}
                              src={asset.assetsurl}
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={asset.title || sceneAsset.searchQuery}
                              className="size-full object-cover transition group-hover:scale-105"
                              loading="lazy"
                              src={asset.assetsurl}
                            />
                          )}

                          {/* Media Type & Provider Badges */}
                          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                            <span className="rounded bg-slate-900/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-slate-200 border border-slate-700">
                              {getAssetLabel(asset)}
                            </span>
                            <span className="rounded bg-cyan-950/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-cyan-300 border border-cyan-800">
                              {asset.provider || "NASA"}
                            </span>
                          </div>

                          {selected && (
                            <div className="absolute right-2 top-2 rounded-full bg-emerald-500 p-1 text-slate-950 shadow">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 p-3">
                          <h4 className="line-clamp-1 text-xs font-semibold text-slate-100" title={asset.title || ""}>
                            {asset.title || "NASA Media Asset"}
                          </h4>

                          {asset.description && (
                            <p className="line-clamp-2 text-[11px] leading-snug text-slate-400">
                              {asset.description}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectAsset(sceneIndex, asset)}
                            className={`mt-1 flex h-8.5 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold whitespace-nowrap transition ${
                              selected
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "bg-cyan-600 text-white hover:bg-cyan-500"
                            }`}
                          >
                            {selected ? (
                              <>
                                <Check size={13} /> Selected for Scene #{sceneIndex + 1}
                              </>
                            ) : (
                              "Use for Scene #" + (sceneIndex + 1)
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950 p-4 text-center text-xs text-slate-400">
                  No matching assets for filter.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
