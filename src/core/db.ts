/**
 * The database.
 *
 * One JSON document holds everything the learner accumulates. It lives in three
 * places and moves between them deliberately:
 *
 *   localStorage      the working copy, written on every change
 *   data/store.json   the committed copy, versioned by git alongside the code
 *
 * The local server moves data between them, because a page can neither run git
 * nor write into the repo folder.
 *
 * Merging is always a union: syncing must never silently drop work done on the
 * other machine, so the rule is "keep both" wherever two copies disagree.
 */

import type {
  ActivityMap,
  ChatSession,
  LogEntry,
  PlanConfig,
  ProblemProgress,
  ProgressMap,
  SavedVisualization,
  StoreData,
  StoreFile,
  UserTrigger,
} from '@/types';
import { KEYS, read, write } from './storage';

export const SCHEMA_VERSION = 2;
export const DATA_FILE = 'store.json';
/** Where the committed copy lives, relative to the built app. */
export const REPO_DATA_URL = './data/store.json';

export function defaultPlan(): PlanConfig {
  return { start: '', end: '', perDay: 3, mode: 'perDay', target: 150, username: '' };
}

export function emptyStore(): StoreData {
  return {
    plan: defaultPlan(),
    progress: {},
    activity: {},
    triggers: [],
    log: [],
    chats: [],
    visualizations: [],
  };
}

let store: StoreData = emptyStore();
const listeners = new Set<() => void>();

/** Read-only access to the working copy. */
export function db(): StoreData {
  return store;
}

/** Subscribe to "something changed, re-render". Returns an unsubscribe fn. */
export function onChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Persist the working copy and notify views. */
export function commit(): void {
  write(KEYS.store, store);
  write(KEYS.lastSaved, Date.now());
  listeners.forEach((fn) => fn());
}

/** Mutate the store and persist in one step. */
export function update(fn: (d: StoreData) => void): void {
  fn(store);
  commit();
}

/* ------------------------------------------------------------------ *
 * Loading
 * ------------------------------------------------------------------ */

/** v1 kept one localStorage key per feature; fold those into the single store. */
function migrateLegacy(): StoreData | null {
  const plan = read<Record<string, unknown> | null>('dsac_lc_cfg', null);
  const progress = read<ProgressMap | null>('dsac_lc_progress', null);
  const activity = read<ActivityMap | null>('dsac_lc_activity', null);
  const triggers = read<UserTrigger[] | null>('dsac_userdict', null);
  const log = read<LogEntry[] | null>('dsac_log', null);
  const chats = read<ChatSession[] | null>('dsac_chats', null);
  const viz = read<SavedVisualization[] | null>('dsac_viz_saved', null);
  if (!plan && !progress && !activity && !triggers && !log && !chats && !viz) return null;

  const migrated = emptyStore();
  if (plan) migrated.plan = { ...migrated.plan, ...(plan as Partial<PlanConfig>) };
  if (progress) migrated.progress = progress;
  if (activity) migrated.activity = activity;
  if (triggers) migrated.triggers = triggers;
  if (log) migrated.log = log;
  if (chats) migrated.chats = chats;
  if (viz) migrated.visualizations = viz;
  return migrated;
}

/** Fill in anything a stored document predates. */
function normalise(d: Partial<StoreData> | null): StoreData {
  const base = emptyStore();
  if (!d) return base;
  return {
    plan: { ...base.plan, ...(d.plan ?? {}) },
    progress: d.progress ?? {},
    activity: d.activity ?? {},
    triggers: d.triggers ?? [],
    log: d.log ?? [],
    chats: d.chats ?? [],
    visualizations: d.visualizations ?? [],
  };
}

export function load(): StoreData {
  const stored = read<Partial<StoreData> | null>(KEYS.store, null);
  if (stored) {
    store = normalise(stored);
    return store;
  }
  const legacy = migrateLegacy();
  store = legacy ?? emptyStore();
  if (legacy) commit(); // keep the upgrade, so this only happens once
  return store;
}

