import {Command} from 'commander';
import {writeFileSync, existsSync} from 'fs';
import {resolve} from 'path';

function generateStarterScaffold(): any {
  return {
    schemaVersion: '1.0.0',
    screen: {
      id: 'landing-page',
      title: 'Landing Page',
      root: {
        id: 'root-stack',
        type: 'Stack',
        direction: 'vertical',
        gap: 0,
        children: [
          {
            id: 'header',
            type: 'Stack',
            direction: 'horizontal',
            gap: 20,
            padding: 20,
            children: [
              {
                id: 'logo',
                type: 'Text',
                text: 'Company Logo',
                fontSize: 18,
              },
              {
                id: 'nav-stack',
                type: 'Stack',
                direction: 'horizontal',
                gap: 16,
                children: [
                  {
                    id: 'nav-home',
                    type: 'Button',
                    text: 'Home',
                    focusable: true,
                  },
                  {
                    id: 'nav-about',
                    type: 'Button',
                    text: 'About',
                    focusable: true,
                  },
                  {
                    id: 'nav-contact',
                    type: 'Button',
                    text: 'Contact',
                    focusable: true,
                  },
                ],
              },
            ],
          },
          {
            id: 'main-content',
            type: 'Stack',
            direction: 'vertical',
            gap: 32,
            padding: 48,
            children: [
              {
                id: 'hero-title',
                type: 'Text',
                text: 'Welcome to Our Site',
                fontSize: 32,
              },
              {
                id: 'hero-subtitle',
                type: 'Text',
                text: 'Your success starts here',
                fontSize: 18,
              },
              {
                id: 'cta-button',
                type: 'Button',
                text: 'Get Started',
                focusable: true,
              },
            ],
          },
          {
            id: 'footer',
            type: 'Stack',
            direction: 'horizontal',
            padding: 20,
            children: [
              {
                id: 'footer-copyright',
                type: 'Text',
                text: '© 2025 Your Company',
                fontSize: 12,
              },
            ],
          },
        ],
      },
    },
    settings: {
      spacingScale: [0, 4, 8, 12, 16, 24, 32, 48, 64],
      minTouchTarget: {w: 44, h: 44},
      breakpoints: ['mobile', 'tablet', 'desktop'],
    },
  };
}

export const initCommand = new Command('init')
  .description('Initialize LUMA in current directory')
  .option('--force', 'Overwrite existing scaffold.json if present')
  .action((options: {force?: boolean}) => {
    const scaffoldPath = resolve(process.cwd(), 'scaffold.json');

    // Check if scaffold.json already exists
    if (existsSync(scaffoldPath) && !options.force) {
      console.error('Error: scaffold.json already exists');
      console.log('Use --force to overwrite, or remove the existing file');
      process.exit(1);
    }

    // Generate starter scaffold
    const scaffold = generateStarterScaffold();

    // Write to file
    try {
      writeFileSync(scaffoldPath, JSON.stringify(scaffold, null, 2), 'utf-8');

      console.log('✓ LUMA initialized successfully!\n');
      console.log(`  Created: ${scaffoldPath}`);
      console.log('  Starter scaffold with header, hero section, and footer\n');
      console.log('Next steps:');
      console.log('  1. Review/edit scaffold.json to match your UI');
      console.log('  2. Run: luma ingest scaffold.json');
      console.log('  3. Run: luma score .ui/runs/<run-id>');
      console.log('  4. View report: luma report .ui/runs/<run-id>\n');
      console.log('For detailed guidance, see QUICKSTART.md');
    } catch (err) {
      console.error('Error: Failed to create scaffold.json');
      if (err instanceof Error) {
        console.error(err.message);
      }
      process.exit(4);
    }
  });
