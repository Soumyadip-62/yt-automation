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
  if (isLoading) {
    return (
      <div className="flex flex-1 p-5">
        <div className="flex w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          Fetching assets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (sceneAssets.length === 0) {
    return (
      <div className="flex flex-1 p-5">
        <div className="flex w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          Assets will appear here after generation.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {sceneAssets.map((sceneAsset, sceneIndex) => (
        <section
          key={`${sceneAsset.searchQuery}-${sceneIndex}`}
          className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Scene {sceneIndex + 1} assets
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Search:{" "}
                <span className="font-semibold text-cyan-700">
                  {sceneAsset.searchQuery || "No query"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedAssetsByScene[sceneIndex] ? (
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  selected
                </span>
              ) : (
                <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  choose one
                </span>
              )}
              <span className="rounded border border-cyan-100 bg-cyan-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                {sceneAsset.sceneAsset.type}
              </span>
            </div>
          </div>

          {sceneAsset.assets.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {sceneAsset.assets.map((asset) => {
                const selected = isSameAsset(
                  selectedAssetsByScene[sceneIndex],
                  asset,
                );

                return (
                  <article
                    key={`${asset.assetsurl}-${asset.nasaId ?? asset.title ?? ""}`}
                    className={`overflow-hidden rounded-md border bg-white transition ${
                      selected
                        ? "border-emerald-400 ring-2 ring-emerald-100"
                        : "border-slate-200"
                    }`}
                  >
                    {asset.mediaType === "video" ? (
                      <video
                        className="aspect-video w-full bg-slate-950 object-cover"
                        controls
                        muted
                        preload="metadata"
                        poster={asset.previewUrl}
                        src={asset.assetsurl}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- NASA catalog URLs are dynamic remote previews.
                      <img
                        alt={asset.title || sceneAsset.searchQuery}
                        className="aspect-video w-full bg-slate-100 object-cover"
                        loading="lazy"
                        src={asset.assetsurl}
                      />
                    )}

                    <div className="flex flex-col gap-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {getAssetLabel(asset)}
                          </span>
                          {asset.provider ? (
                            <span className="rounded bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700">
                              {asset.provider}
                            </span>
                          ) : null}
                        </div>
                        {asset.nasaId ? (
                          <span className="truncate text-[10px] font-medium text-slate-400">
                            {asset.nasaId}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {asset.title || "Untitled asset"}
                      </h4>
                      {asset.description ? (
                        <p className="line-clamp-3 text-xs leading-relaxed text-slate-500">
                          {asset.description}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onSelectAsset(sceneIndex, asset)}
                        className={`mt-1 h-9 cursor-pointer rounded-md px-3 text-sm font-semibold transition ${
                          selected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-950 text-white hover:bg-cyan-700"
                        }`}
                      >
                        {selected ? "Selected" : "Use this asset"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              No assets found for this scene.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
