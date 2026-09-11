const fs = require('fs');
const path = require('path');

const project = process.argv[2] || 'customer';
const distDir = path.join(__dirname, '..', 'dist', project);

const forbiddenHosts = [
  'app-backend-gz2l.onrender.com',
  'rihla-backend-rbh7.onrender.com',
];

if (!fs.existsSync(distDir)) {
  console.error(
    `[verify-env] Build output "${distDir}" not found. Run "ng build" first.`,
  );
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|mjs|html)$/.test(entry.name)) files.push(full);
  }
})(distDir);

const hits = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const host of forbiddenHosts) {
    if (content.includes(host)) hits.push(`${file} -> ${host}`);
  }
}

if (hits.length > 0) {
  console.error('[verify-env] FORBIDDEN backend host baked into the bundle:');
  for (const hit of hits) console.error(`  ${hit}`);
  console.error('[verify-env] Pipeline aborted. Fix API_URL / environment.prod.ts before deploying.');
  process.exit(1);
}

console.log('[verify-env] OK - no stale backend hosts in the bundle.');