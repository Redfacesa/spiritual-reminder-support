# Deployment Guide

Prayer Reminder has two runtime parts:

1. **Expo web app**: exported as static files and served by Vercel.
2. **API proxy/server**: handles private keys for xAI, Paystack webhooks, transcription, and privileged Supabase writes.

Do not mix public web variables and private server variables.

## Vercel Web App Variables

Add these in **Vercel -> Project -> Settings -> Environment Variables** for the project serving `prayerreminder.site`.

Set them for **Production** and **Preview**:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=your-paystack-public-key
EXPO_PUBLIC_PROXY_URL=https://your-public-proxy-domain.com
```

These are safe to expose to the browser because they are public client values.

Important: Expo only includes environment variables that start with `EXPO_PUBLIC_` in the web/mobile bundle. Variables named `SUPABASE_URL` or `PAYSTACK_PUBLIC_KEY` without the prefix will not be available to the web app.

After changing these values, redeploy on Vercel with **Use existing build cache** turned off.

## Private Server Variables

These belong only on the server/proxy host, never in the public web bundle:

```env
XAI_API_KEY=your-xai-secret-key
XAI_MODEL=grok-4.3
XAI_BASE_URL=https://api.x.ai/v1
XAI_STT_MODEL=grok-2-vision-latest
PORT=3001
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_CALLBACK_URL=https://your-domain.com/payment/callback
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-real-supabase-service-role-key
```

Never prefix private server variables with `EXPO_PUBLIC_`. Anything with that prefix is shipped to browsers and mobile clients.

## Critical Security Rule

Never expose these values publicly:

```env
XAI_API_KEY
PAYSTACK_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
```

The Supabase service-role key is different from the anon/publishable key. It bypasses Row Level Security and must only be used on a trusted server.

## Build Validation

The web build runs `scripts/check-web-env.js` before `expo export`.

If required public variables are missing, the build fails with a clear message. A healthy Vercel build prints:

```text
Web environment variables detected:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_PROXY_URL
- EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY
```

If the deployed site skips sign-in and goes straight to the app home screen, check the Vercel build log first. It usually means the public Supabase variables were not available during the build.
