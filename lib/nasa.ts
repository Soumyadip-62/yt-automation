import type { VideoAssets } from "@/types/generatedAssets";
import type { SceneAsset } from "./gemini";

const DEFAULT_NASA_SEARCH_URL = "https://images-api.nasa.gov/search?q=";
const DEFAULT_PEXELS_IMAGE_SEARCH_URL = "https://api.pexels.com/v1/search";
const DEFAULT_PEXELS_VIDEO_SEARCH_URL = "https://api.pexels.com/videos/search";
const IMAGE_PROVIDER_RESULT_LIMIT = 5;
const VIDEO_PROVIDER_RESULT_LIMIT = 6;

export const nasaBaseURI = process.env.NASA_ASSETS_API_URL;
const pexelsApiKey = process.env.PEXELS_API_KEY;
const pexelsImageUrl =
  process.env.PEXELS_IMAGE_URL ||
  process.env.PEXLES_IMAGE_URL ||
  DEFAULT_PEXELS_IMAGE_SEARCH_URL;
const pexelsVideoUrl =
  process.env.PEXELS_VIDEO_URL ||
  process.env.PEXLES_VIDEO_URL ||
  DEFAULT_PEXELS_VIDEO_SEARCH_URL;

export interface Asset {
  assetsurl: string;
  description?: string;
  mediaType?: string;
  nasaId?: string;
  previewUrl?: string;
  provider?: "nasa" | "pexels";
  title?: string;
}

export type SceneAssetsFromNasa = {
  assets: Asset[];
  requestUrl: string;
  searchQuery: string;
  sceneAsset: SceneAsset;
};

type NasaSearchResponse = {
  collection?: {
    items?: NasaSearchItem[];
  };
};

type NasaSearchItem = {
  data?: Array<{
    description?: string;
    media_type?: string;
    nasa_id?: string;
    title?: string;
  }>;
  links?: Array<{
    href?: string;
    rel?: string;
    render?: string;
  }>;
};

type PexelsVideoResponse = {
  videos?: PexelsVideo[];
};

type PexelsPhotoResponse = {
  photos?: PexelsPhoto[];
};

type PexelsPhoto = {
  alt?: string;
  id: number;
  photographer?: string;
  src?: {
    large?: string;
    large2x?: string;
    original?: string;
  };
  url?: string;
};

type PexelsVideo = {
  id: number;
  image?: string;
  url?: string;
  user?: {
    name?: string;
  };
  video_files?: Array<{
    file_type?: string;
    height?: number;
    link?: string;
    quality?: string;
    width?: number;
  }>;
};

function normalizeMediaType(type: string) {
  const mediaType = type.trim().toLowerCase();

  if (mediaType === "image" || mediaType === "video") {
    return mediaType;
  }

  return "image";
}

function shouldSearchPexels(mediaType: string) {
  return mediaType === "video";
}

function normalizeSearchQuery(query: string) {
  const blockedWords = new Set([
    "realistic",
    "cinematic",
    "dramatic",
    "style",
    "background",
    "render",
    "animation",
    "animated",
    "illustration",
    "art",
    "image",
    "photo",
    "picture",
    "4k",
    "hd",
    "nasa",
  ]);

  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !blockedWords.has(word));

  return words.join(" ").trim() || query.trim();
}

function buildNasaSearchUrl(query: string, mediaType: string) {
  const url = new URL(nasaBaseURI || DEFAULT_NASA_SEARCH_URL);

  url.searchParams.set("q", query);
  url.searchParams.set("media_type", mediaType);
  url.searchParams.set("page_size", String(IMAGE_PROVIDER_RESULT_LIMIT));

  return url.toString();
}

function buildPexelsImageSearchUrl(query: string) {
  const url = new URL(pexelsImageUrl);

  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(IMAGE_PROVIDER_RESULT_LIMIT));

  return url.toString();
}

function buildPexelsVideoSearchUrl(query: string) {
  const url = new URL(pexelsVideoUrl);

  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(VIDEO_PROVIDER_RESULT_LIMIT));

  return url.toString();
}

function getPexelsVideoUrl(video: PexelsVideo) {
  const files = video.video_files?.filter((file) => file.link) ?? [];

  return (
    files.find((file) => file.file_type === "video/mp4" && file.quality === "hd")
      ?.link ||
    files.find((file) => file.file_type === "video/mp4")?.link ||
    files[0]?.link
  );
}

