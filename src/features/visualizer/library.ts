/* The saved-visualization library and the create / import / saved panes. */

import { $$, must, esc, downloadJson, field, button } from '@/core/dom';
import { lang, t } from '@/core/i18n';
import { commit, db } from '@/core/db';
import { aiReady, openSettings, renderAiChip } from '@/core/ai';
import { VIZ_SYSTEM_PROMPT, buildVizUserPrompt } from './aigen';
import { extractJson, validateViz } from './validate';
import { vizAiCall } from './aigen';
import { loadCustomViz } from './view';
import type { Visualization } from './types';
import type { SavedVisualization } from '@/types';

let savedQuery = '';

export function setGenStatus(el: string, cls: string, html: string): void { const e=must(el); e.hidden=false; e.className="viz-status "+cls; e.innerHTML=html; }

export function saveViz(viz: Visualization): SavedVisualization {
  const item={id:"v"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
    title:viz.title, algorithm:viz.algorithm, savedAt:Date.now(), visualization:viz};
  db().visualizations.unshift(item);
  if(db().visualizations.length>200) db().visualizations=db().visualizations.slice(0,200);
  commit(); renderSaved(); return item;
}


export function renderSaved(){
  const q=savedQuery.trim().toLowerCase();
  const list: SavedVisualization[]=db().visualizations.filter(it=>!q||it.title.toLowerCase().includes(q)||(it.algorithm||"").toLowerCase().includes(q));
  if(!list.length){ must("#savedList").innerHTML=`<p class="empty">${esc(t(db().visualizations.length?"saved_nomatch":"saved_empty"))}</p>`; return; }
  const groups: Record<string, SavedVisualization[]>={};
  list.forEach((it)=>{ (groups[it.title]=groups[it.title]||[]).push(it); });
  must("#savedList").innerHTML=Object.keys(groups).map((title: string)=>{
    const items=groups[title];
    return `<div class="viz-sgroup">
      <div class="viz-sgrouphead"><b>${esc(title)}</b><span>${items.length} ${esc(t("saved_count"))}</span></div>
      ${items.map((it: SavedVisualization)=>`<div class="viz-sitem">
        <div class="si-main"><div class="si-algo">${esc(it.algorithm||"—")}</div>
          <div class="si-meta">${esc(new Date(it.savedAt).toLocaleString(lang()==="vi"?"vi-VN":"en-US"))} · ${(it.visualization as Visualization).steps.length} ${esc(t("saved_steps"))}</div></div>
        <div class="si-btns">
          <button class="viz-sbtn" data-open="${it.id}">${esc(t("saved_open"))}</button>
          <button class="viz-sbtn" data-exp="${it.id}">${esc(t("saved_export"))}</button>
          <button class="viz-sbtn danger" data-del="${it.id}">${esc(t("saved_delete"))}</button>
        </div></div>`).join("")}
    </div>`;
  }).join("");
  $$("#savedList [data-open]").forEach(b=>b.onclick=()=>{ const it=db().visualizations.find(x=>x.id===b.dataset.open); if(it) loadCustomViz(it.visualization as Visualization); });
  $$("#savedList [data-exp]").forEach(b=>b.onclick=()=>{ const it=db().visualizations.find(x=>x.id===b.dataset.exp!); if(it) downloadJson(it.visualization, (it.title||"visualization").replace(/[^\w\-]+/g,"-").toLowerCase()+".json"); });
  $$("#savedList [data-del]").forEach(b=>b.onclick=()=>{ db().visualizations=db().visualizations.filter((x: SavedVisualization)=>x.id!==b.dataset.del!); commit(); renderSaved(); });
}

export function setVizTab(v: string): void {
  $$("#vizTabs .lc-tab").forEach(b=>b.classList.toggle("on", b.dataset.vt===v));
  must("#vizPaneView").hidden=v!=="view";
  must("#vizPaneCreate").hidden=v!=="create";
  must("#vizPaneImport").hidden=v!=="import";
  must("#vizPaneSaved").hidden=v!=="saved";
  if(v==="saved") renderSaved();
}

