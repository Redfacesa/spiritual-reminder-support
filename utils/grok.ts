import { fetch as expoFetch } from 'expo/fetch';
import { CHAT_ENDPOINT, GUIDANCE_ENDPOINT, TRANSCRIBE_ENDPOINT } from '../constants/config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Verse {
  ref: string;
  text: string;
}

export interface Guidance {
  topic: string;
  faith: string;
  verses: Verse[];
  explanation: string;
  prayer: string;
}

interface StreamChatOptions {
  messages: ChatMessage[];
  faith?: string;
  /** Called with the full accumulated text every time a new token arrives. */
  onToken?: (fullText: string, token: string) => void;
  signal?: AbortSignal;
}

/**
 * Streams a faith-aware spiritual reply from the proxy (which talks to Grok).
 * Works on web and native via expo/fetch streaming. Falls back to a single
 * JSON response if the platform does not expose a readable stream.
 */
export async function streamChatReply({ messages, faith, onToken, signal }: StreamChatOptions): Promise<string> {
  const res = await expoFetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, faith, stream: true }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Chat request failed (${res.status}). ${detail}`.trim());
  }

  const body = (res as unknown as { body?: ReadableStream<Uint8Array> }).body;

  if (!body || typeof body.getReader !== 'function') {
    // Streaming not available: try to read a single JSON reply.
    const data = await res.json().catch(() => null);
    const fallback = (data && (data.reply as string)) || '';
    if (fallback) onToken?.(fallback, fallback);
    return fallback;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      const dataLine = rawEvent.split('\n').find((l) => l.startsWith('data:'));
      if (!dataLine) continue;

      const data = dataLine.slice(5).trim();
      if (data === '[DONE]') return full;

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.token) {
          full += parsed.token;
          onToken?.(full, parsed.token);
        }
      } catch (err) {
        if (err instanceof Error && err.message && !err.message.includes('JSON')) throw err;
        // otherwise ignore partial/keepalive chunks
      }
    }
  }

  return full;
}

/** Requests structured spiritual guidance (verses + explanation + prayer). */
export async function generateGuidance(topic: string, faith: string): Promise<Guidance> {
  const res = await expoFetch(GUIDANCE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, faith }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Guidance request failed (${res.status}). ${detail}`.trim());
  }

  return (await res.json()) as Guidance;
}

interface TranscribeAudioOptions {
  uri: string;
  filename?: string;
  mimeType?: string;
  language?: string;
  keyterm?: string;
}

/** Uploads recorded audio to the proxy, which forwards it to xAI STT. */
export async function transcribeAudio({
  uri,
  filename = 'sermon-audio.m4a',
  mimeType = 'audio/m4a',
  language = 'en',
  keyterm = 'sermon prayer scripture teaching',
}: TranscribeAudioOptions): Promise<string> {
  const form = new FormData();
  form.append('language', language);
  form.append('keyterm', keyterm);
  form.append('file', { uri, name: filename, type: mimeType } as unknown as Blob);

  const res = await expoFetch(TRANSCRIBE_ENDPOINT, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Transcription failed (${res.status}). ${detail}`.trim());
  }

  const data = await res.json().catch(() => null);
  return (data?.text as string) || '';
}
