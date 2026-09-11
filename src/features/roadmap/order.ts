/**
 * The study order.
 *
 * Deliberately *not* the list order. Problems are dealt round-robin across topic
 * groups with a gentle easy-to-hard ramp inside each group, so a day's batch
 * never marches through one topic in a row. Grinding one pattern back to back
 * teaches recognition-by-familiarity, which is exactly the habit this app is
 * built to avoid.
 *
 * Deterministic: same input list, same order, every run.
 */

import type { Difficulty, Problem } from '@/types';
import { LC150, TOPIC_GROUPS } from '@/data/lc150';

const DIFFICULTY_WEIGHT: Record<Difficulty, number> = { E: 0, M: 1, H: 2 };

/** Position of each problem in the source list, used to break ties stably. */
const SOURCE_INDEX: Record<string, number> = Object.fromEntries(
  LC150.map((p, i) => [p.s, i]),
);

function buildOrder(): Problem[] {
  const buckets = new Map<string, Problem[]>();
  Object.keys(TOPIC_GROUPS).forEach((g) => buckets.set(g, []));
  LC150.forEach((p) => buckets.get(p.g)?.push(p));

  for (const list of buckets.values()) {
    list.sort(
      (a, b) =>
        DIFFICULTY_WEIGHT[a.d] - DIFFICULTY_WEIGHT[b.d] ||
        (SOURCE_INDEX[a.s] ?? 0) - (SOURCE_INDEX[b.s] ?? 0),
    );
  }

  // Visit bigger groups first so they cannot clump at the tail.
  const groups = [...buckets.entries()]
    .filter(([, list]) => list.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([g]) => g);

  const cursor = new Map(groups.map((g) => [g, 0]));
  const order: Problem[] = [];
  while (order.length < LC150.length) {
    let placed = false;
    for (const g of groups) {
      const list = buckets.get(g)!;
      const i = cursor.get(g)!;
      if (i < list.length) {
        order.push(list[i]);
        cursor.set(g, i + 1);
        placed = true;
      }
    }
    if (!placed) break; // every bucket drained
  }
  return order;
}

export const PLAN_ORDER: Problem[] = buildOrder();

const POSITION: Record<string, number> = Object.fromEntries(
  PLAN_ORDER.map((p, i) => [p.s, i]),
);

export function orderIndex(slug: string): number {
  return POSITION[slug] ?? Number.MAX_SAFE_INTEGER;
}
