"use client";

import { Player } from "@remotion/player";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Captions,
  Download,
  Film,
  LoaderCircle,
  Music2,
  Sparkles,
  Upload,
  Volume2,
  X,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRenderPlan } from "@/components/render-plan-provider";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/remotion/constants";
import {
  CLOSING_VIDEO_DURATION_SECONDS,
  getDurationInFrames,
  ShortsComposition,
} from "@/remotion/shorts-composition";
import type {
  AssetFit,
  RenderPlan,
  RenderScene,
  SceneTiming,
  SceneMotion,
  WordTiming,
} from "@/types/render-plan";
import {
  VOICE_OPTIONS,
  VOICE_SPEEDS,
  VOICE_STYLES,
  type VoiceName,
  type VoiceSpeed,
  type VoiceStyle,
} from "@/lib/voice-config";
import { PipelineTracker, type PipelineStep } from "@/components/pipeline-tracker";
import { PersistentMetadataCard } from "@/components/persistent-metadata-card";

type RenderResult = {
  renderId: string;
  videoUrl: string;
};

type VoiceResult = {
  audioUrl: string;
  durationSeconds: number;
  sceneTimings: SceneTiming[];
  wordTimings: WordTiming[];
};

const motionOptions: Array<{ label: string; value: SceneMotion }> = [
  { label: "None", value: "none" },
  { label: "Zoom in", value: "zoom-in" },
  { label: "Zoom out", value: "zoom-out" },
  { label: "Pan left", value: "pan-left" },
];

type PresetSound = {
  filename: string;
  name: string;
  url: string;
};

