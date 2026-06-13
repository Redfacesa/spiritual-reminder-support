module.exports = function handler(_req, res) {
  res.json({
    ok: true,
    runtime: 'vercel',
    model: process.env.XAI_MODEL || 'grok-4.3',
    xai: Boolean(process.env.XAI_API_KEY),
    paystack: Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
};
