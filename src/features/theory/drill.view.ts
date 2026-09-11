/* Compression drill: name the tool and the why before revealing. */

import { must, esc, mdBold, button } from '@/core/dom';
import { t, tx } from '@/core/i18n';
import { RELATIONS } from '@/data/ladder';
import { allDict, dGet } from './dictionary.view';
import type { DictEntry } from './dictionary.view';
import type { Relation } from '@/types';

type Entry = DictEntry;
let currentPractice: Entry | null = null;
export const lastDrawn = (): Entry | null => currentPractice;

export function renderPractice(item?: Entry | null): void {
  const pool = allDict();
  const d = item || pool[Math.floor(Math.random()*pool.length)];
  currentPractice = d;
  must("#practiceCard").innerHTML = `
    <p class="practice-sub">${esc(t("drill_prompt"))}</p>
    <p class="practice-signal">"${esc(dGet(d,"signal"))}"</p>
    <span class="pill ${d.rel}">${esc(tx(RELATIONS[d.rel as Relation]))}</span>
    <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" id="pReveal">${esc(t("drill_reveal"))}</button>
      <button class="btn btn-ghost" id="pNext">${esc(t("drill_next"))}</button>
    </div>
    <div id="pRevealBox"></div>`;
  must("#pNext").onclick=()=>renderPractice();
  must("#pReveal").onclick=()=>{
    must("#pRevealBox").innerHTML = `
      <div class="reveal" data-rel="${d.rel}" style="--rc:var(--${d.rel})">
        <div class="tool">→ ${esc(dGet(d,"tool"))}</div>
        <div class="why">${mdBold(dGet(d,"why"))}</div>
      </div>`;
    button("#pReveal").disabled=true; must("#pReveal").style.opacity="0.5";
  };
}
