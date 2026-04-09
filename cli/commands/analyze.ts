import ora from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';
import { api, c, riskColor, sectionHeader, divider } from '../utils';

export async function analyzeCommand(ip: string) {
  console.log();
  console.log(sectionHeader('FEATHERLESS AI THREAT ANALYSIS', `Target IP → ${ip}`));
  console.log();

  // Step 1: find the most recent alert for this IP
  const spinner = ora({ text: chalk.hex('#76b900')('Looking up threat data...'), color: 'green', spinner: 'dots2' }).start();
  const detectData = await api('get', '/api/detect');
  const alerts: any[] = detectData.alerts ?? [];

  const match = alerts.find((a: any) =>
    (a.trafficData?.ip ?? a.ip ?? '') === ip
  );

  spinner.succeed(chalk.hex('#76b900')('Threat data loaded'));

  if (!match) {
    console.log(chalk.yellow(`\n  ⚠ No alert found for IP ${ip}`));
    console.log(chalk.gray('  Running analysis with default parameters...\n'));
  }

  const attackType = match?.attackType ?? 'Unknown Intrusion';
  const riskScore  = match?.riskScore  ?? 50;
  const reasons    = match?.reasons    ?? [];
  const port       = match?.trafficData?.port;
  const protocol   = match?.trafficData?.protocol;

  // Show what we found
  if (match) {
    console.log(chalk.gray('  Found matching alert:'));
    console.log(`  ${c.label('Attack Type')}  ${chalk.white(attackType)}`);
    console.log(`  ${c.label('Risk Score')}   ${riskColor(riskScore)(String(riskScore))} / 100`);
    if (reasons[0]) console.log(`  ${c.label('Reason')}       ${chalk.gray(reasons[0])}`);
    console.log();
  }

  // Step 2: call Featherless
  const spinner2 = ora({ text: chalk.hex('#76b900')('Generating AI threat narrative via Featherless...'), color: 'green', spinner: 'dots2' }).start();

  const data = await api('post', '/api/featherless-analyze', {
    ip, attackType, riskScore, reasons, port, protocol,
  });

  spinner2.stop();

  if (data.noKey) {
    console.log(
      boxen(
        chalk.yellow('⚠ FEATHERLESS_API_KEY not configured\n\n') +
        chalk.gray('Add your key to .env.local:\n') +
        chalk.hex('#76b900')('FEATHERLESS_API_KEY=your_key_here') +
        chalk.gray('\n\nGet a key at: https://featherless.ai/account/api-keys'),
        { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
      )
    );
    return;
  }

  if (!data.success || !data.narrative) {
    console.log(chalk.red(`\n  ✗ ${data.message ?? 'Analysis failed'}`));
    return;
  }

  // Step 3: display the narrative
  console.log(
    boxen(
      chalk.hex('#76b900').bold('  FEATHERLESS AI — THREAT NARRATIVE\n') +
      chalk.gray(`  Model: ${data.model ?? 'meta-llama/Meta-Llama-3.1-8B-Instruct'}\n`) +
      chalk.gray(`  IP: ${ip}  ·  Attack: ${attackType}  ·  Risk: ${riskScore}/100\n`) +
      chalk.gray('  ' + '─'.repeat(52)) + '\n\n' +
      chalk.white(data.narrative
        .split('\n')
        .map((line: string) => '  ' + line)
        .join('\n')
      ),
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: '#76b900' as any,
      }
    )
  );

  console.log();
}
