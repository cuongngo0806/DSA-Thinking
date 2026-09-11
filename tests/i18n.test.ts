import { describe, expect, it } from 'vitest';
import { en } from '@/data/locales/en';
import { vi } from '@/data/locales/vi';

/**
 * Keys that are intentionally blank in one language.
 *
 * `viz_narr` warns that the step narration stays in English - which is not
 * worth saying when the interface is already English.
 */
const INTENTIONALLY_BLANK: Record<string, string[]> = { en: ['viz_narr'] };

describe('locales', () => {
  // A half-translated release is worse than an untranslated one: the interface
  // ends up showing raw keys. Keep the two tables in lockstep.
  it('define exactly the same keys', () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
  });

  it('have no accidentally empty strings', () => {
    const blank = (table: Record<string, string>, label: string) =>
      Object.entries(table)
        .filter(([k, v]) => v.trim() === '' && !INTENTIONALLY_BLANK[label]?.includes(k))
        .map(([k]) => k);
    expect(blank(vi, 'vi')).toEqual([]);
    expect(blank(en, 'en')).toEqual([]);
  });

  it('keep placeholders consistent between languages', () => {
    const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(holes(vi[key]), `placeholders differ for "${String(key)}"`).toEqual(holes(en[key]));
    }
  });

  it('balance any inline markup they carry', () => {
    // Values are injected with innerHTML, so a stray tag would break the layout.
    // Opening tags may carry attributes, e.g. `<b style="...">`.
    const TAGS = ['b', 'code', 'span', 'i'];
    for (const [label, table] of [
      ['vi', vi],
      ['en', en],
    ] as const) {
      for (const [key, value] of Object.entries(table)) {
        for (const tag of TAGS) {
          const open = (value.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length;
          const close = (value.match(new RegExp(`</${tag}>`, 'g')) ?? []).length;
          expect(open, `unbalanced <${tag}> in ${label}.${key}`).toBe(close);
        }
      }
    }
  });
});
