/* Collision log: the problem you hit and the one signal you took from it. */

import { must, $$, esc, field } from '@/core/dom';
import { locale, t } from '@/core/i18n';

export function initLog(): void {
  must("#addLog").onclick=()=>{
    const problem=field("#logProblem").value.trim(), trigger=field("#logTrigger").value.trim();
    if(!problem){alert(t("log_alert"));return;}
    db().log.unshift({problem,trigger:trigger||t("log_no_trigger"),date:new Date().toLocaleDateString(locale())});
    commit();
    field("#logProblem").value=field("#logTrigger").value="";
    renderLog();
  };
  
}
import { commit, db } from '@/core/db';

export function renderLog(){
  must("#logGrid").innerHTML = db().log.length ? db().log.map((l,i)=>`
    <div class="log-item">
      <div><div class="lp">${esc(l.problem)}</div><div class="lt">→ ${esc(l.trigger)}</div><div class="ld">${esc(l.date)}</div></div>
      <button class="del" data-dl="${i}">${esc(t("log_del"))}</button>
    </div>`).join("") : `<p class="empty">${esc(t("log_empty"))}</p>`;
  $$("#logGrid .del").forEach(b=>b.onclick=()=>{db().log.splice(+(b.dataset.dl ?? 0),1);commit();renderLog();});
}
