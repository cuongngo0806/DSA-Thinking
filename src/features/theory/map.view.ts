/* Thinking map: the four compass questions and the cost-of-thinking ladder. */

import { must, esc } from '@/core/dom';
import { t, tx } from '@/core/i18n';
import { COMPASS_QUESTIONS, LADDER, RELATIONS } from '@/data/ladder';

let currentRung = 'hash';

export function renderQuestions(){
  must("#qstrip").innerHTML = COMPASS_QUESTIONS.map(q=>`
    <div class="qcard ${q.upstream?'upstream':''}">
      ${q.upstream?`<span class="tag">${esc(t("q_upstream_tag"))}</span>`:''}
      <div class="qn">${q.n}</div><p>${esc(tx(q.text))}</p>
    </div>`).join("");
}

export function renderLadder(activeId: string = currentRung): void {
  currentRung = activeId;
  must("#ladder").innerHTML = LADDER.map(r=>`
    <button class="rung ${r.id===activeId?'active':''}" data-rel="${r.rel}" data-id="${r.id}">
      <div class="r-top"><span class="r-name">${esc(tx(r.name))}</span><span class="r-verb">${esc(tx(r.verb))}</span></div>
      <div class="r-cost ${r.cheap?'r-cheap':''}">${esc(tx(r.cost))}</div>
    </button>`).join("");
  must("#ladder").querySelectorAll<HTMLElement>(".rung").forEach((b)=>b.onclick=()=>renderLadder(b.dataset.id));
  const r = LADDER.find((x)=>x.id===activeId) ?? LADDER[0];
  must("#rungDetail").innerHTML = `
    <span class="d-rel pill ${r.rel}">${esc(tx(RELATIONS[r.rel]))}</span>
    <h3>${esc(tx(r.name))}</h3>
    <p class="d-verb">${esc(t("d_verb"))} <b style="color:var(--${r.rel})">${esc(tx(r.verb))}</b> · ${esc(tx(r.cost))}</p>
    <div class="d-field"><div class="d-label">${esc(t("d_label_trigger"))}</div><p class="d-trigger">"${esc(tx(r.trigger))}"</p></div>
    <div class="d-field"><div class="d-label">${esc(t("d_label_why"))}</div><p>${esc(tx(r.why))}</p></div>
    <div class="d-field"><div class="d-label">${esc(t("d_label_space"))}</div><p>${esc(tx(r.space))}</p></div>`;
}
