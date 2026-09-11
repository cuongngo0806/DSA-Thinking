/* Conversation state. Sessions are stored so a thread can be reopened later,
   auto-titled from the first thing the learner said. */

import { $$, button, field, must, esc, mdBold } from '@/core/dom';
import { lang, t } from '@/core/i18n';
import { commit, db } from '@/core/db';
import { aiCall, aiReady, setStatus } from '@/core/ai';
import { buildSystemPrompt } from './prompt';

/* Cached because the transcript is appended to on every turn. */
const chatLog = () => must('#chatLog');
const chatInput = () => field<HTMLTextAreaElement>('#chatInput');
const chatSend = () => button('#chatSend');

let curChatId: string | null = null;
export function setCurrentChat(id: string | null): void { curChatId = id; }

export function curChat(){
  let c=db().chats.find(s=>s.id===curChatId);
  if(!c){ c={id:"c"+Date.now().toString(36),title:"",at:Date.now(),msgs:[]}; db().chats.unshift(c); curChatId=c.id; commit(); }
  return c;
}

export function newChat(){
  const c={id:"c"+Date.now().toString(36),title:"",at:Date.now(),msgs:[]};
  db().chats.unshift(c); curChatId=c.id;
  if(db().chats.length>60) db().chats=db().chats.slice(0,60);
  commit(); renderChatLog(); renderChatHist();
}

export function deleteChat(id: string): void {
  db().chats=db().chats.filter(s=>s.id!==id);
  if(curChatId===id){ curChatId=db().chats.length?db().chats[0].id:null; renderChatLog(); }
  commit(); renderChatHist();
}

export function switchChat(id: string): void { curChatId=id; commit(); renderChatLog(); renderChatHist(); must("#chatHistPanel").hidden=true; }

/** Rebuild the visible transcript from the stored session. */
export function renderChatLog(){
  const c=curChat(); const log=must("#chatLog"); log.innerHTML="";
  if(!c.msgs.length){ const d=document.createElement("div"); d.className="msg sys"; d.setAttribute("data-i18n","chat_init"); d.innerHTML=t("chat_init"); log.appendChild(d); return; }
  c.msgs.forEach((m)=>{ const d=document.createElement("div");
    d.className="msg "+(m.role==="user"?"user":"bot");
    d.innerHTML=m.role==="assistant"?mdBold(m.content):esc(m.content); log.appendChild(d); });
  log.scrollTop=log.scrollHeight;
}

export function renderChatHist(){
  const p=must("#chatHistPanel");
  const real=db().chats.filter(s=>s.msgs.length);
  if(!real.length){ p.innerHTML=`<div class="chat-hempty">${esc(t("chat_hist_empty"))}</div>`; return; }
  p.innerHTML=real.map((s)=>`<div class="chat-hitem ${s.id===curChatId?'on':''}" data-cid="${s.id}">
      <span class="ht">${esc(s.title||t("chat_untitled"))}</span>
      <span class="hd">${esc(new Date(s.at).toLocaleDateString(lang()==="vi"?"vi-VN":"en-US"))}</span>
      <button class="del" data-cdel="${s.id}">${esc(t("dict_del"))}</button></div>`).join("");
  $$("#chatHistPanel .chat-hitem").forEach(el=>el.onclick=e=>{ if((e.target as HTMLElement).hasAttribute("data-cdel")) return; switchChat(el.dataset.cid!); });
  $$("#chatHistPanel [data-cdel]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); deleteChat(b.dataset.cdel!); });
}

export function addMsg(role: string, text: string): HTMLElement {
  const d=document.createElement("div");
  d.className="msg "+(role==="user"?"user":role==="system"?"sys":"bot");
  d.innerHTML = role==="assistant"?mdBold(text):esc(text);
  chatLog().appendChild(d); chatLog().scrollTop=chatLog().scrollHeight; return d;
}

export async function sendChat(text: string): Promise<void> {
  text=text.trim(); if(!text) return;
  if(!aiReady()){ addMsg("system",t("need_config")); return; }
  const c=curChat();
  if(!c.msgs.length) chatLog().innerHTML="";        // drop the intro placeholder
  addMsg("user",text);
  c.msgs.push({role:"user",content:text});
  if(!c.title) c.title=text.slice(0,48);
  c.at=Date.now(); commit(); renderChatHist();
  chatInput().value=""; chatInput().style.height="auto"; chatSend().disabled=true;
  const wait = addMsg("assistant",t("chat_thinking"));
  try{
    const reply = await aiCall([{role:"system",content:buildSystemPrompt()}, ...c.msgs]);
    c.msgs.push({role:"assistant",content:reply}); c.at=Date.now(); commit(); renderChatHist();
    wait.innerHTML = mdBold(reply);
  }catch(e: any){
    wait.className="msg sys"; wait.textContent=t("chat_err_prefix")+e.message+t("chat_err_suffix");
    setStatus("err",t("status_err")+e.message);
  }finally{ chatSend().disabled=false; chatLog().scrollTop=chatLog().scrollHeight; }
}

export function initChatHistory(){
  must("#chatNew").onclick=()=>{ newChat(); must("#chatHistPanel").hidden=true; };
  must("#chatHistBtn").onclick=()=>{ const p=must("#chatHistPanel"); p.hidden=!p.hidden; if(!p.hidden) renderChatHist(); };
  renderChatLog(); renderChatHist();
}
