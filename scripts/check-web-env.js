const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envFile = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) return;
  const contents = fs.readFileSync(envFile, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const required = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_PROXY_URL',
  'EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error('\nMissing required web environment variables:');
  missing.forEach((key) => console.error(`- ${key}`));
  console.error('\nAdd these in Vercel Project Settings -> Environment Variables, then redeploy without cache.\n');
  process.exit(1);
}

console.log('Web environment variables detected:');
required.forEach((key) => console.log(`- ${key}`));
