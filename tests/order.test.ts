import { describe, expect, it } from 'vitest';
import { PLAN_ORDER, orderIndex } from '@/features/roadmap/order';
import { LC150 } from '@/data/lc150';

describe('study order', () => {
  it('covers every problem exactly once', () => {
    expect(PLAN_ORDER).toHaveLength(LC150.length);
    expect(new Set(PLAN_ORDER.map((p) => p.s)).size).toBe(LC150.length);
  });

  it('is deterministic', () => {
    expect(PLAN_ORDER.map((p) => p.s)).toEqual(PLAN_ORDER.map((p) => p.s));
  });

  // The whole point: a day's batch must not be one topic in a row, or you learn
  // to recognise the pattern from its neighbours instead of from the problem.
  it('interleaves topics rather than marching through one', () => {
    const firstTen = PLAN_ORDER.slice(0, 10).map((p) => p.g);
    expect(new Set(firstTen).size).toBeGreaterThanOrEqual(8);
  });

  it('ramps difficulty within a topic, easiest first', () => {
    const weight = { E: 0, M: 1, H: 2 } as const;
    const byGroup = new Map<string, number[]>();
    PLAN_ORDER.forEach((p) => {
      if (!byGroup.has(p.g)) byGroup.set(p.g, []);
      byGroup.get(p.g)!.push(weight[p.d]);
    });
    for (const [group, weights] of byGroup) {
      const sorted = [...weights].sort((a, b) => a - b);
      expect(weights, `${group} is not easy-to-hard`).toEqual(sorted);
    }
  });

  it('gives every problem a position', () => {
    LC150.forEach((p) => expect(orderIndex(p.s)).toBeLessThan(LC150.length));
  });
});
