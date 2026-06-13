// The app never holds the xAI API key directly. It talks to a small proxy
// server (see /server) that keeps the secret key safe. Configure the proxy
// base URL via EXPO_PUBLIC_PROXY_URL in the project root .env file.

const DEFAULT_PROXY_URL = 'http://localhost:3001';

const rawProxyUrl = process.env.EXPO_PUBLIC_PROXY_URL ?? DEFAULT_PROXY_URL;
const invalidProductionProxy = rawProxyUrl.includes('your-public-proxy-domain.com');

export const PROXY_URL = (invalidProductionProxy ? '/api' : rawProxyUrl).replace(/\/+$/, '');

const API_BASE = PROXY_URL.endsWith('/api') ? PROXY_URL : `${PROXY_URL}/api`;

export const CHAT_ENDPOINT = `${API_BASE}/chat`;
export const GUIDANCE_ENDPOINT = `${API_BASE}/guidance`;
export const TRANSCRIBE_ENDPOINT = `${API_BASE}/transcribe`;
export const CANCEL_SUBSCRIPTION_ENDPOINT = `${API_BASE}/cancel-subscription`;
export const HEALTH_ENDPOINT = `${API_BASE}/health`;
