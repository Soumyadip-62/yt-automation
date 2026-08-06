"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Film,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Captions,
  RefreshCw,
  Eye,
} from "lucide-react";
import type { Scene } from "@/lib/gemini";
import type { Asset } from "@/lib/nasa";
import type { SceneMotion, AssetFit } from "@/types/render-plan";

type SceneCardProps = {
  scene: Scene;
  sceneIndex: number;
  totalScenes: number;
  selectedAsset?: Asset;
  duration?: number;
  motion?: SceneMotion;
  fit?: AssetFit;
  captionEnabled?: boolean;
  onUpdateScene?: (patch: Partial<Scene & { duration?: number; motion?: SceneMotion; fit?: AssetFit; captionEnabled?: boolean }>) => void;
  onMoveScene?: (direction: -1 | 1) => void;
  onOpenAssetSelector?: () => void;
  onPreviewAsset?: (asset: Asset) => void;
};

const motionOptions: Array<{ label: string; value: SceneMotion }> = [
  { label: "None", value: "none" },
  { label: "Zoom In", value: "zoom-in" },
  { label: "Zoom Out", value: "zoom-out" },
  { label: "Pan Left", value: "pan-left" },
];

export function SceneCard({
  scene,
  sceneIndex,
  totalScenes,
  selectedAsset,
  duration = 4,
  motion = "none",
  fit = "cover",
  captionEnabled = true,
  onUpdateScene,
  onMoveScene,
  onOpenAssetSelector,
  onPreviewAsset,
}: SceneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const queryText = scene.asset?.query || scene.asset?.nasaQuery || "Space";

  return (
    <article
      className={`rounded-xl border transition-all ${
        selectedAsset
          ? "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          : "border-amber-800/60 bg-amber-950/10 hover:border-amber-700/80"
      }`}
    >
      {/* Header bar of scene card */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-950 font-bold text-cyan-400 text-xs border border-cyan-800/80">
            #{sceneIndex + 1}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-100" title={scene.narration}>
              {scene.narration}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span>{duration}s duration</span>
              <span>•</span>
              <span className="capitalize text-cyan-400">{motion !== "none" ? motion : "Static"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedAsset ? (
            <div className="flex items-center gap-2">
              {onPreviewAsset && (
                <button
                  type="button"
                  onClick={() => onPreviewAsset(selectedAsset)}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  <Eye size={13} /> Preview
                </button>
              )}
              <span className="rounded-lg border border-emerald-800/80 bg-emerald-950/80 px-2.5 py-1 text-xs font-semibold text-emerald-300 whitespace-nowrap">
                Asset Selected
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAssetSelector}
              className="flex items-center gap-1.5 rounded-lg border border-amber-800/80 bg-amber-950/80 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-900 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw size={13} /> Select Asset
            </button>
          )}

          {onMoveScene && (
            <div className="flex gap-1">
              <button
                type="button"
                disabled={sceneIndex === 0}
                onClick={() => onMoveScene(-1)}
                className="flex size-7 items-center justify-center rounded border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Move scene up"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                disabled={sceneIndex === totalScenes - 1}
                onClick={() => onMoveScene(1)}
                className="flex size-7 items-center justify-center rounded border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Move scene down"
              >
                <ArrowDown size={13} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Selected Asset Row Summary */}
      {selectedAsset && (
        <div className="flex items-center gap-3 border-t border-slate-800/60 bg-slate-950/40 px-4 py-2 text-xs">
          <div className="size-10 shrink-0 overflow-hidden rounded border border-slate-800 bg-slate-950">
            {selectedAsset.mediaType === "video" ? (
              <video
                muted
                className="size-full object-cover"
                poster={selectedAsset.previewUrl}
                src={selectedAsset.assetsurl}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="size-full object-cover"
                src={selectedAsset.assetsurl}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-200">
              {selectedAsset.title || "Selected Media Asset"}
            </p>
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">
              {selectedAsset.provider || "NASA"} • {selectedAsset.mediaType}
            </span>
          </div>
          {onOpenAssetSelector && (
            <button
              type="button"
              onClick={onOpenAssetSelector}
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Replace Asset
            </button>
          )}
        </div>
      )}

      {/* Expanded Controls & Data */}
      {isExpanded && (
        <div className="flex flex-col gap-4 border-t border-slate-800 p-4 bg-slate-950/60">
          <div>
            <label className="text-xs font-semibold text-slate-400">Narration Script</label>
            <textarea
              rows={2}
              value={scene.narration}
              onChange={(e) => onUpdateScene?.({ narration: e.target.value })}
              className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-100 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold text-slate-400">Visual Prompt</span>
              <p className="mt-1 rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs text-slate-300">
                {scene.asset?.query || "Dynamic visual representation of the narration."}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400">Asset Search Query</span>
              <p className="mt-1 rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs font-semibold text-cyan-300">
                {queryText}
              </p>
            </div>
          </div>

          {/* Timing, Motion, Fit settings */}
          <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-slate-800/60">
            <div>
              <label className="text-xs font-semibold text-slate-300">Duration: {duration}s</label>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={duration}
                onChange={(e) => onUpdateScene?.({ duration: Number(e.target.value) })}
                className="mt-2 w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Motion Animation</label>
              <select
                value={motion}
                onChange={(e) => onUpdateScene?.({ motion: e.target.value as SceneMotion })}
                className="mt-1.5 h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
              >
                {motionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Media Fit</label>
              <div className="mt-1.5 grid grid-cols-2 overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                {(["cover", "contain"] as AssetFit[]).map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => onUpdateScene?.({ fit: f })}
                    className={`h-7 text-xs font-semibold capitalize transition ${
                      fit === f
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
