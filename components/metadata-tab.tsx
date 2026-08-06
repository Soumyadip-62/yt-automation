import { CopyButton } from "@/components/copy-button";
import type { VideoMetadata } from "@/lib/gemini";

type MetadataTabProps = {
  copiedField: string | null;
  metadata: VideoMetadata;
  onCopy: (text: string, field: string) => void;
};

export function MetadataTab({
  copiedField,
  metadata,
  onCopy,
}: MetadataTabProps) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Video Title</h3>
          <CopyButton
            copied={copiedField === "title"}
            label="Copy Title"
            onClick={() => onCopy(metadata.title, "title")}
          />
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-semibold text-slate-100">
          {metadata.title || "No title generated"}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">
            Video Description
          </h3>
          <CopyButton
            copied={copiedField === "description"}
            label="Copy Description"
            onClick={() => onCopy(metadata.description, "description")}
          />
        </div>
        <p className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-300">
          {metadata.description || "No description generated"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Hashtags</h3>
          <CopyButton
            copied={copiedField === "hashtags"}
            copiedLabel="Copied All!"
            label="Copy All Tags"
            onClick={() => onCopy(metadata.hashtags.join(" "), "hashtags")}
          />
        </div>
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4">
          {metadata.hashtags && metadata.hashtags.length > 0 ? (
            metadata.hashtags.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onCopy(tag, `tag-${idx}`)}
                className="cursor-pointer rounded-full border border-cyan-800/80 bg-cyan-950/60 px-3 py-1 text-xs font-medium text-cyan-300 transition hover:border-cyan-700 hover:bg-cyan-900/80"
                title="Click to copy this hashtag"
              >
                {tag} {copiedField === `tag-${idx}` ? "✓" : ""}
              </button>
            ))
          ) : (
            <span className="text-sm text-slate-500">
              No hashtags generated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
