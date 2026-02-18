import * as readlineSync from 'readline-sync';
import chalk from 'chalk';
import { MenuOption } from '../types';

export function prompt(message: string): string {
  return readlineSync.question(chalk.cyan(`\n> ${message}: `));
}

export function promptNumber(message: string, min: number, max: number): number {
  while (true) {
    const input = prompt(`${message} (${min}-${max})`);
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= min && num <= max) return num;
    console.log(chalk.red(`Please enter a number between ${min} and ${max}.`));
  }
}

export function showMenu(title: string, options: MenuOption[]): string {
  console.log(chalk.bold.white(`\n${title}`));
  console.log(chalk.gray('─'.repeat(40)));

  for (const option of options) {
    if (option.disabled) {
      console.log(chalk.gray(`  [${option.key}] ${option.label} (${option.disabledReason})`));
    } else {
      console.log(`  ${chalk.yellow(`[${option.key}]`)} ${option.label}${option.description ? chalk.gray(` - ${option.description}`) : ''}`);
    }
  }

  const validKeys = options.filter(o => !o.disabled).map(o => o.key);
  while (true) {
    const input = prompt('Choose').toLowerCase();
    if (validKeys.includes(input)) return input;
    console.log(chalk.red('Invalid choice. Try again.'));
  }
}

export function confirmAction(message: string): boolean {
  const answer = prompt(`${message} (y/n)`).toLowerCase();
  return answer === 'y' || answer === 'yes';
}

export function waitForKey(message: string = 'Press Enter to continue...'): void {
  readlineSync.question(chalk.gray(`\n${message}`));
}

export function clearScreen(): void {
  process.stdout.write('\x1B[2J\x1B[0f');
}
