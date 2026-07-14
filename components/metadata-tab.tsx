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
          <h3 className="text-sm font-semibold text-slate-700">Video Title</h3>
          <CopyButton
            copied={copiedField === "title"}
            label="Copy Title"
            onClick={() => onCopy(metadata.title, "title")}
          />
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-900">
          {metadata.title || "No title generated"}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Video Description
          </h3>
          <CopyButton
            copied={copiedField === "description"}
            label="Copy Description"
            onClick={() => onCopy(metadata.description, "description")}
          />
        </div>
        <p className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          {metadata.description || "No description generated"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Hashtags</h3>
          <CopyButton
            copied={copiedField === "hashtags"}
            copiedLabel="Copied All!"
            label="Copy All Tags"
            onClick={() => onCopy(metadata.hashtags.join(" "), "hashtags")}
          />
        </div>
        <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-4">
          {metadata.hashtags && metadata.hashtags.length > 0 ? (
            metadata.hashtags.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onCopy(tag, `tag-${idx}`)}
                className="cursor-pointer rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
                title="Click to copy this hashtag"
              >
                {tag} {copiedField === `tag-${idx}` ? "✓" : ""}
              </button>
            ))
          ) : (
            <span className="text-sm text-slate-400">
              No hashtags generated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
