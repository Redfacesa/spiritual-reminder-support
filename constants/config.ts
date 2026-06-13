// The app never holds the xAI API key directly. It talks to a small proxy
// server (see /server) that keeps the secret key safe. Configure the proxy
// base URL via EXPO_PUBLIC_PROXY_URL in the project root .env file.

const DEFAULT_PROXY_URL = 'http://localhost:3001';

export const PROXY_URL = (process.env.EXPO_PUBLIC_PROXY_URL ?? DEFAULT_PROXY_URL).replace(/\/+$/, '');

export const CHAT_ENDPOINT = `${PROXY_URL}/api/chat`;
export const GUIDANCE_ENDPOINT = `${PROXY_URL}/api/guidance`;
export const TRANSCRIBE_ENDPOINT = `${PROXY_URL}/api/transcribe`;
export const HEALTH_ENDPOINT = `${PROXY_URL}/health`;
