/**
 * Git sync, sitting in the Practice tab where the work happens.
 *
 * The browser cannot run git, so it asks the local server, which does. That is
 * also why syncing needs `npm run dev` or `npm start` rather than a static
 * build - when the API is absent the bar says so instead of offering a button
 * that cannot work.
 *
 * The bar exists to answer two questions at the moments they matter:
 * "is someone else's work waiting for me?" when you sit down, and "would I lose
 * anything by closing this?" when you get up.
 */

import { $, must, esc } from '@/core/dom';
import { locale, t, tf } from '@/core/i18n';
import { hasUnpushedChanges, markPushed, merge, personalCounts, toFile } from '@/core/db';

export interface SyncStatus {
  configured: boolean;
  repoDir?: string;
  file?: string;
  appPaths?: string[];
  branch?: string;
  dirty?: string[];
  ahead?: number;
  behind?: number;
  offline?: boolean;
  remoteExists?: boolean;
  remoteUpdatedAt?: string | null;
  lastCommit?: string;
  error?: string;
}

interface PushResult {
  ok: boolean;
  nothingToCommit?: boolean;
  commit?: string;
  appPushed?: boolean;
  appFileCount?: number;
}

interface PullResult {
  ok: boolean;
  state?: { data?: unknown } | null;
  updatedAt?: string | null;
  appUpdated?: boolean;
  note?: string;
}

/** Set when the server is not there - a static build has no git. */
let unavailable = false;
let latest: SyncStatus | null = null;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/sync/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (res.status === 404) {
    unavailable = true;
    throw new Error(t('git_no_server'));
  }
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok && body?.error) throw new Error(body.error);
  return body;
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(locale());
}

function busy(on: boolean): void {
  ['#gitPull', '#gitPush', '#gitRefresh'].forEach((sel) => {
    const el = $(sel) as HTMLButtonElement | null;
    if (el) el.disabled = on;
  });
}

/* ---- the headline line ---- */

type Tone = 'ok' | 'warn' | 'act' | 'busy' | 'err';

function say(tone: Tone, message: string): void {
  must('#syncDot').className = `sync-dot ${tone}`;
  must('#syncMsg').textContent = message;
  must('#syncBar').dataset.tone = tone;
}

/**
 * One sentence about what to do next, in priority order: new work waiting to be
 * pulled beats work of yours waiting to be pushed.
 */
function describe(status: SyncStatus | null): void {
  if (unavailable) return say('warn', t('git_no_server'));
  if (!status) return say('busy', t('git_checking'));
  if (!status.configured) return say('err', status.error ?? t('git_not_repo'));
  if (status.offline) return say('warn', t('git_offline'));

  const behind = status.behind ?? 0;
  const mine = hasUnpushedChanges();
  const ahead = status.ahead ?? 0;

  if (behind > 0) return say('act', tf('git_behind_warn', { n: behind }));
  if (mine) return say('act', t('git_unpushed_warn'));
  if (ahead > 0) return say('act', tf('git_ahead_warn', { n: ahead }));
  return say('ok', t('git_in_sync'));
}

