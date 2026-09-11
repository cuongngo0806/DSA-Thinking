/* The player: example picker, stage, code pane with the running line, playback
   controls and the "how it works" panel. */

import { $, $$, must, esc, button, field, fmtValue } from '@/core/dom';
import { t, tx, lang } from '@/core/i18n';
import { PLAYBACK_SPEEDS, stepIntervalMs } from './engine';
import { renderState, setHighlights, setRenderTarget } from './renderers';
import { VIZ_EXAMPLES } from './examples/registry';
import { saveViz, setVizTab } from './library';
import type { ExampleExplanation, Visualization, VizExample } from './types';

export let customViz: VizExample | null = null;
export let vizCur: VizExample | null = null;
export function saveCurrentViz(): void {
  if(!vizCur||!vizCur.custom) return;
  saveViz(vizCur!.viz);
  const b=$("#vizSaveBtn"); if(b){ b.textContent=t("viz_saved_ok"); (b as HTMLButtonElement).disabled=true; }
}

export const vizState = { key: VIZ_EXAMPLES[0].key, step: 0, playing: false, speed: 1,
  timer: null as ReturnType<typeof setInterval> | null, focused: false };

export const vizEx = (k: string): VizExample => (k==="__custom__" && customViz) ? customViz : (VIZ_EXAMPLES.find((e)=>e.key===k) || VIZ_EXAMPLES[0]);

/** Explanation for either a built-in (bilingual `expl`) or a generated one (root `explanation`). */
export function getExpl(ex: VizExample): ExampleExplanation|null {
  if(ex.expl) return ex.expl[lang()]||ex.expl.en;
  const e=ex.viz.explanation;
  if(!e||typeof e!=="object") return null;
  return {intuition:e.intuition||"", approach:Array.isArray(e.approach)?e.approach:[], why:e.whyItWorks||"", pitfalls:Array.isArray(e.pitfalls)?e.pitfalls:[]};
}

