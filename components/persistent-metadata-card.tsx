"use client";

import { useState } from "react";
import { Copy, Check, Edit2, Sparkles, Hash, FileText, Clock, BarChart2 } from "lucide-react";
import type { VideoMetadata } from "@/lib/gemini";

type PersistentMetadataCardProps = {
  metadata: VideoMetadata | null;
  topic?: string;
  totalDurationSeconds?: number;
  status?: string;
  onUpdateMetadata?: (metadata: VideoMetadata) => void;
};

export function PersistentMetadataCard({
  metadata,
  topic = "",
  totalDurationSeconds = 0,
  status = "Ready",
  onUpdateMetadata,
}: PersistentMetadataCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState(metadata?.title ?? "");
  const [editDescription, setEditDescription] = useState(metadata?.description ?? "");

  if (!metadata) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onUpdateMetadata) {
      onUpdateMetadata({
        ...metadata,
        title: editTitle,
        description: editDescription,
      });
    }
  };

  const formattedHashtags = (metadata.hashtags || []).map((tag) =>
    tag.startsWith("#") ? tag : `#${tag}`
  ).join(" ");

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/50 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-cyan-400" size={18} />
          <h2 className="text-base font-semibold text-slate-100">Video Metadata</h2>
          <span className="rounded-full border border-cyan-800/60 bg-cyan-950/80 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
            Source of Truth
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs font-medium text-slate-300">
            <Clock size={13} className="text-slate-400" />
            {totalDurationSeconds ? `${totalDurationSeconds.toFixed(1)}s` : "30-40s"}
          </span>
          <span className="rounded-md border border-emerald-800/60 bg-emerald-950/60 px-2 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
            {status}
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-700/80 bg-slate-950 p-4">
          <div>
            <label className="text-xs font-semibold text-slate-400">Video Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400">Description</label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mt-1 w-full resize-y rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="group relative rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Title
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-100 leading-snug">
                  {metadata.title}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(metadata.title);
                    setEditDescription(metadata.description);
                    setIsEditing(true);
                  }}
                  className="flex size-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                  title="Edit metadata"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(metadata.title, "title")}
                  className="flex size-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                  title="Copy title"
                >
                  {copiedField === "title" ? (
                    <Check size={13} className="text-emerald-400" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <FileText size={13} /> Description
              </span>
              <button
                type="button"
                onClick={() => handleCopy(metadata.description, "description")}
                className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
              >
                {copiedField === "description" ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}
                Copy
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
              {metadata.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Hash size={14} className="text-cyan-400" />
              {metadata.hashtags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-cyan-900/60 bg-cyan-950/80 px-2 py-0.5 text-xs font-semibold text-cyan-300"
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleCopy(formattedHashtags, "hashtags")}
              className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
            >
              {copiedField === "hashtags" ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}
              Copy Tags
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-2">
              <span className="block text-[10px] uppercase font-bold text-slate-500">Topic</span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-slate-300">
                {topic || "Space Astronomy"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-2">
              <span className="block text-[10px] uppercase font-bold text-slate-500">SEO Score</span>
              <span className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-emerald-400">
                <BarChart2 size={12} /> 94/100
              </span>
            </div>
            <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-2">
              <span className="block text-[10px] uppercase font-bold text-slate-500">Est. Reading</span>
              <span className="mt-0.5 block text-xs font-semibold text-slate-300">
                ~45 seconds
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
