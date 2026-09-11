/** Streak arithmetic over the activity map - pure, so it is directly testable. */

import type { ActivityMap } from '@/types';
import { dateAdd, daysBetween, today } from './plan';

export interface Streak {
  /** Consecutive active days ending today (or yesterday, see below). */
  current: number;
  longest: number;
}

export function computeStreak(activity: ActivityMap, now = today()): Streak {
  // A streak survives "not yet today": it only breaks once yesterday is missed
  // too, otherwise the counter would read 0 every morning.
  let day = activity[now] ? now : dateAdd(now, -1);
  let current = 0;
  while (activity[day]) {
    current += 1;
    day = dateAdd(day, -1);
  }

  const days = Object.keys(activity)
    .filter((d) => activity[d] > 0)
    .sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = d;
  }

  return { current, longest };
}

/** The last `days` dates ending today, oldest first - the strip's x-axis. */
export function recentDays(days: number, now = today()): string[] {
  return Array.from({ length: days }, (_, i) => dateAdd(now, -(days - 1 - i)));
}

/** Shading bucket (1-3) for a day's activity count. */
export function intensity(count: number): 1 | 2 | 3 {
  return Math.min(3, Math.ceil(count / 2)) as 1 | 2 | 3;
}
