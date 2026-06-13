const { buildChatSystemPrompt } = require('../server/prompts');

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_MODEL = process.env.XAI_MODEL || 'grok-4.3';
const XAI_BASE_URL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';

function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .slice(-12)
    .map((m) => ({
      role: m.role === 'assistant' || m.role === 'ai' ? 'assistant' : 'user',
      content: String(m.content),
    }));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!XAI_API_KEY) {
    return res.status(500).json({ error: 'XAI_API_KEY is not configured on Vercel.' });
  }

  const { messages, faith, stream = true } = req.body || {};
  const history = sanitizeHistory(messages);
  if (history.length === 0) {
    return res.status(400).json({ error: 'No message content provided.' });
  }

  const payload = {
    model: XAI_MODEL,
    messages: [{ role: 'system', content: buildChatSystemPrompt(faith) }, ...history],
    stream: Boolean(stream),
  };

  try {
    const upstream = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return res
        .status(upstream.status)
        .json({ error: `xAI error (${upstream.status})`, detail: detail.slice(0, 500) });
    }

    if (!payload.stream) {
      const data = await upstream.json();
      return res.json({ reply: data?.choices?.[0]?.message?.content ?? '' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          return res.end();
        }
        try {
          const parsed = JSON.parse(data);
          const token = parsed?.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch {
          // Ignore keepalive / partial JSON chunks.
        }
      }
    }

    res.write('data: [DONE]\n\n');
    return res.end();
  } catch (err) {
    console.error('[api/chat] error', err);
    if (!res.headersSent) return res.status(500).json({ error: 'Connection to the AI service failed.' });
    res.write(`data: ${JSON.stringify({ error: 'Connection to the AI service failed.' })}\n\n`);
    return res.end();
  }
};
