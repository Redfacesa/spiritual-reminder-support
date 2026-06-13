const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const landing = path.join(root, 'landing');
const dist = path.join(root, 'dist');
const target = path.join(dist, 'welcome');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(dist)) {
  throw new Error('dist/ does not exist. Run the Expo web export before copying landing pages.');
}

copyDir(landing, target);
console.log('Copied landing pages to dist/welcome');
