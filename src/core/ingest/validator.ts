/**
 * Zod schemas for scaffold validation
 */

import { z } from 'zod';

// Common node fields
const baseNodeSchema = z.object({
  id: z.string().min(1, 'Node ID is required'),
  type: z.string(),
  visible: z.boolean().optional().default(true),
  widthPolicy: z.enum(['hug', 'fill', 'fixed']).optional().default('hug'),
  heightPolicy: z.enum(['hug', 'fill', 'fixed']).optional().default('hug'),
  minSize: z.object({ w: z.number().optional(), h: z.number().optional() }).optional(),
  maxSize: z.object({ w: z.number().optional(), h: z.number().optional() }).optional(),
  at: z.record(z.string(), z.any()).optional(), // Responsive overrides
});

// Stack node schema
export const stackNodeSchema = baseNodeSchema.extend({
  type: z.literal('Stack'),
  direction: z.enum(['vertical', 'horizontal']),
  gap: z.number().optional().default(0),
  padding: z.number().optional().default(0),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional().default('start'),
  wrap: z.boolean().optional().default(false),
  children: z.lazy(() => z.array(nodeSchema)),
}).strict();

// Grid node schema
export const gridNodeSchema = baseNodeSchema.extend({
  type: z.literal('Grid'),
  columns: z.number().int().positive(),
  gap: z.number().optional().default(0),
  minColWidth: z.number().optional(),
  children: z.lazy(() => z.array(nodeSchema)),
}).strict();

// Box node schema
export const boxNodeSchema = baseNodeSchema.extend({
  type: z.literal('Box'),
  padding: z.number().optional().default(0),
  child: z.lazy(() => nodeSchema.optional()),
}).strict();

// Text node schema
export const textNodeSchema = baseNodeSchema.extend({
  type: z.literal('Text'),
  text: z.string(),
  fontSize: z.number().optional().default(16),
  maxLines: z.number().optional(),
  intrinsicTextWidth: z.number().optional(),
}).strict();

// Button node schema
export const buttonNodeSchema = baseNodeSchema.extend({
  type: z.literal('Button'),
  text: z.string().optional(),
  focusable: z.boolean().optional().default(true),
  tabIndex: z.number().optional(),
  roleHint: z.enum(['primary', 'secondary', 'danger', 'link']).optional(),
}).strict();

// Field node schema
export const fieldNodeSchema = baseNodeSchema.extend({
  type: z.literal('Field'),
  label: z.string().min(1, 'Field label is required and cannot be empty'),
  inputType: z.enum(['text', 'email', 'password', 'number', 'date']).optional(),
  required: z.boolean().optional(),
  helpText: z.string().optional(),
  errorText: z.string().optional(),
  focusable: z.boolean().optional().default(true),
}).strict();

// Form node schema
export const formNodeSchema = baseNodeSchema.extend({
  type: z.literal('Form'),
  title: z.string().optional(),
  fields: z.array(fieldNodeSchema).min(1, 'Form must have at least one field'),
  actions: z.array(buttonNodeSchema).min(1, 'Form must have at least one action'),
  states: z.array(z.string()).min(1, 'Form must include at least "default" state'),
}).strict();

// Table node schema
const tableResponsiveSchema = z.object({
  strategy: z.enum(['wrap', 'scroll', 'cards']),
  minColumnWidth: z.number().optional(),
}).strict();

export const tableNodeSchema = baseNodeSchema.extend({
  type: z.literal('Table'),
  title: z.string().min(1, 'Table title is required and cannot be empty'),
  columns: z.array(z.string()).min(1, 'Table must have at least one column'),
  rows: z.number().optional(),
  responsive: tableResponsiveSchema,
  states: z.array(z.string()).optional(),
}).strict();

// Union of all node types
export const nodeSchema: z.ZodType<any> = z.union([
  stackNodeSchema,
  gridNodeSchema,
  boxNodeSchema,
  textNodeSchema,
  buttonNodeSchema,
  fieldNodeSchema,
  formNodeSchema,
  tableNodeSchema,
]);

// Scaffold settings schema
export const scaffoldSettingsSchema = z.object({
  spacingScale: z.array(z.number()),
  minTouchTarget: z.object({
    w: z.number(),
    h: z.number(),
  }),
  breakpoints: z.array(z.string()),
});

// Screen schema
export const screenSchema = z.object({
  id: z.string().min(1, 'Screen ID is required'),
  title: z.string().optional(),
  root: nodeSchema,
});

// Top-level scaffold schema
export const scaffoldSchema = z.object({
  schemaVersion: z.string(),
  screen: screenSchema,
  settings: scaffoldSettingsSchema,
});

export type ValidatedScaffold = z.infer<typeof scaffoldSchema>;
