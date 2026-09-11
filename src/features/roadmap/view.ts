/* Roadmap 150 rendering: plan config, streak strip, stats, today/review lists,
   topic radar and the full problem list. */

import { $, $$, must, esc, field } from '@/core/dom';
import { lang, locale, t, tx } from '@/core/i18n';
import type { PaceStatus } from './plan';
import { commit, db } from '@/core/db';
import { LC150, TOPIC_GROUPS } from '@/data/lc150';
import type { Confidence, Problem } from '@/types';
import { orderIndex } from './order';
import {
  computePace, dateAdd, daysBetween, isDone, spanDays, syncPlan, targetCount, targetList, today,
} from './plan';
import { computeStreak } from './streak';
import { REVIEW_INTERVALS, markDone, reviewDone, setConf, setNote } from './progress';
import { lcSync, lcSyncMsg, onSyncStatus } from './leetcode';

let lcFilter = 'todo';

/** Normalise the stored plan on startup, then keep the sync line live. */
export function initLC(): void {
  const plan = db().plan;
  if (!plan.start) plan.start = today();
  syncPlan(plan);
  commit();
  onSyncStatus(renderCfgBar);
}

/** How each pace status is presented. */
const PACE_UI: Record<PaceStatus, { cls: string; key: string }> = {
  finished: { cls: 'good', key: 'lc_pace_finished' },
  ahead: { cls: 'good', key: 'lc_pace_ahead' },
  ontrack: { cls: 'good', key: 'lc_pace_ontrack' },
  behind: { cls: 'bad', key: 'lc_pace_behind' },
};

