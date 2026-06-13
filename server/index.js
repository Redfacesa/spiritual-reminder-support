require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const {
  faithLabel,
  buildChatSystemPrompt,
  buildGuidanceSystemPrompt,
  GUIDANCE_SCHEMA,
} = require('./prompts');

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_MODEL = process.env.XAI_MODEL || 'grok-4.3';
const XAI_STT_MODEL = process.env.XAI_STT_MODEL || 'grok-stt';
const XAI_BASE_URL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
const PORT = Number(process.env.PORT) || 3001;

// Paystack + Supabase (service role) for the payment webhook.
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!XAI_API_KEY) {
  console.error('\n[fatal] XAI_API_KEY is not set. Create server/.env from server/.env.example and add your key.\n');
  process.exit(1);
}

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

app.use(cors());
// Keep the raw body so we can verify the Paystack webhook signature.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    model: XAI_MODEL,
    sttModel: XAI_STT_MODEL,
    paystack: Boolean(PAYSTACK_SECRET_KEY && SUPABASE_SERVICE_ROLE_KEY),
  });
});

// ---------------------------------------------------------------------
// Paystack webhook: on a successful charge, record the payment and flip
// the matching Supabase user to Pro (via the apply_successful_payment RPC,
// called with the service role key which bypasses RLS).
// ---------------------------------------------------------------------
async function applySuccessfulPayment(data) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[paystack] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping DB update.');
    return;
  }

  const email = data && data.customer && data.customer.email;
  const reference = data && (data.reference || (data.id != null ? String(data.id) : null));
  if (!email || !reference) {
    console.warn('[paystack] missing email/reference on event data — skipping.');
    return;
  }

  const planObj = data.plan;
  const planCode =
    planObj && typeof planObj === 'object' ? planObj.plan_code || null : typeof planObj === 'string' ? planObj : null;

  const body = {
    p_email: email,
    p_reference: String(reference),
    p_amount: Number(data.amount) || 0,
    p_currency: data.currency || 'ZAR',
    p_plan_code: planCode,
    p_paid_at: data.paid_at || data.paidAt || new Date().toISOString(),
    p_raw: data,
  };

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/apply_successful_payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    console.error('[paystack] Supabase RPC failed', resp.status, detail.slice(0, 500));
  } else {
    console.log(`[paystack] activated Pro for ${email} (ref ${reference}).`);
  }
}

async function handlePaystackWebhook(req, res) {
  if (!PAYSTACK_SECRET_KEY) {
    console.warn('[paystack] PAYSTACK_SECRET_KEY not set — rejecting webhook.');
    return res.sendStatus(500);
  }

  const signature = req.headers['x-paystack-signature'];
  const expected = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(req.rawBody || Buffer.from(''))
    .digest('hex');

  if (!signature || signature !== expected) {
    return res.sendStatus(401);
  }

  // Acknowledge immediately so Paystack doesn't retry; process afterwards.
  res.sendStatus(200);

  const event = req.body || {};
  const successEvents = ['charge.success', 'subscription.create', 'invoice.payment_succeeded', 'invoice.update'];
  if (successEvents.includes(event.event)) {
    try {
      await applySuccessfulPayment(event.data || {});
    } catch (err) {
      console.error('[paystack] webhook processing error', err);
    }
  }
}

// Primary path, plus `/api/webhook` alias to match the Paystack dashboard config.
app.post('/webhooks/paystack', handlePaystackWebhook);
app.post('/api/webhook', handlePaystackWebhook);

// ---------------------------------------------------------------------
// Cancel subscription: an authenticated Pro user can disable their own
// Paystack subscription in one tap. We verify the caller via their Supabase
// access token (so nobody can cancel someone else's plan), disable any active
// Paystack subscription for that email, then downgrade them to Free.
// ---------------------------------------------------------------------
const PAYSTACK_API = 'https://api.paystack.co';

async function paystack(path, init = {}) {
  return fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

// Resolve the signed-in user's email from their Supabase access token.
async function getUserEmailFromToken(token) {
  if (!token || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    const user = await resp.json();
    return user && user.email ? String(user.email) : null;
  } catch {
    return null;
  }
}

// Disable every active Paystack subscription belonging to a customer email.
async function disablePaystackSubscriptions(email) {
  let disabled = 0;
  // 1) Look up the customer by email.
  const custResp = await paystack(`/customer/${encodeURIComponent(email)}`);
  if (!custResp.ok) return disabled; // no customer = nothing to cancel
  const cust = await custResp.json();
  const customerId = cust && cust.data && cust.data.id;
  if (!customerId) return disabled;

  // 2) List their subscriptions and disable the active ones.
  const subsResp = await paystack(`/subscription?customer=${customerId}`);
  if (!subsResp.ok) return disabled;
  const subs = await subsResp.json();
  const list = (subs && subs.data) || [];
  for (const sub of list) {
    if (sub.status !== 'active' && sub.status !== 'non-renewing') continue;
    const r = await paystack('/subscription/disable', {
      method: 'POST',
      body: JSON.stringify({ code: sub.subscription_code, token: sub.email_token }),
    });
    if (r.ok) disabled += 1;
  }
  return disabled;
}

// Downgrade the user to Free in Supabase (service role bypasses RLS).
async function downgradeToFree(email) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  const profResp = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
    { headers }
  );
  if (!profResp.ok) return;
  const profiles = await profResp.json();
  const userId = profiles && profiles[0] && profiles[0].id;
  if (!userId) return;
  await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ plan: 'free', status: 'canceled', updated_at: new Date().toISOString() }),
  });
}

