/**
 * localStorage access.
 *
 * Every read and write is guarded: the app must keep working when storage is
 * unavailable (private windows, `data:` URLs, browsers set to block site data).
 * In that case values simply do not persist.
 */

export const KEYS = {
  lang: 'dsac_lang',
  theme: 'dsac_theme',
  topTab: 'dsac_top',
  subTabPractice: 'dsac_sub_p',
  subTabTheory: 'dsac_sub_t',
  ai: 'dsac_ai',
  store: 'dsac_store',
  lastSaved: 'dsac_last_saved',
  pushedHash: 'dsac_pushed_hash',
} as const;

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable - the session still works, it just will not persist */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