export function mountViz(){
  vizCur=vizEx(vizState.key); const viz=vizCur!.viz;
  const opts=(customViz?`<option value="__custom__" ${vizState.key==="__custom__"?'selected':''}>★ ${esc(customViz.viz.title)}</option>`:'')
    +VIZ_EXAMPLES.map((e)=>`<option value="${e.key}" ${e.key===vizState.key?'selected':''}>${esc(tx(e.name))}</option>`).join('');
  const roles=['active','compare','boundary','visited','push','pop','result'];
  const legend=roles.map((r: string)=>`<span class="viz-lg" data-role="${r}">${esc(t('viz_r_'+r))}</span>`).join('');
  const codeLines=(viz.sourceCode?viz.sourceCode.code.split('\n'):[]).map((ln: string,i: number)=>`<div class="viz-cl" data-ln="${i+1}"><span class="lnno">${i+1}</span><span class="lntx">${esc(ln)||' '}</span></div>`).join('');
  const narr=t('viz_narr')?`<div class="viz-narr">${esc(t('viz_narr'))}</div>`:'';
  must("#vizApp").innerHTML=`
    <div class="viz-head">
      <div class="viz-pick"><label class="lbl" style="margin:0" for="vizSelect">${esc(t('viz_pick'))}</label>
        <select class="viz-select" id="vizSelect">${opts}</select></div>
      <div class="viz-meta">
        <span class="viz-badge"><b>${esc(t('viz_algorithm'))}:</b> ${esc(viz.algorithm)}</span>
        ${viz.complexity?`<span class="viz-badge"><b>${esc(t('viz_time'))}:</b> ${esc(viz.complexity.time)}</span><span class="viz-badge"><b>${esc(t('viz_space'))}:</b> ${esc(viz.complexity.space)}</span>`:''}
        ${vizCur.custom?`<span class="viz-custom-tag">${esc(t('viz_custom'))}</span><button class="viz-savebtn" id="vizSaveBtn">${esc(t('viz_save'))}</button>`:''}
      </div>
    </div>
    <div class="viz-main">
      <div class="viz-stage" id="vizStage"></div>
      <div class="viz-side">
        <div class="viz-panel"><div class="pt">${esc(t('viz_step_lbl'))}</div><span class="viz-phasechip" id="vizPhase" hidden></span><div class="viz-desc" id="vizDesc"></div></div>
        <div class="viz-panel" id="vizCalcPanel" hidden><div class="pt">${esc(t('viz_calc'))}</div><pre class="viz-calc" id="vizCalc"></pre></div>
        <div class="viz-panel"><div class="pt">${esc(t('viz_result'))}</div><div class="viz-result" id="vizResult"></div></div>
        <div class="viz-panel"><div class="pt">${esc(t('viz_code'))}</div><div class="viz-code" id="vizCode">${codeLines}</div></div>
      </div>
    </div>
    <div class="viz-controls">
      <div class="viz-btns">
        <button class="viz-cbtn" id="vizFirst" title="${esc(t('viz_first'))}">⏮</button>
        <button class="viz-cbtn" id="vizPrev" title="${esc(t('viz_prev'))}">◀</button>
        <button class="viz-cbtn play" id="vizPlay" title="${esc(t('viz_play'))}">▶</button>
        <button class="viz-cbtn" id="vizNext" title="${esc(t('viz_next'))}">▶</button>
        <button class="viz-cbtn" id="vizLast" title="${esc(t('viz_last'))}">⏭</button>
      </div>
      <div class="viz-speeds" title="${esc(t('viz_speed'))}">${PLAYBACK_SPEEDS.map(s=>`<button class="viz-sp ${s===vizState.speed?'on':''}" data-sp="${s}">${s}×</button>`).join('')}</div>
      <div class="viz-scrub"><input type="range" id="vizScrub" min="0" max="${viz.steps.length-1}" value="${vizState.step}"><span class="viz-count" id="vizCount"></span></div>
    </div>
    <div class="viz-legend"><span style="font-weight:700;color:var(--text-dim)">${esc(t('viz_legend'))}:</span>${legend}</div>
    ${narr}
    <div class="viz-how" id="vizHow"></div>`;
  // wire
  must("#vizSelect").onchange=(e: Event)=>vizSelect((e.target as HTMLSelectElement).value);
  must("#vizFirst").onclick=()=>{vizStop();vizGo(0);};
  must("#vizPrev").onclick=()=>{vizStop();vizGo(vizState.step-1);};
  must("#vizNext").onclick=()=>{vizStop();vizGo(vizState.step+1);};
  must("#vizLast").onclick=()=>{vizStop();vizGo(viz.steps.length-1);};
  must("#vizPlay").onclick=vizToggle;
  must("#vizScrub").oninput=(e: Event)=>{vizStop();vizGo(+(e.target as HTMLInputElement).value);};
  $$("#vizApp .viz-sp").forEach((b)=>b.onclick=()=>vizSetSpeed(+(b.dataset.sp ?? 1)));
  if($("#vizSaveBtn")) must("#vizSaveBtn").onclick=saveCurrentViz;
  setRenderTarget(vizCur);
  renderHow();
  paintStep();
}

export function renderHow(){
  const ex=vizCur!; const ex2=getExpl(ex);
  const how=must("#vizHow");
  if(!ex2){ how.hidden=true; how.innerHTML=''; return; }
  how.hidden=false;
  how.innerHTML=`<h3>${esc(t('viz_how'))} — ${esc(ex.viz.title)}</h3>
    <div class="viz-howgrid">
      <div class="viz-howblk"><div class="pt">${esc(t('viz_intuition'))}</div><p>${esc(ex2.intuition)}</p></div>
      <div class="viz-howblk"><div class="pt">${esc(t('viz_approach'))}</div><ol>${ex2.approach.map((a: string)=>`<li>${esc(a)}</li>`).join('')}</ol></div>
      ${ex2.why?`<div class="viz-howblk"><div class="pt">${esc(t('viz_why'))}</div><p>${esc(ex2.why)}</p></div>`:''}
      ${ex2.pitfalls&&ex2.pitfalls.length?`<div class="viz-howblk"><div class="pt">${esc(t('viz_pitfalls'))}</div><ul>${ex2.pitfalls.map((p: string)=>`<li>${esc(p)}</li>`).join('')}</ul></div>`:''}
    </div>`;
}

