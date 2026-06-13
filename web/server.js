// Node.js production server for Prayer Reminder.
//
// Serves two things from one deployable service:
//   1. The full web app (Expo web export, same features as mobile) at "/"
//   2. The marketing site (landing/) at "/welcome", with "/privacy" and "/terms"
//
// Build the app first:  npm run web:export   (creates ../dist)
// Then start:           npm start            (this file)

const path = require('path');
const fs = require('fs');
const express = require('express');
const compression = require('compression');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist'); // Expo web export (the app)
const LANDING = path.join(ROOT, 'landing'); // marketing pages
const PORT = Number(process.env.PORT) || 8080;

const app = express();
app.use(compression());

// Health check for hosting platforms.
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// ---- Marketing site ----------------------------------------------------
// Mounted under /welcome so the app can own the root path. Relative asset
// references inside the landing pages resolve correctly under /welcome/.
app.use(
  '/welcome',
  express.static(LANDING, { extensions: ['html'], index: 'index.html' })
);

// Clean URLs for the legal pages (redirect so their relative assets resolve).
const LEGAL_REDIRECTS = {
  '/privacy': '/welcome/privacy.html',
  '/terms': '/welcome/terms.html',
  '/refund': '/welcome/refund.html',
  '/cookies': '/welcome/cookies.html',
  '/data-deletion': '/welcome/data-deletion.html',
  '/support': '/welcome/support.html',
};
Object.entries(LEGAL_REDIRECTS).forEach(([from, to]) => {
  app.get(from, (_req, res) => res.redirect(301, to));
});

// ---- The web app (Expo export) ----------------------------------------
const hasBuild = fs.existsSync(path.join(DIST, 'index.html'));

if (hasBuild) {
  // `extensions: ['html']` lets /prayers resolve to prayers.html, etc.
  app.use('/', express.static(DIST, { extensions: ['html'] }));

  // Client-side route fallback: unknown paths render the app shell.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/welcome')) return next();
    const notFound = path.join(DIST, '+not-found.html');
    const indexFile = path.join(DIST, 'index.html');
    res.sendFile(fs.existsSync(notFound) ? notFound : indexFile);
  });
} else {
  // The app hasn't been built yet — guide the operator instead of 404ing.
  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('html')
      .send(
        '<h1>Prayer Reminder</h1><p>The web app build was not found. Run <code>npm run web:export</code> to build it, then restart.</p><p>Marketing site is available at <a href="/welcome">/welcome</a>.</p>'
      );
  });
}

app.listen(PORT, () => {
  console.log(`\nPrayer Reminder web server running on http://localhost:${PORT}`);
  console.log(`  App:        /            ${hasBuild ? '(serving dist/)' : '(build missing — run npm run web:export)'}`);
  console.log('  Marketing:  /welcome');
  console.log('  Legal:      /privacy, /terms, /refund, /cookies, /data-deletion, /support\n');
});
