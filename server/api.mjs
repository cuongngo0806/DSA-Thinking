/**
 * The sync API, shared by the Vite dev server and `npm start`.
 *
 * Three endpoints, all local-only: the browser talks to a Node process on the
 * same machine, and that process runs git.
 */

import { getStatus, pull, push, readData, syncConfig } from './git-sync.mjs';

const MAX_BODY = 8 * 1024 * 1024; // a long history of chats and traces

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Handle a sync request. Returns true when it owned the request.
 * Mount this in front of any static handler.
 */
export async function handleSyncRequest(req, res) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/sync')) return false;

  try {
    if (url.pathname === '/api/sync/status' && req.method === 'GET') {
      json(res, 200, await getStatus());
      return true;
    }
    if (url.pathname === '/api/sync/data' && req.method === 'GET') {
      json(res, 200, await readData());
      return true;
    }
    if (url.pathname === '/api/sync/pull' && req.method === 'POST') {
      const result = await pull();
      json(res, result.ok ? 200 : 400, result);
      return true;
    }
    if (url.pathname === '/api/sync/push' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body?.state || typeof body.state !== 'object') {
        json(res, 400, { ok: false, error: 'Expected a { state } payload.' });
        return true;
      }
      const result = await push(body.state, body.note);
      json(res, result.ok ? 200 : 400, result);
      return true;
    }
    if (url.pathname === '/api/sync/config' && req.method === 'GET') {
      const { repoDir, file, branch, remote } = syncConfig();
      json(res, 200, { repoDir, file, branch, remote });
      return true;
    }
    json(res, 404, { ok: false, error: 'Unknown sync endpoint.' });
  } catch (e) {
    json(res, 500, { ok: false, error: String(e?.message ?? e) });
  }
  return true;
}

/** Vite plugin: the same API during `npm run dev`. */
export function syncApiPlugin() {
  return {
    name: 'dsa-compass-sync-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleSyncRequest(req, res).then((handled) => {
          if (!handled) next();
        });
      });
    },
  };
}
