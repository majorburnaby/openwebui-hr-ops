# HR Helpdesk Chat UI

Custom chat frontend for Dify HR Agent — deployed on Vercel.

## Architecture

```
Browser (OpenWebUI style)
  └── POST /api/chat  (Vercel Edge Function)
        └── POST https://api.dify.ai/v1/chat-messages  (SSE stream)
              └── Dify Agent → HR MCP Tools → Response
```

The Vercel Edge Function acts as a proxy so the `DIFY_API_KEY` is never exposed in the browser.

---

## Project Structure

```
hr-chat-ui/
├── index.html       # Chat UI (single file, no framework)
├── api/
│   └── chat.js      # Vercel Edge Function — Dify proxy
├── vercel.json      # Routing config
├── package.json
└── README.md
```

---

## Deploy to Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "HR Chat UI v1.0.0"
git remote add origin https://github.com/YOUR_USER/hr-chat-ui.git
git push -u origin main
```

### Step 2 — Import to Vercel

1. Go to https://vercel.com → **New Project**
2. Import the `hr-chat-ui` GitHub repo
3. Framework: **Other** (no build step needed)
4. Click **Deploy**

### Step 3 — Set Environment Variables

In Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DIFY_API_KEY` | Your Dify app API key (from Dify → API Access) |
| `DIFY_BASE_URL` | `https://api.dify.ai` (or your self-hosted URL) |

Then **Redeploy** from the Deployments tab.

---

## Get Your Dify API Key

1. Open Dify → your HR Agent app
2. Click **API Access** (top right)
3. Copy the **API Key** (starts with `app-...`)
4. Paste it as `DIFY_API_KEY` in Vercel

---

## Local Development

```bash
npm install -g vercel
vercel dev
```

Then set `.env.local`:
```
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai
```

Open http://localhost:3000

---

## Customisation

**Change greeting / suggestions** — edit `index.html`, find `#welcome` section and update the suggestion buttons.

**Change "KU" user avatar initials** — search for `'KU'` in `index.html` and replace with your org's initials.

**Use self-hosted Dify** — set `DIFY_BASE_URL` to your Dify instance URL, e.g. `https://dify.yourcompany.com`.

**Add authentication** — wrap `api/chat.js` with a token check before forwarding to Dify.