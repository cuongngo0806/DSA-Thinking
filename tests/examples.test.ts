import { describe, expect, it } from 'vitest';
import { VIZ_EXAMPLES } from '@/features/visualizer/examples/registry';
import { validateViz } from '@/features/visualizer/validate';
import type { Visualization } from '@/features/visualizer/types';

const byKey = (k: string) => VIZ_EXAMPLES.find((e) => e.key === k)!.viz;
const lastResult = (v: Visualization) => v.steps.at(-1)?.result;

describe('built-in traces', () => {
  it.each(VIZ_EXAMPLES.map((e) => [e.key, e] as const))(
    '%s passes the same validator the AI output must pass',
    (_key, example) => {
      const r = validateViz(JSON.parse(JSON.stringify(example.viz)));
      expect(r.ok, r.ok ? '' : r.message).toBe(true);
    },
  );

  // The traces are produced by running the algorithm, so a wrong answer here
  // means the visualization would teach the wrong thing.
  it('trapping rain water settles on 6', () => {
    expect(lastResult(byKey('trapping-rain-water'))).toBe(6);
  });

  it('binary search finds 15 at index 6', () => {
    expect(lastResult(byKey('binary-search'))).toBe(6);
  });

  it('two sum returns the pair that adds to the target', () => {
    expect(lastResult(byKey('two-sum'))).toBe('[0, 1]');
  });

  it('valid parentheses accepts a balanced string', () => {
    expect(lastResult(byKey('valid-parentheses'))).toBe(true);
  });

  it('reverse linked list ends holding the new head', () => {
    expect(lastResult(byKey('reverse-linked-list'))).toBe(5);
  });

  it('BFS visits level by level', () => {
    expect(lastResult(byKey('bfs'))).toBe('A B C D E F');
  });

  it('DFS dives before it backtracks', () => {
    expect(lastResult(byKey('dfs'))).toBe('A C F B E D');
  });
});

describe('trace quality', () => {
  it.each(VIZ_EXAMPLES.map((e) => [e.key, e] as const))(
    '%s never collapses iterations into a summary',
    (_key, example) => {
      // Collapsing loops is the one failure mode that destroys the point of a
      // trace, so look for the language that betrays it. Step *count* is not a
      // useful proxy: two-sum legitimately returns at i=1.
      const SUMMARISING = /(and so on|repeat (?:for|the)|remaining elements|etc\.)/i;
      for (const step of example.viz.steps) {
        expect(SUMMARISING.test(step.description), `step ${step.id}: "${step.description}"`).toBe(false);
      }
    },
  );

  it.each(VIZ_EXAMPLES.map((e) => [e.key, e] as const))(
    '%s emits at least one step per element of its input',
    (_key, example) => {
      const input = example.viz.input?.value;
      const size = Array.isArray(input) ? input.length : typeof input === 'string' ? input.length : 1;
      expect(example.viz.steps.length).toBeGreaterThanOrEqual(Math.min(size, 4));
    },
  );

  it.each(VIZ_EXAMPLES.map((e) => [e.key, e] as const))(
    '%s carries full component state on every step',
    (_key, example) => {
      const declared = new Set(example.viz.components.map((c) => c.id));
      for (const step of example.viz.steps) {
        expect(step.components, `step ${step.id} has no components`).toBeDefined();
        for (const state of step.components!) {
          expect(declared.has(state.id)).toBe(true);
        }
      }
    },
  );

  it.each(VIZ_EXAMPLES.map((e) => [e.key, e] as const))(
    '%s explains itself in both languages and names its relation',
    (_key, example) => {
      expect(example.expl?.vi.intuition, 'missing vi intuition').toBeTruthy();
      expect(example.expl?.en.intuition, 'missing en intuition').toBeTruthy();
      expect(example.expl?.vi.approach.length).toBeGreaterThan(1);
      expect(example.rel).toBeTruthy();
    },
  );

  it('has unique keys', () => {
    const keys = VIZ_EXAMPLES.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
