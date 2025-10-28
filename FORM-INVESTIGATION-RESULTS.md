# Form Component Investigation Results

## Summary

Form component validation **WORKS CORRECTLY** but was misunderstood due to unhelpful error messages.

## Root Cause

The agent received `"invalid_union"` errors at `/screen/root` when creating Form components because:

1. **Missing required `type` properties** on nested Field and Button objects
2. **Error message provides no guidance** about what's wrong ("Invalid input", "none of the union members matched")
3. **No examples or schema documentation** showing the exact structure required

## Working Form Structure

### Complete Working Example
```json
{
  "schemaVersion": "1.0.0",
  "screen": {
    "id": "contact-form-screen",
    "title": "Contact Form",
    "root": {
      "id": "contact-form",
      "type": "Form",
      "title": "Add New Contact",
      "states": ["default"],
      "fields": [
        {
          "id": "name-field",
          "type": "Field",          // ← REQUIRED
          "label": "Name",
          "inputType": "text",
          "required": true
        },
        {
          "id": "email-field",
          "type": "Field",          // ← REQUIRED
          "label": "Email",
          "inputType": "email",
          "required": true
        }
      ],
      "actions": [
        {
          "id": "save-btn",
          "type": "Button",         // ← REQUIRED
          "text": "Save",
          "roleHint": "primary"
        },
        {
          "id": "cancel-btn",
          "type": "Button",         // ← REQUIRED
          "text": "Cancel",
          "roleHint": "secondary"
        }
      ]
    }
  },
  "settings": {
    "spacingScale": [4, 8, 12, 16, 24, 32],
    "minTouchTarget": { "w": 44, "h": 44 },
    "breakpoints": ["320x640"]
  }
}
```

### Required Properties

#### FormNode
- `id`: string (required, unique)
- `type`: "Form" (required)
- `fields`: FieldNode[] (required, min length 1)
- `actions`: ButtonNode[] (required, min length 1)
- `states`: string[] (required, min length 1, must include "default")
- `title`: string (optional)

#### FieldNode (in fields array)
- `id`: string (required, unique)
- `type`: "Field" (required)
- `label`: string (required, non-empty)
- `inputType`: "text" | "email" | "password" | "number" | "date" (optional)
- `required`: boolean (optional)
- `helpText`: string (optional)
- `errorText`: string (optional)
- `focusable`: boolean (optional, default true)

#### ButtonNode (in actions array)
- `id`: string (required, unique)
- `type`: "Button" (required)
- `text`: string (optional, if absent = icon-only button)
- `roleHint`: "primary" | "secondary" | "danger" | "link" (optional)
- `focusable`: boolean (optional, default true)
- `tabIndex`: number (optional, non-zero discouraged)

## Common Mistakes That Cause "invalid_union" Error

### ❌ WRONG: Missing type on Field
```json
{
  "id": "contact-form",
  "type": "Form",
  "states": ["default"],
  "fields": [
    {
      "id": "name-field",
      // Missing: "type": "Field"
      "label": "Name"
    }
  ],
  "actions": [...]
}
```
**Error**: `invalid_union at /screen/root`

### ❌ WRONG: Missing type on Button
```json
{
  "id": "contact-form",
  "type": "Form",
  "states": ["default"],
  "fields": [...],
  "actions": [
    {
      "id": "save-btn",
      // Missing: "type": "Button"
      "text": "Save"
    }
  ]
}
```
**Error**: `invalid_union at /screen/root`

### ❌ WRONG: Missing states array
```json
{
  "id": "contact-form",
  "type": "Form",
  // Missing: "states": ["default"]
  "fields": [...],
  "actions": [...]
}
```
**Error**: `invalid_union at /screen/root`

### ✅ CORRECT: All required properties present
```json
{
  "id": "contact-form",
  "type": "Form",
  "states": ["default"],
  "fields": [
    {
      "id": "name-field",
      "type": "Field",
      "label": "Name"
    }
  ],
  "actions": [
    {
      "id": "save-btn",
      "type": "Button",
      "text": "Save"
    }
  ]
}
```
**Result**: ✅ Validation passes

## Form Placement

Forms can be used in two ways:

### 1. As root component (direct)
```json
{
  "screen": {
    "root": {
      "id": "my-form",
      "type": "Form",
      ...
    }
  }
}
```

### 2. Nested in layout container (recommended for complex UIs)
```json
{
  "screen": {
    "root": {
      "id": "root",
      "type": "Stack",
      "direction": "vertical",
      "children": [
        {
          "id": "title",
          "type": "Text",
          "text": "Contact Form"
        },
        {
          "id": "my-form",
          "type": "Form",
          ...
        }
      ]
    }
  }
}
```

## Validation Implementation Details

Form validation is correctly implemented in:
- **Type definition**: `src/types/node.ts` (FormNode interface)
- **Schema validation**: `src/core/ingest/validator.ts` (formNodeSchema)
- **Union member**: Included in nodeSchema union

The validator uses Zod schemas with proper type checking:
```typescript
export const formNodeSchema = baseNodeSchema.extend({
  type: z.literal('Form'),
  title: z.string().optional(),
  fields: z.array(fieldNodeSchema).min(1, 'Form must have at least one field'),
  actions: z.array(buttonNodeSchema).min(1, 'Form must have at least one action'),
  states: z.array(z.string()).min(1, 'Form must include at least "default" state'),
});
```

## Test Results

| Test Case | Result | File |
|-----------|--------|------|
| Form with correct structure | ✅ PASS | `test-form-validation.json` |
| Form as root component | ✅ PASS | `test-form-as-root.json` |
| Form with missing Field.type | ❌ FAIL (invalid_union) | `test-failed-attempt2.json` |
| Form with missing Button.type | ❌ FAIL (invalid_union) | Similar error |
| Happy-form example | ✅ PASS | `examples/happy-form.json` |

## Recommendations

1. **Enhance error messages** - See LUMA-34
   - Detect missing `type` property in union validation
   - Suggest: "Form.fields[0] missing required 'type' property, should be 'Field'"
   
2. **Add schema command** - See LUMA-32
   - `luma schema --component Form` should show this structure
   - Include working examples
   
3. **Update documentation**
   - Add Form examples to README
   - Create form-specific topic for `luma explain`

## Conclusion

**Form validation is NOT broken** - it works correctly when the proper structure is used. The issue was:
- Insufficient documentation
- Unhelpful error messages
- No examples showing the exact required structure

The solution is to improve documentation and error messages, not fix the validation logic.
