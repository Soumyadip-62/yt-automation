# AI Space Shorts Studio

Local-first YouTube Shorts generator for space videos.

## Local Render Setup

Build the Remotion bundle:

```bash
pnpm build:remotion
```

Start the app:

```bash
pnpm dev
```

Open:

```txt
http://localhost:3000
```

Rendered videos are saved locally:

```txt
public/renders/<renderId>.mp4
```

Browser download/playback uses:

```txt
/renders/<renderId>.mp4
```

## Required Env

```bash
GEMINI_API_KEY=...
OPENAI_API_KEY=...
NASA_ASSETS_API_URL=...
PEXELS_API_KEY=...
PEXLES_VIDEO_URL=...
```

No Vercel Blob, Vercel Sandbox, Railway, or Render worker is required for local
video rendering.
