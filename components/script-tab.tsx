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
        <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/40 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Hook Sentence
          </h3>
          <p className="mt-2 text-base font-semibold text-cyan-200">
            &quot;{scenebreakdown.hook}&quot;
          </p>
        </div>
      ) : null}

      <div className="relative">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">
            Narration Script
          </h3>
          <CopyButton
            copied={copiedField === "script"}
            label="Copy Script"
            onClick={() => onCopy(script, "script")}
            showIcon
          />
        </div>
        <div className="select-all whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-100">
          {script}
        </div>
      </div>
    </div>
  );
}
