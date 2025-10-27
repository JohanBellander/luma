/**
 * Score command for LUMA CLI
 * Per spec Section 9.5: luma score <run-dir> [--weights <json>] [--json]
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Issue } from '../types/issue.js';
import type { KeyboardOutput } from '../types/output.js';
import type { FlowOutput } from '../core/patterns/types.js';
import type { ScoreWeights, PassCriteria, CategoryScores } from '../core/scoring/types.js';
import { DEFAULT_WEIGHTS, DEFAULT_CRITERIA } from '../core/scoring/types.js';
import {
  scorePatternFidelity,
  scoreFlowReachability,
  scoreHierarchyGrouping,
  scoreResponsiveBehavior,
} from '../core/scoring/categories.js';
import { createScoreOutput } from '../core/scoring/aggregate.js';
import { logger } from '../utils/logger.js';
import {
  EXIT_SUCCESS,
  EXIT_BLOCKING_ISSUES,
  EXIT_INTERNAL_ERROR,
} from '../utils/exit-codes.js';

/**
 * Create the 'score' command.
 * 
 * Usage: luma score <run-dir> [--weights <json>] [--json]
 * 
 * Aggregates category scores from run folder artifacts.
 * Exits with code 3 if scaffold fails pass criteria.
 */
export function createScoreCommand(): Command {
  const command = new Command('score');

  command
    .description('Aggregate scores from analysis artifacts')
    .argument('<run-dir>', 'Path to run folder containing artifacts')
    .option('--weights <json>', 'Custom weights JSON (e.g., \'{"patternFidelity":0.5,...}\')')
    .option('--json', 'Output results as JSON to stdout')
    .action(async (runDir: string, options: { weights?: string; json?: boolean }) => {
      try {
        // Parse custom weights if provided
        let weights: ScoreWeights = DEFAULT_WEIGHTS;
        if (options.weights) {
          weights = JSON.parse(options.weights) as ScoreWeights;
          
          // Validate weights sum to 1.0 (with tolerance for floating point)
          const sum =
            weights.patternFidelity +
            weights.flowReachability +
            weights.hierarchyGrouping +
            weights.responsiveBehavior;
          
          if (Math.abs(sum - 1.0) > 0.01) {
            logger.error(`Weights must sum to 1.0 (got ${sum})`);
            process.exit(EXIT_INTERNAL_ERROR);
          }
        }

        const criteria: PassCriteria = DEFAULT_CRITERIA;

        // Read artifacts from run folder
        const flowPath = join(runDir, 'flow.json');
        const keyboardPath = join(runDir, 'keyboard.json');
        
        // Check if required files exist
        if (!existsSync(flowPath)) {
          logger.error(`Flow artifact not found: ${flowPath}`);
          logger.error('Run "luma flow" first to generate flow.json');
          process.exit(EXIT_INTERNAL_ERROR);
        }
        
        if (!existsSync(keyboardPath)) {
          logger.error(`Keyboard artifact not found: ${keyboardPath}`);
          logger.error('Run "luma keyboard" first to generate keyboard.json');
          process.exit(EXIT_INTERNAL_ERROR);
        }

        // Read flow.json
        const flowText = readFileSync(flowPath, 'utf-8');
        const flowOutput = JSON.parse(flowText) as FlowOutput;

        // Read keyboard.json
        const keyboardText = readFileSync(keyboardPath, 'utf-8');
        const keyboardOutput = JSON.parse(keyboardText) as KeyboardOutput;

        // Collect layout issues from all layout_*.json files
        const layoutIssues: Issue[] = [];
        // For now, we'll skip layout files and use empty array
        // TODO: Glob for layout_*.json and aggregate issues

        // Calculate category scores
        const categories: CategoryScores = {
          patternFidelity: scorePatternFidelity(flowOutput.patterns),
          flowReachability: scoreFlowReachability(keyboardOutput),
          hierarchyGrouping: scoreHierarchyGrouping(
            keyboardOutput.issues,
            layoutIssues
          ),
          responsiveBehavior: scoreResponsiveBehavior(layoutIssues),
        };

        // Create score output
        const scoreOutput = createScoreOutput(
          categories,
          weights,
          flowOutput.patterns,
          keyboardOutput.unreachable?.length ?? 0,
          criteria
        );

        // Write score.json
        const scorePath = join(runDir, 'score.json');
        writeFileSync(scorePath, JSON.stringify(scoreOutput, null, 2), 'utf-8');
        logger.info(`Score written to: ${scorePath}`);

        // Output results
        if (options.json) {
          console.log(JSON.stringify(scoreOutput, null, 2));
        } else {
          logger.info(`\nCategory Scores:`);
          logger.info(`  Pattern Fidelity:      ${categories.patternFidelity}/100`);
          logger.info(`  Flow & Reachability:   ${categories.flowReachability}/100`);
          logger.info(`  Hierarchy & Grouping:  ${categories.hierarchyGrouping}/100`);
          logger.info(`  Responsive Behavior:   ${categories.responsiveBehavior}/100`);
          logger.info(`\nOverall Score: ${scoreOutput.overall}/100`);
          logger.info(`\nResult: ${scoreOutput.pass ? 'PASS' : 'FAIL'}`);
          
          if (!scoreOutput.pass) {
            logger.error(`\nFail Reasons:`);
            for (const reason of scoreOutput.failReasons) {
              logger.error(`  - ${reason}`);
            }
          }
        }

        // Exit with appropriate code
        if (scoreOutput.pass) {
          process.exit(EXIT_SUCCESS);
        } else {
          process.exit(EXIT_BLOCKING_ISSUES);
        }
      } catch (error) {
        logger.error(`[ERROR] Internal error:`, error);
        process.exit(EXIT_INTERNAL_ERROR);
      }
    });

  return command;
}
