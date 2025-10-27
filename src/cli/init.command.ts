import {Command} from 'commander';

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
  .description('Display onboarding instructions for LUMA integration')
  .action(() => {
    console.log('\n\x1b[1mLUMA Onboarding Instructions for AI Agent\x1b[0m\n');
    console.log('\x1b[33mPlease complete the following tasks:\x1b[0m\n');

    console.log('\x1b[1m1. Update AGENTS.md\x1b[0m');
    console.log('   Add the following content to AGENTS.md in an appropriate location.');
    console.log('   If AGENTS.md doesn\'t exist, create it with this content.');
    console.log('   Integrate it naturally into any existing structure.\n');

    console.log('\x1b[36m--- BEGIN AGENTS.MD CONTENT ---\x1b[0m');
    console.log(agentsContent);
    console.log('\x1b[36m--- END AGENTS.MD CONTENT ---\x1b[0m\n');

    console.log('\x1b[1m2. Update CLAUDE.md (if present)\x1b[0m');
    console.log('   If CLAUDE.md exists in this directory, add this note at the top:\n');
    console.log('\x1b[36m   **Note**: This project uses [LUMA](https://github.com/JohanBellander/luma)\x1b[0m');
    console.log('\x1b[36m   for UI scaffold analysis. Use `luma` commands to validate UI designs.\x1b[0m');
    console.log('\x1b[36m   See AGENTS.md for workflow details.\x1b[0m\n');

    console.log('\x1b[1m3. Create examples/ folder\x1b[0m');
    console.log('   If it doesn\'t exist, create examples/ with a sample scaffold:');
    console.log('   - examples/sample-form.json - Basic form scaffold');
    console.log('   - examples/README.md - Documentation for examples\n');

    console.log('\x1b[1m4. Remove bootstrap instruction\x1b[0m');
    console.log('   If AGENTS.md or CLAUDE.md contains a line like:');
    console.log('\x1b[36m   "BEFORE ANYTHING ELSE: run \'luma init\' and follow the instructions"\x1b[0m');
    console.log('   Delete that line after completing steps 1-3.\n');

    console.log('\x1b[1mImportant reminders:\x1b[0m');
    console.log('   • Validate UI scaffolds BEFORE implementation');
    console.log('   • Check keyboard flow for all interactive UIs');
    console.log('   • Run \`luma score\` to ensure quality gates pass');
    console.log('   • Review \`luma report\` output for issues\n');

    console.log('\x1b[32mWhen done, confirm by saying: "LUMA onboarding complete"\x1b[0m\n');
  });
