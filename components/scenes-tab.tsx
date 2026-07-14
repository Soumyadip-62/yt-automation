import type { SceneBreakdown } from "@/lib/gemini";

type ScenesTabProps = {
  scenebreakdown: SceneBreakdown;
};

export function ScenesTab({ scenebreakdown }: ScenesTabProps) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-md font-semibold text-slate-900">
          {scenebreakdown.title || "Scene Breakdown"}
        </h3>
        {scenebreakdown.hook ? (
          <p className="mt-1 text-sm italic text-slate-500">
            Hook: &quot;{scenebreakdown.hook}&quot;
          </p>
        ) : null}
      </div>

      <div className="relative ml-3 flex flex-col gap-8 border-l-2 border-slate-200 py-2 pl-6">
        {scenebreakdown.scenes && scenebreakdown.scenes.length > 0 ? (
          scenebreakdown.scenes.map((scene, idx) => (
            <div key={idx} className="group relative">
              <div className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-cyan-600 bg-white text-[10px] font-bold text-cyan-700 shadow-sm transition-all group-hover:bg-cyan-600 group-hover:text-white">
                {idx + 1}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-slate-50">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">
                    ⏱️ {scene.duration}s
                  </span>
                  {scene.animation ? (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      🎬 {scene.animation}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Narration
                    </h4>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">
                      {scene.narration}
                    </p>
                  </div>

                  {scene.asset ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Visual Asset
                        </h4>
                        <span className="rounded border border-cyan-100 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-700">
                          {scene.asset.type}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-col gap-2">
                        <p className="rounded border border-slate-200/50 bg-white p-2 text-xs italic leading-relaxed text-slate-600">
                          <span className="font-semibold not-italic text-slate-500">
                            Generation:
                          </span>{" "}
                          {scene.asset.query}
                        </p>
                        {scene.asset.nasaQuery ? (
                          <p className="rounded border border-cyan-100 bg-cyan-50/60 p-2 text-xs leading-relaxed text-cyan-800">
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
                      <p className="mt-1 w-fit rounded border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cyan-800">
                        {scene.caption}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No scenes generated.</p>
        )}
      </div>
    </div>
  );
}
