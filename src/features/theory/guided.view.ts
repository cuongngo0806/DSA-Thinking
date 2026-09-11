/* Offline guided walk. Leaves are hypotheses, never answers. */

import { $, must, $$, esc } from '@/core/dom';
import { t, tx } from '@/core/i18n';
import { GUIDE, VERDICTS } from '@/data/guided';
import type { GuideNode, GuideOption } from '@/data/guided';

/** A point in the walk: another question, or the hypothesis it ends at. */
type Step = GuideNode | { verdict: string };
const isVerdict = (s: Step): s is { verdict: string } => "verdict" in s;
interface Crumb { crumb: string; node: Step; optRef?: GuideOption }
let currentGuideNode: Step = GUIDE.start;
let guidePath: Crumb[] = [];

export function renderGuide(node: Step = currentGuideNode): void {
  currentGuideNode = node;
  const crumbs = [t("guide_root_crumb"), ...guidePath.map(p=>p.crumb)];
  must("#guideCrumbs").innerHTML = crumbs.map(c=>`<span class="crumb">${esc(c)}</span>`).join("");
  if(isVerdict(node)){
    const v = VERDICTS[node.verdict];
    must("#guideBody").innerHTML = `
      <div class="guide-verdict" data-rel="${v.rel}">
        <div class="hyp">${esc(t("guide_hyp"))}</div>
        <h4>${esc(tx(v.tool))}</h4>
        <p>${esc(tx(v.body))}</p>
        <div class="verify">${esc(t("guide_verify_prefix"))}${esc(tx(v.verify))}</div>
      </div>
      <div class="guide-back">
        <button class="btn btn-ghost" id="gBack">${esc(t("guide_back"))}</button>
        <button class="btn btn-primary" id="gRestart">${esc(t("guide_restart"))}</button>
      </div>`;
    must("#gRestart").onclick=()=>{guidePath=[];renderGuide(GUIDE.start);};
    must("#gBack").onclick=()=>{guidePath.pop();renderGuide(guidePath.length?guidePath[guidePath.length-1].node:GUIDE.start);};
    return;
  }
  must("#guideBody").innerHTML = `
    <p class="guide-q">${esc(tx((node as GuideNode).q))}</p>
    <div class="guide-opts">
      ${(node as GuideNode).opts.map((o: GuideOption,i: number)=>`<button class="opt" data-i="${i}"><span class="oi">◇</span>${esc(tx(o.t))}</button>`).join("")}
    </div>
    ${guidePath.length?`<div class="guide-back"><button class="btn btn-ghost" id="gBack">${esc(t("guide_back"))}</button></div>`:""}`;
  $$("#guideBody .opt").forEach(b=>b.onclick=()=>{
    const o = (node as GuideNode).opts[+(b.dataset.i ?? 0)];
    const next = o.verdict ? {verdict:o.verdict} : GUIDE[o.go!];
    const label = tx(o.t);
    guidePath.push({crumb: label.length>28?label.slice(0,26)+"…":label, node:next, optRef:o});
    renderGuide(next);
  });
  if($("#gBack")) must("#gBack").onclick=()=>{guidePath.pop();renderGuide(guidePath.length?guidePath[guidePath.length-1].node:GUIDE.start);};
}

// re-translate crumbs on language switch by recomputing from stored optRefs
export function retranslateGuide(){
  guidePath.forEach(p=>{ if(p.optRef){ const l=tx(p.optRef.t); p.crumb = l.length>28?l.slice(0,26)+"…":l; } });
  renderGuide(currentGuideNode);
}

/** The walk is self-contained; nothing to wire beyond the first render. */
export function initGuided(): void {
  guidePath = [];
}