app.post('/api/cancel-subscription', async (req, res) => {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ error: 'Billing is not configured on the server.' });
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const email = await getUserEmailFromToken(token);
  if (!email) {
    return res.status(401).json({ error: 'Please sign in again to cancel your subscription.' });
  }

  try {
    const disabled = await disablePaystackSubscriptions(email);
    await downgradeToFree(email);
    res.json({ ok: true, disabled });
  } catch (err) {
    console.error('[cancel] error', err);
    res.status(500).json({ error: 'Could not cancel the subscription. Please email billing@prayerreminder.site.' });
  }
});

// ---------------------------------------------------------------------
// Speech-to-text: accepts a recorded sermon audio file and forwards it to
// xAI STT. The app never sees the xAI key.
// ---------------------------------------------------------------------
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file uploaded.' });
    return;
  }

  const language = typeof req.body?.language === 'string' ? req.body.language : 'en';
  const keyterm = typeof req.body?.keyterm === 'string' ? req.body.keyterm : '';

  try {
    const form = new FormData();
    form.append('model', XAI_STT_MODEL);
    form.append('format', 'true');
    if (language) form.append('language', language);
    if (keyterm) form.append('keyterm', keyterm);
    form.append(
      'file',
      new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/m4a' }),
      req.file.originalname || 'sermon-audio.m4a'
    );

    const upstream = await fetch(`${XAI_BASE_URL}/stt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${XAI_API_KEY}` },
      body: form,
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('[stt] upstream error', upstream.status, detail.slice(0, 500));
      res.status(upstream.status).json({ error: `xAI STT error (${upstream.status})`, detail: detail.slice(0, 500) });
      return;
    }

    const data = await upstream.json();
    const text =
      data?.text ||
      data?.transcript ||
      data?.result?.text ||
      data?.results?.[0]?.text ||
      data?.segments?.map((s) => s.text).filter(Boolean).join(' ') ||
      '';

    res.json({ text, raw: data });
  } catch (err) {
    console.error('[stt] proxy error', err);
    res.status(500).json({ error: 'Transcription request failed.' });
  }
});

function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .slice(-12) // keep recent context only
    .map((m) => ({
      role: m.role === 'assistant' || m.role === 'ai' ? 'assistant' : 'user',
      content: String(m.content),
    }));
}

// Streaming, faith-aware spiritual chat. Re-emits a simplified SSE token stream.
app.post('/api/chat', async (req, res) => {
  const { messages, faith, stream = true } = req.body || {};
  const history = sanitizeHistory(messages);

  if (history.length === 0) {
    res.status(400).json({ error: 'No message content provided.' });
    return;
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
      const errText = await upstream.text().catch(() => '');
      console.error('[chat] upstream error', upstream.status, errText);
      res.status(upstream.status).json({ error: `xAI error (${upstream.status})`, detail: errText.slice(0, 500) });
      return;
    }

    if (!payload.stream) {
      const data = await upstream.json();
      const reply = data?.choices?.[0]?.message?.content ?? '';
      res.json({ reply });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const writeToken = (token) => {
      if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
    };

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
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) writeToken(delta);
        } catch {
          // ignore keepalive / partial JSON
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[chat] error', err);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Connection to the AI service failed.' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Connection to the AI service failed.' });
    }
  }
});

// Structured spiritual guidance (verses + explanation + prayer) using JSON Schema output.
app.post('/api/guidance', async (req, res) => {
  const { topic, faith } = req.body || {};

  if (!topic || typeof topic !== 'string') {
    res.status(400).json({ error: 'A prayer topic is required.' });
    return;
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
      const errText = await upstream.text().catch(() => '');
      console.error('[guidance] upstream error', upstream.status, errText);
      res.status(upstream.status).json({ error: `xAI error (${upstream.status})`, detail: errText.slice(0, 500) });
      return;
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      res.status(502).json({ error: 'The AI returned an unexpected format.' });
      return;
    }

    res.json({
      topic: parsed.topic || topic,
      faith: parsed.faith || faithLabel(faith),
      verses: Array.isArray(parsed.verses) ? parsed.verses : [],
      explanation: parsed.explanation || '',
      prayer: parsed.prayer || '',
    });
  } catch (err) {
    console.error('[guidance] error', err);
    res.status(500).json({ error: 'Connection to the AI service failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`\nSpiritual companion proxy running on http://localhost:${PORT}`);
  console.log(`Model: ${XAI_MODEL}; STT: ${XAI_STT_MODEL}`);
  console.log('Endpoints: POST /api/chat (SSE stream), POST /api/guidance, POST /api/transcribe, POST /webhooks/paystack (alias /api/webhook), GET /health');
  if (!PAYSTACK_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Paystack webhook is INACTIVE — set PAYSTACK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in server/.env to enable.');
  }
  console.log('');
});