async function searchPexelsVideoAssets(
  searchQuery: string,
) {
  if (!pexelsApiKey) {
    return [];
  }

  const requestUrl = buildPexelsVideoSearchUrl(searchQuery);
  const response = await fetch(requestUrl, {
    headers: {
      Authorization: pexelsApiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as PexelsVideoResponse;

  return (data.videos ?? []).flatMap((video) => {
    const assetsurl = getPexelsVideoUrl(video);

    if (!assetsurl) {
      return [];
    }

    return {
      assetsurl,
      description: video.user?.name ? `Pexels video by ${video.user.name}` : "",
      mediaType: "video",
      previewUrl: video.image,
      provider: "pexels" as const,
      title: `Pexels video ${video.id}`,
    };
  });
}

async function searchPexelsImageAssets(searchQuery: string) {
  if (!pexelsApiKey) {
    return [];
  }

  const response = await fetch(buildPexelsImageSearchUrl(searchQuery), {
    headers: {
      Authorization: pexelsApiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as PexelsPhotoResponse;

  return (data.photos ?? []).flatMap((photo) => {
    const assetsurl =
      photo.src?.large2x || photo.src?.large || photo.src?.original;

    if (!assetsurl) {
      return [];
    }

    return {
      assetsurl,
      description: photo.photographer
        ? `Pexels photo by ${photo.photographer}`
        : "",
      mediaType: "image",
      provider: "pexels" as const,
      title: photo.alt || `Pexels photo ${photo.id}`,
    };
  });
}

function getPreviewUrl(item: NasaSearchItem) {
  const previewLink = item.links?.find(
    (link) => link.href && link.rel === "preview",
  );
  const fallbackLink = item.links?.find((link) => link.href);

  return previewLink?.href || fallbackLink?.href;
}

function getMetadata(item: NasaSearchItem) {
  return item.data?.[0];
}

function normalizeNasaImageItems(items: NasaSearchItem[] = []) {
  return items.slice(0, IMAGE_PROVIDER_RESULT_LIMIT).flatMap((item) => {
    const assetsurl = getPreviewUrl(item);

    if (!assetsurl) {
      return [];
    }

    const metadata = getMetadata(item);

    return {
      assetsurl,
      description: metadata?.description,
      mediaType: metadata?.media_type,
      nasaId: metadata?.nasa_id,
      provider: "nasa" as const,
      title: metadata?.title,
    };
  });
}

async function searchNasaImageAssets(searchQuery: string) {
  const requestUrl = buildNasaSearchUrl(searchQuery, "image");
  const response = await fetch(requestUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return {
      assets: [],
      requestUrl,
    };
  }

  const data = (await response.json()) as NasaSearchResponse;

  return {
    assets: normalizeNasaImageItems(data.collection?.items),
    requestUrl,
  };
}

async function searchNasaAssets(sceneAsset: SceneAsset) {
  const rawQuery = sceneAsset.nasaQuery?.trim() || sceneAsset.query.trim();

  if (!rawQuery) {
    return {
      assets: [],
      requestUrl: "",
      searchQuery: "",
      sceneAsset,
    };
  }

  const searchQuery = sceneAsset.nasaQuery?.trim()
    ? sceneAsset.nasaQuery.trim()
    : normalizeSearchQuery(rawQuery);
  const mediaType = normalizeMediaType(sceneAsset.type);
  const pexelsAllowed = shouldSearchPexels(mediaType);

  if (pexelsAllowed) {
    const pexelsQuery = sceneAsset.query.trim() || rawQuery;
    const pexelsAssets = await searchPexelsVideoAssets(pexelsQuery);

    return {
      assets: pexelsAssets,
      requestUrl: buildPexelsVideoSearchUrl(pexelsQuery),
      searchQuery: pexelsQuery,
      sceneAsset,
    };
  }

  const pexelsImageQuery = sceneAsset.query.trim() || rawQuery;
  const [nasaResult, pexelsAssets] = await Promise.all([
    searchNasaImageAssets(searchQuery),
    searchPexelsImageAssets(pexelsImageQuery),
  ]);

  return {
    assets: [...nasaResult.assets, ...pexelsAssets],
    requestUrl: nasaResult.requestUrl,
    searchQuery,
    sceneAsset,
  };
}

export async function getAssetsFromNasa(
  assetList: VideoAssets,
): Promise<SceneAssetsFromNasa[]> {
  return Promise.all(assetList.sceneAssets.map(searchNasaAssets));
}
