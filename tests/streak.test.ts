import { describe, expect, it } from 'vitest';
import { computeStreak, intensity, recentDays } from '@/features/roadmap/streak';

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    const activity = { '2026-01-08': 1, '2026-01-09': 2, '2026-01-10': 1 };
    expect(computeStreak(activity, '2026-01-10').current).toBe(3);
  });

  it('survives a day that has not been worked yet', () => {
    // Otherwise the counter would read zero every morning and punish nobody's fault.
    const activity = { '2026-01-08': 1, '2026-01-09': 1 };
    expect(computeStreak(activity, '2026-01-10').current).toBe(2);
  });

  it('breaks once yesterday is missed too', () => {
    const activity = { '2026-01-07': 1, '2026-01-08': 1 };
    expect(computeStreak(activity, '2026-01-10').current).toBe(0);
  });

  it('finds the longest run anywhere in the history', () => {
    const activity = {
      '2026-01-01': 1, '2026-01-02': 1, '2026-01-03': 1, '2026-01-04': 1, '2026-01-05': 1,
      '2026-01-09': 1, '2026-01-10': 1,
    };
    const s = computeStreak(activity, '2026-01-10');
    expect(s.longest).toBe(5);
    expect(s.current).toBe(2);
  });

  it('ignores days recorded with no activity', () => {
    expect(computeStreak({ '2026-01-10': 0 }, '2026-01-10').longest).toBe(0);
  });

  it('is empty for an untouched history', () => {
    expect(computeStreak({}, '2026-01-10')).toEqual({ current: 0, longest: 0 });
  });
});

describe('strip', () => {
  it('gives 30 days ending today, oldest first', () => {
    const days = recentDays(30, '2026-01-30');
    expect(days).toHaveLength(30);
    expect(days[0]).toBe('2026-01-01');
    expect(days.at(-1)).toBe('2026-01-30');
  });

  it('buckets activity into three shades', () => {
    expect(intensity(1)).toBe(1);
    expect(intensity(4)).toBe(2);
    expect(intensity(99)).toBe(3);
  });
});
