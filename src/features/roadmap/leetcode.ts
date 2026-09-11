/* Optional sync from a public LeetCode profile. Best-effort: the community API
   it leans on is free and sometimes down, and manual check-off must keep working. */

import { commit, db } from '@/core/db';
import { REVIEW_INTERVALS, bumpActivity } from './progress';
import { dateAdd, isDone, today } from './plan';
import { LC150 } from '@/data/lc150';

export interface SyncMessage { cls: string; key: string; n: number; raw: string }
export let lcSyncMsg: SyncMessage = { cls: '', key: 'lc_sync_idle', n: 0, raw: '' };
export function setSyncMsg(m: SyncMessage): void { lcSyncMsg = m; }

/** Raised when the sync status line changes, so the view can repaint. */
let syncListener: (() => void) | null = null;
export function onSyncStatus(fn: () => void): void { syncListener = fn; }
function notifySync(): void { syncListener?.(); }

export async function lcSync(){
  const u=(db().plan.username||"").trim();
  if(!u){ lcSyncMsg={cls:"err",key:"lc_sync_need_user",n:0,raw:""}; notifySync(); return; }
  lcSyncMsg={cls:"wait",key:"lc_sync_running",n:0,raw:""}; notifySync();
  try{
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(u)}/acSubmission?limit=200`);
    if(!res.ok) throw new Error("HTTP "+res.status);
    const data = await res.json();
    const subs = data.submission || data.acSubmission || [];
    if(!Array.isArray(subs)) throw new Error("unexpected response");
    const valid = new Set(LC150.map(p=>p.s));
    let n=0;
    subs.forEach(sub=>{
      const slug=sub.titleSlug;
      if(valid.has(slug) && !isDone(db().progress, slug)){
        const date = sub.timestamp ? dateAdd("1970-01-01", Math.floor(+sub.timestamp/86400)) : today();
        const p=db().progress[slug]||{}; p.done=true; p.date=date;
        if(p.stage==null){ p.stage=0; p.nextReview=dateAdd(date,REVIEW_INTERVALS[0]); }
        db().progress[slug]=p; bumpActivity(date); n++;
      }
    });
    commit();
    lcSyncMsg={cls:"ok",key:"lc_sync_done",n,raw:""};
    commit();
  }catch(e: any){
    lcSyncMsg={cls:"err",key:"lc_sync_fail",n:0,raw:e.message};
    notifySync();
  }
}
