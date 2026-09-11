/**
 * Plan arithmetic - pure, so it can be tested without a DOM.
 *
 * The learner pins two of {start, finish, per-day} and the third follows.
 * `mode` records which of finish/per-day was pinned last, and every projection
 * is measured against the finish date they actually chose.
 */

import type { PlanConfig, ProgressMap } from '@/types';
import { LC150 } from '@/data/lc150';
import { PLAN_ORDER, orderIndex } from './order';

export const DAY_MS = 86_400_000;

/* ---- date helpers (local-time, YYYY-MM-DD) ---- */

export function today(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function dateAdd(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY_MS,
  );
}

/* ---- the plan window ---- */

/** How many problems the learner is aiming for, clamped to the list. */
export function targetCount(plan: PlanConfig): number {
  return Math.min(LC150.length, Math.max(1, Number(plan.target) || LC150.length));
}

/** The targeted subset, taken from the interleaved order. */
export function targetList(plan: PlanConfig) {
  return PLAN_ORDER.slice(0, targetCount(plan));
}

export function inTarget(plan: PlanConfig, slug: string): boolean {
  return orderIndex(slug) < targetCount(plan);
}

export function daysNeeded(plan: PlanConfig): number {
  return Math.max(1, Math.ceil(targetCount(plan) / Math.max(1, plan.perDay)));
}

export function deriveEnd(plan: PlanConfig): string {
  return dateAdd(plan.start, daysNeeded(plan) - 1);
}

export function derivePerDay(plan: PlanConfig): number {
  const span = Math.max(1, daysBetween(plan.start, plan.end) + 1);
  return Math.max(1, Math.ceil(targetCount(plan) / span));
}

export function spanDays(plan: PlanConfig): number {
  return Math.max(1, daysBetween(plan.start, plan.end) + 1);
}

/** Make the derived field agree with the pinned one. Mutates and returns. */
export function syncPlan(plan: PlanConfig): PlanConfig {
  if (!plan.start) plan.start = today();
  plan.perDay = Math.max(1, Math.min(50, Number(plan.perDay) || 3));
  plan.target = targetCount(plan);
  if (plan.mode === 'end') {
    if (!plan.end || daysBetween(plan.start, plan.end) < 0) plan.end = deriveEnd(plan);
    plan.perDay = derivePerDay(plan);
  } else {
    plan.mode = 'perDay';
    plan.end = deriveEnd(plan);
  }
  return plan;
}

/* ---- progress and pace ---- */

export function isDone(progress: ProgressMap, slug: string): boolean {
  return Boolean(progress[slug]?.done);
}

export function solvedCount(plan: PlanConfig, progress: ProgressMap): number {
  return targetList(plan).reduce((n, p) => n + (isDone(progress, p.s) ? 1 : 0), 0);
}

export type PaceStatus = 'finished' | 'ahead' | 'ontrack' | 'behind';

export interface Pace {
  done: number;
  remaining: number;
  pct: number;
  deadline: string;
  /** Problems per day needed from today to still hit the finish date. */
  need: number;
  /** Projected finish at the observed pace, or null before the first solve. */
  projected: string | null;
  status: PaceStatus;
  /** How many problems behind schedule, when status is 'behind'. */
  behind: number;
}

export function computePace(plan: PlanConfig, progress: ProgressMap, now = today()): Pace {
  const total = targetCount(plan);
  const done = solvedCount(plan, progress);
  const remaining = total - done;
  const deadline = plan.end || deriveEnd(plan);
  const daysLeft = Math.max(0, daysBetween(now, deadline) + 1);
  const need = remaining > 0 ? (daysLeft > 0 ? Math.ceil(remaining / daysLeft) : remaining) : 0;

  const elapsed = Math.max(1, daysBetween(plan.start, now) + 1);
  const rate = done / elapsed;
  const projected = done > 0 && rate > 0 ? dateAdd(now, Math.max(0, Math.ceil(remaining / rate))) : null;

  // Scheduled through the end of yesterday, so today's batch is not "late" yet.
  const dayIndex = Math.max(0, daysBetween(plan.start, now));
  const scheduled = Math.min(total, dayIndex * plan.perDay);
  const behind = scheduled - done;

  let status: PaceStatus;
  if (remaining === 0) status = 'finished';
  else if (behind < 0) status = 'ahead';
  else if (behind === 0) status = 'ontrack';
  else status = 'behind';

  return {
    done,
    remaining,
    pct: Math.round((done / total) * 100),
    deadline,
    need,
    projected,
    status,
    behind: Math.max(0, behind),
  };
}
