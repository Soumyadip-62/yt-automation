"use client";

import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useRenderPlan } from "@/components/render-plan-provider";
import { generateScriptRequest } from "@/lib/api/script";
import Header from "@/components/header";
import { getAssetsRequestFromSceneAssets } from "@/lib/api/assets";
import type { Asset } from "@/lib/nasa";
import { PipelineTracker, type PipelineStep } from "@/components/pipeline-tracker";
import { StickyActionBar } from "@/components/sticky-action-bar";
import { PersistentMetadataCard } from "@/components/persistent-metadata-card";
import { SceneCard } from "@/components/scene-card";
import { AssetsTab } from "@/components/assets-tab";
import { ScriptTab } from "@/components/script-tab";
import { Sparkles, Film, Layers, BookOpen } from "lucide-react";
import type { VideoMetadata, Scene } from "@/lib/gemini";

export default function Home() {
  const router = useRouter();
  const { setRenderPlan } = useRenderPlan();
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const [selectedAssetsByScene, setSelectedAssetsByScene] = useState<
    Record<number, Asset>
  >({});
  const [editableMetadata, setEditableMetadata] = useState<VideoMetadata | null>(null);
  const [editableScenes, setEditableScenes] = useState<Scene[]>([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"scenes" | "script">("scenes");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const assetMutation = useMutation({
    mutationFn: getAssetsRequestFromSceneAssets,
  });

  const scriptMutation = useMutation({
    mutationFn: generateScriptRequest,
    onSuccess: (data) => {
      setEditableMetadata(data.metadata);
      setEditableScenes(data.scenebreakdown.scenes);

      const sceneAssets = data.scenebreakdown.scenes
        .map((scene) => scene.asset)
        .filter((asset) => asset?.query || asset?.nasaQuery);

      assetMutation.reset();
      setSelectedAssetsByScene({});

      if (sceneAssets.length > 0) {
        assetMutation.mutate(sceneAssets);
      }
    },
  });

  const scriptData = scriptMutation.data ?? null;
  const isLoading = scriptMutation.isPending;
  const requestError =
    scriptMutation.error instanceof Error
      ? scriptMutation.error.message
      : "Script generation failed.";

  const sceneCount = editableScenes.length || scriptData?.scenebreakdown.scenes.length || 0;
  const selectedAssetCount = Object.keys(selectedAssetsByScene).length;
  const canOpenEditor = sceneCount > 0 && selectedAssetCount === sceneCount;

  // Compute status steps for pipeline tracker
  const pipelineSteps: PipelineStep[] = [
    {
      id: "script",
      label: "Script",
      status: scriptData ? "completed" : isLoading ? "in-progress" : "pending",
    },
    {
      id: "scenes",
      label: "Scenes",
      status: sceneCount > 0 ? "completed" : "pending",
    },
    {
      id: "assets",
      label: "Assets",
      status:
        selectedAssetCount === sceneCount && sceneCount > 0
          ? "completed"
          : assetMutation.isPending
            ? "in-progress"
            : sceneCount > 0
              ? "pending"
              : "disabled",
    },
    {
      id: "voice",
      label: "Voice",
      status: "pending",
    },
    {
      id: "render",
      label: "Render",
      status: "pending",
    },
    {
      id: "upload",
      label: "Upload",
      status: "pending",
    },
  ];

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError("Enter a topic first.");
      scriptMutation.reset();
      assetMutation.reset();
      setSelectedAssetsByScene({});
      return;
    }

    setError("");
    assetMutation.reset();
    setSelectedAssetsByScene({});
    scriptMutation.mutate(trimmedTopic);
  }

  function handleOpenEditor() {
    if (!scriptData && editableScenes.length === 0) return;

    if (!canOpenEditor) {
      setError(`Select one asset for all ${sceneCount} scenes before opening editor.`);
      return;
    }

    setError("");
    setRenderPlan({
      audioLoop: false,
      audioUrl: "",
      audioVolume: 0.5,
      musicDucking: 0.65,
      musicFadeInSeconds: 1,
      musicFadeOutSeconds: 2,
      musicLoop: true,
      musicUrl: "",
      musicVolume: 0.18,
      sceneTimings: [],
      script: scriptData?.script || "",
      metadata: editableMetadata || scriptData!.metadata,
      selectedAssetsByScene,
      scenes: editableScenes.map((scene) => ({
        ...scene,
        captionEnabled: true,
        fit: "cover",
        motion:
          scene.animation === "zoom"
            ? "zoom-in"
            : scene.animation === "parallax"
              ? "pan-left"
              : "none",
      })),
      wordTimings: [],
    });
    router.push("/editor");
  }

  const handleReset = () => {
    setTopic("");
    setError("");
    setSelectedAssetsByScene({});
    setEditableMetadata(null);
    setEditableScenes([]);
    scriptMutation.reset();
    assetMutation.reset();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 pb-12">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Header />

        {/* Pipeline Tracker */}
        <div className="my-4">
          <PipelineTracker steps={pipelineSteps} />
        </div>

        {/* Sticky Action Bar */}
        <StickyActionBar
          canRender={canOpenEditor}
          hasScript={Boolean(scriptData)}
          isGeneratingScript={isLoading}
          onGenerateScript={() => handleSubmit()}
          onRenderVideo={handleOpenEditor}
          onReset={handleReset}
          onSave={() => setError("Workspace state saved.")}
        />

        {/* Main 3-Column Studio Workspace */}
        <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          {/* Main Left Workspace: Topic, Metadata, Scenes/Script */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* Topic Input Card */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/50 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="topic"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-100"
                >
                  <Sparkles size={16} className="text-cyan-400" />
                  Topic & Research Prompt
                </label>
                <span className="text-xs text-slate-400">Gemini 1.5 Pro</span>
              </div>

              <textarea
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="E.g. James Webb Space Telescope discoveries, Mars rover findings, Neutron stars..."
                className="min-h-28 w-full resize-none rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />

              {error || scriptMutation.isError ? (
                <p className="rounded-lg border border-red-800/80 bg-red-950/50 px-4 py-2.5 text-xs font-medium text-red-300">
                  {error || requestError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="h-11 cursor-pointer rounded-lg bg-cyan-600 px-5 text-sm font-bold text-white shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isLoading ? "Generating Script & Scenes..." : "Generate AI Script"}
              </button>
            </form>

            {/* Persistent Video Metadata Card */}
            {editableMetadata && (
              <PersistentMetadataCard
                metadata={editableMetadata}
                topic={topic}
                status={canOpenEditor ? "Ready for Editor" : "Select Assets"}
                totalDurationSeconds={editableScenes.reduce((acc, s) => acc + (s.duration || 4), 0)}
                onUpdateMetadata={(updated) => setEditableMetadata(updated)}
              />
            )}

            {/* Scene Timeline & Cards / Raw Script Section */}
            {editableScenes.length > 0 && (
              <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-md overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-900">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveWorkspaceTab("scenes")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeWorkspaceTab === "scenes"
                          ? "bg-cyan-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Layers size={14} /> Scene Cards ({editableScenes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWorkspaceTab("script")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeWorkspaceTab === "script"
                          ? "bg-cyan-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <BookOpen size={14} /> Full Script
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!canOpenEditor}
                    onClick={handleOpenEditor}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    <Film size={14} /> Open Editor
                  </button>
                </div>

                <div className="p-4">
                  {activeWorkspaceTab === "scenes" ? (
                    <div className="flex flex-col gap-3">
                      {editableScenes.map((sc, index) => (
                        <SceneCard
                          key={`${index}-${sc.narration.substring(0, 10)}`}
                          scene={sc}
                          sceneIndex={index}
                          totalScenes={editableScenes.length}
                          selectedAsset={selectedAssetsByScene[index]}
                          duration={sc.duration || 4}
                          onUpdateScene={(patch) => {
                            setEditableScenes((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, ...patch } : item
                              )
                            );
                          }}
                          onMoveScene={(dir) => {
                            const target = index + dir;
                            if (target < 0 || target >= editableScenes.length) return;
                            const copy = [...editableScenes];
                            [copy[index], copy[target]] = [copy[target], copy[index]];
                            setEditableScenes(copy);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <ScriptTab
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                      script={scriptData?.script || ""}
                      scenebreakdown={
                        scriptData?.scenebreakdown || {
                          scenes: editableScenes,
                          title: editableMetadata?.title || "",
                          hook: editableScenes[0]?.narration || "",
                        }
                      }
                    />
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sticky Right Asset Panel */}
          <div className="min-w-0 w-full lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
            <AssetsTab
              error={
                assetMutation.error instanceof Error
                  ? assetMutation.error.message
                  : ""
              }
              sceneAssets={assetMutation.data ?? []}
              isLoading={assetMutation.isPending}
              onSelectAsset={(sceneIndex, asset) =>
                setSelectedAssetsByScene((current) => ({
                  ...current,
                  [sceneIndex]: asset,
                }))
              }
              selectedAssetsByScene={selectedAssetsByScene}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
