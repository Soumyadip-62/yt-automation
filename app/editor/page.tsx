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
  VOICE_STYLES,
  type VoiceName,
  type VoiceStyle,
} from "@/lib/voice-config";

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

export default function EditorPage() {
  const { renderPlan, setRenderPlan } = useRenderPlan();
  const [draft, setDraft] = useState<RenderPlan | null>(renderPlan);
  const [activeScene, setActiveScene] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [voice, setVoice] = useState<VoiceName>("Charon");
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("Documentary");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  useEffect(() => {
    if (draft) setRenderPlan(draft);
  }, [draft, setRenderPlan]);

  if (!draft) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-950">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Film className="mx-auto text-slate-400" size={32} />
          <h1 className="mt-4 text-xl font-semibold">No video plan loaded</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Generate a script and select one asset for every scene first.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft size={16} /> Back to selection
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
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              title="Back to asset selection"
              className="flex size-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-cyan-700">
                Video editor
              </p>
              <h1 className="truncate text-base font-semibold sm:text-lg">
                {draft.metadata.title}
              </h1>
            </div>
          </div>
          <button
            type="button"
            disabled={isRendering}
            onClick={renderVideo}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-wait disabled:bg-slate-400"
          >
            {isRendering ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Film size={17} />
            )}
            {isRendering ? "Rendering MP4..." : "Render video"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 p-5 lg:grid-cols-[minmax(320px,0.8fr)_minmax(460px,1.2fr)]">
        <section className="flex min-h-[620px] items-center justify-center bg-slate-950 p-5">
          <div className="w-full max-w-[340px] overflow-hidden bg-black shadow-2xl">
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

        <div className="flex min-w-0 flex-col gap-5">
          <section className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold">Timeline</h2>
              <span className="text-xs font-medium text-slate-500">
                {(getDurationInFrames(draft) / VIDEO_FPS).toFixed(1)}s
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
                    className={`w-28 shrink-0 overflow-hidden border text-left ${
                      activeScene === index
                        ? "border-cyan-600 ring-2 ring-cyan-100"
                        : "border-slate-200"
                    }`}
                  >
                    {asset?.mediaType === "video" ? (
                      <video
                        className="aspect-[9/11] w-full bg-slate-900 object-cover"
                        muted
                        poster={asset.previewUrl}
                        src={asset.assetsurl}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- selected remote provider asset.
                      <img
                        alt=""
                        className="aspect-[9/11] w-full bg-slate-100 object-cover"
                        src={asset?.assetsurl}
                      />
                    )}
                    <span className="block truncate px-2 py-1.5 text-xs font-semibold">
                      {index + 1}. {item.duration}s
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold">Scene {activeScene + 1}</h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={activeScene === 0}
                  onClick={() => moveScene(-1)}
                  title="Move scene earlier"
                  className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-30"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  disabled={activeScene === draft.scenes.length - 1}
                  onClick={() => moveScene(1)}
                  title="Move scene later"
                  className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
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
                    className="min-w-0 flex-1 accent-cyan-700 disabled:opacity-40"
                  />
                  <span className="w-10 text-right text-sm font-medium">
                    {scene.duration}s
                  </span>
                </div>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Motion
                <select
                  value={scene.motion}
                  onChange={(event) =>
                    updateScene({ motion: event.target.value as SceneMotion })
                  }
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:border-cyan-600"
                >
                  {motionOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Asset fit
                <span className="mt-2 grid grid-cols-2 overflow-hidden rounded-md border border-slate-300">
                  {(["cover", "contain"] as AssetFit[]).map((fit) => (
                    <button
                      type="button"
                      onClick={() => updateScene({ fit })}
                      key={fit}
                      className={`h-9 capitalize ${
                        scene.fit === fit
                          ? "bg-slate-950 text-white"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </span>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 sm:self-end">
                <span className="flex items-center gap-2">
                  <Captions size={17} /> Caption
                </span>
                <input
                  type="checkbox"
                  checked={scene.captionEnabled}
                  onChange={(event) =>
                    updateScene({ captionEnabled: event.target.checked })
                  }
                  className="size-4 accent-cyan-700"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Caption text
                <textarea
                  disabled={!scene.captionEnabled}
                  value={scene.caption}
                  onChange={(event) => updateScene({ caption: event.target.value })}
                  className="mt-2 min-h-20 w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-normal leading-6 outline-none focus:border-cyan-600 disabled:bg-slate-100"
                />
              </label>
            </div>
          </section>

          <section className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Volume2 size={17} /> AI voiceover
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
                  className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Voice
                <select
                  value={voice}
                  onChange={(event) =>
                    setVoice(event.target.value as VoiceName)
                  }
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:border-cyan-600"
                >
                  {VOICE_OPTIONS.map((option) => (
                    <option value={option.name} key={option.name}>
                      {option.name} - {option.description}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Delivery
                <select
                  value={voiceStyle}
                  onChange={(event) =>
                    setVoiceStyle(event.target.value as VoiceStyle)
                  }
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:border-cyan-600"
                >
                  {VOICE_STYLES.map((style) => (
                    <option value={style} key={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                disabled={isGeneratingVoice}
                onClick={generateVoice}
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:bg-slate-400 sm:col-span-2"
              >
                {isGeneratingVoice ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Sparkles size={17} />
                )}
                {isGeneratingVoice
                  ? "Generating voice..."
                  : draft.audioUrl
                    ? "Regenerate voice"
                    : "Generate voice from script"}
              </button>

              {voiceError ? (
                <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 sm:col-span-2">
                  {voiceError}
                </p>
              ) : null}

              {draft.audioUrl ? (
                <div className="sm:col-span-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      Generated narration
                    </span>
                    {draft.audioDurationSeconds ? (
                      <span className="text-xs font-medium text-emerald-700">
                        {draft.audioDurationSeconds.toFixed(1)}s, scene synced
                      </span>
                    ) : null}
                  </div>
                  <audio className="w-full" controls src={draft.audioUrl} />
                </div>
              ) : null}

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
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
                    className="min-w-0 flex-1 accent-cyan-700"
                  />
                  <span className="w-10 text-right text-sm font-medium">
                    {Math.round(draft.audioVolume * 100)}%
                  </span>
                </div>
              </label>
            </div>
          </section>

          <section className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Music2 size={17} /> Background music
              </h2>
              {draft.musicUrl ? (
                <button
                  type="button"
                  onClick={() => updateMusic({ musicUrl: "" })}
                  title="Remove background music"
                  className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Upload size={16} /> Choose audio
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
                placeholder="https://.../music.mp3"
                value={draft.musicUrl.startsWith("data:") ? "" : draft.musicUrl}
                onChange={(event) => updateMusic({ musicUrl: event.target.value })}
                className="h-10 min-w-0 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
              />

              {draft.musicUrl ? (
                <audio
                  className="w-full sm:col-span-2"
                  controls
                  loop={draft.musicLoop}
                  src={draft.musicUrl}
                />
              ) : null}

              <label className="text-sm font-semibold text-slate-700">
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
                    className="min-w-0 flex-1 accent-cyan-700"
                  />
                  <span className="w-10 text-right text-sm font-medium">
                    {Math.round(draft.musicVolume * 100)}%
                  </span>
                </div>
              </label>

              <label className="text-sm font-semibold text-slate-700">
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
                    className="min-w-0 flex-1 accent-cyan-700"
                  />
                  <span className="w-10 text-right text-sm font-medium">
                    {Math.round(draft.musicDucking * 100)}%
                  </span>
                </div>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Fade in
                <div className="mt-2 flex h-10 items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.25"
                    value={draft.musicFadeInSeconds}
                    onChange={(event) =>
                      updateMusic({
                        musicFadeInSeconds: Number(event.target.value),
                      })
                    }
                    className="min-w-0 flex-1 accent-cyan-700"
                  />
                  <span className="w-10 text-right text-sm font-medium">
                    {draft.musicFadeInSeconds}s
                  </span>
                </div>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Fade out
                <div className="mt-2 flex h-10 items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.25"
                    value={draft.musicFadeOutSeconds}
                    onChange={(event) =>
                      updateMusic({
                        musicFadeOutSeconds: Number(event.target.value),
                      })
                    }
                    className="min-w-0 flex-1 accent-cyan-700"
                  />
                  <span className="w-10 text-right text-sm font-medium">
                    {draft.musicFadeOutSeconds}s
                  </span>
                </div>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                Loop music to video length
                <input
                  type="checkbox"
                  checked={draft.musicLoop}
                  onChange={(event) =>
                    updateMusic({ musicLoop: event.target.checked })
                  }
                  className="size-4 accent-cyan-700"
                />
              </label>
            </div>
          </section>

          {renderError ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {renderError}
            </p>
          ) : null}

          {renderResult ? (
            <section className="border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-emerald-900">
                    Video ready
                  </h2>
                  <p className="mt-1 text-xs text-emerald-700">
                    H.264 MP4 rendered successfully.
                  </p>
                </div>
                <a
                  href={renderResult.videoUrl}
                  download={downloadFilename}
                  className="flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white"
                >
                  <Download size={16} /> Download again
                </a>
              </div>
              <video
                className="mt-4 max-h-96 w-full bg-black"
                controls
                src={renderResult.videoUrl}
              />
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
