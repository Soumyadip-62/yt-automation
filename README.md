# AI Space Shorts Studio

## Getting Started

Run the Next.js app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Render Worker

Remotion rendering should run outside Vercel serverless. Deploy the worker on
Railway or Render and let the Vercel app proxy render requests to it.

Worker build command:

```bash
pnpm install && pnpm worker:build
```

Worker start command:

```bash
pnpm worker:start
```

Worker env:

```bash
BLOB_READ_WRITE_TOKEN=...
BLOB_ACCESS=private
RENDER_WORKER_SECRET=use-a-long-random-secret
```

Vercel app env:

```bash
BLOB_READ_WRITE_TOKEN=...
BLOB_ACCESS=private
RENDER_WORKER_URL=https://your-worker.up.railway.app
RENDER_WORKER_SECRET=same-secret-as-worker
```

With `RENDER_WORKER_URL` set, `/api/render` and `/api/render/progress` proxy to
the worker. Without it, rendering returns a setup error instead of using Vercel
Sandbox.