function renderDetail(status: SyncStatus | null): void {
  const box = $('#gitDetail');
  if (!box) return;
  if (unavailable) {
    box.innerHTML = `<p class="git-hint">${t('git_no_server_help')}</p>`;
    return;
  }
  if (!status?.configured) {
    box.innerHTML = `<p class="git-hint err">${esc(status?.error ?? t('git_not_repo'))}</p>`;
    return;
  }

  const row = (label: string, value: string, cls = '') =>
    `<div class="git-row ${cls}"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;

  const rows = [
    row(t('git_branch_lbl'), status.branch ?? ''),
    row(t('git_file_lbl'), status.file ?? ''),
    // Spelling out what "the app" means answers the obvious question the
    // single data-file row provokes.
    row(t('git_app_lbl'), (status.appPaths ?? []).join('  ')),
    row(t('git_remote_data'), status.remoteExists ? fmtTime(status.remoteUpdatedAt) : t('git_remote_none')),
  ];
  if (status.behind) rows.push(row(t('git_behind'), String(status.behind), 'warn'));
  if (status.ahead) rows.push(row(t('git_ahead'), String(status.ahead)));
  if (status.dirty?.length) rows.push(row(t('git_uncommitted'), String(status.dirty.length)));
  if (status.lastCommit) rows.push(row(t('git_last_commit'), status.lastCommit));

  const { messages, logs, notes } = personalCounts();
  const privacy =
    messages + logs + notes > 0
      ? `<p class="git-privacy">${esc(tf('git_privacy_note', { m: messages, l: logs, n: notes }))}</p>`
      : '';

  box.innerHTML = rows.join('') + privacy;
}

function paint(status: SyncStatus | null): void {
  describe(status);
  renderDetail(status);
}

export async function refreshStatus(announce = true): Promise<void> {
  if (announce) paint(null);
  try {
    latest = await api<SyncStatus>('status');
    paint(latest);
  } catch (e) {
    paint(null);
    if (!unavailable) say('err', (e as Error).message);
    else describe(null);
  }
}

export async function doPush(): Promise<void> {
  busy(true);
  say('busy', t('git_pushing'));
  try {
    const result = await api<PushResult>('push', {
      method: 'POST',
      body: JSON.stringify({ state: toFile() }),
    });
    markPushed(); // whatever is here now is on git
    if (result.nothingToCommit) {
      say('ok', t('git_nothing'));
    } else {
      const app = result.appPushed ? tf('git_with_app', { n: result.appFileCount ?? 0 }) : '';
      say('ok', `${t('git_pushed')} ${result.commit ?? ''} ${app}`.trim());
    }
    latest = await api<SyncStatus>('status');
    renderDetail(latest);
  } catch (e) {
    say('err', (e as Error).message);
  } finally {
    busy(false);
  }
}

export async function doPull(): Promise<void> {
  busy(true);
  say('busy', t('git_pulling'));
  try {
    let result: PullResult;
    try {
      result = await api<PullResult>('pull', { method: 'POST' });
    } catch (e) {
      // Pulling app source makes the dev server restart, which can kill the
      // in-flight response even though git already fast-forwarded. Re-check
      // before reporting a failure that did not happen.
      if (unavailable) throw e;
      await new Promise((r) => setTimeout(r, 1200));
      latest = await api<SyncStatus>('status');
      if ((latest.behind ?? 0) === 0) {
        say('ok', `${t('git_pulled')} ${t('git_app_updated')}`);
        renderDetail(latest);
        return;
      }
      throw e;
    }
    if (result.note) {
      say('ok', result.note);
    } else if (result.state) {
      // Union merge, never overwrite: work done on this machine survives.
      merge((result.state.data ?? result.state) as Parameters<typeof merge>[0]);
      const app = result.appUpdated ? ` ${t('git_app_updated')}` : '';
      say('ok', `${t('git_pulled')} ${fmtTime(result.updatedAt)}.${app}`);
    }
    latest = await api<SyncStatus>('status');
    renderDetail(latest);
  } catch (e) {
    say('err', (e as Error).message);
  } finally {
    busy(false);
  }
}

/** Re-evaluate the headline without hitting the network (e.g. after solving). */
export function refreshSyncLine(): void {
  if (must('#syncBar').hidden) return;
  describe(latest);
}

export function initGitSync(): void {
  must('#syncBar').hidden = false;
  must('#gitPull').addEventListener('click', () => void doPull());
  must('#gitPush').addEventListener('click', () => void doPush());
  must('#gitRefresh').addEventListener('click', () => void refreshStatus(true));

  // On open: is anyone else's work waiting? Ask once, quietly.
  void refreshStatus(true);

  // On close: never let a session of study vanish because a tab was shut.
  window.addEventListener('beforeunload', (ev) => {
    if (!hasUnpushedChanges()) return;
    ev.preventDefault();
    // Browsers show their own wording; returnValue is what triggers the prompt.
    ev.returnValue = t('git_leave_warn');
  });
}
