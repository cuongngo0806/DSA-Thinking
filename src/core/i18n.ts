/**
 * Bilingual interface.
 *
 * Every user-visible string is keyed. `vi.ts` and `en.ts` must stay key-for-key
 * identical; `tests/i18n.test.ts` enforces that so a half-translated release
 * cannot ship.
 *
 * Static markup opts in with `data-i18n="key"` (innerHTML, so a value may carry
 * inline markup) and `data-i18n-attr="attr:key"` for attributes. Dynamically
 * rendered views call {@link t} directly.
 *
 * Note: a `data-i18n` element must not contain another `data-i18n` element -
 * the parent's innerHTML replaces the child before it is ever filled.
 */

import type { Bilingual, Lang } from '@/types';
import { $$ } from './dom';
import { KEYS, read, write } from './storage';
import { en } from '@/data/locales/en';
import { vi } from '@/data/locales/vi';

export type MessageKey = keyof typeof en;

const TABLES: Record<Lang, Record<string, string>> = { vi, en };

let current: Lang = normalise(read<string>(KEYS.lang, 'en'));

function normalise(value: string): Lang {
  return value === 'vi' ? 'vi' : 'en';
}

export function lang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  current = normalise(next);
  write(KEYS.lang, current);
}

export function toggleLang(): Lang {
  setLang(current === 'vi' ? 'en' : 'vi');
  return current;
}

/** Look up a key in the active language, falling back to English. */
export function t(key: MessageKey | string): string {
  return TABLES[current][key] ?? TABLES.en[key] ?? String(key);
}

/** Fill `{name}` placeholders. */
export function tf(key: MessageKey | string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (out, [k, v]) => out.replace(`{${k}}`, String(v)),
    t(key),
  );
}

/** Pick the active language out of a bilingual value from the data modules. */
export function tx(value: Bilingual | undefined): string {
  if (!value) return '';
  return value[current] ?? value.en ?? '';
}

/** Locale tag for Intl formatting. */
export function locale(): string {
  return current === 'vi' ? 'vi-VN' : 'en-US';
}

/** Apply translations to every `data-i18n` element currently in the document. */
export function applyStatic(): void {
  document.documentElement.lang = current;
  document.title = t('title');
  $$('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.innerHTML = t(key);
  });
  $$('[data-i18n-attr]').forEach((el) => {
    el.getAttribute('data-i18n-attr')
      ?.split(';')
      .forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
  });
}
