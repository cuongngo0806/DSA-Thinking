#!/usr/bin/env node
/**
 * Standalone local server: the built app plus the sync API.
 *
 *   npm run build && npm start
 *
 * `npm run dev` serves the same API through a Vite plugin, so this is only for
 * running the built app without the dev toolchain.
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { handleSyncRequest } from './server/api.mjs';

const REPO = resolve(import.meta.dirname);
const DIST = resolve(REPO, 'dist');
const PORT = Number(process.env.PORT || 5174);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.map': 'application/json',
};

if (!existsSync(DIST)) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

/** Resolve a URL path to a file, confined to the directory it belongs to. */
function resolveFile(pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '');
  // `data/` lives in the repo, not in the build, but a fresh clone needs it.
  const base = rel === 'data' || rel.startsWith('data/') || rel.startsWith('data\\') ? REPO : DIST;
  const file = resolve(base, rel);
  if (!file.startsWith(base)) return join(DIST, 'index.html'); // path traversal
  if (!existsSync(file) || statSync(file).isDirectory()) return join(DIST, 'index.html');
  return file;
}

createServer(async (req, res) => {
  if (await handleSyncRequest(req, res)) return;

  const url = new URL(req.url ?? '/', 'http://localhost');
  const file = resolveFile(url.pathname);
  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`DSA Compass  http://localhost:${PORT}`);
  console.log('Sync runs git in this process; keep it open while you study.');
});
