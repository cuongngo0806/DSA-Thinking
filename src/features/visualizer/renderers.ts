/* One renderer per structure kind. The AI generates data, never UI - adding an
   algorithm means adding data, not writing a renderer. */

import { esc, fmtValue } from '@/core/dom';
import { t } from '@/core/i18n';
import type {
  ArrayComponentDef, ArrayState, ComponentState, GraphState, HashMapState,
  LinkedListState, MatrixState, QueueState, Role, StackState, TreeState,
  VariablesState, Visualization, VisualizationComponent,
} from './types';

/** The declaration a state refers to, or an empty stand-in. */
type Def = Partial<ArrayComponentDef> & Partial<VisualizationComponent>;

function defFor(id: string): Def {
  return (vizCur?.viz.components.find((c) => c.id === id) ?? {}) as Def;
}

/** Highlight roles for the current step, keyed by component id then index. */
let vizHi: Record<string, Record<number, string>> = {};
export function setHighlights(h: Record<string, Record<number, string>>): void { vizHi = h; }

let vizCur: { viz: Visualization } | null = null;
export function setRenderTarget(v: { viz: Visualization } | null): void { vizCur = v; }

export function vizStructWrap(def: Def, inner: string): string { return `<div class="viz-struct"><div class="viz-slabel">${esc((def&&def.label)||'')}</div>${inner}</div>`; }

export function renderArrayState(st: ArrayState): string {
  const def=defFor(st.id);
  const hi=vizHi[st.id]??{};
  let body;
  if(def.renderAsBars){
    const nums=st.values.map((v)=>typeof v==='number'?v:0); const max=Math.max(1,...nums);
    body=`<div class="viz-bars">`+st.values.map((v,i: number)=>{const r=hi[i];const h=Math.round((Number(v||0)/max)*128)+2;return `<div class="viz-barcol"><span class="viz-barval">${esc(fmtValue(v))}</span><div class="viz-barfill" style="height:${h}px" ${r?`data-role="${r}"`:''}></div></div>`;}).join('')+`</div>`;
  } else {
    body=`<div class="viz-row">`+st.values.map((v,i: number)=>{const r=hi[i];return `<div class="viz-cell" ${r?`data-role="${r}"`:''}>${v===null?'∅':esc(fmtValue(v))}</div>`;}).join('')+`</div>`;
  }
  let idx=''; if(def.showIndices!==false) idx=`<div class="viz-idxrow">`+st.values.map((_,i: number)=>`<div class="viz-idx">${i}</div>`).join('')+`</div>`;
  let ptr=''; if(st.pointers&&st.pointers.length){ ptr=`<div class="viz-ptrrow">`+st.values.map((_,i: number)=>{const ps=(st.pointers??[]).filter((p)=>p.index===i);return `<div class="viz-ptrcol">`+ps.map(p=>`<span class="viz-ptr" data-role="${p.role||'active'}">${esc(p.name)}</span>`).join('')+`</div>`;}).join('')+`</div>`; }
  return vizStructWrap(def, body+idx+ptr);
}

export function renderStackState(st: StackState): string {
  const def=defFor(st.id);
  let inner; if(!st.values.length){ inner=`<div class="viz-stackempty">— ${esc(t('viz_empty'))} —</div>`; }
  else { const top=[...st.values].reverse(); inner=`<div class="viz-stack">`+top.map((v,k: number)=>`<div class="viz-sbox">${esc(fmtValue(v))}${k===0?`<span class="tp">← ${esc(t('viz_top'))}</span>`:''}</div>`).join('')+`</div>`; }
  return vizStructWrap(def, inner);
}

