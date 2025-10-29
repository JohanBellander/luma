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
   * Optional behaviors metadata for non-visual semantics.
   * Progressive Disclosure pattern will look for behaviors.disclosure hints.
   * Non-breaking: absence of this object never causes validation failure.
   */
  behaviors?: {
    disclosure?: DisclosureBehavior;
  };
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
