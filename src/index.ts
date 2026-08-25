import 'dotenv/config';
import { Command } from 'commander';
import { fetchAllPRs } from './collect/fetchPRs.js';
import { scoreAll } from './score/aggregate.js';
import { config } from './config.js';

const program = new Command();

program
  .name('posthog-analyzer')
  .description('Analyze engineer impact in the PostHog/posthog repo');

program
  .command('collect')
  .description('Fetch merged PRs from GitHub → data/raw.json')
  .option(
    '-d, --days <number>',
    'Days of history to fetch (use 14 for a quick smoke test)',
    String(config.windowDays),
  )
  .action(async (opts: { days: string }) => {
    const days = parseInt(opts.days, 10);
    if (isNaN(days) || days < 1) {
      console.error('--days must be a positive integer');
      process.exit(1);
    }
    await fetchAllPRs(days);
  });

program
  .command('score')
  .description('Score engineers from data/raw.json → data/scores.json')
  .action(() => {
    scoreAll();
  });

program.parse();
