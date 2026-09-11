/* Tab state: Practice / Theory at the top, a sub-tab strip inside each. Which
   pane is showing is persisted, so reopening lands you where you left off. */

import { $$, must } from '@/core/dom';
import { KEYS, read, write as persist } from '@/core/storage';

export type TopTab = 'practice' | 'theory';

let topTab: TopTab = read<TopTab>(KEYS.topTab, 'practice') === 'theory' ? 'theory' : 'practice';
const subTab = {
  practice: read<string>(KEYS.subTabPractice, 'roadmap'),
  theory: read<string>(KEYS.subTabTheory, 'map'),
};

export function initRouter(): void {
  $$("#topTabs .top-tab").forEach(b=>b.onclick=()=>{ topTab=b.dataset.top as TopTab; persist(KEYS.topTab, topTab); applyTabs(true); });
  $$("#pSubTabs .sub-tab").forEach(b=>b.onclick=()=>{ subTab.practice=b.dataset.sub!; persist(KEYS.subTabPractice, subTab.practice); applyTabs(true); });
  $$("#tSubTabs .sub-tab").forEach(b=>b.onclick=()=>{ subTab.theory=b.dataset.sub!; persist(KEYS.subTabTheory, subTab.theory); applyTabs(true); });
}

export function applyTabs(scroll: boolean): void {
  $$("#topTabs .top-tab").forEach(b=>b.classList.toggle("on", b.dataset.top===topTab));
  must("#heroSec").hidden = topTab!=="theory";
  must("#pSubTabs").hidden = topTab!=="practice";
  must("#tSubTabs").hidden = topTab!=="theory";
  $$("#pSubTabs .sub-tab").forEach(b=>b.classList.toggle("on", b.dataset.sub===subTab.practice));
  $$("#tSubTabs .sub-tab").forEach(b=>b.classList.toggle("on", b.dataset.sub===subTab.theory));
  $$("section.block[data-pane]").forEach(s=>{
    s.hidden = !(s.dataset.pane===topTab && s.dataset.sub===subTab[topTab]);
  });
  if(scroll) window.scrollTo({top:0,behavior:"smooth"});
}
