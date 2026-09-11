import { describe, expect, it } from 'vitest';
import {
  computePace, dateAdd, daysBetween, derivePerDay, deriveEnd,
  spanDays, syncPlan, targetCount,
} from '@/features/roadmap/plan';
import { defaultPlan } from '@/core/db';
import type { PlanConfig, ProgressMap } from '@/types';
import { PLAN_ORDER } from '@/features/roadmap/order';

const plan = (over: Partial<PlanConfig> = {}): PlanConfig => ({
  ...defaultPlan(),
  start: '2026-01-01',
  ...over,
});

describe('dates', () => {
  it('adds and subtracts across a month boundary', () => {
    expect(dateAdd('2026-01-31', 1)).toBe('2026-02-01');
    expect(dateAdd('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('measures inclusive-exclusive day gaps', () => {
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
  });
});

describe('plan window', () => {
  it('derives the finish date when problems-per-day is pinned', () => {
    const p = syncPlan(plan({ perDay: 5, target: 150, mode: 'perDay' }));
    expect(spanDays(p)).toBe(30); // 150 / 5
    expect(p.end).toBe('2026-01-30');
  });

  it('derives problems-per-day when the finish date is pinned', () => {
    const p = syncPlan(plan({ end: '2026-03-31', target: 150, mode: 'end' }));
    expect(spanDays(p)).toBe(90);
    expect(p.perDay).toBe(2); // ceil(150 / 90)
  });

  it('demands more per day as the deadline tightens', () => {
    const p = syncPlan(plan({ end: '2026-01-15', target: 150, mode: 'end' }));
    expect(p.perDay).toBe(10); // 150 over 15 days
  });

  it('scopes the plan to the target count', () => {
    const p = syncPlan(plan({ perDay: 5, target: 75, mode: 'perDay' }));
    expect(targetCount(p)).toBe(75);
    expect(spanDays(p)).toBe(15); // 75 / 5, not 150 / 5
  });

  it('clamps a target beyond the list back to the list size', () => {
    expect(targetCount(plan({ target: 9999 }))).toBe(PLAN_ORDER.length);
  });

  it('repairs a finish date that precedes the start', () => {
    const p = syncPlan(plan({ end: '2025-12-01', mode: 'end' }));
    expect(daysBetween(p.start, p.end)).toBeGreaterThanOrEqual(0);
  });

  it('round-trips: deriving one from the other is stable', () => {
    const p = plan({ perDay: 6, target: 120 });
    p.end = deriveEnd(p);
    expect(derivePerDay(p)).toBe(6);
  });
});

describe('pace', () => {
  const solved = (n: number): ProgressMap =>
    Object.fromEntries(
      PLAN_ORDER.slice(0, n).map((p) => [p.s, { done: true, date: '2026-01-01' }]),
    );

  it('reports finished only when the target is met, not the whole list', () => {
    const p = syncPlan(plan({ target: 10, perDay: 1 }));
    expect(computePace(p, solved(10), '2026-01-05').status).toBe('finished');
  });

  it('measures against the chosen finish date, not a fixed horizon', () => {
    const p = syncPlan(plan({ end: '2026-01-10', target: 100, mode: 'end' }));
    const pace = computePace(p, {}, '2026-01-01');
    expect(pace.deadline).toBe('2026-01-10');
    expect(pace.need).toBe(10); // 100 remaining over 10 days left
  });

  it('calls out being behind schedule with a count', () => {
    const p = syncPlan(plan({ perDay: 3, target: 150 }));
    const pace = computePace(p, solved(2), '2026-01-06'); // 5 days elapsed -> 15 due
    expect(pace.status).toBe('behind');
    expect(pace.behind).toBe(13);
  });

  it('recognises being ahead', () => {
    const p = syncPlan(plan({ perDay: 1, target: 150 }));
    expect(computePace(p, solved(9), '2026-01-05').status).toBe('ahead');
  });

  it('offers no projection before the first solve', () => {
    const p = syncPlan(plan());
    expect(computePace(p, {}, '2026-01-05').projected).toBeNull();
  });
});
