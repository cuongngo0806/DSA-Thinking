#!/usr/bin/env node
/**
 * Standalone local server: serves the built app and the sync API.
 *
 *   npm run build && npm start
 *
 * `npm run dev` gives the same API through a Vite plugin, so this is only for
 * running the built app without the dev toolchain.
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { handleSyncRequest } from './server/api.mjs';

const ROOT = resolve(import.meta.dirname, 'dist');
const PORT = Number(process.env.PORT || 5174);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.map': 'application/json',
};

if (!existsSync(ROOT)) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

createServer(async (req, res) => {
  if (await handleSyncRequest(req, res)) return;

  const url = new URL(req.url ?? '/', 'http://localhost');
  // normalize() then confine to ROOT: never serve outside the build output
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\])+/, '');
  let file = join(ROOT, rel);
  if (!file.startsWith(ROOT)) file = ROOT;
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');

  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`DSA Compass  http://localhost:${PORT}`);
  console.log('Sync runs git in this process; keep it open while you study.');
});
