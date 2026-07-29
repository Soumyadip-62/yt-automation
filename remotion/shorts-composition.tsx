import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
  Video,
} from "remotion";
import type { CSSProperties } from "react";
import type { RenderPlan, RenderScene } from "../types/render-plan";
import { VIDEO_FPS, VIDEO_WIDTH } from "./constants";

export const defaultRenderPlan: RenderPlan = {
  audioLoop: false,
  audioUrl: "",
  audioVolume: 0.5,
  musicDucking: 0.65,
  musicFadeInSeconds: 1,
  musicFadeOutSeconds: 2,
  musicLoop: true,
  musicUrl: "",
  musicVolume: 0.18,
  metadata: { title: "Space Short", description: "", hashtags: [] },
  scenes: [
    {
      animation: "none",
      asset: { type: "image", nasaQuery: "earth", query: "earth" },
      caption: "SPACE SHORT",
      captionEnabled: true,
      duration: 4,
      fit: "cover",
      motion: "zoom-in",
      narration: "",
    },
  ],
  sceneTimings: [],
  script: "",
  selectedAssetsByScene: {},
  wordTimings: [],
};

export function getDurationInFrames(plan: RenderPlan) {
  return Math.max(
    1,
    plan.scenes.reduce(
      (total, scene) =>
        total + Math.max(1, Math.round(scene.duration * VIDEO_FPS)),
      0,
    ),
  );
}

function getMotionStyle(
  scene: RenderScene,
  frame: number,
  durationInFrames: number,
): CSSProperties {
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (scene.motion === "zoom-in") {
    return { transform: `scale(${1 + progress * 0.12})` };
  }

  if (scene.motion === "zoom-out") {
    return { transform: `scale(${1.12 - progress * 0.12})` };
  }

  if (scene.motion === "pan-left") {
    return {
      transform: `scale(1.12) translateX(${interpolate(progress, [0, 1], [4, -4])}%)`,
    };
  }

  return {};
}

function getCaptionFontSize(text: string) {
  const cleanText = text.trim();
  const longestWord = cleanText
    .split(/\s+/)
    .reduce((longest, word) => Math.max(longest, word.length), 0);
  const availableWidth = VIDEO_WIDTH - 144;

  for (let size = 62; size >= 34; size -= 2) {
    const estimatedCharsPerLine = Math.floor(availableWidth / (size * 0.58));
    const estimatedLines = Math.ceil(cleanText.length / estimatedCharsPerLine);
    const longestWordWidth = longestWord * size * 0.58;

    if (estimatedLines <= 3 && longestWordWidth <= availableWidth) {
      return size;
    }
  }

  return 34;
}

