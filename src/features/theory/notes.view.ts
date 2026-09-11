/* Method notes: the honest caveats. */

import { must, esc } from '@/core/dom';
import { tx } from '@/core/i18n';
import { METHOD_NOTES } from '@/data/notes';

export function renderNotes(){
  must("#notesGrid").innerHTML = METHOD_NOTES.map(n=>`<div class="note"><h4>${esc(tx(n.t))}</h4><p>${esc(tx(n.b))}</p></div>`).join("");
}
