/* Trigger dictionary: the built-in 14 plus whatever the learner adds. */

import { must, $$, esc, mdBold, field } from '@/core/dom';
import { t, tx } from '@/core/i18n';
import { commit, db } from '@/core/db';
import { BUILTIN_TRIGGERS } from '@/data/dictionary';
import { RELATIONS } from '@/data/ladder';
import type { Bilingual, Relation } from '@/types';

/** Built-ins are bilingual; the learner's own entries are plain strings. */
export type DictEntry =
  | { builtin: true; rel: Relation; signal: Bilingual; tool: Bilingual; why: Bilingual }
  | { builtin: false; idx: number; rel: Relation; signal: string; tool: string; why: string };

let dictFilterRel: Relation | 'all' = 'all';

export function initDictionary(): void {
  $$("#dictFilter .chip").forEach(c=>c.onclick=()=>{
    $$("#dictFilter .chip").forEach(x=>x.classList.remove("on"));
    c.classList.add("on"); dictFilterRel=c.dataset.rel as Relation | "all"; renderDict();
  });
  must("#addEntry").onclick = ()=>{
    const signal=field("#fSignal").value.trim(), tool=field("#fTool").value.trim(), why=field("#fWhy").value.trim(), rel=field("#fRel").value;
    if(!signal||!tool){ alert(t("dict_alert")); return; }
    db().triggers.push({signal,tool,why:why||t("dict_why_todo"),rel: rel as Relation});
    commit();
    field("#fSignal").value=field("#fTool").value=field("#fWhy").value="";
    dictFilterRel="all"; $$("#dictFilter .chip").forEach(x=>x.classList.toggle("on",x.dataset.rel==="all"));
    renderDict();
  };
}

export function allDict(): DictEntry[] { return [
    ...BUILTIN_TRIGGERS.map((d): DictEntry => ({ ...d, builtin: true })),
    ...db().triggers.map((d, i): DictEntry => ({ ...d, builtin: false, idx: i })),
  ]; }

export function dGet(d: DictEntry, f: "signal"|"tool"|"why"): string { const v=d[f]; return (v&&typeof v==="object")?tx(v):v; } 

export function renderDict(){
  const list = allDict().filter(d=>dictFilterRel==="all"||d.rel===dictFilterRel);
  must("#dictGrid").innerHTML = list.map(d=>`
    <div class="dcard" data-rel="${d.rel}">
      <div class="signal">${esc(dGet(d,"signal"))}</div>
      <div class="tool"><span class="arrow">→</span> ${esc(dGet(d,"tool"))}</div>
      <div class="why">${mdBold(dGet(d,"why"))}</div>
      <div class="foot">
        <span class="pill ${d.rel}">${esc(tx(RELATIONS[d.rel]))}</span>
        ${d.builtin?'':`<span style="display:flex;gap:8px;align-items:center"><span class="mine">${esc(t("dict_mine"))}</span><button class="del" data-del="${d.idx}">${esc(t("dict_del"))}</button></span>`}
      </div>
    </div>`).join("") || `<p class="empty">${esc(t("dict_empty"))}</p>`;
  $$("#dictGrid .del").forEach(b=>b.onclick=()=>{ db().triggers.splice(+(b.dataset.del ?? 0),1); commit(); renderDict(); });
}
