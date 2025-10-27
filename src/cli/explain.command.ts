/**
 * Explain command - provides topic-based explanations
 * Per spec Section 9.7: luma explain --topic <name> --json
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Topic {
  title: string;
  summary: string;
  details: string[];
}

interface TopicsData {
  [key: string]: Topic;
}

/**
 * Create the 'explain' command.
 * 
 * Usage: luma explain --topic <name> --json
 */
export function createExplainCommand(): Command {
  const command = new Command('explain');

  command
    .description('Explain LUMA concepts and algorithms')
    .requiredOption('--topic <name>', 'Topic to explain')
    .option('--json', 'Output as JSON')
    .action((options: { topic: string; json?: boolean }) => {
      // Load topics data
      const topicsPath = join(__dirname, '../data/topics.json');
      const topicsText = readFileSync(topicsPath, 'utf-8');
      const topics: TopicsData = JSON.parse(topicsText);

      const topic = topics[options.topic];
      
      if (!topic) {
        console.error(`Unknown topic: ${options.topic}`);
        console.error(`Available topics: ${Object.keys(topics).join(', ')}`);
        process.exit(2);
      }

      if (options.json) {
        console.log(JSON.stringify(topic, null, 2));
      } else {
        console.log(`Topic: ${topic.title}`);
        console.log(`\n${topic.summary}`);
        console.log('\nDetails:');
        for (const line of topic.details) {
          console.log(line);
        }
      }
    });

  return command;
}
