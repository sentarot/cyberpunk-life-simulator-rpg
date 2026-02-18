import chalk from 'chalk';
import { Rarity, TimeOfDay, DistrictDanger } from '../types';

export function formatCredits(amount: number): string {
  return chalk.yellow(`¥${amount.toLocaleString()}`);
}

export function formatHealth(current: number, max: number): string {
  const ratio = current / max;
  const bar = progressBar(current, max, 20);
  if (ratio > 0.6) return chalk.green(bar);
  if (ratio > 0.3) return chalk.yellow(bar);
  return chalk.red(bar);
}

export function formatHumanity(humanity: number): string {
  if (humanity > 70) return chalk.cyan(`${humanity}%`);
  if (humanity > 40) return chalk.yellow(`${humanity}%`);
  return chalk.red(`${humanity}%`);
}

export function progressBar(current: number, max: number, width: number = 20): string {
  const filled = Math.round((current / max) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${max}`;
}

export function formatRarity(rarity: Rarity): string {
  switch (rarity) {
    case 'common': return chalk.gray(rarity);
    case 'uncommon': return chalk.green(rarity);
    case 'rare': return chalk.blue(rarity);
    case 'legendary': return chalk.magenta(rarity);
    case 'iconic': return chalk.yellowBright(rarity);
  }
}

export function formatTime(time: TimeOfDay): string {
  switch (time) {
    case 'morning': return chalk.yellow('☀ Morning');
    case 'afternoon': return chalk.yellowBright('☀ Afternoon');
    case 'evening': return chalk.rgb(255, 165, 0)('◐ Evening');
    case 'night': return chalk.blue('☽ Night');
  }
}

export function formatDanger(danger: DistrictDanger): string {
  switch (danger) {
    case 'low': return chalk.green('Low');
    case 'medium': return chalk.yellow('Medium');
    case 'high': return chalk.red('High');
    case 'extreme': return chalk.redBright('EXTREME');
  }
}

export function formatStatValue(value: number): string {
  if (value >= 8) return chalk.greenBright(value.toString());
  if (value >= 5) return chalk.yellow(value.toString());
  return chalk.red(value.toString());
}

export function divider(char: string = '─', length: number = 60): string {
  return chalk.gray(char.repeat(length));
}

export function header(text: string): string {
  const line = divider('═', 60);
  const padding = Math.max(0, Math.floor((60 - text.length) / 2));
  return `${line}\n${' '.repeat(padding)}${chalk.bold.cyan(text)}\n${line}`;
}

export function sectionHeader(text: string): string {
  return chalk.bold.white(`\n── ${text} ──`);
}

export function successMsg(text: string): string {
  return chalk.green(`✓ ${text}`);
}

export function failMsg(text: string): string {
  return chalk.red(`✗ ${text}`);
}

export function warnMsg(text: string): string {
  return chalk.yellow(`⚠ ${text}`);
}

export function infoMsg(text: string): string {
  return chalk.cyan(`ℹ ${text}`);
}

export function storyText(text: string): string {
  return chalk.italic.white(text);
}

export function npcDialogue(name: string, text: string): string {
  return `${chalk.bold.magenta(name)}: ${chalk.italic(`"${text}"`)}`;
}