export function paintStep(){
  const viz=vizCur!.viz, i=vizState.step, step=viz.steps[i]; if(!step) return;
  const hi: Record<string, Record<number, string>>={}; (step.highlights??[]).forEach((h)=>{ hi[h.component]=hi[h.component]??{}; (h.indices??[]).forEach((ix: number)=>{ hi[h.component][ix]=h.role??'active'; });
  setHighlights(hi); });
  must("#vizStage").innerHTML=(step.components??[]).map(renderState).join('');
  const phaseEl=must("#vizPhase"); if(step.phase){phaseEl.hidden=false;phaseEl.textContent=step.phase;}else phaseEl.hidden=true;
  must("#vizDesc").textContent=step.description||'';
  const calcP=must("#vizCalcPanel"); if(step.calculation){calcP.hidden=false;must("#vizCalc").textContent=step.calculation;}else calcP.hidden=true;
  must("#vizResult").textContent=step.result===undefined?'—':fmtValue(step.result);
  // code highlight
  $$("#vizCode .viz-cl").forEach((el)=>el.classList.toggle('on', +(el.dataset.ln ?? 0)===step.codeLine));
  const onLine=must("#vizCode .viz-cl.on"); if(onLine){const box=must("#vizCode");box.scrollTop=Math.max(0,onLine.offsetTop-box.clientHeight/2+onLine.offsetHeight/2);}
  // controls
  const last=viz.steps.length-1;
  button("#vizFirst").disabled=button("#vizPrev").disabled=(i<=0);
  button("#vizNext").disabled=button("#vizLast").disabled=(i>=last);
  must("#vizPlay").textContent=vizState.playing?'⏸':'▶';
  must("#vizPlay").title=vizState.playing?t('viz_pause'):t('viz_play');
  field("#vizScrub").value=String(i); must("#vizCount").textContent=`${i+1} / ${viz.steps.length}`;
}

export function vizGo(i: number): void { const last=vizCur!.viz.steps.length-1; vizState.step=Math.max(0,Math.min(last,Math.trunc(i))); paintStep(); }

export function vizStop(){ if(vizState.timer){if(vizState.timer) clearInterval(vizState.timer);vizState.timer=null;} vizState.playing=false; const p=$("#vizPlay"); if(p){p.textContent='▶';p.title=t('viz_play');} }

export function vizToggle(){
  const last=vizCur!.viz.steps.length-1;
  if(vizState.playing){ vizStop(); return; }
  if(vizState.step>=last) vizGo(0);
  vizState.playing=true; must("#vizPlay").textContent='⏸'; must("#vizPlay").title=t('viz_pause');
  vizState.timer=setInterval(()=>{ if(vizState.step>=vizCur!.viz.steps.length-1){ vizStop(); } else { vizGo(vizState.step+1); } }, stepIntervalMs(vizState.speed));
}

export function vizSetSpeed(sp: number): void { vizState.speed=sp; $$("#vizApp .viz-sp").forEach((b)=>b.classList.toggle('on',+(b.dataset.sp ?? 1)===sp)); if(vizState.playing){ if(vizState.timer) clearInterval(vizState.timer); vizState.timer=setInterval(()=>{ if(vizState.step>=vizCur!.viz.steps.length-1){vizStop();}else{vizGo(vizState.step+1);} }, stepIntervalMs(sp)); } }

export function vizSelect(key: string): void { vizStop(); vizState.key=key; vizState.step=0; mountViz(); }

export function refreshViz(){ vizStop(); mountViz(); }

export function initViz(){
  const app=$("#vizApp"); if(!app) return;
  app.addEventListener('mouseenter',()=>vizState.focused=true);
  app.addEventListener('mouseleave',()=>vizState.focused=false);
  app.addEventListener('focusin',()=>vizState.focused=true);
  document.addEventListener('keydown',e=>{
    if(!vizState.focused) return;
    const tag=(document.activeElement&&document.activeElement.tagName)||'';
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
    if(e.key===' '){e.preventDefault();vizToggle();}
    else if(e.key==='ArrowRight'){e.preventDefault();vizStop();vizGo(vizState.step+1);}
    else if(e.key==='ArrowLeft'){e.preventDefault();vizStop();vizGo(vizState.step-1);}
    else if(e.key==='Home'){e.preventDefault();vizStop();vizGo(0);}
    else if(e.key==='End'){e.preventDefault();vizStop();vizGo(vizCur!.viz.steps.length-1);}
  });
}

export function loadCustomViz(viz: Visualization): void {
  customViz={key:"__custom__", custom:true, name:{vi:viz.title,en:viz.title}, viz, expl:null};
  vizStop(); vizState.key="__custom__"; vizState.step=0; mountViz();
  setVizTab("view");
  must("#truc-quan").scrollIntoView({behavior:"smooth",block:"start"});
}
