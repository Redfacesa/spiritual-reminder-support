# Prayer Reminder — Web (Node.js)

A single Node.js/Express service that serves:

| Path        | What                                                                 |
| ----------- | -------------------------------------------------------------------- |
| `/`         | The **full web app** (same features as mobile — prayers, library, AI guide, profile, reading plans, sermons, settings). Built from the Expo codebase via React Native Web. |
| `/prayers`, `/library`, `/guidance`, `/profile`, `/reading-plan`, `/sermons`, `/settings` | App routes. |
| `/welcome`  | Marketing landing page (hero, features, download badges).            |
| `/privacy`  | Privacy Policy (redirects to `/welcome/privacy.html`).               |
| `/terms`    | Terms of Service (redirects to `/welcome/terms.html`).               |
| `/healthz`  | Health check for hosting platforms.                                  |

The web app and the mobile app share **one codebase** (`/app`, `/components`, `/context`), so features stay in sync automatically.

## Build & run locally

From the project root:

```bash
# 1. Install the web server deps (once)
npm run web:install

# 2. Build the web app (creates ./dist) and start the server
npm run web:serve
```

Then open:

- App: <http://localhost:8080/>
- Marketing: <http://localhost:8080/welcome>

To rebuild only the app bundle: `npm run web:export`
To start the server without rebuilding: `npm run web:start`

## Environment variables

The web app reads the same `EXPO_PUBLIC_*` variables as the mobile app **at build time** (`npm run web:export`). Set these before building for production:

```
EXPO_PUBLIC_PROXY_URL=https://your-proxy-host        # AI + transcription proxy (the /server app)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
```

The server itself only needs `PORT` (defaults to `8080`).

## Deploy (any Node host: Render, Railway, Fly, a VPS, etc.)

1. **Build command:** `npm install && npm run web:install && npm run web:export`
2. **Start command:** `npm run web:start` (or `node web/server.js`)
3. Expose the port from `PORT` (the host usually sets this automatically).

> The AI guide, sermon transcription, and Pro payments still rely on the proxy
> in `/server`. Deploy that separately and point `EXPO_PUBLIC_PROXY_URL` at it
> before building the web app.

### Example: one-box VPS

```bash
git clone <repo> && cd spiritual-reminder-support
npm install
npm run web:install
# set EXPO_PUBLIC_* env vars here
npm run web:export
PORT=8080 npm run web:start
```

Put nginx (or your platform's router) in front for TLS and your domain.
