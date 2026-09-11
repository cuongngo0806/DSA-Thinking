/** Dark/light theme. The choice is stamped on <html> and read by tokens.css. */

import type { Theme } from '@/types';
import { KEYS, read, write } from './storage';

let current: Theme = read<Theme>(KEYS.theme, 'dark');

export function theme(): Theme {
  return current;
}

export function applyTheme(next: Theme = current): void {
  current = next;
  document.documentElement.setAttribute('data-theme', current);
  write(KEYS.theme, current);
}

export function toggleTheme(): Theme {
  applyTheme(current === 'dark' ? 'light' : 'dark');
  return current;
}

/** The glyph shown on the toggle button. */
export function themeGlyph(): string {
  return current === 'dark' ? '☾' : '☀';
}
