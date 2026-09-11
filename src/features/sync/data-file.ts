/* The bridge between browser storage and git. A page cannot write into the repo
   folder, so the app hands you a file and `scripts/sync` commits it. */

import { $, must, downloadJson } from '@/core/dom';
import { t } from '@/core/i18n';
import { DATA_FILE, mergeFile, toFile } from '@/core/db';

export function setGitStatus(cls: string, text: string): void { const e=$("#gitStatus"); if(!e) return; e.className="status "+cls; e.removeAttribute("data-i18n"); e.textContent=text; }

export function exportDataFile(){
  downloadJson(toFile(), DATA_FILE);
  setGitStatus("ok",t("git_saved_file")+" "+DATA_FILE);
}

export function importDataFile(file: File): void {
  const r=new FileReader();
  r.onload=()=>{
    try{
      const bundle=JSON.parse(String(r.result||""));
      mergeFile(bundle);
      
      setGitStatus("ok",t("git_loaded_file"));
    }catch(e: any){ setGitStatus("err",t("git_failed")+e.message); }
  };
  r.readAsText(file);
}

export function initGitSync(){
  must("#dataExport").onclick=exportDataFile;
  must("#dataImportBtn").onclick=()=>must("#dataImport").click();
  must("#dataImport").onchange=e=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) importDataFile(f); (e.target as HTMLInputElement).value=""; };
}
