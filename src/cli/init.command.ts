import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const agentsContent = `# Agent Instructions

## Purpose

This project uses **LUMA (Layout & UX Mockup Analyzer)** to guide UI design **before coding**.
Your job is to:
1. Design UI **structurally** using Scaffold JSON.
2. Validate and refine the scaffold using LUMA.
3. Only generate implementation code **after** the scaffold passes scoring.

Do **not** generate JSX/HTML/CSS until LUMA says the scaffold is ready.

---

## Design & Development Workflow (Follow Exactly)

### 0. Preflight: Understand the Contract

Before generating any scaffold, read the canonical contract:
\`\`\`
luma explain --topic scaffold-contract --json
\`\`\`

This defines the exact rules for valid scaffolds. You can also use the golden template as reference:
\`\`\`
luma explain --topic golden-template --json
\`\`\`

For new scaffolds, you can generate from patterns instead of writing JSON manually:
\`\`\`
luma scaffold new --pattern todo-list --out ui/screens/my-screen.mock.json
luma scaffold new --pattern empty-screen --out ui/screens/base.mock.json
\`\`\`

---

### 1. Start with a UI Goal

Identify the screen you need to design. Examples:
- Data table with filtering
- Multi-step form
- Dashboard with widgets
- Login/authentication screen
- Settings panel

Do **not** write code yet — only define the UI structure as a **scaffold**.

---

### 2. Produce a Scaffold

**Option A: Generate from pattern**
\`\`\`
luma scaffold new --pattern <pattern-name> --out ui/screens/<screen>.mock.json
\`\`\`

**Option B: Write JSON manually**
Create a file in \`ui/screens/<screen>.mock.json\` using **Component Scaffold JSON** format (Stacks, Forms, Fields, Tables, Buttons, etc.).

Store scaffolds in a dedicated folder like:
- \`ui/screens/\`
- \`design/scaffolds/\`
- \`mockups/\`

**FUNCTIONAL COMPLETENESS CHECK:**

Before finalizing your scaffold, verify EVERY interactive element has a complete workflow:

- [ ] Every Button has a defined action target (Form, another screen, etc.)
- [ ] Every Form has defined fields and submission behavior
- [ ] No "dead-end" interactions (buttons that lead nowhere)

**Common Incomplete Patterns to Avoid:**
- ❌ Button without target: "Add Contact" button with no form definition
- ❌ Form without submission: Contact form with no save workflow
- ✅ Complete workflow: Button → opens Form → Form has fields and actions

**If ANY interactive element lacks a target or workflow → Add missing components to scaffold**

---

### 3. Validate with LUMA

Run the full LUMA pipeline:

\`\`\`
luma ingest ui/screens/<screen>.mock.json
luma layout ui/screens/<screen>.mock.json --viewports 320x640,768x1024
luma keyboard ui/screens/<screen>.mock.json
luma flow ui/screens/<screen>.mock.json --patterns form,table
luma score .ui/runs/<run-id>
\`\`\`

If **any** MUST rule fails or **overall score < 85**:

→ **Revise the scaffold, not the code.**

---

### 4. Iterate Until Passing

Repeat the scaffold → analyze → adjust cycle until:

- No blocking layout issues (overflow, spacing violations)
- Keyboard flow is linear and all interactive elements reachable
- Patterns pass their MUST rules (especially Form.Basic & Table.Simple)
- Overall score ≥ **85**

This is the **design approval checkpoint**.

---

### 4.5. PRE-IMPLEMENTATION CHECKPOINT

🛑 **MANDATORY REVIEW - Complete BEFORE writing ANY code:**

**Functional Completeness Audit:**
1. List EVERY component in your approved scaffold
2. For each interactive component (Button, Field), verify its action target exists
3. Check for workflow gaps or "dead-end" interactions

**Example Audit:**
\`\`\`
Component Inventory:
├── title (Text)
├── add-contact-btn (Button) → Target: ??? ❌ MISSING FORM
├── contact-table (Table)
└── [Need to add: contact-form]
\`\`\`

**Critical Questions:**
- Can I implement every button's action using ONLY scaffold components?
- Does every interactive element have a complete workflow?
- Are there any "obvious but missing" features?

**🚨 CHECKPOINT FAILURE = Scaffold is incomplete**

If you answer "no" to any question:
1. 🛑 DO NOT start implementation
2. 📝 Update scaffold with missing components
3. 🔄 Re-run LUMA validation (ingest → layout → keyboard → flow → score)
4. ✅ Only proceed when score ≥ 85 AND all workflows complete

**Red Flag Thoughts During This Review:**
- "I'll need to add a modal to make this button work" → ❌ STOP, update scaffold
- "Users will expect a form here" → ❌ STOP, update scaffold
- "This obviously needs..." → ❌ STOP, update scaffold

---

### 5. Implementation Phase - CRITICAL COMPLIANCE RULES

**🚨 SCAFFOLD FIDELITY REQUIREMENTS:**

Once the scaffold is approved (score ≥ 85), follow these **mandatory** rules:

**1. Component Mapping Rule**
- Every HTML/JSX element MUST map 1:1 to a scaffold component
- If scaffold has 5 components → implementation has exactly 5 components
- **NO additional UI elements** beyond the scaffold definition

**2. ID Preservation Rule**
- All scaffold component IDs MUST be preserved exactly in implementation
- Example: \`"id": "contact-form"\` → \`<form id="contact-form">\`
- No renaming, no omitting IDs

**3. Structure Immutability Rule**
- The component hierarchy cannot change during implementation
- If scaffold shows Stack > Text > Button > Form → code follows exactly
- No reordering, no nesting changes

**4. Feature Freeze Rule**
- NO additional functionality beyond scaffold definition
- If scaffold doesn't include a "delete" button → don't implement delete
- If scaffold has 3 form fields → implement exactly 3 fields

**❌ FORBIDDEN DURING IMPLEMENTATION:**
- Adding components not in scaffold (e.g., extra buttons, fields, tables)
- Adding form fields not defined in scaffold
- Changing component hierarchy or order
- Implementing features that didn't pass LUMA validation
- Using non-scaffold approaches when validation fails

**✅ ALLOWED DURING IMPLEMENTATION:**
- Styling (colors, fonts, spacing) per design system
- Accessibility attributes (aria-labels, roles, etc.)
- Event handlers for interactions defined by scaffold components
- CSS classes for styling (but not structural changes)

---

## ⚠️ Common Pitfalls to Avoid

**1. "Helpful Additions"**
- ❌ "Users probably want a cancel button, let me add that"
- ✅ "Scaffold doesn't include cancel, so I won't implement it"

**2. "Technical Workarounds"**
- ❌ "Table validation failed, I'll use an HTML table instead"
- ✅ "Table failed validation, I need to fix the scaffold first"

**3. "Obvious Missing Pieces" - MAJOR VIOLATION**
- ❌ "Obviously need a contact form for the Add Contact button"
- ❌ "Users will expect a modal when clicking this button"
- ❌ "The button is useless without a form, so I'll add one"
- ✅ "Button exists but form is missing → scaffold is incomplete → update scaffold first"

**4. "Scope Creep During Implementation"**
- ❌ Adding extra fields, buttons, or sections while coding
- ✅ Stop implementation, update scaffold, re-validate, then code

**🚨 RED FLAG PHRASES - Stop Immediately if You Think:**
- "Obviously need..."
- "Users will expect..."
- "This button should..."
- "To make this work, I'll add..."
- "For better UX, let me..."
- "I'll just quickly add..."

**When you catch yourself using these phrases → You are about to violate scaffold fidelity**

**Correct Response When You Catch a Red Flag:**
1. STOP implementation immediately
2. Identify what's missing in the scaffold
3. Update scaffold JSON with needed components
4. Re-run LUMA validation pipeline
5. Resume implementation only after approval (score ≥ 85)

**If You Want to Add Features:**
1. STOP implementation
2. Update the scaffold JSON with new components
3. Re-run full LUMA pipeline: \`ingest → layout → keyboard → flow → score\`
4. Get new approval (score ≥ 85)
5. THEN implement the expanded scaffold

**Never implement features that haven't passed LUMA validation.**

---

## Key Rules

| Do | Do Not |
|---|---|
| Design UI in scaffold form first | Jump straight to HTML/JSX |
| Run \`luma score\` before coding | Ignore failing pattern rules |
| Use \`luma scaffold new\` for quick starts | Write invalid JSON manually |
| **Implement ONLY what's in approved scaffold** | **Add features during implementation** |
| **Map scaffold components 1:1 to HTML** | **Add extra form fields, buttons, or sections** |
| **Preserve all scaffold component IDs** | **Rename or omit scaffold-defined IDs** |
| Iterate until layout/flow are correct | Hardcode layout fixes in CSS later |
| Keep scaffolds committed in VCS | Let scaffolds drift from implementation |

---

## Quick Reference

**Get help:**
\`\`\`
luma capabilities --json              # List all commands
luma explain --topic <topic> --json   # Detailed explanations
luma faq --json                       # Common questions
luma patterns --json                  # Available pattern validators
\`\`\`

**Common topics:**
- \`workflow\` - End-to-end process
- \`scaffold-contract\` - Valid scaffold rules
- \`golden-template\` - Reference example
- \`layout-solver\` - How layout works
- \`scoring\` - How scores are calculated

**Scaffold generation:**
\`\`\`
luma scaffold new --pattern todo-list --out <file>
luma scaffold new --pattern empty-screen --out <file>
\`\`\`

**Validation pipeline:**
\`\`\`
luma ingest <file>                           # Validate structure
luma layout <file> --viewports 320x640       # Check responsive layout
luma keyboard <file>                         # Analyze tab flow
luma flow <file> --patterns form,table       # Validate UX patterns
luma score <run-folder>                      # Get overall score
luma report <run-folder> --out report.html   # Generate visual report
\`\`\`

---

## Real-World Example: The Modal Form Violation

**What Happened:**
An agent created a CRM scaffold with:
- Title text
- "Add Contact" button
- Contact table

During implementation, the agent added a contact form modal to make the button functional, even though no form was in the scaffold.

**Why This Was Wrong:**
- ❌ Violated Component Mapping Rule (3 components → 4+ elements)
- ❌ Violated Feature Freeze Rule (modal not in scaffold)
- ❌ Added functionality that hadn't passed LUMA validation

**What Should Have Happened:**
1. **At Step 4.5 (Pre-Implementation Checkpoint)**: Agent should have noticed "Add Contact" button has no target form
2. **Correct Action**: STOP, update scaffold to include the contact form
3. **Re-validate**: Run LUMA pipeline on updated scaffold
4. **Then Implement**: Build the approved scaffold including the form

**Key Lesson:** Never add components during implementation to "make things work" - always ensure complete workflows are in the approved scaffold first.
`;

