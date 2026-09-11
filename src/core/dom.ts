/** Minimal DOM helpers. The app renders with template strings, not a framework. */

export function $<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) {
  return root.querySelector<T>(sel);
}

/** Like {@link $} but throws when missing, for elements the markup guarantees. */
export function must<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Expected element ${sel} to exist`);
  return el;
}

export function $$<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) {
  return Array.from(root.querySelectorAll<T>(sel));
}

/** Escape for interpolation into a template string that becomes innerHTML. */
export function esc(value: unknown): string {
  return String(value).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  );
}

/** Escape, then honour **bold** markers. Used for AI replies and trigger copy. */
export function mdBold(value: unknown): string {
  return esc(value).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

/** Render a JSON-ish value for display. */
export function fmtValue(v: unknown): string {
  if (v === null) return 'null';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

export function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | null,
  type: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
): void {
  el?.addEventListener(type, handler as EventListener);
}

/** Wire a click handler onto every match. */
export function onClick(sel: string, handler: (el: HTMLElement, ev: MouseEvent) => void): void {
  $$(sel).forEach((el) => el.addEventListener('click', (ev) => handler(el, ev as MouseEvent)));
}

/** Trigger a browser download of a text payload. */
export function downloadText(text: string, name: string, type = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(value: unknown, name: string): void {
  downloadText(JSON.stringify(value, null, 2), name, 'application/json');
}

type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * A form control the markup guarantees.
 *
 * Defaults to `HTMLInputElement` because that covers everything we read -
 * `value`, `checked`, `files` - and every control we touch this way exposes
 * `value`. Pass the precise type when you need something input-specific.
 */
export function field<T extends FormControl = HTMLInputElement>(
  sel: string,
  root: ParentNode = document,
): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Expected form control ${sel} to exist`);
  return el;
}

/** A button the markup guarantees, for toggling `disabled`. */
export function button(sel: string, root: ParentNode = document): HTMLButtonElement {
  const el = root.querySelector<HTMLButtonElement>(sel);
  if (!el) throw new Error(`Expected button ${sel} to exist`);
  return el;
}