export default function EditorPage() {
  const { renderPlan, setRenderPlan } = useRenderPlan();
  const [draft, setDraft] = useState<RenderPlan | null>(renderPlan);
  const [activeScene, setActiveScene] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [voice, setVoice] = useState<VoiceName>("Charon");
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("Documentary");
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>("normal");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [presetSounds, setPresetSounds] = useState<PresetSound[]>([]);

  useEffect(() => {
    if (draft) setRenderPlan(draft);
  }, [draft, setRenderPlan]);

  useEffect(() => {
    async function loadPresetSounds() {
      try {
        const response = await fetch("/api/sounds");
        const data = (await response.json()) as { sounds?: PresetSound[] };
        if (Array.isArray(data.sounds)) {
          setPresetSounds(data.sounds);
        }
      } catch (error) {
        console.error("Failed to load preset sounds:", error);
      }
    }
    loadPresetSounds();
  }, []);

  if (!draft) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090d16] p-6 text-slate-100">
        <section className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-center shadow-xl shadow-slate-950/50 backdrop-blur-md">
          <Film className="mx-auto text-slate-500" size={32} />
          <h1 className="mt-4 text-xl font-semibold text-slate-100">No video plan loaded</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Generate a script and select one asset for every scene first.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-cyan-500"
          >
            <ArrowLeft size={16} /> Back to studio workspace
          </Link>
        </section>
      </main>
    );
  }

  const scene = draft.scenes[activeScene];
  const sceneCount = draft.scenes.length;
  const downloadFilename = `${
    draft.metadata.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "space-short"
  }.mp4`;

  // Pipeline steps status for editor
  const pipelineSteps: PipelineStep[] = [
    { id: "script", label: "Script", status: "completed" },
    { id: "scenes", label: "Scenes", status: "completed" },
    { id: "assets", label: "Assets", status: "completed" },
    {
      id: "voice",
      label: "Voice",
      status: draft.audioUrl ? "completed" : isGeneratingVoice ? "in-progress" : "pending",
    },
    {
      id: "render",
      label: "Render",
      status: renderResult ? "completed" : isRendering ? "in-progress" : "pending",
    },
    { id: "upload", label: "Upload", status: "pending" },
  ];

  function downloadVideo(videoUrl: string) {
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function updateScene(patch: Partial<RenderScene>) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        scenes: current.scenes.map((item, index) =>
          index === activeScene ? { ...item, ...patch } : item,
        ),
      };
    });
    setRenderResult(null);
  }

  function updateAudio(
    patch: Partial<
      Pick<
        RenderPlan,
        | "audioDurationSeconds"
        | "audioLoop"
        | "audioUrl"
        | "audioVolume"
        | "sceneTimings"
        | "wordTimings"
      >
    >,
  ) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setRenderResult(null);
  }

  function updateMusic(
    patch: Partial<
      Pick<
        RenderPlan,
        | "musicDucking"
        | "musicFadeInSeconds"
        | "musicFadeOutSeconds"
        | "musicLoop"
        | "musicUrl"
        | "musicVolume"
      >
    >,
  ) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setRenderResult(null);
  }

  function selectMusicFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("audio/") || file.size > 20 * 1024 * 1024) {
      setRenderError("Choose an audio file smaller than 20 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateMusic({ musicUrl: reader.result });
        setRenderError("");
      }
    };
    reader.onerror = () => setRenderError("Could not read the music file.");
    reader.readAsDataURL(file);
  }

  async function generateVoice() {
    setIsGeneratingVoice(true);
    setVoiceError("");
    setRenderResult(null);

    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: draft?.scenes.map((item) => item.narration) ?? [],
          speed: voiceSpeed,
          style: voiceStyle,
          voice,
        }),
      });
      const result = (await response.json()) as VoiceResult & { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Voice generation failed.");
      }

      setDraft((current) => {
        if (!current) return current;
        return {
          ...current,
          audioDurationSeconds: result.durationSeconds,
          audioLoop: false,
          audioUrl: result.audioUrl,
          audioVolume: 1,
          sceneTimings: result.sceneTimings,
          scenes: current.scenes.map((item, index) => ({
            ...item,
            duration: result.sceneTimings[index].durationSeconds,
          })),
          wordTimings: result.wordTimings,
        };
      });
    } catch (error) {
      setVoiceError(
        error instanceof Error ? error.message : "Voice generation failed.",
      );
    } finally {
      setIsGeneratingVoice(false);
    }
  }

  function moveScene(direction: -1 | 1) {
    const targetIndex = activeScene + direction;
    if (targetIndex < 0 || targetIndex >= sceneCount) return;

    setDraft((current) => {
      if (!current) return current;
      const scenes = [...current.scenes];
      [scenes[activeScene], scenes[targetIndex]] = [
        scenes[targetIndex],
        scenes[activeScene],
      ];
      const selectedAssetsByScene = { ...current.selectedAssetsByScene };
      [selectedAssetsByScene[activeScene], selectedAssetsByScene[targetIndex]] = [
        selectedAssetsByScene[targetIndex],
        selectedAssetsByScene[activeScene],
      ];
      return {
        ...current,
        audioDurationSeconds: undefined,
        audioUrl: "",
        sceneTimings: [],
        scenes,
        selectedAssetsByScene,
        wordTimings: [],
      };
    });
    setActiveScene(targetIndex);
    setRenderResult(null);
  }

  async function renderVideo() {
    setIsRendering(true);
    setRenderError("");
    setRenderResult(null);

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as RenderResult & { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Video render failed.");
      }

      setRenderResult(result);
      downloadVideo(result.videoUrl);
    } catch (error) {
      setRenderError(
        error instanceof Error ? error.message : "Video render failed.",
      );
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 pb-10">
      {/* Header bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              title="Back to studio selection"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Remotion Video Render Studio
              </p>
              <h1 className="truncate text-base font-semibold text-slate-100 sm:text-lg">
                {draft.metadata.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderResult && (
              <button
                type="button"
                onClick={() => downloadVideo(renderResult.videoUrl)}
                className="flex h-10 items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-950 px-4 text-sm font-semibold text-emerald-300 shadow hover:bg-emerald-900"
              >
                <Download size={16} /> Download MP4
              </button>
            )}

            <button
              type="button"
              disabled={isRendering}
              onClick={renderVideo}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-cyan-500 disabled:cursor-wait disabled:bg-slate-800 disabled:text-slate-500"
            >
              {isRendering ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <Film size={17} />
              )}
              {isRendering ? "Rendering MP4..." : "Render Video"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-5 pt-4 flex flex-col gap-5">
        {/* Step pipeline tracker */}
        <PipelineTracker steps={pipelineSteps} />

        {/* Persistent Metadata Summary Card */}
        <PersistentMetadataCard
          metadata={draft.metadata}
          totalDurationSeconds={getDurationInFrames(draft) / VIDEO_FPS}
          status={renderResult ? "Rendered MP4 Ready" : isRendering ? "Rendering" : "Editing Composition"}
          onUpdateMetadata={(updated) => {
            setDraft((curr) => (curr ? { ...curr, metadata: updated } : curr));
          }}
        />

        {/* Grid Player + Editor Sections */}
        <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.8fr)_minmax(460px,1.2fr)]">
          {/* Left Preview Player */}
          <section className="flex min-h-[620px] flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-xl sticky top-24 h-fit">
            <div className="w-full max-w-[340px] overflow-hidden bg-black shadow-2xl rounded-lg border border-slate-800">
              <Player
                component={ShortsComposition}
                compositionHeight={VIDEO_HEIGHT}
                compositionWidth={VIDEO_WIDTH}
                controls
                durationInFrames={getDurationInFrames(draft)}
                fps={VIDEO_FPS}
                inputProps={draft}
                loop
                style={{ aspectRatio: "9 / 16", width: "100%" }}
              />
            </div>
          </section>

          {/* Right Editor Controls */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Timeline */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-100">Scene Timeline</h2>
                <span className="text-xs font-medium text-slate-400">
                  {(getDurationInFrames(draft) / VIDEO_FPS).toFixed(1)}s Total
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto p-3">
                {draft.scenes.map((item, index) => {
                  const asset = draft.selectedAssetsByScene[index];
                  return (
                    <button
                      type="button"
                      onClick={() => setActiveScene(index)}
                      key={`${index}-${item.caption}`}
                      className={`w-28 shrink-0 overflow-hidden rounded-lg border text-left transition ${
                        activeScene === index
                          ? "border-cyan-500 ring-2 ring-cyan-500/30"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {asset?.mediaType === "video" ? (
                        <video
                          className="aspect-[9/11] w-full bg-slate-950 object-cover"
                          muted
                          poster={asset.previewUrl}
                          src={asset.assetsurl}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="aspect-[9/11] w-full bg-slate-950 object-cover"
                          src={asset?.assetsurl}
                        />
                      )}
                      <span className="block truncate bg-slate-950 px-2 py-1.5 text-xs font-semibold text-slate-200">
                        {index + 1}. {item.duration}s
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Active Scene Controls */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-100">
                  Active Scene #{activeScene + 1}
                </h2>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={activeScene === 0}
                    onClick={() => moveScene(-1)}
                    title="Move scene earlier"
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={activeScene === draft.scenes.length - 1}
                    onClick={() => moveScene(1)}
                    title="Move scene later"
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-300">
                  Duration
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      disabled={Boolean(draft.audioUrl)}
                      value={scene.duration}
                      onChange={(event) =>
                        updateScene({ duration: Number(event.target.value) })
                      }
                      className="min-w-0 flex-1 accent-cyan-500 disabled:opacity-40"
                    />
                    <span className="w-10 text-right text-sm font-medium text-slate-100">
                      {scene.duration}s
                    </span>
                  </div>
                </label>

                <label className="text-sm font-semibold text-slate-300">
                  Motion
                  <select
                    value={scene.motion}
                    onChange={(event) =>
                      updateScene({ motion: event.target.value as SceneMotion })
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 font-normal text-slate-100 outline-none focus:border-cyan-500"
                  >
                    {motionOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-300">
                  Asset fit
                  <span className="mt-2 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                    {(["cover", "contain"] as AssetFit[]).map((fit) => (
                      <button
                        type="button"
                        onClick={() => updateScene({ fit })}
                        key={fit}
                        className={`h-9 capitalize transition ${
                          scene.fit === fit
                            ? "bg-cyan-600 text-white font-semibold"
                            : "bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </span>
                </label>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-300 sm:self-end">
                  <span className="flex items-center gap-2">
                    <Captions size={17} /> Caption
                  </span>
                  <input
                    type="checkbox"
                    checked={scene.captionEnabled}
                    onChange={(event) =>
                      updateScene({ captionEnabled: event.target.checked })
                    }
                    className="size-4 accent-cyan-500"
                  />
                </label>

                <label className="text-sm font-semibold text-slate-300 sm:col-span-2">
                  Caption text
                  <textarea
                    disabled={!scene.captionEnabled}
                    value={scene.caption}
                    onChange={(event) => updateScene({ caption: event.target.value })}
                    className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 font-normal text-slate-100 leading-6 outline-none focus:border-cyan-500 disabled:bg-slate-900 disabled:text-slate-500"
                  />
                </label>
              </div>
            </section>

            {/* AI Voiceover Section */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Volume2 size={17} /> AI Voiceover Generation
                </h2>
                {draft.audioUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateAudio({
                        audioDurationSeconds: undefined,
                        audioUrl: "",
                        sceneTimings: [],
                        wordTimings: [],
                      })
                    }
                    title="Remove voiceover"
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-3">
                <label className="text-sm font-semibold text-slate-300">
                  Voice
                  <select
                    value={voice}
                    onChange={(event) => setVoice(event.target.value as VoiceName)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 font-normal text-slate-100 outline-none focus:border-cyan-500"
                  >
                    {VOICE_OPTIONS.map((option) => (
                      <option value={option.name} key={option.name}>
                        {option.name} - {option.description}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-300">
                  Delivery
                  <select
                    value={voiceStyle}
                    onChange={(event) => setVoiceStyle(event.target.value as VoiceStyle)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 font-normal text-slate-100 outline-none focus:border-cyan-500"
                  >
                    {VOICE_STYLES.map((style) => (
                      <option value={style} key={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-300">
                  Speech speed
                  <select
                    value={voiceSpeed}
                    onChange={(event) => setVoiceSpeed(event.target.value as VoiceSpeed)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 font-normal text-slate-100 outline-none focus:border-cyan-500"
                  >
                    {VOICE_SPEEDS.map((speedOption) => (
                      <option value={speedOption.value} key={speedOption.value}>
                        {speedOption.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  disabled={isGeneratingVoice}
                  onClick={generateVoice}
                  className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-cyan-500 disabled:cursor-wait disabled:bg-slate-800 disabled:text-slate-500 sm:col-span-3"
                >
                  {isGeneratingVoice ? (
                    <LoaderCircle className="animate-spin" size={17} />
                  ) : (
                    <Sparkles size={17} />
                  )}
                  {isGeneratingVoice
                    ? "Generating Voice..."
                    : draft.audioUrl
                      ? "Regenerate Voice"
                      : "Generate Voice from Script"}
                </button>

                {voiceError ? (
                  <p className="rounded-lg border border-red-800/80 bg-red-950/50 px-3 py-2 text-sm font-medium text-red-300 sm:col-span-3">
                    {voiceError}
                  </p>
                ) : null}

                {draft.audioUrl ? (
                  <div className="sm:col-span-2">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-300">
                        Generated Narration Audio
                      </span>
                      {draft.audioDurationSeconds ? (
                        <span className="text-xs font-medium text-emerald-400">
                          {draft.audioDurationSeconds.toFixed(1)}s, synced
                        </span>
                      ) : null}
                    </div>
                    <audio className="w-full" controls src={draft.audioUrl} />
                  </div>
                ) : null}

                <label className="text-sm font-semibold text-slate-300 sm:col-span-2">
                  Voice volume
                  <div className="mt-2 flex h-10 items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={draft.audioVolume}
                      onChange={(event) =>
                        updateAudio({ audioVolume: Number(event.target.value) })
                      }
                      className="min-w-0 flex-1 accent-cyan-500"
                    />
                    <span className="w-10 text-right text-sm font-medium text-slate-100">
                      {Math.round(draft.audioVolume * 100)}%
                    </span>
                  </div>
                </label>
              </div>
            </section>

            {/* Background Music Section */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Music2 size={17} /> Background Music Track
                </h2>
                {draft.musicUrl ? (
                  <button
                    type="button"
                    onClick={() => updateMusic({ musicUrl: "" })}
                    title="Remove background music"
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-300 sm:col-span-2">
                  Preset audio track
                  <select
                    value={draft.musicUrl}
                    onChange={(event) => updateMusic({ musicUrl: event.target.value })}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 font-normal text-slate-100 outline-none focus:border-cyan-500"
                  >
                    <option value="">Select a preset track...</option>
                    {presetSounds.map((sound) => (
                      <option value={sound.url} key={sound.filename}>
                        {sound.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white">
                  <Upload size={16} /> Custom Track
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={(event) => selectMusicFile(event.target.files?.[0])}
                  />
                </label>

                <input
                  type="url"
                  aria-label="Remote music URL"
                  placeholder="Or paste music URL"
                  value={
                    draft.musicUrl.startsWith("data:") ||
                    draft.musicUrl.startsWith("/api/sounds/") ||
                    draft.musicUrl.startsWith("/sounds/")
                      ? ""
                      : draft.musicUrl
                  }
                  onChange={(event) => updateMusic({ musicUrl: event.target.value })}
                  className="h-10 min-w-0 rounded-lg border border-slate-700/80 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />

                {draft.musicUrl ? (
                  <audio
                    className="w-full sm:col-span-2"
                    controls
                    loop={draft.musicLoop}
                    src={draft.musicUrl}
                  />
                ) : null}

                <label className="text-sm font-semibold text-slate-300">
                  Music volume
                  <div className="mt-2 flex h-10 items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={draft.musicVolume}
                      onChange={(event) =>
                        updateMusic({ musicVolume: Number(event.target.value) })
                      }
                      className="min-w-0 flex-1 accent-cyan-500"
                    />
                    <span className="w-10 text-right text-sm font-medium text-slate-100">
                      {Math.round(draft.musicVolume * 100)}%
                    </span>
                  </div>
                </label>

                <label className="text-sm font-semibold text-slate-300">
                  Voice ducking
                  <div className="mt-2 flex h-10 items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="0.95"
                      step="0.05"
                      value={draft.musicDucking}
                      onChange={(event) =>
                        updateMusic({ musicDucking: Number(event.target.value) })
                      }
                      className="min-w-0 flex-1 accent-cyan-500"
                    />
                    <span className="w-10 text-right text-sm font-medium text-slate-100">
                      {Math.round(draft.musicDucking * 100)}%
                    </span>
                  </div>
                </label>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
