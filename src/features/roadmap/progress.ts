/* Progress mutations: solving, confidence, the compressed note, and the
   spaced-repetition schedule. Every one bumps the activity map, which is what
   the streak strip reads. */

import { commit, db } from '@/core/db';
import { dateAdd, today } from './plan';
import type { Confidence } from '@/types';

/** Days after a solve at which the problem comes back. */
export const REVIEW_INTERVALS = [3, 7, 21];

export function bumpActivity(day: string): void {
  db().activity[day] = (db().activity[day] ?? 0) + 1;
}

export function markDone(slug: string, done: boolean): void {
  const p = db().progress[slug] || {};
  if(done){
    p.done=true; p.date = p.date || today();
    if(p.stage==null){ p.stage=0; p.nextReview = dateAdd(p.date, REVIEW_INTERVALS[0]); }
    bumpActivity(today());
  }else{
    p.done=false; p.stage=undefined; p.nextReview=null;
  }
  db().progress[slug]=p; commit();
}

export function setConf(slug: string, conf: Confidence): void {
  const p = db().progress[slug]; if(!p||!p.done) return;
  p.conf = p.conf===conf ? undefined : conf;
  if(p.conf==="shaky" && p.nextReview){ const soon=dateAdd(today(),1); if(p.nextReview>soon) p.nextReview=soon; } // shaky ⇒ review sooner
  db().progress[slug]=p; commit();
}

export function setNote(slug: string, note: string): void {
  const p = db().progress[slug] || {}; p.note = note; db().progress[slug]=p; commit();
}

export function reviewDone(slug: string): void {
  const p = db().progress[slug]; if(!p||!p.done) return;
  const s = (p.stage||0)+1; p.stage=s;
  p.nextReview = s < REVIEW_INTERVALS.length ? dateAdd(today(), REVIEW_INTERVALS[s]) : null;
  bumpActivity(today()); db().progress[slug]=p; commit();
}
