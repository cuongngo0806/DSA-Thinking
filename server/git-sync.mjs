/**
 * Git sync, run by the local server.
 *
 * A browser cannot run `git` - it is sandboxed and has no idea it is being
 * served out of a repository. A Node process on the same machine has neither
 * limitation, so the app asks the server and the server runs real git. That is
 * why syncing needs the dev server (or `npm start`) rather than a static build.
 *
 * Both halves travel together: the database (`data/store.json`) and the web app
 * itself (`src/`, `index.html`, ...), committed in one history.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);

/** Paths that make up "the web app", staged alongside the data file. */
const DEFAULT_APP_PATHS =
  'src server server.mjs index.html package.json package-lock.json vite.config.ts tsconfig.json .env.example';

export function syncConfig(root = process.cwd()) {
  return {
    repoDir: (process.env.SYNC_REPO_DIR || root).trim(),
    file: (process.env.SYNC_FILE || 'data/store.json').trim(),
    branch: (process.env.SYNC_BRANCH || 'main').trim(),
    remote: (process.env.SYNC_REMOTE || 'origin').trim(),
    appPaths: (process.env.SYNC_APP_PATHS || DEFAULT_APP_PATHS).trim().split(/\s+/).filter(Boolean),
  };
}

async function git(cfg, args, timeout = 60_000) {
  const { stdout, stderr } = await run('git', args, {
    cwd: cfg.repoDir,
    timeout,
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  // trimEnd, not trim: `status --porcelain` encodes state in the first two
  // columns, so stripping the leading space would shift every path by one.
  return { stdout: String(stdout).trimEnd(), stderr: String(stderr).trim() };
}

const dataPath = (cfg) => path.join(cfg.repoDir, cfg.file);

function readUpdatedAt(json) {
  try {
    const v = JSON.parse(json)?.updatedAt;
    return typeof v === 'string' ? v : null;
  } catch {
    return null;
  }
}

/** Turn git's stderr into something a learner can act on. */
function gitMessage(e) {
  const raw = String(e?.stderr || e?.message || e).trim();
  if (/non-fast-forward|rejected/i.test(raw))
    return 'Push rejected — the remote moved ahead. Pull first, then push.';
  if (/not possible to fast-forward|diverge/i.test(raw))
    return 'Local and remote have diverged. Resolve it in the repo, then sync again.';
  if (/could not read Username|Authentication failed|Permission denied|terminal prompts disabled/i.test(raw))
    return 'Git authentication failed. Set up a credential helper or SSH key for this repo.';
  if (/unable to access|Could not resolve host|timed out/i.test(raw))
    return 'Cannot reach the remote. Check your connection.';
  return raw.split('\n').slice(0, 3).join(' ').slice(0, 300);
}

export async function getStatus() {
  const cfg = syncConfig();
  const base = {
    configured: true, repoDir: cfg.repoDir, file: cfg.file,
    branch: cfg.branch, appPaths: cfg.appPaths,
  };
  try {
    await git(cfg, ['rev-parse', '--is-inside-work-tree'], 15_000);
  } catch {
    return { ...base, configured: false, error: `Not a git repository: ${cfg.repoDir}` };
  }

  // Local shape first, so the panel is useful even offline.
  let dirty = [];
  try {
    const res = await git(cfg, ['status', '--porcelain']);
    dirty = res.stdout ? res.stdout.split('\n').map((l) => l.slice(3)) : [];
  } catch { /* keep going */ }

  try {
    await git(cfg, ['fetch', cfg.remote, cfg.branch], 30_000);
  } catch (e) {
    return { ...base, dirty, offline: true, error: gitMessage(e) };
  }

  let ahead = 0;
  let behind = 0;
  try {
    const res = await git(cfg, ['rev-list', '--left-right', '--count', `HEAD...${cfg.remote}/${cfg.branch}`]);
    [ahead, behind] = res.stdout.trim().split(/\s+/).map(Number);
  } catch { /* no upstream yet */ }

  let remoteExists = true;
  let remoteUpdatedAt = null;
  try {
    const res = await git(cfg, ['show', `${cfg.remote}/${cfg.branch}:${cfg.file}`]);
    remoteUpdatedAt = readUpdatedAt(res.stdout);
  } catch {
    remoteExists = false;
  }

  let lastCommit = '';
  try {
    const res = await git(cfg, ['log', '-1', '--format=%h %ad %s', '--date=short']);
    lastCommit = res.stdout.trim();
  } catch { /* empty repo */ }

  return { ...base, dirty, ahead, behind, remoteExists, remoteUpdatedAt, lastCommit };
}

/**
 * The database as committed in the repo, without touching the network.
 *
 * A fresh clone needs this on first load: the browser has nothing yet, and the
 * built app does not carry `data/` inside `dist/`.
 */
export async function readData() {
  const cfg = syncConfig();
  try {
    const raw = await readFile(dataPath(cfg), 'utf8');
    return { ok: true, state: JSON.parse(raw), updatedAt: readUpdatedAt(raw) };
  } catch {
    return { ok: true, state: null };
  }
}

/** Fast-forward to the remote and hand back the committed database. */
export async function pull() {
  const cfg = syncConfig();
  try {
    await git(cfg, ['fetch', cfg.remote, cfg.branch], 30_000);
    await git(cfg, ['merge', '--ff-only', `${cfg.remote}/${cfg.branch}`]);
  } catch (e) {
    return { ok: false, error: gitMessage(e) };
  }

  let appUpdated = false;
  try {
    const res = await git(cfg, ['diff', '--name-only', 'HEAD@{1}', 'HEAD']);
    appUpdated = res.stdout.split('\n').some((f) => f && f !== cfg.file);
  } catch { /* first pull has no reflog entry */ }

  let raw;
  try {
    raw = await readFile(dataPath(cfg), 'utf8');
  } catch {
    return {
      ok: true,
      state: null,
      appUpdated,
      note: 'No database on the remote yet — press Push once from the machine you study on.',
    };
  }
  return { ok: true, state: JSON.parse(raw), updatedAt: readUpdatedAt(raw), appUpdated };
}

/**
 * Write the database, stage it with whatever changed in the app, commit, push.
 * Nothing changed means no commit - an empty commit is noise, not a record.
 */
export async function push(state, note) {
  const cfg = syncConfig();
  try {
    await mkdir(path.dirname(dataPath(cfg)), { recursive: true });
    await writeFile(dataPath(cfg), `${JSON.stringify(state, null, 2)}\n`, 'utf8');

    const paths = [cfg.file, ...cfg.appPaths];
    await git(cfg, ['add', '--', ...paths]);

    const staged = await git(cfg, ['diff', '--cached', '--name-only', '--', ...paths]);
    if (!staged.stdout.trim()) return { ok: true, nothingToCommit: true };

    const files = staged.stdout.split('\n').filter(Boolean);
    const appFiles = files.filter((f) => f !== cfg.file);
    const message = note?.trim() || `sync: ${localStamp()}`;

    await git(cfg, ['commit', '-m', message, '--', ...paths]);
    await git(cfg, ['push', cfg.remote, `HEAD:${cfg.branch}`], 60_000);

    const head = await git(cfg, ['log', '-1', '--format=%h %s']);
    return {
      ok: true,
      commit: head.stdout.trim(),
      files,
      dataPushed: files.includes(cfg.file),
      appPushed: appFiles.length > 0,
      appFileCount: appFiles.length,
    };
  } catch (e) {
    return { ok: false, error: gitMessage(e) };
  }
}

function localStamp(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Count what would become public if the repo is. */
export function personalCounts(state) {
  const d = state?.data ?? state ?? {};
  const messages = (d.chats ?? []).reduce((n, c) => n + (c.msgs?.length ?? 0), 0);
  const logs = (d.log ?? []).length;
  const notes = Object.values(d.progress ?? {}).filter((p) => p?.note).length;
  return { messages, logs, notes };
}