export function renderQueueState(st: QueueState): string {
  const def=defFor(st.id);
  let inner; if(!st.values.length){ inner=`<div class="viz-stackempty">— ${esc(t('viz_empty'))} —</div>`; }
  else { inner=`<div class="viz-queue">`+st.values.map((v,i: number)=>{const tag=i===0?t('viz_front'):(i===st.values.length-1?t('viz_back'):'');return `<div class="viz-qbox">${tag?`<span class="viz-qtag">${esc(tag)}</span>`:''}${esc(fmtValue(v))}</div>`;}).join('')+`</div>`; }
  return vizStructWrap(def, inner);
}

export function renderVariablesState(st: VariablesState): string {
  const def=defFor(st.id);
  const keys=Object.keys(st.values??{});
  const inner=keys.length?`<div class="viz-vars">`+keys.map((k: string)=>`<span class="viz-var"><b>${esc(k)}</b> = ${esc(fmtValue(st.values[k]))}</span>`).join('')+`</div>`:`<div class="viz-mapempty">—</div>`;
  return vizStructWrap(def, inner);
}

export function renderHashMapState(st: HashMapState): string {
  const def=defFor(st.id);
  const inner=st.entries&&st.entries.length?`<div class="viz-map">`+st.entries.map((e)=>`<span class="viz-me" ${e.role?`data-role="${e.role}"`:''}><b>${esc(e.key)}</b> → ${esc(fmtValue(e.value))}</span>`).join('')+`</div>`:`<div class="viz-mapempty">— ${esc(t('viz_empty'))} —</div>`;
  return vizStructWrap(def, inner);
}

export function renderLinkedListState(st: LinkedListState): string {
  const def=defFor(st.id);
  const byNode: Record<string, NonNullable<LinkedListState["pointers"]>>={};
  const nullPtrs: NonNullable<LinkedListState["pointers"]>=[]; (st.pointers??[]).forEach((p)=>{ if(p.nodeId==null) nullPtrs.push(p); else (byNode[p.nodeId]=byNode[p.nodeId]||[]).push(p); });
  const prio: Record<string, number>={active:3,boundary:2,visited:1};
  const nodesHtml=st.nodes.map((nd,i: number)=>{
    const ps=byNode[nd.id]||[]; let role: Role|null=null; ps.forEach((p)=>{ if(p.role&&(role===null||(prio[p.role]||0)>(prio[role]||0))) role=p.role; });
    const chips=ps.map(p=>`<span class="viz-ptr" data-role="${p.role||'active'}">${esc(p.name)}</span>`).join('');
    const col=`<div class="viz-lcol"><div class="viz-lptr">${chips}</div><div class="viz-lnode" ${role?`data-role="${role}"`:''}>${esc(fmtValue(nd.value))}</div></div>`;
    const tail=i<st.nodes.length-1?`<span class="viz-larrow">→</span>`:`<span class="viz-larrow">→</span><span class="viz-lnull">∅</span>`;
    return col+tail;
  }).join('');
  let inner=`<div class="viz-list">${nodesHtml}</div>`;
  if(nullPtrs.length) inner+=`<div class="viz-lnull" style="margin-top:8px;padding-left:0">`+nullPtrs.map((p)=>`${esc(p.name)} → ∅`).join('  ·  ')+`</div>`;
  return vizStructWrap(def, inner);
}

export function renderGraphState(st: GraphState): string {
  const def=defFor(st.id);
  const W=300,H=210,pad=28; const byId=Object.fromEntries(st.nodes.map((n)=>[n.id,n]));
  const px=(n: {x?: number})=>pad+(n.x??.5)*(W-2*pad);
  const py=(n: {y?: number})=>pad+(n.y??.5)*(H-2*pad);
  const active=new Set(st.activeEdges||[]);
  const edges=st.edges.map((e)=>{const a=byId[e.from],b=byId[e.to];const on=active.has(`${e.from}->${e.to}`)||active.has(`${e.to}->${e.from}`);return `<line class="viz-gedge ${on?'on':''}" x1="${px(a).toFixed(1)}" y1="${py(a).toFixed(1)}" x2="${px(b).toFixed(1)}" y2="${py(b).toFixed(1)}"/>`;}).join('');
  const nodes=st.nodes.map((n)=>{const role=(st.nodeRoles||{})[n.id]||'';return `<g class="viz-gnode ${role}"><circle cx="${px(n).toFixed(1)}" cy="${py(n).toFixed(1)}" r="16"/><text x="${px(n).toFixed(1)}" y="${py(n).toFixed(1)}" dy=".34em" text-anchor="middle">${esc(n.label||n.id)}</text></g>`;}).join('');
  return vizStructWrap(def, `<svg class="viz-graph" viewBox="0 0 ${W} ${H}">${edges}${nodes}</svg>`);
}

