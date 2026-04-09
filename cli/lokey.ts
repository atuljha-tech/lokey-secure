#!/usr/bin/env ts-node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
// @ts-ignore
import gradient from 'gradient-string';

import { scanCommand }    from './commands/scan';
import { sandboxCommand } from './commands/sandbox';
import { alertsCommand }  from './commands/alerts';
import { trafficCommand } from './commands/traffic';
import { blockIpCommand } from './commands/block-ip';
import { sitesCommand }   from './commands/sites';
import { statsCommand }   from './commands/stats';
import { analyzeCommand } from './commands/analyze';

function banner() {
  const art = figlet.textSync('LoKey', { font: 'Big' });
  console.log(gradient(['#00eaff', '#0066ff', '#aa00ff'])(art));
  console.log(
    boxen(
      chalk.cyanBright.bold('  AI-NMS Security CLI  ') + '\n' +
      chalk.gray('  Terminal interface for the AI-NMS platform'),
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'double',
        borderColor: 'cyan',
      }
    )
  );
  console.log();
}

const program = new Command();

program
  .name('lokey')
  .description('LoKey — AI-NMS Security CLI')
  .version('1.0.0')
  .hook('preAction', () => banner());

program
  .command('scan <url>')
  .description('Scan a website in the Playwright sandbox')
  .action(async (url: string) => {
    await scanCommand(url);
  });

program
  .command('sandbox <url>')
  .description('Run sandbox scan with full execution log')
  .action(async (url: string) => {
    await sandboxCommand(url);
  });

program
  .command('alerts')
  .description('Show active threat alerts')
  .option('-l, --limit <n>', 'Max alerts to show', '20')
  .action(async (opts: { limit: string }) => {
    await alertsCommand(parseInt(opts.limit));
  });

program
  .command('traffic')
  .description('Show live traffic stream')
  .option('-l, --limit <n>', 'Max entries to show', '30')
  .action(async (opts: { limit: string }) => {
    await trafficCommand(parseInt(opts.limit));
  });

program
  .command('block-ip <ip>')
  .description('Block an IP address via the response engine')
  .action(async (ip: string) => {
    await blockIpCommand(ip);
  });

program
  .command('sites')
  .description('Show recent sandbox-scanned sites')
  .action(async () => {
    await sitesCommand();
  });

program
  .command('stats')
  .description('Show system security status')
  .action(async () => {
    await statsCommand();
  });

program
  .command('analyze <ip>')
  .description('Generate AI threat narrative for an IP via Featherless')
  .action(async (ip: string) => {
    await analyzeCommand(ip);
  });

program.parse(process.argv);
