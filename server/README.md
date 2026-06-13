# Spiritual Companion Proxy

A tiny Express server that keeps the xAI (Grok) API key **off the mobile client**.
The app talks to this proxy; the proxy talks to xAI.

## Setup

```bash
cd server
npm install
cp .env.example .env   # then edit .env and add your XAI_API_KEY
npm start
```

The server runs on `http://localhost:3001` by default.

## Endpoints

| Method | Path            | Description                                                        |
| ------ | --------------- | ------------------------------------------------------------------ |
| GET    | `/health`       | Health check, returns the active model.                            |
| POST   | `/api/chat`     | Faith-aware spiritual chat. Streams tokens via SSE (`data: {token}`). |
| POST   | `/api/guidance` | Structured guidance `{ topic, faith, verses[], explanation, prayer }`. |
| POST   | `/api/transcribe` | Multipart sermon audio upload; forwards to xAI speech-to-text.      |
| POST   | `/webhooks/paystack` | Verifies the Paystack signature and upgrades the paying user to Pro. |

### `/api/chat` body

```json
{ "messages": [{ "role": "user", "content": "How do I find peace?" }], "faith": "christianity", "stream": true }
```

### `/api/guidance` body

```json
{ "topic": "Financial breakthrough", "faith": "christianity" }
```

### `/api/transcribe` body

Send `multipart/form-data` with:

- `file`: recorded audio file (`m4a`, `webm`, `mp3`, `wav`, etc.)
- `language`: optional language code, defaults to `en`
- `keyterm`: optional transcription bias terms

## Connecting the app

The Expo app reads `EXPO_PUBLIC_PROXY_URL` (see the project root `.env`).

- **Web / iOS simulator / Android emulator host**: `http://localhost:3001`
- **Physical device**: use your computer's LAN IP, e.g. `http://192.168.1.20:3001`
  (run `ipconfig` to find it), and make sure the device is on the same network.

## Paystack payments (auto-upgrade to Pro)

When a customer pays on the Paystack page, Paystack POSTs a `charge.success`
event to this server. The server verifies the `x-paystack-signature`, then calls
the Supabase `apply_successful_payment` RPC (with the **service role** key) which
records the payment and flips that user's subscription to `pro`.

The customer is matched to a user by **email**, so the email used at Paystack
checkout must match the email they signed up with in the app.

### Enable it

1. Apply `supabase/migrations/0002_payments.sql` (SQL Editor or `supabase db push`).
2. In `server/.env`, set:
   ```
   PAYSTACK_SECRET_KEY=sk_xxx           # Paystack -> Settings -> API Keys & Webhooks
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Supabase -> Settings -> API -> service_role (secret!)
   ```
3. Expose the server publicly (e.g. `ngrok http 3001`) and set the **Webhook URL**
   in Paystack to `https://<public-host>/webhooks/paystack`.
4. `GET /health` returns `"paystack": true` once the keys are present.

> The service role key bypasses RLS — keep it **only** on the server, never in the app.

## Security notes

- `server/.env` holds the secret key and is git-ignored. Never commit it.
- Rotate the key in the [xAI console](https://console.x.ai) if it has ever been exposed.
- For production, deploy this proxy (and optionally add rate limiting / auth) instead of shipping the key in the app.
