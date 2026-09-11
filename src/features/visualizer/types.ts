/**
 * The visualization spec.
 *
 * This file is the contract between three parties: the example generators, the
 * AI that emits JSON, and the renderers that draw it. Adding an algorithm means
 * producing data of these shapes - never writing a new renderer.
 */

import type { Bilingual, Relation } from '@/types';

export type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export type ComponentType =
  | 'array' | 'stack' | 'queue' | 'variables' | 'hashmap'
  | 'linkedlist' | 'tree' | 'graph' | 'matrix';

/** Semantic roles that colour a cell, pointer or node. */
export type Role =
  | 'default'
  | 'active'    // being processed right now
  | 'compare'   // being compared against
  | 'visited'   // already processed
  | 'pop'       // about to leave a structure
  | 'push'      // about to enter one
  | 'boundary'  // a wall: left/right in two-pointer or rain water
  | 'result';   // contributes to the final answer

/* ---- component declarations (static, on the root) ---- */

export interface ComponentBase {
  id: string;
  type: ComponentType;
  label?: string;
}

export interface ArrayComponentDef extends ComponentBase {
  type: 'array';
  showIndices?: boolean;
  /** Draw values as proportional bars - right for elevation maps. */
  renderAsBars?: boolean;
}

export interface StackComponentDef extends ComponentBase {
  type: 'stack';
  /** Set when the stack holds indices into another component. */
  indicesInto?: string;
}

export interface GraphComponentDef extends ComponentBase {
  type: 'graph';
  directed?: boolean;
}

export type VisualizationComponent =
  | ArrayComponentDef
  | StackComponentDef
  | GraphComponentDef
  | (ComponentBase & { type: Exclude<ComponentType, 'array' | 'stack' | 'graph'> });

/* ---- per-step state (dynamic) ---- */

export interface Pointer {
  name: string;
  index: number;
  role?: Role;
}

export interface ArrayState {
  type: 'array';
  id: string;
  values: (number | string | null)[];
  pointers?: Pointer[];
}

/** Bottom-to-top; the last element is the top. */
export interface StackState {
  type: 'stack';
  id: string;
  values: (number | string)[];
}

/** Front-to-back; the first element is the front. */
export interface QueueState {
  type: 'queue';
  id: string;
  values: (number | string)[];
}

export interface VariablesState {
  type: 'variables';
  id: string;
  values: Record<string, JSONValue>;
}

export interface HashMapEntry {
  key: string;
  value: JSONValue;
  role?: Role;
}

export interface HashMapState {
  type: 'hashmap';
  id: string;
  entries: HashMapEntry[];
}

export interface ListNode {
  id: string;
  value: number | string;
}

export interface LinkedListState {
  type: 'linkedlist';
  id: string;
  nodes: ListNode[];
  pointers?: { name: string; nodeId: string | null; role?: Role }[];
}

export interface TreeNode {
  id: string;
  value: number | string;
  left?: string | null;
  right?: string | null;
}

export interface TreeState {
  type: 'tree';
  id: string;
  root: string | null;
  nodes: TreeNode[];
  nodeRoles?: Record<string, Role>;
}

export interface GraphNode {
  id: string;
  label?: string;
  /** Normalised 0..1 layout position, so the drawing is deterministic. */
  x?: number;
  y?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
}

export interface GraphState {
  type: 'graph';
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeRoles?: Record<string, Role>;
  /** Edges to emphasise, encoded as "from->to". */
  activeEdges?: string[];
}

export interface MatrixState {
  type: 'matrix';
  id: string;
  values: (number | string | null)[][];
  current?: [number, number];
  dependencies?: [number, number][];
  updated?: [number, number][];
}

export type ComponentState =
  | ArrayState | StackState | QueueState | VariablesState | HashMapState
  | LinkedListState | TreeState | GraphState | MatrixState;

/* ---- steps ---- */

export interface Highlight {
  component: string;
  indices?: number[];
  role?: Role;
}

export interface VisualizationStep {
  id: number;
  /** Teaching-oriented: what is examined, the decision, and why it matters. */
  description: string;
  /** A 1-3 word stage label, so a long trace reads as a few phases. */
  phase?: string;
  action?: { type: string; target?: string };
  variables?: Record<string, JSONValue>;
  /** Complete state of every declared component - not a diff. */
  components?: ComponentState[];
  highlights?: Highlight[];
  /** The arithmetic behind the decision, with real numbers. */
  calculation?: string;
  /** The running answer, not only on the last step. */
  result?: JSONValue;
  /** 1-based line of `sourceCode.code` being executed. */
  codeLine?: number;
}

export interface Explanation {
  intuition: string;
  approach: string[];
  whyItWorks?: string;
  pitfalls?: string[];
}

export interface Visualization {
  title: string;
  algorithm: string;
  input?: { name: string; value: JSONValue; description?: string };
  output?: { name: string; value: JSONValue; description?: string };
  complexity?: { time: string; space: string };
  explanation?: Explanation;
  components: VisualizationComponent[];
  sourceCode?: { language: string; code: string };
  steps: VisualizationStep[];
}

/* ---- library entries ---- */

/** The bilingual explanation attached to a built-in example. */
export interface ExampleExplanation {
  intuition: string;
  approach: string[];
  why?: string;
  pitfalls?: string[];
}

export interface VizExample {
  key: string;
  name: Bilingual;
  viz: Visualization;
  /** Built-ins carry a hand-written bilingual explanation. */
  expl?: Record<'vi' | 'en', ExampleExplanation> | null;
  /** Which relation the algorithm exploits - ties back to the compass. */
  rel?: Relation;
  /** True for generated or imported specs. */
  custom?: boolean;
}
