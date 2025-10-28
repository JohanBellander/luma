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

### 5. Only Then Generate Code

Once the scaffold is approved:

- Convert the scaffold to UI components (React, Vue, HTML, etc.)
- Use the scaffold as the **source of truth** for structure
- Do *not* change structure in code without updating scaffold + rerunning LUMA

---

## Key Rules

| Do | Do Not |
|---|---|
| Design UI in scaffold form first | Jump straight to HTML/JSX |
| Run \`luma score\` before coding | Ignore failing pattern rules |
| Use \`luma scaffold new\` for quick starts | Write invalid JSON manually |
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
