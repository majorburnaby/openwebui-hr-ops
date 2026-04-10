# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HR Helpdesk Chat UI — a single-page chat frontend for a Dify HR Agent, deployed on Vercel. No build step, no framework, no dependencies.

## Local Development

```bash
npm install -g vercel   # one-time
vercel dev              # starts at http://localhost:3000
```

Create `.env.local` for local secrets:
```
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai
```

## Architecture

```
Browser (index.html)
  └── POST /api/chat  →  api/chat.js  (Vercel Edge Function)
        └── POST {DIFY_BASE_URL}/v1/chat-messages  (SSE stream)
              └── Dify Agent → HR MCP Tools → streamed response

  └── POST /api/csv   →  api/csv.js   (Vercel Edge Function)
        └── Accepts { rows: [...], filename: "..." }, returns CSV download
```

- **`index.html`** — entire UI in one file (vanilla JS, no framework). Indonesian-language HR chat interface. Contains all CSS (CSS custom properties for theming), HTML, and JS inline.
- **`api/chat.js`** — Edge Function that proxies browser requests to Dify's `/v1/chat-messages` endpoint with SSE streaming. Keeps `DIFY_API_KEY` server-side.
- **`api/csv.js`** — Edge Function that converts a JSON array of employee objects into a UTF-8 BOM CSV file (for Excel compatibility). Contains the field-to-Indonesian-label mapping.
- **`vercel.json`** — routes `/api/chat` and `/api/csv` to their respective Edge Functions; all other paths fall through to `index.html`.

## Environment Variables (Vercel)

| Variable | Description |
|---|---|
| `DIFY_API_KEY` | Dify app API key (`app-...`), from Dify → API Access |
| `DIFY_BASE_URL` | Dify base URL (default: `https://api.dify.ai`) |

## Key Conventions

- Both API files use `export const config = { runtime: 'edge' }` — they must remain Edge Functions, not Node.js serverless functions.
- The CSV endpoint prepends a UTF-8 BOM (`\uFEFF`) so Excel opens it correctly without encoding issues.
- The chat endpoint streams Dify's SSE response body directly to the browser with no buffering (`X-Accel-Buffering: no`).
- `conversation_id` is passed as an empty string to start a new Dify conversation; subsequent messages pass the ID returned by Dify to maintain context.
- UI labels and content are in Indonesian (Bahasa Indonesia).
