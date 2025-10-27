/**
 * FAQ command - frequently asked questions
 * Per spec Section 9.7: luma faq --json
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FAQ {
  q: string;
  a: string;
}

interface FAQData {
  questions: FAQ[];
}

/**
 * Create the 'faq' command.
 * 
 * Usage: luma faq --json
 */
export function createFaqCommand(): Command {
  const command = new Command('faq');

  command
    .description('Frequently asked questions')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      // Load FAQ data
      const faqPath = join(__dirname, '../data/faq.json');
      const faqText = readFileSync(faqPath, 'utf-8');
      const faq: FAQData = JSON.parse(faqText);

      if (options.json) {
        console.log(JSON.stringify(faq, null, 2));
      } else {
        console.log('LUMA Frequently Asked Questions\n');
        for (let i = 0; i < faq.questions.length; i++) {
          const item = faq.questions[i];
          console.log(`Q${i + 1}: ${item.q}`);
          console.log(`A: ${item.a}\n`);
        }
      }
    });

  return command;
}
