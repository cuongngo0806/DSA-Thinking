/**
 * Shared domain types.
 *
 * These describe what the app stores and moves around. Feature-local shapes
 * (e.g. the visualization spec) live next to their feature instead.
 */

export type Lang = 'vi' | 'en';
export type Theme = 'dark' | 'light';

/** The four relations the whole compass is organised around. */
export type Relation = 'identity' | 'order' | 'dependency' | 'traverse';

/** A string that exists in both interface languages. */
export type Bilingual = Record<Lang, string>;

/* ------------------------------------------------------------------ *
 * Theory
 * ------------------------------------------------------------------ */

export interface TriggerEntry {
  rel: Relation;
  signal: Bilingual;
  tool: Bilingual;
  /** May contain **bold** markers. */
  why: Bilingual;
}

/** A trigger the learner wrote themselves; single-language by nature. */
export interface UserTrigger {
  rel: Relation;
  signal: string;
  tool: string;
  why: string;
}

export interface LogEntry {
  problem: string;
  trigger: string;
  date: string;
}

/* ------------------------------------------------------------------ *
 * Roadmap
 * ------------------------------------------------------------------ */

/** LeetCode difficulty, stored compactly. */
export type Difficulty = 'E' | 'M' | 'H';

export interface Problem {
  /** LeetCode slug, also the progress key. */
  s: string;
  /** Title. */
  t: string;
  /** Topic group id. */
  g: string;
  d: Difficulty;
}

export type Confidence = 'shaky' | 'solid';

export interface ProblemProgress {
  done?: boolean;
  /** ISO date the problem was solved. */
  date?: string;
  conf?: Confidence;
  /** The one-line signal the learner compressed out of it. */
  note?: string;
  /** Index into the spaced-repetition interval table. */
  stage?: number;
  nextReview?: string | null;
}

/** Which of finish-date / per-day the learner pinned; the other is derived. */
export type PlanMode = 'perDay' | 'end';

export interface PlanConfig {
  start: string;
  end: string;
  perDay: number;
  mode: PlanMode;
  /** How many problems of the full list to actually aim for. */
  target: number;
  username: string;
}

/** date (YYYY-MM-DD) -> number of actions that day. */
export type ActivityMap = Record<string, number>;
export type ProgressMap = Record<string, ProblemProgress>;

/* ------------------------------------------------------------------ *
 * Tutor
 * ------------------------------------------------------------------ */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatSession {
  id: string;
  /** Auto-derived from the first message. */
  title: string;
  /** Epoch ms of the last activity. */
  at: number;
  msgs: ChatMessage[];
}

/* ------------------------------------------------------------------ *
 * AI connection (shared by the tutor and the visualization generator)
 * ------------------------------------------------------------------ */

export interface AiConfig {
  url: string;
  model: string;
  key: string;
}

/* ------------------------------------------------------------------ *
 * The database
 * ------------------------------------------------------------------ */

/** Everything that travels between machines. Secrets are deliberately absent. */
export interface StoreData {
  plan: PlanConfig;
  progress: ProgressMap;
  activity: ActivityMap;
  triggers: UserTrigger[];
  log: LogEntry[];
  chats: ChatSession[];
  visualizations: SavedVisualization[];
}

export interface StoreFile {
  app: 'dsa-compass';
  schema: number;
  updatedAt: string;
  data: StoreData;
}

/** A generated or imported visualization kept in the library. */
export interface SavedVisualization {
  id: string;
  title: string;
  algorithm: string;
  savedAt: number;
  /** The spec itself; typed in features/visualizer/types.ts. */
  visualization: unknown;
}
