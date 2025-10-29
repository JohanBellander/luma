# LUMA Scaffold Contract

**For AI Agents generating LUMA Component Scaffold JSON**

---

## Canonical Contract

You are producing a LUMA Component Scaffold JSON.

### Hard Rules

- `schemaVersion` === `"1.0.0"`
- `screen.id` is a non-empty string
- `screen.root` is ONE node of type `Stack|Grid|Box|Text|Button|Field|Form|Table`
- Every node has: `id`, `type` (and required fields for its type)
- `Form` has `fields[]` (len ≥ 1) and `actions[]` (len ≥ 1)
- `Table` has `title` (non-empty), `columns[]` (len ≥ 1), `responsive.strategy` ∈ `{wrap, scroll, cards}`
- `settings.spacingScale` is an array of numbers
- `settings.minTouchTarget` is `{ "w": 44, "h": 44 }` or larger
- `settings.breakpoints` are `"WxH"` strings, e.g. `["320x640","768x1024"]`

### Output Format

Output MUST be a single JSON object. No comments. No markdown.

---

## Node Type Requirements

### Stack
- Required: `type`, `id`, `direction` (`"vertical"` or `"horizontal"`), `children` (array)
- Optional: `gap` (number, must be in spacingScale), `padding` (number, must be in spacingScale), `align`, `wrap`

### Grid
- Required: `type`, `id`, `columns` (number), `children` (array)
- Optional: `gap` (number, must be in spacingScale), `minColWidth`

### Box
- Required: `type`, `id`
- Optional: `padding` (number, must be in spacingScale), `child` (single node)

### Text
- Required: `type`, `id`, `text` (non-empty string)
- Optional: `fontSize`, `maxLines`

### Button
- Required: `type`, `id`
- Optional: `text` (string), `roleHint` (`"primary"`, `"secondary"`, `"danger"`, `"link"`), `focusable` (boolean), `tabIndex` (number)

### Field
- Required: `type`, `id`, `label` (non-empty string)
- Optional: `inputType` (`"text"`, `"email"`, `"password"`, `"number"`, `"date"`), `required` (boolean), `helpText` (string), `errorText` (string), `focusable` (boolean)

### Form
- Required: `type`, `id`, `fields` (array, len ≥ 1), `actions` (array, len ≥ 1), `states` (array, len ≥ 1, must include `"default"`)
- Actions must be Button nodes
- Fields must be Field nodes
- Optional: `title` (string)

### Table
- Required: `type`, `id`, `title` (non-empty string), `columns` (array, len ≥ 1), `responsive` object with `strategy` (`"wrap"`, `"scroll"`, or `"cards"`)
- `columns` is a string array: `["Name", "Email", "Role"]`
- Optional: `responsive.minColumnWidth` (number), `rows` (number), `states` (array of strings)

---

## Common Properties (All Nodes)

- `widthPolicy`: `"hug"` | `"fill"` | `"fixed"` (default: `"hug"`)
- `heightPolicy`: `"hug"` | `"fill"` | `"fixed"` (default: `"hug"`)
- `visible`: boolean (default: `true`)
- `minSize`: `{ w?: number, h?: number }`
- `maxSize`: `{ w?: number, h?: number }`
- `at`: object with responsive overrides (keys like `">=768"`, `"<=320"`)

---

## Validation Rules

1. **All spacing values** (gap, padding) MUST be in `settings.spacingScale`
2. **Node IDs** must be unique within the screen
3. **Form structure**: fields before actions in tree order
4. **Table columns**: at least 1 column defined
5. **Responsive strategy**: Table must specify one of: wrap, scroll, or cards

---

## Example Minimal Valid Scaffold

```json
{
  "schemaVersion": "1.0.0",
  "screen": {
    "id": "example-screen",
    "title": "Example",
    "root": {
      "type": "Stack",
      "id": "root-stack",
      "direction": "vertical",
      "gap": 16,
      "padding": 24,
      "children": [
        {
          "type": "Text",
          "id": "title-text",
          "text": "Example Title"
        },
        {
          "type": "Button",
          "id": "action-button",
          "text": "Click Me",
          "roleHint": "primary"
        }
      ]
    }
  },
  "settings": {
    "spacingScale": [4, 8, 12, 16, 24, 32],
    "minTouchTarget": { "w": 44, "h": 44 },
    "breakpoints": ["320x640", "768x1024", "1280x800"]
  }
}
```

---

## Preflight Checklist

Before outputting a scaffold, verify:

- ✅ `schemaVersion` is `"1.0.0"`
- ✅ `screen.id` exists and is non-empty
- ✅ `screen.root` is a single node object
- ✅ All node `id` values are unique
- ✅ All nodes have required fields for their type
- ✅ All `gap` and `padding` values are in `spacingScale`
- ✅ `Form` nodes have both `fields` and `actions` arrays (non-empty)
- ✅ `Table` nodes have `title`, `columns`, and `responsive.strategy`
- ✅ Output is pure JSON (no comments, no markdown wrappers)

---

## Usage

This contract is available via:

```bash
luma explain --topic scaffold-contract --json
```

For more information, see:
- `LUMA-SPEC.md` — Full LUMA v1.0 specification
- `LUMA-ADDITIONS-SPEC-v1.1.md` — v1.1 enhancements
- `examples/` — Valid scaffold examples
