/**
 * Git sync, driven from the Settings panel.
 *
 * The browser cannot run git, so it asks the local server, which does. That is
 * the whole trick - and the reason this needs `npm run dev` or `npm start`
 * rather than a static build. When the API is absent the panel says so plainly
 * instead of offering a button that cannot work.
 *
 * Pushing carries both halves: the database and the app source, one history.
 */

import { must, esc } from '@/core/dom';
import { locale, t, tf } from '@/core/i18n';
import { db, merge, personalCounts, toFile } from '@/core/db';

export interface SyncStatus {
  configured: boolean;
  repoDir?: string;
  file?: string;
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
  error?: string;
  nothingToCommit?: boolean;
  commit?: string;
  files?: string[];
  appPushed?: boolean;
  appFileCount?: number;
}

interface PullResult {
  ok: boolean;
  error?: string;
  state?: { data?: unknown } | null;
  updatedAt?: string | null;
  appUpdated?: boolean;
  note?: string;
}

/** Set when the server is not there - a static build has no git. */
let unavailable = false;

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

function setStatus(cls: string, text: string): void {
  const el = must('#gitStatus');
  el.className = `status ${cls}`;
  el.removeAttribute('data-i18n');
  el.textContent = text;
}

function busy(on: boolean): void {
  ['#gitPush', '#gitPull', '#gitRefresh'].forEach((sel) => {
    (must(sel) as HTMLButtonElement).disabled = on;
  });
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(locale());
}

/** What would become public if this repo is. */
function renderPrivacyNote(): string {
  const { messages, logs, notes } = personalCounts();
  if (messages + logs + notes === 0) return '';
  return `<p class="git-privacy">${esc(
    tf('git_privacy_note', { m: messages, l: logs, n: notes }),
  )}</p>`;
}

export function renderSyncPanel(status: SyncStatus | null): void {
  const box = must('#gitDetail');
  if (unavailable) {
    box.innerHTML = `<p class="git-hint">${t('git_no_server_help')}</p>`;
    return;
  }
  if (!status) {
    box.innerHTML = `<p class="git-hint">${esc(t('git_checking'))}</p>`;
    return;
  }
  if (!status.configured) {
    box.innerHTML = `<p class="git-hint err">${esc(status.error ?? t('git_not_repo'))}</p>`;
    return;
  }

  const rows: string[] = [
    `<div class="git-row"><span>${esc(t('git_branch_lbl'))}</span><b>${esc(status.branch ?? '')}</b></div>`,
    `<div class="git-row"><span>${esc(t('git_file_lbl'))}</span><b>${esc(status.file ?? '')}</b></div>`,
  ];
  if (status.offline) {
    rows.push(`<div class="git-row warn"><span>${esc(t('git_offline'))}</span><b>${esc(status.error ?? '')}</b></div>`);
  } else {
    rows.push(
      `<div class="git-row"><span>${esc(t('git_remote_data'))}</span><b>${
        status.remoteExists ? esc(fmtTime(status.remoteUpdatedAt)) : esc(t('git_remote_none'))
      }</b></div>`,
    );
    if (status.behind) {
      rows.push(`<div class="git-row warn"><span>${esc(t('git_behind'))}</span><b>${status.behind}</b></div>`);
    }
    if (status.ahead) {
      rows.push(`<div class="git-row"><span>${esc(t('git_ahead'))}</span><b>${status.ahead}</b></div>`);
    }
  }
  const dirty = status.dirty ?? [];
  if (dirty.length) {
    rows.push(
      `<div class="git-row"><span>${esc(t('git_uncommitted'))}</span><b>${dirty.length}</b></div>`,
    );
  }
  if (status.lastCommit) {
    rows.push(`<div class="git-row"><span>${esc(t('git_last_commit'))}</span><b>${esc(status.lastCommit)}</b></div>`);
  }

  box.innerHTML = rows.join('') + renderPrivacyNote();
}

export async function refreshStatus(): Promise<void> {
  renderSyncPanel(null);
  try {
    const status = await api<SyncStatus>('status');
    renderSyncPanel(status);
    setStatus(status.configured ? 'ok' : 'err', status.configured ? t('git_ready') : t('git_not_repo'));
  } catch (e) {
    renderSyncPanel(null);
    setStatus('err', (e as Error).message);
  }
}

export async function doPush(): Promise<void> {
  busy(true);
  setStatus('wait', t('git_pushing'));
  try {
    const result = await api<PushResult>('push', {
      method: 'POST',
      body: JSON.stringify({ state: toFile() }),
    });
    if (result.nothingToCommit) {
      setStatus('ok', t('git_nothing'));
    } else {
      const app = result.appPushed ? tf('git_with_app', { n: result.appFileCount ?? 0 }) : '';
      setStatus('ok', `${t('git_pushed')} ${result.commit ?? ''} ${app}`.trim());
    }
    await refreshStatus();
  } catch (e) {
    setStatus('err', (e as Error).message);
  } finally {
    busy(false);
  }
}

export async function doPull(): Promise<void> {
  busy(true);
  setStatus('wait', t('git_pulling'));
  try {
    const result = await api<PullResult>('pull', { method: 'POST' });
    if (result.note) {
      setStatus('ok', result.note);
    } else if (result.state) {
      // Union merge, never overwrite: work done on this machine survives.
      merge((result.state.data ?? result.state) as Parameters<typeof merge>[0]);
      const app = result.appUpdated ? ` ${t('git_app_updated')}` : '';
      setStatus('ok', `${t('git_pulled')} ${fmtTime(result.updatedAt)}.${app}`);
    }
    await refreshStatus();
  } catch (e) {
    setStatus('err', (e as Error).message);
  } finally {
    busy(false);
  }
}

export function initGitSync(): void {
  must('#gitPush').addEventListener('click', () => void doPush());
  must('#gitPull').addEventListener('click', () => void doPull());
  must('#gitRefresh').addEventListener('click', () => void refreshStatus());
  // Only look the server up when the panel is actually opened.
  must('#setTabs').addEventListener('click', (ev) => {
    const el = ev.target as HTMLElement;
    if (el.dataset.st === 'git' && !unavailable) void refreshStatus();
  });
}

/** Exposed for the "unsaved work" hint on the settings button. */
export const hasUnpushedWork = (): boolean =>
  db().log.length > 0 || Object.keys(db().progress).length > 0;