export function fmtDate(iso: string): string {
  if (!iso) return '-';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function renderCfgBar(){
  const s = lcSyncMsg.key==="lc_sync_done" ? t("lc_sync_done").replace("{n}",String(lcSyncMsg.n))
          : lcSyncMsg.key==="lc_sync_fail" ? t("lc_sync_fail")+(lcSyncMsg.raw||"")
          : t(lcSyncMsg.key);
  must("#lcCfgBar").innerHTML = `
    <div class="field"><label class="lbl">${esc(t("lc_cfg_start"))}</label><input class="inp" type="date" id="lcStart" value="${esc(db().plan.start)}"></div>
    <div class="field"><label class="lbl">${esc(t("lc_cfg_end"))}${db().plan.mode==="perDay"?` <span class="lc-derived">${esc(t("lc_cfg_auto"))}</span>`:""}</label><input class="inp" type="date" id="lcEnd" min="${esc(db().plan.start)}" value="${esc(db().plan.end)}"></div>
    <div class="field"><label class="lbl">${esc(t("lc_cfg_perday"))}${db().plan.mode==="end"?` <span class="lc-derived">${esc(t("lc_cfg_auto"))}</span>`:""}</label><input class="inp" type="number" min="1" max="50" id="lcPerDay" value="${esc(db().plan.perDay)}" style="width:90px"></div>
    <div class="field"><label class="lbl">${esc(t("lc_cfg_target"))}</label><input class="inp" type="number" min="1" max="${LC150.length}" id="lcTarget" value="${targetCount(db().plan)}" style="width:104px"></div>
    <div class="field lc-userwrap"><label class="lbl">${esc(t("lc_cfg_user"))}</label><input class="inp" id="lcUser" value="${esc(db().plan.username||"")}" placeholder="leetcode_id"></div>
    <div class="lc-actions">
      <button class="btn btn-ghost" id="lcSave">${esc(t("lc_cfg_save"))}</button>
      <button class="btn btn-primary" id="lcSyncBtn">${esc(t("lc_sync_btn"))}</button>
    </div>
    <span class="lc-syncstate ${lcSyncMsg.cls}">${esc(s)}</span>
    <p class="lc-privacy">${t("lc_plan_hint").replace("{d}",String(spanDays(db().plan))).replace("{n}",String(targetCount(db().plan)))}</p>
    <p class="lc-privacy">${esc(t("lc_privacy"))}</p>`;
  const commit=()=>{ db().plan.username=field("#lcUser").value.trim(); syncPlan(db().plan); commit(); renderRoadmap(); };
  must("#lcStart").onchange=()=>{ db().plan.start=field("#lcStart").value||today(); commit(); };
  must("#lcEnd").onchange=()=>{                       // pinning a finish date drives problems/day
    const v=field("#lcEnd").value;
    if(v && daysBetween(db().plan.start,v)>=0){ db().plan.end=v; db().plan.mode="end"; }
    commit();
  };
  must("#lcPerDay").onchange=()=>{                    // pinning problems/day drives the finish date
    db().plan.perDay=Math.max(1,Math.min(50,+field("#lcPerDay").value||3)); db().plan.mode="perDay"; commit();
  };
  const sum=$("#lcCfgSummary");
  if(sum) sum.textContent = t("lc_cfg_summary")+" — "+t("lc_cfg_line")
    .replace("{n}",String(targetCount(db().plan))).replace("{p}",String(db().plan.perDay))
    .replace("{s}",String(fmtShort(db().plan.start))).replace("{e}",String(fmtShort(db().plan.end)));
  must("#lcTarget").onchange=()=>{ db().plan.target=Math.min(LC150.length,Math.max(1,+field("#lcTarget").value||LC150.length)); commit(); };
  must("#lcSave").onclick=commit;
  must("#lcUser").onchange=()=>{ db().plan.username=field("#lcUser").value.trim(); commit(); };
  must("#lcSyncBtn").onclick=lcSync;
}

export function renderMiniStat(){
  const pace=computePace(db().plan, db().progress);
  const {done,pct,behind:n}=pace;
  const {cls,key}=PACE_UI[pace.status];
  const {current:cur}=computeStreak(db().activity);
  const status = key==="lc_pace_behind" ? t("lc_pace_behind").replace("{n}",String(n)) : t(key);
  must("#lcMiniStat").innerHTML = `
    <div class="lc-ms"><b>${done}</b><span>/ ${targetCount(db().plan)} · ${pct}%</span></div>
    <div class="lc-ms-bar"><i style="transform:scaleX(${(pct/100).toFixed(4)})"></i></div>
    <div class="lc-ms"><b>${cur}</b><span>${esc(t("lc_stat_streak").toLowerCase())}</span></div>
    <span class="lc-ms-pace ${cls}">${esc(status)}</span>`;
}

export function renderStats(){
  const {done,remaining,pct,deadline,need,projected:projFinish}=computePace(db().plan, db().progress);
  const {current:cur,longest}=computeStreak(db().activity);
  must("#lcStats").innerHTML = `
    <div class="lc-stat"><div class="num">${done}<span style="font-size:15px;color:var(--muted)">/150</span></div><div class="lbl">${esc(t("lc_stat_solved"))} · ${pct}%</div></div>
    <div class="lc-stat"><div class="num">${remaining}</div><div class="lbl">${esc(t("lc_stat_remaining"))}</div></div>
    <div class="lc-stat"><div class="num">${cur}</div><div class="lbl">${esc(t("lc_stat_streak"))} (${esc(t("lc_unit_day"))})</div></div>
    <div class="lc-stat"><div class="num">${longest}</div><div class="lbl">${esc(t("lc_stat_longest"))} (${esc(t("lc_unit_day"))})</div></div>`;
  must("#lcPace").innerHTML = `
    <span>${esc(t("lc_pace_deadline").replace("{d}",String(fmtDate(deadline))))}</span>
    ${remaining>0?`<span>${esc(t("lc_pace_need").replace("{n}",String(need)))}</span>`:``}
    <span>${projFinish?esc(t("lc_pace_eta").replace("{d}",String(fmtDate(projFinish)))):esc(t("lc_pace_nopace"))}</span>`;
}

export function renderToday(){
  const undone=targetList(db().plan).filter(p=>!isDone(db().progress, p.s));
  const batch=undone.slice(0,db().plan.perDay);
  const todayIdx=Math.max(0,daysBetween(db().plan.start,today()));
  const overdue=undone.filter(p=>Math.floor(orderIndex(p.s)/db().plan.perDay) < todayIdx).length;
  let body;
  if(batch.length===0){ body=`<p class="lc-empty">${esc(t("lc_pace_finished"))}</p>`; }
  else{ body = batch.map(p=>lcRowHtml(p,{compact:true})).join(""); }
  must("#lcToday").innerHTML = `
    <h3>${esc(t("lc_today_head"))} ${overdue>0?`<span class="lc-badge">${esc(t("lc_today_overdue").replace("{n}",String(overdue)))}</span>`:``}</h3>
    <p class="lc-psub">${esc(lang()==="vi"?`Mục tiêu ${db().plan.perDay} câu/ngày.`:`Target ${db().plan.perDay}/day.`)}</p>
    ${body}`;
  wireRows("#lcToday");
}

export function renderReview(){
  const now=today();
  const due=LC150.filter((p)=>{ const x=db().progress[p.s]; return x&&x.done&&x.nextReview&&x.nextReview<=now; })
    .sort((a,b)=>{ const ca=db().progress[a.s].conf==="shaky"?0:1, cb=db().progress[b.s].conf==="shaky"?0:1; return ca-cb; });
  const body = due.length? due.map(p=>lcRowHtml(p,{review:true})).join("") : `<p class="lc-empty">${esc(t("lc_review_none"))}</p>`;
  must("#lcReview").innerHTML = `
    <h3>${esc(t("lc_review_head"))} ${due.length?`<span class="lc-badge">${due.length}</span>`:``}</h3>
    <p class="lc-psub">${esc(t("lc_review_sub"))}</p>
    ${body}`;
  wireRows("#lcReview");
}

export function fmtShort(ds: string): string { return new Date(ds+"T00:00:00").toLocaleDateString(locale(),{day:"2-digit",month:"2-digit"}); }

export function renderStrip(){
  const now=today(), N=30, days=[];
  for(let i=N-1;i>=0;i--) days.push(dateAdd(now,-i));
  const {current:cur,longest}=computeStreak(db().activity);
  const cells=days.map((ds: string)=>{
    const n=db().activity[ds]||0;
    const prev=!!db().activity[dateAdd(ds,-1)], next=!!db().activity[dateAdd(ds,1)];
    const inPlan=db().plan.start&&db().plan.end&&daysBetween(db().plan.start,ds)>=0&&daysBetween(ds,db().plan.end)>=0;
    const cls=["s30"];
    if(n){ cls.push("has","a"+Math.min(3,Math.ceil(n/2))); if(prev) cls.push("jl"); if(next) cls.push("jr"); }
    else if(inPlan) cls.push("plan");
    if(ds===now) cls.push("now");
    return `<div class="${cls.join(" ")}" title="${esc(fmtDate(ds))}${n?" · "+n:""}"><span>${+ds.slice(8)}</span></div>`;
  }).join("");
  must("#lcStrip").innerHTML=`
    <div class="s30-head">
      <span class="s30-title">${esc(t("lc_strip_head"))}</span>
      <span class="s30-stats">
        <span class="lc-flame">🔥 <b>${cur}</b> ${esc(t("lc_cal_current"))}</span>
        <span>${esc(t("lc_cal_longest"))}: <b>${longest}</b></span>
      </span>
    </div>
    <div class="s30-row">${cells}</div>
    <div class="s30-foot"><span>${esc(fmtShort(days[0]))}</span><span>${esc(t("lc_cal_todaylbl"))}</span></div>`;
}

export function renderRadar(){
  const stat: Record<string,{done:number;total:number}>={};
  Object.keys(TOPIC_GROUPS).forEach(g=>stat[g]={done:0,total:0});
  targetList(db().plan).forEach(p=>{ stat[p.g].total++; if(isDone(db().progress, p.s)) stat[p.g].done++; });
  const rows=Object.keys(TOPIC_GROUPS).map(g=>({g,...stat[g],pct:stat[g].total?stat[g].done/stat[g].total:0})).filter(r=>r.total>0)
    .sort((a,b)=>a.pct-b.pct);
  must("#lcRadar").innerHTML = `
    <h3>${esc(t("lc_radar_head"))}</h3>
    <p class="lc-psub">${esc(t("lc_radar_sub"))}</p>
    ${rows.map(r=>{ const col=r.pct>=1?"var(--dependency)":r.pct>=.5?"var(--brass)":"var(--order)";
      return `<div class="lc-radarrow"><span class="rn" title="${esc(tx(TOPIC_GROUPS[r.g]))}">${esc(tx(TOPIC_GROUPS[r.g]))}</span>
        <span class="rbar"><i style="width:${Math.round(r.pct*100)}%;background:${col}"></i></span>
        <span class="rc">${r.done}/${r.total}</span></div>`; }).join("")}`;
}

export function lcRowHtml(p: Problem, opt: {compact?: boolean; review?: boolean}={}): string {
  const x=db().progress[p.s]??{};
  const done=!!x.done;
  const url=`https://leetcode.com/problems/${p.s}/`;
  const mastered = done && x.stage!=null && x.stage>=REVIEW_INTERVALS.length;
  const reviewDue = done && x.nextReview && x.nextReview<=today();
  let right="";
  if(opt.review){ right=`<button class="btn btn-primary lc-rvbtn" data-rv="${p.s}" style="padding:7px 14px;font-size:13px">${esc(t("lc_review_btn"))}</button>`; }
  else if(done){
    right = `<div class="lc-confbtns">
        <button class="lc-cbtn shaky ${x.conf==="shaky"?"on":""}" data-conf="shaky" data-slug="${p.s}">${esc(t("lc_conf_shaky"))}</button>
        <button class="lc-cbtn solid ${x.conf==="solid"?"on":""}" data-conf="solid" data-slug="${p.s}">${esc(t("lc_conf_solid"))}</button>
      </div>`;
  }
  const noteRow = done && !opt.review ? `<textarea class="lc-note" rows="1" data-note="${p.s}" placeholder="${esc(t("lc_note_ph"))}">${esc(x.note||"")}</textarea>` : "";
  return `<div class="lc-row">
      <button class="lc-check ${done?"on":""}" data-check="${p.s}" aria-label="done">✓</button>
      <div class="lc-main">
        <a class="lc-title" href="${url}" target="_blank" rel="noopener">${esc(p.t)}</a>
        <div class="lc-meta">
          <span class="lc-diff ${p.d}">${p.d==="E"?"Easy":p.d==="M"?"Med":"Hard"}</span>
          <span class="lc-gtag">${esc(tx(TOPIC_GROUPS[p.g]))}</span>
          ${mastered?`<span class="lc-mastered">${esc(t("lc_mastered"))}</span>`:reviewDue&&!opt.review?`<span class="lc-badge">${esc(t("lc_reviewdue"))}</span>`:``}
        </div>
        ${noteRow}
      </div>
      <a class="lc-open" href="${url}" target="_blank" rel="noopener">${esc(t("lc_open"))}</a>
      ${right}
    </div>`;
}

export function wireRows(scope: string){
  $$(`${scope} [data-check]`).forEach(b=>b.onclick=()=>markDone(b.dataset.check!, !isDone(db().progress, b.dataset.check!)));
  $$(`${scope} [data-conf]`).forEach(b=>b.onclick=()=>setConf(b.dataset.slug!, b.dataset.conf as Confidence));
  $$(`${scope} [data-rv]`).forEach(b=>b.onclick=()=>reviewDone(b.dataset.rv!));
  $$(`${scope} [data-note]`).forEach((a)=>{ const ta=a as HTMLTextAreaElement;
    ta.onchange=()=>setNote(ta.dataset.note!, ta.value); ta.oninput=()=>{ta.style.height="auto";ta.style.height=`${ta.scrollHeight}px`;}; });
}

export function renderList(){
  const now=today();
  const pass=(p: Problem)=>{ const x=db().progress[p.s]??{};
    if(lcFilter==="todo") return !x.done;
    if(lcFilter==="done") return !!x.done;
    if(lcFilter==="review") return x.done && x.nextReview && x.nextReview<=now;
    return true; };
  let html=""; let curG: string|null=null;
  LC150.forEach((p)=>{
    if(p.g!==curG){
      curG=p.g;
      const inG=LC150.filter(q=>q.g===p.g); const dn=inG.filter(q=>isDone(db().progress, q.s)).length;
      html+=`<div class="lc-grouphead"><span>${esc(tx(TOPIC_GROUPS[p.g]))}</span><span class="gcount">${dn}/${inG.length}</span><span class="gbar"><i style="width:${Math.round(dn/inG.length*100)}%"></i></span></div>`;
    }
    if(pass(p)) html+=lcRowHtml(p,{});
  });
  // strip group headers that ended up with no visible rows under current filter
  must("#lcList").innerHTML = html || `<p class="lc-empty">${esc(t("lc_list_empty"))}</p>`;
  wireRows("#lcList");
}

export function renderRoadmap(){
  // pace line lives inside the Progress tab, right after the stats grid
  if(!$("#lcPace")){
    const pace=document.createElement("div"); pace.className="lc-pace"; pace.id="lcPace";
    must("#lcStats").after(pace);
  }
  renderMiniStat(); renderCfgBar(); renderStats(); renderToday(); renderReview(); renderStrip(); renderRadar(); renderList();
}
