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

### 0. Read This File First
Before generating anything, confirm you understand:
- Scaffold JSON format
- LUMA commands
- Pattern rules
- Evaluation flow

If unsure → call:
\`\`\`
luma explain --topic workflow --json
\`\`\`

---

### 1. Start with a UI Goal

For this project, begin by designing a **simple TODO application** with:

- A screen to view tasks
- A form to create tasks
- A way to edit/mark tasks complete

Do **not** write code yet — only define the UI structure as a **scaffold**.

---

### 2. Produce a Scaffold
Create a file named:
\`\`\`
ui/screens/todo.mock.json
\`\`\`

Only use **Component Scaffold JSON** (Stacks, Forms, Fields, Tables, Buttons).

---

### 3. Validate with LUMA
Run the full LUMA pipeline:

\`\`\`
luma ingest ui/screens/todo.mock.json
luma layout ui/screens/todo.mock.json --viewports 320x640,768x1024
luma keyboard ui/screens/todo.mock.json
luma flow ui/screens/todo.mock.json --patterns form,table
luma score .ui/runs/<run-id>
\`\`\`

If **any** MUST rule fails or **overall score < 85**:

→ **Revise the scaffold, not the code.**

---

### 4. Iterate Until Passing
Repeat the scaffold → analyze → adjust cycle until:

- No blocking layout issues
- Keyboard flow is linear and reachable
- Patterns pass (especially Form.Basic & Table.Simple)
- Score ≥ **85**

This is the **design approval checkpoint**.

---

### 5. Only Then Generate Code
Once the scaffold is approved:

- Convert the scaffold to UI components
- Use the scaffold as the **source of truth**
- Do *not* change structure in code without updating scaffold + rerunning LUMA

---

## Key Rules

| Do | Do Not |
|---|---|
| Design UI in scaffold form first | Jump straight to HTML/JSX |
| Run \`luma score\` before coding | Ignore failing pattern rules |
| Iterate until layout/flow are correct | Hardcode layout fixes in CSS later |
| Keep scaffolds committed in VCS | Let scaffolds drift from implementation |

---

## Initial Assignment (Start Here)

**Task:** Create the UI scaffold for a TODO app main screen:
- List of tasks (Table)
- Button to add task
- Form modal to create/edit task

**Output only:** \`ui/screens/todo.mock.json\`  
**Then run:** \`luma ingest\` → \`luma layout\` → \`luma keyboard\` → \`luma flow\` → \`luma score\`

Continue refining until score ≥ **85**.

---

If you need help at any step:
\`\`\`
luma capabilities --json
luma patterns --show Form.Basic --json
luma patterns --show Table.Simple --json
luma explain --topic layout-solver --json
luma faq --json
\`\`\`
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
