import { beforeEach, describe, expect, it } from 'vitest';
import { commit, db, emptyStore, load, merge, personalCounts, toFile } from '@/core/db';
import type { StoreData } from '@/types';

function reset(seed: Partial<StoreData> = {}) {
  localStorage.clear();
  localStorage.setItem('dsac_store', JSON.stringify({ ...emptyStore(), ...seed }));
  load();
}

describe('store file', () => {
  beforeEach(() => reset());

  it('stamps the payload so a reader knows what it has', () => {
    const f = toFile();
    expect(f.app).toBe('dsa-compass');
    expect(f.schema).toBeGreaterThan(0);
    expect(Date.parse(f.updatedAt)).not.toBeNaN();
  });

  it('never carries secrets - the AI key and tokens stay out of the file', () => {
    localStorage.setItem('dsac_ai', JSON.stringify({ url: 'x', model: 'm', key: 'SECRET' }));
    expect(JSON.stringify(toFile())).not.toContain('SECRET');
  });
});

describe('merge', () => {
  beforeEach(() => reset());

  // Syncing must never punish the machine that did more work.
  it('keeps a solve from either side', () => {
    reset({ progress: { a: { done: true, date: '2026-01-01' } } });
    merge({ progress: { b: { done: true, date: '2026-01-02' } } } as Partial<StoreData>);
    expect(Object.keys(db().progress).sort()).toEqual(['a', 'b']);
  });

  it('prefers the solved record over an unsolved one', () => {
    reset({ progress: { a: { done: true, date: '2026-01-01' } } });
    merge({ progress: { a: { done: false } } } as Partial<StoreData>);
    expect(db().progress.a.done).toBe(true);
  });

  it('falls back to the newer record when both are solved', () => {
    reset({ progress: { a: { done: true, date: '2026-01-01', note: 'old' } } });
    merge({ progress: { a: { done: true, date: '2026-02-01', note: 'new' } } } as Partial<StoreData>);
    expect(db().progress.a.note).toBe('new');
  });

  it('takes the busier count for a shared day', () => {
    reset({ activity: { '2026-01-01': 2 } });
    merge({ activity: { '2026-01-01': 5, '2026-01-02': 1 } } as Partial<StoreData>);
    expect(db().activity).toEqual({ '2026-01-01': 5, '2026-01-02': 1 });
  });

  it('dedupes triggers rather than stacking copies', () => {
    const t = { rel: 'order' as const, signal: 's', tool: 't', why: 'w' };
    reset({ triggers: [t] });
    merge({ triggers: [t, { ...t, signal: 'other' }] } as Partial<StoreData>);
    expect(db().triggers).toHaveLength(2);
  });

  it('keeps the longer side of the same conversation', () => {
    reset({ chats: [{ id: 'c1', title: 'x', at: 1, msgs: [{ role: 'user', content: 'a' }] }] });
    merge({
      chats: [{
        id: 'c1', title: 'x', at: 2,
        msgs: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }],
      }],
    } as Partial<StoreData>);
    expect(db().chats).toHaveLength(1);
    expect(db().chats[0].msgs).toHaveLength(2);
  });

  it('dedupes saved visualizations by id', () => {
    const v = { id: 'v1', title: 'T', algorithm: 'A', savedAt: 1, visualization: {} };
    reset({ visualizations: [v] });
    merge({ visualizations: [v, { ...v, id: 'v2' }] } as Partial<StoreData>);
    expect(db().visualizations.map((x) => x.id).sort()).toEqual(['v1', 'v2']);
  });

  it('survives a merge in both directions without losing anything', () => {
    const machineA = { progress: { a: { done: true, date: '2026-01-01' } }, activity: { d1: 1 } };
    const machineB = { progress: { b: { done: true, date: '2026-01-02' } }, activity: { d2: 1 } };
    reset(machineA as Partial<StoreData>);
    merge(machineB as Partial<StoreData>);
    merge(machineA as Partial<StoreData>);
    expect(Object.keys(db().progress).sort()).toEqual(['a', 'b']);
    expect(db().activity).toEqual({ d1: 1, d2: 1 });
  });

  it('ignores an empty payload', () => {
    reset({ activity: { d: 1 } });
    merge(null);
    expect(db().activity).toEqual({ d: 1 });
  });
});

describe('privacy accounting', () => {
  it('counts what would become public if the repo is', () => {
    reset({
      chats: [{ id: 'c', title: 't', at: 1, msgs: [{ role: 'user', content: 'x' }] }],
      log: [{ problem: 'p', trigger: 'g', date: 'd' }],
      progress: { a: { done: true, note: 'private thought' } },
    });
    expect(personalCounts()).toEqual({ messages: 1, logs: 1, notes: 1 });
  });

  it('reports nothing for an untouched store', () => {
    reset();
    expect(personalCounts()).toEqual({ messages: 0, logs: 0, notes: 0 });
  });
});

describe('legacy migration', () => {
  it('folds the per-feature v1 keys into the single store', () => {
    localStorage.clear();
    localStorage.setItem('dsac_lc_progress', JSON.stringify({ a: { done: true } }));
    localStorage.setItem('dsac_userdict', JSON.stringify([{ rel: 'order', signal: 's', tool: 't', why: 'w' }]));
    load();
    expect(db().progress.a.done).toBe(true);
    expect(db().triggers).toHaveLength(1);
    commit();
    expect(localStorage.getItem('dsac_store')).toContain('"done":true');
  });
});