export function initVizTabs(){
  $$("#vizTabs .lc-tab").forEach(b=>b.onclick=()=>setVizTab(b.dataset.vt!));
  must("#genOpenSet").onclick=openSettings;
  renderAiChip();
  must("#genCopy").onclick=async()=>{
    const p=VIZ_SYSTEM_PROMPT+"\n\n"+buildVizUserPrompt({problem:field("#genProblem").value,algorithm:field("#genAlgo").value,input:field("#genInput").value,sourceCode:field("#genCode").value,language:field("#genLang").value});
    try{ await navigator.clipboard.writeText(p); setGenStatus("#genStatus","ok",t("gen_copied")); }
    catch{ const ta=document.createElement("textarea"); ta.value=p; document.body.appendChild(ta); ta.select();
      try{document.execCommand("copy"); setGenStatus("#genStatus","ok",t("gen_copied"));}catch{ setGenStatus("#genStatus","err",t("gen_copyfail")); }
      document.body.removeChild(ta); }
  };
  must("#genRun").onclick=async()=>{
    const problem=field("#genProblem").value.trim(), code=field("#genCode").value.trim();
    if(!problem||!code){ setGenStatus("#genStatus","err",t("gen_need_fields")); return; }
    if(!aiReady()){ setGenStatus("#genStatus","err",t("gen_need_model")); return; }
    button("#genRun").disabled=true; setGenStatus("#genStatus","busy",t("gen_running"));
    try{
      const reply=await vizAiCall([{role:"system",content:VIZ_SYSTEM_PROMPT},
        {role:"user",content:buildVizUserPrompt({problem,algorithm:field("#genAlgo").value.trim()||"—",input:field("#genInput").value.trim(),sourceCode:code,language:field("#genLang").value.trim()||"cpp"})}]);
      let parsed; try{ parsed=JSON.parse(extractJson(reply)); }
      catch(e: any){ setGenStatus("#genStatus","err",`${t("gen_badjson")}<br><code>${esc(String(e.message).slice(0,200))}</code>`); return; }
      const v=validateViz(parsed);
      if(!v.ok){ setGenStatus("#genStatus","err",`${t("gen_invalid")}<br><code>${esc(v.message)}</code>`); return; }
      if(!v.viz.sourceCode) v.viz.sourceCode={language:field("#genLang").value.trim()||"cpp",code};
      setGenStatus("#genStatus","ok",t("gen_ok").replace("{n}",String(v.viz.steps.length)));
      saveViz(v.viz); loadCustomViz(v.viz);
    }catch(e: any){ setGenStatus("#genStatus","err",esc(t("gen_failed"))+esc(e.message)); }
    finally{ button("#genRun").disabled=false; }
  };
  const doImport=(txt: string)=>{
    let parsed; try{ parsed=JSON.parse(extractJson(txt)); }
    catch(e: any){ setGenStatus("#impStatus","err",`${t("gen_badjson")}<br><code>${esc(String(e.message).slice(0,200))}</code>`); return; }
    const v=validateViz(parsed);
    if(!v.ok){ setGenStatus("#impStatus","err",`${t("gen_invalid")}<br><code>${esc(v.message)}</code>`); return; }
    setGenStatus("#impStatus","ok",t("gen_ok").replace("{n}",String(v.viz.steps.length)));
    saveViz(v.viz); loadCustomViz(v.viz);
  };
  must("#impRun").onclick=()=>doImport(field("#impJson").value);
  must("#impFileBtn").onclick=()=>must("#impFile").click();
  must("#impFile").onchange=e=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>{ field("#impJson").value=String(r.result||""); doImport(field("#impJson").value); }; r.readAsText(f); (e.target as HTMLInputElement).value=""; };
  must("#savedSearch").oninput=e=>{ savedQuery=(e.target as HTMLInputElement).value; renderSaved(); };
  must("#savedExportAll").onclick=()=>{ if(!db().visualizations.length) return; downloadJson(db().visualizations.map((s: SavedVisualization)=>s.visualization),"dsa-visualizations.json"); };
}
