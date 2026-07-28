import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { VideoMetadata } from "@/lib/gemini";

const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";

export type YoutubePrivacyStatus = "private" | "public" | "unlisted";

export type YoutubeTokens = {
  accessToken?: string;
  refreshToken?: string;
};

export type YoutubeUploadInput = {
  description: string;
  privacyStatus: YoutubePrivacyStatus;
  tags: string[];
  title: string;
  videoUrl: string;
};

export type YoutubeUploadResult = {
  privacyStatus?: string;
  videoId: string;
  watchUrl: string;
};

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  refresh_token?: string;
};

type YoutubeVideoResponse = {
  error?: {
    message?: string;
  };
  id?: string;
  status?: {
    privacyStatus?: string;
  };
};

function getEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function getYoutubeRedirectUri(origin: string) {
  return getEnv("YOUTUBE_REDIRECT_URI") || `${origin}/api/youtube/callback`;
}

function getYoutubeClientConfig(origin: string) {
  const clientId = getEnv("YOUTUBE_CLIENT_ID");
  const clientSecret = getEnv("YOUTUBE_CLIENT_SECRET");
  const redirectUri = getYoutubeRedirectUri(origin);

  if (!clientId || !clientSecret) {
    throw new Error(
      "Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET before connecting YouTube.",
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function createYoutubeAuthUrl(origin: string) {
  const { clientId, redirectUri } = getYoutubeClientConfig(origin);
  const url = new URL(AUTH_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", YOUTUBE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");

  return url.toString();
}

export async function exchangeYoutubeCode({
  code,
  origin,
}: {
  code: string;
  origin: string;
}) {
  const { clientId, clientSecret, redirectUri } = getYoutubeClientConfig(origin);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const response = await fetch(TOKEN_URL, {
    body,
    method: "POST",
  });
  const data = (await response.json()) as TokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Could not connect YouTube.",
    );
  }

  return data;
}

async function refreshYoutubeAccessToken({
  origin,
  refreshToken,
}: {
  origin: string;
  refreshToken: string;
}) {
  const { clientId, clientSecret } = getYoutubeClientConfig(origin);
  const response = await fetch(TOKEN_URL, {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    method: "POST",
  });
  const data = (await response.json()) as TokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Could not refresh YouTube auth.",
    );
  }

  return data.access_token;
}

export function normalizeYoutubeTags(tags: string[]) {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const value = tag.replace(/^#+/, "").trim();
    const key = value.toLowerCase();

    if (!value || seen.has(key)) continue;
    seen.add(key);
    normalized.push(value);
  }

  let totalLength = 0;
  return normalized.filter((tag, index) => {
    const nextLength = totalLength + tag.length + (index > 0 ? 1 : 0);
    if (nextLength > 500) return false;
    totalLength = nextLength;
    return true;
  });
}

export function buildYoutubeDescription(metadata: VideoMetadata) {
  const hashtags = metadata.hashtags.join(" ").trim();

  if (!hashtags || metadata.description.includes(hashtags)) {
    return metadata.description;
  }

  return `${metadata.description.trim()}\n\n${hashtags}`.trim();
}

function resolveRenderedVideoPath(videoUrl: string) {
  if (!videoUrl.startsWith("/videos/") || !videoUrl.endsWith(".mp4")) {
    throw new Error("Upload a rendered MP4 from this app.");
  }

  const videoPath = path.resolve(
    process.cwd(),
    "public",
    videoUrl.replace(/^\//, ""),
  );
  const videoDirectory = path.resolve(process.cwd(), "public", "videos");

  if (!videoPath.startsWith(`${videoDirectory}${path.sep}`)) {
    throw new Error("Invalid rendered video path.");
  }

  return videoPath;
}

async function getAccessToken({
  origin,
  tokens,
}: {
  origin: string;
  tokens: YoutubeTokens;
}) {
  const refreshToken = tokens.refreshToken || getEnv("YOUTUBE_REFRESH_TOKEN");

  if (refreshToken) {
    return refreshYoutubeAccessToken({ origin, refreshToken });
  }

  if (tokens.accessToken) {
    return tokens.accessToken;
  }

  throw new Error("Connect YouTube before uploading.");
}

export async function uploadVideoToYoutube({
  input,
  origin,
  tokens,
}: {
  input: YoutubeUploadInput;
  origin: string;
  tokens: YoutubeTokens;
}): Promise<YoutubeUploadResult> {
  const accessToken = await getAccessToken({ origin, tokens });
  const videoPath = resolveRenderedVideoPath(input.videoUrl);
  const videoStats = await stat(videoPath);
  const videoBuffer = await readFile(videoPath);
  const metadata = {
    snippet: {
      categoryId: "28",
      description: input.description.slice(0, 5_000),
      tags: normalizeYoutubeTags(input.tags),
      title: input.title.trim().slice(0, 100) || "Space Short",
    },
    status: {
      embeddable: true,
      license: "youtube",
      privacyStatus: input.privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };
  const sessionResponse = await fetch(
    `${UPLOAD_URL}?uploadType=resumable&part=snippet,status`,
    {
      body: JSON.stringify(metadata),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Length": String(Buffer.byteLength(JSON.stringify(metadata))),
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(videoStats.size),
        "X-Upload-Content-Type": "video/mp4",
      },
      method: "POST",
    },
  );
  const uploadLocation = sessionResponse.headers.get("location");

  if (!sessionResponse.ok || !uploadLocation) {
    const errorText = await sessionResponse.text();
    throw new Error(errorText || "Could not start YouTube upload.");
  }

  const uploadResponse = await fetch(uploadLocation, {
    body: videoBuffer,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": String(videoStats.size),
      "Content-Type": "video/mp4",
    },
    method: "PUT",
  });
  const result = (await uploadResponse.json()) as YoutubeVideoResponse;

  if (!uploadResponse.ok || !result.id) {
    throw new Error(
      result.error?.message || "YouTube upload failed. Check your API quota.",
    );
  }

  return {
    privacyStatus: result.status?.privacyStatus,
    videoId: result.id,
    watchUrl: `https://www.youtube.com/watch?v=${result.id}`,
  };
}
