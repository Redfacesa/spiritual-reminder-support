const { faithLabel, buildGuidanceSystemPrompt, GUIDANCE_SCHEMA } = require('../server/prompts');

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_MODEL = process.env.XAI_MODEL || 'grok-4.3';
const XAI_BASE_URL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!XAI_API_KEY) {
    return res.status(500).json({ error: 'XAI_API_KEY is not configured on Vercel.' });
  }

  const { topic, faith } = req.body || {};
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'A prayer topic is required.' });
  }

  const payload = {
    model: XAI_MODEL,
    messages: [
      { role: 'system', content: buildGuidanceSystemPrompt(faith) },
      {
        role: 'user',
        content: `Provide spiritual guidance for the topic: "${topic}" within the ${faithLabel(faith)} tradition.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'spiritual_guidance', schema: GUIDANCE_SCHEMA, strict: true },
    },
    stream: false,
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

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: 'The AI returned an unexpected format.' });
    }

    return res.json({
      topic: parsed.topic || topic,
      faith: parsed.faith || faithLabel(faith),
      verses: Array.isArray(parsed.verses) ? parsed.verses : [],
      explanation: parsed.explanation || '',
      prayer: parsed.prayer || '',
    });
  } catch (err) {
    console.error('[api/guidance] error', err);
    return res.status(500).json({ error: 'Connection to the AI service failed.' });
  }
};