function SceneView({
  scene,
  sceneIndex,
  plan,
}: {
  scene: RenderScene;
  sceneIndex: number;
  plan: RenderPlan;
}) {
  const frame = useCurrentFrame();
  const durationInFrames = Math.max(1, Math.round(scene.duration * VIDEO_FPS));
  const asset = plan.selectedAssetsByScene[sceneIndex];
  const mediaStyle: CSSProperties = {
    height: "100%",
    objectFit: scene.fit,
    width: "100%",
    ...getMotionStyle(scene, frame, durationInFrames),
  };
  const sceneWords = plan.wordTimings.filter(
    (timing) => timing.sceneIndex === sceneIndex,
  );
  const currentSeconds = frame / VIDEO_FPS;
  const matchedWordIndex = sceneWords.findIndex(
    (timing) =>
      currentSeconds >= timing.startSeconds &&
      currentSeconds < timing.endSeconds,
  );
  const activeWordIndex =
    matchedWordIndex >= 0
      ? matchedWordIndex
      : currentSeconds >= (sceneWords.at(-1)?.endSeconds ?? Infinity)
        ? sceneWords.length - 1
        : 0;
  const visibleWordIndex = activeWordIndex >= 0 ? activeWordIndex : 0;
  const chunkStart = Math.floor(visibleWordIndex / 4) * 4;
  const visibleWords = sceneWords.slice(chunkStart, chunkStart + 4);
  const captionText =
    visibleWords.length > 0
      ? visibleWords.map((timing) => timing.word).join(" ")
      : scene.caption;
  const captionFontSize = getCaptionFontSize(captionText);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617", overflow: "hidden" }}>
      {asset ? (
        asset.mediaType === "video" ? (
          <Video loop muted src={asset.assetsurl} style={mediaStyle} />
        ) : (
          <Img src={asset.assetsurl} style={mediaStyle} />
        )
      ) : (
        <AbsoluteFill
          style={{
            alignItems: "center",
            color: "#94a3b8",
            fontFamily: "Arial, sans-serif",
            fontSize: 48,
            justifyContent: "center",
          }}
        >
          Scene {sceneIndex + 1}
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.04) 35%, rgba(2,6,23,0.9) 100%)",
        }}
      />

      {scene.captionEnabled && (scene.caption || visibleWords.length > 0) ? (
        <div
          style={{
            bottom: 320,
            color: "white",
            fontFamily: "Arial, sans-serif",
            fontSize: captionFontSize,
            fontWeight: 800,
            left: 60,
            lineHeight: 1.08,
            maxHeight: 400,
            overflow: "hidden",
            overflowWrap: "break-word",
            position: "absolute",
            right: 60,
            textAlign: "center",
            textShadow: "0 4px 18px rgba(0,0,0,0.85)",
            whiteSpace: "normal",
            wordBreak: "normal",
          }}
        >
          {visibleWords.length > 0
            ? visibleWords.map((timing, index) => {
                const absoluteIndex = chunkStart + index;
                return (
                  <span
                    key={`${timing.startSeconds}-${timing.word}`}
                    style={{
                      color:
                        absoluteIndex === activeWordIndex ? "#22d3ee" : "white",
                      marginRight: 12,
                      textShadow:
                        absoluteIndex === activeWordIndex
                          ? "0 0 24px rgba(34,211,238,0.65), 0 4px 18px rgba(0,0,0,0.85)"
                          : "0 4px 18px rgba(0,0,0,0.85)",
                    }}
                  >
                    {timing.word.toUpperCase()}
                  </span>
                );
              })
            : scene.caption.toUpperCase()}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

export function ShortsComposition(plan: RenderPlan) {
  const durationInFrames = getDurationInFrames(plan);
  const narrationFrames = Math.round(
    (plan.audioDurationSeconds ?? 0) * VIDEO_FPS,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      {plan.audioUrl ? (
        <Audio
          loop={plan.audioLoop}
          src={plan.audioUrl}
          volume={plan.audioVolume}
        />
      ) : null}
      {plan.musicUrl ? (
        <Audio
          loop={plan.musicLoop}
          loopVolumeCurveBehavior="extend"
          src={plan.musicUrl}
          volume={(frame) => {
            const fadeInFrames = Math.round(
              plan.musicFadeInSeconds * VIDEO_FPS,
            );
            const fadeOutFrames = Math.round(
              plan.musicFadeOutSeconds * VIDEO_FPS,
            );
            const fadeIn =
              fadeInFrames > 0
                ? interpolate(frame, [0, fadeInFrames], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : 1;
            const fadeOut =
              fadeOutFrames > 0
                ? interpolate(
                    frame,
                    [durationInFrames - fadeOutFrames, durationInFrames],
                    [1, 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  )
                : 1;
            const ducking =
              plan.audioUrl && frame < narrationFrames
                ? 1 - plan.musicDucking
                : 1;

            return plan.musicVolume * fadeIn * fadeOut * ducking;
          }}
        />
      ) : null}
      {plan.scenes.map((scene, sceneIndex) => {
        const durationInFrames = Math.max(
          1,
          Math.round(scene.duration * VIDEO_FPS),
        );
        const startFrame = plan.scenes
          .slice(0, sceneIndex)
          .reduce(
            (total, previousScene) =>
              total +
              Math.max(1, Math.round(previousScene.duration * VIDEO_FPS)),
            0,
          );

        return (
          <Sequence
            durationInFrames={durationInFrames}
            from={startFrame}
            key={`${sceneIndex}-${scene.caption}`}
            name={`Scene ${sceneIndex + 1}`}
          >
            <SceneView plan={plan} scene={scene} sceneIndex={sceneIndex} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