export function renderMatrixState(st: MatrixState): string {
  const def=defFor(st.id);
  const cur=st.current?`${st.current[0]},${st.current[1]}`:'';
  const inner=`<div>`+st.values.map((row,r: number)=>`<div class="viz-row">`+row.map((v,c: number)=>{const isCur=cur===`${r},${c}`;return `<div class="viz-cell" ${isCur?'data-role="active"':''}>${v===null?'·':esc(fmtValue(v))}</div>`;}).join('')+`</div>`).join('')+`</div>`;
  return vizStructWrap(def, inner);
}

export function renderTreeState(st: TreeState): string {
  const def=defFor(st.id);
  const byId=Object.fromEntries((st.nodes??[]).map((n)=>[n.id,n]));
  const pos: Record<string,{x:number;y:number}>={}; let idx=0, maxD=0;
  (function walk(id: string|null|undefined, d: number){ const n=id!=null&&byId[id]; if(!n) return; maxD=Math.max(maxD,d);
    walk(n.left,d+1); pos[n.id]={x:idx++,y:d}; walk(n.right,d+1); })(st.root,0);
  const keys=Object.keys(pos);
  if(!keys.length) return vizStructWrap(def,`<div class="viz-stackempty">— ${esc(t('viz_empty'))} —</div>`);
  const maxX=Math.max(...keys.map((k: string)=>pos[k].x));
  const W=Math.max(260,(maxX+1)*58), H=(maxD+1)*64+16, pad=26;
  const px=(p:{x:number})=>maxX?pad+(p.x/maxX)*(W-2*pad):W/2;
  const py=(p:{y:number})=>26+p.y*64;
  let edges='';
  keys.forEach((id: string)=>{ const n=byId[id]; (['left','right'] as const).forEach((side)=>{ const c=n[side]; if(c!=null&&pos[c])
    edges+=`<line class="viz-gedge" x1="${px(pos[id]).toFixed(1)}" y1="${py(pos[id]).toFixed(1)}" x2="${px(pos[c]).toFixed(1)}" y2="${py(pos[c]).toFixed(1)}"/>`; }); });
  const nodes=keys.map((id: string)=>{ const role=(st.nodeRoles||{})[id]||'';
    return `<g class="viz-gnode ${role}"><circle cx="${px(pos[id]).toFixed(1)}" cy="${py(pos[id]).toFixed(1)}" r="16"/><text x="${px(pos[id]).toFixed(1)}" y="${py(pos[id]).toFixed(1)}" dy=".34em" text-anchor="middle">${esc(fmtValue(byId[id].value))}</text></g>`; }).join('');
  return vizStructWrap(def,`<svg class="viz-graph" style="max-width:${W}px" viewBox="0 0 ${W} ${H}">${edges}${nodes}</svg>`);
}

export function renderState(st: ComponentState): string {
  switch(st.type){
    case 'tree': return renderTreeState(st);
    case 'array': return renderArrayState(st);
    case 'stack': return renderStackState(st);
    case 'queue': return renderQueueState(st);
    case 'variables': return renderVariablesState(st);
    case 'hashmap': return renderHashMapState(st);
    case 'linkedlist': return renderLinkedListState(st);
    case 'graph': return renderGraphState(st);
    case 'matrix': return renderMatrixState(st);
    default: return '';
  }
}
