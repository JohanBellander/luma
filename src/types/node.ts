/**
 * Node type definitions for LUMA scaffolds
 */

export type WidthPolicy = 'hug' | 'fill' | 'fixed';
export type HeightPolicy = 'hug' | 'fill' | 'fixed';

export interface SizeConstraint {
  w?: number;
  h?: number;
}

export type ResponsiveOverrides = Record<string, Partial<Node>>;

/**
 * Common node fields (apply to all node types)
 */
export interface BaseNode {
  id: string; // required, unique per screen
  type: string; // Stack|Grid|Box|Text|Button|Field|Form|Table
  visible?: boolean; // default true
  widthPolicy?: WidthPolicy; // default "hug"
  heightPolicy?: HeightPolicy; // default "hug"
  minSize?: SizeConstraint;
  maxSize?: SizeConstraint;
  at?: ResponsiveOverrides; // responsive overrides keyed by "<=N" or ">=N"
  /**
   * Optional pattern annotation (non-functional v1.0):
   * Allows authors to tag nodes with a known pattern name (e.g., "Form.Basic", "Table.Simple").
   * Ingest will emit a warning if the annotation does not match a known pattern or alias.
   * This is a forward-looking affordance for future pattern-aware explain/summary commands.
   */
  pattern?: string;
  /**
   * Optional behaviors metadata for non-visual semantics.
   * Progressive Disclosure pattern will look for behaviors.disclosure hints.
   * Non-breaking: absence of this object never causes validation failure.
   */
  behaviors?: {
    disclosure?: DisclosureBehavior;
    /**
     * Optional guided flow hints for multi-step wizard flows.
     * Presence of these hints can auto-activate the Guided.Flow pattern.
     * Non-breaking: absence never causes validation failure.
     */
    guidedFlow?: GuidedFlowBehavior;
  };
  /**
   * Optional affordances array for visual/interaction hints.
   * Used by Progressive Disclosure pattern for consistency checks.
   * Example values: "chevron", "details", "accordion"
   */
  affordances?: string[];
}

/**
 * Hint structure for progressive disclosure (collapsible sections).
 * Adding this is optional; if present it can trigger automatic pattern activation.
 */
export interface DisclosureBehavior {
  collapsible: boolean; // true marks node as a collapsible section
  defaultState?: 'collapsed' | 'expanded'; // default collapsed if omitted
  controlsId?: string; // id of explicit control button (optional)
  ariaSummaryText?: string; // optional accessible summary override
}

/**
 * Hint structure for guided multi-step flows (wizard pattern).
 * Adding this is optional; if present it can trigger Guided.Flow pattern activation.
 */
export interface GuidedFlowBehavior {
  role: 'wizard' | 'step'; // identifies container vs step
  /**
   * Index of the step (1-based). Required when role === 'step'.
   */
  stepIndex?: number;
  /**
   * Total number of steps. Recommended on wizard and steps for consistency; if omitted, derived.
   */
  totalSteps?: number;
  /**
   * Explicit next action button id (optional).
   */
  nextId?: string;
  /**
   * Explicit previous action button id (optional, not used on first step).
   */
  prevId?: string;
  /**
   * Indicates presence of a progress indicator node. Wizard role may set hasProgress true.
   */
  hasProgress?: boolean;
  /**
   * Optional id referencing a Text or progress indicator node.
   */
  progressNodeId?: string;
}

export type StackDirection = 'vertical' | 'horizontal';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

export interface StackNode extends BaseNode {
  type: 'Stack';
  direction: StackDirection; // required
  gap?: number; // default 0
  padding?: number; // default 0
  align?: StackAlign; // default "start"
  wrap?: boolean; // default false, only applies if direction:"horizontal"
  children: Node[]; // required
}

export interface GridNode extends BaseNode {
  type: 'Grid';
  columns: number; // required, intended max columns
  gap?: number; // default 0
  minColWidth?: number; // allows column reduction on small viewports
  children: Node[]; // required
}

export interface BoxNode extends BaseNode {
  type: 'Box';
  padding?: number; // default 0
  child?: Node;
}

export interface TextNode extends BaseNode {
  type: 'Text';
  text: string; // required
  fontSize?: number; // default 16
  maxLines?: number;
  intrinsicTextWidth?: number; // if set, used as single-line width hint
}

export type ButtonRoleHint = 'primary' | 'secondary' | 'danger' | 'link';

export interface ButtonNode extends BaseNode {
  type: 'Button';
  text?: string; // if absent, treat as icon-only
  focusable?: boolean; // default true
  tabIndex?: number; // non-zero discouraged
  roleHint?: ButtonRoleHint;
}

export type FieldInputType = 'text' | 'email' | 'password' | 'number' | 'date';

export interface FieldNode extends BaseNode {
  type: 'Field';
  label: string; // required, non-empty
  inputType?: FieldInputType;
  required?: boolean;
  helpText?: string;
  errorText?: string;
  focusable?: boolean; // default true
}

export interface FormNode extends BaseNode {
  type: 'Form';
  title?: string;
  fields: FieldNode[]; // required, length ≥1
  actions: ButtonNode[]; // required, length ≥1
  states: string[]; // must include "default", include "error" if any field has errorText
}

export type TableResponsiveStrategy = 'wrap' | 'scroll' | 'cards';

export interface TableResponsive {
  strategy: TableResponsiveStrategy; // required
  minColumnWidth?: number;
}

export interface TableNode extends BaseNode {
  type: 'Table';
  title: string; // required, non-empty
  columns: string[]; // required, length ≥1
  rows?: number; // density heuristic
  responsive: TableResponsive; // required
  states?: string[]; // recommended: "default", "empty", "loading"
}

export type Node =
  | StackNode
  | GridNode
  | BoxNode
  | TextNode
  | ButtonNode
  | FieldNode
  | FormNode
  | TableNode;
