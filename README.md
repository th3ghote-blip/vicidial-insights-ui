# vicidial-insights-ui

Spanish-first Next.js dashboard for the [vicidial-insights](https://github.com/th3ghote-blip/vicidial-insights) FastAPI backend.

The bearer token for the backend lives in Vercel env vars and never leaves the
server — every fetch happens in a Server Component or route handler. The browser
only receives the rendered HTML and the data it needs.

## Architecture

```
Browser → Next.js (Vercel)  →  Railway (Python API)  →  Supabase + Vicidial
              ↑
       VICIDIAL_API_TOKEN lives here, server-side only
```

## Local dev

```bash
npm install
copy .env.example .env.local   # fill in the token
npm run dev
```

Open http://localhost:3000.

## Env vars

| Name | Where | Value |
|---|---|---|
| `VICIDIAL_API_BASE` | Vercel + .env.local | `https://vicidial-insights-production.up.railway.app` |
| `VICIDIAL_API_TOKEN` | Vercel + .env.local | bearer token from the FastAPI deploy |

Both must be set in Vercel for **Production AND Preview** environments.

## Deploy

```bash
vercel --prod
```

Or push to `main` — Vercel's GitHub integration auto-deploys.

## Stack

- Next.js 16 (App Router, Turbopack, server components)
- Tailwind v4
- Recharts for the dispositions chart
- TypeScript strict
