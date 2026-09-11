/* One AI connection shared by both roles. The tutor and the visualization
   generator differ only in system prompt - the endpoint, model and key are the
   same, so they are configured once.

   No temperature or max_tokens is sent: newer models reject or ignore them. */

import { $, $$, must, field } from '@/core/dom';
import { t } from '@/core/i18n';
import { KEYS, read, write as persist } from '@/core/storage';
import type { AiConfig, ChatMessage } from '@/types';

export let aiCfg: AiConfig = read<AiConfig>(KEYS.ai, {
  url: 'http://localhost:11434/v1',
  model: '',
  key: '',
});

export const aiReady = (): boolean => Boolean(aiCfg.url && aiCfg.model);

export function loadAiCfg(){ field("#setUrl").value=aiCfg.url||""; field("#setModel").value=aiCfg.model||""; field("#setKey").value=aiCfg.key||""; }

export function saveAiCfg(){
  aiCfg={url:field("#setUrl").value.trim(), model:field("#setModel").value.trim(), key:field("#setKey").value.trim()};
  persist(KEYS.ai, aiCfg); renderAiChip(); return aiCfg;
}

export function renderAiChip(){
  const c=$("#genAiChip"); if(!c) return;
  c.className="ai-chip "+(aiReady()?"ready":"none");
  c.textContent = aiReady() ? `${aiCfg.model}` : t("ai_not_set");
}

export function setStatus(cls: string, text: string): void { const s=must("#setStatus"); s.className="status "+cls; s.removeAttribute("data-i18n"); s.textContent=text; }

export function normUrl(u: string): string { u=(u||"").trim().replace(/\/+$/,""); if(!/\/v1$/.test(u)&&!/\/chat\/completions$/.test(u)) u+= u.match(/\/v\d+$/)?"":"/v1"; return u; }

export async function aiCall(messages: ChatMessage[], {test=false}: {test?: boolean}={}): Promise<string> {
  const cfg = saveAiCfg();
  const base = normUrl(cfg.url);
  if(!base){ throw new Error(t("err_no_url")); }
  if(!cfg.model && !test){ throw new Error(t("err_no_model")); }
  const headers: Record<string,string> = {"Content-Type":"application/json"};
  if(cfg.key) headers["Authorization"]="Bearer "+cfg.key;
  // No temperature / max_tokens: many newer models reject or ignore them.
  const body = {model:cfg.model||"test", messages, stream:false};
  const res = await fetch(base+"/chat/completions",{ method:"POST", headers, body:JSON.stringify(body) });
  if(!res.ok){ const tx2=await res.text().catch(()=>""); throw new Error(`HTTP ${res.status} ${tx2.slice(0,140)}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? t("err_no_content");
}

export function openSettings(){ loadAiCfg(); must("#settingsModal").hidden=false; setTimeout(()=>must("#setUrl").focus(),30); }

export function closeSettings(){ saveAiCfg(); must("#settingsModal").hidden=true; }

export function setSettingsTab(v: string): void {
  $$("#setTabs .lc-tab").forEach(b=>b.classList.toggle("on", b.dataset.st===v));
  must("#setPaneAi").hidden = v!=="ai"; must("#setPaneGit").hidden = v!=="git";
}

export function initSettings(){
  loadAiCfg(); renderAiChip();
  $$("#setTabs .lc-tab").forEach((b)=>b.onclick=()=>setSettingsTab(b.dataset.st!));
  must("#setBtn").onclick=openSettings;
  must("#setClose").onclick=closeSettings;
  must("#settingsModal").addEventListener("mousedown",e=>{ if(e.target===must("#settingsModal")) closeSettings(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!must("#settingsModal").hidden) closeSettings(); });
  must("#setTest").onclick = async ()=>{
    setStatus("wait",t("status_testing"));
    try{
      if(!field("#setModel").value.trim()){ setStatus("err",t("status_need_model")); return; }
      await aiCall([{role:"user",content:"Reply with exactly one word: OK"}],{test:true});
      setStatus("ok",t("status_ok"));
    }catch(e: any){ setStatus("err",t("status_err")+e.message); }
  };
}
