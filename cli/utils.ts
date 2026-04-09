import chalk from 'chalk';
import axios, { AxiosError } from 'axios';
import boxen from 'boxen';
// @ts-ignore
import gradient from 'gradient-string';

export const BASE = 'http://localhost:3000';

// ── Colour palette ──────────────────────────────────────────────
export const c = {
  safe:     (s: string) => chalk.greenBright(s),
  warning:  (s: string) => chalk.yellow(s),
  high:     (s: string) => chalk.redBright(s),
  critical: (s: string) => chalk.bgRed.white.bold(` ${s} `),
  info:     (s: string) => chalk.cyanBright(s),
  dim:      (s: string) => chalk.gray(s),
  bold:     (s: string) => chalk.bold(s),
  label:    (s: string) => chalk.cyan.bold(s),
  white:    (s: string) => chalk.white(s),
  magenta:  (s: string) => chalk.magentaBright(s),
  blue:     (s: string) => chalk.blueBright(s),
};

export function riskColor(risk: number): (s: string) => string {
  if (risk >= 80) return c.critical;
  if (risk >= 60) return c.high;
  if (risk >= 35) return c.warning;
  return c.safe;
}

export function levelColor(l: string): (s: string) => string {
  const u = l.toUpperCase();
  if (u === 'CRITICAL') return c.critical;
  if (u === 'HIGH')     return c.high;
  if (u === 'MEDIUM')   return c.warning;
  return c.info;
}

export function divider(char = '─', len = 56): string {
  return chalk.gray(char.repeat(len));
}

// Boxen header for each command section
export function sectionHeader(title: string, subtitle = ''): string {
  const top = chalk.cyanBright.bold(title);
  const sub = subtitle ? chalk.gray(`\n  ${subtitle}`) : '';
  return boxen(`  ${top}${sub}`, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: 'round',
    borderColor: 'cyan',
    dimBorder: false,
  });
}

// Verdict badge
export function verdictBadge(verdict: string, risk: number): string {
  const v = verdict.toUpperCase();
  if (v === 'BLOCK')   return chalk.bgRed.white.bold(` ⛔ BLOCK `) + chalk.red(` RISK: ${risk}/100`);
  if (v === 'WARNING') return chalk.bgYellow.black.bold(` ⚠ WARNING `) + chalk.yellow(` RISK: ${risk}/100`);
  return chalk.bgGreen.black.bold(` ✓ SAFE `) + chalk.greenBright(` RISK: ${risk}/100`);
}

// Gradient text (cyan → blue)
export function gradientText(s: string): string {
  return gradient(['#00eaff', '#0066ff'])(s);
}

export async function api(method: 'get' | 'post', path: string, data?: object) {
  try {
    const res = method === 'get'
      ? await axios.get(`${BASE}${path}`)
      : await axios.post(`${BASE}${path}`, data, { headers: { 'Content-Type': 'application/json' } });
    return res.data;
  } catch (e) {
    const err = e as AxiosError;
    if (err.code === 'ECONNREFUSED') {
      console.error(boxen(
        chalk.red('✗ Cannot connect to AI-NMS server\n') +
        chalk.gray('  Run: npm run dev'),
        { padding: 1, borderStyle: 'round', borderColor: 'red' }
      ));
    } else {
      console.error(chalk.red(`\n✗ API error: ${err.message}\n`));
    }
    process.exit(1);
  }
}
