import { Character, Job, GameState, Item, JobRisk, SkillName } from '../types';
import { check, chance, roll } from '../utils/dice';
import { getEffectiveSkill, getEffectiveStat, getDifficultyModifier, applyOutcome, addLogEntry } from '../engine/state';
import { addItem, removeItem } from './character';
import { awardStreetCred, getJobStreetCred } from './progression';
import { getPerkBonus } from '../data/perks';
import { getFactionJobPayMultiplier, getContactJobPayMultiplier, applyFactionRivalry, checkFactionStandingMilestone } from './factions';

export function canTakeJob(state: GameState, job: Job): { eligible: boolean; reason?: string } {
  const char = state.character;

  for (const req of job.requirements) {
    switch (req.type) {
      case 'level':
        if (!compareValue(char.level, req.operator, Number(req.value))) {
          return { eligible: false, reason: `Requires level ${req.value}` };
        }
        break;
      case 'skill':
        const skillVal = char.skills[req.target as keyof typeof char.skills];
        if (skillVal !== undefined && !compareValue(skillVal, req.operator, Number(req.value))) {
          return { eligible: false, reason: `Requires ${req.target} ${req.operator} ${req.value}` };
        }
        break;
      case 'reputation':
        const repVal = char.reputation[req.target] ?? 0;
        if (!compareValue(repVal, req.operator, Number(req.value))) {
          return { eligible: false, reason: `Requires ${req.target} reputation ${req.operator} ${req.value}` };
        }
        break;
      case 'item':
        const hasItem = char.inventory.some(i => i.item.id === req.target);
        if (!hasItem) {
          return { eligible: false, reason: `Requires item: ${req.target}` };
        }
        break;
    }
  }

  return { eligible: true };
}

export function executeJob(state: GameState, job: Job): { success: boolean; messages: string[]; combatTriggered: boolean } {
  const char = state.character;
  const messages: string[] = [];
  const diffMod = getDifficultyModifier(state.settings);

  // Primary skill check based on job type
  const primarySkill = getJobPrimarySkill(job);
  const skillValue = getEffectiveSkill(char, primarySkill);
  const difficulty = Math.floor(job.difficulty * 2 * diffMod) + 8;
  const modifier = Math.floor(skillValue / 5);

  const result = check(modifier, difficulty);
  let combatTriggered = false;

  if (result.success) {
    messages.push(`Job completed successfully! (Rolled ${result.roll} + ${modifier} = ${result.total} vs ${difficulty})`);

    // Pay (with faction standing bonus and contact bonus)
    const basePay = Math.floor(job.payCredits * (1 + char.stats.luck / 20));
    const factionPayMult = getFactionJobPayMultiplier(state, job.reputationReward?.faction ?? null);
    const contactPayMult = getContactJobPayMultiplier(state);
    const pay = Math.floor(basePay * factionPayMult * contactPayMult);
    char.credits += pay;
    const bonusNote = (factionPayMult > 1 || contactPayMult > 1) ? ' (faction/contact bonus)' : '';
    messages.push(`Earned ¥${pay}${bonusNote}`);

    // Experience
    char.experience += job.payExperience;
    messages.push(`Gained ${job.payExperience} XP`);

    // Reputation + Rivalry
    if (job.reputationReward) {
      const oldRep = char.reputation[job.reputationReward.faction] ?? 0;
      char.reputation[job.reputationReward.faction] = Math.min(100, oldRep + job.reputationReward.amount);
      const newRep = char.reputation[job.reputationReward.faction];
      messages.push(`${job.reputationReward.faction} reputation +${job.reputationReward.amount}`);

      // Faction rivalry
      const rivalryMsgs = applyFactionRivalry(state, job.reputationReward.faction, job.reputationReward.amount);
      messages.push(...rivalryMsgs);

      // Standing milestone check
      const standingMsgs = checkFactionStandingMilestone(state, job.reputationReward.faction, oldRep, newRep);
      messages.push(...standingMsgs);
    }

    // Skill improvement
    const skillGain = roll(1, 3);
    char.skills[primarySkill] = Math.min(100, char.skills[primarySkill] + skillGain);
    messages.push(`${primarySkill} skill +${skillGain}`);

    // Street cred (with perk bonus)
    if (state.progression) {
      state.progression.jobsCompleted++;
      const baseCred = getJobStreetCred(job.difficulty, true);
      const perkCredBonus = char.perks ? getPerkBonus(char.perks, 'cred_multiplier') : 0;
      const credResult = awardStreetCred(state, baseCred + perkCredBonus, job.name);
      messages.push(...credResult.messages);
    }

    addLogEntry(state, `Completed job: ${job.name}`, 'reward');
  } else {
    messages.push(`Job failed! (Rolled ${result.roll} + ${modifier} = ${result.total} vs ${difficulty})`);

    // Partial pay
    const partialPay = Math.floor(job.payCredits * 0.2);
    char.credits += partialPay;
    messages.push(`Received partial payment: ¥${partialPay}`);

    // Street cred (small amount for attempting)
    if (state.progression) {
      state.progression.jobsFailed++;
      const credResult = awardStreetCred(state, getJobStreetCred(job.difficulty, false), job.name);
      messages.push(...credResult.messages);
    }

    // Check risks
    for (const risk of job.risks) {
      if (chance(risk.chance * diffMod)) {
        const riskResult = processJobRisk(state, risk);
        messages.push(...riskResult.messages);
        if (riskResult.combatTriggered) combatTriggered = true;
      }
    }

    addLogEntry(state, `Failed job: ${job.name}`, 'danger');
  }

  return { success: result.success, messages, combatTriggered };
}

