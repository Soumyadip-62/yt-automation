"use client";

import {
  Sparkles,
  Film,
  Upload,
  RotateCcw,
  Volume2,
  Save,
  Check,
} from "lucide-react";
import { useState } from "react";

type StickyActionBarProps = {
  isGeneratingScript?: boolean;
  isGeneratingVoice?: boolean;
  isRendering?: boolean;
  canRender?: boolean;
  hasScript?: boolean;
  hasAudio?: boolean;
  onGenerateScript?: () => void;
  onGenerateVoice?: () => void;
  onRenderVideo?: () => void;
  onUpload?: () => void;
  onReset?: () => void;
  onSave?: () => void;
};

export function StickyActionBar({
  isGeneratingScript = false,
  isGeneratingVoice = false,
  isRendering = false,
  canRender = false,
  hasScript = false,
  hasAudio = false,
  onGenerateScript,
  onGenerateVoice,
  onRenderVideo,
  onUpload,
  onReset,
  onSave,
}: StickyActionBarProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="sticky top-4 z-40 mb-6 w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-xl transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/50">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-cyan-400">
              Studio Actions
            </span>
            <span className="text-xs text-slate-400 hidden sm:block">
              Quick controls for video production pipeline
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGenerateScript && (
            <button
              type="button"
              disabled={isGeneratingScript}
              onClick={onGenerateScript}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200 shadow hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={14} className="text-cyan-400" />
              {isGeneratingScript ? "Generating..." : "New Script"}
            </button>
          )}

          {hasScript && onGenerateVoice && (
            <button
              type="button"
              disabled={isGeneratingVoice}
              onClick={onGenerateVoice}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200 shadow hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Volume2 size={14} className="text-amber-400" />
              {isGeneratingVoice ? "Generating..." : hasAudio ? "Regen Voice" : "Voiceover"}
            </button>
          )}

          {onSave && hasScript && (
            <button
              type="button"
              onClick={handleSave}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200 shadow hover:bg-slate-700 hover:text-white"
            >
              {saved ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Save size={14} className="text-slate-400" />
              )}
              {saved ? "Saved" : "Save Plan"}
            </button>
          )}

          {onRenderVideo && (
            <button
              type="button"
              disabled={!canRender || isRendering}
              onClick={onRenderVideo}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 text-xs font-semibold text-white shadow-lg shadow-cyan-950/50 transition hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500"
              title={
                canRender
                  ? "Render MP4 video composition"
                  : "Select assets for all scenes first"
              }
            >
              <Film size={14} />
              {isRendering ? "Rendering MP4..." : "Render Video"}
            </button>
          )}

          {onUpload && (
            <button
              type="button"
              onClick={onUpload}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-300 shadow hover:bg-slate-700 hover:text-white"
            >
              <Upload size={14} className="text-purple-400" />
              Publish
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Reset current project workspace"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 shadow transition hover:bg-slate-800 hover:text-red-400"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
