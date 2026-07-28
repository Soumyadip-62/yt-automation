import { Composition } from "remotion";
import {
  COMPOSITION_ID,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./constants";
import {
  defaultRenderPlan,
  getDurationInFrames,
  ShortsComposition,
} from "./shorts-composition";

export function RemotionRoot() {
  return (
    <Composition
      id={COMPOSITION_ID}
      component={ShortsComposition}
      defaultProps={defaultRenderPlan}
      durationInFrames={getDurationInFrames(defaultRenderPlan)}
      fps={VIDEO_FPS}
      height={VIDEO_HEIGHT}
      width={VIDEO_WIDTH}
      calculateMetadata={({ props }) => ({
        durationInFrames: getDurationInFrames(props),
      })}
    />
  );
}

