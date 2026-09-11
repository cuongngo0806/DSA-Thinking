/* Validation at the trust boundary. AI output is data from outside, so it gets
   checked field by field and rejected with a message precise enough to hand
   straight back to the model. */

import type { Visualization } from './types';

export const VIZ_TYPES = [
  'array', 'stack', 'queue', 'variables', 'hashmap',
  'linkedlist', 'tree', 'graph', 'matrix',
] as const;

export type ValidationResult =
  | { ok: true; viz: Visualization }
  | { ok: false; message: string };

export function validateViz(o: unknown): ValidationResult {
  const E = (m: string): ValidationResult => ({ok:false, message:m});
  if(!o||typeof o!=='object'||Array.isArray(o)) return E('Root must be a JSON object.');
  const v = o as Record<string, any>;
  if(typeof v.title!=='string'||!v.title.trim()) return E('"title" must be a non-empty string.');
  if(typeof v.algorithm!=='string'||!v.algorithm.trim()) v.algorithm='—';
  if(!Array.isArray(v.components)||!v.components.length) return E('"components" must be a non-empty array.');
  const ids=new Set();
  for(let i=0;i<v.components.length;i++){
    const c=v.components[i];
    if(!c||typeof c!=='object') return E(`components[${i}] must be an object.`);
    if(!VIZ_TYPES.includes(c.type)) return E(`components[${i}].type "${c.type}" is not one of: ${VIZ_TYPES.join(', ')}.`);
    if(typeof c.id!=='string'||!c.id) return E(`components[${i}].id must be a non-empty string.`);
    if(ids.has(c.id)) return E(`components[${i}].id "${c.id}" is duplicated.`);
    ids.add(c.id);
  }
  if(!Array.isArray(v.steps)||!v.steps.length) return E('"steps" must be a non-empty array.');
  const maxLine=(v.sourceCode&&typeof v.sourceCode.code==='string')?v.sourceCode.code.split('\n').length:0;
  for(let i=0;i<v.steps.length;i++){
    const s=v.steps[i];
    if(!s||typeof s!=='object') return E(`steps[${i}] must be an object.`);
    if(typeof s.description!=='string') return E(`steps[${i}].description must be a string.`);
    if(typeof s.id!=='number') s.id=i;
    if(s.components!==undefined){
      if(!Array.isArray(s.components)) return E(`steps[${i}].components must be an array.`);
      for(let j=0;j<s.components.length;j++){
        const st=s.components[j], at=`steps[${i}].components[${j}]`;
        if(!st||typeof st!=='object') return E(`${at} must be an object.`);
        if(!VIZ_TYPES.includes(st.type)) return E(`${at}.type "${st.type}" is invalid.`);
        if(!ids.has(st.id)) return E(`${at}.id "${st.id}" is not declared in the root "components" array.`);
        if((st.type==='array'||st.type==='stack'||st.type==='queue'||st.type==='matrix')&&!Array.isArray(st.values)) return E(`${at}.values must be an array.`);
        if(st.type==='variables'&&(!st.values||typeof st.values!=='object')) return E(`${at}.values must be an object.`);
        if(st.type==='hashmap'&&!Array.isArray(st.entries)) return E(`${at}.entries must be an array.`);
        if(st.type==='linkedlist'&&!Array.isArray(st.nodes)) return E(`${at}.nodes must be an array.`);
        if(st.type==='tree'&&!Array.isArray(st.nodes)) return E(`${at}.nodes must be an array.`);
        if(st.type==='graph'&&(!Array.isArray(st.nodes)||!Array.isArray(st.edges))) return E(`${at} (graph) needs both "nodes" and "edges" arrays.`);
      }
    }
    if(s.highlights!==undefined){
      if(!Array.isArray(s.highlights)) return E(`steps[${i}].highlights must be an array.`);
      for(let j=0;j<s.highlights.length;j++){ const h=s.highlights[j];
        if(!h||typeof h!=='object') return E(`steps[${i}].highlights[${j}] must be an object.`);
        if(!ids.has(h.component)) return E(`steps[${i}].highlights[${j}].component "${h.component}" is not declared in the root "components" array.`); }
    }
    if(s.codeLine!==undefined&&maxLine&&(typeof s.codeLine!=='number'||s.codeLine<1||s.codeLine>maxLine))
      return E(`steps[${i}].codeLine is ${s.codeLine}, outside the source range 1..${maxLine}.`);
  }
  return {ok:true, viz: v as unknown as Visualization};
}

/** Pull a JSON object out of a model reply that may wrap it in prose or fences. */
export function extractJson(text: unknown): string {
  let s=String(text||'').trim();
  const fence=s.match(/```(?:json)?\s*([\s\S]*?)```/i); if(fence) s=fence[1].trim();
  const a=s.indexOf('{'), b=s.lastIndexOf('}');
  if(a>=0&&b>a) s=s.slice(a,b+1);
  return s;
}