function processJobRisk(state: GameState, risk: JobRisk): { messages: string[]; combatTriggered: boolean } {
  const messages: string[] = [];
  let combatTriggered = false;

  switch (risk.type) {
    case 'combat':
      messages.push('You\'ve been ambushed!');
      combatTriggered = true;
      break;
    case 'arrest':
      const fine = roll(100, 500) * risk.severity;
      state.character.credits = Math.max(0, state.character.credits - fine);
      messages.push(`NCPD caught you! Fined ¥${fine}.`);
      break;
    case 'injury':
      const damage = roll(5, 15) * risk.severity;
      state.character.health = Math.max(1, state.character.health - damage);
      messages.push(`You were injured! Lost ${damage} HP.`);
      break;
    case 'reputation_loss':
      for (const faction of Object.keys(state.character.reputation)) {
        if (chance(0.3)) {
          state.character.reputation[faction] -= risk.severity * 5;
          messages.push(`Lost reputation with ${faction}.`);
        }
      }
      break;
    case 'ambush':
      const ambushDamage = roll(3, 10) * risk.severity;
      state.character.health = Math.max(1, state.character.health - ambushDamage);
      messages.push(`Ambushed on the way out! Took ${ambushDamage} damage.`);
      break;
  }

  return { messages, combatTriggered };
}

function getJobPrimarySkill(job: Job): SkillName {
  switch (job.type) {
    case 'gig': return 'streetwise';
    case 'heist': return 'stealth';
    case 'delivery': return 'driving';
    case 'assassination': return 'combat';
    case 'hacking': return 'hacking';
    case 'bodyguard': return 'combat';
    case 'theft': return 'stealth';
    case 'investigation': return 'streetwise';
    default: return 'streetwise';
  }
}

export function buyItem(char: Character, item: Item, price?: number): { success: boolean; message: string } {
  const cost = price ?? item.value;
  if (char.credits < cost) {
    return { success: false, message: 'Not enough credits.' };
  }
  char.credits -= cost;
  addItem(char, item);
  return { success: true, message: `Purchased ${item.name} for ¥${cost}.` };
}

export function sellItem(char: Character, itemId: string): { success: boolean; message: string } {
  const invItem = char.inventory.find(i => i.item.id === itemId);
  if (!invItem) {
    return { success: false, message: 'Item not found in inventory.' };
  }
  const sellPrice = Math.floor(invItem.item.value * 0.5);
  char.credits += sellPrice;
  removeItem(char, itemId);
  return { success: true, message: `Sold ${invItem.item.name} for ¥${sellPrice}.` };
}

function compareValue(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case '>=': return actual >= expected;
    case '<=': return actual <= expected;
    case '==': return actual === expected;
    case '!=': return actual !== expected;
    case '>': return actual > expected;
    case '<': return actual < expected;
    default: return false;
  }
}

export function getDailyExpenses(char: Character): number {
  let expenses = 10; // Basic living
  if (char.apartment) {
    expenses += 50; // Rent
  }
  // Augmentation maintenance
  expenses += char.augmentations.length * 5;
  return expenses;
}

export function processDailyExpenses(state: GameState): string[] {
  const messages: string[] = [];
  const expenses = getDailyExpenses(state.character);

  if (state.character.credits >= expenses) {
    state.character.credits -= expenses;
    messages.push(`Daily expenses: ¥${expenses}`);
  } else {
    // Can't afford, health penalty
    state.character.credits = 0;
    state.character.health = Math.max(1, state.character.health - 5);
    messages.push(`Can't afford daily expenses (¥${expenses}). Health deteriorating!`);
  }

  return messages;
}
