/**
 * Application bootstrap.
 *
 * Wiring order matters: load the database first (so every view has data to
 * render), apply language and theme before anything paints, then mount the
 * features and finally reveal the correct tab.
 */

import '@/styles/index.css';

import { must } from '@/core/dom';
import { applyStatic, setLang, toggleLang, lang } from '@/core/i18n';
import { applyTheme, themeGlyph, toggleTheme } from '@/core/theme';
import { bootstrapFromRepo, load, onChange } from '@/core/db';
import { initSettings, renderAiChip } from '@/core/ai';
import { applyTabs, initRouter } from '@/core/router';

import { renderQuestions, renderLadder } from '@/features/theory/map.view';
import { renderDict, initDictionary } from '@/features/theory/dictionary.view';
import { renderGuide, retranslateGuide, initGuided } from '@/features/theory/guided.view';
import { renderPractice } from '@/features/theory/drill.view';
import { renderLog, initLog } from '@/features/theory/log.view';
import { renderNotes } from '@/features/theory/notes.view';

import { initLC, renderRoadmap } from '@/features/roadmap/view';
import { initChatHistory, renderChatHist, renderChatLog } from '@/features/tutor/chat';
import { initViz, mountViz, refreshViz } from '@/features/visualizer/view';
import { initVizTabs, renderSaved } from '@/features/visualizer/library';
import { initGitSync, refreshSyncLine } from '@/features/sync/git';

/** Re-render everything that contains translated text. */
export function applyLang(): void {
  applyStatic();
  renderQuestions();
  renderLadder();
  renderDict();
  retranslateGuide();
  renderPractice();
  renderLog();
  renderNotes();
  renderRoadmap();
  refreshViz();
  renderSaved();
  renderChatLog();
  renderChatHist();
  renderAiChip();
}

function wireChrome(): void {
  const themeBtn = must('#themeBtn');
  themeBtn.textContent = themeGlyph();
  themeBtn.addEventListener('click', () => {
    toggleTheme();
    themeBtn.textContent = themeGlyph();
  });

  must('#langBtn').addEventListener('click', () => {
    toggleLang();
    applyLang();
  });
}

function boot(): void {
  load();
  setLang(lang());
  applyTheme();
  applyStatic();

  wireChrome();
  initRouter();

  // theory
  renderQuestions();
  renderLadder();
  initDictionary();
  renderDict();
  initGuided();
  renderGuide();
  renderPractice();
  initLog();
  renderLog();
  renderNotes();

  // practice
  initLC();
  renderRoadmap();
  initChatHistory();
  initSettings();
  initGitSync();
  initViz();
  mountViz();
  initVizTabs();

  // Mutations commit; the db announces the change and the views repaint. This
  // is what keeps the model modules free of any import back into the views.
  onChange(() => {
    renderRoadmap();
    renderDict();
    renderLog();
    renderSaved();
    renderChatHist();
    refreshSyncLine(); // solving something makes this session worth pushing
  });

  applyTabs(false);

  // A freshly cloned repo should hand you your data; merging never clobbers
  // anything already in this browser, so this is safe to run every start.
  void bootstrapFromRepo().then((merged) => {
    if (merged) applyLang();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
