#!/usr/bin/env node
/**
 * One command to get everything into git: the web app and the database.
 *
 * A browser cannot write into the repo folder, so the app hands you a
 * downloaded `store.json`. This picks that up, files it under `data/`, and
 * commits it alongside whatever changed in `src/` - one history for the code
 * and the data it operates on.
 *
 *   npm run sync            build, collect the export, commit, push
 *   npm run sync -- --no-build
 *   npm run sync -- --watch      keep collecting as new exports appear
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, statSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'data');
const DATA_FILE = join(DATA_DIR, 'store.json');
const DOWNLOADS = join(homedir(), 'Downloads');

const args = new Set(process.argv.slice(2));
const WATCH = args.has('--watch');
const NO_BUILD = args.has('--no-build');
const INTERVAL_MS = 20_000;

const c = {
  dim: (s) => `[2m${s}[0m`,
  green: (s) => `[32m${s}[0m`,
  yellow: (s) => `[33m${s}[0m`,
  red: (s) => `[31m${s}[0m`,
  cyan: (s) => `[36m${s}[0m`,
};

function git(argv, { quiet = true } = {}) {
  return execFileSync('git', argv, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

/** The newest export the browser dropped in Downloads, if any. */
function findExport() {
  if (!existsSync(DOWNLOADS)) return null;
  const matches = readdirSync(DOWNLOADS)
    // browsers name repeats "store (1).json"
    .filter((f) => /^(store|dsa-compass-data)(\s*\(\d+\))?\.json$/i.test(f))
    .map((f) => ({ f, path: join(DOWNLOADS, f), mtime: statSync(join(DOWNLOADS, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return matches[0] ?? null;
}

function collectExport() {
  const found = findExport();
  if (!found) return false;
  mkdirSync(DATA_DIR, { recursive: true });
  renameSync(found.path, DATA_FILE);
  console.log(c.cyan(`  collected ${found.f} from Downloads -> data/store.json`));
  return true;
}

/**
 * The database can hold chat transcripts and private notes. If this repo is
 * public, so are they - say so rather than committing them silently.
 */
function warnIfPersonal() {
  if (!existsSync(DATA_FILE)) return;
  let data;
  try {
    data = JSON.parse(readFileSync(DATA_FILE, 'utf8')).data;
  } catch {
    return;
  }
  if (!data) return;
  const messages = (data.chats ?? []).reduce((n, chat) => n + (chat.msgs?.length ?? 0), 0);
  const logs = (data.log ?? []).length;
  const notes = Object.values(data.progress ?? {}).filter((p) => p.note).length;
  if (messages + logs + notes === 0) return;
  console.log(
    c.yellow(`  note: ${messages} chat message(s), ${logs} log entry(ies), ${notes} problem note(s)`),
  );
  console.log(c.yellow('        If this repo is public, so are they. Use a private repo if that matters.'));
}

function build() {
  if (NO_BUILD) return;
  console.log(c.dim('  building...'));
  execFileSync('npm', ['run', '--silent', 'build'], { cwd: ROOT, stdio: 'inherit', shell: true });
}

function syncOnce() {
  collectExport();
  warnIfPersonal();

  git(['add', '-A']);
  const staged = git(['diff', '--cached', '--name-only']).trim();
  if (!staged) {
    console.log(c.dim('  nothing to sync'));
    return;
  }

  build();
  git(['add', '-A']);

  const files = staged.split('\n');
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  git(['commit', '-m', `sync: ${stamp}`]);
  try {
    git(['push']);
    console.log(c.green(`  pushed ${files.length} file(s)`));
    files.slice(0, 6).forEach((f) => console.log(c.dim(`    ${f}`)));
    if (files.length > 6) console.log(c.dim(`    ...and ${files.length - 6} more`));
  } catch (e) {
    console.log(c.red('  committed, but push failed:'), String(e.stderr ?? e.message).trim().split('\n')[0]);
  }
}

if (!existsSync(join(ROOT, '.git'))) {
  console.error(c.red('Not a git repository.'));
  process.exit(1);
}

if (WATCH) {
  console.log(c.yellow(`Watching for new exports every ${INTERVAL_MS / 1000}s. Ctrl+C to stop.`));
  const tick = () => {
    if (findExport()) syncOnce();
  };
  tick();
  setInterval(tick, INTERVAL_MS);
} else {
  syncOnce();
}
