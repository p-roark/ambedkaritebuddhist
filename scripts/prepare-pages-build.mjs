/**
 * Prepares the opennextjs-cloudflare output for Cloudflare Pages Advanced Mode.
 *
 * opennextjs outputs:
 *   .open-next/worker.js              — main worker entry (references sibling dirs)
 *   .open-next/middleware/            — middleware handler
 *   .open-next/server-functions/      — route handlers
 *   .open-next/.build/                — durable object stubs etc.
 *   .open-next/assets/                — static files (Pages output dir)
 *
 * Pages Advanced Mode expects _worker.js + its imports to be in the output dir.
 * Wrangler bundles _worker.js and resolves relative imports from the same dir.
 */

import { cpSync, existsSync, writeFileSync } from 'node:fs';

const SRC = '.open-next';
const DEST = '.open-next/assets';

// Copy worker entry as _worker.js
cpSync(`${SRC}/worker.js`, `${DEST}/_worker.js`);

// Copy internal modules the worker imports via relative paths
const internalDirs = ['.build', 'cloudflare', 'middleware', 'server-functions'];
for (const dir of internalDirs) {
  const src = `${SRC}/${dir}`;
  if (existsSync(src)) {
    cpSync(src, `${DEST}/${dir}`, { recursive: true });
  }
}

// Exclude internal dirs from being served as static assets
writeFileSync(`${DEST}/.assetsignore`, internalDirs.join('\n') + '\n');

console.log('✓ Pages build prepared — _worker.js and internal modules copied to assets/');
