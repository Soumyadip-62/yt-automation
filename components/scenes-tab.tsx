import type { SceneBreakdown } from "@/lib/gemini";

type ScenesTabProps = {
  scenebreakdown: SceneBreakdown;
};

export function ScenesTab({ scenebreakdown }: ScenesTabProps) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-md font-semibold text-slate-100">
          {scenebreakdown.title || "Scene Breakdown"}
        </h3>
        {scenebreakdown.hook ? (
          <p className="mt-1 text-sm italic text-slate-400">
            Hook: &quot;{scenebreakdown.hook}&quot;
          </p>
        ) : null}
      </div>

      <div className="relative ml-3 flex flex-col gap-8 border-l-2 border-slate-800 py-2 pl-6">
        {scenebreakdown.scenes && scenebreakdown.scenes.length > 0 ? (
          scenebreakdown.scenes.map((scene, idx) => (
            <div key={idx} className="group relative">
              <div className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-cyan-500 bg-slate-900 text-[10px] font-bold text-cyan-400 shadow-sm transition-all group-hover:bg-cyan-600 group-hover:text-white">
                {idx + 1}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="rounded-full border border-cyan-800/80 bg-cyan-950/80 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                    ⏱️ {scene.duration}s
                  </span>
                  {scene.animation ? (
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
                      🎬 {scene.animation}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Narration
                    </h4>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-100">
                      {scene.narration}
                    </p>
                  </div>

                  {scene.asset ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Visual Asset
                        </h4>
                        <span className="rounded border border-cyan-800 bg-cyan-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                          {scene.asset.type}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-col gap-2">
                        <p className="rounded border border-slate-800 bg-slate-950 p-2 text-xs italic leading-relaxed text-slate-300">
                          <span className="font-semibold not-italic text-slate-400">
                            Generation:
                          </span>{" "}
                          {scene.asset.query}
                        </p>
                        {scene.asset.nasaQuery ? (
                          <p className="rounded border border-cyan-800/80 bg-cyan-950/40 p-2 text-xs leading-relaxed text-cyan-300">
                            <span className="font-semibold">NASA:</span>{" "}
                            {scene.asset.nasaQuery}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {scene.caption ? (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        On-screen Caption
                      </h4>
                      <p className="mt-1 w-fit rounded border border-cyan-800 bg-cyan-950 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cyan-300">
                        {scene.caption}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No scenes generated.</p>
        )}
      </div>
    </div>
  );
}