/**
 * Seed from the copy committed in the repo, so a fresh clone opens with your
 * data already in it. Only ever merges - it must never clobber work that is
 * already in this browser.
 *
 * Asks the local server first, because it reads the repo directly and so works
 * the same under `npm run dev` and `npm start`. The static path is the fallback
 * for a build served without a server.
 */
export async function bootstrapFromRepo(): Promise<boolean> {
  const sources: Array<() => Promise<StoreFile | null>> = [
    async () => {
      const res = await fetch('/api/sync/data', { cache: 'no-store' });
      if (!res.ok) return null;
      const body = (await res.json()) as { state?: StoreFile | null };
      return body?.state ?? null;
    },
    async () => {
      const res = await fetch(REPO_DATA_URL, { cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()) as StoreFile;
    },
  ];

  for (const load of sources) {
    try {
      const file = await load();
      if (file?.app !== 'dsa-compass' || !file.data) continue;
      merge(file.data);
      return true;
    } catch {
      // try the next source; no committed copy yet is a normal first run
    }
  }
  return false;
}

/* ------------------------------------------------------------------ *
 * Export / import
 * ------------------------------------------------------------------ */

export function toFile(): StoreFile {
  return {
    app: 'dsa-compass',
    schema: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    data: store,
  };
}

/** Count the entries that would be personally identifying if made public. */
export function personalCounts(d: StoreData = store) {
  const messages = d.chats.reduce((n, c) => n + (c.msgs?.length ?? 0), 0);
  const notes = Object.values(d.progress).filter((p) => p.note).length;
  return { messages, logs: d.log.length, notes };
}

/** Union-merge a remote document into the working copy, then persist. */
export function merge(remote: Partial<StoreData> | null | undefined): void {
  if (!remote) return;
  const d = normalise(remote);

  for (const [slug, incoming] of Object.entries(d.progress)) {
    store.progress[slug] = pickProgress(store.progress[slug], incoming);
  }
  for (const [day, count] of Object.entries(d.activity)) {
    store.activity[day] = Math.max(store.activity[day] ?? 0, Number(count) || 0);
  }

  const triggerKey = (t: UserTrigger) => `${t.signal}|${t.tool}`;
  const seenTriggers = new Set(store.triggers.map(triggerKey));
  d.triggers.forEach((t) => {
    if (!seenTriggers.has(triggerKey(t))) {
      store.triggers.push(t);
      seenTriggers.add(triggerKey(t));
    }
  });

  const logKey = (l: LogEntry) => `${l.problem}|${l.trigger}|${l.date}`;
  const seenLogs = new Set(store.log.map(logKey));
  d.log.forEach((l) => {
    if (!seenLogs.has(logKey(l))) {
      store.log.push(l);
      seenLogs.add(logKey(l));
    }
  });

  // Same conversation on two machines: keep whichever went further.
  const byId = new Map(store.chats.map((c) => [c.id, c]));
  d.chats.forEach((c) => {
    const mine = byId.get(c.id);
    if (!mine || (c.msgs?.length ?? 0) > (mine.msgs?.length ?? 0)) byId.set(c.id, c);
  });
  store.chats = [...byId.values()].sort((a, b) => (b.at ?? 0) - (a.at ?? 0));

  const seenViz = new Set(store.visualizations.map((v) => v.id));
  d.visualizations.forEach((v) => {
    if (v?.id && !seenViz.has(v.id)) {
      store.visualizations.push(v);
      seenViz.add(v.id);
    }
  });
  store.visualizations.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));

  if (remote.plan) store.plan = { ...store.plan, ...remote.plan };
  commit();
}

/** Solved beats unsolved; otherwise the more recent record wins. */
function pickProgress(mine: ProblemProgress | undefined, theirs: ProblemProgress): ProblemProgress {
  if (!mine) return theirs;
  if (mine.done && !theirs.done) return mine;
  if (!mine.done && theirs.done) return theirs;
  return (theirs.date ?? '') > (mine.date ?? '') ? theirs : mine;
}

/** Accept a `StoreFile`, or a bare `StoreData` from a hand-edited file. */
export function mergeFile(parsed: unknown): void {
  const asFile = parsed as StoreFile;
  merge(asFile?.data ?? (parsed as StoreData));
}
