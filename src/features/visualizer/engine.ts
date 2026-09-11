/* Playback: pure step arithmetic plus the timer that drives it. Advancing is a
   fixed interval scaled by speed, so a replay is identical on any machine. */

export const PLAYBACK_SPEEDS = [0.5, 1, 2] as const;
export const BASE_STEP_MS = 900;

export const stepIntervalMs = (speed: number): number =>
  Math.round(BASE_STEP_MS / (speed > 0 ? speed : 1));

export function clampStep(step: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, Math.trunc(step)));
}

export const isFirst = (step: number): boolean => step <= 0;
export const isLast = (step: number, total: number): boolean => step >= total - 1;

/** Progress through the timeline, 0..1 - what the scrubber shows. */
export function progressFraction(step: number, total: number): number {
  return total <= 1 ? 0 : clampStep(step, total) / (total - 1);
}


