import { GameState, TimeOfDay } from '../types';
import { chance, roll, clamp } from '../utils/dice';
import { addLogEntry, advanceTime } from '../engine/state';
import { processDailyExpenses } from './economy';
import { awardStreetCred, getSurvivalStreetCred } from './progression';

export function rest(state: GameState): string[] {
  const messages: string[] = [];
  const char = state.character;

  if (char.apartment) {
    const healAmount = roll(15, 30);
    char.health = clamp(char.health + healAmount, 0, char.maxHealth);
    messages.push(`Rested at your apartment. Recovered ${healAmount} HP.`);
  } else {
    const healAmount = roll(5, 10);
    char.health = clamp(char.health + healAmount, 0, char.maxHealth);
    messages.push(`Found a place to crash for the night. Recovered ${healAmount} HP.`);
    if (chance(0.15)) {
      const stolen = roll(10, 50);
      char.credits = Math.max(0, char.credits - stolen);
      messages.push(`Someone stole ¥${stolen} while you slept!`);
    }
  }

  addLogEntry(state, messages[0], 'info');
  return messages;
}

export function processNewDay(state: GameState): string[] {
  const messages: string[] = [];

  // Daily expenses
  const expenseMessages = processDailyExpenses(state);
  messages.push(...expenseMessages);

  // Health regeneration
  if (state.character.health < state.character.maxHealth) {
    const regen = Math.floor(state.character.maxHealth * 0.05);
    state.character.health = clamp(state.character.health + regen, 0, state.character.maxHealth);
    messages.push(`Natural regeneration: +${regen} HP`);
  }

  // Humanity recovery (slow)
  if (state.character.humanity < 100 && chance(0.1)) {
    state.character.humanity = clamp(state.character.humanity + 1, 0, 100);
    messages.push('Humanity slightly recovered.');
  }

  // Low humanity effects
  if (state.character.humanity < 30) {
    messages.push('WARNING: Humanity critically low. Cyberpsychosis symptoms detected.');
    if (chance(0.1)) {
      state.character.health -= roll(5, 15);
      messages.push('Cyberpsychosis episode! Lost HP.');
    }
  }

  // Survival street cred
  if (state.progression) {
    const survivalCred = getSurvivalStreetCred(state.character.daysSurvived);
    if (survivalCred > 0) {
      const credResult = awardStreetCred(state, survivalCred, 'survival');
      messages.push(...credResult.messages);
    }
  }

  // Random world flavor
  const newsMessages = getDailyNews(state);
  if (newsMessages) {
    messages.push(newsMessages);
  }

  addLogEntry(state, `Day ${state.currentDay} begins.`, 'info');
  return messages;
}

export function rentApartment(state: GameState): string[] {
  const messages: string[] = [];
  const char = state.character;

  if (char.apartment) {
    messages.push('You already have an apartment.');
    return messages;
  }

  const rentCost = 500;
  if (char.credits < rentCost) {
    messages.push(`Not enough credits to rent. Need ¥${rentCost}.`);
    return messages;
  }

  char.credits -= rentCost;
  char.apartment = char.currentDistrict;
  messages.push(`Rented an apartment in ${char.currentDistrict} for ¥${rentCost}.`);
  addLogEntry(state, `Rented apartment in ${char.currentDistrict}.`, 'info');
  return messages;
}

export function travelToDistrict(state: GameState, districtId: string): string[] {
  const messages: string[] = [];
  const char = state.character;

  if (char.currentDistrict === districtId) {
    messages.push('You\'re already here.');
    return messages;
  }

  const travelCost = 20;
  if (char.credits < travelCost) {
    messages.push('Not enough credits for transit.');
    return messages;
  }

  char.credits -= travelCost;
  char.currentDistrict = districtId;
  messages.push(`Traveled to ${districtId}. Transit cost: ¥${travelCost}.`);
  addLogEntry(state, `Traveled to ${districtId}.`, 'info');
  return messages;
}

export function gamble(state: GameState, amount: number): string[] {
  const messages: string[] = [];
  const char = state.character;

  if (char.credits < amount) {
    messages.push('Not enough credits to gamble.');
    return messages;
  }

  char.credits -= amount;
  const luckBonus = char.stats.luck / 20;
  const winChance = 0.4 + luckBonus;

  if (chance(winChance)) {
    const multiplier = chance(0.1) ? 3 : 2;
    const winnings = amount * multiplier;
    char.credits += winnings;
    messages.push(`You won ¥${winnings}! (${multiplier}x)`);
    addLogEntry(state, `Won ¥${winnings} gambling.`, 'reward');
  } else {
    messages.push(`You lost ¥${amount}. The house always wins... eventually.`);
    addLogEntry(state, `Lost ¥${amount} gambling.`, 'danger');
  }

  return messages;
}

function getDailyNews(state: GameState): string | null {
  const newsPool = [
    'NEWS: Kenzaki Corp stock hits all-time high as new product line launches.',
    'NEWS: Maelstrom gang activity increases in the Industrial Zone. NCPD advises caution.',
    'NEWS: Braindance addiction rates reach epidemic levels in Neon Heights.',
    'NEWS: Nomad convoy spotted entering city limits. Trade opportunities expected.',
    'NEWS: Power grid failure in Kabuki leaves thousands in the dark.',
    'NEWS: Rogue AI sighting reported in the Undercity. NetWatch investigating.',
    'NEWS: Cyberpsycho incident downtown leaves 3 dead, 12 wounded.',
    'NEWS: New augmentation tech promises enhanced performance with zero humanity cost. Experts skeptical.',
    'NEWS: NCPD crackdown on illegal braindance studios begins this week.',
    'NEWS: Street racing tournament announced in the Industrial Zone. Big prizes.',
    'NEWS: Water purification plant sabotaged. Prices expected to rise.',
    'NEWS: Mysterious signal detected from beyond the Blackwall. Voodoo Boys deny involvement.',
  ];

  if (chance(0.3)) {
    return newsPool[Math.floor(Math.random() * newsPool.length)];
  }
  return null;
}
