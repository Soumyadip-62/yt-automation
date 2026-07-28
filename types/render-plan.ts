import type { Scene, VideoMetadata } from "@/lib/gemini";
import type { Asset } from "@/lib/nasa";

export type AssetFit = "cover" | "contain";
export type SceneMotion = "none" | "zoom-in" | "zoom-out" | "pan-left";

export type RenderScene = Scene & {
  captionEnabled: boolean;
  fit: AssetFit;
  motion: SceneMotion;
};

export type WordTiming = {
  endSeconds: number;
  sceneIndex: number;
  startSeconds: number;
  word: string;
};

export type SceneTiming = {
  durationSeconds: number;
  sceneIndex: number;
  startSeconds: number;
};

export type RenderPlan = {
  audioLoop: boolean;
  audioDurationSeconds?: number;
  audioUrl: string;
  audioVolume: number;
  musicDucking: number;
  musicFadeInSeconds: number;
  musicFadeOutSeconds: number;
  musicLoop: boolean;
  musicUrl: string;
  musicVolume: number;
  metadata: VideoMetadata;
  sceneTimings: SceneTiming[];
  scenes: RenderScene[];
  script: string;
  selectedAssetsByScene: Record<number, Asset>;
  wordTimings: WordTiming[];
};
