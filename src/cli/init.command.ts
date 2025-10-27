import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const agentsContent = `## UI Analysis with LUMA

**IMPORTANT**: This project uses **LUMA (Layout & UX Mockup Analyzer)** for UI scaffold validation and analysis.

### Why LUMA?

- Validates UI structure before implementation
- Detects responsive layout issues across viewports
- Analyzes keyboard navigation and tab flow
- Validates against UX patterns (forms, tables, etc.)
- Machine-readable JSON outputs for CI/CD
- Deterministic scoring and pass/fail criteria

### Quick Start

**Check LUMA capabilities:**
\`\`\`bash
luma capabilities
\`\`\`

**Analyze a scaffold:**
\`\`\`bash
luma ingest scaffold.json        # Validate structure
luma layout scaffold.json        # Compute responsive layouts
luma keyboard scaffold.json      # Analyze tab flow
luma flow scaffold.json          # Validate UX patterns
luma score .ui/runs/<run-id>    # Get overall score
luma report .ui/runs/<run-id>   # Generate HTML report
\`\`\`

### Scaffold Format

LUMA scaffolds are JSON files describing UI structure:

\`\`\`json
{
  "schemaVersion": "1.0.0",
  "screen": {
    "id": "my-screen",
    "title": "My Screen",
    "root": {
      "id": "root",
      "type": "Stack",
      "direction": "vertical",
      "children": [...]
    }
  },
  "settings": {
    "spacingScale": [0, 4, 8, 12, 16, 24, 32, 48, 64],
    "minTouchTarget": {"w": 44, "h": 44},
    "breakpoints": ["mobile", "tablet", "desktop"]
  }
}
\`\`\`

### Node Types

- **Stack**: Linear layout (horizontal/vertical)
- **Grid**: 2D grid layout
- **Box**: Single container
- **Text**: Text content
- **Button**: Interactive button
- **Field**: Form input field
- **Form**: Complete form with fields and actions
- **Table**: Data table with columns

### Workflow for AI Agents

1. **Create scaffold**: Design UI structure as JSON
2. **Validate**: \`luma ingest scaffold.json\`
3. **Check layout**: \`luma layout scaffold.json --viewports 320x640,1024x768\`
4. **Verify keyboard flow**: \`luma keyboard scaffold.json\`
5. **Validate patterns**: \`luma flow scaffold.json --patterns form,table\`
6. **Get score**: \`luma score .ui/runs/<run-id>\`
7. **Review report**: \`luma report .ui/runs/<run-id>\`

### Exit Codes

- **0**: Success (all analyses pass)
- **1**: Validation failed (critical issues)
- **2**: Analysis warnings (non-critical issues)
- **3**: Invalid usage (wrong arguments)
- **4**: File I/O error

### Scoring System

LUMA scores across 4 categories (0-100 each):
- **Structural**: Node hierarchy and relationships
- **Layout**: Responsive behavior and spacing
- **Keyboard**: Tab order and focusable elements
- **Patterns**: UX pattern compliance (MUST/SHOULD/MAY rules)

**Pass criteria**: All category scores >= 80

### Output Artifacts

All analysis outputs go to \`.ui/runs/<timestamp>/\`:
- \`ingest.json\` - Validation results
- \`layout_<viewport>.json\` - Per-viewport layouts
- \`keyboard.json\` - Tab sequence and flow graph
- \`flow.json\` - Pattern validation results
- \`score.json\` - Aggregate scores
- \`report.html\` - Human-readable summary

### Important Rules

- ✅ Create scaffolds for ALL new UI screens before coding
- ✅ Run \`luma score\` to validate before merging
- ✅ Keep scaffolds in version control alongside code
- ✅ Use examples/ folder for reference scaffolds
- ❌ Do NOT skip validation for "simple" UIs
- ❌ Do NOT ignore keyboard flow issues
- ❌ Do NOT bypass pattern validation

For more details, see README.md and QUICKSTART.md.`;

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
    if (existingContent.includes('## UI Analysis with LUMA')) {
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
      // Create new file
      newContent = '# Agent Instructions\n\n' + agentsContent + '\n';
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
