import { describe, expect, it } from 'vitest';
import { extractJson, validateViz } from '@/features/visualizer/validate';

const good = () => ({
  title: 'T',
  algorithm: 'A',
  components: [
    { type: 'array', id: 'a' },
    { type: 'variables', id: 'v' },
  ],
  sourceCode: { language: 'cpp', code: 'l1\nl2\nl3' },
  steps: [
    {
      id: 0,
      description: 'd',
      codeLine: 2,
      components: [
        { type: 'array', id: 'a', values: [1, 2] },
        { type: 'variables', id: 'v', values: { i: 0 } },
      ],
      highlights: [{ component: 'a', indices: [0], role: 'active' }],
    },
  ],
});

const fail = (mutate: (o: any) => void): string => {
  const o = good();
  mutate(o);
  const r = validateViz(o);
  expect(r.ok).toBe(false);
  return r.ok ? '' : r.message;
};

describe('validateViz', () => {
  it('accepts a well-formed spec', () => {
    expect(validateViz(good()).ok).toBe(true);
  });

  // The message is handed straight back to the model to repair, so it has to
  // name the exact field rather than say "invalid".
  it('names a component id that the steps invented', () => {
    expect(fail((o) => { o.steps[0].components[0].id = 'ghost'; }))
      .toBe('steps[0].components[0].id "ghost" is not declared in the root "components" array.');
  });

  it('names a highlight pointing at nothing', () => {
    expect(fail((o) => { o.steps[0].highlights[0].component = 'ghost'; }))
      .toContain('steps[0].highlights[0].component "ghost"');
  });

  it('catches a code line past the end of the source', () => {
    expect(fail((o) => { o.steps[0].codeLine = 99; }))
      .toBe('steps[0].codeLine is 99, outside the source range 1..3.');
  });

  it('rejects an unknown component type', () => {
    expect(fail((o) => { o.components[0].type = 'blah'; })).toContain('is not one of');
  });

  it('rejects duplicate component ids', () => {
    expect(fail((o) => { o.components[1].id = 'a'; })).toContain('duplicated');
  });

  it('requires steps', () => {
    expect(fail((o) => { delete o.steps; })).toBe('"steps" must be a non-empty array.');
  });

  it('requires a title', () => {
    expect(fail((o) => { o.title = ''; })).toContain('"title"');
  });

  it('rejects a non-object root', () => {
    expect(validateViz('nope').ok).toBe(false);
    expect(validateViz([]).ok).toBe(false);
  });

  it('checks the values a structure must carry', () => {
    expect(fail((o) => { delete o.steps[0].components[0].values; })).toContain('.values must be an array');
  });
});

describe('extractJson', () => {
  it('unwraps a fenced block', () => {
    expect(extractJson('here:\n```json\n{"a":1}\n```\nthanks')).toBe('{"a":1}');
  });

  it('finds the object inside surrounding prose', () => {
    expect(extractJson('Sure! {"a":1} hope that helps')).toBe('{"a":1}');
  });

  it('passes clean JSON through', () => {
    expect(extractJson('{"a":1}')).toBe('{"a":1}');
  });
});
