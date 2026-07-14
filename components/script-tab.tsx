import { CopyButton } from "@/components/copy-button";
import type { SceneBreakdown } from "@/lib/gemini";

type ScriptTabProps = {
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  script: string;
  scenebreakdown: SceneBreakdown;
};

export function ScriptTab({
  copiedField,
  onCopy,
  script,
  scenebreakdown,
}: ScriptTabProps) {
  return (
    <div className="flex flex-col gap-6 p-5">
      {scenebreakdown.hook ? (
        <div className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-800">
            Hook Sentence
          </h3>
          <p className="mt-2 text-base font-semibold text-cyan-950">
            &quot;{scenebreakdown.hook}&quot;
          </p>
        </div>
      ) : null}

      <div className="relative">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Narration Script
          </h3>
          <CopyButton
            copied={copiedField === "script"}
            label="Copy Script"
            onClick={() => onCopy(script, "script")}
            showIcon
          />
        </div>
        <div className="select-all whitespace-pre-wrap rounded-lg bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-100">
          {script}
        </div>
      </div>
    </div>
  );
}
