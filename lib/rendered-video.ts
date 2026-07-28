import os from "node:os";
import path from "node:path";

const RENDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getRenderedVideoDirectory() {
  return path.join(os.tmpdir(), "yt-automate-renders");
}

export function getRenderedVideoPath(renderId: string) {
  if (!RENDER_ID_PATTERN.test(renderId)) {
    throw new Error("Invalid render id.");
  }

  return path.join(getRenderedVideoDirectory(), `${renderId}.mp4`);
}

export function getRenderedVideoUrl(renderId: string) {
  if (!RENDER_ID_PATTERN.test(renderId)) {
    throw new Error("Invalid render id.");
  }

  return `/api/render/${renderId}`;
}

export function getRenderIdFromVideoUrl(videoUrl: string) {
  const match = videoUrl.match(/^\/api\/render\/([^/?#]+)$/);
  if (!match || !RENDER_ID_PATTERN.test(match[1])) {
    throw new Error("Upload a rendered MP4 from this app.");
  }

  return match[1];
}