export const initCommand = new Command('init')
  .description('Initialize LUMA in the current project by creating/updating AGENTS.md')
  .action(() => {
    const cwd = process.cwd();
    const agentsPath = path.join(cwd, 'AGENTS.md');
    
    let existingContent = '';
    let fileExists = false;
    
    // Check if AGENTS.md exists
    try {
      if (fs.existsSync(agentsPath)) {
        existingContent = fs.readFileSync(agentsPath, 'utf-8');
        fileExists = true;
      }
    } catch (error) {
      // File doesn't exist or can't be read
    }
    
    // Check if LUMA section already exists
    if (existingContent.includes('This project uses **LUMA (Layout & UX Mockup Analyzer)**')) {
      console.log('\x1b[33m⚠ LUMA section already exists in AGENTS.md\x1b[0m');
      console.log('No changes made. To update, manually edit AGENTS.md.');
      return;
    }
    
    // Add LUMA section to AGENTS.md
    let newContent: string;
    if (fileExists && existingContent.trim()) {
      // Append to existing file
      newContent = existingContent.trimEnd() + '\n\n' + agentsContent + '\n';
      console.log('\x1b[32m✓ Added LUMA section to existing AGENTS.md\x1b[0m');
    } else {
      // Create new file - agentsContent already has the header
      newContent = agentsContent + '\n';
      console.log('\x1b[32m✓ Created AGENTS.md with LUMA section\x1b[0m');
    }
    
    try {
      fs.writeFileSync(agentsPath, newContent, 'utf-8');
    } catch (error) {
      console.error('\x1b[31m✗ Failed to write AGENTS.md:\x1b[0m', error);
      process.exit(1);
    }
    
    console.log('\n\x1b[1mNext steps:\x1b[0m');
    console.log('  • Review AGENTS.md to ensure the content is properly integrated');
    console.log('  • Create examples/ folder with sample scaffolds');
    console.log('  • Run \`luma --help\` to see available commands\n');
  });
